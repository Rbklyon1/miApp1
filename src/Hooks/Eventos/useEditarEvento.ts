import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { editarEvento } from "../../Services/eventosService";
import { db } from "../../Services/firebaseConfig";
import { Asistente, TipoEvento } from "../../types/eventos";

const tiposEvento: TipoEvento[] = [
  "Reunión",
  "Capacitación",
  "Evaluación",
  "Social",
  "Otro",
];

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

export function useEditarEvento(eventoId: string, user: any, navigation: any) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<TipoEvento>("Reunión");

  const [fechaInicio, setFechaInicio] = useState<Date>(new Date());
  const [horaInicio, setHoraInicio] = useState("09:00");

  const [fechaFin, setFechaFin] = useState<Date | undefined>();
  const [horaFin, setHoraFin] = useState("");

  const [ubicacion, setUbicacion] = useState("");
  const [esVirtual, setEsVirtual] = useState(false);
  const [linkVirtual, setLinkVirtual] = useState("");

  const [asistentes, setAsistentes] = useState<Asistente[]>([]);

  const [capacidadMaxima, setCapacidadMaxima] = useState("");
  const [notas, setNotas] = useState("");

  const [mostrarModalFechaInicio, setMostrarModalFechaInicio] = useState(false);
  const [mostrarModalFechaFin, setMostrarModalFechaFin] = useState(false);

  const [diaInicioSeleccionado, setDiaInicioSeleccionado] = useState(
    new Date().getDate()
  );
  const [mesInicioSeleccionado, setMesInicioSeleccionado] = useState(
    new Date().getMonth()
  );
  const [anioInicioSeleccionado, setAnioInicioSeleccionado] = useState(
    new Date().getFullYear()
  );

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
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEventoEditar();
  }, [eventoId]);

  const cargarEventoEditar = async () => {
    try {
      const eventoRef = doc(db, "Eventos", eventoId);
      const eventoSnap = await getDoc(eventoRef);

      if (!eventoSnap.exists()) {
        Alert.alert("Error", "Evento no encontrado");
        navigation.goBack();
        return;
      }

      const data: any = eventoSnap.data();

      setTitulo(data.titulo || "");
      setDescripcion(data.descripcion || "");
      setTipo(data.tipo || "Reunión");

      const inicio = new Date(data.fechaInicio);
      setFechaInicio(inicio);
      setDiaInicioSeleccionado(inicio.getDate());
      setMesInicioSeleccionado(inicio.getMonth());
      setAnioInicioSeleccionado(inicio.getFullYear());

      setHoraInicio(data.horaInicio || "09:00");

      if (data.fechaFin) {
        const fin = new Date(data.fechaFin);
        setFechaFin(fin);
        setDiaFinSeleccionado(fin.getDate());
        setMesFinSeleccionado(fin.getMonth());
        setAnioFinSeleccionado(fin.getFullYear());
      } else {
        setFechaFin(undefined);
      }

      setHoraFin(data.horaFin || "");
      setUbicacion(data.ubicacion || "");
      setEsVirtual(data.esVirtual || false);
      setLinkVirtual(data.linkVirtual || "");
      setCapacidadMaxima(
        data.capacidadMaxima ? String(data.capacidadMaxima) : ""
      );
      setNotas(data.notas || "");

      // Se conservan, pero ya no se editan.
      setAsistentes(data.asistentes || []);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo cargar el evento");
    } finally {
      setCargando(false);
    }
  };

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
    setHoraFin("");
    setMostrarModalFechaFin(false);
  };

  const handleEditarEvento = async () => {
    if (!titulo.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }

    if (esVirtual && !linkVirtual.trim()) {
      Alert.alert("Error", "Debes proporcionar el link virtual");
      return;
    }

    setIsLoading(true);

    try {
      await editarEvento(eventoId, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        tipo,
        fechaInicio: fechaInicio.toISOString(),
        horaInicio: horaInicio || "",
        fechaFin: fechaFin ? fechaFin.toISOString() : null,
        horaFin: horaFin || null,
        ubicacion: esVirtual ? null : ubicacion.trim() || null,
        esVirtual,
        linkVirtual: esVirtual ? linkVirtual.trim() : null,

        // Se manda igual como estaba, para no perderlos.
        asistentes,

        capacidadMaxima: capacidadMaxima ? parseInt(capacidadMaxima) : null,
        notas: notas.trim() || "",
        fechaActualizacion: new Date().toISOString(),
      } as any);

      Alert.alert("Éxito", "Evento actualizado correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("Error al editar evento:", error);
      Alert.alert("Error", error.message || "No se pudo actualizar el evento");
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
    cargando,

    tiposEvento,
    meses,
    obtenerDiasDelMes,
    confirmarFechaInicio,
    confirmarFechaFin,
    limpiarFechaFin,
    handleEditarEvento,
  };
}