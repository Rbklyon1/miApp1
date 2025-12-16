import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  RefreshControl,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";
import { COLORS, FONT_SIZES } from "../../types";
import { Evento, EstadoAsistencia } from "../../types/eventos";
import {
  obtenerEventosDepartamento,
  obtenerEventosAsignadosDepartamento,
  actualizarEstadoAsistencia,
  eliminarEvento,
} from "../../api/eventosService";
import { cargarDepartamentos, Departamento } from "../../api/departamentosService";

const EventosDeptoScreen: React.FC = ({ navigation }: any) => {
  const { user } = useUser();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState<"todos" | "asignados">("todos");

  // Para administradores
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [deptoSeleccionado, setDeptoSeleccionado] = useState<string | null>(null);
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

  const cargarEventos = async () => {
    if (!user?.empresaId || !departamentoActual) return;

    try {
      setLoading(true);
      let data: Evento[];

      if (vistaActual === "todos") {
        data = await obtenerEventosDepartamento(user.empresaId, departamentoActual);
      } else {
        data = await obtenerEventosAsignadosDepartamento(
          user.uid,
          user.empresaId,
          departamentoActual
        );
      }

      setEventos(data);
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      Alert.alert("Error", "No se pudieron cargar los eventos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (departamentoActual) {
      cargarEventos();
    }
  }, [user?.empresaId, departamentoActual, vistaActual]);

  const cambiarDepartamento = (depto: Departamento) => {
    setDeptoSeleccionado(depto.nombre);
    setModalDeptosVisible(false);
  };

  const handleCambiarAsistencia = async (
    eventoId: string,
    nuevoEstado: EstadoAsistencia
  ) => {
    try {
      await actualizarEstadoAsistencia(eventoId, user?.uid || "", nuevoEstado);
      Alert.alert("Éxito", "Tu respuesta ha sido registrada");
      cargarEventos();
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar tu respuesta");
    }
  };

  const handleEliminar = (eventoId: string) => {
    Alert.alert(
      "Eliminar evento",
      "¿Estás seguro de que deseas eliminar este evento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarEvento(eventoId);
              Alert.alert("Éxito", "Evento eliminado");
              cargarEventos();
            } catch {
              Alert.alert("Error", "No se pudo eliminar el evento");
            }
          },
        },
      ]
    );
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatearHora = (hora: string) => {
    return hora;
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "Reunión":
        return "people";
      case "Capacitación":
        return "school";
      case "Evaluación":
        return "assessment";
      case "Social":
        return "celebration";
      default:
        return "event";
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Reunión":
        return COLORS.primary;
      case "Capacitación":
        return COLORS.success;
      case "Evaluación":
        return COLORS.warning;
      case "Social":
        return "#9C27B0";
      default:
        return COLORS.textSecondary;
    }
  };

  const getEstadoAsistenciaColor = (estado: EstadoAsistencia) => {
    switch (estado) {
      case "Confirmado":
        return COLORS.success;
      case "Rechazado":
        return COLORS.error;
      case "Asistió":
        return COLORS.primary;
      case "No Asistió":
        return COLORS.textSecondary;
      default:
        return COLORS.warning;
    }
  };

  const miEstadoAsistencia = (evento: Evento) => {
    return evento.asistentes.find((a) => a.uid === user?.uid)?.estadoAsistencia;
  };

  const esEventoPasado = (evento: Evento) => {
    return new Date(evento.fechaInicio) < new Date();
  };

  // Vista para usuarios sin departamento
  if (!esAdmin && !user?.nombreDepartamento) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event" size={80} color={COLORS.textSecondary} />
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
          <MaterialIcons name="folder-open" size={80} color={COLORS.textSecondary} />
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
          <MaterialIcons name="event" size={24} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Eventos Departamento</Text>
            <View style={styles.deptoSelector}>
              <Text style={styles.headerSubtitle}>
                {departamentoActual || "Selecciona departamento"}
              </Text>
              {esAdmin && (
                <MaterialIcons name="expand-more" size={18} color={COLORS.primary} />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {puedeCrear && departamentoActual && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("CrearEvento")}
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
            vistaActual === "todos" && styles.filterButtonActive,
          ]}
          onPress={() => setVistaActual("todos")}
        >
          <Text
            style={[
              styles.filterButtonText,
              vistaActual === "todos" && styles.filterButtonTextActive,
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            vistaActual === "asignados" && styles.filterButtonActive,
          ]}
          onPress={() => setVistaActual("asignados")}
        >
          <Text
            style={[
              styles.filterButtonText,
              vistaActual === "asignados" && styles.filterButtonTextActive,
            ]}
          >
            Mis Eventos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de eventos */}
      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={cargarEventos} />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.eventoCard}
            onPress={() =>
              navigation.navigate("DetalleEvento", { eventoId: item.id })
            }
          >
            {/* Header del evento */}
            <View style={styles.eventoHeader}>
              <View style={styles.eventoHeaderLeft}>
                <View
                  style={[
                    styles.tipoIconContainer,
                    { backgroundColor: getTipoColor(item.tipo) },
                  ]}
                >
                  <MaterialIcons
                    name={getTipoIcon(item.tipo)}
                    size={24}
                    color="#fff"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.eventoTitle} numberOfLines={2}>
                    {item.titulo}
                  </Text>
                  <Text style={styles.eventoCreador}>
                    Por: {item.nombreCreador}
                  </Text>
                </View>
              </View>

              {(item.creadoPor === user?.uid || esAdmin) && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleEliminar(item.id)}
                >
                  <MaterialIcons name="delete" size={20} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>

            {/* Fecha y hora */}
            <View style={styles.fechaContainer}>
              <View style={styles.fechaItem}>
                <MaterialIcons name="event" size={16} color={COLORS.textSecondary} />
                <Text style={styles.fechaText}>
                  {formatearFecha(item.fechaInicio)}
                </Text>
              </View>

              <View style={styles.fechaItem}>
                <MaterialIcons name="access-time" size={16} color={COLORS.textSecondary} />
                <Text style={styles.fechaText}>
                  {formatearHora(item.horaInicio)}
                </Text>
              </View>
            </View>

            {/* Ubicación */}
            <View style={styles.ubicacionContainer}>
              <MaterialIcons
                name={item.esVirtual ? "videocam" : "place"}
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.ubicacionText}>
                {item.esVirtual ? "Evento virtual" : item.ubicacion || "Sin ubicación"}
              </Text>
            </View>

            {/* Asistentes */}
            <View style={styles.asistentesContainer}>
              <MaterialIcons name="people" size={16} color={COLORS.textSecondary} />
              <Text style={styles.asistentesText}>
                {item.asistentes.length} asistente{item.asistentes.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {/* Estado de asistencia del usuario */}
            {item.asistentes.some((a) => a.uid === user?.uid) && (
              <View style={styles.estadoAsistenciaContainer}>
                <View
                  style={[
                    styles.estadoAsistenciaBadge,
                    {
                      backgroundColor: getEstadoAsistenciaColor(
                        miEstadoAsistencia(item) || "Pendiente"
                      ),
                    },
                  ]}
                >
                  <Text style={styles.estadoAsistenciaText}>
                    Tu respuesta: {miEstadoAsistencia(item) || "Pendiente"}
                  </Text>
                </View>

                {/* Botones de respuesta (solo si está pendiente y no es pasado) */}
                {miEstadoAsistencia(item) === "Pendiente" &&
                  !esEventoPasado(item) && (
                    <View style={styles.respuestaBotones}>
                      <TouchableOpacity
                        style={[styles.respuestaButton, styles.confirmarButton]}
                        onPress={() =>
                          handleCambiarAsistencia(item.id, "Confirmado")
                        }
                      >
                        <MaterialIcons name="check" size={16} color="#fff" />
                        <Text style={styles.respuestaButtonText}>Confirmar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.respuestaButton, styles.rechazarButton]}
                        onPress={() =>
                          handleCambiarAsistencia(item.id, "Rechazado")
                        }
                      >
                        <MaterialIcons name="close" size={16} color="#fff" />
                        <Text style={styles.respuestaButtonText}>Rechazar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>
              No hay eventos en este departamento
            </Text>
            {puedeCrear && (
              <Text style={styles.emptySubtext}>
                Toca el botón + para crear el primero
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
                      deptoSeleccionado === item.nombre && styles.deptoItemTextActive,
                    ]}
                  >
                    {item.nombre}
                  </Text>
                  {deptoSeleccionado === item.nombre && (
                    <MaterialIcons name="check" size={24} color={COLORS.primary} />
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
          <MaterialIcons name="assignment" size={26} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate("EventoDpto")}
        >
          <MaterialIcons name="event" size={26} color={COLORS.primary} />
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  eventoCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  eventoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  eventoHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  tipoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  eventoTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
  },
  eventoCreador: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
  fechaContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  fechaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fechaText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
  },
  ubicacionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  ubicacionText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    flex: 1,
  },
  asistentesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  asistentesText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  estadoAsistenciaContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  estadoAsistenciaBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  estadoAsistenciaText: {
    fontSize: FONT_SIZES.small,
    color: "#fff",
    fontWeight: "600",
  },
  respuestaBotones: {
    flexDirection: "row",
    gap: 8,
  },
  respuestaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmarButton: {
    backgroundColor: COLORS.success,
  },
  rechazarButton: {
    backgroundColor: COLORS.error,
  },
  respuestaButtonText: {
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

export default EventosDeptoScreen;