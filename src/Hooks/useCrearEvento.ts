import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { cargarDepartamentos } from "../Services/departamentosService";
import {
  obtenerUsuariosDeEmpresa,
  obtenerUsuariosPorDepartamento,
} from "../Services/empresaService";
import { crearEvento } from "../Services/eventosService";
import { TipoEvento } from "../types/eventos";

export function useCrearEvento(user: any, navigation: any) {
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

  const [usuariosDisponibles, setUsuariosDisponibles] = useState<any[]>([]);
  const [asistentesSeleccionados, setAsistentesSeleccionados] = useState<string[]>([]);

  const [capacidadMaxima, setCapacidadMaxima] = useState("");
  const [notas, setNotas] = useState("");

  const [mostrarModalFechaInicio, setMostrarModalFechaInicio] = useState(false);
  const [mostrarModalFechaFin, setMostrarModalFechaFin] = useState(false);

  const [diaInicioSeleccionado, setDiaInicioSeleccionado] = useState(new Date().getDate());
  const [mesInicioSeleccionado, setMesInicioSeleccionado] = useState(new Date().getMonth());
  const [anioInicioSeleccionado, setAnioInicioSeleccionado] = useState(new Date().getFullYear());

  const [diaFinSeleccionado, setDiaFinSeleccionado] = useState(new Date().getDate());
  const [mesFinSeleccionado, setMesFinSeleccionado] = useState(new Date().getMonth());
  const [anioFinSeleccionado, setAnioFinSeleccionado] = useState(new Date().getFullYear());

  const [isLoading, setIsLoading] = useState(false);

  const [modoAsignacion, setModoAsignacion] =
    useState<"usuarios" | "departamento">("usuarios");

  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");

  const tiposEvento: TipoEvento[] = [
    "Reunión",
    "Capacitación",
    "Evaluación",
    "Social",
    "Otro",
  ];

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  useEffect(() => {
    if (user?.empresaSeleccionada) {
      obtenerUsuariosDeEmpresa(user.empresaSeleccionada)
        .then((usuarios) => {
          if (user.rol === "Jefe") {
            setUsuariosDisponibles(
              usuarios.filter((u: any) => u.rol !== "Administrador")
            );
          } else {
            setUsuariosDisponibles(usuarios);
          }
        })
        .catch(() => Alert.alert("Error", "No se pudieron cargar los usuarios"));
    }
  }, [user?.empresaSeleccionada, user?.rol]);

  useEffect(() => {
    if (user?.rol === "Administrador" && user?.empresaSeleccionada) {
      cargarDepartamentos(user.empresaSeleccionada)
        .then(setDepartamentos)
        .catch(() => Alert.alert("Error", "No se pudieron cargar los departamentos"));
    }
  }, [user?.rol, user?.empresaSeleccionada]);

  const obtenerDiasDelMes = (mes: number, anio: number) => {
    return new Date(anio, mes + 1, 0).getDate();
  };

  const toggleAsistente = (uid: string) => {
    setAsistentesSeleccionados((prev) =>
      prev.includes(uid)
        ? prev.filter((id) => id !== uid)
        : [...prev, uid]
    );
  };

  const confirmarFechaInicio = () => {
    setFechaInicio(
      new Date(anioInicioSeleccionado, mesInicioSeleccionado, diaInicioSeleccionado)
    );
    setMostrarModalFechaInicio(false);
  };

  const confirmarFechaFin = () => {
    setFechaFin(new Date(anioFinSeleccionado, mesFinSeleccionado, diaFinSeleccionado));
    setMostrarModalFechaFin(false);
  };

  const limpiarFechaFin = () => {
    setFechaFin(undefined);
    setMostrarModalFechaFin(false);
  };

  const crearEventoHandler = async () => {
    if (!titulo.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }

    if (esVirtual && !linkVirtual.trim()) {
      Alert.alert("Error", "Debes proporcionar el link virtual");
      return;
    }

    let asistentesUidsFinales: string[] = [];
    let asistentesData: { uid: string; nombre: string; rol: string }[] = [];
    let departamentoFinal: string | null = null;

    setIsLoading(true);

    try {
      if (user?.rol === "Administrador"  && modoAsignacion === "departamento") {
        if (!departamentoSeleccionado) {
          Alert.alert("Error", "Debes seleccionar un departamento");
          setIsLoading(false);
          return;
        }

        const usuariosDepto = await obtenerUsuariosPorDepartamento(
          user?.empresaSeleccionada || user?.empresaId || "",
          departamentoSeleccionado
        );

        if (!usuariosDepto || usuariosDepto.length === 0) {
          Alert.alert("Error", "No hay usuarios asignados a ese departamento");
          setIsLoading(false);
          return;
        }

        asistentesUidsFinales = usuariosDepto.map((u: any) => u.uid);
        asistentesData = usuariosDepto.map((u: any) => ({
          uid: u.uid,
          nombre: u.nombre,
          rol: u.rol,
        }));

        departamentoFinal = departamentoSeleccionado;
      } else {
        if (asistentesSeleccionados.length === 0) {
          Alert.alert("Error", "Debes asignar al menos un asistente");
          setIsLoading(false);
          return;
        }

        asistentesUidsFinales = asistentesSeleccionados;
        asistentesData = usuariosDisponibles
          .filter((u) => asistentesSeleccionados.includes(u.uid))
          .map((u) => ({
            uid: u.uid,
            nombre: u.nombre,
            rol: u.rol,
          }));
      }

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
          asistentesUids: asistentesUidsFinales,
          capacidadMaxima: capacidadMaxima ? parseInt(capacidadMaxima) : undefined,
          notas,
          tipoAsignacion: user?.rol === "Administrador" ? modoAsignacion : "usuarios",
          departamentoAsignado: departamentoFinal,
        } as any,
        user?.uid!,
        user?.nombre!,
        user?.empresaSeleccionada || user?.empresaId!,
        user?.empresaNombre!,
        asistentesData,
        user?.rol
      );

      Alert.alert("Éxito", "Evento creado correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "No se pudo crear el evento");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    titulo, setTitulo,
    descripcion, setDescripcion,
    tipo, setTipo,
    fechaInicio,
    horaInicio, setHoraInicio,
    fechaFin,
    horaFin, setHoraFin,
    ubicacion, setUbicacion,
    esVirtual, setEsVirtual,
    linkVirtual, setLinkVirtual,
    usuariosDisponibles,
    asistentesSeleccionados,
    capacidadMaxima, setCapacidadMaxima,
    notas, setNotas,
    mostrarModalFechaInicio, setMostrarModalFechaInicio,
    mostrarModalFechaFin, setMostrarModalFechaFin,
    diaInicioSeleccionado, setDiaInicioSeleccionado,
    mesInicioSeleccionado, setMesInicioSeleccionado,
    anioInicioSeleccionado, setAnioInicioSeleccionado,
    diaFinSeleccionado, setDiaFinSeleccionado,
    mesFinSeleccionado, setMesFinSeleccionado,
    anioFinSeleccionado, setAnioFinSeleccionado,
    isLoading,
    modoAsignacion, setModoAsignacion,
    departamentos,
    departamentoSeleccionado, setDepartamentoSeleccionado,
    tiposEvento,
    meses,
    obtenerDiasDelMes,
    toggleAsistente,
    confirmarFechaInicio,
    confirmarFechaFin,
    limpiarFechaFin,
    crearEventoHandler,
  };
}