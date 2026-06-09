import * as SQLite from "expo-sqlite";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

// ===================================
// BASE DE DATOS
// ===================================

const sqliteDb = SQLite.openDatabaseSync("workstation.db");

export const initAuthTable = (): void => {
  sqliteDb.execSync(`
    CREATE TABLE IF NOT EXISTS offline_users (
      uid TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL,
      pendiente INTEGER DEFAULT 1,
      fechaCreacion TEXT NOT NULL
    );
  `);
};

export interface OfflineUser {
  uid: string;
  email: string;
  password: string;
  nombre: string;
  pendiente: boolean;
  fechaCreacion: string;
}

// ===================================
// OPERACIONES
// ===================================

export const guardarUsuarioOffline = (
  email: string,
  password: string,
  nombre: string,
): OfflineUser => {
  const emailNorm = email.toLowerCase().trim();

  const existe = sqliteDb.getFirstSync(
    "SELECT uid FROM offline_users WHERE email = ?",
    [emailNorm],
  );
  if (existe) throw new Error("Este correo ya está registrado");

  const user: OfflineUser = {
    uid: `offline_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    email: emailNorm,
    password,
    nombre: nombre.trim(),
    pendiente: true,
    fechaCreacion: new Date().toISOString(),
  };

  sqliteDb.runSync(
    `INSERT INTO offline_users (uid, email, password, nombre, pendiente, fechaCreacion)
     VALUES (?, ?, ?, ?, 1, ?)`,
    [user.uid, user.email, user.password, user.nombre, user.fechaCreacion],
  );

  console.log("✅ Usuario guardado offline:", user.email);
  return user;
};

export const loginOffline = (
  email: string,
  password: string,
): OfflineUser | null => {
  const row = sqliteDb.getFirstSync<any>(
    "SELECT * FROM offline_users WHERE email = ? AND password = ?",
    [email.toLowerCase().trim(), password],
  );

  if (!row) return null;

  return { ...row, pendiente: row.pendiente === 1 };
};

export const sincronizarUsuariosPendientes = async (): Promise<{
  exitosos: number;
  fallidos: number;
}> => {
  const pendientes = sqliteDb
    .getAllSync<any>("SELECT * FROM offline_users WHERE pendiente = 1")
    .map((row) => ({ ...row, pendiente: row.pendiente === 1 }) as OfflineUser);

  if (pendientes.length === 0) return { exitosos: 0, fallidos: 0 };

  const resultados = { exitosos: 0, fallidos: 0 };

  for (const usuario of pendientes) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        usuario.email,
        usuario.password,
      );

      await setDoc(doc(db, "Usuarios", userCredential.user.uid), {
        uid: userCredential.user.uid,
        nombre: usuario.nombre,
        correo: usuario.email,
        fechaRegistro: usuario.fechaCreacion,
        sincronizadoDesde: "offline",
      });

      // Actualizar UID al real y marcar sincronizado
      sqliteDb.runSync(
        "UPDATE offline_users SET pendiente = 0, uid = ? WHERE uid = ?",
        [userCredential.user.uid, usuario.uid],
      );

      resultados.exitosos++;
      console.log(`✅ Usuario sincronizado: ${usuario.email}`);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        sqliteDb.runSync(
          "UPDATE offline_users SET pendiente = 0 WHERE uid = ?",
          [usuario.uid],
        );
      } else {
        resultados.fallidos++;
        console.error(
          `❌ Error sincronizando ${usuario.email}:`,
          error.message,
        );
      }
    }
  }

  return resultados;
};

export const obtenerCantidadPendientes = (): number => {
  const r = sqliteDb.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM offline_users WHERE pendiente = 1",
  );
  return r?.count ?? 0;
};

export const hayUsuariosPendientes = (): boolean =>
  obtenerCantidadPendientes() > 0;
