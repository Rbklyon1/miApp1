import * as SQLite from "expo-sqlite";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// ===================================
// BASE DE DATOS
// ===================================

const sqliteDb = SQLite.openDatabaseSync("workstation.db");

export const initEmpresaTables = (): void => {
  sqliteDb.execSync(`
    CREATE TABLE IF NOT EXISTS offline_empresas (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      codigoAcceso TEXT NOT NULL UNIQUE,
      creadaPor TEXT NOT NULL,
      nombreCreador TEXT NOT NULL,
      correoCreador TEXT NOT NULL,
      pendiente INTEGER DEFAULT 1,
      fechaCreacion TEXT NOT NULL,
      rolesDisponibles TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offline_departamentos (
      id TEXT PRIMARY KEY,
      empresaId TEXT NOT NULL,
      nombre TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      pendiente INTEGER DEFAULT 1,
      fechaCreacion TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offline_vinculaciones (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL,
      empresaId TEXT NOT NULL,
      rol TEXT NOT NULL,
      pendiente INTEGER DEFAULT 1,
      fechaCreacion TEXT NOT NULL
    );
  `);
};

// ===================================
// TIPOS
// ===================================

export interface OfflineEmpresa {
  id: string;
  nombre: string;
  codigoAcceso: string;
  creadaPor: string;
  nombreCreador: string;
  correoCreador: string;
  pendiente: boolean;
  fechaCreacion: string;
  rolesDisponibles: string[];
}

export interface OfflineDepartamento {
  id: string;
  empresaId: string;
  nombre: string;
  activo: boolean;
  pendiente: boolean;
  fechaCreacion: string;
}

export interface OfflineVinculacion {
  id: string;
  uid: string;
  nombre: string;
  correo: string;
  empresaId: string;
  rol: "Administrador" | "Jefe" | "Empleado";
  pendiente: boolean;
  fechaCreacion: string;
}

// ===================================
// HELPERS DE MAPEO
// ===================================

const rowToEmpresa = (row: any): OfflineEmpresa => ({
  ...row,
  pendiente: row.pendiente === 1,
  rolesDisponibles: JSON.parse(row.rolesDisponibles),
});

const rowToDepartamento = (row: any): OfflineDepartamento => ({
  ...row,
  activo: row.activo === 1,
  pendiente: row.pendiente === 1,
});

const rowToVinculacion = (row: any): OfflineVinculacion => ({
  ...row,
  pendiente: row.pendiente === 1,
});

// ===================================
// EMPRESAS OFFLINE
// ===================================

export const crearEmpresaOffline = async (
  nombre: string,
  codigo: string,
  uidAdmin: string,
  nombreAdmin: string,
  correoAdmin: string,
): Promise<OfflineEmpresa> => {
  const codigoNorm = codigo.trim().toUpperCase();

  const existe = sqliteDb.getFirstSync(
    "SELECT id FROM offline_empresas WHERE codigoAcceso = ?",
    [codigoNorm],
  );
  if (existe) throw new Error("Ya existe una empresa con ese código");

  const empresa: OfflineEmpresa = {
    id: `offline_empresa_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    nombre: nombre.trim(),
    codigoAcceso: codigoNorm,
    creadaPor: uidAdmin,
    nombreCreador: nombreAdmin,
    correoCreador: correoAdmin,
    pendiente: true,
    fechaCreacion: new Date().toISOString(),
    rolesDisponibles: ["Administrador", "Jefe", "Empleado"],
  };

  sqliteDb.runSync(
    `INSERT INTO offline_empresas (id, nombre, codigoAcceso, creadaPor, nombreCreador, correoCreador, pendiente, fechaCreacion, rolesDisponibles)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      empresa.id,
      empresa.nombre,
      empresa.codigoAcceso,
      empresa.creadaPor,
      empresa.nombreCreador,
      empresa.correoCreador,
      empresa.fechaCreacion,
      JSON.stringify(empresa.rolesDisponibles),
    ],
  );

  console.log("✅ Empresa guardada offline:", empresa.nombre);
  return empresa;
};

export const buscarEmpresaOfflinePorCodigo = (
  codigo: string,
): OfflineEmpresa | null => {
  const row = sqliteDb.getFirstSync<any>(
    "SELECT * FROM offline_empresas WHERE codigoAcceso = ?",
    [codigo.trim().toUpperCase()],
  );
  return row ? rowToEmpresa(row) : null;
};

export const obtenerEmpresasOfflineDelUsuario = (
  uid: string,
): OfflineEmpresa[] => {
  const rows = sqliteDb.getAllSync<any>(
    "SELECT * FROM offline_empresas WHERE creadaPor = ?",
    [uid],
  );
  return rows.map(rowToEmpresa);
};

// ===================================
// VINCULACIONES OFFLINE
// ===================================

export const vincularUsuarioAEmpresaOffline = (
  uid: string,
  nombre: string,
  correo: string,
  empresaId: string,
  rol: "Administrador" | "Jefe" | "Empleado",
): OfflineVinculacion => {
  const vinculacion: OfflineVinculacion = {
    id: `offline_vinc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    uid,
    nombre: nombre.trim(),
    correo: correo.trim(),
    empresaId,
    rol,
    pendiente: true,
    fechaCreacion: new Date().toISOString(),
  };

  // INSERT OR REPLACE para actualizar si ya existe
  sqliteDb.runSync(
    `INSERT OR REPLACE INTO offline_vinculaciones (id, uid, nombre, correo, empresaId, rol, pendiente, fechaCreacion)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      vinculacion.id,
      vinculacion.uid,
      vinculacion.nombre,
      vinculacion.correo,
      vinculacion.empresaId,
      vinculacion.rol,
      vinculacion.fechaCreacion,
    ],
  );

  console.log("✅ Vinculación guardada offline:", uid, "->", empresaId);
  return vinculacion;
};

export const obtenerVinculacionOffline = (
  uid: string,
  empresaId: string,
): OfflineVinculacion | null => {
  const row = sqliteDb.getFirstSync<any>(
    "SELECT * FROM offline_vinculaciones WHERE uid = ? AND empresaId = ?",
    [uid, empresaId],
  );
  return row ? rowToVinculacion(row) : null;
};

// ===================================
// DEPARTAMENTOS OFFLINE
// ===================================

export const crearDepartamentoOffline = (
  empresaId: string,
  nombre: string,
): OfflineDepartamento => {
  const depto: OfflineDepartamento = {
    id: `offline_depto_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    empresaId,
    nombre: nombre.trim(),
    activo: true,
    pendiente: true,
    fechaCreacion: new Date().toISOString(),
  };

  sqliteDb.runSync(
    `INSERT INTO offline_departamentos (id, empresaId, nombre, activo, pendiente, fechaCreacion)
     VALUES (?, ?, ?, 1, 1, ?)`,
    [depto.id, depto.empresaId, depto.nombre, depto.fechaCreacion],
  );

  console.log("✅ Departamento guardado offline:", depto.nombre);
  return depto;
};

export const obtenerDepartamentosOffline = (
  empresaId: string,
): OfflineDepartamento[] => {
  const rows = sqliteDb.getAllSync<any>(
    "SELECT * FROM offline_departamentos WHERE empresaId = ?",
    [empresaId],
  );
  return rows.map(rowToDepartamento);
};

// ===================================
// SINCRONIZACIÓN CON FIREBASE
// ===================================

export const sincronizarEmpresasPendientes = async (): Promise<{
  exitosos: number;
  fallidos: number;
}> => {
  const pendientes = sqliteDb
    .getAllSync<any>("SELECT * FROM offline_empresas WHERE pendiente = 1")
    .map(rowToEmpresa);

  if (pendientes.length === 0) return { exitosos: 0, fallidos: 0 };

  const resultados = { exitosos: 0, fallidos: 0 };
  const mapeoIds: Record<string, string> = {};

  for (const empresa of pendientes) {
    try {
      const q = query(
        collection(db, "Empresas"),
        where("codigoAcceso", "==", empresa.codigoAcceso),
      );
      const snapshot = await getDocs(q);

      let empresaIdReal: string;

      if (!snapshot.empty) {
        empresaIdReal = snapshot.docs[0].id;
      } else {
        const docRef = await addDoc(collection(db, "Empresas"), {
          nombre: empresa.nombre,
          codigoAcceso: empresa.codigoAcceso,
          fechaCreacion: serverTimestamp(),
          creadaPor: empresa.creadaPor,
          rolesDisponibles: empresa.rolesDisponibles,
        });
        empresaIdReal = docRef.id;
      }

      mapeoIds[empresa.id] = empresaIdReal;
      sqliteDb.runSync(
        "UPDATE offline_empresas SET pendiente = 0, id = ? WHERE id = ?",
        [empresaIdReal, empresa.id],
      );

      resultados.exitosos++;
    } catch (error: any) {
      resultados.fallidos++;
      console.error(
        `❌ Error sincronizando empresa ${empresa.nombre}:`,
        error.message,
      );
    }
  }

  await sincronizarVinculacionesPendientes(mapeoIds);
  await sincronizarDepartamentosPendientes(mapeoIds);

  return resultados;
};

export const sincronizarVinculacionesPendientes = async (
  mapeoIds?: Record<string, string>,
): Promise<{ exitosos: number; fallidos: number }> => {
  const pendientes = sqliteDb
    .getAllSync<any>("SELECT * FROM offline_vinculaciones WHERE pendiente = 1")
    .map(rowToVinculacion);

  if (pendientes.length === 0) return { exitosos: 0, fallidos: 0 };

  const resultados = { exitosos: 0, fallidos: 0 };

  for (const vinc of pendientes) {
    try {
      const empresaIdReal = mapeoIds?.[vinc.empresaId] ?? vinc.empresaId;

      if (empresaIdReal.startsWith("offline_")) {
        console.log(`⚠️ Empresa aún no sincronizada, saltando vinculación`);
        continue;
      }

      await setDoc(
        doc(db, "Usuarios", vinc.uid),
        {
          uid: vinc.uid,
          nombre: vinc.nombre,
          correo: vinc.correo,
          rol: vinc.rol,
          empresaId: empresaIdReal,
          fechaIngreso: vinc.fechaCreacion,
        },
        { merge: true },
      );

      sqliteDb.runSync(
        "UPDATE offline_vinculaciones SET pendiente = 0, empresaId = ? WHERE id = ?",
        [empresaIdReal, vinc.id],
      );

      resultados.exitosos++;
    } catch (error: any) {
      resultados.fallidos++;
      console.error(`❌ Error sincronizando vinculación:`, error.message);
    }
  }

  return resultados;
};

export const sincronizarDepartamentosPendientes = async (
  mapeoIds?: Record<string, string>,
): Promise<{ exitosos: number; fallidos: number }> => {
  const pendientes = sqliteDb
    .getAllSync<any>("SELECT * FROM offline_departamentos WHERE pendiente = 1")
    .map(rowToDepartamento);

  if (pendientes.length === 0) return { exitosos: 0, fallidos: 0 };

  const resultados = { exitosos: 0, fallidos: 0 };

  for (const depto of pendientes) {
    try {
      const empresaIdReal = mapeoIds?.[depto.empresaId] ?? depto.empresaId;

      if (empresaIdReal.startsWith("offline_")) {
        console.log(
          `⚠️ Empresa aún no sincronizada, saltando departamento ${depto.nombre}`,
        );
        continue;
      }

      const docRef = await addDoc(
        collection(db, "Empresas", empresaIdReal, "Departamentos"),
        {
          nombre: depto.nombre,
          activo: depto.activo,
          fechaCreacion: serverTimestamp(),
        },
      );

      sqliteDb.runSync(
        "UPDATE offline_departamentos SET pendiente = 0, id = ?, empresaId = ? WHERE id = ?",
        [docRef.id, empresaIdReal, depto.id],
      );

      resultados.exitosos++;
    } catch (error: any) {
      resultados.fallidos++;
      console.error(
        `❌ Error sincronizando departamento ${depto.nombre}:`,
        error.message,
      );
    }
  }

  return resultados;
};

// ===================================
// UTILIDADES
// ===================================

export const obtenerCantidadEmpresasPendientes = (): number => {
  const r = sqliteDb.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_empresas WHERE pendiente = 1",
  );
  return r?.count ?? 0;
};

export const obtenerCantidadDeptosPendientes = (): number => {
  const r = sqliteDb.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_departamentos WHERE pendiente = 1",
  );
  return r?.count ?? 0;
};

export const hayEmpresasODeptosPendientes = (): boolean => {
  return (
    obtenerCantidadEmpresasPendientes() > 0 ||
    obtenerCantidadDeptosPendientes() > 0
  );
};
