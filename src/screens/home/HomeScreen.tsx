import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { COLORS, FONT_SIZES } from "../../types";

import {
  agregarReaccion,
  crearPublicacion,
  editarPublicacion,
  eliminarPublicacion,
  obtenerMuroDepartamento,
  obtenerMuroGeneral,
  Publicacion,
} from "../../Services/publicacionesService";

import {
  cargarDepartamentos,
  Departamento,
} from "../../Services/departamentosService";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface Props {
  navigation: HomeScreenNavigationProp;
}

type TipoMuro = "general" | "departamento";

const formatearFecha = (timestamp: any) => {
  if (!timestamp?.seconds) return "";
  return new Date(timestamp.seconds * 1000).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useUser();

  const esAdmin = user?.rol === "Administrador";
  const esJefe = user?.rol === "Jefe";

  const [posts, setPosts] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(false);

  const [tipoMuro, setTipoMuro] = useState<TipoMuro>("general");

  // Deptos (admin)
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [deptoActivo, setDeptoActivo] = useState<Departamento | null>(null);

  // Modales
  const [modalVisible, setModalVisible] = useState(false);
  const [contenidoPost, setContenidoPost] = useState("");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [postEditando, setPostEditando] = useState<Publicacion | null>(null);
  const [textoEditado, setTextoEditado] = useState("");

  // Permisos de publicación
  const puedePublicar =
    user?.rol === "Administrador" ||
    (user?.rol === "Jefe" && tipoMuro === "departamento");

  // ─────────────────────────────
  // CARGAR DEPARTAMENTOS (ADMIN)
  // ─────────────────────────────
  useEffect(() => {
    if (esAdmin && user?.empresaId) {
      cargarDepartamentos(user.empresaId)
        .then((data) => {
          setDepartamentos(data);
          if (data.length > 0) setDeptoActivo(data[0]);
        })
        .catch(console.error);
    }
  }, [esAdmin, user?.empresaId]);

  // ─────────────────────────────
  // CARGAR MURO
  // ─────────────────────────────
  const cargarMuro = async () => {
    if (!user?.empresaId) return;

    setLoading(true);
    try {
      // ADMIN
      if (esAdmin) {
        if (tipoMuro === "general") {
          setPosts(await obtenerMuroGeneral(user.empresaId));
        } else if (deptoActivo) {
          setPosts(
            await obtenerMuroDepartamento(user.empresaId, deptoActivo.id)
          );
        }
        return;
      }

      // JEFE / EMPLEADO
      if (tipoMuro === "general") {
        setPosts(await obtenerMuroGeneral(user.empresaId));
        return;
      }

      if (!user.idDepartamento) {
        Alert.alert("Sin departamento asignado");
        setPosts([]);
        return;
      }

      setPosts(
        await obtenerMuroDepartamento(user.empresaId, user.idDepartamento)
      );
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las publicaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMuro();
  }, [tipoMuro, deptoActivo?.id, user?.empresaId, user?.idDepartamento]);

  // ─────────────────────────────
  // CRUD
  // ─────────────────────────────
  const crearPost = async () => {
    if (!contenidoPost.trim() || !user?.empresaId) return;

    try {
      await crearPublicacion({
        contenido: contenidoPost.trim(),
        empresaId: user.empresaId,
        tipoMuro:
          esAdmin && tipoMuro === "general" ? "general" : "departamento",
        departamentoId:
          esAdmin && tipoMuro === "departamento"
            ? deptoActivo?.id
            : user.idDepartamento,
        nombreDepartamento:
          esAdmin && tipoMuro === "departamento"
            ? deptoActivo?.nombre
            : user.nombreDepartamento,
        creadaPor: user.uid,
        nombreUsuario: user.nombre,
        rolUsuario: user.rol || "Empleado",
      });

      setContenidoPost("");
      setModalVisible(false);
      cargarMuro();
    } catch {
      Alert.alert("Error", "No se pudo crear la publicación");
    }
  };

  const puedeModificar = (post: Publicacion) =>
    post.creadaPor === user?.uid || esAdmin;

  const handleEditar = (post: Publicacion) => {
    setPostEditando(post);
    setTextoEditado(post.contenido);
    setEditModalVisible(true);
  };

  const guardarEdicion = async () => {
    if (!textoEditado.trim() || !postEditando) return;
    await editarPublicacion(postEditando.id, textoEditado.trim());
    setEditModalVisible(false);
    setPostEditando(null);
    setTextoEditado("");
    cargarMuro();
  };

  const handleEliminar = async (postId: string) => {
    await eliminarPublicacion(postId);
    cargarMuro();
  };

  const handleReaccion = async (
    postId: string,
    tipo: "me_gusta" | "importante" | "celebrar"
  ) => {
    await agregarReaccion(postId, user!.uid, user!.nombre, tipo);
    cargarMuro();
  };

  const contarReacciones = (post: Publicacion, tipo: string) =>
    post.reacciones?.filter((r) => r.tipo === tipo).length || 0;

  const miReaccion = (post: Publicacion) =>
    post.reacciones?.find((r) => r.uid === user?.uid);

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.muroTitle}>
          {tipoMuro === "general"
            ? "Muro General"
            : esAdmin
            ? deptoActivo?.nombre
            : user?.nombreDepartamento}
        </Text>
      </View>

      {/* CARRUSEL ADMIN */}
      {esAdmin && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deptosContainer}
        >
          <TouchableOpacity
            style={[
              styles.deptoButton,
              tipoMuro === "general" && styles.deptoButtonActive,
            ]}
            onPress={() => setTipoMuro("general")}
          >
            <Text
              style={[
                styles.deptoButtonText,
                tipoMuro === "general" && styles.deptoButtonTextActive,
              ]}
            >
              General
            </Text>
          </TouchableOpacity>

          {departamentos.map((d) => {
            const activo =
              tipoMuro === "departamento" && deptoActivo?.id === d.id;

            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.deptoButton, activo && styles.deptoButtonActive]}
                onPress={() => {
                  setTipoMuro("departamento");
                  setDeptoActivo(d);
                }}
              >
                <Text
                  style={[
                    styles.deptoButtonText,
                    activo && styles.deptoButtonTextActive,
                  ]}
                >
                  {d.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* TABS SIMPLES (NO ADMIN) */}
      {!esAdmin && user?.empresaId && (
        <View style={styles.simpleTabs}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              tipoMuro === "general" && styles.tabBtnActive,
            ]}
            onPress={() => setTipoMuro("general")}
          >
            <Text
              style={[
                styles.tabText,
                tipoMuro === "general" && styles.tabTextActive,
              ]}
            >
              General
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              tipoMuro === "departamento" && styles.tabBtnActive,
            ]}
            onPress={() => setTipoMuro("departamento")}
            disabled={!user?.idDepartamento}
          >
            <Text
              style={[
                styles.tabText,
                tipoMuro === "departamento" && styles.tabTextActive,
              ]}
            >
              Mi Depto
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LISTA */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={cargarMuro} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <Text style={styles.postAuthor}>{item.nombreUsuario}</Text>
            <Text style={styles.postDate}>
              {formatearFecha(item.fechaCreacion)}
            </Text>

            <Text style={styles.postContent}>{item.contenido}</Text>

            <View style={styles.reacciones}>
              {["me_gusta", "importante", "celebrar"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.reaccionBtn,
                    miReaccion(item)?.tipo === t && styles.reaccionActiva,
                  ]}
                  onPress={() => handleReaccion(item.id, t as any)}
                >
                  <Text>
                    {t === "me_gusta" ? "👍" : t === "importante" ? "⚡" : "🎉"}{" "}
                    {contarReacciones(item, t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {puedeModificar(item) && (
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEditar(item)}>
                  <MaterialIcons name="edit" size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEliminar(item.id)}>
                  <MaterialIcons name="delete" size={18} color="red" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      {/* FOOTER */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Home")}
        >
          <MaterialIcons name="home-filled" size={26} />
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
          <MaterialIcons name="assignment" size={26} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("Eventos")}
        >
          <MaterialIcons name="event" size={26} />
        </TouchableOpacity>
      </View>

      {/* MODAL CREAR */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TextInput
              multiline
              placeholder="Escribe algo..."
              value={contenidoPost}
              onChangeText={setContenidoPost}
              style={styles.input}
            />
            <TouchableOpacity onPress={crearPost}>
              <Text style={styles.publish}>Publicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL EDITAR */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TextInput
              multiline
              value={textoEditado}
              onChangeText={setTextoEditado}
              style={styles.input}
            />
            <TouchableOpacity onPress={guardarEdicion}>
              <Text style={styles.publish}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 16 },
  muroTitle: { fontSize: FONT_SIZES.large, fontWeight: "bold" },

  deptosContainer: { paddingHorizontal: 16, gap: 10 },
  deptoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  deptoButtonActive: { backgroundColor: COLORS.primary },
  deptoButtonText: { fontSize: FONT_SIZES.small },
  deptoButtonTextActive: { color: "#fff", fontWeight: "bold" },

  simpleTabs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZES.small },
  tabTextActive: { color: "#fff", fontWeight: "bold" },

  postCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  postAuthor: { fontWeight: "600" },
  postDate: { fontSize: FONT_SIZES.small, color: "#666" },
  postContent: { marginVertical: 10 },

  reacciones: { flexDirection: "row", gap: 8 },
  reaccionBtn: { padding: 6 },
  reaccionActiva: { backgroundColor: "#E3F2FD" },

  actions: { flexDirection: "row", gap: 12 },

  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
  },
  iconButton: { padding: 8 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: { width: "90%", backgroundColor: "#fff", padding: 20 },
  input: { minHeight: 100, borderWidth: 1, padding: 10 },
  publish: { textAlign: "right", marginTop: 10, color: COLORS.primary },
});
