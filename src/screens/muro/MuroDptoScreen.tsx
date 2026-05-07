import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useUser } from "../../context/UserContext";
import { useMuroDpto } from "../../Hooks/useMuroDpto";
import { Departamento } from "../../Services/departamentosService";
import { Publicacion } from "../../Services/publicacionesService";
import { COLORS, FONT_SIZES } from "../../types/index";

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

const MuroDptoScreen: React.FC = ({ navigation }: any) => {
  const { user } = useUser();
  const muro = useMuroDpto(user);

  const [modalVisible, setModalVisible] = useState(false);
  const [contenidoPost, setContenidoPost] = useState("");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [postEditando, setPostEditando] = useState<Publicacion | null>(null);
  const [textoEditado, setTextoEditado] = useState("");

  const [modalDeptosVisible, setModalDeptosVisible] = useState(false);
  const [textosComentario, setTextosComentario] = useState<
    Record<string, string>
  >({});

  const crearPost = async () => {
    try {
      await muro.publicar(contenidoPost);

      setContenidoPost("");
      setModalVisible(false);

      Alert.alert("Éxito", "Publicación agregada al muro del departamento");
    } catch {
      Alert.alert("Error", "No se pudo crear la publicación");
    }
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
              await muro.eliminar(postId);
              Alert.alert("Éxito", "Publicación eliminada");
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
      await muro.editar(postEditando.id, textoEditado);

      setEditModalVisible(false);
      setPostEditando(null);
      setTextoEditado("");

      Alert.alert("Éxito", "Publicación actualizada");
    } catch {
      Alert.alert("Error", "No se pudo editar");
    }
  };

  const handleReaccion = async (
    postId: string,
    tipo: "me_gusta" | "importante" | "celebrar"
  ) => {
    try {
      await muro.reaccionar(postId, tipo);
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

  const handleEnviarComentario = async (postId: string) => {
    const texto = textosComentario[postId]?.trim();

    if (!texto) return;

    try {
      await muro.comentar(postId, texto);

      setTextosComentario((prev) => ({
        ...prev,
        [postId]: "",
      }));
    } catch {
      Alert.alert("Error", "No se pudo agregar el comentario");
    }
  };

  const handleEliminarComentario = (postId: string, comentarioId: string) => {
    Alert.alert("Eliminar comentario", "¿Seguro que deseas eliminarlo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await muro.eliminarComentarioPost(postId, comentarioId);
          } catch {
            Alert.alert("Error", "No se pudo eliminar el comentario");
          }
        },
      },
    ]);
  };

  const cambiarDepartamento = (depto: Departamento) => {
    muro.setDeptoSeleccionado(depto);
    setModalDeptosVisible(false);
  };
  const cerrarModalPublicacion = () => {
  setModalVisible(false);
  setContenidoPost("");
  };

  if (!muro.esAdmin && !user?.nombreDepartamento) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="business"
            size={80}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyTitle}>Sin departamento</Text>
          <Text style={styles.emptyText}>
            No tienes un departamento asignado.{"\n"}
            Contacta a tu administrador.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (muro.esAdmin && muro.departamentos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="folder-open"
            size={80}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyTitle}>No hay departamentos</Text>
          <Text style={styles.emptyText}>
            Aún no se han creado departamentos en esta empresa.{"\n"}
            Ve a Gestión de Usuarios para crear uno.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => muro.esAdmin && setModalDeptosVisible(true)}
          disabled={!muro.esAdmin}
        >
          <MaterialIcons name="business" size={24} color={COLORS.primary} />

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Muro Departamental</Text>

            <View style={styles.deptoSelector}>
              <Text style={styles.headerSubtitle}>
                {muro.departamentoActual || "Selecciona departamento"}
              </Text>

              {muro.esAdmin && (
                <MaterialIcons
                  name="expand-more"
                  size={18}
                  color={COLORS.primary}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {muro.puedePublicar && muro.departamentoActual && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={muro.posts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={muro.loading} onRefresh={muro.refetch} />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
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

              {muro.puedeModificar(item) && (
                <View style={styles.postActions}>
                  <TouchableOpacity onPress={() => handleEditar(item)}>
                    <MaterialIcons
                      name="edit"
                      size={20}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleEliminar(item.id)}>
                    <MaterialIcons
                      name="delete"
                      size={20}
                      color={COLORS.error}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.postContent}>{item.contenido}</Text>

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

            <View style={styles.comentariosContainer}>
              <View style={styles.comentariosSeparador} />

              {item.comentarios && item.comentarios.length > 0 && (
                <View style={styles.comentariosList}>
                  {item.comentarios.map((com) => (
                    <View key={com.id} style={styles.comentarioItem}>
                      <MaterialIcons
                        name="account-circle"
                        size={30}
                        color={COLORS.textSecondary}
                      />

                      <View style={styles.comentarioBurbuja}>
                        <View style={styles.comentarioHeader}>
                          <Text style={styles.comentarioAutor}>
                            {com.autorNombre}
                          </Text>

                          <Text style={styles.comentarioFecha}>
                            {new Date(com.fecha).toLocaleDateString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>

                        <Text style={styles.comentarioTexto}>{com.texto}</Text>
                      </View>

                      {(com.autorUid === user?.uid || muro.esAdmin) && (
                        <TouchableOpacity
                          onPress={() =>
                            handleEliminarComentario(item.id, com.id)
                          }
                          style={styles.comentarioEliminar}
                        >
                          <MaterialIcons
                            name="close"
                            size={16}
                            color={COLORS.textSecondary}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.nuevoComentarioRow}>
                <MaterialIcons
                  name="account-circle"
                  size={32}
                  color={COLORS.primary}
                />

                <TextInput
                  style={styles.comentarioInput}
                  placeholder="Escribe un comentario..."
                  value={textosComentario[item.id] ?? ""}
                  onChangeText={(txt) =>
                    setTextosComentario((prev) => ({
                      ...prev,
                      [item.id]: txt,
                    }))
                  }
                  multiline
                />

                <TouchableOpacity
                  style={[
                    styles.enviarComentario,
                    !textosComentario[item.id]?.trim() && { opacity: 0.4 },
                  ]}
                  onPress={() => handleEnviarComentario(item.id)}
                  disabled={!textosComentario[item.id]?.trim()}
                >
                  <MaterialIcons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
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

            <Text style={styles.emptyText}>
              No hay publicaciones en este departamento
            </Text>

            {muro.puedePublicar && (
              <Text style={styles.emptySubtext}>
                Toca el botón + para crear la primera
              </Text>
            )}
          </View>
        }
      />

      <Modal
        visible={modalDeptosVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModalPublicacion}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Seleccionar Departamento</Text>

            <FlatList
              data={muro.departamentos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.deptoItem,
                    muro.deptoSeleccionado?.id === item.id &&
                      styles.deptoItemActive,
                  ]}
                  onPress={() => cambiarDepartamento(item)}
                >
                  <MaterialIcons
                    name="folder"
                    size={24}
                    color={
                      muro.deptoSeleccionado?.id === item.id
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.deptoItemText,
                      muro.deptoSeleccionado?.id === item.id &&
                        styles.deptoItemTextActive,
                    ]}
                  >
                    {item.nombre}
                  </Text>

                  {muro.deptoSeleccionado?.id === item.id && (
                    <MaterialIcons
                      name="check"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalDeptosVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Nueva publicación</Text>
            <Text style={styles.modalSubtitle}>
              Muro de {muro.departamentoActual}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="¿Qué quieres compartir con tu equipo?"
              multiline
              value={contenidoPost}
              onChangeText={setContenidoPost}
              maxLength={500}
            />

            <Text style={styles.charCount}>{contenidoPost.length}/500</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cerrarModalPublicacion}
              >
                <Text style={[styles.buttonText, { color: COLORS.text }]}>
                  Cancelar
                </Text>
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
                <Text style={[styles.buttonText, { color: COLORS.text }]}>
                  Cancelar
                </Text>
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

      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Home")}
        >
          <MaterialIcons name="home" size={26} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("MuroDpto")}
        >
          <MaterialIcons name="business" size={26} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("TareaDpto")}
        >
          <MaterialIcons name="assignment" size={26} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("EventoDpto")}
        >
          <MaterialIcons name="event" size={26} color="#666" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
  },
  deptoSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.small,
    color: COLORS.primary,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  postCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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

  // ── Comentarios ──────────────────────────────────────────────────────────
  comentariosContainer: {
    marginTop: 4,
  },
  comentariosSeparador: {
    height: 1,
    backgroundColor: "#eee",
    marginBottom: 10,
  },
  comentariosList: {
    gap: 8,
    marginBottom: 10,
  },
  comentarioItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  comentarioBurbuja: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 10,
  },
  comentarioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  comentarioAutor: {
    fontSize: FONT_SIZES.small,
    fontWeight: "700",
    color: COLORS.text,
  },
  comentarioFecha: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  comentarioTexto: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    lineHeight: 18,
  },
  comentarioEliminar: {
    padding: 4,
    marginTop: 4,
  },
  nuevoComentarioRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  comentarioInput: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: FONT_SIZES.small,
    maxHeight: 80,
  },
  enviarComentario: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.medium,
    lineHeight: 22,
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
    maxHeight: "80%",
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
  deptoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  deptoItemActive: {
    backgroundColor: "#E3F2FD",
  },
  deptoItemText: {
    flex: 1,
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
  },
  deptoItemTextActive: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: FONT_SIZES.medium,
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

export default MuroDptoScreen;
