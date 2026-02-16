import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import {
  cargarDepartamentos,
  Departamento,
} from "../../Services/departamentosService";
import {
  actualizarEstadoTarea,
  eliminarTarea,
  obtenerTareasAsignadasDepartamento,
  obtenerTareasDepartamento,
} from "../../Services/tareasService";
import { COLORS, FONT_SIZES } from "../../types";
import { EstadoTarea, Tarea } from "../../types/tareas";

const TareasDeptoScreen: React.FC = ({ navigation }: any) => {
  const { user } = useUser();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<EstadoTarea | "Todas">(
    "Todas"
  );
  const [vistaActual, setVistaActual] = useState<"todas" | "asignadas">(
    "todas"
  );

  // Para administradores
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [deptoSeleccionado, setDeptoSeleccionado] = useState<string | null>(
    null
  );
  const [modalDeptosVisible, setModalDeptosVisible] = useState(false);

  const esAdmin = user?.rol === "Administrador";
  const esJefe = user?.rol === "Jefe";
  const puedeCrear = esAdmin || esJefe;

  const departamentoActual = esAdmin
    ? deptoSeleccionado
    : user?.nombreDepartamento;

  // Cargar departamentos si es admin
  useEffect(() => {
    if (esAdmin && user?.empresaId) {
      cargarDepartamentos(user.empresaId)
        .then((deptos) => {
          setDepartamentos(deptos);
          if (deptos.length > 0 && !deptoSeleccionado) {
            setDeptoSeleccionado(deptos[0].nombre);
          }
        })
        .catch(() => {
          Alert.alert("Error", "No se pudieron cargar los departamentos");
        });
    }
  }, [esAdmin, user?.empresaId]);

  const cargarTareas = async () => {
    if (!user?.empresaId || !departamentoActual) return;

    try {
      setLoading(true);
      let data: Tarea[];

      if (vistaActual === "todas") {
        data = await obtenerTareasDepartamento(
          user.empresaId,
          departamentoActual
        );
      } else {
        data = await obtenerTareasAsignadasDepartamento(
          user.uid,
          user.empresaId,
          departamentoActual
        );
      }

      setTareas(data);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
      Alert.alert("Error", "No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (departamentoActual) {
      cargarTareas();
    }
  }, [user?.empresaId, departamentoActual, vistaActual]);

  const cambiarDepartamento = (depto: Departamento) => {
    setDeptoSeleccionado(depto.nombre);
    setModalDeptosVisible(false);
  };

  const handleCambiarEstado = async (
    tareaId: string,
    nuevoEstado: EstadoTarea
  ) => {
    try {
      await actualizarEstadoTarea(tareaId, nuevoEstado);
      Alert.alert("Éxito", "Estado actualizado");
      cargarTareas();
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el estado");
    }
  };

  const handleEliminar = (tareaId: string) => {
    Alert.alert(
      "Eliminar tarea",
      "¿Estás seguro de que deseas eliminar esta tarea?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarTarea(tareaId);
              Alert.alert("Éxito", "Tarea eliminada");
              cargarTareas();
            } catch {
              Alert.alert("Error", "No se pudo eliminar la tarea");
            }
          },
        },
      ]
    );
  };

  const tareasFiltradas = tareas.filter((t) =>
    filtroEstado === "Todas" ? true : t.estado === filtroEstado
  );

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "Urgente":
        return COLORS.error;
      case "Alta":
        return COLORS.warning;
      case "Media":
        return COLORS.primary;
      default:
        return COLORS.textSecondary;
    }
  };

  const getEstadoColor = (estado: EstadoTarea) => {
    switch (estado) {
      case "Completada":
        return COLORS.success;
      case "En Progreso":
        return COLORS.primary;
      case "Cancelada":
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  // Vista para usuarios sin departamento
  if (!esAdmin && !user?.nombreDepartamento) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="assignment"
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

  // Vista para admin sin departamentos
  if (esAdmin && departamentos.length === 0) {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => esAdmin && setModalDeptosVisible(true)}
          disabled={!esAdmin}
        >
          <MaterialIcons name="assignment" size={24} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Tareas Departamento</Text>
            <View style={styles.deptoSelector}>
              <Text style={styles.headerSubtitle}>
                {departamentoActual || "Selecciona departamento"}
              </Text>
              {esAdmin && (
                <MaterialIcons
                  name="expand-more"
                  size={18}
                  color={COLORS.primary}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {puedeCrear && departamentoActual && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("CrearTarea")}
          >
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros de vista */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            vistaActual === "todas" && styles.filterButtonActive,
          ]}
          onPress={() => setVistaActual("todas")}
        >
          <Text
            style={[
              styles.filterButtonText,
              vistaActual === "todas" && styles.filterButtonTextActive,
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            vistaActual === "asignadas" && styles.filterButtonActive,
          ]}
          onPress={() => setVistaActual("asignadas")}
        >
          <Text
            style={[
              styles.filterButtonText,
              vistaActual === "asignadas" && styles.filterButtonTextActive,
            ]}
          >
            Mis Tareas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtros de estado */}
      <View style={styles.estadoFilterContainer}>
        {["Todas", "Pendiente", "En Progreso", "Completada"].map((estado) => (
          <TouchableOpacity
            key={estado}
            style={[
              styles.estadoChip,
              filtroEstado === estado && styles.estadoChipActive,
            ]}
            onPress={() => setFiltroEstado(estado as EstadoTarea | "Todas")}
          >
            <Text
              style={[
                styles.estadoChipText,
                filtroEstado === estado && styles.estadoChipTextActive,
              ]}
            >
              {estado}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de tareas */}
      <FlatList
        data={tareasFiltradas}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={cargarTareas} />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tareaCard}
            onPress={() =>
              navigation.navigate("DetalleTarea", { tareaId: item.id })
            }
          >
            {/* Header de la tarea */}
            <View style={styles.tareaHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tareaTitle} numberOfLines={2}>
                  {item.titulo}
                </Text>
                <Text style={styles.tareaCreador}>
                  Por: {item.nombreCreador}
                </Text>
              </View>

              {(item.creadaPor === user?.uid || esAdmin) && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleEliminar(item.id)}
                >
                  <MaterialIcons name="delete" size={20} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>

            {/* Descripción */}
            {item.descripcion && (
              <Text style={styles.tareaDescripcion} numberOfLines={2}>
                {item.descripcion}
              </Text>
            )}

            {/* Asignados */}
            <View style={styles.asignadosContainer}>
              <MaterialIcons
                name="people"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.asignadosText}>
                {item.nombresAsignados.join(", ")}
              </Text>
            </View>

            {/* Badges */}
            <View style={styles.badgesContainer}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: getPrioridadColor(item.prioridad) },
                ]}
              >
                <Text style={styles.badgeText}>{item.prioridad}</Text>
              </View>

              <View
                style={[
                  styles.badge,
                  { backgroundColor: getEstadoColor(item.estado) },
                ]}
              >
                <Text style={styles.badgeText}>{item.estado}</Text>
              </View>

              {item.fechaVencimiento && (
                <View style={styles.fechaBadge}>
                  <MaterialIcons
                    name="event"
                    size={14}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.fechaText}>
                    {new Date(item.fechaVencimiento).toLocaleDateString(
                      "es-MX"
                    )}
                  </Text>
                </View>
              )}
            </View>

            {/* Cambiar estado (solo si está asignada al usuario o es admin) */}
            {(item.asignadoA.includes(user?.uid || "") || esAdmin) &&
              item.estado !== "Completada" && (
                <View style={styles.accionesContainer}>
                  {item.estado === "Pendiente" && (
                    <TouchableOpacity
                      style={styles.accionButton}
                      onPress={() =>
                        handleCambiarEstado(item.id, "En Progreso")
                      }
                    >
                      <MaterialIcons name="play-arrow" size={16} color="#fff" />
                      <Text style={styles.accionButtonText}>Iniciar</Text>
                    </TouchableOpacity>
                  )}

                  {item.estado === "En Progreso" && (
                    <TouchableOpacity
                      style={[
                        styles.accionButton,
                        { backgroundColor: COLORS.success },
                      ]}
                      onPress={() => handleCambiarEstado(item.id, "Completada")}
                    >
                      <MaterialIcons name="check" size={16} color="#fff" />
                      <Text style={styles.accionButtonText}>Completar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="assignment"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>
              No hay tareas en este departamento
            </Text>
            {puedeCrear && (
              <Text style={styles.emptySubtext}>
                Toca el botón + para crear la primera
              </Text>
            )}
          </View>
        }
      />

      {/* Modal selector de departamentos */}
      <Modal
        visible={modalDeptosVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalDeptosVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Seleccionar Departamento</Text>

            <FlatList
              data={departamentos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.deptoItem,
                    deptoSeleccionado === item.nombre && styles.deptoItemActive,
                  ]}
                  onPress={() => cambiarDepartamento(item)}
                >
                  <MaterialIcons
                    name="folder"
                    size={24}
                    color={
                      deptoSeleccionado === item.nombre
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.deptoItemText,
                      deptoSeleccionado === item.nombre &&
                        styles.deptoItemTextActive,
                    ]}
                  >
                    {item.nombre}
                  </Text>
                  {deptoSeleccionado === item.nombre && (
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

      {/* Footer de navegación */}
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
          <MaterialIcons name="business" size={26} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("TareaDpto")}
        >
          <MaterialIcons name="assignment" size={26} color={COLORS.primary} />
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
  filterContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  estadoFilterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  estadoChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  estadoChipActive: {
    backgroundColor: COLORS.primary,
  },
  estadoChipText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
  },
  estadoChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  tareaCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  tareaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tareaTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
  },
  tareaCreador: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
  tareaDescripcion: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 18,
  },
  asignadosContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  asignadosText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: FONT_SIZES.small,
    color: "#fff",
    fontWeight: "600",
  },
  fechaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  fechaText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  accionesContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  accionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  accionButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.small,
    fontWeight: "600",
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
    marginBottom: 16,
    color: COLORS.text,
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
});

export default TareasDeptoScreen;
