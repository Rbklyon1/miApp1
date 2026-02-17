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
  setDoc,
} from "firebase/firestore";
import { Evento, EventoFormData, EstadoAsistencia, Asistente } from "../types/eventos";

//Crear un nuevo evento
export async function crearEvento(
  formData: EventoFormData,
  creadoPor: string,
  nombreCreador: string,
  empresaId: string,
  empresaNombre: string,
  asistentesData: { uid: string; nombre: string; rol: string }[],
  rolCreador?: string
): Promise<string> {
  try {
    // Validación: Si es Jefe, verificar que no asigne a Admins
    if (rolCreador === "Jefe") {
      console.log("Jefe creando evento - validación de permisos activa");
    }

    // Crear array de asistentes con estado inicial "Pendiente"
    const asistentes: Asistente[] = asistentesData.map((a) => ({
      uid: a.uid,
      nombre: a.nombre,
      rol: a.rol,
      estadoAsistencia: "Pendiente",
    }));

    const docRef = await addDoc(collection(db, "Eventos"), {
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      tipo: formData.tipo,
      
      fechaInicio: formData.fechaInicio.toISOString(),
      horaInicio: formData.horaInicio,
      fechaFin: formData.fechaFin?.toISOString() || null,
      horaFin: formData.horaFin || null,
      
      ubicacion: formData.ubicacion || null,
      esVirtual: formData.esVirtual,
      linkVirtual: formData.linkVirtual || null,
      
      asistentes,
      capacidadMaxima: formData.capacidadMaxima || null,
      
      creadoPor,
      nombreCreador,
      empresaId,
      empresaNombre,
      fechaCreacion: new Date().toISOString(),
      
      recordatorioEnviado: false,
      notas: formData.notas || "",
      adjuntos: [],
    });

    console.log("Evento creado con ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error(" Error al crear evento:", error);
    
    if (error.code === "permission-denied") {
      throw new Error("No tienes permisos para asignar este evento a los usuarios seleccionados");
    }
    
    throw error;
  }
}

// Obtener eventos de una empresa
export async function obtenerEventosDeEmpresa(
  empresaId: string
): Promise<Evento[]> {
  try {
    const q = query(
      collection(db, "Eventos"),
      where("empresaId", "==", empresaId)
    );
    
    const snapshot = await getDocs(q);
    const eventos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Evento[];
    
    // Ordenar por fecha de inicio
    return eventos.sort((a, b) => 
      new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
    );
  } catch (error: any) {
    console.error(" Error al obtener eventos:", error);
    throw error;
  }
}

// Obtener eventos donde el usuario es asistente
export async function obtenerEventosAsignados(
  uid: string,
  empresaId: string
): Promise<Evento[]> {
  try {
    const q = query(
      collection(db, "Eventos"),
      where("empresaId", "==", empresaId)
    );
    
    const snapshot = await getDocs(q);
    const eventos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Evento[];
    
    // Filtrar eventos donde el usuario es asistente
    const eventosAsignados = eventos.filter((evento) =>
      evento.asistentes.some((a) => a.uid === uid)
    );
    
    // Ordenar por fecha
    return eventosAsignados.sort((a, b) => 
      new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
    );
  } catch (error: any) {
    console.error(" Error al obtener eventos asignados:", error);
    throw error;
  }
}

//Obtener eventos creados por un usuario
export async function obtenerEventosCreadosPor(
  uid: string,
  empresaId: string
): Promise<Evento[]> {
  try {
    const q = query(
      collection(db, "Eventos"),
      where("empresaId", "==", empresaId),
      where("creadoPor", "==", uid)
    );
    
    const snapshot = await getDocs(q);
    const eventos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Evento[];
    
    return eventos.sort((a, b) => 
      new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
    );
  } catch (error: any) {
    console.error(" Error al obtener eventos creados:", error);
    throw error;
  }
}

// Actualizar estado de asistencia de un usuario
export async function actualizarEstadoAsistencia(
  eventoId: string,
  uid: string,
  nuevoEstado: EstadoAsistencia
): Promise<void> {
  try {
    const eventoRef = doc(db, "Eventos", eventoId);
    const eventoDoc = await getDoc(eventoRef);
    
    if (!eventoDoc.exists()) {
      throw new Error("Evento no encontrado");
    }
    
    const eventoData = eventoDoc.data() as Evento;
    const asistentesActualizados = eventoData.asistentes.map((a) =>
      a.uid === uid
        ? { ...a, estadoAsistencia: nuevoEstado, fechaRespuesta: new Date().toISOString() }
        : a
    );
    
    await updateDoc(eventoRef, { asistentes: asistentesActualizados });
    console.log(`Estado de asistencia actualizado: ${nuevoEstado}`);
  } catch (error) {
    console.error(" Error al actualizar estado:", error);
    throw error;
  }
}

//Editar un evento existente
export async function editarEvento(
  eventoId: string,
  datos: Partial<Evento>
): Promise<void> {
  try {
    const eventoRef = doc(db, "Eventos", eventoId);
    await updateDoc(eventoRef, datos);
    console.log("Evento editado correctamente");
  } catch (error) {
    console.error(" Error al editar evento:", error);
    throw error;
  }
}

//Eliminar un evento
export async function eliminarEvento(eventoId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "Eventos", eventoId));
    console.log("Evento eliminado");
  } catch (error) {
    console.error(" Error al eliminar evento:", error);
    throw error;
  }
}

//Obtener eventos próximos (próximos 7 días)
export async function obtenerEventosProximos(
  empresaId: string
): Promise<Evento[]> {
  try {
    const hoy = new Date();
    const enUnaSemana = new Date();
    enUnaSemana.setDate(hoy.getDate() + 7);
    
    const eventos = await obtenerEventosDeEmpresa(empresaId);
    
    return eventos.filter((evento) => {
      const fechaEvento = new Date(evento.fechaInicio);
      return fechaEvento >= hoy && fechaEvento <= enUnaSemana;
    });
  } catch (error) {
    console.error(" Error al obtener eventos próximos:", error);
    throw error;
  }
}

// Obtener eventos de un departamento específico
export async function obtenerEventosDepartamento(
  empresaId: string,
  nombreDepartamento: string
): Promise<Evento[]> {
  try {
    // Obtener todos los eventos de la empresa
    const q = query(
      collection(db, "Eventos"),
      where("empresaId", "==", empresaId)
    );
    
    const snapshot = await getDocs(q);
    const eventos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Evento[];
    
    // Obtener usuarios del departamento
    const usuariosQuery = query(
      collection(db, "Usuarios"),
      where("empresaId", "==", empresaId),
      where("nombreDepartamento", "==", nombreDepartamento)
    );
    
    const usuariosSnap = await getDocs(usuariosQuery);
    const uidsDelDepto = usuariosSnap.docs.map(doc => doc.id);
    
    // Filtrar eventos donde el creador o algún asistente es del departamento
    const eventosDepartamento = eventos.filter(evento => {
      // Incluir si el creador es del departamento
      if (uidsDelDepto.includes(evento.creadoPor)) return true;
      
      // Incluir si algún asistente es del departamento
      if (evento.asistentes.some(asistente => uidsDelDepto.includes(asistente.uid))) return true;
      
      return false;
    });
    
    // Ordenar por fecha de inicio
    return eventosDepartamento.sort((a, b) => 
      new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
    );
  } catch (error: any) {
    console.error(" Error al obtener eventos de departamento:", error);
    throw error;
  }
}

//Obtener eventos asignados a usuarios de un departamento
export async function obtenerEventosAsignadosDepartamento(
  uid: string,
  empresaId: string,
  nombreDepartamento: string
): Promise<Evento[]> {
  try {
    const q = query(
      collection(db, "Eventos"),
      where("empresaId", "==", empresaId)
    );
    
    const snapshot = await getDocs(q);
    const eventos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Evento[];
    
    // Obtener usuarios del departamento
    const usuariosQuery = query(
      collection(db, "Usuarios"),
      where("empresaId", "==", empresaId),
      where("nombreDepartamento", "==", nombreDepartamento)
    );
    
    const usuariosSnap = await getDocs(usuariosQuery);
    const uidsDelDepto = usuariosSnap.docs.map(doc => doc.id);
    
    // Filtrar eventos donde el usuario está como asistente Y están relacionados con el departamento
    const eventosAsignados = eventos.filter((evento) => {
      // El usuario debe ser asistente
      const esAsistente = evento.asistentes.some((a) => a.uid === uid);
      if (!esAsistente) return false;
      
      // Y el evento debe estar relacionado con el departamento
      const estaRelacionadoConDepto = 
        uidsDelDepto.includes(evento.creadoPor) ||
        evento.asistentes.some(a => uidsDelDepto.includes(a.uid));
      
      return estaRelacionadoConDepto;
    });
    
    return eventosAsignados.sort((a, b) => 
      new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
    );
  } catch (error: any) {
    console.error(" Error al obtener eventos asignados de departamento:", error);
    throw error;
  }
}