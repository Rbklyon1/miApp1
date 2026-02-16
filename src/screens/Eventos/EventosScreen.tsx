import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import {
  obtenerEventosAsignados,
  obtenerEventosCreadosPor,
  obtenerEventosDeEmpresa,
} from "../../Services/eventosService";
import { Evento } from "../../types/eventos";
import { COLORS, FONT_SIZES } from "../../types/index";

type VistaFiltro = "todos" | "asignados" | "creados";

const EventosScreen: React.FC = ({ navigation }: any) => {
  const { user } = useUser();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState<VistaFiltro>("asignados");

  const esAdminOJefe = user?.rol === "Administrador" || user?.rol === "Jefe";

  useEffect(() => {
    if (user?.empresaSeleccionada) {
      cargarEventos();
    }
  }, [user?.empresaSeleccionada, vistaActual]);

  const cargarEventos = useCallback(async () => {
    if (!user?.empresaSeleccionada) return;

    setLoading(true);
    try {
      let data: Evento[] = [];

      switch (vistaActual) {
        case "todos":
          data = await obtenerEventosDeEmpresa(user.empresaSeleccionada);
          break;
        case "asignados":
          data = await obtenerEventosAsignados(
            user.uid,
            user.empresaSeleccionada
          );
          break;
        case "creados":
          data = await obtenerEventosCreadosPor(
            user.uid,
            user.empresaSeleccionada
          );
          break;
      }

      setEventos(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los eventos");
    } finally {
      setLoading(false);
    }
  }, [user?.empresaSeleccionada, user?.uid, vistaActual]);

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const esEventoPasado = (fecha: string) => {
    return new Date(fecha) < new Date();
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Reunión":
        return "#2196F3";
      case "Capacitación":
        return "#9C27B0";
      case "Evaluación":
        return "#FF5722";
      case "Social":
        return "#4CAF50";
      default:
        return "#9E9E9E";
    }
  };

  const renderEvento = ({ item }: { item: Evento }) => {
    const isPasado = esEventoPasado(item.fechaInicio);
    const miEstado = item.asistentes.find(
      (a) => a.uid === user?.uid
    )?.estadoAsistencia;

    return (
      <TouchableOpacity
        style={[styles.eventoCard, isPasado && styles.eventoCardPasado]}
        onPress={() =>
          navigation.navigate("DetalleEvento", { eventoId: item.id })
        }
      >
        <View style={styles.eventoHeader}>
          <View style={styles.eventoHeaderLeft}>
            <Text style={styles.eventoTitulo} numberOfLines={1}>
              {item.titulo}
            </Text>
            <View
              style={[
                styles.tipoBadge,
                { backgroundColor: getTipoColor(item.tipo) },
              ]}
            >
              <Text style={styles.tipoText}>{item.tipo}</Text>
            </View>
          </View>
        </View>

        {item.descripcion && (
          <Text style={styles.eventoDescripcion} numberOfLines={2}>
            {item.descripcion}
          </Text>
        )}

        <View style={styles.eventoFooter}>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="event"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText}>
              {formatearFecha(item.fechaInicio)} • {item.horaInicio}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons
              name={item.esVirtual ? "videocam" : "place"}
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {item.esVirtual ? "Virtual" : item.ubicacion || "Sin ubicación"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialIcons
              name="people"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText}>
              {item.asistentes.length} asistente
              {item.asistentes.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {miEstado && (
            <View style={styles.estadoBadgeContainer}>
              <View
                style={[
                  styles.estadoBadge,
                  { backgroundColor: getEstadoColor(miEstado) },
                ]}
              >
                <Text style={styles.estadoText}>{miEstado}</Text>
              </View>
            </View>
          )}
        </View>

        {isPasado && (
          <View style={styles.pasadoOverlay}>
            <Text style={styles.pasadoText}>PASADO</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Confirmado":
        return "#4CAF50";
      case "Rechazado":
        return "#F44336";
      case "Pendiente":
        return "#FF9800";
      case "Asistió":
        return "#2196F3";
      case "No Asistió":
        return "#9E9E9E";
      default:
        return "#9E9E9E";
    }
  };

  return (
    <View style={styles.container}>
      {/* Filtros de vista */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[
            styles.filtroButton,
            vistaActual === "asignados" && styles.filtroButtonActive,
          ]}
          onPress={() => setVistaActual("asignados")}
        >
          <Text
            style={[
              styles.filtroText,
              vistaActual === "asignados" && styles.filtroTextActive,
            ]}
          >
            Mis Eventos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filtroButton,
            vistaActual === "creados" && styles.filtroButtonActive,
          ]}
          onPress={() => setVistaActual("creados")}
        >
          <Text
            style={[
              styles.filtroText,
              vistaActual === "creados" && styles.filtroTextActive,
            ]}
          >
            Creados por mí
          </Text>
        </TouchableOpacity>

        {esAdminOJefe && (
          <TouchableOpacity
            style={[
              styles.filtroButton,
              vistaActual === "todos" && styles.filtroButtonActive,
            ]}
            onPress={() => setVistaActual("todos")}
          >
            <Text
              style={[
                styles.filtroText,
                vistaActual === "todos" && styles.filtroTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de eventos */}
      <FlatList
        data={eventos}
        keyExtractor={(item) => item.id}
        renderItem={renderEvento}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={cargarEventos} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="event-busy"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No hay eventos disponibles</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Botón flotante para crear evento */}
      {esAdminOJefe && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("CrearEvento")}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filtrosContainer: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
    backgroundColor: COLORS.surface,
    elevation: 2,
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  filtroButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filtroText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  filtroTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  listContent: {
    padding: 15,
  },
  eventoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: "relative",
  },
  eventoCardPasado: {
    opacity: 0.7,
  },
  eventoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  eventoHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventoTitulo: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipoText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  eventoDescripcion: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  eventoFooter: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    flex: 1,
  },
  estadoBadgeContainer: {
    marginTop: 8,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  estadoText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  pasadoOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pasadoText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    marginTop: 15,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

export default EventosScreen;
