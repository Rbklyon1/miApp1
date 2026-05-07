import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { useAgendaPersonal } from "../../Hooks/Eventos/useAgendaPersonal";
import { useEventosCorporativos } from "../../Hooks/Eventos/useEventosCorporativos";
import {
  ColorAgenda,
  EventoPersonal,
  TipoAgenda,
} from "../../types/Agendapersonal";
import { Evento } from "../../types/eventos";
import { COLORS, FONT_SIZES } from "../../types/index";

type PestanaActiva = "corporativos" | "agenda";
type FiltroAgenda = "proximos" | "todos" | "completados";

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
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const diasDelMes = (mes: number, anio: number) =>
  new Date(anio, mes + 1, 0).getDate();

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

const EventosScreen: React.FC = ({ navigation }: any) => {
  const { user } = useUser();

  const [pestana, setPestana] = useState<PestanaActiva>("corporativos");
  const [filtroAgenda, setFiltroAgenda] = useState<FiltroAgenda>("proximos");

  const eventosCorp = useEventosCorporativos(user);
  const agenda = useAgendaPersonal(user?.uid);

  const puedeCrearEventoCorporativo =
    user?.rol === "Administrador" || user?.rol === "Jefe";

  // Modal agenda
  const [modalAgendaVisible, setModalAgendaVisible] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(formVacio());

  // Selectores de fecha
  const [modalFechaInicio, setModalFechaInicio] = useState(false);
  const [modalFechaFin, setModalFechaFin] = useState(false);

  const [diaI, setDiaI] = useState(new Date().getDate());
  const [mesI, setMesI] = useState(new Date().getMonth());
  const [anioI, setAnioI] = useState(new Date().getFullYear());

  const [diaF, setDiaF] = useState(new Date().getDate());
  const [mesF, setMesF] = useState(new Date().getMonth());
  const [anioF, setAnioF] = useState(new Date().getFullYear());

  const slideAnim = useRef(new Animated.Value(600)).current;

  const eventosAgendaFiltrados = useMemo(() => {
    const ahora = new Date();

    switch (filtroAgenda) {
      case "proximos":
        return agenda.eventos.filter(
          (e: EventoPersonal) =>
            new Date(e.fechaInicio) >= ahora && !e.completado
        );
      case "completados":
        return agenda.eventos.filter((e: EventoPersonal) => e.completado);
      default:
        return agenda.eventos;
    }
  }, [agenda.eventos, filtroAgenda]);

  const setFormField = <K extends keyof ReturnType<typeof formVacio>>(
    campo: K,
    valor: ReturnType<typeof formVacio>[K]
  ) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const sincronizarSelectorFecha = (fecha: Date, tipo: "inicio" | "fin") => {
    if (tipo === "inicio") {
      setDiaI(fecha.getDate());
      setMesI(fecha.getMonth());
      setAnioI(fecha.getFullYear());
    } else {
      setDiaF(fecha.getDate());
      setMesF(fecha.getMonth());
      setAnioF(fecha.getFullYear());
    }
  };

  const abrirModalNuevo = () => {
    setEditandoId(null);
    const nuevoForm = formVacio();
    setForm(nuevoForm);
    sincronizarSelectorFecha(nuevoForm.fechaInicio, "inicio");
    setModalAgendaVisible(true);

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const abrirModalEdicion = (evento: EventoPersonal) => {
    const fechaInicio = new Date(evento.fechaInicio);
    const fechaFin = evento.fechaFin ? new Date(evento.fechaFin) : undefined;

    setEditandoId(evento.id);
    setForm({
      titulo: evento.titulo,
      descripcion: evento.descripcion || "",
      tipo: evento.tipo,
      color: evento.color,
      fechaInicio,
      horaInicio: evento.horaInicio,
      conFechaFin: !!fechaFin,
      fechaFin,
      horaFin: evento.horaFin || "",
      ubicacion: evento.ubicacion || "",
      notas: evento.notas || "",
    });

    sincronizarSelectorFecha(fechaInicio, "inicio");
    if (fechaFin) sincronizarSelectorFecha(fechaFin, "fin");

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

  const confirmarFechaInicio = () => {
    const nuevaFecha = new Date(anioI, mesI, diaI);
    setFormField("fechaInicio", nuevaFecha);
    setModalFechaInicio(false);
  };

  const confirmarFechaFin = () => {
    const nuevaFecha = new Date(anioF, mesF, diaF);
    setFormField("fechaFin", nuevaFecha);
    setModalFechaFin(false);
  };

  const handleGuardarAgenda = async () => {
    if (!form.titulo.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || undefined,
        tipo: form.tipo,
        color: form.color,
        fechaInicio: form.fechaInicio,
        horaInicio: form.horaInicio,
        fechaFin: form.conFechaFin ? form.fechaFin : undefined,
        horaFin:
          form.conFechaFin && form.horaFin.trim()
            ? form.horaFin.trim()
            : undefined,
        ubicacion: form.ubicacion.trim() || undefined,
        notas: form.notas.trim() || undefined,
      };

      if (editandoId) {
        await agenda.editar(editandoId, datos);
      } else {
        await agenda.crear(datos);
      }

      cerrarModal();
    } catch {
      Alert.alert("Error", "No se pudo guardar el evento personal");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminarPersonal = (evento: EventoPersonal) => {
    Alert.alert("Eliminar", `¿Eliminar "${evento.titulo}" de tu agenda?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => agenda.eliminar(evento.id),
      },
    ]);
  };

  const formatearFecha = (fechaISO: string) =>
    new Date(fechaISO).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const renderEventoCorp = ({ item }: { item: Evento }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("DetalleEvento", { eventoId: item.id })}
    >
      <Text style={styles.cardTitle}>{item.titulo}</Text>
      <Text style={styles.cardText}>
        {formatearFecha(item.fechaInicio)} • {item.horaInicio}
      </Text>
      <Text style={styles.cardText}>
        {item.esVirtual ? "Virtual" : item.ubicacion || "Sin ubicación"}
      </Text>
    </TouchableOpacity>
  );

  const renderEventoPersonal = ({ item }: { item: EventoPersonal }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 5 }]}
      onPress={() => abrirModalEdicion(item)}
    >
      <Text
        style={[
          styles.cardTitle,
          item.completado && styles.textoCompletado,
        ]}
      >
        {item.titulo}
      </Text>

      <Text
        style={[
          styles.cardText,
          item.completado && styles.textoCompletado,
        ]}
      >
        {formatearFecha(item.fechaInicio)} • {item.horaInicio}
      </Text>

      {!!item.descripcion && (
        <Text
          style={[
            styles.cardText,
            item.completado && styles.textoCompletado,
          ]}
          numberOfLines={2}
        >
          {item.descripcion}
        </Text>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => agenda.toggle(item.id, !item.completado)}
        >
          <MaterialIcons
            name={item.completado ? "check-circle" : "radio-button-unchecked"}
            size={24}
            color={item.completado ? COLORS.success : COLORS.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => confirmarEliminarPersonal(item)}>
          <MaterialIcons name="delete-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[anio - 1, anio, anio + 1, anio + 2].map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[
                      styles.selectorItem,
                      anio === a && styles.selectorItemActive,
                    ]}
                    onPress={() => setAnio(a)}
                  >
                    <Text
                      style={[
                        styles.selectorItemText,
                        anio === a && styles.selectorItemTextActive,
                      ]}
                    >
                      {a}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.selectorLabel}>Mes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {MESES.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.selectorItem,
                      mes === i && styles.selectorItemActive,
                    ]}
                    onPress={() => setMes(i)}
                  >
                    <Text
                      style={[
                        styles.selectorItemText,
                        mes === i && styles.selectorItemTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.selectorLabel}>Día</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Array.from({ length: diasDelMes(mes, anio) }, (_, i) => i + 1).map(
                  (d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.selectorItem,
                        dia === d && styles.selectorItemActive,
                      ]}
                      onPress={() => setDia(d)}
                    >
                      <Text
                        style={[
                          styles.selectorItemText,
                          dia === d && styles.selectorItemTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              <View style={styles.selectorBotones}>
                <TouchableOpacity
                  style={styles.selectorBtnSecundario}
                  onPress={onCancelar}
                >
                  <Text style={styles.selectorBtnTextoOscuro}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.selectorBtnPrimario}
                  onPress={onConfirmar}
                >
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
        <TouchableWithoutFeedback onPress={cerrarModal}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <MaterialIcons name="lock" size={16} color="#607D8B" />
              <Text style={styles.modalHeaderTitulo}>
                {editandoId ? "Editar evento personal" : "Nuevo evento personal"}
              </Text>
            </View>

            <TouchableOpacity onPress={cerrarModal}>
              <MaterialIcons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.formLabel}>Título *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Ej: Cita médica, recordatorio..."
              value={form.titulo}
              onChangeText={(v) => setFormField("titulo", v)}
            />

            <Text style={styles.formLabel}>Tipo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TIPOS_AGENDA.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.chip,
                    form.tipo === t && {
                      backgroundColor: form.color,
                      borderColor: form.color,
                    },
                  ]}
                  onPress={() => setFormField("tipo", t)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.tipo === t && styles.chipTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

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

            <Text style={styles.formLabel}>Descripción</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Detalles opcionales..."
              value={form.descripcion}
              onChangeText={(v) => setFormField("descripcion", v)}
              multiline
            />

            <Text style={styles.formLabel}>Fecha y hora</Text>
            <View style={styles.formFila}>
              <TouchableOpacity
                style={[styles.formDateBtn, { flex: 1.4 }]}
                onPress={() => setModalFechaInicio(true)}
              >
                <MaterialIcons name="event" size={16} color={form.color} />
                <Text style={styles.formDateBtnText}>
                  {form.fechaInicio.toLocaleDateString("es-MX")}
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
                  <MaterialIcons
                    name="event"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.formDateBtnText}>
                    {form.fechaFin
                      ? form.fechaFin.toLocaleDateString("es-MX")
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

            <Text style={styles.formLabel}>Ubicación</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Lugar opcional..."
              value={form.ubicacion}
              onChangeText={(v) => setFormField("ubicacion", v)}
            />

            <Text style={styles.formLabel}>Notas</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Apuntes adicionales..."
              value={form.notas}
              onChangeText={(v) => setFormField("notas", v)}
              multiline
            />

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

      {modalFechaInicio &&
        renderSelectorFecha(
          "Fecha de inicio",
          diaI,
          mesI,
          anioI,
          setDiaI,
          setMesI,
          setAnioI,
          confirmarFechaInicio,
          () => setModalFechaInicio(false)
        )}

      {modalFechaFin &&
        renderSelectorFecha(
          "Fecha de fin",
          diaF,
          mesF,
          anioF,
          setDiaF,
          setMesF,
          setAnioF,
          confirmarFechaFin,
          () => setModalFechaFin(false)
        )}
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            pestana === "corporativos" && styles.tabButtonActive,
          ]}
          onPress={() => setPestana("corporativos")}
        >
          <Text
            style={[
              styles.tabText,
              pestana === "corporativos" && styles.tabTextActive,
            ]}
          >
            Corporativos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            pestana === "agenda" && styles.tabButtonAgendaActive,
          ]}
          onPress={() => setPestana("agenda")}
        >
          <Text
            style={[
              styles.tabText,
              pestana === "agenda" && styles.tabTextAgendaActive,
            ]}
          >
            Mi agenda
          </Text>
        </TouchableOpacity>
      </View>

      {pestana === "corporativos" && (
        <>
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                eventosCorp.vistaActual === "asignados" &&
                  styles.filterButtonActive,
              ]}
              onPress={() => eventosCorp.setVistaActual("asignados")}
            >
              <Text
                style={[
                  styles.filterText,
                  eventosCorp.vistaActual === "asignados" &&
                    styles.filterTextActive,
                ]}
              >
                Asignados
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                eventosCorp.vistaActual === "creados" &&
                  styles.filterButtonActive,
              ]}
              onPress={() => eventosCorp.setVistaActual("creados")}
            >
              <Text
                style={[
                  styles.filterText,
                  eventosCorp.vistaActual === "creados" &&
                    styles.filterTextActive,
                ]}
              >
                Creados
              </Text>
            </TouchableOpacity>

            {user?.rol === "Administrador" && (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  eventosCorp.vistaActual === "todos" &&
                    styles.filterButtonActive,
                ]}
                onPress={() => eventosCorp.setVistaActual("todos")}
              >
                <Text
                  style={[
                    styles.filterText,
                    eventosCorp.vistaActual === "todos" &&
                      styles.filterTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={eventosCorp.eventos}
            keyExtractor={(item) => item.id}
            renderItem={renderEventoCorp}
            refreshing={eventosCorp.loading}
            onRefresh={eventosCorp.refetch}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay eventos corporativos</Text>
            }
          />

          {puedeCrearEventoCorporativo && (
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
          <View style={styles.privacidadBanner}>
            <MaterialIcons name="lock" size={13} color="#607D8B" />
            <Text style={styles.privacidadText}>
              Solo visible para ti · No se comparte con la empresa
            </Text>
          </View>

          <View style={styles.filtersContainer}>
            {[
              { key: "proximos", label: "Próximos" },
              { key: "todos", label: "Todos" },
              { key: "completados", label: "Completados" },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.filterButton,
                  filtroAgenda === f.key && styles.filterButtonAgendaActive,
                ]}
                onPress={() => setFiltroAgenda(f.key as FiltroAgenda)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filtroAgenda === f.key && styles.filterTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={eventosAgendaFiltrados}
            keyExtractor={(item) => item.id}
            renderItem={renderEventoPersonal}
            refreshing={agenda.loading}
            onRefresh={agenda.refetch}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No tienes eventos personales</Text>
            }
          />

          <TouchableOpacity style={styles.fabAgenda} onPress={abrirModalNuevo}>
            <MaterialIcons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {renderModalAgenda()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 10,
    gap: 10,
  },
  tabButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#eee",
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonAgendaActive: {
    backgroundColor: "#607D8B",
  },
  tabText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: "bold",
  },
  tabTextActive: {
    color: "#fff",
  },
  tabTextAgendaActive: {
    color: "#fff",
  },

  filtersContainer: {
    flexDirection: "row",
    padding: 10,
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  filterButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonAgendaActive: {
    backgroundColor: "#607D8B",
  },
  filterText: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: FONT_SIZES.small,
  },
  filterTextActive: {
    color: "#fff",
  },

  privacidadBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    backgroundColor: "#ECEFF1",
  },
  privacidadText: {
    fontSize: FONT_SIZES.small,
    color: "#607D8B",
  },

  listContent: {
    padding: 15,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
  },
  cardText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  textoCompletado: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
    marginTop: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.textSecondary,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 25,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  fabAgenda: {
    position: "absolute",
    right: 20,
    bottom: 25,
    backgroundColor: "#607D8B",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "90%",
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ddd",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalHeaderTitulo: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
  },
  modalScroll: {
    maxHeight: "85%",
  },

  formLabel: {
    fontSize: FONT_SIZES.small,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: COLORS.text,
  },
  formTextArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  formFila: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  formDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
  },
  formDateBtnText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.small,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
    marginBottom: 10,
  },
  chipText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: "#222",
  },
  guardarBtn: {
    marginTop: 18,
    marginBottom: 24,
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  guardarBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: FONT_SIZES.medium,
  },

  selectorOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  selectorBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
  },
  selectorTitulo: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    marginBottom: 12,
    color: COLORS.text,
  },
  selectorLabel: {
    fontSize: FONT_SIZES.small,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 6,
  },
  selectorItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 8,
  },
  selectorItemActive: {
    backgroundColor: COLORS.primary,
  },
  selectorItemText: {
    color: COLORS.text,
    fontWeight: "600",
  },
  selectorItemTextActive: {
    color: "#fff",
  },
  selectorBotones: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  selectorBtnSecundario: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  selectorBtnPrimario: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  selectorBtnTextoOscuro: {
    color: COLORS.text,
    fontWeight: "bold",
  },
  selectorBtnTextoClaro: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default EventosScreen;