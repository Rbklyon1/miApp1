import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";
import { COLORS, FONT_SIZES } from "../../types";
import { useGestionUsuarios } from "../../Hooks/useGestionUsuarios";

const GestionUsuariosScreen: React.FC = () => {
  const { user, recargarUsuario } = useUser();

  const {
    usuarios,
    loading,
    departamentos,

    modalDeptoVisible,
    modalCrearDeptoVisible,
    usuarioSeleccionado,

    nombreDepto,
    setNombreDepto,
    creandoDepto,

    esAdmin,

    cargarUsuarios,
    cambiarRol,
    eliminarUsuario,
    abrirSelectorDepto,
    asignarDepartamento,
    quitarDepartamento,
    abrirModalCrearDepto,
    crearDepto,
    cerrarModalDepto,
    cerrarModalCrearDepto,
  } = useGestionUsuarios(user, recargarUsuario);

  const renderUsuario = ({ item }: any) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nombre}</Text>
        <Text style={styles.userEmail}>{item.correo}</Text>
        <Text style={styles.userRole}>Rol: {item.rol}</Text>
        <Text style={styles.userDepto}>
          Departamento: {item.nombreDepartamento || "Sin departamento"}
        </Text>
      </View>

      <View style={styles.actions}>
        {esAdmin && item.uid !== user?.uid && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => cambiarRol(item)}
            >
              <MaterialIcons name="swap-horiz" size={22} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => abrirSelectorDepto(item)}
            >
              <MaterialIcons name="business" size={22} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => eliminarUsuario(item)}
            >
              <MaterialIcons name="delete" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Usuarios</Text>

        {esAdmin && (
          <TouchableOpacity
            style={styles.createDeptoButton}
            onPress={abrirModalCrearDepto}
          >
            <MaterialIcons name="add-business" size={20} color="#fff" />
            <Text style={styles.createDeptoText}>Crear depto</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.uid}
        renderItem={renderUsuario}
        refreshing={loading}
        onRefresh={cargarUsuarios}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="people"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No hay usuarios registrados</Text>
          </View>
        }
      />

      <Modal
        visible={modalDeptoVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModalDepto}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Asignar departamento
            </Text>

            <Text style={styles.modalSubtitle}>
              Usuario: {usuarioSeleccionado?.nombre}
            </Text>

            <FlatList
              data={departamentos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.deptoItem}
                  onPress={() => asignarDepartamento(item)}
                >
                  <MaterialIcons
                    name="folder"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text style={styles.deptoText}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No hay departamentos creados
                </Text>
              }
            />

            {usuarioSeleccionado?.nombreDepartamento && (
              <TouchableOpacity
                style={styles.removeDeptoButton}
                onPress={quitarDepartamento}
              >
                <Text style={styles.removeDeptoText}>
                  Quitar departamento
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={cerrarModalDepto}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalCrearDeptoVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModalCrearDepto}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Crear departamento</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del departamento"
              value={nombreDepto}
              onChangeText={setNombreDepto}
              editable={!creandoDepto}
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                creandoDepto && styles.buttonDisabled,
              ]}
              onPress={crearDepto}
              disabled={creandoDepto}
            >
              {creandoDepto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={cerrarModalCrearDepto}
            >
              <Text style={styles.closeButtonText}>Cancelar</Text>
            </TouchableOpacity>
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
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.medium,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  title: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
  },
  createDeptoButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  createDeptoText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: FONT_SIZES.small,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
  },
  userEmail: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  userRole: {
    fontSize: FONT_SIZES.small,
    color: COLORS.primary,
    marginTop: 4,
  },
  userDepto: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actions: {
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.medium,
    marginTop: 10,
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
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  deptoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 10,
  },
  deptoText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 15,
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  removeDeptoButton: {
    backgroundColor: COLORS.error,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  removeDeptoText: {
    color: "#fff",
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#eee",
  },
  closeButtonText: {
    color: COLORS.text,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default GestionUsuariosScreen;