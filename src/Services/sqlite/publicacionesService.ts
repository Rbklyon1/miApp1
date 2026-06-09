// services/publicacionesService.ts
import { randomUUID } from 'expo-crypto';
import db from './database';

export interface Publicacion {
  id: string;
  titulo: string;
  contenido?: string;
  imagen_url?: string;
  empresa_id: string;
  creado_por: string;
  creado_en: string;
  synced: number;
}

export const getPublicaciones = (empresa_id: string): Publicacion[] => {
  return db.getAllSync<Publicacion>(
    'SELECT * FROM publicaciones WHERE empresa_id = ? ORDER BY creado_en DESC',
    [empresa_id]
  );
};

export const createPublicacion = (data: Omit<Publicacion, 'id' | 'creado_en' | 'synced'>): Publicacion => {
  const pub: Publicacion = {
    ...data,
    id: randomUUID(),
    creado_en: new Date().toISOString(),
    synced: 0,
  };

  db.runSync(
    `INSERT INTO publicaciones (id, titulo, contenido, imagen_url, empresa_id, creado_por, creado_en, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [pub.id, pub.titulo, pub.contenido ?? null, pub.imagen_url ?? null,
     pub.empresa_id, pub.creado_por, pub.creado_en]
  );

  db.runSync(
    `INSERT INTO sync_queue (tabla, operacion, payload) VALUES (?, ?, ?)`,
    ['publicaciones', 'CREATE', JSON.stringify(pub)]
  );

  return pub;
};

export const deletePublicacion = (id: string): void => {
  db.runSync('DELETE FROM publicaciones WHERE id = ?', [id]);
  db.runSync(
    `INSERT INTO sync_queue (tabla, operacion, payload) VALUES (?, ?, ?)`,
    ['publicaciones', 'DELETE', JSON.stringify({ id })]
  );
};