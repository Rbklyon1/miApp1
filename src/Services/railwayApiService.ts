// const API_URL = "http://192.168.3.49:8000"; 

// export type TareaRailway = {
//   id?: number;
//   titulo: string;
//   descripcion?: string;
//   estado?: string;
// };


// export const crearTareaRealRailway = async (data: {
//   titulo: string;
//   descripcion: string;
//   prioridad: string;
//   creadaPor: string;
//   nombreCreador: string;
//   empresaId: string;
//   asignadoA: string[];
//   nombresAsignados: string[];
// }) => {
//   const response = await fetch(`${API_URL}/tareas`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       ...data,
//       estado: "Pendiente",
//     }),
//   });

//   const result = await response.json();

//   if (!response.ok) {
//     throw new Error("No se pudo crear la tarea en FastAPI");
//   }

//   console.log("✅ Tarea real enviada a FastAPI:", result);
//   return result;
// };

// // 🔹 Obtener tareas
// export const obtenerTareasRailway = async () => {
//     const response = await fetch(`${API_URL}/tareas`);
//     const data = await response.json();
//     if (!response.ok) {
//       throw new Error("No se pudieron obtener las tareas desde fastAPI");
//     }
//     return data.tareas || [];

// };

// // 🔹 Health check (para evidencia 👀)
// export const probarConexionRailway = async () => {
//   try {
//     const response = await fetch(`${API_URL}/health`);

//     const data = await response.json();

//     console.log("🌐 API activa:", data);
//     return true;
//   } catch (error) {
//     console.error("❌ API no responde:", error);
//     return false;
//   }
// };

 //  railwayApiService.ts
//  Servicio central de conexión con el backend FastAPI en Railway
//  Cambia API_URL a tu URL real cuando hagas deploy en Railway
 
// 👇 En desarrollo local usa tu IP. En producción pon tu URL de Railway:
// export const API_URL = "https://tu-app.up.railway.app";
export const API_URL = "https://workstation-api-1iyt.onrender.com";

 //  Helper base: lanza error si la respuesta no es 2xx
 async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`FastAPI error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

 //  TIPOS
 
export type TareaRailway = {
  id?: number;
  titulo: string;
  descripcion?: string;
  prioridad?: string;
  estado?: string;
  creadaPor?: string;
  nombreCreador?: string;
  empresaId?: string;
  empresaNombre?: string;
  asignadoA?: string[];
  nombresAsignados?: string[];
  etiquetas?: string[];
  comentarios?: any[];
  adjuntos?: any[];
  tipoAsignacion?: string;
  departamentoAsignado?: string | null;
  fechaCreacion?: string;
  fechaVencimiento?: string | null;
  fechaCompletada?: string | null;
};

export type PublicacionRailway = {
  id?: number;
  contenido: string;
  empresaId: string;
  tipoMuro: "general" | "departamento";
  departamentoId?: string | null;
  nombreDepartamento?: string | null;
  creadaPor: string;
  nombreUsuario: string;
  rolUsuario: string;
  comentarios?: any[];
  reacciones?: any[];
  fechaCreacion?: string;
};

export type EventoRailway = {
  id?: number;
  titulo: string;
  descripcion?: string;
  tipo?: string;
  fechaInicio: string;
  horaInicio: string;
  fechaFin?: string | null;
  horaFin?: string | null;
  ubicacion?: string | null;
  esVirtual?: boolean;
  linkVirtual?: string | null;
  asistentes?: any[];
  capacidadMaxima?: number | null;
  creadoPor: string;
  nombreCreador: string;
  empresaId: string;
  empresaNombre: string;
  notas?: string;
  tipoAsignacion?: string;
  departamentoAsignado?: string | null;
  fechaCreacion?: string;
};

 //  HEALTH CHECK
 
export const probarConexionRailway = async (): Promise<boolean> => {
  try {
    const data = await apiFetch<{ status: string }>("/health");
    console.log("🌐 API activa:", data);
    return true;
  } catch (error) {
    console.error("❌ API no responde:", error);
    return false;
  }
};

 //  TAREAS
 
export const crearTareaRailway = async (
  data: Omit<TareaRailway, "id">
): Promise<TareaRailway> => {
  const result = await apiFetch<{ mensaje: string; tarea: TareaRailway }>(
    "/tareas",
    {
      method: "POST",
      body: JSON.stringify({ ...data, estado: data.estado ?? "Pendiente" }),
    }
  );
  console.log("✅ Tarea creada en FastAPI:", result.tarea);
  return result.tarea;
};

export const obtenerTareasRailway = async (params?: {
  empresaId?: string;
  creadaPor?: string;
  asignadoA?: string;
}): Promise<TareaRailway[]> => {
  const query = new URLSearchParams();
  if (params?.empresaId) query.append("empresaId", params.empresaId);
  if (params?.creadaPor) query.append("creadaPor", params.creadaPor);
  if (params?.asignadoA) query.append("asignadoA", params.asignadoA);

  const qs = query.toString() ? `?${query.toString()}` : "";
  const data = await apiFetch<{ total: number; tareas: TareaRailway[] }>(
    `/tareas${qs}`
  );
  return data.tareas ?? [];
};

export const actualizarEstadoTareaRailway = async (
  tareaId: string,
  estado: string
): Promise<void> => {
  await apiFetch(`/tareas/${tareaId}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
  console.log(`✅ Estado actualizado en FastAPI: ${estado}`);
};

export const agregarComentarioTareaRailway = async (
  tareaId: string,
  comentario: { texto: string; autorUid: string; autorNombre: string }
): Promise<void> => {
  await apiFetch(`/tareas/${tareaId}/comentarios`, {
    method: "POST",
    body: JSON.stringify(comentario),
  });
  console.log("✅ Comentario enviado a FastAPI");
};

export const eliminarTareaRailway = async (tareaId: string): Promise<void> => {
  await apiFetch(`/tareas/${tareaId}`, { method: "DELETE" });
  console.log("✅ Tarea eliminada en FastAPI");
};

 //  PUBLICACIONES
 
export const crearPublicacionRailway = async (
  data: Omit<PublicacionRailway, "id">
): Promise<PublicacionRailway> => {
  const result = await apiFetch<{ publicacion: PublicacionRailway }>(
    "/publicaciones",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  return result.publicacion;
};

export const obtenerPublicacionesRailway = async (params: {
  empresaId: string;
  tipoMuro?: string;
  departamentoId?: string;
}): Promise<PublicacionRailway[]> => {
  const query = new URLSearchParams({ empresaId: params.empresaId });
  if (params.tipoMuro) query.append("tipoMuro", params.tipoMuro);
  if (params.departamentoId) query.append("departamentoId", params.departamentoId);

  const data = await apiFetch<{ publicaciones: PublicacionRailway[] }>(
    `/publicaciones?${query.toString()}`
  );
  return data.publicaciones ?? [];
};

export const agregarReaccionRailway = async (
  postId: string,
  reacciones: any[]
): Promise<void> => {
  await apiFetch(`/publicaciones/${postId}/reacciones`, {
    method: "POST",
    body: JSON.stringify({ reacciones }),
  });
};

export const editarPublicacionRailway = async (
  postId: string,
  contenido: string
): Promise<void> => {
  await apiFetch(`/publicaciones/${postId}`, {
    method: "PATCH",
    body: JSON.stringify({ contenido }),
  });
};

 //  EVENTOS
 
export const crearEventoRailway = async (
  data: Omit<EventoRailway, "id">
): Promise<EventoRailway> => {
  const result = await apiFetch<{ evento: EventoRailway }>("/eventos", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.evento;
};

export const obtenerEventosRailway = async (params: {
  empresaId: string;
}): Promise<EventoRailway[]> => {
  const data = await apiFetch<{ eventos: EventoRailway[] }>(
    `/eventos?empresaId=${params.empresaId}`
  );
  return data.eventos ?? [];
};

export const actualizarAsistenciaRailway = async (
  eventoId: string,
  asistentes: any[]
): Promise<void> => {
  await apiFetch(`/eventos/${eventoId}/asistentes`, {
    method: "PATCH",
    body: JSON.stringify({ asistentes }),
  });
};

// Alias de compatibilidad con el nombre que ya usabas en Fase 3
export const crearTareaRealRailway = crearTareaRailway;
export const obtenerTareasRailwayLegacy = () => obtenerTareasRailway();