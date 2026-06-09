// services/OfflineService.ts
import NetInfo from "@react-native-community/netinfo";
import * as SQLite from "expo-sqlite";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// ===================================
// TIPOS (sin cambios)
// ===================================

export type OperationType =
  | "crear_publicacion"
  | "crear_tarea"
  | "crear_evento"
  | "actualizar_estado_tarea"
  | "actualizar_asistencia_evento"
  | "agregar_comentario_tarea"
  | "agregar_reaccion"
  | "editar_publicacion"
  | "eliminar_publicacion";

export interface OfflineOperation {
  id: string;
  type: OperationType;
  data: any;
  timestamp: number;
  userId: string;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
  error?: string;
}

// ===================================
// CONSTANTES
// ===================================

const MAX_RETRIES = 3;

// ===================================
// BASE DE DATOS
// ===================================

const sqliteDb = SQLite.openDatabaseSync("workstation.db");

const initTable = (): void => {
  sqliteDb.execSync(`
    CREATE TABLE IF NOT EXISTS offline_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      userId TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      retryCount INTEGER DEFAULT 0,
      error TEXT
    );
  `);
};

// ===================================
// CLASE
// ===================================

class OfflineService {
  private isSyncing = false;
  private syncListeners: ((queue: OfflineOperation[]) => void)[] = [];
  private isOnline = true;

  constructor() {
    initTable();
    this.initNetworkListener();
  }

  // ===================================
  // GESTIÓN DE RED
  // ===================================

  private initNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log("✅ Conexión restaurada - iniciando sincronización");
        this.syncQueue();
      }
    });
  }

  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  // ===================================
  // GESTIÓN DE COLA (ahora con SQLite)
  // ===================================

  private loadQueue(): OfflineOperation[] {
    const rows = sqliteDb.getAllSync<{
      id: string;
      type: string;
      data: string;
      timestamp: number;
      userId: string;
      status: string;
      retryCount: number;
      error: string | null;
    }>("SELECT * FROM offline_queue ORDER BY timestamp ASC");

    return rows.map((row) => ({
      id: row.id,
      type: row.type as OperationType,
      data: JSON.parse(row.data),
      timestamp: row.timestamp,
      userId: row.userId,
      status: row.status as OfflineOperation["status"],
      retryCount: row.retryCount,
      error: row.error ?? undefined,
    }));
  }

  async addOperation(
    type: OperationType,
    data: any,
    userId: string,
  ): Promise<string> {
    const operation: OfflineOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      userId,
      status: "pending",
      retryCount: 0,
    };

    sqliteDb.runSync(
      `INSERT INTO offline_queue (id, type, data, timestamp, userId, status, retryCount)
       VALUES (?, ?, ?, ?, ?, 'pending', 0)`,
      [
        operation.id,
        operation.type,
        JSON.stringify(operation.data),
        operation.timestamp,
        operation.userId,
      ],
    );

    this.notifyListeners();
    console.log(`➕ Operación agregada: ${type} (ID: ${operation.id})`);

    if (this.isOnline) {
      this.syncQueue();
    }

    return operation.id;
  }

  getQueue(): OfflineOperation[] {
    return this.loadQueue();
  }

  getPendingCount(): number {
    const result = sqliteDb.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count FROM offline_queue WHERE status = 'pending'`,
    );
    return result?.count ?? 0;
  }

  async clearQueue(): Promise<void> {
    sqliteDb.runSync("DELETE FROM offline_queue");
    this.notifyListeners();
  }

  // ===================================
  // SINCRONIZACIÓN
  // ===================================

  async syncQueue(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    const pendingOps = this.loadQueue().filter(
      (op) => op.status === "pending" || op.status === "failed",
    );

    console.log(`🔄 Sincronizando ${pendingOps.length} operaciones`);

    for (const operation of pendingOps) {
      try {
        // Marcar como syncing
        sqliteDb.runSync(
          `UPDATE offline_queue SET status = 'syncing' WHERE id = ?`,
          [operation.id],
        );
        this.notifyListeners();

        await this.executeOperation(operation);

        // Éxito - eliminar de la cola
        sqliteDb.runSync("DELETE FROM offline_queue WHERE id = ?", [
          operation.id,
        ]);
        console.log(`✅ Operación sincronizada: ${operation.type}`);
      } catch (error: any) {
        console.error(`❌ Error en operación ${operation.type}:`, error);

        const newRetryCount = operation.retryCount + 1;
        sqliteDb.runSync(
          `UPDATE offline_queue SET status = 'failed', retryCount = ?, error = ? WHERE id = ?`,
          [newRetryCount, error.message ?? "Error desconocido", operation.id],
        );

        if (newRetryCount >= MAX_RETRIES) {
          console.log(`⚠️ Operación falló después de ${MAX_RETRIES} intentos`);
        }
      }

      this.notifyListeners();
    }

    this.isSyncing = false;
    console.log(
      `✅ Sincronización completada. Pendientes: ${this.getPendingCount()}`,
    );
  }

  // executeOperation no cambia — sigue sincronizando con Firebase igual
  private async executeOperation(operation: OfflineOperation): Promise<void> {
    const { type, data } = operation;

    switch (type) {
      case "crear_publicacion":
        await addDoc(collection(db, "Publicaciones"), {
          ...data,
          fechaCreacion: new Date().toISOString(),
        });
        break;

      case "crear_tarea":
        await addDoc(collection(db, "Tareas"), {
          ...data,
          fechaCreacion: new Date().toISOString(),
        });
        break;

      case "crear_evento":
        await addDoc(collection(db, "Eventos"), {
          ...data,
          fechaCreacion: new Date().toISOString(),
        });
        break;

      case "actualizar_estado_tarea":
        await updateDoc(doc(db, "Tareas", data.tareaId), {
          estado: data.estado,
          fechaActualizacion: new Date().toISOString(),
        });
        break;

      case "actualizar_asistencia_evento":
        await updateDoc(doc(db, "Eventos", data.eventoId), {
          asistentes: data.asistentes,
        });
        break;

      case "agregar_comentario_tarea":
        await updateDoc(doc(db, "Tareas", data.tareaId), {
          comentarios: data.comentarios,
        });
        break;

      case "agregar_reaccion":
        await updateDoc(doc(db, "Publicaciones", data.postId), {
          reacciones: data.reacciones,
        });
        break;

      case "editar_publicacion":
        await updateDoc(doc(db, "Publicaciones", data.postId), {
          contenido: data.contenido,
          fechaActualizacion: new Date().toISOString(),
        });
        break;

      case "eliminar_publicacion":
        break;

      default:
        throw new Error(`Tipo de operación no soportado: ${type}`);
    }
  }

  // ===================================
  // LISTENERS (sin cambios)
  // ===================================

  addSyncListener(callback: (queue: OfflineOperation[]) => void) {
    this.syncListeners.push(callback);
    callback(this.getQueue());
  }

  removeSyncListener(callback: (queue: OfflineOperation[]) => void) {
    this.syncListeners = this.syncListeners.filter((l) => l !== callback);
  }

  private notifyListeners() {
    const queue = this.getQueue();
    this.syncListeners.forEach((listener) => listener(queue));
  }
}

export const offlineService = new OfflineService();
