import { MaterialIcons } from "@expo/vector-icons";
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
// DateTimePicker removido 
import { useUser } from "../../context/UserContext";
import { obtenerUsuariosDeEmpresa, obtenerUsuariosPorDepartamento  } from "../../Services/empresaService";
import { crearTarea } from "../../Services/tareasService";
import { COLORS, FONT_SIZES } from "../../types/index";
import { PrioridadTarea } from "../../types/tareas";
import { cargarDepartamentos, Departamento} from "../../Services/departamentosService";

const CrearTareaScreen: React.FC = ({ navigation }: any) => {
  const { user } = useUser();

  // Estados del formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<PrioridadTarea>("Media");
  const [fechaVencimiento, setFechaVencimiento] = useState<Date | undefined>();
  const [mostrarModalFecha, setMostrarModalFecha] = useState(false);

  // Estados para el selector de fecha manual
  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().getDate());
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(
    new Date().getFullYear()
  );

  // Lista de usuarios disponibles
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<any[]>([]);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<string[]>(
    []
  );

  //Lista de departamentos disponibles
const [modoAsignacion, setModoAsignacion] = useState<"usuarios" | "departamento">("usuarios");
const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);

  //cargar departamentos de la empesa
  useEffect(() => {
  if (user?.rol === "Administrador" && user?.empresaSeleccionada) {
    cargarDepartamentos(user.empresaSeleccionada)
      .then((deptos) => {
        setDepartamentos(deptos);
      })
      .catch(() => {
        Alert.alert("Error", "No se pudieron cargar los departamentos");
      });
  }
}, [user?.rol, user?.empresaSeleccionada]);

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

  const prioridades: PrioridadTarea[] = ["Baja", "Media", "Alta", "Urgente"];

  const toggleUsuario = (uid: string) => {
    setUsuariosSeleccionados((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const confirmarFecha = () => {
    const nuevaFecha = new Date(
      anioSeleccionado,
      mesSeleccionado,
      diaSeleccionado
    );
    setFechaVencimiento(nuevaFecha);
    setMostrarModalFecha(false);
  };

  const limpiarFecha = () => {
    setFechaVencimiento(undefined);
    setMostrarModalFecha(false);
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


 const handleCrearTarea = async () => {
  if (!titulo.trim()) {
    Alert.alert("Error", "El título es obligatorio");
    return;
  }

  let uidsFinales: string[] = [];
  let nombresAsignados: string[] = [];
  let departamentoFinal: string | null = null;

  if (user?.rol === "Administrador" && modoAsignacion === "departamento") {
    if (!departamentoSeleccionado) {
      Alert.alert("Error", "Debes seleccionar un departamento");
      return;
    }

    const usuariosDepto = await obtenerUsuariosPorDepartamento(
      user?.empresaSeleccionada!,
      departamentoSeleccionado
    );

    if (usuariosDepto.length === 0) {
      Alert.alert("Error", "No hay usuarios asignados a ese departamento");
      return;
    }

    uidsFinales = usuariosDepto.map((u) => u.uid);
    nombresAsignados = usuariosDepto.map((u) => u.nombre);  // ← también faltaba esto
    departamentoFinal = departamentoSeleccionado;
  } else {
    if (usuariosSeleccionados.length === 0) {
      Alert.alert("Error", "Debes asignar la tarea a al menos un usuario");
      return;
    }
    uidsFinales = usuariosSeleccionados;
    nombresAsignados = usuariosDisponibles
      .filter((u) => usuariosSeleccionados.includes(u.uid))
      .map((u) => u.nombre);
  }

  setIsLoading(true);
  try {
    // ✅ SOLO esta llamada — usa crearTarea del tareasService (FastAPI + offline)
    await crearTarea(
      {
        titulo,
        descripcion,
        prioridad,
        fechaVencimiento,
        asignadoA: uidsFinales,
        etiquetas: [],
        tipoAsignacion: modoAsignacion,
        departamentoAsignado: departamentoFinal,
      },
      user?.uid!,
      user?.nombre!,
      user?.empresaSeleccionada!,
      user?.empresaNombre ?? "",
      nombresAsignados
    );

    Alert.alert("Éxito", "Tarea creada correctamente", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  } catch (error: any) {
    console.error("Error:", error);
    Alert.alert("Error", error.message || "No se pudo crear la tarea");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Información de la tarea</Text>

      {/* Título */}
      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Revisar informe mensual"
        value={titulo}
        onChangeText={setTitulo}
      />

      {/* Descripción */}
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Detalles de la tarea..."
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        numberOfLines={4}
      />

      {/* Prioridad */}
      <Text style={styles.label}>Prioridad</Text>
      <View style={styles.prioridadContainer}>
        {prioridades.map((p) => (
          <TouchableOpacity
            key={p}
            style={[
              styles.prioridadButton,
              prioridad === p && styles.prioridadButtonActive,
              { backgroundColor: getPrioridadColor(p, prioridad === p) },
            ]}
            onPress={() => setPrioridad(p)}
          >
            <Text
              style={[
                styles.prioridadText,
                prioridad === p && styles.prioridadTextActive,
              ]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fecha de vencimiento */}
      <Text style={styles.label}>Fecha de vencimiento (opcional)</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setMostrarModalFecha(true)}
      >
        <MaterialIcons name="event" size={20} color={COLORS.primary} />
        <Text style={styles.dateText}>
          {fechaVencimiento
            ? fechaVencimiento.toLocaleDateString("es-ES")
            : "Seleccionar fecha"}
        </Text>
      </TouchableOpacity>

      {/* Modal personalizado para seleccionar fecha */}
      <Modal
        visible={mostrarModalFecha}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarModalFecha(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Seleccionar Fecha</Text>

            {/* Selector de Año */}
            <Text style={styles.pickerLabel}>Año</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pickerScroll}
            >
              {[2024, 2025, 2026, 2027].map((anio) => (
                <TouchableOpacity
                  key={anio}
                  style={[
                    styles.pickerButton,
                    anioSeleccionado === anio && styles.pickerButtonActive,
                  ]}
                  onPress={() => setAnioSeleccionado(anio)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      anioSeleccionado === anio &&
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
                    mesSeleccionado === index && styles.pickerButtonActive,
                  ]}
                  onPress={() => setMesSeleccionado(index)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      mesSeleccionado === index &&
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
                  length: obtenerDiasDelMes(mesSeleccionado, anioSeleccionado),
                },
                (_, i) => i + 1
              ).map((dia) => (
                <TouchableOpacity
                  key={dia}
                  style={[
                    styles.pickerButton,
                    diaSeleccionado === dia && styles.pickerButtonActive,
                  ]}
                  onPress={() => setDiaSeleccionado(dia)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      diaSeleccionado === dia && styles.pickerButtonTextActive,
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
                onPress={limpiarFecha}
              >
                <Text style={styles.modalButtonSecondaryText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={confirmarFecha}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {user?.rol === "Administrador" && (
  <>
    <Text style={styles.label}>Modo de asignación</Text>
    <View style={styles.prioridadContainer}>
      <TouchableOpacity
        style={[
          styles.prioridadButton,
          modoAsignacion === "usuarios" && styles.prioridadButtonActive,
          { backgroundColor: modoAsignacion === "usuarios" ? COLORS.primary : "#f0f0f0" },
        ]}
        onPress={() => setModoAsignacion("usuarios")}
      >
        <Text
          style={[
            styles.prioridadText,
            modoAsignacion === "usuarios" && styles.prioridadTextActive,
          ]}
        >
          Usuarios
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.prioridadButton,
          modoAsignacion === "departamento" && styles.prioridadButtonActive,
          { backgroundColor: modoAsignacion === "departamento" ? COLORS.primary : "#f0f0f0" },
        ]}
        onPress={() => setModoAsignacion("departamento")}
      >
        <Text
          style={[
            styles.prioridadText,
            modoAsignacion === "departamento" && styles.prioridadTextActive,
          ]}
        >
          Departamento
        </Text>
      </TouchableOpacity>
    </View>
  </>
)}

      {/* Asignar a usuarios */}
 <Text style={styles.sectionTitle}>
  {modoAsignacion === "departamento" ? "Asignar por departamento *" : "Asignar a usuarios *"}
</Text>

{user?.rol === "Administrador" && modoAsignacion === "departamento" ? (
  <>
    {departamentos.map((depto) => (
      <TouchableOpacity
        key={depto.id}
        style={[
          styles.usuarioCard,
          departamentoSeleccionado === depto.nombre && styles.usuarioCardSelected,
        ]}
        onPress={() => setDepartamentoSeleccionado(depto.nombre)}
      >
        <View style={styles.usuarioInfo}>
          <Text style={styles.usuarioNombre}>{depto.nombre}</Text>
          <Text style={styles.usuarioRol}>Se asignará a todos sus usuarios</Text>
        </View>
        {departamentoSeleccionado === depto.nombre && (
          <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    ))}
  </>
) : (
  <>
    {user?.rol === "Jefe" && (
      <View style={styles.warningBox}>
        <MaterialIcons name="info" size={16} color="#FF9800" />
        <Text style={styles.warningText}>
          Como Jefe, solo puedes asignar tareas a Empleados y otros Jefes
        </Text>
      </View>
    )}

    {usuariosDisponibles.length === 0 && (
      <Text style={styles.emptyUsersText}>
        No hay usuarios disponibles para asignar
      </Text>
    )}

    {usuariosDisponibles.map((usuario) => (
      <TouchableOpacity
        key={usuario.uid}
        style={[
          styles.usuarioCard,
          usuariosSeleccionados.includes(usuario.uid) &&
            styles.usuarioCardSelected,
        ]}
        onPress={() => toggleUsuario(usuario.uid)}
      >
        <View style={styles.usuarioInfo}>
          <Text style={styles.usuarioNombre}>{usuario.nombre}</Text>
          <Text style={styles.usuarioRol}>{usuario.rol}</Text>
        </View>
        {usuariosSeleccionados.includes(usuario.uid) && (
          <MaterialIcons name="check-circle" size={24} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    ))}
  </>
)}

      {/* Botón crear */}
      <TouchableOpacity
        style={[styles.crearButton, { opacity: isLoading ? 0.6 : 1 }]}
        onPress={handleCrearTarea}
        disabled={isLoading}
      >
        <MaterialIcons name="add-task" size={22} color="#fff" />
        <Text style={styles.crearButtonText}>
          {isLoading ? "Creando..." : "Crear Tarea"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const getPrioridadColor = (prioridad: PrioridadTarea, isActive: boolean) => {
  if (!isActive) return "#f0f0f0";

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
    minHeight: 100,
    textAlignVertical: "top",
  },
  prioridadContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },
  prioridadButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  prioridadButtonActive: {
    borderColor: "transparent",
  },
  prioridadText: {
    fontSize: FONT_SIZES.small,
    color: "#666",
    fontWeight: "500",
  },
  prioridadTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    gap: 10,
  },
  dateText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
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
});

export default CrearTareaScreen;
