import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import {
  actualizarEstadoTarea,
  agregarComentario,
  agregarEnlaceAdjunto,
  eliminarAdjunto,
  eliminarTarea,
} from "./tareasService";
import { Tarea } from "../types/tareas";

export async function obtenerTareaPorId(tareaId: string): Promise<Tarea | null> {
  const tareaRef = doc(db, "Tareas", tareaId);
  const tareaSnap = await getDoc(tareaRef);

  if (!tareaSnap.exists()) return null;

  return {
    id: tareaSnap.id,
    ...tareaSnap.data(),
  } as Tarea;
}

export const detalleTareaService = {
  obtenerTareaPorId,
  actualizarEstadoTarea,
  agregarComentario,
  agregarEnlaceAdjunto,
  eliminarAdjunto,
  eliminarTarea,
};