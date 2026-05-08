

// import { offlineService } from './OfflineService';
// import { db } from "./firebaseConfig";
// import {
//   collection,
//   addDoc,
//   getDocs,
//   getDoc,
//   doc,
//   updateDoc,
//   deleteDoc,
//   query,
//   where,
// } from "firebase/firestore";
// import { Tarea, TareaFormData, EstadoTarea, Adjunto } from "../types/tareas";
// import NetInfo from '@react-native-community/netinfo';


 /**
  * Obtener tareas de una empresa
  */
// export async function obtenerTareasDeEmpresa(
//   empresaId: string
// ): Promise<Tarea[]> {
//   try {
//     const q = query(
//       collection(db, "Tareas"),
//       where("empresaId", "==", empresaId)
//     );
    
//     const snapshot = await getDocs(q);
//     const tareas = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     })) as Tarea[];
    
//     // Ordenar en el cliente
//     return tareas.sort((a, b) => 
//       new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
//     );
//   } catch (error: any) {
//     console.error("❌ Error al obtener tareas:", error);
//     console.error("Código de error:", error.code);
//     console.error("Mensaje:", error.message);
//     throw error;
//   }
// }

/**
  * Obtener tareas asignadas a un usuario
  */
// export async function obtenerTareasAsignadas(
//   uid: string,
//   empresaId: string
// ): Promise<Tarea[]> {
//   try {
//     const q = query(
//       collection(db, "Tareas"),
//       where("empresaId", "==", empresaId),
//       where("asignadoA", "array-contains", uid)
//     );
    
//     const snapshot = await getDocs(q);
//     const tareas = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     })) as Tarea[];
    
//     // Ordenar en el cliente
//     return tareas.sort((a, b) => 
//       new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
//     );
//   } catch (error: any) {
//     console.error("❌ Error al obtener tareas asignadas:", error);
//     console.error("Código de error:", error.code);
//     console.error("Mensaje:", error.message);
//     throw error;
//   }
// }

 /**
  * Obtener tareas creadas por un usuario
  */
// export async function obtenerTareasCreadasPor(
//   uid: string,
//   empresaId: string
// ): Promise<Tarea[]> {
//   try {
//     const q = query(
//       collection(db, "Tareas"),
//       where("empresaId", "==", empresaId),
//       where("creadaPor", "==", uid)
//     );
    
//     const snapshot = await getDocs(q);
//     const tareas = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     })) as Tarea[];
    
//     // Ordenar en el cliente
//     return tareas.sort((a, b) => 
//       new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
//     );
//   } catch (error: any) {
//     console.error("❌ Error al obtener tareas creadas:", error);
//     console.error("Código de error:", error.code);
//     console.error("Mensaje:", error.message);
//     throw error;
//   }
// }


 /**
  * Editar una tarea existente
  */
// export async function editarTarea(
//   tareaId: string,
//   datos: Partial<Tarea>
// ): Promise<void> {
//   try {
//     const tareaRef = doc(db, "Tareas", tareaId);
//     await updateDoc(tareaRef, datos);
//     console.log("✅ Tarea editada correctamente");
//   } catch (error) {
//     console.error("❌ Error al editar tarea:", error);
//     throw error;
//   }
// }

 /**
  * Eliminar una tarea
  */
// export async function eliminarTarea(tareaId: string): Promise<void> {
//   try {
//     await deleteDoc(doc(db, "Tareas", tareaId));
//     console.log("✅ Tarea eliminada");
//   } catch (error) {
//     console.error("❌ Error al eliminar tarea:", error);
//     throw error;
//   }
// }

// export async function obtenerTareasDepartamento(
//   empresaId: string,
//   nombreDepartamento: string
// ): Promise<Tarea[]> {
//   try {
//     // Primero obtenemos todas las tareas de la empresa
//     const q = query(
//       collection(db, "Tareas"),
//       where("empresaId", "==", empresaId)
//     );
    
//     const snapshot = await getDocs(q);
//     const tareas = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     })) as Tarea[];
    
//     // Filtrar tareas donde al menos un usuario asignado es del departamento
//     // Para esto necesitamos obtener los usuarios del departamento
//     const usuariosQuery = query(
//       collection(db, "Usuarios"),
//       where("empresaId", "==", empresaId),
//       where("nombreDepartamento", "==", nombreDepartamento)
//     );
    
//     const usuariosSnap = await getDocs(usuariosQuery);
//     const uidsDelDepto = usuariosSnap.docs.map(doc => doc.id);
    
//     // Filtrar tareas donde el creador o algún asignado pertenece al departamento
//     const tareasDepartamento = tareas.filter(tarea => {
//       // Incluir si el creador es del departamento
//       if (uidsDelDepto.includes(tarea.creadaPor)) return true;
      
//       // Incluir si algún asignado es del departamento
//       if (tarea.asignadoA.some(uid => uidsDelDepto.includes(uid))) return true;
      
//       return false;
//     });
    
//     // Ordenar por fecha
//     return tareasDepartamento.sort((a, b) => 
//       new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
//     );
//   } catch (error: any) {
//     console.error("❌ Error al obtener tareas de departamento:", error);
//     throw error;
//   }
// }

 /**
  * Obtener tareas asignadas a usuarios de un departamento
  */
// export async function obtenerTareasAsignadasDepartamento(
//   uid: string,
//   empresaId: string,
//   nombreDepartamento: string
// ): Promise<Tarea[]> {
//   try {
//     const q = query(
//       collection(db, "Tareas"),
//       where("empresaId", "==", empresaId),
//       where("asignadoA", "array-contains", uid)
//     );
    
//     const snapshot = await getDocs(q);
//     const tareas = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     })) as Tarea[];
    
//     // Obtener usuarios del departamento para filtrar
//     const usuariosQuery = query(
//       collection(db, "Usuarios"),
//       where("empresaId", "==", empresaId),
//       where("nombreDepartamento", "==", nombreDepartamento)
//     );
    
//     const usuariosSnap = await getDocs(usuariosQuery);
//     const uidsDelDepto = usuariosSnap.docs.map(doc => doc.id);
    
//     // Filtrar tareas relacionadas con el departamento
//     const tareasDepartamento = tareas.filter(tarea => {
//       // Incluir si el creador es del departamento
//       if (uidsDelDepto.includes(tarea.creadaPor)) return true;
      
//       // Incluir si algún asignado adicional es del departamento
//       if (tarea.asignadoA.some(uidAsignado => uidsDelDepto.includes(uidAsignado))) return true;
      
//       return false;
//     });
    
//     return tareasDepartamento.sort((a, b) => 
//       new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
//     );
//   } catch (error: any) {
//     console.error("❌ Error al obtener tareas asignadas de departamento:", error);
//     throw error;
//   }
// }

 /**
  * Crear una nueva tarea (con soporte offline)
  */
// export async function crearTarea(
//   formData: TareaFormData,
//   creadaPor: string,
//   nombreCreador: string,
//   empresaId: string,
//   empresaNombre: string,
//   nombresAsignados: string[],
//   rolCreador?: string
// ): Promise<string> {
//   // Verificar conexión
//   const state = await NetInfo.fetch();
//   const isOnline = state.isConnected ?? false;

//   const tareaData = {
//     titulo: formData.titulo,
//     descripcion: formData.descripcion,
//     prioridad: formData.prioridad,
//     estado: "Pendiente" as EstadoTarea,
    
//     fechaVencimiento: formData.fechaVencimiento?.toISOString() || null,
    
//     creadaPor,
//     nombreCreador,
//     asignadoA: formData.asignadoA,
//     nombresAsignados,
    
//     empresaId,
//     empresaNombre,
    
//     etiquetas: formData.etiquetas || [],
//     comentarios: [],

//   tipoAsignacion: formData.tipoAsignacion || "usuarios",
//   departamentoAsignado: formData.departamentoAsignado || null,
//   };

//   if (!isOnline) {
//     // Modo offline - agregar a cola
//     const offlineId = await offlineService.addOperation(
//       'crear_tarea',
//       tareaData,
//       creadaPor
//     );

//     console.log(" Tarea guardada offline:", offlineId);
//     return offlineId;
//   }

//   // Modo online - guardar directamente
//   try {

//     const docRef = await addDoc(collection(db, "Tareas"), {
//       ...tareaData,
//       fechaCreacion: new Date().toISOString(),
//     });

//     console.log(" Tarea creada con ID:", docRef.id);
//     return docRef.id;
//   } catch (error: any) {
//     console.error(" Error al crear tarea:", error);
    
//     if (error.code === "permission-denied") {
//       throw new Error("No tienes permisos para asignar esta tarea a los usuarios seleccionados");
//     }
    
//     throw error;
//   }
// }

/**
  * Actualizar estado de una tarea (con soporte offline)
  */

// export async function actualizarEstadoTarea(
//   tareaId: string,
//   nuevoEstado: EstadoTarea
// ): Promise<void> {
//   // Verificar conexión
//   const state = await NetInfo.fetch();
//   const isOnline = state.isConnected ?? false;

//   const updateData: any = { estado: nuevoEstado };
  
//   if (nuevoEstado === "Completada") {
//     updateData.fechaCompletada = new Date().toISOString();
//   }

//   if (!isOnline) {
//     // Modo offline
//     await offlineService.addOperation(
//       'actualizar_estado_tarea',
//       { tareaId, estado: nuevoEstado },
//       'current_user'
//     );
//     console.log(" Actualización de estado guardada offline");
//     return;
//   }

//   // Modo online
//   try {
//     const tareaRef = doc(db, "Tareas", tareaId);
//     await updateDoc(tareaRef, updateData);
//     console.log(` Estado actualizado: ${nuevoEstado}`);
//   } catch (error) {
//     console.error("Error al actualizar estado:", error);
//     throw error;
//   }
// }

 /**
  * Agregar comentario (con soporte offline)
  */
// export async function agregarComentario(
//   tareaId: string,
//   comentario: {
//     texto: string;
//     autorUid: string;
//     autorNombre: string;
//   }
// ): Promise<void> {
//   try {
//     const tareaRef = doc(db, "Tareas", tareaId);
//     const tareaDoc = await getDoc(tareaRef);
    
//     if (!tareaDoc.exists()) {
//       throw new Error("Tarea no encontrada");
//     }
    
//     const tareaData = tareaDoc.data();
//     const comentarios = tareaData.comentarios || [];
    
//     comentarios.push({
//       id: Date.now().toString(),
//       texto: comentario.texto,
//       autorUid: comentario.autorUid,
//       autorNombre: comentario.autorNombre,
//       fecha: new Date().toISOString(),
//     });

//     // Verificar conexión
//     const state = await NetInfo.fetch();
//     const isOnline = state.isConnected ?? false;

//     if (!isOnline) {
//       await offlineService.addOperation(
//         'agregar_comentario_tarea',
//         { tareaId, comentarios },
//         comentario.autorUid
//       );
//       console.log(" Comentario guardado offline");
//       return;
//     }
    
//     await updateDoc(tareaRef, { comentarios });
//     console.log(" Comentario agregado");
//   } catch (error) {
//     console.error(" Error al agregar comentario:", error);
//     throw error;
//   }
// }

// // ─────────────────────────────────────────────
// //  ADJUNTOS / ENTREGABLES  (enlaces externos)
// // ─────────────────────────────────────────────

// export async function agregarEnlaceAdjunto(
//   tareaId: string,
//   enlace: { nombre: string; url: string },
//   subidoPor: string,
//   nombreSubidor: string
// ): Promise<Adjunto> {
//   const tareaRef = doc(db, "Tareas", tareaId);
//   const tareaSnap = await getDoc(tareaRef);

//   if (!tareaSnap.exists()) throw new Error("Tarea no encontrada");

//   const nuevoAdjunto: Adjunto = {
//     id: Date.now().toString(),
//     nombre: enlace.nombre.trim(),
//     url: enlace.url.trim(),
//     subidoPor,
//     nombreSubidor,
//     fechaSubida: new Date().toISOString(),
//   };

//   const adjuntosActuales: Adjunto[] = tareaSnap.data().adjuntos || [];
//   await updateDoc(tareaRef, {
//     adjuntos: [...adjuntosActuales, nuevoAdjunto],
//   });

//   console.log(" Enlace agregado:", nuevoAdjunto.nombre);
//   return nuevoAdjunto;
// }

 /**
  * Elimina un enlace adjunto de la lista en Firestore.
  */
// export async function eliminarAdjunto(
//   tareaId: string,
//   adjuntoId: string
// ): Promise<void> {
//   const tareaRef = doc(db, "Tareas", tareaId);
//   const tareaSnap = await getDoc(tareaRef);

//   if (!tareaSnap.exists()) throw new Error("Tarea no encontrada");

//   const adjuntosActuales: Adjunto[] = tareaSnap.data().adjuntos || [];
//   await updateDoc(tareaRef, {
//     adjuntos: adjuntosActuales.filter((a) => a.id !== adjuntoId),
//   });

//   console.log(" Enlace eliminado:", adjuntoId);
// }
 //  tareasService.ts
//  Lectura y escritura de tareas contra FastAPI (Railway).
//  Fallback offline: SQLite local vía sqliteTareasService.
 
import { offlineService } from './OfflineService';
import {
  guardarTareasLocales,
  obtenerTareasCreadasLocales,
  obtenerTareasAsignadasLocales,
  guardarTareaLocal,
  obtenerTareasLocales,
} from './sqlTareasService';
import {
  crearTareaRailway,
  obtenerTareasRailway,
  actualizarEstadoTareaRailway,
  eliminarTareaRailway,
  TareaRailway,
} from './railwayApiService';
import { Tarea, TareaFormData, EstadoTarea, Adjunto } from '../types/tareas';
import NetInfo from '@react-native-community/netinfo';

 //  Helper: convierte TareaRailway → Tarea (tipo de la app)
 function mapRailwayToTarea(t: TareaRailway): Tarea {
  return {
    id: String(t.id ?? ''),
    titulo: t.titulo ?? '',
    descripcion: t.descripcion ?? '',
    prioridad: (t.prioridad as any) ?? 'Media',
    estado: (t.estado as any) ?? 'Pendiente',
    fechaCreacion: t.fechaCreacion ?? new Date().toISOString(),
    fechaVencimiento: t.fechaVencimiento ?? undefined,
    fechaCompletada: t.fechaCompletada ?? undefined,
    creadaPor: t.creadaPor ?? '',
    nombreCreador: t.nombreCreador ?? '',
    asignadoA: t.asignadoA ?? [],
    nombresAsignados: t.nombresAsignados ?? [],
    empresaId: t.empresaId ?? '',
    empresaNombre: t.empresaNombre ?? '',
    etiquetas: t.etiquetas ?? [],
    comentarios: t.comentarios ?? [],
    adjuntos: t.adjuntos ?? [],
    tipoAsignacion: (t.tipoAsignacion as any) ?? 'usuarios',
    departamentoAsignado: t.departamentoAsignado ?? null,
  } as Tarea;
}

 //  LECTURA DE TAREAS
 
/** Todas las tareas de una empresa */
export async function obtenerTareasDeEmpresa(
  empresaId: string
): Promise<Tarea[]> {
  try {
    const raw = await obtenerTareasRailway({ empresaId });
    const tareas = raw.map(mapRailwayToTarea).sort(
      (a, b) =>
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
    await guardarTareasLocales(tareas); // actualiza caché SQLite
    return tareas;
 } catch (error) {
    console.error('❌ ERROR REAL FastAPI:', JSON.stringify(error));
    console.log('📴 FastAPI no disponible — cargando tareas desde SQLite');
    return obtenerTareasLocales(empresaId);
  }
}

/** Tareas asignadas a un usuario */
export async function obtenerTareasAsignadas(
  uid: string,
  empresaId: string
): Promise<Tarea[]> {
  try {
    const raw = await obtenerTareasRailway({ empresaId, asignadoA: uid });
    const tareas = raw.map(mapRailwayToTarea).sort(
      (a, b) =>
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
    await guardarTareasLocales(tareas);
    return tareas;
   } catch (error) {
    console.error('❌ ERROR REAL FastAPI:', JSON.stringify(error));
    console.log('📴 FastAPI no disponible — cargando tareas desde SQLite');
    return obtenerTareasAsignadasLocales(uid, empresaId);
  }
}

/** Tareas creadas por un usuario */
export async function obtenerTareasCreadasPor(
  uid: string,
  empresaId: string
): Promise<Tarea[]> {
  try {
    const raw = await obtenerTareasRailway({ empresaId, creadaPor: uid });
    const tareas = raw.map(mapRailwayToTarea).sort(
      (a, b) =>
        new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
    await guardarTareasLocales(tareas);
    return tareas;
   } catch (error) {
    console.error('❌ ERROR REAL FastAPI:', JSON.stringify(error));
    console.log('📴 FastAPI no disponible — cargando tareas desde SQLite');
    return obtenerTareasCreadasLocales(uid, empresaId);
  }
}

/** Tareas de un departamento (filtra en cliente por ahora) */
export async function obtenerTareasDepartamento(
  empresaId: string,
  nombreDepartamento: string
): Promise<Tarea[]> {
  try {
    const todas = await obtenerTareasDeEmpresa(empresaId);
    return todas.filter(
      (t) => (t as any).departamentoAsignado === nombreDepartamento
    );
  } catch (error) {
    console.error('❌ Error al obtener tareas de departamento:', error);
    throw error;
  }
}

/** Tareas asignadas al usuario en un departamento */
export async function obtenerTareasAsignadasDepartamento(
  uid: string,
  empresaId: string,
  nombreDepartamento: string
): Promise<Tarea[]> {
  try {
    const asignadas = await obtenerTareasAsignadas(uid, empresaId);
    return asignadas.filter(
      (t) => (t as any).departamentoAsignado === nombreDepartamento
    );
  } catch (error) {
    console.error('❌ Error al obtener tareas asignadas de departamento:', error);
    throw error;
  }
}

 //  CREAR TAREA
 
export async function crearTarea(
  formData: TareaFormData,
  creadaPor: string,
  nombreCreador: string,
  empresaId: string,
  empresaNombre: string,
  nombresAsignados: string[],
  rolCreador?: string
): Promise<string> {
  console.log("CrearTarea llamada")
  const state = await NetInfo.fetch();
  const isOnline = state.isConnected ?? false;

  const tareaData = {
    titulo: formData.titulo,
    descripcion: formData.descripcion,
    prioridad: formData.prioridad,
    estado: 'Pendiente' as EstadoTarea,
    fechaVencimiento: formData.fechaVencimiento?.toISOString() ?? null,
    creadaPor,
    nombreCreador,
    asignadoA: formData.asignadoA,
    nombresAsignados,
    empresaId,
    empresaNombre,
    etiquetas: formData.etiquetas ?? [],
    comentarios: [],
    adjuntos: [],
    tipoAsignacion: formData.tipoAsignacion ?? 'usuarios',
    departamentoAsignado: formData.departamentoAsignado ?? null,
  };

  // ── Sin conexión: encolar y guardar en SQLite ──────────────
  if (!isOnline) {
    const offlineId = await offlineService.addOperation(
      'crear_tarea',
      tareaData,
      creadaPor
    );
    await guardarTareaLocal({
      id: offlineId,
      ...tareaData,
      fechaCreacion: new Date().toISOString(),
    } as Tarea);
    console.log('📴 Tarea guardada offline:', offlineId);
    return offlineId;
  }

  // ── Con conexión: enviar a FastAPI ─────────────────────────
  try {
    const creada = await crearTareaRailway({
      ...tareaData,
      fechaCreacion: new Date().toISOString(),
    });
    const id = String(creada.id ?? Date.now());
    console.log('✅ Tarea creada en FastAPI con ID:', id);
    return id;
  } catch (error: any) {
    console.error('❌ Error al crear tarea en FastAPI:', error.message);
    // Fallback: encolar para reintentar después
    const offlineId = await offlineService.addOperation(
      'crear_tarea',
      tareaData,
      creadaPor
    );
    await guardarTareaLocal({
      id: offlineId,
      ...tareaData,
      fechaCreacion: new Date().toISOString(),
    } as Tarea);
    return offlineId;
  }
}

 //  ACTUALIZAR ESTADO
 
export async function actualizarEstadoTarea(
  tareaId: string,
  nuevoEstado: EstadoTarea
): Promise<void> {
  const state = await NetInfo.fetch();
  const isOnline = state.isConnected ?? false;

  if (!isOnline) {
    await offlineService.addOperation(
      'actualizar_estado_tarea',
      { tareaId, estado: nuevoEstado },
      'current_user'
    );
    console.log('📴 Cambio de estado encolado offline');
    return;
  }

  try {
    await actualizarEstadoTareaRailway(tareaId, nuevoEstado);
    console.log(`✅ Estado actualizado: ${nuevoEstado}`);
  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    throw error;
  }
}

 //  AGREGAR COMENTARIO
 
export async function agregarComentario(
  tareaId: string,
  comentario: { texto: string; autorUid: string; autorNombre: string }
): Promise<void> {
  const state = await NetInfo.fetch();
  const isOnline = state.isConnected ?? false;

  if (!isOnline) {
    await offlineService.addOperation(
      'agregar_comentario_tarea',
      { tareaId, comentario },
      comentario.autorUid
    );
    console.log('📴 Comentario encolado offline');
    return;
  }

  try {
    const { API_URL } = await import('./railwayApiService');
    const response = await fetch(`${API_URL}/tareas/${tareaId}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comentario),
    });
    if (!response.ok) throw new Error('Error al agregar comentario');
    console.log('✅ Comentario agregado en FastAPI');
  } catch (error) {
    console.error('❌ Error al agregar comentario:', error);
    throw error;
  }
}

 //  EDITAR TAREA  (se mantiene simple — siempre online)
 
export async function editarTarea(
  tareaId: string,
  datos: Partial<Tarea>
): Promise<void> {
  try {
    const { API_URL } = await import('./railwayApiService');
    const response = await fetch(`${API_URL}/tareas/${tareaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    });
    if (!response.ok) throw new Error('Error al editar tarea');
    console.log('✅ Tarea editada en FastAPI');
  } catch (error) {
    console.error('❌ Error al editar tarea:', error);
    throw error;
  }
}

 //  ELIMINAR TAREA
 
export async function eliminarTarea(tareaId: string): Promise<void> {
  try {
    await eliminarTareaRailway(tareaId);
    console.log('✅ Tarea eliminada en FastAPI');
  } catch (error) {
    console.error('❌ Error al eliminar tarea:', error);
    throw error;
  }
}

 //  ADJUNTOS  (links externos — siempre online)
 
export async function agregarEnlaceAdjunto(
  tareaId: string,
  enlace: { nombre: string; url: string },
  subidoPor: string,
  nombreSubidor: string
): Promise<Adjunto> {
  const nuevoAdjunto: Adjunto = {
    id: Date.now().toString(),
    nombre: enlace.nombre.trim(),
    url: enlace.url.trim(),
    subidoPor,
    nombreSubidor,
    fechaSubida: new Date().toISOString(),
  };

  try {
    const { API_URL } = await import('./railwayApiService');
    const response = await fetch(`${API_URL}/tareas/${tareaId}/adjuntos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoAdjunto),
    });
    if (!response.ok) throw new Error('Error al agregar adjunto');
    console.log('✅ Adjunto agregado en FastAPI');
  } catch (error) {
    console.error('❌ Error al agregar adjunto:', error);
    throw error;
  }

  return nuevoAdjunto;
}

export async function eliminarAdjunto(
  tareaId: string,
  adjuntoId: string
): Promise<void> {
  try {
    const { API_URL } = await import('./railwayApiService');
    const response = await fetch(
      `${API_URL}/tareas/${tareaId}/adjuntos/${adjuntoId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Error al eliminar adjunto');
    console.log('✅ Adjunto eliminado en FastAPI');
  } catch (error) {
    console.error('❌ Error al eliminar adjunto:', error);
    throw error;
  }
}