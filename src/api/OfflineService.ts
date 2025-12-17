import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { db } from './firebaseConfig';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';

// ===================================
// TIPOS
// ===================================

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

// ===================================
// CONSTANTES
// ===================================

const QUEUE_KEY = '@offline_queue';
const MAX_RETRIES = 3;

// ===================================
// CLASE OFFLINE SERVICE
// ===================================

class OfflineService {
  private queue: OfflineOperation[] = [];
  private isSyncing = false;
  private syncListeners: Array<(queue: OfflineOperation[]) => void> = [];
  private isOnline = true;

  constructor() {
    this.initNetworkListener();
    this.loadQueue();
  }

  // ===================================
  // GESTIÓN DE RED
  // ===================================

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      console.log('📡 Estado de red:', this.isOnline ? 'Online' : 'Offline');

      // Si volvemos a estar online, sincronizar
      if (wasOffline && this.isOnline) {
        console.log('✅ Conexión restaurada - iniciando sincronización');
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
  // GESTIÓN DE COLA
  // ===================================

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
      console.log(`💾 Cola guardada: ${this.queue.length} operaciones`);
    } catch (error) {
      console.error('❌ Error guardando cola:', error);
    }
  }

  async addOperation(type: OperationType, data: any, userId: string): Promise<string> {
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

    console.log(`➕ Operación agregada: ${type} (ID: ${operation.id})`);

    // Intentar sincronizar inmediatamente si hay conexión
    if (this.isOnline) {
      this.syncQueue();
    }

    return operation.id;
  }

  getQueue(): OfflineOperation[] {
    return [...this.queue];
  }

  getPendingCount(): number {
    return this.queue.filter(op => op.status === 'pending').length;
  }

  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
    this.notifyListeners();
  }

  // ===================================
  // SINCRONIZACIÓN
  // ===================================

  async syncQueue() {
    if (this.isSyncing) {
      console.log('⏳ Ya hay una sincronización en curso');
      return;
    }

    if (!this.isOnline) {
      console.log('📵 Sin conexión - esperando red');
      return;
    }

    if (this.queue.length === 0) {
      console.log('✅ Cola vacía - nada que sincronizar');
      return;
    }

    this.isSyncing = true;
    console.log(`🔄 Iniciando sincronización de ${this.queue.length} operaciones`);

    const pendingOps = this.queue.filter(op => op.status === 'pending' || op.status === 'failed');
    
    for (const operation of pendingOps) {
      try {
        operation.status = 'syncing';
        this.notifyListeners();

        await this.executeOperation(operation);

        // Operación exitosa - remover de la cola
        this.queue = this.queue.filter(op => op.id !== operation.id);
        console.log(`✅ Operación sincronizada: ${operation.type}`);

      } catch (error: any) {
        console.error(`❌ Error en operación ${operation.type}:`, error);
        
        operation.status = 'failed';
        operation.retryCount++;
        operation.error = error.message;

        // Si excedió reintentos, marcar como fallida permanentemente
        if (operation.retryCount >= MAX_RETRIES) {
          console.log(`⚠️ Operación falló después de ${MAX_RETRIES} intentos`);
          // Opcionalmente, podrías removerla o mantenerla para revisión manual
        }
      }

      await this.saveQueue();
      this.notifyListeners();
    }

    this.isSyncing = false;
    console.log(`✅ Sincronización completada. Pendientes: ${this.getPendingCount()}`);
  }

  private async executeOperation(operation: OfflineOperation): Promise<void> {
    const { type, data } = operation;

    switch (type) {
      case 'crear_publicacion':
        await addDoc(collection(db, 'Publicaciones'), {
          ...data,
          fechaCreacion: new Date().toISOString(),
        });
        break;

      case 'crear_tarea':
        await addDoc(collection(db, 'Tareas'), {
          ...data,
          fechaCreacion: new Date().toISOString(),
        });
        break;

      case 'crear_evento':
        await addDoc(collection(db, 'Eventos'), {
          ...data,
          fechaCreacion: new Date().toISOString(),
        });
        break;

      case 'actualizar_estado_tarea':
        await updateDoc(doc(db, 'Tareas', data.tareaId), {
          estado: data.estado,
          fechaActualizacion: new Date().toISOString(),
        });
        break;

      case 'actualizar_asistencia_evento':
        await updateDoc(doc(db, 'Eventos', data.eventoId), {
          asistentes: data.asistentes,
        });
        break;

      case 'agregar_comentario_tarea':
        await updateDoc(doc(db, 'Tareas', data.tareaId), {
          comentarios: data.comentarios,
        });
        break;

      case 'agregar_reaccion':
        await updateDoc(doc(db, 'Publicaciones', data.postId), {
          reacciones: data.reacciones,
        });
        break;

      case 'editar_publicacion':
        await updateDoc(doc(db, 'Publicaciones', data.postId), {
          contenido: data.contenido,
          fechaActualizacion: new Date().toISOString(),
        });
        break;

      case 'eliminar_publicacion':
        // Para eliminaciones, podrías usar deleteDoc
        // o un soft delete con un campo "eliminado: true"
        break;

      default:
        throw new Error(`Tipo de operación no soportado: ${type}`);
    }
  }

  // ===================================
  // LISTENERS
  // ===================================

  addSyncListener(callback: (queue: OfflineOperation[]) => void) {
    this.syncListeners.push(callback);
    // Notificar inmediatamente con el estado actual
    callback(this.getQueue());
  }

  removeSyncListener(callback: (queue: OfflineOperation[]) => void) {
    this.syncListeners = this.syncListeners.filter(listener => listener !== callback);
  }

  private notifyListeners() {
    this.syncListeners.forEach(listener => listener(this.getQueue()));
  }
}

// ===================================
// EXPORTAR INSTANCIA SINGLETON
// ===================================

export const offlineService = new OfflineService();