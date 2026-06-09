// services/tareasService.ts
import { randomUUID } from 'expo-crypto';
import db from './database';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: 'pendiente' | 'en_progreso' | 'completada';
  fecha_limite?: string;
  empresa_id: string;
  asignado_a?: string;
  creado_por: string;
  creado_en: string;
  actualizado_en?: string;
  synced: number;
}

export const getTareas = (empresa_id: string): Tarea[] => {
  return db.getAllSync<Tarea>(
    'SELECT * FROM tareas WHERE empresa_id = ? ORDER BY creado_en DESC',
    [empresa_id]
  );
};

export const getTareaById = (id: string): Tarea | null => {
  return db.getFirstSync<Tarea>('SELECT * FROM tareas WHERE id = ?', [id]) ?? null;
};

export const createTarea = (data: Omit<Tarea, 'id' | 'creado_en' | 'synced'>): Tarea => {
  const tarea: Tarea = {
    ...data,
    id: randomUUID(),
    creado_en: new Date().toISOString(),
    synced: 0,
  };

  db.runSync(
    `INSERT INTO tareas (id, titulo, descripcion, estado, fecha_limite, empresa_id, asignado_a, creado_por, creado_en, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [tarea.id, tarea.titulo, tarea.descripcion ?? null, tarea.estado,
     tarea.fecha_limite ?? null, tarea.empresa_id, tarea.asignado_a ?? null,
     tarea.creado_por, tarea.creado_en]
  );

  // Encolar para sync
  db.runSync(
    `INSERT INTO sync_queue (tabla, operacion, payload) VALUES (?, ?, ?)`,
    ['tareas', 'CREATE', JSON.stringify(tarea)]
  );

  return tarea;
};

export const updateTarea = (id: string, data: Partial<Tarea>): void => {
  const actualizado_en = new Date().toISOString();
  db.runSync(
    `UPDATE tareas SET titulo = COALESCE(?, titulo), descripcion = COALESCE(?, descripcion),
     estado = COALESCE(?, estado), fecha_limite = COALESCE(?, fecha_limite),
     asignado_a = COALESCE(?, asignado_a), actualizado_en = ?, synced = 0
     WHERE id = ?`,
    [data.titulo ?? null, data.descripcion ?? null, data.estado ?? null,
     data.fecha_limite ?? null, data.asignado_a ?? null, actualizado_en, id]
  );

  db.runSync(
    `INSERT INTO sync_queue (tabla, operacion, payload) VALUES (?, ?, ?)`,
    ['tareas', 'UPDATE', JSON.stringify({ id, ...data, actualizado_en })]
  );
};

export const deleteTarea = (id: string): void => {
  db.runSync('DELETE FROM tareas WHERE id = ?', [id]);
  db.runSync(
    `INSERT INTO sync_queue (tabla, operacion, payload) VALUES (?, ?, ?)`,
    ['tareas', 'DELETE', JSON.stringify({ id })]
  );
};