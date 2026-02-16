import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { offlineService } from "./OfflineService";
import NetInfo from '@react-native-community/netinfo';

export type TipoMuro = "general" | "departamento";

export interface Publicacion {
  id: string;
  contenido: string;
  empresaId: string;
  tipoMuro: TipoMuro;
  departamentoId?: string;
  nombreDepartamento?: string;
  creadaPor: string;
  nombreUsuario: string;
  rolUsuario: string;
  fechaCreacion: any;
  fechaActualizacion?: any;
  comentarios?: Comentario[];
  reacciones?: Reaccion[];
  // Campos para modo offline
  isOffline?: boolean;
  offlineId?: string;
}

export interface Comentario {
  id: string;
  texto: string;
  autorUid: string;
  autorNombre: string;
  fecha: string;
}

export interface Reaccion {
  uid: string;
  nombreUsuario: string;
  tipo: "me_gusta" | "importante" | "celebrar";
  fecha: string;
}

/**
 * Crear una nueva publicación (con soporte offline)
 */
export const crearPublicacion = async (data: {
  contenido: string;
  empresaId: string;
  tipoMuro: TipoMuro;
  departamentoId?: string;
  nombreDepartamento?: string;
  creadaPor: string;
  nombreUsuario: string;
  rolUsuario: string;
}): Promise<string> => {
  // Verificar conexión
  const state = await NetInfo.fetch();
  const isOnline = state.isConnected ?? false;

  if (!isOnline) {
    // Modo offline - agregar a cola
    const offlineId = await offlineService.addOperation(
      'crear_publicacion',
      {
        contenido: data.contenido,
        empresaId: data.empresaId,
        tipoMuro: data.tipoMuro,
        departamentoId: data.departamentoId || null,
        nombreDepartamento: data.nombreDepartamento || null,
        creadaPor: data.creadaPor,
        nombreUsuario: data.nombreUsuario,
        rolUsuario: data.rolUsuario,
        comentarios: [],
        reacciones: [],
      },
      data.creadaPor
    );

    console.log("📴 Publicación guardada offline:", offlineId);
    return offlineId;
  }

  // Modo online - guardar directamente
  try {
    const docRef = await addDoc(collection(db, "Publicaciones"), {
      contenido: data.contenido,
      empresaId: data.empresaId,
      tipoMuro: data.tipoMuro,
      departamentoId: data.departamentoId || null,
      nombreDepartamento: data.nombreDepartamento || null,
      creadaPor: data.creadaPor,
      nombreUsuario: data.nombreUsuario,
      rolUsuario: data.rolUsuario,
      fechaCreacion: serverTimestamp(),
      comentarios: [],
      reacciones: [],
    });

    console.log("✅ Publicación creada:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creando publicación:", error);
    throw error;
  }
};

/**
 * Obtener publicaciones del muro general
 */
export const obtenerMuroGeneral = async (empresaId: string): Promise<Publicacion[]> => {
  try {
    const q = query(
      collection(db, "Publicaciones"),
      where("empresaId", "==", empresaId),
      where("tipoMuro", "==", "general")
    );
    const snap = await getDocs(q);
    
    const publicaciones = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Publicacion[];

    // Ordenar por fecha (más recientes primero)
    return publicaciones.sort((a, b) => {
      const fechaA = a.fechaCreacion?.seconds || 0;
      const fechaB = b.fechaCreacion?.seconds || 0;
      return fechaB - fechaA;
    });
  } catch (error) {
    console.error("❌ Error obteniendo muro general:", error);
    throw error;
  }
};

/**
 * Obtener publicaciones del muro de departamento
 */
export const obtenerMuroDepartamento = async (
  empresaId: string,
  departamentoId: string
): Promise<Publicacion[]> => {
  const q = query(
    collection(db, "Publicaciones"),
    where("empresaId", "==", empresaId),
    where("tipoMuro", "==", "departamento"),
    where("departamentoId", "==", departamentoId), 
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<Publicacion, "id">;

    return {
      id: doc.id,
      ...data,
    };
  });
};

/**
 * Editar una publicación (con soporte offline)
 */
export const editarPublicacion = async (
  postId: string,
  contenido: string
): Promise<void> => {
  const state = await NetInfo.fetch();
  const isOnline = state.isConnected ?? false;

  if (!isOnline) {
    // Modo offline
    await offlineService.addOperation(
      'editar_publicacion',
      { postId, contenido },
      'current_user' // Deberías pasar el UID real
    );
    console.log("📴 Edición guardada offline");
    return;
  }

  // Modo online
  try {
    await updateDoc(doc(db, "Publicaciones", postId), {
      contenido,
      fechaActualizacion: serverTimestamp(),
    });
    console.log("✅ Publicación editada");
  } catch (error) {
    console.error("❌ Error editando publicación:", error);
    throw error;
  }
};

/**
 * Eliminar una publicación
 */
export const eliminarPublicacion = async (postId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "Publicaciones", postId));
    console.log("✅ Publicación eliminada");
  } catch (error) {
    console.error("❌ Error eliminando publicación:", error);
    throw error;
  }
};

/**
 * Agregar reacción a una publicación (con soporte offline)
 */
export const agregarReaccion = async (
  postId: string,
  uid: string,
  nombreUsuario: string,
  tipo: "me_gusta" | "importante" | "celebrar"
): Promise<void> => {
  try {
    const postRef = doc(db, "Publicaciones", postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error("Publicación no encontrada");
    }

    const postData = postDoc.data();
    let reacciones = postData.reacciones || [];

    const reaccionExistente = reacciones.find((r: Reaccion) => r.uid === uid);

    if (reaccionExistente) {
      if (reaccionExistente.tipo === tipo) {
        reacciones = reacciones.filter((r: Reaccion) => r.uid !== uid);
      } else {
        reacciones = reacciones.map((r: Reaccion) =>
          r.uid === uid ? { ...r, tipo, fecha: new Date().toISOString() } : r
        );
      }
    } else {
      reacciones.push({
        uid,
        nombreUsuario,
        tipo,
        fecha: new Date().toISOString(),
      });
    }

    const state = await NetInfo.fetch();
    const isOnline = state.isConnected ?? false;

    if (!isOnline) {
      await offlineService.addOperation(
        'agregar_reaccion',
        { postId, reacciones },
        uid
      );
      console.log("📴 Reacción guardada offline");
      return;
    }

    await updateDoc(postRef, { reacciones });
    console.log("✅ Reacción actualizada");
  } catch (error) {
    console.error("❌ Error agregando reacción:", error);
    throw error;
  }
};

/**
 * Agregar comentario a una publicación
 */
export const agregarComentario = async (
  postId: string,
  comentario: {
    texto: string;
    autorUid: string;
    autorNombre: string;
  }
): Promise<void> => {
  try {
    const postRef = doc(db, "Publicaciones", postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error("Publicación no encontrada");
    }

    const postData = postDoc.data();
    const comentarios = postData.comentarios || [];

    comentarios.push({
      id: Date.now().toString(),
      texto: comentario.texto,
      autorUid: comentario.autorUid,
      autorNombre: comentario.autorNombre,
      fecha: new Date().toISOString(),
    });

    await updateDoc(postRef, { comentarios });
    console.log("✅ Comentario agregado");
  } catch (error) {
    console.error("❌ Error agregando comentario:", error);
    throw error;
  }
};

/**
 * Eliminar comentario de una publicación
 */
export const eliminarComentario = async (
  postId: string,
  comentarioId: string
): Promise<void> => {
  try {
    const postRef = doc(db, "Publicaciones", postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error("Publicación no encontrada");
    }

    const postData = postDoc.data();
    const comentarios = (postData.comentarios || []).filter(
      (c: Comentario) => c.id !== comentarioId
    );

    await updateDoc(postRef, { comentarios });
    console.log("✅ Comentario eliminado");
  } catch (error) {
    console.error("❌ Error eliminando comentario:", error);
    throw error;
  }
};