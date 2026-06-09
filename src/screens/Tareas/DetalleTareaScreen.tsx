import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { useDetalleTarea } from "../../Hooks/useDetalleTarea";
import { COLORS, FONT_SIZES } from "../../types";
import { EstadoTarea } from "../../types/tareas";

const DetalleTareaScreen: React.FC = ({ route, navigation }: any) => {
  const { tareaId } = route.params;
  const { user } = useUser();

  const {
    tarea,
    loading,

    comentario,
    setComentario,

    modalEnlaceVisible,
    setModalEnlaceVisible,
    enlaceNombre,
    setEnlaceNombre,
    enlaceUrl,
    setEnlaceUrl,
    guardandoEnlace,

    puedeEditar,
    esAsignado,
    estados,

    cambiarEstado,
    agregarComentarioTarea,
    abrirModalEnlace,
    guardarEnlace,
    eliminarAdjuntoTarea,
    abrirEnlace,
    eliminar,
  } = useDetalleTarea(tareaId, user, navigation);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!tarea) return null;

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
            {tarea.nombresAsignados?.join(", ") || "Sin asignar"}
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
            {estados.map((estado: EstadoTarea) => (
              <TouchableOpacity
                key={estado}
                style={[
                  styles.estadoButton,
                  { backgroundColor: getEstadoColor(estado) },
                  tarea.estado === estado && styles.estadoButtonActive,
                ]}
                onPress={() => cambiarEstado(estado)}
              >
                <Text style={styles.estadoButtonText}>{estado}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Adjuntos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Adjuntos ({tarea.adjuntos?.length || 0})
          </Text>

          <TouchableOpacity style={styles.subirButton} onPress={abrirModalEnlace}>
            <MaterialIcons name="add-link" size={18} color="#fff" />
            <Text style={styles.subirButtonText}>Agregar enlace</Text>
          </TouchableOpacity>
        </View>

        {tarea.adjuntos && tarea.adjuntos.length > 0 ? (
          tarea.adjuntos.map((adj) => (
            <View key={adj.id} style={styles.adjuntoCard}>
              <TouchableOpacity
                style={styles.adjuntoInfo}
                onPress={() => abrirEnlace(adj.url)}
              >
                <MaterialIcons name="link" size={26} color={COLORS.primary} />

                <View style={styles.adjuntoTextos}>
                  <Text style={styles.adjuntoNombre} numberOfLines={1}>
                    {adj.nombre}
                  </Text>

                  <Text style={styles.adjuntoMeta}>
                    {adj.nombreSubidor} ·{" "}
                    {new Date(adj.fechaSubida).toLocaleDateString("es-ES")}
                  </Text>
                </View>

                <MaterialIcons
                  name="open-in-new"
                  size={18}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adjuntoEliminar}
                onPress={() => eliminarAdjuntoTarea(adj)}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={22}
                  color={COLORS.error}
                />
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
                onPress={guardarEnlace}
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
            onPress={agregarComentarioTarea}
          >
            <MaterialIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Acciones de admin */}
      {puedeEditar && (
        <View style={styles.section}>
          <TouchableOpacity style={styles.eliminarButton} onPress={eliminar}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
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