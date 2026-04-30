
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { COLORS, FONT_SIZES } from "../../types";
import { EstadoTarea, Tarea } from "../../types/tareas";

import { useTareas } from "../../Hooks/useTareas"; 

const TareasScreen: React.FC = ({ navigation }: any) => {
  const { user } = useUser();

  const {
    tareas,
    loading,
    vistaActual,
    setVistaActual,
    esAdmin,
    puedeCrear,
    refetch,
  } = useTareas(user);

  const renderTarea = ({ item }: { item: Tarea }) => (
    <TouchableOpacity
      style={styles.tareaCard}
      onPress={() => navigation.navigate("DetalleTarea", { tareaId: item.id })}
    >
      <View style={styles.tareaHeader}>
        <View style={styles.tareaHeaderLeft}>
          <Text style={styles.tareaTitulo}>{item.titulo}</Text>

          <View
            style={[
              styles.prioridadBadge,
              { backgroundColor: getPrioridadColor(item.prioridad) },
            ]}
          >
            <Text style={styles.prioridadText}>{item.prioridad}</Text>
          </View>
        </View>

        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(item.estado) },
          ]}
        >
          <Text style={styles.estadoText}>{item.estado}</Text>
        </View>
      </View>

      {item.descripcion && (
        <Text style={styles.tareaDescripcion} numberOfLines={2}>
          {item.descripcion}
        </Text>
      )}

      <View style={styles.tareaFooter}>
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            {item.nombresAsignados?.join(", ") || "Sin asignar"}
          </Text>
        </View>

        {item.fechaVencimiento && (
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              {new Date(item.fechaVencimiento).toLocaleDateString("es-ES")}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Filtros de vista */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[
            styles.filtroButton,
            vistaActual === "asignadas" && styles.filtroButtonActive,
          ]}
          onPress={() => setVistaActual("asignadas")}
        >
          <Text
            style={[
              styles.filtroText,
              vistaActual === "asignadas" && styles.filtroTextActive,
            ]}
          >
            Mis Tareas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filtroButton,
            vistaActual === "creadas" && styles.filtroButtonActive,
          ]}
          onPress={() => setVistaActual("creadas")}
        >
          <Text
            style={[
              styles.filtroText,
              vistaActual === "creadas" && styles.filtroTextActive,
            ]}
          >
            Creadas por mí
          </Text>
        </TouchableOpacity>

        {esAdmin && (
          <TouchableOpacity
            style={[
              styles.filtroButton,
              vistaActual === "todas" && styles.filtroButtonActive,
            ]}
            onPress={() => setVistaActual("todas")}
          >
            <Text
              style={[
                styles.filtroText,
                vistaActual === "todas" && styles.filtroTextActive,
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de tareas */}
      <FlatList
        data={tareas}
        keyExtractor={(item) => item.id}
        renderItem={renderTarea}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="assignment"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No hay tareas disponibles</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Botón flotante para crear tarea */}
      {puedeCrear && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("CrearTarea")}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

/** Helpers de presentación (UI) se quedan en Screen */
const getPrioridadColor = (prioridad: string) => {
  switch (prioridad) {
    case "Baja":
      return "#4CAF50";
    case "Media":
      return "#FF9800";
    case "Alta":
      return "#FF5722";
    case "Urgente":
      return "#D32F2F";
    default:
      return "#9E9E9E";
  }
};

const getEstadoColor = (estado: EstadoTarea) => {
  switch (estado) {
    case "Pendiente":
      return "#FFC107";
    case "En Progreso":
      return "#2196F3";
    case "Completada":
      return "#4CAF50";
    case "Cancelada":
      return "#9E9E9E";
    default:
      return "#9E9E9E";
  }
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
  tareaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tareaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tareaHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tareaTitulo: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
  prioridadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prioridadText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
  },
  tareaDescripcion: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  tareaFooter: {
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

export default TareasScreen;