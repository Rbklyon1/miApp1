import * as SQLite from "expo-sqlite";
import { Tarea } from "../types/tareas";

const db = SQLite.openDatabaseSync("workstation_local.db");

export const inicializarTareasLocales = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tareas_locales (
      id TEXT PRIMARY KEY NOT NULL,
      titulo TEXT,
      descripcion TEXT,
      prioridad TEXT,
      estado TEXT,
      fechaCreacion TEXT,
      fechaVencimiento TEXT,
      fechaCompletada TEXT,
      creadaPor TEXT,
      nombreCreador TEXT,
      asignadoA TEXT,
      nombresAsignados TEXT,
      empresaId TEXT,
      empresaNombre TEXT,
      etiquetas TEXT,
      comentarios TEXT,
      adjuntos TEXT,
      tipoAsignacion TEXT,
      departamentoAsignado TEXT
    );
  `);
};

export const guardarTareasLocales = async (tareas: Tarea[]) => {
  await inicializarTareasLocales();

  for (const tarea of tareas) {
    await db.runAsync(
      `INSERT OR REPLACE INTO tareas_locales
      (
        id, titulo, descripcion, prioridad, estado,
        fechaCreacion, fechaVencimiento, fechaCompletada,
        creadaPor, nombreCreador, asignadoA, nombresAsignados,
        empresaId, empresaNombre, etiquetas, comentarios, adjuntos,
        tipoAsignacion, departamentoAsignado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tarea.id,
        tarea.titulo || "",
        tarea.descripcion || "",
        tarea.prioridad || "Media",
        tarea.estado || "Pendiente",
        tarea.fechaCreacion || "",
        tarea.fechaVencimiento || null,
        tarea.fechaCompletada || null,
        tarea.creadaPor || "",
        tarea.nombreCreador || "",
        JSON.stringify(tarea.asignadoA || []),
        JSON.stringify(tarea.nombresAsignados || []),
        tarea.empresaId || "",
        tarea.empresaNombre || "",
        JSON.stringify(tarea.etiquetas || []),
        JSON.stringify(tarea.comentarios || []),
        JSON.stringify(tarea.adjuntos || []),
        (tarea as any).tipoAsignacion || "usuarios",
        (tarea as any).departamentoAsignado || null,
      ]
    );
  }
};

export const obtenerTareasLocales = async (
  empresaId: string
): Promise<Tarea[]> => {
  await inicializarTareasLocales();

  const rows = await db.getAllAsync<any>(
    `SELECT * FROM tareas_locales
     WHERE empresaId = ?
     ORDER BY fechaCreacion DESC`,
    [empresaId]
  );

  return rows.map((row) => ({
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    prioridad: row.prioridad,
    estado: row.estado,
    fechaCreacion: row.fechaCreacion,
    fechaVencimiento: row.fechaVencimiento || undefined,
    fechaCompletada: row.fechaCompletada || undefined,
    creadaPor: row.creadaPor,
    nombreCreador: row.nombreCreador,
    asignadoA: JSON.parse(row.asignadoA || "[]"),
    nombresAsignados: JSON.parse(row.nombresAsignados || "[]"),
    empresaId: row.empresaId,
    empresaNombre: row.empresaNombre,
    etiquetas: JSON.parse(row.etiquetas || "[]"),
    comentarios: JSON.parse(row.comentarios || "[]"),
    adjuntos: JSON.parse(row.adjuntos || "[]"),
    tipoAsignacion: row.tipoAsignacion,
    departamentoAsignado: row.departamentoAsignado,
  })) as Tarea[];
};

export const obtenerTareasAsignadasLocales = async (
  uid: string,
  empresaId: string
): Promise<Tarea[]> => {
  const tareas = await obtenerTareasLocales(empresaId);
  return tareas.filter((tarea) => tarea.asignadoA.includes(uid));
};

export const obtenerTareasCreadasLocales = async (
  uid: string,
  empresaId: string
): Promise<Tarea[]> => {
  const tareas = await obtenerTareasLocales(empresaId);
  return tareas.filter((tarea) => tarea.creadaPor === uid);
};

export const guardarTareaLocal = async (tarea: Tarea) => {
  await guardarTareasLocales([tarea]);
};