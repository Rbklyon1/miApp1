// import { obtenerTareasRailway } from './../Services/railwayApiService';
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
//   empresaSeleccionada?: string | null;
// };

// export function useTareas(user: UserLike | null | undefined) {
//   const [tareas, setTareas] = useState<Tarea[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [vistaActual, setVistaActual] = useState<VistaFiltro>("asignadas");

//   const esAdmin = user?.rol === "Administrador";
//   const puedeCrear = esAdmin || user?.rol === "Jefe";

//   const empresaId = user?.empresaSeleccionada ?? null;
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
//     try {
//       const tareasFastAPI = await obtenerTareasRailway();
//       console.log("FASTAPI RAW:", tareasFastAPI);
      
//     const tareasAdaptadas = tareasFastAPI.map((t: any) => ({
//       id: `fastapi-${t.id}`,
//       titulo: t.titulo,
//       descripcion: t.descripcion || "",
//       prioridad: t.prioridad || "Media",
//       estado: t.estado || "Pendiente",
//       fechaCreacion: new Date().toISOString(),
//       fechaVencimiento: undefined,
//       fechaCompletada: undefined,
//       creadaPor: t.creadaPor || "",
//       nombreCreador: t.nombreCreador || "FastAPI",
//       asignadoA: t.asignadoA || [],
//       nombresAsignados: t.nombresAsignados || [],
//       empresaId: t.empresaId || empresaId,
//       empresaNombre: "",
//       etiquetas: [],
//       comentarios: [],
//       adjuntos: []
//     })) as Tarea[];

//       setTareas([...tareasAdaptadas, ...data]);
//     } catch (error) {
//       console.log("No se pudieron cargar tareas desde FastAPI:", error);
//       setTareas(data);
//     }
//   } catch {
//     Alert.alert("Error", "No se pudieron cargar las tareas");
//   } finally {
//     setLoading(false);
//   }
// }, [empresaId, uid, vistaActual]);
 
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
import { Tarea } from "../types/tareas";
import {
  obtenerTareasAsignadas,
  obtenerTareasCreadasPor,
  obtenerTareasDeEmpresa,
} from "../Services/tareasService";

export type VistaFiltro = "todas" | "asignadas" | "creadas";

type UserLike = {
  uid: string;
  rol?: string;
  empresaSeleccionada?: string | null;
};

export function useTareas(user: UserLike | null | undefined) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState<VistaFiltro>("asignadas");

  const esAdmin = user?.rol === "Administrador";
  const puedeCrear = esAdmin || user?.rol === "Jefe";

  const empresaId = user?.empresaSeleccionada ?? null;
  const uid = user?.uid ?? null;

  const refetch = useCallback(async () => {
    if (!empresaId || !uid) return;

    setLoading(true);
    try {
      let data: Tarea[] = [];

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

      setTareas(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las tareas");
    } finally {
      setLoading(false);
    }
  }, [empresaId, uid, vistaActual]);

  useEffect(() => {
    if (empresaId) refetch();
  }, [empresaId, vistaActual, refetch]);

  const filtrosDisponibles = useMemo(() => {
    const base: VistaFiltro[] = ["asignadas", "creadas"];
    return esAdmin ? [...base, "todas"] : base;
  }, [esAdmin]);

  return {
    tareas,
    loading,
    vistaActual,
    setVistaActual,
    esAdmin,
    puedeCrear,
    filtrosDisponibles,
    refetch,
  };
}