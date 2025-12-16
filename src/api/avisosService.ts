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
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { Aviso, AvisoFormData, ComentarioAviso, Reaccion } from "../../types/avisos";

/**
 * Crear un nuevo aviso
 */
export async function crearAviso(
  formData: AvisoFormData,
  creadoPor: string,
  nombreCreador: string,
  rolCreador: string,
  empresaId: string,
  empresaNombre: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "Avisos"), {
      titulo: formData.titulo,
      contenido: formData.contenido,
      tipoMuro: formData.tipoMuro,
      departamento: formData.departamento || null,
      destacado: formData.destacado || false,
      
      creadoPor,
      nombreCreador,
      rolCreador,
      
      empresaId,
      empresaNombre,
      
      reacciones: [],
      comentarios: [],
      
      fechaCreacion: new Date().toISOString(),
      archivado: false,
    });

    console.log("✅ Aviso creado con ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("❌ Error al crear aviso:", error);
    throw error;
  }
}

/**
 * Obtener avisos del muro general
 */
export async function obtenerAvisosGenerales(empresaId: string): Promise<Aviso[]> {
  try {
    const q = query(
      collection(db, "Avisos"),
      where("empresaId", "==", empresaId),
      where("tipoMuro", "==", "General"),
      where("archivado", "==", false)
    );
    
    const snapshot = await getDocs(q);
    const avisos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Aviso[];
    
    // Ordenar: destacados primero, luego por fecha
    return avisos.sort((a, b) => {
      if (a.destacado && !b.destacado) return -1;
      if (!a.destacado && b.destacado) return 1;
      return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
    });
  } catch (error) {
    console.error("❌ Error al obtener avisos generales:", error);
    throw error;
  }
}

/**
 * Obtener avisos de un departamento
 * @param empresaId ID de la empresa
 * @param nombreDepartamento Nombre del departamento (no la ruta completa)
 */
export async function obtenerAvisosDepartamento(
  empresaId: string,
  nombreDepartamento: string
): Promise<Aviso[]> {
  try {
    const q = query(
      collection(db, "Avisos"),
      where("empresaId", "==", empresaId),
      where("tipoMuro", "==", "Departamento"),
      where("departamento", "==", nombreDepartamento),
      where("archivado", "==", false)
    );
    
    const snapshot = await getDocs(q);
    const avisos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Aviso[];
    
    // Ordenar: destacados primero, luego por fecha
    return avisos.sort((a, b) => {
      if (a.destacado && !b.destacado) return -1;
      if (!a.destacado && b.destacado) return 1;
      return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
    });
  } catch (error) {
    console.error("❌ Error al obtener avisos de departamento:", error);
    throw error;
  }
}

/**
 * Obtener un aviso por ID
 */
export async function obtenerAvisoPorId(avisoId: string): Promise<Aviso | null> {
  try {
    const avisoRef = doc(db, "Avisos", avisoId);
    const avisoSnap = await getDoc(avisoRef);
    
    if (!avisoSnap.exists()) return null;
    
    return { id: avisoSnap.id, ...avisoSnap.data() } as Aviso;
  } catch (error) {
    console.error("❌ Error al obtener aviso:", error);
    throw error;
  }
}

/**
 * Editar un aviso
 */
export async function editarAviso(
  avisoId: string,
  datos: Partial<Aviso>
): Promise<void> {
  try {
    const avisoRef = doc(db, "Avisos", avisoId);
    await updateDoc(avisoRef, {
      ...datos,
      fechaEdicion: new Date().toISOString(),
    });
    console.log("✅ Aviso editado correctamente");
  } catch (error) {
    console.error("❌ Error al editar aviso:", error);
    throw error;
  }
}

/**
 * Eliminar un aviso
 */
export async function eliminarAviso(avisoId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "Avisos", avisoId));
    console.log("✅ Aviso eliminado");
  } catch (error) {
    console.error("❌ Error al eliminar aviso:", error);
    throw error;
  }
}

/**
 * Archivar un aviso (soft delete)
 */
export async function archivarAviso(avisoId: string): Promise<void> {
  try {
    const avisoRef = doc(db, "Avisos", avisoId);
    await updateDoc(avisoRef, { archivado: true });
    console.log("✅ Aviso archivado");
  } catch (error) {
    console.error("❌ Error al archivar aviso:", error);
    throw error;
  }
}

/**
 * Marcar/desmarcar aviso como destacado
 */
export async function toggleDestacado(
  avisoId: string,
  destacado: boolean
): Promise<void> {
  try {
    const avisoRef = doc(db, "Avisos", avisoId);
    await updateDoc(avisoRef, { destacado });
    console.log(`✅ Aviso ${destacado ? "destacado" : "desmarcado"}`);
  } catch (error) {
    console.error("❌ Error al cambiar destacado:", error);
    throw error;
  }
}

/**
 * Agregar reacción a un aviso
 */
export async function agregarReaccion(
  avisoId: string,
  uid: string,
  nombreUsuario: string,
  tipo: "me_gusta" | "importante" | "celebrar"
): Promise<void> {
  try {
    const avisoRef = doc(db, "Avisos", avisoId);
    const avisoDoc = await getDoc(avisoRef);
    
    if (!avisoDoc.exists()) {
      throw new Error("Aviso no encontrado");
    }
    
    const avisoData = avisoDoc.data();
    let reacciones = avisoData.reacciones || [];
    
    // Verificar si el usuario ya reaccionó
    const reaccionExistente = reacciones.find((r: Reaccion) => r.uid === uid);
    
    if (reaccionExistente) {
      // Si es la misma reacción, la eliminamos
      if (reaccionExistente.tipo === tipo) {
        reacciones = reacciones.filter((r: Reaccion) => r.uid !== uid);
      } else {
        // Si es diferente, la actualizamos
        reacciones = reacciones.map((r: Reaccion) =>
          r.uid === uid
            ? { ...r, tipo, fecha: new Date().toISOString() }
            : r
        );
      }
    } else {
      // Agregar nueva reacción
      reacciones.push({
        uid,
        nombreUsuario,
        tipo,
        fecha: new Date().toISOString(),
      });
    }
    
    await updateDoc(avisoRef, { reacciones });
    console.log("✅ Reacción actualizada");
  } catch (error) {
    console.error("❌ Error al agregar reacción:", error);
    throw error;
  }
}

/**
 * Agregar comentario a un aviso
 */
export async function agregarComentario(
  avisoId: string,
  comentario: {
    texto: string;
    autorUid: string;
    autorNombre: string;
  }
): Promise<void> {
  try {
    const avisoRef = doc(db, "Avisos", avisoId);
    const avisoDoc = await getDoc(avisoRef);
    
    if (!avisoDoc.exists()) {
      throw new Error("Aviso no encontrado");
    }
    
    const avisoData = avisoDoc.data();
    const comentarios = avisoData.comentarios || [];
    
    comentarios.push({
      id: Date.now().toString(),
      texto: comentario.texto,
      autorUid: comentario.autorUid,
      autorNombre: comentario.autorNombre,
      fecha: new Date().toISOString(),
    });
    
    await updateDoc(avisoRef, { comentarios });
    console.log("✅ Comentario agregado");
  } catch (error) {
    console.error("❌ Error al agregar comentario:", error);
    throw error;
  }
}

/**
 * Eliminar comentario de un aviso
 */
export async function eliminarComentario(
  avisoId: string,
  comentarioId: string
): Promise<void> {
  try {
    const avisoRef = doc(db, "Avisos", avisoId);
    const avisoDoc = await getDoc(avisoRef);
    
    if (!avisoDoc.exists()) {
      throw new Error("Aviso no encontrado");
    }
    
    const avisoData = avisoDoc.data();
    const comentarios = (avisoData.comentarios || []).filter(
      (c: ComentarioAviso) => c.id !== comentarioId
    );
    
    await updateDoc(avisoRef, { comentarios });
    console.log("✅ Comentario eliminado");
  } catch (error) {
    console.error("❌ Error al eliminar comentario:", error);
    throw error;
  }
}