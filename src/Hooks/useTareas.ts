// import { useCallback, useEffect, useMemo, useState } from "react";
// import { Alert } from "react-native";
// import { Tarea } from "../types/tareas";
// import {
//   obtenerTareasAsignadas,
//   obtenerTareasCreadasPor,
//   obtenerTareasDeEmpresa,
// } from "../Services/tareasService";

// export type VistaFiltro = "todas" | "asignadas" | "creadas";

// type UserLike = {
//   uid: string;
//   rol?: string;
//   empresaId?: string | null;
// };

// export function useTareas(user: UserLike | null | undefined) {
//   const [tareas, setTareas] = useState<Tarea[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [vistaActual, setVistaActual] = useState<VistaFiltro>("asignadas");

//   const esAdmin = user?.rol === "Administrador";
//   const puedeCrear = esAdmin || user?.rol === "Jefe";

//   const empresaId = user?.empresaId ?? null;
//   const uid = user?.uid ?? null;

//   const refetch = useCallback(async () => {
//     if (!empresaId || !uid) return;

//     setLoading(true);
//     try {
//       let data: Tarea[] = [];

//       switch (vistaActual) {
//         case "todas":
//           data = await obtenerTareasDeEmpresa(empresaId);
//           break;
//         case "asignadas":
//           data = await obtenerTareasAsignadas(uid, empresaId);
//           break;
//         case "creadas":
//           data = await obtenerTareasCreadasPor(uid, empresaId);
//           break;
//       }

//       setTareas(data);
//     } catch {
//       Alert.alert("Error", "No se pudieron cargar las tareas");
//     } finally {
//       setLoading(false);
//     }
//   }, [empresaId, uid, vistaActual]);

//   useEffect(() => {
//     if (empresaId) refetch();
//   }, [empresaId, vistaActual, refetch]);

//   const filtrosDisponibles = useMemo(() => {
//     const base: VistaFiltro[] = ["asignadas", "creadas"];
//     return esAdmin ? [...base, "todas"] : base;
//   }, [esAdmin]);

//   return {
//     tareas,
//     loading,
//     vistaActual,
//     setVistaActual,
//     esAdmin,
//     puedeCrear,
//     filtrosDisponibles,
//     refetch,
//   };
// }

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { EstadoTarea, Tarea } from "../types/tareas";
import {
  // actualizarEstadoTarea,
  // eliminarTarea,
  obtenerTareasAsignadas,
  obtenerTareasCreadasPor,
  obtenerTareasDeEmpresa,
} from "../Services/tareasService";

import { tareasDptoService } from "../Services/tareasDptoService";

import { Departamento } from "../Services/departamentosService";

export type VistaFiltro = "todas" | "asignadas" | "creadas";
export type FiltroEstado = EstadoTarea | "Todas";

type UseTareasOptions = {
  modo?: "empresa" | "departamento";
};

type UserLike = {
  uid: string;
  rol?: string;
  empresaId?: string | null;
  nombreDepartamento?: string | null;
};

export function useTareas(
  user: UserLike | null | undefined,
  options: UseTareasOptions = { modo: "empresa" }
) {
  const modo = options.modo ?? "empresa";

  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState<VistaFiltro>(
    modo === "departamento" ? "todas" : "asignadas"
  );

  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("Todas");

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [deptoSeleccionado, setDeptoSeleccionado] = useState<string | null>(
    null
  );
  const [modalDeptosVisible, setModalDeptosVisible] = useState(false);

  const esAdmin = user?.rol === "Administrador";
  const esJefe = user?.rol === "Jefe";
  const puedeCrear = esAdmin || esJefe;

  const empresaId = user?.empresaId ?? null;
  const uid = user?.uid ?? null;

  const departamentoActual =
    modo === "departamento"
      ? esAdmin
        ? deptoSeleccionado
        : user?.nombreDepartamento
      : null;

  const cargarDeptos = useCallback(async () => {
    if (modo !== "departamento") return;
    if (!esAdmin || !empresaId) return;

    try {
      const deptos = await tareasDptoService.cargarDepartamentos(empresaId);
      setDepartamentos(deptos);

      if (deptos.length > 0 && !deptoSeleccionado) {
        setDeptoSeleccionado(deptos[0].nombre);
      }
    } catch {
      Alert.alert("Error", "No se pudieron cargar los departamentos");
    }
  }, [modo, esAdmin, empresaId, deptoSeleccionado]);

  const refetch = useCallback(async () => {
    if (!empresaId || !uid) return;

    if (modo === "departamento" && !departamentoActual) return;

    setLoading(true);

    try {
      let data: Tarea[] = [];

      if (modo === "departamento") {
        if (vistaActual === "todas") {
          data =  await tareasDptoService.obtenerTareasDepartamento(
            empresaId,
            departamentoActual!
          );
        } else {
          data = await tareasDptoService.obtenerTareasAsignadasDepartamento(
            uid,
            empresaId,
            departamentoActual!
          );
        }
      } else {
        switch (vistaActual) {
          case "todas":
            data = await obtenerTareasDeEmpresa(empresaId);
            break;

          case "asignadas":
            data = await obtenerTareasAsignadas(uid, empresaId);
            break;

          case "creadas":
            data = await obtenerTareasCreadasPor(uid, empresaId);
            break;
        }
      }

      setTareas(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, [empresaId, uid, vistaActual, modo, departamentoActual]);

  useEffect(() => {
    cargarDeptos();
  }, [cargarDeptos]);

  useEffect(() => {
    if (empresaId) refetch();
  }, [empresaId, vistaActual, departamentoActual, refetch]);

  const cambiarDepartamento = (depto: Departamento) => {
    setDeptoSeleccionado(depto.nombre);
    setModalDeptosVisible(false);
  };

  const cambiarEstado = async (tareaId: string, nuevoEstado: EstadoTarea) => {
    try {
     await tareasDptoService.actualizarEstadoTarea(tareaId, nuevoEstado);
      Alert.alert("Éxito", "Estado actualizado");
      refetch();
    } catch {
      Alert.alert("Error", "No se pudo actualizar el estado");
    }
  };

  const eliminar = (tareaId: string) => {
    Alert.alert(
      "Eliminar tarea",
      "¿Estás seguro de que deseas eliminar esta tarea?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await tareasDptoService.eliminarTarea(tareaId);
              Alert.alert("Éxito", "Tarea eliminada");
              refetch();
            } catch {
              Alert.alert("Error", "No se pudo eliminar la tarea");
            }
          },
        },
      ]
    );
  };

  const tareasFiltradas = useMemo(() => {
    return tareas.filter((t) =>
      filtroEstado === "Todas" ? true : t.estado === filtroEstado
    );
  }, [tareas, filtroEstado]);

  const filtrosDisponibles = useMemo(() => {
    if (modo === "departamento") {
      return ["todas", "asignadas"] as VistaFiltro[];
    }

    const base: VistaFiltro[] = ["asignadas", "creadas"];
    return esAdmin ? [...base, "todas"] : base;
  }, [esAdmin, modo]);

  return {
    tareas,
    tareasFiltradas,
    loading,

    vistaActual,
    setVistaActual,

    filtroEstado,
    setFiltroEstado,

    esAdmin,
    esJefe,
    puedeCrear,

    departamentos,
    deptoSeleccionado,
    departamentoActual,
    modalDeptosVisible,
    setModalDeptosVisible,
    cambiarDepartamento,

    cambiarEstado,
    eliminar,

    filtrosDisponibles,
    refetch,
  };
}