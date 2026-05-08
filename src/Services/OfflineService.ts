// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NetInfo from '@react-native-community/netinfo';
// import { db } from './firebaseConfig';
// import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';

// // ===================================
// // TIPOS
// // ===================================

// export type OperationType = 
//   | 'crear_publicacion' 
//   | 'crear_tarea' 
//   | 'crear_evento'
//   | 'actualizar_estado_tarea'
//   | 'actualizar_asistencia_evento'
//   | 'agregar_comentario_tarea'
//   | 'agregar_reaccion'
//   | 'editar_publicacion'
//   | 'eliminar_publicacion';

// export interface OfflineOperation {
//   id: string;
//   type: OperationType;
//   data: any;
//   timestamp: number;
//   userId: string;
//   status: 'pending' | 'syncing' | 'failed';
//   retryCount: number;
//   error?: string;
// }

// // ===================================
// // CONSTANTES
// // ===================================

// const QUEUE_KEY = '@offline_queue';
// const MAX_RETRIES = 3;



// class OfflineService {
//   private queue: OfflineOperation[] = [];
//   private isSyncing = false;
//   private syncListeners: Array<(queue: OfflineOperation[]) => void> = [];
//   private isOnline = true;

//   constructor() {
//     this.initNetworkListener();
//     this.loadQueue();
//   }

//   // ===================================
//   // GESTIÓN DE RED
//   // ===================================

//   private initNetworkListener() {
//     NetInfo.addEventListener(state => {
//       const wasOffline = !this.isOnline;
//       this.isOnline = state.isConnected ?? false;


//       // Si volvemos a estar online, sincronizar
//       if (wasOffline && this.isOnline) {
//         console.log('✅ Conexión restaurada - iniciando sincronización');
//         this.syncQueue();
//       }
//     });
//   }

//   async checkConnection(): Promise<boolean> {
//     const state = await NetInfo.fetch();
//     this.isOnline = state.isConnected ?? false;
//     return this.isOnline;
//   }

//   // ===================================
//   // GESTIÓN DE COLA
//   // ===================================

//   private async loadQueue() {
//     try {
//       const queueData = await AsyncStorage.getItem(QUEUE_KEY);
//       if (queueData) {
//         this.queue = JSON.parse(queueData);
//         console.log(`📥 Cola cargada: ${this.queue.length} operaciones`);
//         this.notifyListeners();
//       }
//     } catch (error) {
//       console.error('❌ Error cargando cola:', error);
//     }
//   }

//   private async saveQueue() {
//     try {
//       await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
//       console.log(`💾 Cola guardada: ${this.queue.length} operaciones`);
//     } catch (error) {
//       console.error('❌ Error guardando cola:', error);
//     }
//   }

//   async addOperation(type: OperationType, data: any, userId: string): Promise<string> {
//     const operation: OfflineOperation = {
//       id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       type,
//       data,
//       timestamp: Date.now(),
//       userId,
//       status: 'pending',
//       retryCount: 0,
//     };

//     this.queue.push(operation);
//     await this.saveQueue();
//     this.notifyListeners();

//     console.log(`➕ Operación agregada: ${type} (ID: ${operation.id})`);

//     // Intentar sincronizar inmediatamente si hay conexión
//     if (this.isOnline) {
//       this.syncQueue();
//     }

//     return operation.id;
//   }

//   getQueue(): OfflineOperation[] {
//     return [...this.queue];
//   }

//   getPendingCount(): number {
//     return this.queue.filter(op => op.status === 'pending').length;
//   }

//   async clearQueue() {
//     this.queue = [];
//     await this.saveQueue();
//     this.notifyListeners();
//   }

//   // ===================================
//   // SINCRONIZACIÓN
//   // ===================================

//   async syncQueue() {

//     this.isSyncing = true;
//     console.log(`🔄 Iniciando sincronización de ${this.queue.length} operaciones`);

//     const pendingOps = this.queue.filter(op => op.status === 'pending' || op.status === 'failed');
    
//     for (const operation of pendingOps) {
//       try {
//         operation.status = 'syncing';
//         this.notifyListeners();

//         await this.executeOperation(operation);

//         // Operación exitosa - remover de la cola
//         this.queue = this.queue.filter(op => op.id !== operation.id);
//         console.log(`✅ Operación sincronizada: ${operation.type}`);

//       } catch (error: any) {
//         console.error(`❌ Error en operación ${operation.type}:`, error);
        
//         operation.status = 'failed';
//         operation.retryCount++;
//         operation.error = error.message;

//         if (operation.retryCount >= MAX_RETRIES) {
//           console.log(`⚠️ Operación falló después de ${MAX_RETRIES} intentos`);
//         }
//       }

//       await this.saveQueue();
//       this.notifyListeners();
//     }

//     this.isSyncing = false;
//     console.log(`✅ Sincronización completada. Pendientes: ${this.getPendingCount()}`);
//   }

//   private async executeOperation(operation: OfflineOperation): Promise<void> {
//     const { type, data } = operation;

//     switch (type) {
//       case 'crear_publicacion':
//         await addDoc(collection(db, 'Publicaciones'), {
//           ...data,
//           fechaCreacion: new Date().toISOString(),
//         });
//         break;

//       case 'crear_tarea':
//         await addDoc(collection(db, 'Tareas'), {
//           ...data,
//           fechaCreacion: new Date().toISOString(),
//         });
//         break;

//       case 'crear_evento':
//         await addDoc(collection(db, 'Eventos'), {
//           ...data,
//           fechaCreacion: new Date().toISOString(),
//         });
//         break;

//       case 'actualizar_estado_tarea':
//         await updateDoc(doc(db, 'Tareas', data.tareaId), {
//           estado: data.estado,
//           fechaActualizacion: new Date().toISOString(),
//         });
//         break;

//       case 'actualizar_asistencia_evento':
//         await updateDoc(doc(db, 'Eventos', data.eventoId), {
//           asistentes: data.asistentes,
//         });
//         break;

//       case 'agregar_comentario_tarea':
//         await updateDoc(doc(db, 'Tareas', data.tareaId), {
//           comentarios: data.comentarios,
//         });
//         break;

//       case 'agregar_reaccion':
//         await updateDoc(doc(db, 'Publicaciones', data.postId), {
//           reacciones: data.reacciones,
//         });
//         break;

//       case 'editar_publicacion':
//         await updateDoc(doc(db, 'Publicaciones', data.postId), {
//           contenido: data.contenido,
//           fechaActualizacion: new Date().toISOString(),
//         });
//         break;

//       case 'eliminar_publicacion':

//         break;

//       default:
//         throw new Error(`Tipo de operación no soportado: ${type}`);
//     }
//   }

//   // ===================================
//   // LISTENERS
//   // ===================================

//   addSyncListener(callback: (queue: OfflineOperation[]) => void) {
//     this.syncListeners.push(callback);
//     // Notificar inmediatamente con el estado actual
//     callback(this.getQueue());
//   }

//   removeSyncListener(callback: (queue: OfflineOperation[]) => void) {
//     this.syncListeners = this.syncListeners.filter(listener => listener !== callback);
//   }

//   private notifyListeners() {
//     this.syncListeners.forEach(listener => listener(this.getQueue()));
//   }
// }

// // ===================================
// // EXPORTAR INSTANCIA SINGLETON
// // ===================================

// export const offlineService = new OfflineService();

 //  OfflineService.ts
//  Cola offline con AsyncStorage.
//  Al sincronizar, envía las operaciones a FastAPI (Railway)
//  en lugar de escribir directamente en Firebase.
 
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL } from './railwayApiService';

 //  TIPOS
 
export type OperationType =
  | 'crear_publicacion'
  | 'crear_tarea'
  | 'crear_evento'
  | 'actualizar_estado_tarea'
  | 'actualizar_asistencia_evento'
  | 'agregar_comentario_tarea'
  | 'agregar_reaccion'
  | 'editar_publicacion'
  | 'eliminar_publicacion';

export interface OfflineOperation {
  id: string;
  type: OperationType;
  data: any;
  timestamp: number;
  userId: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  error?: string;
}

 //  CONSTANTES
 
const QUEUE_KEY = '@offline_queue';
const MAX_RETRIES = 3;

 //  HELPER: petición HTTP a FastAPI
 
async function railwayFetch(path: string, options?: RequestInit): Promise<any> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`FastAPI ${response.status}: ${text}`);
  }
  return response.json();
}

 //  CLASE PRINCIPAL
 
class OfflineService {
  private queue: OfflineOperation[] = [];
  private isSyncing = false;
  private syncListeners: Array<(queue: OfflineOperation[]) => void> = [];
  private isOnline = true;

  constructor() {
    this.initNetworkListener();
    this.loadQueue();
  }

  // ── Red ────────────────────────────────────────────────────

  private initNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('✅ Conexión restaurada — sincronizando con FastAPI');
        this.syncQueue();
      }
    });
  }

  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  // ── Cola ───────────────────────────────────────────────────

  private async loadQueue() {
    try {
      const queueData = await AsyncStorage.getItem(QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(`📥 Cola cargada: ${this.queue.length} operaciones`);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('❌ Error cargando cola:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('❌ Error guardando cola:', error);
    }
  }

  async addOperation(
    type: OperationType,
    data: any,
    userId: string
  ): Promise<string> {
    const operation: OfflineOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      userId,
      status: 'pending',
      retryCount: 0,
    };

    this.queue.push(operation);
    await this.saveQueue();
    this.notifyListeners();
    console.log(`➕ Operación encolada: ${type} (${operation.id})`);

    if (this.isOnline) {
      this.syncQueue();
    }

    return operation.id;
  }

  getQueue(): OfflineOperation[] {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.filter((op) => op.status === 'pending').length;
  }

  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
  }

  // ── Sincronización ─────────────────────────────────────────

  async syncQueue() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log(`🔄 Sincronizando ${this.queue.length} operaciones → FastAPI`);

    const pendingOps = this.queue.filter(
      (op) => op.status === 'pending' || op.status === 'failed'
    );

    for (const operation of pendingOps) {
      try {
        operation.status = 'syncing';
        this.notifyListeners();

        await this.executeOperation(operation);

        // Éxito — sacar de la cola
        this.queue = this.queue.filter((op) => op.id !== operation.id);
        console.log(`✅ Sincronizado: ${operation.type}`);
      } catch (error: any) {
        console.error(`❌ Error en ${operation.type}:`, error.message);
        operation.status = 'failed';
        operation.retryCount++;
        operation.error = error.message;

        if (operation.retryCount >= MAX_RETRIES) {
          console.warn(`⚠️ Operación ${operation.type} falló ${MAX_RETRIES} veces — se deja en cola`);
        }
      }

      await this.saveQueue();
      this.notifyListeners();
    }

    this.isSyncing = false;
    console.log(`✅ Sync completo. Pendientes: ${this.getPendingCount()}`);
  }

  // ── Ejecutar operación → FastAPI ───────────────────────────

  private async executeOperation(operation: OfflineOperation): Promise<void> {
    const { type, data } = operation;

    switch (type) {

      // ── TAREAS ──────────────────────────────────────────────

      case 'crear_tarea':
        await railwayFetch('/tareas', {
          method: 'POST',
          body: JSON.stringify({
            ...data,
            fechaCreacion: new Date().toISOString(),
          }),
        });
        break;

      case 'actualizar_estado_tarea':
        await railwayFetch(`/tareas/${data.tareaId}/estado`, {
          method: 'PATCH',
          body: JSON.stringify({ estado: data.estado }),
        });
        break;

      case 'agregar_comentario_tarea':
        await railwayFetch(`/tareas/${data.tareaId}/comentarios`, {
          method: 'POST',
          body: JSON.stringify({
            texto: data.comentario?.texto ?? '',
            autorUid: data.comentario?.autorUid ?? '',
            autorNombre: data.comentario?.autorNombre ?? '',
          }),
        });
        break;

      // ── PUBLICACIONES ───────────────────────────────────────

      case 'crear_publicacion':
        await railwayFetch('/publicaciones', {
          method: 'POST',
          body: JSON.stringify({
            ...data,
            fechaCreacion: new Date().toISOString(),
          }),
        });
        break;

      case 'editar_publicacion':
        await railwayFetch(`/publicaciones/${data.postId}`, {
          method: 'PATCH',
          body: JSON.stringify({ contenido: data.contenido }),
        });
        break;

      case 'agregar_reaccion':
        await railwayFetch(`/publicaciones/${data.postId}/reacciones`, {
          method: 'POST',
          body: JSON.stringify({ reacciones: data.reacciones }),
        });
        break;

      case 'eliminar_publicacion':
        // Si quieres implementar DELETE: await railwayFetch(`/publicaciones/${data.postId}`, { method: 'DELETE' });
        console.warn('eliminar_publicacion: no implementado en FastAPI todavía');
        break;

      // ── EVENTOS ─────────────────────────────────────────────

      case 'crear_evento':
        await railwayFetch('/eventos', {
          method: 'POST',
          body: JSON.stringify({
            ...data,
            fechaCreacion: new Date().toISOString(),
          }),
        });
        break;

      case 'actualizar_asistencia_evento':
        await railwayFetch(`/eventos/${data.eventoId}/asistentes`, {
          method: 'PATCH',
          body: JSON.stringify({ asistentes: data.asistentes }),
        });
        break;

      default:
        throw new Error(`Tipo de operación no soportado: ${type}`);
    }
  }

  // ── Listeners ──────────────────────────────────────────────

  addSyncListener(callback: (queue: OfflineOperation[]) => void) {
    this.syncListeners.push(callback);
    callback(this.getQueue());
  }

  removeSyncListener(callback: (queue: OfflineOperation[]) => void) {
    this.syncListeners = this.syncListeners.filter((l) => l !== callback);
  }

  private notifyListeners() {
    this.syncListeners.forEach((l) => l(this.getQueue()));
  }
}

 //  SINGLETON
 
export const offlineService = new OfflineService();