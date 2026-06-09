import NetInfo from "@react-native-community/netinfo";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { Adjunto, EstadoTarea, Tarea, TareaFormData } from "../types/tareas";
import { db } from "./firebaseConfig";
import { offlineService } from "./sqlite/OfflineService";

/**
 * Obtener tareas de una empresa
 */
export async function obtenerTareasDeEmpresa(
  empresaId: string,
): Promise<Tarea[]> {
  try {
    const q = query(
      collection(db, "Tareas"),
      where("empresaId", "==", empresaId),
    );

    const snapshot = await getDocs(q);
    const tareas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tarea[];

    // Ordenar en el cliente
    return tareas.sort(
      (a, b) =>
        new Date(b.fechaCreacion).getTime() -
        new Date(a.fechaCreacion).getTime(),
    );
  } catch (error: any) {
    console.error("❌ Error al obtener tareas:", error);
    console.error("Código de error:", error.code);
    console.error("Mensaje:", error.message);
    throw error;
  }
}

/**
 * Obtener tareas asignadas a un usuario
 */
export async function obtenerTareasAsignadas(
  uid: string,
  empresaId: string,
): Promise<Tarea[]> {
  try {
    const q = query(
      collection(db, "Tareas"),
      where("empresaId", "==", empresaId),
      where("asignadoA", "array-contains", uid),
    );

    const snapshot = await getDocs(q);
    const tareas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tarea[];

    // Ordenar en el cliente
    return tareas.sort(
      (a, b) =>
        new Date(b.fechaCreacion).getTime() -
        new Date(a.fechaCreacion).getTime(),
    );
  } catch (error: any) {
    console.error("❌ Error al obtener tareas asignadas:", error);
    console.error("Código de error:", error.code);
    console.error("Mensaje:", error.message);
    throw error;
  }
}

/**
 * Obtener tareas creadas por un usuario
 */
export async function obtenerTareasCreadasPor(
  uid: string,
  empresaId: string,
): Promise<Tarea[]> {
  try {
    const q = query(
      collection(db, "Tareas"),
      where("empresaId", "==", empresaId),
      where("creadaPor", "==", uid),
    );

    const snapshot = await getDocs(q);
    const tareas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tarea[];

    // Ordenar en el cliente
    return tareas.sort(
      (a, b) =>
        new Date(b.fechaCreacion).getTime() -
        new Date(a.fechaCreacion).getTime(),
    );
  } catch (error: any) {
    console.error("❌ Error al obtener tareas creadas:", error);
    console.error("Código de error:", error.code);
    console.error("Mensaje:", error.message);
    throw error;
  }
}

/**
 * Editar una tarea existente
 */
export async function editarTarea(
  tareaId: string,
  datos: Partial<Tarea>,
): Promise<void> {
  try {
    const tareaRef = doc(db, "Tareas", tareaId);
    await updateDoc(tareaRef, datos);
    console.log("✅ Tarea editada correctamente");
  } catch (error) {
    console.error("❌ Error al editar tarea:", error);
    throw error;
  }
}

/**
 * Eliminar una tarea
 */
export async function eliminarTarea(tareaId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "Tareas", tareaId));
    console.log("✅ Tarea eliminada");
  } catch (error) {
    console.error("❌ Error al eliminar tarea:", error);
    throw error;
  }
}

export async function obtenerTareasDepartamento(
  empresaId: string,
  nombreDepartamento: string,
): Promise<Tarea[]> {
  try {
    // Primero obtenemos todas las tareas de la empresa
    const q = query(
      collection(db, "Tareas"),
      where("empresaId", "==", empresaId),
    );

    const snapshot = await getDocs(q);
    const tareas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tarea[];

    // Filtrar tareas donde al menos un usuario asignado es del departamento
    // Para esto necesitamos obtener los usuarios del departamento
    const usuariosQuery = query(
      collection(db, "Usuarios"),
      where("empresaId", "==", empresaId),
      where("nombreDepartamento", "==", nombreDepartamento),
    );

    const usuariosSnap = await getDocs(usuariosQuery);
    const uidsDelDepto = usuariosSnap.docs.map((doc) => doc.id);

    // Filtrar tareas donde el creador o algún asignado pertenece al departamento
    const tareasDepartamento = tareas.filter((tarea) => {
      // Incluir si el creador es del departamento
      if (uidsDelDepto.includes(tarea.creadaPor)) return true;

      // Incluir si algún asignado es del departamento
      if (tarea.asignadoA.some((uid) => uidsDelDepto.includes(uid)))
        return true;

      return false;
    });

    // Ordenar por fecha
    return tareasDepartamento.sort(
      (a, b) =>
        new Date(b.fechaCreacion).getTime() -
        new Date(a.fechaCreacion).getTime(),
    );
  } catch (error: any) {
    console.error("❌ Error al obtener tareas de departamento:", error);
    throw error;
  }
}

/**
 * Obtener tareas asignadas a usuarios de un departamento
 */
export async function obtenerTareasAsignadasDepartamento(
  uid: string,
  empresaId: string,
  nombreDepartamento: string,
): Promise<Tarea[]> {
  try {
    const q = query(
      collection(db, "Tareas"),
      where("empresaId", "==", empresaId),
      where("asignadoA", "array-contains", uid),
    );

    const snapshot = await getDocs(q);
    const tareas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tarea[];

    // Obtener usuarios del departamento para filtrar
    const usuariosQuery = query(
      collection(db, "Usuarios"),
      where("empresaId", "==", empresaId),
      where("nombreDepartamento", "==", nombreDepartamento),
    );

    const usuariosSnap = await getDocs(usuariosQuery);
    const uidsDelDepto = usuariosSnap.docs.map((doc) => doc.id);

    // Filtrar tareas relacionadas con el departamento
    const tareasDepartamento = tareas.filter((tarea) => {
      // Incluir si el creador es del departamento
      if (uidsDelDepto.includes(tarea.creadaPor)) return true;

      // Incluir si algún asignado adicional es del departamento
      if (
        tarea.asignadoA.some((uidAsignado) =>
          uidsDelDepto.includes(uidAsignado),
        )
      )
        return true;

      return false;
    });

    return tareasDepartamento.sort(
      (a, b) =>
        new Date(b.fechaCreacion).getTime() -
        new Date(a.fechaCreacion).getTime(),
    );
  } catch (error: any) {
    console.error(
      "❌ Error al obtener tareas asignadas de departamento:",
      error,
    );
    throw error;
  }
}

/**
 * Crear una nueva tarea (con soporte offline)
 */
export async function crearTarea(
  formData: TareaFormData,
  creadaPor: string,
  nombreCreador: string,
  empresaId: string,
  empresaNombre: string,
  nombresAsignados: string[],
  rolCreador?: string,
): Promise<string> {
  // Verificar conexión
  const state = await NetInfo.fetch();
  const isOnline = state.isConnected ?? false;

  const tareaData = {
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    prioridad: formData.prioridad,
    estado: "Pendiente" as EstadoTarea,

    fechaVencimiento: formData.fechaVencimiento?.toISOString() || null,

    creadaPor,
    nombreCreador,
    asignadoA: formData.asignadoA,
    nombresAsignados,

    empresaId,
    empresaNombre,

    etiquetas: formData.etiquetas || [],
    comentarios: [],

    tipoAsignacion: formData.tipoAsignacion || "usuarios",
    departamentoAsignado: formData.departamentoAsignado || null,
  };

  if (!isOnline) {
    // Modo offline - agregar a cola
    const offlineId = await offlineService.addOperation(
      "crear_tarea",
      tareaData,
      creadaPor,
    );

    console.log(" Tarea guardada offline:", offlineId);
    return offlineId;
  }

  // Modo online - guardar directamente
  try {
    const docRef = await addDoc(collection(db, "Tareas"), {
      ...tareaData,
      fechaCreacion: new Date().toISOString(),
    });

    console.log(" Tarea creada con ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error(" Error al crear tarea:", error);

    if (error.code === "permission-denied") {
      throw new Error(
        "No tienes permisos para asignar esta tarea a los usuarios seleccionados",
      );
    }

    throw error;
  }
}

/**
 * Actualizar estado de una tarea (con soporte offline)
 */
export async function actualizarEstadoTarea(
  tareaId: string,
  nuevoEstado: EstadoTarea,
): Promise<void> {
  // Verificar conexión
  const state = await NetInfo.fetch();
  const isOnline = state.isConnected ?? false;

  const updateData: any = { estado: nuevoEstado };

  if (nuevoEstado === "Completada") {
    updateData.fechaCompletada = new Date().toISOString();
  }

  if (!isOnline) {
    // Modo offline
    await offlineService.addOperation(
      "actualizar_estado_tarea",
      { tareaId, estado: nuevoEstado },
      "current_user",
    );
    console.log(" Actualización de estado guardada offline");
    return;
  }

  // Modo online
  try {
    const tareaRef = doc(db, "Tareas", tareaId);
    await updateDoc(tareaRef, updateData);
    console.log(` Estado actualizado: ${nuevoEstado}`);
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    throw error;
  }
}

/**
 * Agregar comentario (con soporte offline)
 */
export async function agregarComentario(
  tareaId: string,
  comentario: {
    texto: string;
    autorUid: string;
    autorNombre: string;
  },
): Promise<void> {
  try {
    const tareaRef = doc(db, "Tareas", tareaId);
    const tareaDoc = await getDoc(tareaRef);

    if (!tareaDoc.exists()) {
      throw new Error("Tarea no encontrada");
    }

    const tareaData = tareaDoc.data();
    const comentarios = tareaData.comentarios || [];

    comentarios.push({
      id: Date.now().toString(),
      texto: comentario.texto,
      autorUid: comentario.autorUid,
      autorNombre: comentario.autorNombre,
      fecha: new Date().toISOString(),
    });

    // Verificar conexión
    const state = await NetInfo.fetch();
    const isOnline = state.isConnected ?? false;

    if (!isOnline) {
      await offlineService.addOperation(
        "agregar_comentario_tarea",
        { tareaId, comentarios },
        comentario.autorUid,
      );
      console.log(" Comentario guardado offline");
      return;
    }

    await updateDoc(tareaRef, { comentarios });
    console.log(" Comentario agregado");
  } catch (error) {
    console.error(" Error al agregar comentario:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────
//  ADJUNTOS / ENTREGABLES  (enlaces externos)
// ─────────────────────────────────────────────

export async function agregarEnlaceAdjunto(
  tareaId: string,
  enlace: { nombre: string; url: string },
  subidoPor: string,
  nombreSubidor: string,
): Promise<Adjunto> {
  const tareaRef = doc(db, "Tareas", tareaId);
  const tareaSnap = await getDoc(tareaRef);

  if (!tareaSnap.exists()) throw new Error("Tarea no encontrada");

  const nuevoAdjunto: Adjunto = {
    id: Date.now().toString(),
    nombre: enlace.nombre.trim(),
    url: enlace.url.trim(),
    subidoPor,
    nombreSubidor,
    fechaSubida: new Date().toISOString(),
  };

  const adjuntosActuales: Adjunto[] = tareaSnap.data().adjuntos || [];
  await updateDoc(tareaRef, {
    adjuntos: [...adjuntosActuales, nuevoAdjunto],
  });

  console.log(" Enlace agregado:", nuevoAdjunto.nombre);
  return nuevoAdjunto;
}

/**
 * Elimina un enlace adjunto de la lista en Firestore.
 */
export async function eliminarAdjunto(
  tareaId: string,
  adjuntoId: string,
): Promise<void> {
  const tareaRef = doc(db, "Tareas", tareaId);
  const tareaSnap = await getDoc(tareaRef);

  if (!tareaSnap.exists()) throw new Error("Tarea no encontrada");

  const adjuntosActuales: Adjunto[] = tareaSnap.data().adjuntos || [];
  await updateDoc(tareaRef, {
    adjuntos: adjuntosActuales.filter((a) => a.id !== adjuntoId),
  });

  console.log(" Enlace eliminado:", adjuntoId);
}
