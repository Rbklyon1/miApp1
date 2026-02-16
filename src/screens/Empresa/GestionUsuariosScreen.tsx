import { MaterialIcons } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import {
  cargarDepartamentos,
  crearDepartamento,
  Departamento,
} from "../../Services/departamentosService";
import {
  actualizarRolUsuario,
  eliminarUsuarioDeEmpresa,
  obtenerUsuariosDeEmpresa,
} from "../../Services/empresaService";
import { db } from "../../Services/firebaseConfig";
import { COLORS, FONT_SIZES } from "../../types";

type UsuarioItem = {
  uid: string;
  nombre: string;
  correo: string;
  rol: string;
  idDepartamento?: string;
  nombreDepartamento?: string;
};

const GestionUsuariosScreen: React.FC = () => {
  const { user, recargarUsuario } = useUser();

  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // Modales
  const [modalDeptoVisible, setModalDeptoVisible] = useState(false);
  const [modalCrearDeptoVisible, setModalCrearDeptoVisible] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<UsuarioItem | null>(null);
  const [nombreDepto, setNombreDepto] = useState("");
  const [creandoDepto, setCreandoDepto] = useState(false);

  const empresaActiva = useMemo(
    () => user?.empresaSeleccionada || user?.empresaId || null,
    [user?.empresaSeleccionada, user?.empresaId]
  );

  const esAdmin = user?.rol === "Administrador";

  useEffect(() => {
    if (empresaActiva) {
      cargarUsuarios();
      obtenerDeptos();
    }
  }, [empresaActiva]);

  const obtenerDeptos = async () => {
    if (!empresaActiva) return;

    try {
      const data = await cargarDepartamentos(empresaActiva);
      setDepartamentos(data);
      console.log("✅ Departamentos cargados:", data.length);
    } catch (error) {
      console.error("❌ Error cargando departamentos:", error);
      setDepartamentos([]);
    }
  };

  const cargarUsuarios = async () => {
    if (!empresaActiva) return;

    try {
      setLoading(true);
      const data = await obtenerUsuariosDeEmpresa(empresaActiva);

      setUsuarios(
        data.map((u) => ({
          uid: u.uid,
          nombre: u.nombre,
          correo: u.correo,
          rol: u.rol,
          idDepartamento: (u as any).idDepartamento,
          nombreDepartamento: (u as any).nombreDepartamento,
        }))
      );
    } catch (error) {
      console.error("❌ Error cargando usuarios:", error);
      Alert.alert("Error", "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarRol = (usuario: UsuarioItem) => {
    const nuevoRol = usuario.rol === "Empleado" ? "Jefe" : "Empleado";
    Alert.alert(
      "Cambiar rol",
      `¿Deseas cambiar el rol de ${usuario.nombre} a ${nuevoRol}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await actualizarRolUsuario(usuario.uid, nuevoRol);
              await cargarUsuarios();
              Alert.alert("Éxito", "Rol actualizado correctamente");
            } catch {
              Alert.alert("Error", "No se pudo actualizar el rol");
            }
          },
        },
      ]
    );
  };

  const handleEliminar = (usuario: UsuarioItem) => {
    Alert.alert(
      "Eliminar usuario",
      `¿Deseas eliminar a ${usuario.nombre} de esta empresa?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarUsuarioDeEmpresa(usuario.uid);
              await cargarUsuarios();
              Alert.alert("Éxito", "Usuario eliminado");
            } catch {
              Alert.alert("Error", "No se pudo eliminar el usuario");
            }
          },
        },
      ]
    );
  };

  const abrirSelectorDepto = (usuario: UsuarioItem) => {
    if (!esAdmin) {
      Alert.alert(
        "Sin permiso",
        "Solo un Administrador puede asignar departamentos."
      );
      return;
    }
    setUsuarioSeleccionado(usuario);
    setModalDeptoVisible(true);
  };

  const asignarDepartamento = async (depto: Departamento) => {
    if (!usuarioSeleccionado || !empresaActiva) {
      console.log("❌ Faltan datos:", { usuarioSeleccionado, empresaActiva });
      return;
    }

    const uid = usuarioSeleccionado.uid;
    console.log("🟦 Voy a asignar depto:", {
      uid,
      deptoId: depto.id,
      deptoNombre: depto.nombre,
    });

    try {
      const refUsuario = doc(db, "Usuarios", uid);

      // 1) Intentar escribir
      await updateDoc(refUsuario, {
        idDepartamento: depto.id,
        nombreDepartamento: depto.nombre,
      });

      console.log("✅ updateDoc OK");

      // 2) Leer inmediatamente para confirmar que sí quedó guardado
      const { getDoc } = await import("firebase/firestore");
      const snap = await getDoc(refUsuario);

      console.log("📌 Documento existe:", snap.exists());
      console.log("📌 Data después de update:", snap.data());

      Alert.alert("OK", "Asignado. Revisa consola y Firestore.");

      // 3) Recargar contexto si aplica
      if (uid === user?.uid) {
        await recargarUsuario(uid);
        console.log("✅ recargarUsuario OK");
      }

      setModalDeptoVisible(false);
      setUsuarioSeleccionado(null);
    } catch (error: any) {
      console.error("❌ ERROR updateDoc:", error?.message ?? error);
      Alert.alert("Error", error?.message ?? "No se pudo asignar");
    }
  };

  const quitarDepartamento = async () => {
    if (!usuarioSeleccionado) return;

    try {
      await updateDoc(doc(db, "Usuarios", usuarioSeleccionado.uid), {
        idDepartamento: null,
        nombreDepartamento: null,
      });

      setUsuarios((prev) =>
        prev.map((u) =>
          u.uid === usuarioSeleccionado.uid
            ? { ...u, idDepartamento: undefined, nombreDepartamento: undefined }
            : u
        )
      );

      if (usuarioSeleccionado.uid === user?.uid) {
        await recargarUsuario(usuarioSeleccionado.uid);
      }

      setModalDeptoVisible(false);
      setUsuarioSeleccionado(null);
      Alert.alert("Listo", "Departamento removido");
    } catch (error) {
      console.error("❌ Error quitando departamento:", error);
      Alert.alert("Error", "No se pudo remover el departamento.");
    }
  };

  const abrirModalCrearDepto = () => {
    setNombreDepto("");
    setModalCrearDeptoVisible(true);
  };

  const handleCrearDepartamento = async () => {
    if (!nombreDepto.trim() || !empresaActiva) {
      Alert.alert("Error", "Escribe un nombre válido");
      return;
    }

    setCreandoDepto(true);
    try {
      await crearDepartamento(empresaActiva, nombreDepto.trim());
      await obtenerDeptos();

      setModalCrearDeptoVisible(false);
      setNombreDepto("");
      Alert.alert("Éxito", "Departamento creado correctamente");
    } catch (error) {
      console.error("❌ Error al crear departamento:", error);
      Alert.alert("Error", "No se pudo crear el departamento");
    } finally {
      setCreandoDepto(false);
    }
  };
  useEffect(() => {
    console.log("🔥 USER CONTEXT ACTUAL:", user);
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios de la Empresa</Text>

        {esAdmin && (
          <TouchableOpacity
            style={styles.crearDeptoButton}
            onPress={abrirModalCrearDepto}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.crearDeptoText}>Nuevo Depto</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info de departamentos */}
      {esAdmin && (
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>
            {departamentos.length} departamento
            {departamentos.length !== 1 ? "s" : ""} creado
            {departamentos.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.uid}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={cargarUsuarios} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.name}>{item.nombre}</Text>
              <Text style={styles.email}>{item.correo}</Text>
              <Text style={styles.rol}>Rol: {item.rol}</Text>

              {/* Botón Departamento */}
              {item.rol !== "Administrador" && (
                <TouchableOpacity
                  style={[
                    styles.deptoPill,
                    !esAdmin && styles.deptoPillDisabled,
                  ]}
                  onPress={() => abrirSelectorDepto(item)}
                  disabled={!esAdmin}
                >
                  <MaterialIcons
                    name="apartment"
                    size={16}
                    color={esAdmin ? COLORS.primary : "#999"}
                  />
                  <Text
                    style={[
                      styles.deptoPillText,
                      !esAdmin && { color: "#999" },
                    ]}
                  >
                    {item.nombreDepartamento || "Sin departamento"}
                  </Text>
                  {esAdmin && (
                    <MaterialIcons
                      name="expand-more"
                      size={18}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>

            {item.rol !== "Administrador" && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCambiarRol(item)}
                >
                  <MaterialIcons name="swap-horiz" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: COLORS.error },
                  ]}
                  onPress={() => handleEliminar(item)}
                >
                  <MaterialIcons name="delete" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="people"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>
              No hay usuarios en esta empresa
            </Text>
          </View>
        }
      />

      {/* Modal Selector de Departamento */}
      <Modal
        visible={modalDeptoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalDeptoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Asignar departamento</Text>
            <Text style={styles.modalSubtitle}>
              Usuario: {usuarioSeleccionado?.nombre}
            </Text>

            {departamentos.length === 0 ? (
              <View style={styles.emptyDeptos}>
                <MaterialIcons
                  name="folder-open"
                  size={48}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyDeptosText}>
                  No hay departamentos creados.
                </Text>
                <TouchableOpacity
                  style={styles.crearDesdeModalBtn}
                  onPress={() => {
                    setModalDeptoVisible(false);
                    abrirModalCrearDepto();
                  }}
                >
                  <Text style={styles.crearDesdeModalText}>
                    Crear departamento
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={departamentos}
                keyExtractor={(d) => d.id}
                style={styles.deptosList}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.deptoItem}
                    onPress={() => asignarDepartamento(item)}
                  >
                    <MaterialIcons
                      name="folder"
                      size={20}
                      color={COLORS.primary}
                    />
                    <Text style={styles.deptoItemText}>{item.nombre}</Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color="#999"
                    />
                  </Pressable>
                )}
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerBtn, { backgroundColor: "#f0f0f0" }]}
                onPress={() => {
                  setModalDeptoVisible(false);
                  setUsuarioSeleccionado(null);
                }}
              >
                <Text style={[styles.footerBtnText, { color: COLORS.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              {departamentos.length > 0 && (
                <TouchableOpacity
                  style={[styles.footerBtn, { backgroundColor: COLORS.error }]}
                  onPress={quitarDepartamento}
                >
                  <Text style={styles.footerBtnText}>Quitar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Crear Departamento */}
      <Modal
        visible={modalCrearDeptoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCrearDeptoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Crear Departamento</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del departamento"
              value={nombreDepto}
              onChangeText={setNombreDepto}
              maxLength={50}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerBtn, { backgroundColor: "#f0f0f0" }]}
                onPress={() => {
                  setModalCrearDeptoVisible(false);
                  setNombreDepto("");
                }}
                disabled={creandoDepto}
              >
                <Text style={[styles.footerBtnText, { color: COLORS.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.footerBtn,
                  { backgroundColor: COLORS.primary },
                  creandoDepto && { opacity: 0.6 },
                ]}
                onPress={handleCrearDepartamento}
                disabled={creandoDepto || !nombreDepto.trim()}
              >
                <Text style={styles.footerBtnText}>
                  {creandoDepto ? "Creando..." : "Crear"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "bold",
  },
  crearDeptoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  crearDeptoText: {
    color: "#fff",
    fontSize: FONT_SIZES.small,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  infoText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  name: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  email: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rol: {
    fontSize: FONT_SIZES.small,
    marginTop: 5,
    color: COLORS.text,
  },
  deptoPill: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  deptoPillDisabled: {
    backgroundColor: "#f5f5f5",
  },
  deptoPillText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.primary,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
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
  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginTop: 15,
    fontSize: FONT_SIZES.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  deptosList: {
    maxHeight: 300,
  },
  deptoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  deptoItemText: {
    flex: 1,
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
  },
  emptyDeptos: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyDeptosText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    marginTop: 15,
    marginBottom: 20,
  },
  crearDesdeModalBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  crearDesdeModalText: {
    color: "#fff",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: FONT_SIZES.medium,
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    justifyContent: "flex-end",
  },
  footerBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  footerBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: FONT_SIZES.medium,
  },
});

export default GestionUsuariosScreen;
