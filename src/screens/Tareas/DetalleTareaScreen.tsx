
import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { db } from "../../Services/firebaseConfig";
import {
  actualizarEstadoTarea,
  agregarComentario,
  agregarEnlaceAdjunto,
  eliminarAdjunto,
  eliminarTarea,
} from "../../Services/tareasService";
import { COLORS, FONT_SIZES } from "../../types";
import { Adjunto, EstadoTarea, Tarea } from "../../types/tareas";

const DetalleTareaScreen: React.FC = ({ route, navigation }: any) => {
  const { tareaId } = route.params;
  const { user } = useUser();

  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [loading, setLoading] = useState(true);
  const [comentario, setComentario] = useState("");

  // ── Modal agregar enlace ──
  const [modalEnlaceVisible, setModalEnlaceVisible] = useState(false);
  const [enlaceNombre, setEnlaceNombre] = useState("");
  const [enlaceUrl, setEnlaceUrl] = useState("");
  const [guardandoEnlace, setGuardandoEnlace] = useState(false);
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
    Alert.alert("Cambiar estado", `¿Cambiar estado a "${nuevoEstado}"?`, [
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
    ]);
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

  // ─── Handlers de adjuntos (enlaces) ────────────────────────────────────────

  const handleAbrirModalEnlace = () => {
    setEnlaceNombre("");
    setEnlaceUrl("");
    setModalEnlaceVisible(true);
  };

  const handleGuardarEnlace = async () => {
    if (!enlaceNombre.trim()) {
      Alert.alert("Campo requerido", "Escribe un nombre para el enlace.");
      return;
    }
    if (!enlaceUrl.trim()) {
      Alert.alert("Campo requerido", "Pega la URL del archivo.");
      return;
    }
    // Validación básica de URL
    if (!enlaceUrl.trim().startsWith("http")) {
      Alert.alert("URL inválida", "La URL debe comenzar con http:// o https://");
      return;
    }

    setGuardandoEnlace(true);
    try {
      await agregarEnlaceAdjunto(
        tareaId,
        { nombre: enlaceNombre, url: enlaceUrl },
        user!.uid,
        user!.nombre
      );
      setModalEnlaceVisible(false);
      await cargarTarea();
      Alert.alert("Éxito", "Enlace agregado correctamente");
    } catch {
      Alert.alert("Error", "No se pudo guardar el enlace");
    } finally {
      setGuardandoEnlace(false);
    }
  };

  const handleEliminarAdjunto = (adjunto: Adjunto) => {
    const puedeEliminar =
      adjunto.subidoPor === user?.uid || user?.rol === "Administrador";

    if (!puedeEliminar) {
      Alert.alert("Sin permiso", "Solo quien agregó el enlace o un Administrador puede eliminarlo.");
      return;
    }

    Alert.alert(
      "Eliminar enlace",
      `¿Eliminar "${adjunto.nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarAdjunto(tareaId, adjunto.id);
              await cargarTarea();
            } catch {
              Alert.alert("Error", "No se pudo eliminar el enlace");
            }
          },
        },
      ]
    );
  };

  const handleAbrirEnlace = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "No se pudo abrir el enlace")
    );
  };

  if (!tarea) return null;

  const puedeEditar =
    user?.uid === tarea.creadaPor || user?.rol === "Administrador";
  const esAsignado = tarea.asignadoA.includes(user?.uid!);

  const estados: EstadoTarea[] = [
    "Pendiente",
    "En Progreso",
    "Completada",
    "Cancelada",
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>{tarea.titulo}</Text>
        <View style={styles.badges}>
          <View
            style={[
              styles.prioridadBadge,
              { backgroundColor: getPrioridadColor(tarea.prioridad) },
            ]}
          >
            <Text style={styles.badgeText}>{tarea.prioridad}</Text>
          </View>
          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: getEstadoColor(tarea.estado) },
            ]}
          >
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
          <Text style={styles.infoValue}>
            {tarea.nombresAsignados?.join(", ")}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons
            name="calendar-today"
            size={20}
            color={COLORS.primary}
          />
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

      {/* ── Adjuntos / Entregables ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Adjuntos ({tarea.adjuntos?.length || 0})
          </Text>
          <TouchableOpacity
            style={styles.subirButton}
            onPress={handleAbrirModalEnlace}
          >
            <MaterialIcons name="add-link" size={18} color="#fff" />
            <Text style={styles.subirButtonText}>Agregar enlace</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de adjuntos */}
        {tarea.adjuntos && tarea.adjuntos.length > 0 ? (
          tarea.adjuntos.map((adj) => (
            <View key={adj.id} style={styles.adjuntoCard}>
              <TouchableOpacity
                style={styles.adjuntoInfo}
                onPress={() => handleAbrirEnlace(adj.url)}
              >
                <MaterialIcons name="link" size={26} color={COLORS.primary} />
                <View style={styles.adjuntoTextos}>
                  <Text style={styles.adjuntoNombre} numberOfLines={1}>
                    {adj.nombre}
                  </Text>
                  <Text style={styles.adjuntoMeta}>
                    {adj.nombreSubidor} · {new Date(adj.fechaSubida).toLocaleDateString("es-ES")}
                  </Text>
                </View>
                <MaterialIcons name="open-in-new" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adjuntoEliminar}
                onPress={() => handleEliminarAdjunto(adj)}
              >
                <MaterialIcons name="delete-outline" size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.adjuntosVacio}>
            <MaterialIcons name="link-off" size={36} color="#ccc" />
            <Text style={styles.adjuntosVacioText}>Sin enlaces adjuntos</Text>
          </View>
        )}
      </View>

      {/* Modal agregar enlace */}
      <Modal
        visible={modalEnlaceVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalEnlaceVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitulo}>Agregar enlace</Text>
            <Text style={styles.modalSubtitulo}>
              Pega un enlace de Google Drive, Dropbox, OneDrive u otro servicio.
            </Text>

            <Text style={styles.modalLabel}>Nombre del archivo *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ej: Informe mensual.pdf"
              value={enlaceNombre}
              onChangeText={setEnlaceNombre}
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>URL del enlace *</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputUrl]}
              placeholder="https://drive.google.com/..."
              value={enlaceUrl}
              onChangeText={setEnlaceUrl}
              autoCapitalize="none"
              keyboardType="url"
              multiline
            />

            <View style={styles.modalBotones}>
              <TouchableOpacity
                style={styles.modalBotonCancelar}
                onPress={() => setModalEnlaceVisible(false)}
                disabled={guardandoEnlace}
              >
                <Text style={styles.modalBotonCancelarText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBotonGuardar,
                  guardandoEnlace && { opacity: 0.6 },
                ]}
                onPress={handleGuardarEnlace}
                disabled={guardandoEnlace}
              >
                <Text style={styles.modalBotonGuardarText}>
                  {guardandoEnlace ? "Guardando..." : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
          <TouchableOpacity
            style={styles.eliminarButton}
            onPress={handleEliminar}
          >
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

/** Devuelve el nombre del ícono de MaterialIcons según el MIME type */
const getIconoTipoArchivo = (mimeType: string): keyof typeof MaterialIcons.glyphMap => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "picture-as-pdf";
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "description";
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return "table-chart";
  return "insert-drive-file";
};

/** Formatea bytes a KB / MB de forma legible */
const formatearTamanio = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  },

  // ── Adjuntos ──────────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subirButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  subirButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.small,
    fontWeight: "bold",
  },
  adjuntoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ebebeb",
  },
  adjuntoInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  adjuntoTextos: {
    flex: 1,
  },
  adjuntoNombre: {
    fontSize: FONT_SIZES.small,
    fontWeight: "600",
    color: COLORS.text,
  },
  adjuntoMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  adjuntoEliminar: {
    padding: 6,
  },
  adjuntosVacio: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 6,
  },
  adjuntosVacioText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },

  // ── Modal enlace ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitulo: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  modalSubtitulo: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  modalLabel: {
    fontSize: FONT_SIZES.small,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZES.medium,
    marginBottom: 16,
    color: COLORS.text,
  },
  modalInputUrl: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  modalBotones: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalBotonCancelar: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  modalBotonCancelarText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    fontWeight: "600",
  },
  modalBotonGuardar: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  modalBotonGuardarText: {
    fontSize: FONT_SIZES.medium,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default DetalleTareaScreen;
