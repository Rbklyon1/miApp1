
export type PrioridadTarea = "Baja" | "Media" | "Alta" | "Urgente";
export type EstadoTarea = "Pendiente" | "En Progreso" | "Completada" | "Cancelada";


export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadTarea;
  estado: EstadoTarea;
  
  // Fechas
  fechaCreacion: string;
  fechaVencimiento?: string;
  fechaCompletada?: string;
  
  // Asignación
  creadaPor: string; 
  nombreCreador: string;
  asignadoA: string[];
  nombresAsignados: string[]; 
  
  // Contexto empresarial
  empresaId: string;
  empresaNombre: string;
  
  // Opcionales
  etiquetas?: string[];
  adjuntos?: string[]; 
  comentarios?: Comentario[];
}

export interface Comentario {
  id: string;
  texto: string;
  autorUid: string;
  autorNombre: string;
  fecha: string;
}

export interface TareaFormData {
  titulo: string;
  descripcion: string;
  prioridad: PrioridadTarea;
  fechaVencimiento?: Date;
  asignadoA: string[];
  etiquetas?: string[];
}