import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "./firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

const OFFLINE_USERS_KEY = "@offline_users";
const PENDING_USERS_KEY = "@pending_users_sync";

export interface OfflineUser {
  uid: string;
  email: string;
  password: string; 
  nombre: string;
  pendiente: boolean;
  fechaCreacion: string;
}

/**
 * Guardar usuario offline pendiente de sincronización
 */
export const guardarUsuarioOffline = async (
  email: string,
  password: string,
  nombre: string
): Promise<OfflineUser> => {
  try {
    // Generar UID temporal
    const uid = `offline_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const offlineUser: OfflineUser = {
      uid,
      email: email.toLowerCase().trim(),
      password, 
      nombre: nombre.trim(),
      pendiente: true,
      fechaCreacion: new Date().toISOString(),
    };

    // Obtener usuarios existentes
    const usuariosString = await AsyncStorage.getItem(OFFLINE_USERS_KEY);
    const usuarios: OfflineUser[] = usuariosString ? JSON.parse(usuariosString) : [];

    // Verificar si el email ya existe
    const existeEmail = usuarios.some((u) => u.email === offlineUser.email);
    if (existeEmail) {
      throw new Error("Este correo ya está registrado");
    }

    // Agregar nuevo usuario
    usuarios.push(offlineUser);
    await AsyncStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(usuarios));

    // Agregar a cola de sincronización
    await agregarAPendientesSincronizar(offlineUser);

    console.log("✅ Usuario guardado offline:", offlineUser.email);
    return offlineUser;
  } catch (error) {
    console.error("❌ Error guardando usuario offline:", error);
    throw error;
  }
};

/**
 * Login offline - Verificar credenciales localmente
 */
export const loginOffline = async (
  email: string,
  password: string
): Promise<OfflineUser | null> => {
  try {
    const usuariosString = await AsyncStorage.getItem(OFFLINE_USERS_KEY);
    if (!usuariosString) return null;

    const usuarios: OfflineUser[] = JSON.parse(usuariosString);
    const usuario = usuarios.find(
      (u) => u.email === email.toLowerCase().trim() && u.password === password
    );

    if (usuario) {
      console.log("✅ Login offline exitoso:", usuario.email);
      return usuario;
    }

    return null;
  } catch (error) {
    console.error("❌ Error en login offline:", error);
    return null;
  }
};

/**
 * Agregar usuario a cola de sincronización
 */
const agregarAPendientesSincronizar = async (usuario: OfflineUser): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_USERS_KEY);
    const pendientes: OfflineUser[] = pendientesString ? JSON.parse(pendientesString) : [];
    
    pendientes.push(usuario);
    await AsyncStorage.setItem(PENDING_USERS_KEY, JSON.stringify(pendientes));
    
    console.log("📝 Usuario agregado a cola de sincronización");
  } catch (error) {
    console.error("❌ Error agregando a pendientes:", error);
  }
};

/**
 * Sincronizar usuarios pendientes con Firebase
 */
export const sincronizarUsuariosPendientes = async (): Promise<{
  exitosos: number;
  fallidos: number;
}> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_USERS_KEY);
    if (!pendientesString) {
      console.log("ℹ️ No hay usuarios pendientes de sincronizar");
      return { exitosos: 0, fallidos: 0 };
    }

    const pendientes: OfflineUser[] = JSON.parse(pendientesString);
    const resultados = { exitosos: 0, fallidos: 0 };

    console.log(`🔄 Sincronizando ${pendientes.length} usuarios pendientes...`);

    for (const usuario of pendientes) {
      try {
        // Crear cuenta en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          usuario.email,
          usuario.password
        );

        // Crear documento en Firestore
        await setDoc(doc(db, "Usuarios", userCredential.user.uid), {
          uid: userCredential.user.uid,
          nombre: usuario.nombre,
          correo: usuario.email,
          fechaRegistro: usuario.fechaCreacion,
          sincronizadoDesde: "offline",
        });

        // Actualizar en storage local
        await marcarComoSincronizado(usuario.uid, userCredential.user.uid);

        resultados.exitosos++;
        console.log(`✅ Usuario sincronizado: ${usuario.email}`);
      } catch (error: any) {
        resultados.fallidos++;
        console.error(`❌ Error sincronizando ${usuario.email}:`, error.message);
        
        // Si el error es porque ya existe, marcar como sincronizado
        if (error.code === "auth/email-already-in-use") {
          await removerDePendientes(usuario.uid);
        }
      }
    }

    // Limpiar usuarios sincronizados
    await limpiarUsuariosSincronizados();

    console.log(`📊 Sincronización completa: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`);
    return resultados;
  } catch (error) {
    console.error("❌ Error en sincronización:", error);
    return { exitosos: 0, fallidos: 0 };
  }
};

/**
 * Marcar usuario como sincronizado
 */
const marcarComoSincronizado = async (
  uidOffline: string,
  uidFirebase: string
): Promise<void> => {
  try {
    const usuariosString = await AsyncStorage.getItem(OFFLINE_USERS_KEY);
    if (usuariosString) {
      const usuarios: OfflineUser[] = JSON.parse(usuariosString);
      const index = usuarios.findIndex((u) => u.uid === uidOffline);
      
      if (index !== -1) {
        usuarios[index].pendiente = false;
        usuarios[index].uid = uidFirebase;
        await AsyncStorage.setItem(OFFLINE_USERS_KEY, JSON.stringify(usuarios));
      }
    }

    await removerDePendientes(uidOffline);
  } catch (error) {
    console.error("❌ Error marcando como sincronizado:", error);
  }
};

/**
 * Remover usuario de cola de pendientes
 */
const removerDePendientes = async (uid: string): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_USERS_KEY);
    if (pendientesString) {
      const pendientes: OfflineUser[] = JSON.parse(pendientesString);
      const actualizados = pendientes.filter((u) => u.uid !== uid);
      await AsyncStorage.setItem(PENDING_USERS_KEY, JSON.stringify(actualizados));
    }
  } catch (error) {
    console.error("❌ Error removiendo de pendientes:", error);
  }
};

/**
 * Limpiar usuarios ya sincronizados
 */
const limpiarUsuariosSincronizados = async (): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_USERS_KEY);
    if (!pendientesString) return;

    const pendientes: OfflineUser[] = JSON.parse(pendientesString);
    const usuariosString = await AsyncStorage.getItem(OFFLINE_USERS_KEY);
    
    if (usuariosString) {
      const usuarios: OfflineUser[] = JSON.parse(usuariosString);
      const seguenPendientes = pendientes.filter((p) =>
        usuarios.some((u) => u.uid === p.uid && u.pendiente)
      );
      
      await AsyncStorage.setItem(PENDING_USERS_KEY, JSON.stringify(seguenPendientes));
    }
  } catch (error) {
    console.error("❌ Error limpiando sincronizados:", error);
  }
};

/**
 * Obtener cantidad de usuarios pendientes
 */
export const obtenerCantidadPendientes = async (): Promise<number> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_USERS_KEY);
    if (!pendientesString) return 0;
    
    const pendientes: OfflineUser[] = JSON.parse(pendientesString);
    return pendientes.length;
  } catch (error) {
    console.error("❌ Error obteniendo pendientes:", error);
    return 0;
  }
};

/**
 * Verificar si hay usuarios pendientes
 */
export const hayUsuariosPendientes = async (): Promise<boolean> => {
  const cantidad = await obtenerCantidadPendientes();
  return cantidad > 0;
};