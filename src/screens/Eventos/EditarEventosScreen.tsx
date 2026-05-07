import { MaterialIcons } from "@expo/vector-icons";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { COLORS, FONT_SIZES } from "../../types/index";
import React from "react";
import { useEditarEvento } from "../../Hooks/Eventos/useEditarEvento";

const EditarEventoScreen: React.FC = ({ route, navigation }: any) => {
  const { eventoId } = route.params;
  const { user } = useUser();

  const {
    titulo,
    setTitulo,
    descripcion,
    setDescripcion,
    tipo,
    setTipo,
    fechaInicio,
    horaInicio,
    setHoraInicio,
    fechaFin,
    horaFin,
    setHoraFin,
    ubicacion,
    setUbicacion,
    esVirtual,
    setEsVirtual,
    linkVirtual,
    setLinkVirtual,
    capacidadMaxima,
    setCapacidadMaxima,
    notas,
    setNotas,
    mostrarModalFechaInicio,
    setMostrarModalFechaInicio,
    mostrarModalFechaFin,
    setMostrarModalFechaFin,
    diaInicioSeleccionado,
    setDiaInicioSeleccionado,
    mesInicioSeleccionado,
    setMesInicioSeleccionado,
    anioInicioSeleccionado,
    setAnioInicioSeleccionado,
    diaFinSeleccionado,
    setDiaFinSeleccionado,
    mesFinSeleccionado,
    setMesFinSeleccionado,
    anioFinSeleccionado,
    setAnioFinSeleccionado,
    isLoading,
    tiposEvento,
    meses,
    obtenerDiasDelMes,
    confirmarFechaInicio,
    confirmarFechaFin,
    limpiarFechaFin,
    handleEditarEvento,
  } = useEditarEvento(eventoId, user, navigation);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Editar evento</Text>

      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Reunión de equipo"
        value={titulo}
        onChangeText={setTitulo}
      />

      <Text style={styles.label}>Tipo de evento</Text>
      <View style={styles.tipoContainer}>
        {tiposEvento.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tipoButton, tipo === t && styles.tipoButtonActive]}
            onPress={() => setTipo(t)}
          >
            <Text style={[styles.tipoText, tipo === t && styles.tipoTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Detalles del evento..."
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.sectionTitle}>Fecha y hora</Text>

      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeColumn}>
          <Text style={styles.label}>Fecha inicio *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setMostrarModalFechaInicio(true)}
          >
            <MaterialIcons name="event" size={18} color={COLORS.primary} />
            <Text style={styles.dateText}>
              {fechaInicio.toLocaleDateString("es-ES")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateTimeColumn}>
          <Text style={styles.label}>Hora *</Text>
          <TextInput
            style={styles.input}
            placeholder="09:00"
            value={horaInicio}
            onChangeText={setHoraInicio}
          />
        </View>
      </View>

      <Modal
        visible={mostrarModalFechaInicio}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModalFechaInicio(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Fecha de Inicio</Text>

            <Text style={styles.pickerLabel}>Año</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {[2024, 2025, 2026, 2027, 2028].map((anio) => (
                <TouchableOpacity
                  key={anio}
                  style={[
                    styles.pickerButton,
                    anioInicioSeleccionado === anio && styles.pickerButtonActive,
                  ]}
                  onPress={() => setAnioInicioSeleccionado(anio)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      anioInicioSeleccionado === anio && styles.pickerButtonTextActive,
                    ]}
                  >
                    {anio}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerLabel}>Mes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {meses.map((mes, index) => (
                <TouchableOpacity
                  key={mes}
                  style={[
                    styles.pickerButton,
                    mesInicioSeleccionado === index && styles.pickerButtonActive,
                  ]}
                  onPress={() => setMesInicioSeleccionado(index)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      mesInicioSeleccionado === index && styles.pickerButtonTextActive,
                    ]}
                  >
                    {mes}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerLabel}>Día</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {Array.from(
                { length: obtenerDiasDelMes(mesInicioSeleccionado, anioInicioSeleccionado) },
                (_, i) => i + 1
              ).map((dia) => (
                <TouchableOpacity
                  key={dia}
                  style={[
                    styles.pickerButton,
                    diaInicioSeleccionado === dia && styles.pickerButtonActive,
                  ]}
                  onPress={() => setDiaInicioSeleccionado(dia)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      diaInicioSeleccionado === dia && styles.pickerButtonTextActive,
                    ]}
                  >
                    {dia}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setMostrarModalFechaInicio(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={confirmarFechaInicio}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeColumn}>
          <Text style={styles.label}>Fecha fin opcional</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setMostrarModalFechaFin(true)}
          >
            <MaterialIcons name="event" size={18} color={COLORS.primary} />
            <Text style={styles.dateText}>
              {fechaFin ? fechaFin.toLocaleDateString("es-ES") : "Seleccionar"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateTimeColumn}>
          <Text style={styles.label}>Hora fin</Text>
          <TextInput
            style={styles.input}
            placeholder="18:00"
            value={horaFin}
            onChangeText={setHoraFin}
          />
        </View>
      </View>

      <Modal
        visible={mostrarModalFechaFin}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModalFechaFin(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Fecha de Fin</Text>

            <Text style={styles.pickerLabel}>Año</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {[2024, 2025, 2026, 2027, 2028].map((anio) => (
                <TouchableOpacity
                  key={anio}
                  style={[
                    styles.pickerButton,
                    anioFinSeleccionado === anio && styles.pickerButtonActive,
                  ]}
                  onPress={() => setAnioFinSeleccionado(anio)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      anioFinSeleccionado === anio && styles.pickerButtonTextActive,
                    ]}
                  >
                    {anio}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerLabel}>Mes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {meses.map((mes, index) => (
                <TouchableOpacity
                  key={mes}
                  style={[
                    styles.pickerButton,
                    mesFinSeleccionado === index && styles.pickerButtonActive,
                  ]}
                  onPress={() => setMesFinSeleccionado(index)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      mesFinSeleccionado === index && styles.pickerButtonTextActive,
                    ]}
                  >
                    {mes}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerLabel}>Día</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {Array.from(
                { length: obtenerDiasDelMes(mesFinSeleccionado, anioFinSeleccionado) },
                (_, i) => i + 1
              ).map((dia) => (
                <TouchableOpacity
                  key={dia}
                  style={[
                    styles.pickerButton,
                    diaFinSeleccionado === dia && styles.pickerButtonActive,
                  ]}
                  onPress={() => setDiaFinSeleccionado(dia)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      diaFinSeleccionado === dia && styles.pickerButtonTextActive,
                    ]}
                  >
                    {dia}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={limpiarFechaFin}
              >
                <Text style={styles.modalButtonSecondaryText}>Limpiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={confirmarFechaFin}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.sectionTitle}>Ubicación</Text>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Evento virtual</Text>
        <Switch
          value={esVirtual}
          onValueChange={setEsVirtual}
          trackColor={{ false: "#ddd", true: COLORS.primary }}
        />
      </View>

      {esVirtual ? (
        <>
          <Text style={styles.label}>Link virtual *</Text>
          <TextInput
            style={styles.input}
            placeholder="https://meet.google.com/..."
            value={linkVirtual}
            onChangeText={setLinkVirtual}
            autoCapitalize="none"
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Ubicación física</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Sala de juntas"
            value={ubicacion}
            onChangeText={setUbicacion}
          />
        </>
      )}

      <Text style={styles.sectionTitle}>Asistentes *</Text>

      {user?.rol === "Jefe" && (
        <View style={styles.warningBox}>
          <MaterialIcons name="info" size={16} color="#FF9800" />
          <Text style={styles.warningText}>
            Como Jefe, solo puedes invitar a Empleados y otros Jefes
          </Text>
        </View>
      )}

      <Text style={styles.label}>Capacidad máxima</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 30"
        value={capacidadMaxima}
        onChangeText={setCapacidadMaxima}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Notas adicionales</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Información extra..."
        value={notas}
        onChangeText={setNotas}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.crearButton, { opacity: isLoading ? 0.6 : 1 }]}
        onPress={handleEditarEvento}
        disabled={isLoading}
      >
        <MaterialIcons name="save" size={22} color="#fff" />
        <Text style={styles.crearButtonText}>
          {isLoading ? "Guardando..." : "Guardar cambios"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
    marginTop: 10,
  },
  label: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZES.medium,
    marginBottom: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  tipoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },
  tipoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  tipoButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  tipoText: {
    fontSize: FONT_SIZES.small,
    color: "#666",
    fontWeight: "500",
  },
  tipoTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  dateTimeColumn: {
    flex: 1,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  dateText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  usuarioCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  usuarioCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#e3f2fd",
  },
  usuarioInfo: {
    flex: 1,
  },
  usuarioNombre: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: COLORS.text,
  },
  usuarioRol: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
  },
  crearButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 40,
    gap: 8,
  },
  crearButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  warningText: {
    flex: 1,
    fontSize: FONT_SIZES.small,
    color: "#E65100",
    lineHeight: 18,
  },
  emptyUsersText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginVertical: 20,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
    textAlign: "center",
  },
  pickerLabel: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 15,
    marginBottom: 8,
  },
  pickerScroll: {
    maxHeight: 50,
  },
  pickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    minWidth: 60,
    alignItems: "center",
  },
  pickerButtonActive: {
    backgroundColor: COLORS.primary,
  },
  pickerButtonText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
  },
  pickerButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    gap: 10,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  modalButtonSecondaryText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    fontWeight: "600",
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    fontSize: FONT_SIZES.medium,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default EditarEventoScreen;
