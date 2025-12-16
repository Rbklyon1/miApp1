export type TipoMuro = "General" | "Departamento";

export interface Reaccion {
  uid: string;
  nombreUsuario: string;
  tipo: "me_gusta" | "importante" | "celebrar";
  fecha: string;
}

export interface ComentarioAviso {
  id: string;
  texto: string;
  autorUid: string;
  autorNombre: string;
  fecha: string;
}

export interface Aviso {
  id: string;
  titulo: string;
  contenido: string;
  
  // Autor
  creadoPor: string;
  nombreCreador: string;
  rolCreador: string;
  
  // Contexto
  empresaId: string;
  empresaNombre: string;
  tipoMuro: TipoMuro;
  departamento?: string; // Solo si es muro de departamento
  
  // Interacciones
  reacciones: Reaccion[];
  comentarios: ComentarioAviso[];
  
  // Fechas
  fechaCreacion: string;
  fechaEdicion?: string;
  
  // Estado
  destacado: boolean;
  archivado: boolean;
}

export interface AvisoFormData {
  titulo: string;
  contenido: string;
  tipoMuro: TipoMuro;
  departamento?: string;
  destacado?: boolean;
}