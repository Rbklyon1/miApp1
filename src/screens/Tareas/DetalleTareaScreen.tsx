import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";
import {
  actualizarEstadoTarea,
  agregarComentario,
  eliminarTarea,
} from "../../api/tareasService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";
import { Tarea, EstadoTarea } from "../../types/tareas";
import { COLORS, FONT_SIZES } from "../../types";

const DetalleTareaScreen: React.FC = ({ route, navigation }: any) => {
  const { tareaId } = route.params;
  const { user } = useUser();
  
  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState("");
  useEffect(() => {
    cargarTarea();
  }, [tareaId]);

  const cargarTarea = async () => {
    try {
      const tareaRef = doc(db, "Tareas", tareaId);
      const tareaSnap = await getDoc(tareaRef);
      
      if (tareaSnap.exists()) {
        setTarea({ id: tareaSnap.id, ...tareaSnap.data() } as Tarea);
      } else {
        Alert.alert("Error", "Tarea no encontrada");
        navigation.goBack();
      }
    } catch {
      Alert.alert("Error", "No se pudo cargar la tarea");
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = (nuevoEstado: EstadoTarea) => {
    Alert.alert(
      "Cambiar estado",
      `¿Cambiar estado a "${nuevoEstado}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await actualizarEstadoTarea(tareaId, nuevoEstado);
              await cargarTarea();
              Alert.alert("Éxito", "Estado actualizado");
            } catch {
              Alert.alert("Error", "No se pudo actualizar el estado");
            }
          },
        },
      ]
    );
  };

  const handleAgregarComentario = async () => {
    if (!comentario.trim()) return;

    try {
      await agregarComentario(tareaId, {
        texto: comentario.trim(),
        autorUid: user?.uid!,
        autorNombre: user?.nombre!,
      });
      
      setComentario("");
      await cargarTarea();
      Alert.alert("Éxito", "Comentario agregado");
    } catch {
      Alert.alert("Error", "No se pudo agregar el comentario");
    }
  };

  const handleEliminar = () => {
    Alert.alert(
      "Eliminar tarea",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarTarea(tareaId);
              Alert.alert("Éxito", "Tarea eliminada", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert("Error", "No se pudo eliminar la tarea");
            }
          },
        },
      ]
    );
  };

  if (!tarea) return null;

  const puedeEditar = user?.uid === tarea.creadaPor || user?.rol === "Administrador";
  const esAsignado = tarea.asignadoA.includes(user?.uid!);

  const estados: EstadoTarea[] = ["Pendiente", "En Progreso", "Completada", "Cancelada"];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>{tarea.titulo}</Text>
        <View style={styles.badges}>
          <View style={[styles.prioridadBadge, { backgroundColor: getPrioridadColor(tarea.prioridad) }]}>
            <Text style={styles.badgeText}>{tarea.prioridad}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(tarea.estado) }]}>
            <Text style={styles.badgeText}>{tarea.estado}</Text>
          </View>
        </View>
      </View>

      {/* Descripción */}
      {tarea.descripcion && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.descripcion}>{tarea.descripcion}</Text>
        </View>
      )}

      {/* Información */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={20} color={COLORS.primary} />
          <Text style={styles.infoLabel}>Creado por:</Text>
          <Text style={styles.infoValue}>{tarea.nombreCreador}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="group" size={20} color={COLORS.primary} />
          <Text style={styles.infoLabel}>Asignado a:</Text>
          <Text style={styles.infoValue}>{tarea.nombresAsignados?.join(", ")}</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
          <Text style={styles.infoLabel}>Creado:</Text>
          <Text style={styles.infoValue}>
            {new Date(tarea.fechaCreacion).toLocaleDateString("es-ES")}
          </Text>
        </View>

        {tarea.fechaVencimiento && (
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={20} color={COLORS.primary} />
            <Text style={styles.infoLabel}>Vence:</Text>
            <Text style={styles.infoValue}>
              {new Date(tarea.fechaVencimiento).toLocaleDateString("es-ES")}
            </Text>
          </View>
        )}
      </View>

      {/* Cambiar estado */}
      {esAsignado && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar estado</Text>
          <View style={styles.estadosContainer}>
            {estados.map((estado) => (
              <TouchableOpacity
                key={estado}
                style={[
                  styles.estadoButton,
                  { backgroundColor: getEstadoColor(estado) },
                  tarea.estado === estado && styles.estadoButtonActive,
                ]}
                onPress={() => handleCambiarEstado(estado)}
              >
                <Text style={styles.estadoButtonText}>{estado}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Comentarios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Comentarios ({tarea.comentarios?.length || 0})
        </Text>

        {tarea.comentarios?.map((com) => (
          <View key={com.id} style={styles.comentarioCard}>
            <View style={styles.comentarioHeader}>
              <Text style={styles.comentarioAutor}>{com.autorNombre}</Text>
              <Text style={styles.comentarioFecha}>
                {new Date(com.fecha).toLocaleDateString("es-ES")}
              </Text>
            </View>
            <Text style={styles.comentarioTexto}>{com.texto}</Text>
          </View>
        ))}

        {/* Agregar comentario */}
        <View style={styles.nuevoComentario}>
          <TextInput
            style={styles.comentarioInput}
            placeholder="Escribe un comentario..."
            value={comentario}
            onChangeText={setComentario}
            multiline
          />
          <TouchableOpacity
            style={styles.enviarButton}
            onPress={handleAgregarComentario}
          >
            <MaterialIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Acciones de admin */}
      {puedeEditar && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.eliminarButton} onPress={handleEliminar}>
            <MaterialIcons name="delete" size={22} color="#fff" />
            <Text style={styles.eliminarText}>Eliminar tarea</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const getPrioridadColor = (prioridad: string) => {
  switch (prioridad) {
    case "Baja": return "#4CAF50";
    case "Media": return "#FF9800";
    case "Alta": return "#FF5722";
    case "Urgente": return "#D32F2F";
    default: return "#9E9E9E";
  }
};

const getEstadoColor = (estado: EstadoTarea) => {
  switch (estado) {
    case "Pendiente": return "#FFC107";
    case "En Progreso": return "#2196F3";
    case "Completada": return "#4CAF50";
    case "Cancelada": return "#9E9E9E";
    default: return "#9E9E9E";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: 20,
    elevation: 2,
  },
  titulo: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
  },
  prioridadBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: FONT_SIZES.small,
    color: "#fff",
    fontWeight: "bold",
  },
  section: {
    backgroundColor: COLORS.surface,
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  descripcion: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  infoLabel: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  infoValue: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    flex: 1,
  },
  estadosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  estadoButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: "45%",
    alignItems: "center",
  },
  estadoButtonActive: {
    borderWidth: 3,
    borderColor: "#000",
  },
  estadoButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: FONT_SIZES.small,
  },
  comentarioCard: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  comentarioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  comentarioAutor: {
    fontSize: FONT_SIZES.small,
    fontWeight: "bold",
    color: COLORS.text,
  },
  comentarioFecha: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  comentarioTexto: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
  },
  nuevoComentario: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  comentarioInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: FONT_SIZES.medium,
    minHeight: 50,
  },
  enviarButton: {
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  eliminarButton: {
    flexDirection: "row",
    backgroundColor: COLORS.error,
    padding: 15,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  eliminarText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  }
});

export default DetalleTareaScreen;