import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Departamento } from "../Services/departamentosService";
import { crearTareaService } from "../Services/crearTareaService";
import { PrioridadTarea } from "../types/tareas";

type UserLike = {
  uid: string;
  nombre?: string;
  rol?: string;
  empresaId?: string | null;
  empresaNombre?: string;
};

export function useCrearTarea(user: UserLike | null | undefined, navigation: any) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<PrioridadTarea>("Media");

  const [fechaVencimiento, setFechaVencimiento] = useState<Date | undefined>();
  const [mostrarModalFecha, setMostrarModalFecha] = useState(false);

  const [diaSeleccionado, setDiaSeleccionado] = useState(new Date().getDate());
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  const [usuariosDisponibles, setUsuariosDisponibles] = useState<any[]>([]);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<string[]>([]);

  const [modoAsignacion, setModoAsignacion] =
    useState<"usuarios" | "departamento">("usuarios");

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const prioridades: PrioridadTarea[] = ["Baja", "Media", "Alta", "Urgente"];

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

  useEffect(() => {
    if (user?.rol === "Administrador" && user?.empresaId) {
      crearTareaService
        .cargarDepartamentos(user.empresaId)
        .then(setDepartamentos)
        .catch(() =>
          Alert.alert("Error", "No se pudieron cargar los departamentos")
        );
    }
  }, [user?.rol, user?.empresaId]);

  useEffect(() => {
    if (user?.empresaId) {
      crearTareaService
        .obtenerUsuariosDeEmpresa(user.empresaId)
        .then((usuarios) => {
          if (user.rol === "Jefe") {
            setUsuariosDisponibles(
              usuarios.filter((u) => u.rol !== "Administrador")
            );
          } else {
            setUsuariosDisponibles(usuarios);
          }
        })
        .catch(() =>
          Alert.alert("Error", "No se pudieron cargar los usuarios")
        );
    }
  }, [user?.empresaId, user?.rol]);

  const toggleUsuario = (uid: string) => {
    setUsuariosSeleccionados((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const obtenerDiasDelMes = (mes: number, anio: number) => {
    return new Date(anio, mes + 1, 0).getDate();
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

  const handleCrearTarea = async () => {
    if (!titulo.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }

    if (!user?.empresaId || !user?.uid || !user?.nombre) return;

    let uidsFinales: string[] = [];
    let nombresAsignados: string[] = [];

    if (user.rol === "Administrador" && modoAsignacion === "departamento") {
      if (!departamentoSeleccionado) {
        Alert.alert("Error", "Debes seleccionar un departamento");
        return;
      }

      const usuariosDepto = await crearTareaService.obtenerUsuariosPorDepartamento(
        user.empresaId,
        departamentoSeleccionado
      );

      if (usuariosDepto.length === 0) {
        Alert.alert("Error", "No hay usuarios asignados a este departamento");
        return;
      }

      uidsFinales = usuariosDepto.map((u: any) => u.uid);
      nombresAsignados = usuariosDepto.map((u: any) => u.nombre);
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
      await crearTareaService.crearTarea(
        {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          prioridad,
          fechaVencimiento,
          asignadoA: uidsFinales,
        },
        user.uid,
        user.nombre,
        user.empresaId,
        user.empresaNombre || "",
        nombresAsignados,
        user.rol
      );

      Alert.alert("Éxito", "Tarea creada correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo crear la tarea");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    titulo,
    setTitulo,
    descripcion,
    setDescripcion,
    prioridad,
    setPrioridad,
    fechaVencimiento,
    mostrarModalFecha,
    setMostrarModalFecha,

    diaSeleccionado,
    setDiaSeleccionado,
    mesSeleccionado,
    setMesSeleccionado,
    anioSeleccionado,
    setAnioSeleccionado,

    usuariosDisponibles,
    usuariosSeleccionados,
    toggleUsuario,

    modoAsignacion,
    setModoAsignacion,
    departamentos,
    departamentoSeleccionado,
    setDepartamentoSeleccionado,

    isLoading,
    prioridades,
    meses,
    obtenerDiasDelMes,
    confirmarFecha,
    limpiarFecha,
    handleCrearTarea,
  };
}