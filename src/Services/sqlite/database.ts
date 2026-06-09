import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('workstation.db');

export const initDatabase = (): void => {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS tareas (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      estado TEXT DEFAULT 'pendiente',
      fecha_limite TEXT,
      empresa_id TEXT,
      asignado_a TEXT,
      creado_por TEXT,
      creado_en TEXT,
      actualizado_en TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS eventos (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      fecha_inicio TEXT,
      fecha_fin TEXT,
      lugar TEXT,
      empresa_id TEXT,
      creado_por TEXT,
      creado_en TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS avisos (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      contenido TEXT,
      tipo TEXT DEFAULT 'general',
      empresa_id TEXT,
      creado_por TEXT,
      creado_en TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS agenda_personal (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      fecha TEXT,
      hora_inicio TEXT,
      hora_fin TEXT,
      usuario_id TEXT,
      creado_en TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS publicaciones (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      contenido TEXT,
      imagen_url TEXT,
      empresa_id TEXT,
      creado_por TEXT,
      creado_en TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tabla TEXT NOT NULL,
      operacion TEXT NOT NULL,
      payload TEXT NOT NULL,
      creado_en TEXT DEFAULT (datetime('now')),
      intentos INTEGER DEFAULT 0
    );
  `);
};

export default db;