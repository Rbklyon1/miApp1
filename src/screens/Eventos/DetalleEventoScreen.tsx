
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { useDetalleEvento } from "../../Hooks/Eventos/useDetalleEvento";
import { EstadoAsistencia } from "../../types/eventos";
import { COLORS, FONT_SIZES } from "../../types/index";

const DetalleEventoScreen: React.FC = ({ route, navigation }: any) => {
  const { eventoId } = route.params;
  const { user } = useUser();

  const {
    evento,
    loading,
    cambiarAsistencia,
    eliminar,
    eventoPasado,
    puedeEditar,
    esAsistente,
    miEstado,
  } = useDetalleEvento(eventoId, user, navigation);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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

  const getEstadoColor = (estado: EstadoAsistencia) => {
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

  const handleAbrirLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No se puede abrir este enlace");
      }
    } catch {
      Alert.alert("Error", "No se pudo abrir el enlace");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!evento) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>{evento.titulo}</Text>

        <View
          style={[
            styles.tipoBadge,
            { backgroundColor: getTipoColor(evento.tipo) },
          ]}
        >
          <Text style={styles.tipoText}>{evento.tipo}</Text>
        </View>
      </View>

      {evento.descripcion && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.descripcion}>{evento.descripcion}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fecha y hora</Text>

        <View style={styles.infoRow}>
          <MaterialIcons name="event" size={20} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Inicio</Text>
            <Text style={styles.infoValue}>
              {formatearFecha(evento.fechaInicio)} • {evento.horaInicio}
            </Text>
          </View>
        </View>

        {evento.fechaFin && (
          <View style={styles.infoRow}>
            <MaterialIcons name="event" size={20} color={COLORS.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Fin</Text>
              <Text style={styles.infoValue}>
                {formatearFecha(evento.fechaFin)} • {evento.horaFin}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ubicación</Text>

        <View style={styles.infoRow}>
          <MaterialIcons
            name={evento.esVirtual ? "videocam" : "place"}
            size={20}
            color={COLORS.primary}
          />

          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>
              {evento.esVirtual ? "Evento virtual" : "Ubicación física"}
            </Text>

            <Text style={styles.infoValue}>
              {evento.esVirtual
                ? "En línea"
                : evento.ubicacion || "No especificada"}
            </Text>
          </View>
        </View>

        {evento.esVirtual && evento.linkVirtual && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleAbrirLink(evento.linkVirtual!)}
          >
            <MaterialIcons name="link" size={20} color="#fff" />
            <Text style={styles.linkButtonText}>Unirse al evento</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Organizador</Text>

        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={20} color={COLORS.primary} />
          <Text style={styles.infoValue}>{evento.nombreCreador}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Asistentes ({evento.asistentes.length})
        </Text>

        {evento.asistentes.map((asistente) => (
          <View key={asistente.uid} style={styles.asistenteCard}>
            <View style={styles.asistenteInfo}>
              <Text style={styles.asistenteNombre}>{asistente.nombre}</Text>
              <Text style={styles.asistenteRol}>{asistente.rol}</Text>
            </View>

            <View
              style={[
                styles.estadoBadge,
                {
                  backgroundColor: getEstadoColor(
                    asistente.estadoAsistencia
                  ),
                },
              ]}
            >
              <Text style={styles.estadoText}>
                {asistente.estadoAsistencia}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {esAsistente && !eventoPasado && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu respuesta</Text>

          <View style={styles.estadoActualCard}>
            <Text style={styles.estadoActualLabel}>Estado actual:</Text>

            <View
              style={[
                styles.estadoBadge,
                {
                  backgroundColor: getEstadoColor(miEstado || "Pendiente"),
                },
              ]}
            >
              <Text style={styles.estadoText}>{miEstado || "Pendiente"}</Text>
            </View>
          </View>

          <View style={styles.botonesAsistencia}>
            <TouchableOpacity
              style={[
                styles.botonAsistencia,
                { backgroundColor: "#4CAF50" },
                miEstado === "Confirmado" && styles.botonAsistenciaActivo,
              ]}
              onPress={() => cambiarAsistencia("Confirmado")}
            >
              <MaterialIcons name="check" size={22} color="#fff" />
              <Text style={styles.botonAsistenciaText}>Confirmar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botonAsistencia,
                { backgroundColor: "#F44336" },
                miEstado === "Rechazado" && styles.botonAsistenciaActivo,
              ]}
              onPress={() => cambiarAsistencia("Rechazado")}
            >
              <MaterialIcons name="close" size={22} color="#fff" />
              <Text style={styles.botonAsistenciaText}>Rechazar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {evento.notas && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas adicionales</Text>
          <Text style={styles.descripcion}>{evento.notas}</Text>
        </View>
      )}

     {puedeEditar && (
        <View style={styles.section}>
         {!eventoPasado && (
           <TouchableOpacity
              style={styles.editarButton}
              onPress={() =>
              navigation.navigate("EditarEvento", { eventoId: evento.id })
               }
            >
            <MaterialIcons name="edit" size={22} color="#fff" />
            <Text style={styles.editarText}>Editar evento</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.eliminarButton} onPress={eliminar}>
            <MaterialIcons name="delete" size={22} color="#fff" />
            <Text style={styles.eliminarText}>Eliminar evento</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
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
  tipoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  tipoText: {
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
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    fontWeight: "500",
  },
  linkButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 8,
  },
  linkButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  asistenteCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  asistenteInfo: {
    flex: 1,
  },
  asistenteNombre: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: COLORS.text,
  },
  asistenteRol: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
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
  estadoActualCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  estadoActualLabel: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    fontWeight: "600",
  },
  botonesAsistencia: {
    flexDirection: "row",
    gap: 10,
  },
  botonAsistencia: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  botonAsistenciaActivo: {
    borderWidth: 3,
    borderColor: "#000",
  },
  botonAsistenciaText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  editarButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  editarText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
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
});

export default DetalleEventoScreen;
