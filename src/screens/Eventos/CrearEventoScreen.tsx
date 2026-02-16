import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import { obtenerUsuariosDeEmpresa } from "../../Services/empresaService";
import { crearEvento } from "../../Services/eventosService";
import { TipoEvento } from "../../types/eventos";
import { COLORS, FONT_SIZES } from "../../types/index";

const CrearEventoScreen: React.FC = ({ navigation }: any) => {
  const { user } = useUser();

  // Estados del formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<TipoEvento>("Reunión");

  // Fecha y hora
  const [fechaInicio, setFechaInicio] = useState<Date>(new Date());
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [fechaFin, setFechaFin] = useState<Date | undefined>();
  const [horaFin, setHoraFin] = useState("");

  // Ubicación
  const [ubicacion, setUbicacion] = useState("");
  const [esVirtual, setEsVirtual] = useState(false);
  const [linkVirtual, setLinkVirtual] = useState("");

  // Asistentes
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<any[]>([]);
  const [asistentesSeleccionados, setAsistentesSeleccionados] = useState<
    string[]
  >([]);

  // Otros
  const [capacidadMaxima, setCapacidadMaxima] = useState("");
  const [notas, setNotas] = useState("");

  // Modales
  const [mostrarModalFechaInicio, setMostrarModalFechaInicio] = useState(false);
  const [mostrarModalFechaFin, setMostrarModalFechaFin] = useState(false);

  // Estados para el selector de fecha manual - Fecha Inicio
  const [diaInicioSeleccionado, setDiaInicioSeleccionado] = useState(
    new Date().getDate()
  );
  const [mesInicioSeleccionado, setMesInicioSeleccionado] = useState(
    new Date().getMonth()
  );
  const [anioInicioSeleccionado, setAnioInicioSeleccionado] = useState(
    new Date().getFullYear()
  );

  // Estados para el selector de fecha manual - Fecha Fin
  const [diaFinSeleccionado, setDiaFinSeleccionado] = useState(
    new Date().getDate()
  );
  const [mesFinSeleccionado, setMesFinSeleccionado] = useState(
    new Date().getMonth()
  );
  const [anioFinSeleccionado, setAnioFinSeleccionado] = useState(
    new Date().getFullYear()
  );

  const [isLoading, setIsLoading] = useState(false);

  // Cargar usuarios de la empresa
  useEffect(() => {
    if (user?.empresaSeleccionada) {
      obtenerUsuariosDeEmpresa(user.empresaSeleccionada)
        .then((usuarios) => {
          // Si es Jefe, filtrar Administradores
          if (user.rol === "Jefe") {
            const usuariosFiltrados = usuarios.filter(
              (u) => u.rol !== "Administrador"
            );
            setUsuariosDisponibles(usuariosFiltrados);
          } else {
            setUsuariosDisponibles(usuarios);
          }
        })
        .catch(() =>
          Alert.alert("Error", "No se pudieron cargar los usuarios")
        );
    }
  }, [user?.empresaSeleccionada, user?.rol]);

  const tiposEvento: TipoEvento[] = [
    "Reunión",
    "Capacitación",
    "Evaluación",
    "Social",
    "Otro",
  ];

  const toggleAsistente = (uid: string) => {
    setAsistentesSeleccionados((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const obtenerDiasDelMes = (mes: number, anio: number) => {
    return new Date(anio, mes + 1, 0).getDate();
  };

  const confirmarFechaInicio = () => {
    const nuevaFecha = new Date(
      anioInicioSeleccionado,
      mesInicioSeleccionado,
      diaInicioSeleccionado
    );
    setFechaInicio(nuevaFecha);
    setMostrarModalFechaInicio(false);
  };

  const confirmarFechaFin = () => {
    const nuevaFecha = new Date(
      anioFinSeleccionado,
      mesFinSeleccionado,
      diaFinSeleccionado
    );
    setFechaFin(nuevaFecha);
    setMostrarModalFechaFin(false);
  };

  const limpiarFechaFin = () => {
    setFechaFin(undefined);
    setMostrarModalFechaFin(false);
  };

  const handleCrearEvento = async () => {
    if (!titulo.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }

    if (asistentesSeleccionados.length === 0) {
      Alert.alert("Error", "Debes asignar al menos un asistente");
      return;
    }

    if (esVirtual && !linkVirtual.trim()) {
      Alert.alert("Error", "Debes proporcionar el link virtual");
      return;
    }

    setIsLoading(true);
    try {
      const asistentesData = usuariosDisponibles
        .filter((u) => asistentesSeleccionados.includes(u.uid))
        .map((u) => ({ uid: u.uid, nombre: u.nombre, rol: u.rol }));

      await crearEvento(
        {
          titulo,
          descripcion,
          tipo,
          fechaInicio,
          horaInicio,
          fechaFin,
          horaFin,
          ubicacion,
          esVirtual,
          linkVirtual,
          asistentesUids: asistentesSeleccionados,
          capacidadMaxima: capacidadMaxima
            ? parseInt(capacidadMaxima)
            : undefined,
          notas,
        },
        user?.uid!,
        user?.nombre!,
        user?.empresaSeleccionada!,
        user?.empresaNombre!,
        asistentesData,
        user?.rol
      );

      Alert.alert("Éxito", "Evento creado correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("Error:", error);
      const mensaje = error.message || "No se pudo crear el evento";
      Alert.alert("Error", mensaje);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Información del evento</Text>

      {/* Título */}
      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Reunión de equipo"
        value={titulo}
        onChangeText={setTitulo}
      />

      {/* Tipo de evento */}
      <Text style={styles.label}>Tipo de evento</Text>
      <View style={styles.tipoContainer}>
        {tiposEvento.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tipoButton, tipo === t && styles.tipoButtonActive]}
            onPress={() => setTipo(t)}
          >
            <Text
              style={[styles.tipoText, tipo === t && styles.tipoTextActive]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Descripción */}
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Detalles del evento..."
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        numberOfLines={4}
      />

      {/* Fecha y hora */}
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

      {/* Modal para fecha de inicio */}
      <Modal
        visible={mostrarModalFechaInicio}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModalFechaInicio(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Fecha de Inicio</Text>

            {/* Selector de Año */}
            <Text style={styles.pickerLabel}>Año</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pickerScroll}
            >
              {[2024, 2025, 2026, 2027, 2028].map((anio) => (
                <TouchableOpacity
                  key={anio}
                  style={[
                    styles.pickerButton,
                    anioInicioSeleccionado === anio &&
                      styles.pickerButtonActive,
                  ]}
                  onPress={() => setAnioInicioSeleccionado(anio)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      anioInicioSeleccionado === anio &&
                        styles.pickerButtonTextActive,
                    ]}
                  >
                    {anio}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selector de Mes */}
            <Text style={styles.pickerLabel}>Mes</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pickerScroll}
            >
              {meses.map((mes, index) => (
                <TouchableOpacity
                  key={mes}
                  style={[
                    styles.pickerButton,
                    mesInicioSeleccionado === index &&
                      styles.pickerButtonActive,
                  ]}
                  onPress={() => setMesInicioSeleccionado(index)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      mesInicioSeleccionado === index &&
                        styles.pickerButtonTextActive,
                    ]}
                  >
                    {mes}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selector de Día */}
            <Text style={styles.pickerLabel}>Día</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pickerScroll}
            >
              {Array.from(
                {
                  length: obtenerDiasDelMes(
                    mesInicioSeleccionado,
                    anioInicioSeleccionado
                  ),
                },
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
                      diaInicioSeleccionado === dia &&
                        styles.pickerButtonTextActive,
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

      {/* Fecha fin opcional */}
      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeColumn}>
          <Text style={styles.label}>Fecha fin (opcional)</Text>
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

      {/* Modal para fecha fin */}
      <Modal
        visible={mostrarModalFechaFin}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModalFechaFin(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Fecha de Fin</Text>

            {/* Selector de Año */}
            <Text style={styles.pickerLabel}>Año</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pickerScroll}
            >
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
                      anioFinSeleccionado === anio &&
                        styles.pickerButtonTextActive,
                    ]}
                  >
                    {anio}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selector de Mes */}
            <Text style={styles.pickerLabel}>Mes</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pickerScroll}
            >
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
                      mesFinSeleccionado === index &&
                        styles.pickerButtonTextActive,
                    ]}
                  >
                    {mes}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Selector de Día */}
            <Text style={styles.pickerLabel}>Día</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pickerScroll}
            >
              {Array.from(
                {
                  length: obtenerDiasDelMes(
                    mesFinSeleccionado,
                    anioFinSeleccionado
                  ),
                },
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
                      diaFinSeleccionado === dia &&
                        styles.pickerButtonTextActive,
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

      {/* Ubicación */}
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

      {/* Asistentes */}
      <Text style={styles.sectionTitle}>Asistentes *</Text>
      {user?.rol === "Jefe" && (
        <View style={styles.warningBox}>
          <MaterialIcons name="info" size={16} color="#FF9800" />
          <Text style={styles.warningText}>
            Como Jefe, solo puedes invitar a Empleados y otros Jefes
          </Text>
        </View>
      )}

      {usuariosDisponibles.length === 0 && (
        <Text style={styles.emptyUsersText}>No hay usuarios disponibles</Text>
      )}

      {usuariosDisponibles.map((usuario) => (
        <TouchableOpacity
          key={usuario.uid}
          style={[
            styles.usuarioCard,
            asistentesSeleccionados.includes(usuario.uid) &&
              styles.usuarioCardSelected,
          ]}
          onPress={() => toggleAsistente(usuario.uid)}
        >
          <View style={styles.usuarioInfo}>
            <Text style={styles.usuarioNombre}>{usuario.nombre}</Text>
            <Text style={styles.usuarioRol}>{usuario.rol}</Text>
          </View>
          {asistentesSeleccionados.includes(usuario.uid) && (
            <MaterialIcons
              name="check-circle"
              size={24}
              color={COLORS.primary}
            />
          )}
        </TouchableOpacity>
      ))}

      {/* Notas adicionales */}
      <Text style={styles.label}>Notas adicionales</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Información extra..."
        value={notas}
        onChangeText={setNotas}
        multiline
        numberOfLines={3}
      />

      {/* Botón crear */}
      <TouchableOpacity
        style={[styles.crearButton, { opacity: isLoading ? 0.6 : 1 }]}
        onPress={handleCrearEvento}
        disabled={isLoading}
      >
        <MaterialIcons name="event" size={22} color="#fff" />
        <Text style={styles.crearButtonText}>
          {isLoading ? "Creando..." : "Crear Evento"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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

export default CrearEventoScreen;
