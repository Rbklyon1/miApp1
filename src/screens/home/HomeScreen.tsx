import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { COLORS, FONT_SIZES } from "../../types/index";
import { useUser } from "../../context/UserContext";
import {
  obtenerMuroGeneral,
  crearPublicacion,
  editarPublicacion,
  eliminarPublicacion,
  agregarReaccion,
  Publicacion,
} from "../../api/publicacionesService";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const formatearFecha = (timestamp: any) => {
  if (!timestamp?.seconds) return "";
  const fecha = new Date(timestamp.seconds * 1000);
  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useUser();
  const [posts, setPosts] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [contenidoPost, setContenidoPost] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [postEditando, setPostEditando] = useState<Publicacion | null>(null);
  const [textoEditado, setTextoEditado] = useState("");

  const puedePublicar = user?.rol === "Administrador" || user?.rol === "Jefe";

  const cargarMuro = async () => {
    if (!user?.empresaId) return;

    try {
      setLoading(true);
      const data = await obtenerMuroGeneral(user.empresaId);
      setPosts(data);
    } catch (error) {
      console.error("Error al cargar muro:", error);
      Alert.alert("Error", "No se pudieron cargar las publicaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMuro();
  }, [user?.empresaId]);

  const crearPost = async () => {
    if (!contenidoPost.trim() || !user?.empresaId) {
      Alert.alert("Error", "Escribe algo antes de publicar");
      return;
    }

    try {
      await crearPublicacion({
        contenido: contenidoPost.trim(),
        empresaId: user.empresaId,
        tipoMuro: "general",
        creadaPor: user.uid,
        nombreUsuario: user.nombre,
        rolUsuario: user.rol || "Empleado",
      });

      setContenidoPost("");
      setModalVisible(false);
      Alert.alert("Éxito", "Publicación agregada al muro");
      cargarMuro();
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la publicación");
    }
  };

  const puedeModificar = (post: Publicacion) => {
    return post.creadaPor === user?.uid || user?.rol === "Administrador";
  };

  const handleEliminar = (postId: string) => {
    Alert.alert(
      "Eliminar publicación",
      "¿Seguro que deseas eliminar esta publicación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarPublicacion(postId);
              Alert.alert("Éxito", "Publicación eliminada");
              cargarMuro();
            } catch {
              Alert.alert("Error", "No se pudo eliminar");
            }
          },
        },
      ]
    );
  };

  const handleEditar = (post: Publicacion) => {
    setPostEditando(post);
    setTextoEditado(post.contenido);
    setEditModalVisible(true);
  };

  const guardarEdicion = async () => {
    if (!textoEditado.trim() || !postEditando) return;

    try {
      await editarPublicacion(postEditando.id, textoEditado.trim());
      setEditModalVisible(false);
      setPostEditando(null);
      setTextoEditado("");
      Alert.alert("Éxito", "Publicación actualizada");
      cargarMuro();
    } catch {
      Alert.alert("Error", "No se pudo editar");
    }
  };

  const handleReaccion = async (
    postId: string,
    tipo: "me_gusta" | "importante" | "celebrar"
  ) => {
    try {
      await agregarReaccion(postId, user?.uid!, user?.nombre!, tipo);
      cargarMuro();
    } catch {
      Alert.alert("Error", "No se pudo agregar la reacción");
    }
  };

  const contarReacciones = (post: Publicacion, tipo: string) => {
    return post.reacciones?.filter((r) => r.tipo === tipo).length || 0;
  };

  const miReaccion = (post: Publicacion) => {
    return post.reacciones?.find((r) => r.uid === user?.uid);
  };
useEffect(() => {
  console.log("🔥 USER CONTEXT ACTUAL:", user);
}, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      {/* Contenido principal */}
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.muroTitle}>Muro General</Text>
          <MaterialIcons name="public" size={24} color={COLORS.primary} />
        </View>

        {!user?.empresaId ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="business" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>
              Selecciona una empresa para ver el muro
            </Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={cargarMuro} />
            }
            renderItem={({ item }) => (
              <View style={styles.postCard}>
                {/* Header del post */}
                <View style={styles.postHeader}>
                  <View style={styles.postAutorInfo}>
                    <MaterialIcons
                      name="account-circle"
                      size={40}
                      color={COLORS.primary}
                    />
                    <View>
                      <Text style={styles.postAuthor}>{item.nombreUsuario}</Text>
                      <Text style={styles.postRol}>{item.rolUsuario}</Text>
                      <Text style={styles.postDate}>
                        {formatearFecha(item.fechaCreacion)}
                      </Text>
                    </View>
                  </View>

                  {puedeModificar(item) && (
                    <View style={styles.postActions}>
                      <TouchableOpacity onPress={() => handleEditar(item)}>
                        <MaterialIcons name="edit" size={20} color={COLORS.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => handleEliminar(item.id)}>
                        <MaterialIcons name="delete" size={20} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Contenido */}
                <Text style={styles.postContent}>{item.contenido}</Text>

                {/* Reacciones */}
                <View style={styles.reaccionesContainer}>
                  <TouchableOpacity
                    style={[
                      styles.reaccionButton,
                      miReaccion(item)?.tipo === "me_gusta" &&
                        styles.reaccionButtonActive,
                    ]}
                    onPress={() => handleReaccion(item.id, "me_gusta")}
                  >
                    <Text style={styles.reaccionIcon}>👍</Text>
                    <Text style={styles.reaccionCount}>
                      {contarReacciones(item, "me_gusta")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.reaccionButton,
                      miReaccion(item)?.tipo === "importante" &&
                        styles.reaccionButtonActive,
                    ]}
                    onPress={() => handleReaccion(item.id, "importante")}
                  >
                    <Text style={styles.reaccionIcon}>⚡</Text>
                    <Text style={styles.reaccionCount}>
                      {contarReacciones(item, "importante")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.reaccionButton,
                      miReaccion(item)?.tipo === "celebrar" &&
                        styles.reaccionButtonActive,
                    ]}
                    onPress={() => handleReaccion(item.id, "celebrar")}
                  >
                    <Text style={styles.reaccionIcon}>🎉</Text>
                    <Text style={styles.reaccionCount}>
                      {contarReacciones(item, "celebrar")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="announcement"
                  size={64}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyText}>No hay publicaciones todavía</Text>
                {puedePublicar && (
                  <Text style={styles.emptySubtext}>
                    Toca el botón + para crear la primera
                  </Text>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* Footer de navegación */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Home")}
        >
          <MaterialIcons name="home-filled" size={26} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setModalVisible(true)}
          disabled={!puedePublicar}
        >
          <MaterialIcons
            name="post-add"
            size={28}
            color={puedePublicar ? "#000" : "#aaa"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Tareas")}
        >
          <MaterialIcons name="assignment" size={26} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Eventos")}
        >
          <MaterialIcons name="event" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Modal crear publicación */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Nueva publicación</Text>
            <Text style={styles.modalSubtitle}>Muro General</Text>

            <TextInput
              style={styles.input}
              placeholder="¿Qué quieres compartir?"
              multiline
              value={contenidoPost}
              onChangeText={setContenidoPost}
              maxLength={500}
            />

            <Text style={styles.charCount}>{contenidoPost.length}/500</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setContenidoPost("");
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.publishButton,
                  !contenidoPost.trim() && styles.disabledButton,
                ]}
                onPress={crearPost}
                disabled={!contenidoPost.trim()}
              >
                <Text style={styles.buttonText}>Publicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal editar publicación */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Editar publicación</Text>

            <TextInput
              style={styles.input}
              multiline
              value={textoEditado}
              onChangeText={setTextoEditado}
              maxLength={500}
            />

            <Text style={styles.charCount}>{textoEditado.length}/500</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setPostEditando(null);
                  setTextoEditado("");
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.publishButton]}
                onPress={guardarEdicion}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: COLORS.surface,
    elevation: 2,
  },
  muroTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
  },
  postCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  postAutorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  postAuthor: {
    fontWeight: "600",
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
  },
  postRol: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  postDate: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  postActions: {
    flexDirection: "row",
    gap: 12,
  },
  postContent: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  reaccionesContainer: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  reaccionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  reaccionButtonActive: {
    backgroundColor: "#E3F2FD",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  reaccionIcon: {
    fontSize: 18,
  },
  reaccionCount: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.medium,
  },
  emptySubtext: {
    textAlign: "center",
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.small,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingVertical: 12,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    elevation: 8,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    marginBottom: 4,
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    fontSize: FONT_SIZES.medium,
  },
  charCount: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  publishButton: {
    backgroundColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: FONT_SIZES.medium,
  },
});

export default HomeScreen;