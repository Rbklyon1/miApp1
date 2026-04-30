
import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import {
  crearEventoPersonal,
  editarEventoPersonal,
  eliminarEventoPersonal,
  obtenerEventosPersonales,
  toggleCompletadoEventoPersonal,
} from "../../Services/agendaPersonal";
import {
  obtenerEventosAsignados,
  obtenerEventosCreadosPor,
  obtenerEventosDeEmpresa,
} from "../../Services/eventosService";
import { ColorAgenda, EventoPersonal, TipoAgenda } from "../../types/Agendapersonal";
import { Evento } from "../../types/eventos";
import { COLORS, FONT_SIZES } from "../../types/index";



const TIPOS_AGENDA: TipoAgenda[] = [
  "Personal",
  "Médico",
  "Recordatorio",
  "Tarea",
  "Otro",
];

const COLORES_AGENDA: { valor: ColorAgenda; label: string }[] = [
  { valor: "#2196F3", label: "Azul" },
  { valor: "#4CAF50", label: "Verde" },
  { valor: "#FF5722", label: "Naranja" },
  { valor: "#9C27B0", label: "Morado" },
  { valor: "#FF9800", label: "Ámbar" },
  { valor: "#E91E63", label: "Rosa" },
  { valor: "#00BCD4", label: "Cian" },
  { valor: "#795548", label: "Café" },
];

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

const diasDelMes = (mes: number, anio: number) =>
  new Date(anio, mes + 1, 0).getDate();


type VistaFiltro = "todos" | "asignados" | "creados";
type PestanaActiva = "corporativos" | "agenda";
type FiltroAgenda = "proximos" | "todos" | "completados";

const formVacio = () => ({
  titulo: "",
  descripcion: "",
  tipo: "Personal" as TipoAgenda,
  color: "#2196F3" as ColorAgenda,
  fechaInicio: new Date(),
  horaInicio: "09:00",
  conFechaFin: false,
  fechaFin: undefined as Date | undefined,
  horaFin: "",
  ubicacion: "",
  notas: "",
});

// ─── Componente principal ─────────────────────────────────────────────────────

const EventosScreen: React.FC = ({ navigation }: any) => {
  const { user } = useUser();
  const esAdminOJefe = user?.rol === "Administrador" || user?.rol === "Jefe";

  // ── Pestaña activa ──
  const [pestana, setPestana] = useState<PestanaActiva>("corporativos");

  // ── Eventos corporativos ──
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingCorp, setLoadingCorp] = useState(false);
  const [vistaActual, setVistaActual] = useState<VistaFiltro>("asignados");

  // ── Agenda personal ──
  const [eventosPersonales, setEventosPersonales] = useState<EventoPersonal[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [filtroAgenda, setFiltroAgenda] = useState<FiltroAgenda>("proximos");

  // ── Modal agenda ──
  const [modalAgendaVisible, setModalAgendaVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(formVacio());

  // Selectors de fecha dentro del modal
  const [modalFechaInicio, setModalFechaInicio] = useState(false);
  const [modalFechaFin, setModalFechaFin] = useState(false);
  const [diaI, setDiaI] = useState(new Date().getDate());
  const [mesI, setMesI] = useState(new Date().getMonth());
  const [anioI, setAnioI] = useState(new Date().getFullYear());
  const [diaF, setDiaF] = useState(new Date().getDate());
  const [mesF, setMesF] = useState(new Date().getMonth());
  const [anioF, setAnioF] = useState(new Date().getFullYear());

  const slideAnim = useRef(new Animated.Value(600)).current;

  
  useEffect(() => {
    if (user?.empresaSeleccionada) cargarEventosCorp();
  }, [user?.empresaSeleccionada, vistaActual]);

  useEffect(() => {
    if (user?.uid) cargarAgenda();
  }, [user?.uid, filtroAgenda]);

  const cargarEventosCorp = useCallback(async () => {
    if (!user?.empresaSeleccionada) return;
    setLoadingCorp(true);
    try {
      let data: Evento[] = [];
      switch (vistaActual) {
        case "todos":
          data = await obtenerEventosDeEmpresa(user.empresaSeleccionada);
          break;
        case "asignados":
          data = await obtenerEventosAsignados(user.uid, user.empresaSeleccionada);
          break;
        case "creados":
          data = await obtenerEventosCreadosPor(user.uid, user.empresaSeleccionada);
          break;
      }
      setEventos(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los eventos");
    } finally {
      setLoadingCorp(false);
    }
  }, [user?.empresaSeleccionada, user?.uid, vistaActual]);

  const cargarAgenda = useCallback(async () => {
    if (!user?.uid) return;
    setLoadingAgenda(true);
    try {
      const todos = await obtenerEventosPersonales(user.uid);
      const ahora = new Date();
      let filtrados: EventoPersonal[];
      switch (filtroAgenda) {
        case "proximos":
          filtrados = todos.filter(
            (e) => new Date(e.fechaInicio) >= ahora && !e.completado
          );
          break;
        case "completados":
          filtrados = todos.filter((e) => e.completado);
          break;
        default:
          filtrados = todos;
      }
      setEventosPersonales(filtrados);
    } catch {
      Alert.alert("Error", "No se pudo cargar tu agenda");
    } finally {
      setLoadingAgenda(false);
    }
  }, [user?.uid, filtroAgenda]);

  
  const abrirModalNuevo = () => {
    setEditandoId(null);
    setForm(formVacio());
    sincronizarSelectorFecha(new Date(), "inicio");
    setModalAgendaVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const abrirModalEdicion = (ev: EventoPersonal) => {
    setEditandoId(ev.id);
    const fi = new Date(ev.fechaInicio);
    const ff = ev.fechaFin ? new Date(ev.fechaFin) : undefined;
    setForm({
      titulo: ev.titulo,
      descripcion: ev.descripcion || "",
      tipo: ev.tipo,
      color: ev.color,
      fechaInicio: fi,
      horaInicio: ev.horaInicio,
      conFechaFin: !!ff,
      fechaFin: ff,
      horaFin: ev.horaFin || "",
      ubicacion: ev.ubicacion || "",
      notas: ev.notas || "",
    });
    sincronizarSelectorFecha(fi, "inicio");
    if (ff) sincronizarSelectorFecha(ff, "fin");
    setModalAgendaVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const cerrarModal = () => {
    Animated.timing(slideAnim, {
      toValue: 600,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setModalAgendaVisible(false);
      setModalFechaInicio(false);
      setModalFechaFin(false);
    });
  };

  const sincronizarSelectorFecha = (fecha: Date, cual: "inicio" | "fin") => {
    if (cual === "inicio") {
      setDiaI(fecha.getDate());
      setMesI(fecha.getMonth());
      setAnioI(fecha.getFullYear());
    } else {
      setDiaF(fecha.getDate());
      setMesF(fecha.getMonth());
      setAnioF(fecha.getFullYear());
    }
  };

  const confirmarFechaInicio = () => {
    const nueva = new Date(anioI, mesI, diaI);
    setForm((f) => ({ ...f, fechaInicio: nueva }));
    setModalFechaInicio(false);
  };

  const confirmarFechaFin = () => {
    const nueva = new Date(anioF, mesF, diaF);
    setForm((f) => ({ ...f, fechaFin: nueva }));
    setModalFechaFin(false);
  };

  const setFormField = <K extends keyof ReturnType<typeof formVacio>>(
    campo: K,
    valor: ReturnType<typeof formVacio>[K]
  ) => setForm((f) => ({ ...f, [campo]: valor }));

  
  const handleGuardarAgenda = async () => {
    if (!form.titulo.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }
    if (!user?.uid) return;
    setGuardando(true);
    try {
      const datos = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        tipo: form.tipo,
        color: form.color,
        fechaInicio: form.fechaInicio,
        horaInicio: form.horaInicio,
        fechaFin: form.conFechaFin ? form.fechaFin : undefined,
        horaFin: form.conFechaFin && form.horaFin.trim() ? form.horaFin.trim() : undefined,
        ubicacion: form.ubicacion.trim() || undefined,
        notas: form.notas.trim() || undefined,
      };

      if (editandoId) {
        await editarEventoPersonal(editandoId, user.uid, datos);
      } else {
        await crearEventoPersonal(datos, user.uid);
      }

      cerrarModal();
      cargarAgenda();
    } catch {
      Alert.alert("Error", "No se pudo guardar el evento");
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleCompletado = async (ev: EventoPersonal) => {
    if (!user?.uid) return;
    try {
      await toggleCompletadoEventoPersonal(ev.id, user.uid, !ev.completado);
      setEventosPersonales((prev) =>
        prev
          .map((e) => (e.id === ev.id ? { ...e, completado: !e.completado } : e))
          .filter((e) => {
            if (filtroAgenda === "proximos")
              return new Date(e.fechaInicio) >= new Date() && !e.completado;
            if (filtroAgenda === "completados") return e.completado;
            return true;
          })
      );
    } catch {
      Alert.alert("Error", "No se pudo actualizar el estado");
    }
  };

  const handleEliminarPersonal = (ev: EventoPersonal) => {
    Alert.alert("Eliminar", `¿Eliminar "${ev.titulo}" de tu agenda?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await eliminarEventoPersonal(ev.id, user!.uid);
            setEventosPersonales((prev) => prev.filter((e) => e.id !== ev.id));
          } catch {
            Alert.alert("Error", "No se pudo eliminar");
          }
        },
      },
    ]);
  };

  
  const formatearFechaCorp = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatearFechaPersonal = (fechaISO: string) => {
    const fecha = new Date(fechaISO);
    const hoy = new Date();
    const maniana = new Date();
    maniana.setDate(hoy.getDate() + 1);
    if (fecha.toDateString() === hoy.toDateString()) return "Hoy";
    if (fecha.toDateString() === maniana.toDateString()) return "Mañana";
    return fecha.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const esEventoPasado = (fecha: string) => new Date(fecha) < new Date();

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "Reunión": return "#2196F3";
      case "Capacitación": return "#9C27B0";
      case "Evaluación": return "#FF5722";
      case "Social": return "#4CAF50";
      default: return "#9E9E9E";
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Confirmado": return "#4CAF50";
      case "Rechazado": return "#F44336";
      case "Pendiente": return "#FF9800";
      case "Asistió": return "#2196F3";
      default: return "#9E9E9E";
    }
  };

 
  const renderEventoCorp = ({ item }: { item: Evento }) => {
    const isPasado = esEventoPasado(item.fechaInicio);
    const miEstado = item.asistentes.find((a) => a.uid === user?.uid)?.estadoAsistencia;

    return (
      <TouchableOpacity
        style={[styles.eventoCard, isPasado && styles.eventoCardPasado]}
        onPress={() => navigation.navigate("DetalleEvento", { eventoId: item.id })}
      >
        <View style={styles.eventoHeader}>
          <View style={styles.eventoHeaderLeft}>
            <Text style={styles.eventoTitulo} numberOfLines={1}>
              {item.titulo}
            </Text>
            <View style={[styles.tipoBadge, { backgroundColor: getTipoColor(item.tipo) }]}>
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
            <MaterialIcons name="event" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              {formatearFechaCorp(item.fechaInicio)} • {item.horaInicio}
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
            <MaterialIcons name="people" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              {item.asistentes.length} asistente{item.asistentes.length !== 1 ? "s" : ""}
            </Text>
          </View>
          {miEstado && (
            <View style={styles.estadoBadgeContainer}>
              <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(miEstado) }]}>
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

  const renderEventoPersonal = ({ item }: { item: EventoPersonal }) => {
    const pasado = esEventoPasado(item.fechaInicio);

    return (
      <View
        style={[
          styles.cardPersonal,
          item.completado && styles.cardPersonalCompletado,
          { borderLeftColor: item.color },
        ]}
      >
        <TouchableOpacity
          style={styles.checkBtn}
          onPress={() => handleToggleCompletado(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons
            name={item.completado ? "check-circle" : "radio-button-unchecked"}
            size={24}
            color={item.completado ? "#4CAF50" : "#ccc"}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.cardPersonalBody} onPress={() => abrirModalEdicion(item)}>
          <Text
            style={[styles.cardPersonalTitulo, item.completado && styles.tachado]}
            numberOfLines={1}
          >
            {item.titulo}
          </Text>
          <View style={styles.cardPersonalMeta}>
            <View style={[styles.tipoBadgePersonal, { backgroundColor: item.color }]}>
              <Text style={styles.tipoText}>{item.tipo}</Text>
            </View>
            <Text style={styles.infoText}>
              {formatearFechaPersonal(item.fechaInicio)} • {item.horaInicio}
            </Text>
          </View>
          {item.descripcion ? (
            <Text
              style={[styles.eventoDescripcion, item.completado && styles.tachado]}
              numberOfLines={1}
            >
              {item.descripcion}
            </Text>
          ) : null}
        </TouchableOpacity>

        <View style={styles.cardPersonalAcciones}>
          {pasado && !item.completado && (
            <View style={styles.vencidoBadge}>
              <Text style={styles.vencidoText}>VENCIDO</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => handleEliminarPersonal(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="delete-outline" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSelectorFecha = (
    titulo: string,
    dia: number,
    mes: number,
    anio: number,
    setDia: (v: number) => void,
    setMes: (v: number) => void,
    setAnio: (v: number) => void,
    onConfirmar: () => void,
    onCancelar: () => void
  ) => (
    <Modal visible transparent animationType="fade" onRequestClose={onCancelar}>
      <TouchableWithoutFeedback onPress={onCancelar}>
        <View style={styles.selectorOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.selectorBox}>
              <Text style={styles.selectorTitulo}>{titulo}</Text>

              <Text style={styles.selectorLabel}>Año</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {[anio - 1, anio, anio + 1, anio + 2].map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.selectorItem, anio === a && styles.selectorItemActive]}
                    onPress={() => setAnio(a)}
                  >
                    <Text style={[styles.selectorItemText, anio === a && styles.selectorItemTextActive]}>
                      {a}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.selectorLabel}>Mes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {MESES.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.selectorItem, mes === i && styles.selectorItemActive]}
                    onPress={() => setMes(i)}
                  >
                    <Text style={[styles.selectorItemText, mes === i && styles.selectorItemTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.selectorLabel}>Día</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
                {Array.from({ length: diasDelMes(mes, anio) }, (_, i) => i + 1).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.selectorItem, dia === d && styles.selectorItemActive]}
                    onPress={() => setDia(d)}
                  >
                    <Text style={[styles.selectorItemText, dia === d && styles.selectorItemTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.selectorBotones}>
                <TouchableOpacity style={styles.selectorBtnSecundario} onPress={onCancelar}>
                  <Text style={styles.selectorBtnTextoOscuro}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.selectorBtnPrimario} onPress={onConfirmar}>
                  <Text style={styles.selectorBtnTextoClaro}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderModalAgenda = () => (
    <Modal
      visible={modalAgendaVisible}
      transparent
      animationType="none"
      onRequestClose={cerrarModal}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Fondo oscuro */}
        <TouchableWithoutFeedback onPress={cerrarModal}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        {/* Sheet animado */}
        <Animated.View
          style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Handle */}
          <View style={styles.modalHandle} />

          {/* Cabecera */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <MaterialIcons name="lock" size={16} color="#607D8B" />
              <Text style={styles.modalHeaderTitulo}>
                {editandoId ? "Editar evento personal" : "Nuevo evento personal"}
              </Text>
            </View>
            <TouchableOpacity onPress={cerrarModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Título */}
            <Text style={styles.formLabel}>Título *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ej: Cita médica, recordatorio..."
              value={form.titulo}
              onChangeText={(v) => setFormField("titulo", v)}
              maxLength={80}
            />

            {/* Tipo */}
            <Text style={styles.formLabel}>Tipo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {TIPOS_AGENDA.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.chip,
                    form.tipo === t && { backgroundColor: form.color, borderColor: form.color },
                  ]}
                  onPress={() => setFormField("tipo", t)}
                >
                  <Text style={[styles.chipText, form.tipo === t && styles.chipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Color */}
            <Text style={styles.formLabel}>Color</Text>
            <View style={styles.colorRow}>
              {COLORES_AGENDA.map((c) => (
                <TouchableOpacity
                  key={c.valor}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c.valor },
                    form.color === c.valor && styles.colorCircleSelected,
                  ]}
                  onPress={() => setFormField("color", c.valor)}
                >
                  {form.color === c.valor && (
                    <MaterialIcons name="check" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Descripción */}
            <Text style={styles.formLabel}>Descripción</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Detalles opcionales..."
              value={form.descripcion}
              onChangeText={(v) => setFormField("descripcion", v)}
              multiline
              numberOfLines={2}
            />

            {/* Fecha y hora inicio */}
            <Text style={styles.formLabel}>Fecha y hora</Text>
            <View style={styles.formFila}>
              <TouchableOpacity
                style={[styles.formDateBtn, { flex: 1.4 }]}
                onPress={() => setModalFechaInicio(true)}
              >
                <MaterialIcons name="event" size={16} color={form.color} />
                <Text style={styles.formDateBtnText}>
                  {form.fechaInicio.toLocaleDateString("es-ES")}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.formInput, { flex: 0.8, marginBottom: 0 }]}
                placeholder="09:00"
                value={form.horaInicio}
                onChangeText={(v) => setFormField("horaInicio", v)}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            {/* Toggle fecha fin */}
            <View style={styles.switchRow}>
              <Text style={styles.formLabel}>Agregar hora de fin</Text>
              <Switch
                value={form.conFechaFin}
                onValueChange={(v) => setFormField("conFechaFin", v)}
                thumbColor={form.conFechaFin ? form.color : "#ccc"}
                trackColor={{ false: "#e0e0e0", true: form.color + "60" }}
              />
            </View>

            {form.conFechaFin && (
              <View style={styles.formFila}>
                <TouchableOpacity
                  style={[styles.formDateBtn, { flex: 1.4 }]}
                  onPress={() => setModalFechaFin(true)}
                >
                  <MaterialIcons name="event" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.formDateBtnText}>
                    {form.fechaFin
                      ? form.fechaFin.toLocaleDateString("es-ES")
                      : "Seleccionar fecha"}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.formInput, { flex: 0.8, marginBottom: 0 }]}
                  placeholder="18:00"
                  value={form.horaFin}
                  onChangeText={(v) => setFormField("horaFin", v)}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            )}

            {/* Ubicación */}
            <Text style={[styles.formLabel, { marginTop: 10 }]}>Ubicación</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Lugar opcional..."
              value={form.ubicacion}
              onChangeText={(v) => setFormField("ubicacion", v)}
            />

            {/* Notas */}
            <Text style={styles.formLabel}>Notas</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Apuntes adicionales..."
              value={form.notas}
              onChangeText={(v) => setFormField("notas", v)}
              multiline
              numberOfLines={2}
            />

            {/* Guardar */}
            <TouchableOpacity
              style={[
                styles.guardarBtn,
                { backgroundColor: form.color },
                guardando && { opacity: 0.6 },
              ]}
              onPress={handleGuardarAgenda}
              disabled={guardando}
            >
              <MaterialIcons
                name={editandoId ? "save" : "add-circle"}
                size={20}
                color="#fff"
              />
              <Text style={styles.guardarBtnText}>
                {guardando
                  ? "Guardando..."
                  : editandoId
                  ? "Guardar cambios"
                  : "Añadir a mi agenda"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Selectores de fecha anidados */}
      {modalFechaInicio &&
        renderSelectorFecha(
          "Fecha de inicio",
          diaI, mesI, anioI,
          setDiaI, setMesI, setAnioI,
          confirmarFechaInicio,
          () => setModalFechaInicio(false)
        )}
      {modalFechaFin &&
        renderSelectorFecha(
          "Fecha de fin",
          diaF, mesF, anioF,
          setDiaF, setMesF, setAnioF,
          confirmarFechaFin,
          () => setModalFechaFin(false)
        )}
    </Modal>
  );

  return (
    <View style={styles.container}>

      {/* ── Pestañas principales ── */}
      <View style={styles.pestanasContainer}>
        <TouchableOpacity
          style={[styles.pestana, pestana === "corporativos" && styles.pestanaActive]}
          onPress={() => setPestana("corporativos")}
        >
          <MaterialIcons
            name="business"
            size={16}
            color={pestana === "corporativos" ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.pestanaText,
              pestana === "corporativos" && styles.pestanaTextActive,
            ]}
          >
            Corporativos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pestana, pestana === "agenda" && styles.pestanaActive]}
          onPress={() => setPestana("agenda")}
        >
          <MaterialIcons
            name="lock"
            size={16}
            color={pestana === "agenda" ? "#607D8B" : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.pestanaText,
              pestana === "agenda" && styles.pestanaTextAgenda,
            ]}
          >
            Mi Agenda
          </Text>
        </TouchableOpacity>
      </View>

      {pestana === "corporativos" && (
        <>
          <View style={styles.filtrosContainer}>
            {(
              [
                { key: "asignados", label: "Mis Eventos" },
                { key: "creados", label: "Creados por mí" },
                ...(esAdminOJefe ? [{ key: "todos", label: "Todos" }] : []),
              ] as { key: VistaFiltro; label: string }[]
            ).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filtroButton,
                  vistaActual === f.key && styles.filtroButtonActive,
                ]}
                onPress={() => setVistaActual(f.key)}
              >
                <Text
                  style={[
                    styles.filtroText,
                    vistaActual === f.key && styles.filtroTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={eventos}
            keyExtractor={(item) => item.id}
            renderItem={renderEventoCorp}
            refreshControl={
              <RefreshControl refreshing={loadingCorp} onRefresh={cargarEventosCorp} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="event-busy" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No hay eventos disponibles</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />

          {esAdminOJefe && (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => navigation.navigate("CrearEvento")}
            >
              <MaterialIcons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </>
      )}

      {pestana === "agenda" && (
        <>
          {/* Banner privacidad */}
          <View style={styles.privacidadBanner}>
            <MaterialIcons name="lock" size={13} color="#607D8B" />
            <Text style={styles.privacidadText}>
              Solo visible para ti · No se comparte con la empresa
            </Text>
          </View>

          {/* Filtros agenda */}
          <View style={styles.filtrosContainer}>
            {(
              [
                { key: "proximos", label: "Próximos" },
                { key: "todos", label: "Todos" },
                { key: "completados", label: "Completados" },
              ] as { key: FiltroAgenda; label: string }[]
            ).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filtroButton,
                  filtroAgenda === f.key && styles.filtroButtonAgendaActive,
                ]}
                onPress={() => setFiltroAgenda(f.key)}
              >
                <Text
                  style={[
                    styles.filtroText,
                    filtroAgenda === f.key && styles.filtroTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={eventosPersonales}
            keyExtractor={(item) => item.id}
            renderItem={renderEventoPersonal}
            refreshControl={
              <RefreshControl refreshing={loadingAgenda} onRefresh={cargarAgenda} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="event-note" size={64} color="#ddd" />
                <Text style={styles.emptyText}>
                  {filtroAgenda === "proximos"
                    ? "Sin eventos próximos"
                    : filtroAgenda === "completados"
                    ? "Sin eventos completados"
                    : "Tu agenda está vacía"}
                </Text>
                <Text style={styles.emptySubText}>
                  Toca + para añadir un evento personal
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />

          {/* FAB agenda — disponible para todos los roles */}
          <TouchableOpacity style={styles.fabAgenda} onPress={abrirModalNuevo}>
            <MaterialIcons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Modal agenda personal */}
      {renderModalAgenda()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Pestañas ──
  pestanasContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  pestana: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  pestanaActive: {
    borderBottomColor: COLORS.primary,
  },
  pestanaText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  pestanaTextActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  pestanaTextAgenda: {
    color: "#607D8B",
    fontWeight: "bold",
  },

  // ── Filtros ──
  filtrosContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.surface,
    elevation: 2,
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  filtroButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filtroButtonAgendaActive: {
    backgroundColor: "#607D8B",
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

  // ── Banner privacidad ──
  privacidadBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    backgroundColor: "#ECEFF1",
    borderBottomWidth: 1,
    borderBottomColor: "#CFD8DC",
  },
  privacidadText: {
    fontSize: 11,
    color: "#607D8B",
    fontWeight: "500",
  },

  // ── Lista ──
  listContent: {
    padding: 14,
    paddingBottom: 90,
  },

  // ── Tarjeta corporativa ──
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
  eventoCardPasado: { opacity: 0.7 },
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
  eventoFooter: { gap: 6 },
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
  estadoBadgeContainer: { marginTop: 8 },
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

  // ── Tarjeta personal ──
  cardPersonal: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    marginBottom: 10,
    padding: 13,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    gap: 10,
  },
  cardPersonalCompletado: {
    opacity: 0.6,
    backgroundColor: "#FAFAFA",
  },
  checkBtn: { paddingTop: 2 },
  cardPersonalBody: { flex: 1 },
  cardPersonalTitulo: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  cardPersonalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  tipoBadgePersonal: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardPersonalAcciones: {
    alignItems: "flex-end",
    gap: 6,
  },
  vencidoBadge: {
    backgroundColor: "rgba(244,67,54,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(244,67,54,0.25)",
  },
  vencidoText: {
    fontSize: 9,
    color: "#F44336",
    fontWeight: "bold",
  },
  tachado: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },

  // ── Empty ──
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    marginTop: 15,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },

  // ── FABs ──
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
  fabAgenda: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#607D8B",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  // ── Modal sheet ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "82%",
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  modalHeaderTitulo: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // ── Formulario del modal ──
  formLabel: {
    fontSize: FONT_SIZES.small,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 7,
  },
  formInput: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: FONT_SIZES.small,
    marginBottom: 14,
    color: COLORS.text,
  },
  formTextArea: {
    minHeight: 65,
    textAlignVertical: "top",
  },
  formFila: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    alignItems: "center",
  },
  formDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 9,
    gap: 6,
  },
  formDateBtnText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  chipText: {
    fontSize: FONT_SIZES.small,
    color: "#666",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  colorCircleSelected: {
    borderWidth: 2.5,
    borderColor: "#000",
  },
  guardarBtn: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 20,
    gap: 8,
    elevation: 2,
  },
  guardarBtnText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },

  // ── Selector de fecha anidado ──
  selectorOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectorBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    width: "88%",
    maxHeight: "75%",
  },
  selectorTitulo: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: FONT_SIZES.small,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 6,
  },
  selectorScroll: { maxHeight: 48 },
  selectorItem: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginRight: 7,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    minWidth: 50,
    alignItems: "center",
  },
  selectorItemActive: { backgroundColor: COLORS.primary },
  selectorItemText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
  },
  selectorItemTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  selectorBotones: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
    gap: 8,
  },
  selectorBtnSecundario: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  selectorBtnPrimario: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  selectorBtnTextoOscuro: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    fontWeight: "600",
  },
  selectorBtnTextoClaro: {
    fontSize: FONT_SIZES.small,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default EventosScreen;
