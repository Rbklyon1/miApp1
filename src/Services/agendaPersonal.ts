
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
//   orderBy,
// } from "firebase/firestore";
// import {
//   EventoPersonal,
//   EventoPersonalFormData,
// } from "../types/Agendapersonal";

// const COLECCION = "EventosPersonales";


// export async function crearEventoPersonal(
//   formData: EventoPersonalFormData,
//   uid: string
// ): Promise<string> {
//   try {
//     const ahora = new Date().toISOString();

//     const docRef = await addDoc(collection(db, COLECCION), {
//       uid,
//       titulo: formData.titulo,
//       descripcion: formData.descripcion || "",
//       tipo: formData.tipo,
//       color: formData.color,

//       fechaInicio: formData.fechaInicio.toISOString(),
//       horaInicio: formData.horaInicio,
//       fechaFin: formData.fechaFin?.toISOString() || null,
//       horaFin: formData.horaFin || null,

//       ubicacion: formData.ubicacion || null,
//       notas: formData.notas || "",
//       completado: false,

//       fechaCreacion: ahora,
//       fechaActualizacion: ahora,
//     });

//     return docRef.id;
//   } catch (error: any) {
//     console.error("Error al crear evento personal:", error);
//     throw error;
//   }
// }


// export async function obtenerEventosPersonales(
//   uid: string
// ): Promise<EventoPersonal[]> {
//   try {
//     const q = query(
//       collection(db, COLECCION),
//       where("uid", "==", uid),
//       orderBy("fechaInicio", "asc")
//     );

//     const snapshot = await getDocs(q);
//     return snapshot.docs.map((d) => ({
//       id: d.id,
//       ...d.data(),
//     })) as EventoPersonal[];
//   } catch (error: any) {
//     // Firestore puede fallar si el índice compuesto no está creado aún;
//     // en ese caso hacemos un fallback sin orderBy y ordenamos en memoria.
//     if (error.code === "failed-precondition") {
//       const q2 = query(
//         collection(db, COLECCION),
//         where("uid", "==", uid)
//       );
//       const snapshot = await getDocs(q2);
//       const eventos = snapshot.docs.map((d) => ({
//         id: d.id,
//         ...d.data(),
//       })) as EventoPersonal[];
//       return eventos.sort(
//         (a, b) =>
//           new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
//       );
//     }
//     console.error("Error al obtener eventos personales:", error);
//     throw error;
//   }
// }


// export async function obtenerEventoPersonalPorId(
//   eventoId: string,
//   uid: string
// ): Promise<EventoPersonal | null> {
//   try {
//     const ref = doc(db, COLECCION, eventoId);
//     const snap = await getDoc(ref);

//     if (!snap.exists()) return null;

//     const data = snap.data() as EventoPersonal;
//     // Seguridad extra en cliente: solo devolver si es el dueño
//     if (data.uid !== uid) return null;

//     return { id: snap.id, ...data };
//   } catch (error) {
//     console.error("Error al obtener evento personal:", error);
//     throw error;
//   }
// }


// export async function editarEventoPersonal(
//   eventoId: string,
//   uid: string,
//   datos: Partial<EventoPersonalFormData> & { completado?: boolean }
// ): Promise<void> {
//   try {
//     // Verificar propiedad antes de editar
//     const evento = await obtenerEventoPersonalPorId(eventoId, uid);
//     if (!evento) throw new Error("Evento no encontrado o sin permisos");

//     const actualizacion: Record<string, any> = {
//       fechaActualizacion: new Date().toISOString(),
//     };

//     if (datos.titulo !== undefined) actualizacion.titulo = datos.titulo;
//     if (datos.descripcion !== undefined) actualizacion.descripcion = datos.descripcion;
//     if (datos.tipo !== undefined) actualizacion.tipo = datos.tipo;
//     if (datos.color !== undefined) actualizacion.color = datos.color;
//     if (datos.fechaInicio !== undefined)
//       actualizacion.fechaInicio = datos.fechaInicio.toISOString();
//     if (datos.horaInicio !== undefined) actualizacion.horaInicio = datos.horaInicio;
//     if (datos.fechaFin !== undefined)
//       actualizacion.fechaFin = datos.fechaFin?.toISOString() || null;
//     if (datos.horaFin !== undefined) actualizacion.horaFin = datos.horaFin || null;
//     if (datos.ubicacion !== undefined) actualizacion.ubicacion = datos.ubicacion || null;
//     if (datos.notas !== undefined) actualizacion.notas = datos.notas;
//     if (datos.completado !== undefined) actualizacion.completado = datos.completado;

//     await updateDoc(doc(db, COLECCION, eventoId), actualizacion);
//   } catch (error) {
//     console.error("Error al editar evento personal:", error);
//     throw error;
//   }
// }


// export async function toggleCompletadoEventoPersonal(
//   eventoId: string,
//   uid: string,
//   completado: boolean
// ): Promise<void> {
//   return editarEventoPersonal(eventoId, uid, { completado });
// }


// export async function eliminarEventoPersonal(
//   eventoId: string,
//   uid: string
// ): Promise<void> {
//   try {
//     const evento = await obtenerEventoPersonalPorId(eventoId, uid);
//     if (!evento) throw new Error("Evento no encontrado o sin permisos");

//     await deleteDoc(doc(db, COLECCION, eventoId));
//   } catch (error) {
//     console.error("Error al eliminar evento personal:", error);
//     throw error;
//   }
// }


// export async function obtenerEventosPersonalesProximos(
//   uid: string,
//   dias = 7
// ): Promise<EventoPersonal[]> {
//   const todos = await obtenerEventosPersonales(uid);
//   const hoy = new Date();
//   const limite = new Date();
//   limite.setDate(hoy.getDate() + dias);

//   return todos.filter((e) => {
//     const fecha = new Date(e.fechaInicio);
//     return fecha >= hoy && fecha <= limite && !e.completado;
//   });
// }

// export async function obtenerEventosPersonalesPorMes(
//   uid: string,
//   anio: number,
//   mes: number 
// ): Promise<EventoPersonal[]> {
//   const todos = await obtenerEventosPersonales(uid);

//   return todos.filter((e) => {
//     const fecha = new Date(e.fechaInicio);
//     return fecha.getFullYear() === anio && fecha.getMonth() === mes;
//   });
// }

//  agendaPersonal.ts
//  Lectura y escritura de eventos personales contra FastAPI.
//  Fallback: Firebase Firestore cuando no hay conexión.


import { API_URL } from './railwayApiService';
import { db } from './firebaseConfig';
import {
  collection, addDoc, getDocs, getDoc,
  doc, updateDoc, deleteDoc, query, where, orderBy,
} from 'firebase/firestore';
import { EventoPersonal, EventoPersonalFormData } from '../types/Agendapersonal';

//  Helper HTTP

async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`FastAPI error ${response.status}: ${text}`);
  }
  return response.json();
}


//  Helper: convierte fila de FastAPI → tipo EventoPersonal


function mapApiToEvento(e: any): EventoPersonal {
  return {
    id: String(e.id ?? ''),
    uid: e.uid ?? '',
    titulo: e.titulo ?? '',
    descripcion: e.descripcion ?? '',
    tipo: e.tipo ?? '',
    color: e.color ?? '',
    fechaInicio: e.fechaInicio ?? '',
    horaInicio: e.horaInicio ?? '',
    fechaFin: e.fechaFin ?? null,
    horaFin: e.horaFin ?? null,
    ubicacion: e.ubicacion ?? null,
    notas: e.notas ?? '',
    completado: e.completado ?? false,
    fechaCreacion: e.fechaCreacion ?? new Date().toISOString(),
    fechaActualizacion: e.fechaActualizacion ?? new Date().toISOString(),
  } as EventoPersonal;
}


//  CREAR EVENTO PERSONAL


export async function crearEventoPersonal(
  formData: EventoPersonalFormData,
  uid: string
): Promise<string> {
  try {
    const ahora = new Date().toISOString();
    const result = await apiFetch<{ evento: any }>('/agenda', {
      method: 'POST',
      body: JSON.stringify({
        uid,
        titulo: formData.titulo,
        descripcion: formData.descripcion ?? '',
        tipo: formData.tipo,
        color: formData.color,
        fechaInicio: formData.fechaInicio.toISOString(),
        horaInicio: formData.horaInicio,
        fechaFin: formData.fechaFin?.toISOString() ?? null,
        horaFin: formData.horaFin ?? null,
        ubicacion: formData.ubicacion ?? null,
        notas: formData.notas ?? '',
        completado: false,
        fechaCreacion: ahora,
        fechaActualizacion: ahora,
      }),
    });
    console.log('✅ Evento personal creado en FastAPI:', result.evento.id);
    return String(result.evento.id);
  } catch (error: any) {
    console.error('❌ Error al crear evento personal:', error.message);
    throw error;
  }
}


//  OBTENER EVENTOS PERSONALES


export async function obtenerEventosPersonales(uid: string): Promise<EventoPersonal[]> {
  try {
    const data = await apiFetch<{ eventos: any[] }>(`/agenda?uid=${uid}`);
    return (data.eventos ?? [])
      .map(mapApiToEvento)
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
  } catch (error) {
    console.log('📴 FastAPI no disponible — cargando agenda desde Firebase');
    try {
      const q = query(
        collection(db, 'EventosPersonales'),
        where('uid', '==', uid),
        orderBy('fechaInicio', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EventoPersonal));
    } catch {
      const q2 = query(collection(db, 'EventosPersonales'), where('uid', '==', uid));
      const snapshot = await getDocs(q2);
      return snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as EventoPersonal))
        .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
    }
  }
}


//  OBTENER EVENTO PERSONAL POR ID


export async function obtenerEventoPersonalPorId(
  eventoId: string,
  uid: string
): Promise<EventoPersonal | null> {
  try {
    const data = await apiFetch<{ evento: any }>(`/agenda/${eventoId}`);
    const evento = mapApiToEvento(data.evento);
    if (evento.uid !== uid) return null;
    return evento;
  } catch (error) {
    console.log('📴 FastAPI no disponible — cargando desde Firebase');
    const ref = doc(db, 'EventosPersonales', eventoId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as EventoPersonal;
    if (data.uid !== uid) return null;
    return { id: snap.id, ...data };
  }
}


//  EDITAR EVENTO PERSONAL


export async function editarEventoPersonal(
  eventoId: string,
  uid: string,
  datos: Partial<EventoPersonalFormData> & { completado?: boolean }
): Promise<void> {
  try {
    const evento = await obtenerEventoPersonalPorId(eventoId, uid);
    if (!evento) throw new Error('Evento no encontrado o sin permisos');

    const actualizacion: Record<string, any> = {
      fechaActualizacion: new Date().toISOString(),
    };

    if (datos.titulo !== undefined) actualizacion.titulo = datos.titulo;
    if (datos.descripcion !== undefined) actualizacion.descripcion = datos.descripcion;
    if (datos.tipo !== undefined) actualizacion.tipo = datos.tipo;
    if (datos.color !== undefined) actualizacion.color = datos.color;
    if (datos.fechaInicio !== undefined) actualizacion.fechaInicio = datos.fechaInicio.toISOString();
    if (datos.horaInicio !== undefined) actualizacion.horaInicio = datos.horaInicio;
    if (datos.fechaFin !== undefined) actualizacion.fechaFin = datos.fechaFin?.toISOString() ?? null;
    if (datos.horaFin !== undefined) actualizacion.horaFin = datos.horaFin ?? null;
    if (datos.ubicacion !== undefined) actualizacion.ubicacion = datos.ubicacion ?? null;
    if (datos.notas !== undefined) actualizacion.notas = datos.notas;
    if (datos.completado !== undefined) actualizacion.completado = datos.completado;

    await apiFetch(`/agenda/${eventoId}`, {
      method: 'PATCH',
      body: JSON.stringify(actualizacion),
    });
    console.log('✅ Evento personal editado en FastAPI');
  } catch (error) {
    console.error('❌ Error al editar evento personal:', error);
    throw error;
  }
}


//  TOGGLE COMPLETADO


export async function toggleCompletadoEventoPersonal(
  eventoId: string,
  uid: string,
  completado: boolean
): Promise<void> {
  return editarEventoPersonal(eventoId, uid, { completado });
}


//  ELIMINAR EVENTO PERSONAL


export async function eliminarEventoPersonal(eventoId: string, uid: string): Promise<void> {
  try {
    const evento = await obtenerEventoPersonalPorId(eventoId, uid);
    if (!evento) throw new Error('Evento no encontrado o sin permisos');

    await apiFetch(`/agenda/${eventoId}`, { method: 'DELETE' });
    console.log('✅ Evento personal eliminado en FastAPI');
  } catch (error) {
    console.error('❌ Error al eliminar evento personal:', error);
    throw error;
  }
}


//  OBTENER PRÓXIMOS (7 días por defecto)


export async function obtenerEventosPersonalesProximos(
  uid: string,
  dias = 7
): Promise<EventoPersonal[]> {
  const todos = await obtenerEventosPersonales(uid);
  const hoy = new Date();
  const limite = new Date();
  limite.setDate(hoy.getDate() + dias);
  return todos.filter((e) => {
    const fecha = new Date(e.fechaInicio);
    return fecha >= hoy && fecha <= limite && !e.completado;
  });
}


//  OBTENER POR MES


export async function obtenerEventosPersonalesPorMes(
  uid: string,
  anio: number,
  mes: number
): Promise<EventoPersonal[]> {
  const todos = await obtenerEventosPersonales(uid);
  return todos.filter((e) => {
    const fecha = new Date(e.fechaInicio);
    return fecha.getFullYear() === anio && fecha.getMonth() === mes;
  });
}