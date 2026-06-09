// services/syncService.ts
import db from './database';

const API_URL = 'https://workstation-api-1iyt.onrender.com';

interface QueueItem {
  id: number;
  tabla: string;
  operacion: string;
  payload: string;
  intentos: number;
}

const ENDPOINTS: Record<string, string> = {
  tareas: '/tareas',
  eventos: '/eventos',
  avisos: '/avisos',
  agenda_personal: '/agenda',
  publicaciones: '/publicaciones',
};

const METHOD_MAP: Record<string, string> = {
  CREATE: 'POST',
  UPDATE: 'PUT',
  DELETE: 'DELETE',
};

export const syncPendientes = async (): Promise<void> => {
  const queue = db.getAllSync<QueueItem>(
    'SELECT * FROM sync_queue WHERE intentos < 3 ORDER BY creado_en ASC'
  );

  for (const item of queue) {
    const payload = JSON.parse(item.payload);
    const endpoint = ENDPOINTS[item.tabla];
    const method = METHOD_MAP[item.operacion];
    const url = method === 'DELETE' || method === 'PUT'
      ? `${API_URL}${endpoint}/${payload.id}`
      : `${API_URL}${endpoint}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method !== 'DELETE' ? JSON.stringify(payload) : undefined,
      });

      if (res.ok) {
        // Eliminar de la cola y marcar como synced
        db.runSync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
        db.runSync(
          `UPDATE ${item.tabla} SET synced = 1 WHERE id = ?`,
          [payload.id]
        );
      } else {
        db.runSync(
          'UPDATE sync_queue SET intentos = intentos + 1 WHERE id = ?',
          [item.id]
        );
      }
    } catch {
      db.runSync(
        'UPDATE sync_queue SET intentos = intentos + 1 WHERE id = ?',
        [item.id]
      );
    }
  }
};