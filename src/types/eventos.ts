// types/eventos.ts

export type TipoEvento = "Reunión" | "Capacitación" | "Evaluación" | "Social" | "Otro";
export type EstadoAsistencia = "Pendiente" | "Confirmado" | "Rechazado" | "Asistió" | "No Asistió";

export interface Asistente {
  uid: string;
  nombre: string;
  rol: string;
  estadoAsistencia: EstadoAsistencia;
  fechaRespuesta?: string;
}

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: TipoEvento;
  
  // Fecha y hora
  fechaInicio: string;
  horaInicio: string;
  fechaFin?: string;
  horaFin?: string;
  
  // Ubicación
  ubicacion?: string;
  esVirtual: boolean;
  linkVirtual?: string;
  
  // Asistentes
  asistentes: Asistente[];
  capacidadMaxima?: number;
  
  // Metadata
  creadoPor: string;
  nombreCreador: string;
  empresaId: string;
  empresaNombre: string;
  fechaCreacion: string;
  
  // Recordatorios
  recordatorioEnviado: boolean;
  
  // Opcionales
  adjuntos?: string[];
  notas?: string;
}

export interface EventoFormData {
  titulo: string;
  descripcion: string;
  tipo: TipoEvento;
  fechaInicio: Date;
  horaInicio: string;
  fechaFin?: Date;
  horaFin?: string;
  ubicacion?: string;
  esVirtual: boolean;
  linkVirtual?: string;
  asistentesUids: string[];
  capacidadMaxima?: number;
  notas?: string;
}