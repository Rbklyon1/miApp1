// services/avisosService.ts
import { randomUUID } from 'expo-crypto';
import db from './database';

export interface Aviso {
  id: string;
  titulo: string;
  contenido?: string;
  tipo: string;
  empresa_id: string;
  creado_por: string;
  creado_en: string;
  synced: number;
}

export const getAvisos = (empresa_id: string): Aviso[] => {
  return db.getAllSync<Aviso>(
    'SELECT * FROM avisos WHERE empresa_id = ? ORDER BY creado_en DESC',
    [empresa_id]
  );
};

export const createAviso = (data: Omit<Aviso, 'id' | 'creado_en' | 'synced'>): Aviso => {
  const aviso: Aviso = {
    ...data,
    id: randomUUID(),
    creado_en: new Date().toISOString(),
    synced: 0,
  };

  db.runSync(
    `INSERT INTO avisos (id, titulo, contenido, tipo, empresa_id, creado_por, creado_en, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [aviso.id, aviso.titulo, aviso.contenido ?? null, aviso.tipo,
     aviso.empresa_id, aviso.creado_por, aviso.creado_en]
  );

  db.runSync(
    `INSERT INTO sync_queue (tabla, operacion, payload) VALUES (?, ?, ?)`,
    ['avisos', 'CREATE', JSON.stringify(aviso)]
  );

  return aviso;
};

export const deleteAviso = (id: string): void => {
  db.runSync('DELETE FROM avisos WHERE id = ?', [id]);
  db.runSync(
    `INSERT INTO sync_queue (tabla, operacion, payload) VALUES (?, ?, ?)`,
    ['avisos', 'DELETE', JSON.stringify({ id })]
  );
};