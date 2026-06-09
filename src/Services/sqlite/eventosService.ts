// services/eventosService.ts
import { randomUUID } from 'expo-crypto';
import db from './database';

export interface Evento {
  id: string;
  titulo: string;
  descripcion?: string;
  fecha_inicio: string;
  fecha_fin?: string;
  lugar?: string;
  empresa_id: string;
  creado_por: string;
  creado_en: string;
  synced: number;
}

export const getEventos = (empresa_id: string): Evento[] => {
  return db.getAllSync<Evento>(
    'SELECT * FROM eventos WHERE empresa_id = ? ORDER BY fecha_inicio ASC',
    [empresa_id]
  );
};

export const createEvento = (data: Omit<Evento, 'id' | 'creado_en' | 'synced'>): Evento => {
  const evento: Evento = {
    ...data,
    id: randomUUID(),
    creado_en: new Date().toISOString(),
    synced: 0,
  };

  db.runSync(
    `INSERT INTO eventos (id, titulo, descripcion, fecha_inicio, fecha_fin, lugar, empresa_id, creado_por, creado_en, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [evento.id, evento.titulo, evento.descripcion ?? null, evento.fecha_inicio,
     evento.fecha_fin ?? null, evento.lugar ?? null, evento.empresa_id,
     evento.creado_por, evento.creado_en]
  );

  db.runSync(
    `INSERT INTO sync_queue (tabla, operacion, payload) VALUES (?, ?, ?)`,
    ['eventos', 'CREATE', JSON.stringify(evento)]
  );

  return evento;
};

export const updateEvento = (id: string, data: Partial<Evento>): void => {
  db.runSync(
    `UPDATE eventos SET titulo = COALESCE(?, titulo), descripcion = COALESCE(?, descripcion),
     fecha_inicio = COALESCE(?, fecha_inicio), fecha_fin = COALESCE(?, fecha_fin),
     lugar = COALESCE(?, lugar), synced = 0 WHERE id = ?`,
    [data.titulo ?? null, data.descripcion ?? null, data.fecha_inicio ?? null,
     data.fecha_fin ?? null, data.lugar ?? null, id]
  );

  db.runSync(
    `INSERT INTO sync_queue (tabla, operacion, payload) VALUES (?, ?, ?)`,
    ['eventos', 'UPDATE', JSON.stringify({ id, ...data })]
  );
};

export const deleteEvento = (id: string): void => {
  db.runSync('DELETE FROM eventos WHERE id = ?', [id]);
  db.runSync(
    `INSERT INTO sync_queue (tabla, operacion, payload) VALUES (?, ?, ?)`,
    ['eventos', 'DELETE', JSON.stringify({ id })]
  );
};