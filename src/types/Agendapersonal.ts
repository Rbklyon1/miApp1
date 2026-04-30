
export type ColorAgenda =
  | "#2196F3"
  | "#4CAF50"
  | "#FF5722"
  | "#9C27B0"
  | "#FF9800"
  | "#E91E63"
  | "#00BCD4"
  | "#795548";

export type TipoAgenda =
  | "Personal"
  | "Médico"
  | "Recordatorio"
  | "Tarea"
  | "Otro";

export interface EventoPersonal {
  id: string;
  uid: string;               
  titulo: string;
  descripcion?: string;
  tipo: TipoAgenda;
  color: ColorAgenda;

  // Fecha y hora
  fechaInicio: string;       
  horaInicio: string;
  fechaFin?: string;
  horaFin?: string;

  // Opciones
  ubicacion?: string;
  notas?: string;
  completado: boolean;

  // Metadata
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface EventoPersonalFormData {
  titulo: string;
  descripcion?: string;
  tipo: TipoAgenda;
  color: ColorAgenda;
  fechaInicio: Date;
  horaInicio: string;
  fechaFin?: Date;
  horaFin?: string;
  ubicacion?: string;
  notas?: string;
}