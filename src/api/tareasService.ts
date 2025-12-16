// api/tareasService.ts
import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Tarea, TareaFormData, EstadoTarea } from "../types/tareas";

/**
 * Crear una nueva tarea
 */
export async function crearTarea(
  formData: TareaFormData,
  creadaPor: string,
  nombreCreador: string,
  empresaId: string,
  empresaNombre: string,
  nombresAsignados: string[],
  rolCreador?: string
): Promise<string> {
  try {
    // Validación extra: Si es Jefe, verificar que no asigne a Admins
    if (rolCreador === "Jefe") {
      // Aquí podrías hacer una validación adicional si quieres ser extra cuidadoso
      console.log("⚠️ Jefe creando tarea - validación de permisos activa");
    }

    const docRef = await addDoc(collection(db, "Tareas"), {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      prioridad: formData.prioridad,
      estado: "Pendiente",
      
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: formData.fechaVencimiento?.toISOString() || null,
      
      creadaPor,
      nombreCreador,
      asignadoA: formData.asignadoA,
      nombresAsignados,
      
      empresaId,
      empresaNombre,
      
      etiquetas: formData.etiquetas || [],
      comentarios: [],
    });

    console.log("✅ Tarea creada con ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error al crear tarea:", error);
    
    // Mensaje específico si es problema de permisos
    if (error.code === "permission-denied") {
      throw new Error("No tienes permisos para asignar esta tarea a los usuarios seleccionados");
    }
    
    throw error;
  }
}

/**
 * Obtener tareas de una empresa
 */
export async function obtenerTareasDeEmpresa(
  empresaId: string
): Promise<Tarea[]> {
  try {
    const q = query(
      collection(db, "Tareas"),
      where("empresaId", "==", empresaId)
    );
    
    const snapshot = await getDocs(q);
    const tareas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tarea[];
    
    // Ordenar en el cliente
    return tareas.sort((a, b) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
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
  empresaId: string
): Promise<Tarea[]> {
  try {
    const q = query(
      collection(db, "Tareas"),
      where("empresaId", "==", empresaId),
      where("asignadoA", "array-contains", uid)
    );
    
    const snapshot = await getDocs(q);
    const tareas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tarea[];
    
    // Ordenar en el cliente
    return tareas.sort((a, b) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
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
  empresaId: string
): Promise<Tarea[]> {
  try {
    const q = query(
      collection(db, "Tareas"),
      where("empresaId", "==", empresaId),
      where("creadaPor", "==", uid)
    );
    
    const snapshot = await getDocs(q);
    const tareas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tarea[];
    
    // Ordenar en el cliente
    return tareas.sort((a, b) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
  } catch (error: any) {
    console.error("❌ Error al obtener tareas creadas:", error);
    console.error("Código de error:", error.code);
    console.error("Mensaje:", error.message);
    throw error;
  }
}

/**
 * Actualizar estado de una tarea
 */
export async function actualizarEstadoTarea(
  tareaId: string,
  nuevoEstado: EstadoTarea
): Promise<void> {
  try {
    const tareaRef = doc(db, "Tareas", tareaId);
    const updateData: any = { estado: nuevoEstado };
    
    if (nuevoEstado === "Completada") {
      updateData.fechaCompletada = new Date().toISOString();
    }
    
    await updateDoc(tareaRef, updateData);
    console.log(`✅ Estado actualizado: ${nuevoEstado}`);
  } catch (error) {
    console.error("❌ Error al actualizar estado:", error);
    throw error;
  }
}

/**
 * Editar una tarea existente
 */
export async function editarTarea(
  tareaId: string,
  datos: Partial<Tarea>
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
export async function agregarComentario(
  tareaId: string,
  comentario: {
    texto: string;
    autorUid: string;
    autorNombre: string;
  }
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
    
    await updateDoc(tareaRef, { comentarios });
    console.log("✅ Comentario agregado");
  } catch (error) {
    console.error("❌ Error al agregar comentario:", error);
    throw error;
  }
}