// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { db } from "./firebaseConfig";
// import { 
//   collection, 
//   addDoc, 
//   doc, 
//   setDoc, 
//   getDocs, 
//   query, 
//   where,
//   serverTimestamp 
// } from "firebase/firestore";

// const OFFLINE_EMPRESAS_KEY = "@offline_empresas";
// const OFFLINE_DEPARTAMENTOS_KEY = "@offline_departamentos";
// const PENDING_EMPRESAS_SYNC_KEY = "@pending_empresas_sync";
// const PENDING_DEPTOS_SYNC_KEY = "@pending_deptos_sync";

// // ===================================
// // TIPOS
// // ===================================

// export interface OfflineEmpresa {
//   id: string; // ID temporal offline
//   nombre: string;
//   codigoAcceso: string;
//   creadaPor: string;
//   nombreCreador: string;
//   correoCreador: string;
//   pendiente: boolean;
//   fechaCreacion: string;
//   rolesDisponibles: string[];
// }

// export interface OfflineDepartamento {
//   id: string; // ID temporal offline
//   empresaId: string; // ID temporal de la empresa
//   nombre: string;
//   activo: boolean;
//   pendiente: boolean;
//   fechaCreacion: string;
// }

// // ===================================
// // EMPRESAS OFFLINE
// // ===================================

// /**
//  * Crear empresa offline
//  */
// export const crearEmpresaOffline = async (
//   nombre: string,
//   codigo: string,
//   uidAdmin: string,
//   nombreAdmin: string,
//   correoAdmin: string
// ): Promise<OfflineEmpresa> => {
//   try {
//     // Generar ID temporal
//     const empresaId = `offline_empresa_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
//     const offlineEmpresa: OfflineEmpresa = {
//       id: empresaId,
//       nombre: nombre.trim(),
//       codigoAcceso: codigo.trim().toUpperCase(),
//       creadaPor: uidAdmin,
//       nombreCreador: nombreAdmin,
//       correoCreador: correoAdmin,
//       pendiente: true,
//       fechaCreacion: new Date().toISOString(),
//       rolesDisponibles: ["Administrador", "Jefe", "Empleado"],
//     };

//     // Guardar en AsyncStorage
//     const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
//     const empresas: OfflineEmpresa[] = empresasString ? JSON.parse(empresasString) : [];

//     // Verificar si el código ya existe
//     const existeCodigo = empresas.some((e) => e.codigoAcceso === offlineEmpresa.codigoAcceso);
//     if (existeCodigo) {
//       throw new Error("Ya existe una empresa con ese código");
//     }

//     empresas.push(offlineEmpresa);
//     await AsyncStorage.setItem(OFFLINE_EMPRESAS_KEY, JSON.stringify(empresas));

//     // Agregar a cola de sincronización
//     await agregarEmpresaAPendientes(offlineEmpresa);

//     console.log("✅ Empresa guardada offline:", offlineEmpresa.nombre);
//     return offlineEmpresa;
//   } catch (error) {
//     console.error("❌ Error guardando empresa offline:", error);
//     throw error;
//   }
// };

// /**
//  * Buscar empresa offline por código
//  */
// export const buscarEmpresaOfflinePorCodigo = async (
//   codigo: string
// ): Promise<OfflineEmpresa | null> => {
//   try {
//     const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
//     if (!empresasString) return null;

//     const empresas: OfflineEmpresa[] = JSON.parse(empresasString);
//     const empresa = empresas.find(
//       (e) => e.codigoAcceso === codigo.trim().toUpperCase()
//     );

//     return empresa || null;
//   } catch (error) {
//     console.error("❌ Error buscando empresa offline:", error);
//     return null;
//   }
// };

// /**
//  * Obtener empresas offline del usuario
//  */
// export const obtenerEmpresasOfflineDelUsuario = async (
//   uid: string
// ): Promise<OfflineEmpresa[]> => {
//   try {
//     const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
//     if (!empresasString) return [];

//     const empresas: OfflineEmpresa[] = JSON.parse(empresasString);
    
//     // Retornar empresas creadas por el usuario
//     return empresas.filter((e) => e.creadaPor === uid);
//   } catch (error) {
//     console.error("❌ Error obteniendo empresas offline:", error);
//     return [];
//   }
// };

// // ===================================
// // DEPARTAMENTOS OFFLINE
// // ===================================

// /**
//  * Crear departamento offline
//  */
// export const crearDepartamentoOffline = async (
//   empresaId: string,
//   nombre: string
// ): Promise<OfflineDepartamento> => {
//   try {
//     const deptoId = `offline_depto_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
//     const offlineDepto: OfflineDepartamento = {
//       id: deptoId,
//       empresaId,
//       nombre: nombre.trim(),
//       activo: true,
//       pendiente: true,
//       fechaCreacion: new Date().toISOString(),
//     };

//     // Guardar en AsyncStorage
//     const deptosString = await AsyncStorage.getItem(OFFLINE_DEPARTAMENTOS_KEY);
//     const deptos: OfflineDepartamento[] = deptosString ? JSON.parse(deptosString) : [];

//     deptos.push(offlineDepto);
//     await AsyncStorage.setItem(OFFLINE_DEPARTAMENTOS_KEY, JSON.stringify(deptos));

//     // Agregar a cola de sincronización
//     await agregarDeptoAPendientes(offlineDepto);

//     console.log("✅ Departamento guardado offline:", offlineDepto.nombre);
//     return offlineDepto;
//   } catch (error) {
//     console.error("❌ Error guardando departamento offline:", error);
//     throw error;
//   }
// };

// /**
//  * Obtener departamentos offline de una empresa
//  */
// export const obtenerDepartamentosOffline = async (
//   empresaId: string
// ): Promise<OfflineDepartamento[]> => {
//   try {
//     const deptosString = await AsyncStorage.getItem(OFFLINE_DEPARTAMENTOS_KEY);
//     if (!deptosString) return [];

//     const deptos: OfflineDepartamento[] = JSON.parse(deptosString);
    
//     // Retornar departamentos de esta empresa
//     return deptos.filter((d) => d.empresaId === empresaId);
//   } catch (error) {
//     console.error("❌ Error obteniendo departamentos offline:", error);
//     return [];
//   }
// };

// // ===================================
// // COLAS DE SINCRONIZACIÓN
// // ===================================

// const agregarEmpresaAPendientes = async (empresa: OfflineEmpresa): Promise<void> => {
//   try {
//     const pendientesString = await AsyncStorage.getItem(PENDING_EMPRESAS_SYNC_KEY);
//     const pendientes: OfflineEmpresa[] = pendientesString ? JSON.parse(pendientesString) : [];
    
//     pendientes.push(empresa);
//     await AsyncStorage.setItem(PENDING_EMPRESAS_SYNC_KEY, JSON.stringify(pendientes));
    
//     console.log("📝 Empresa agregada a cola de sincronización");
//   } catch (error) {
//     console.error("❌ Error agregando empresa a pendientes:", error);
//   }
// };

// const agregarDeptoAPendientes = async (depto: OfflineDepartamento): Promise<void> => {
//   try {
//     const pendientesString = await AsyncStorage.getItem(PENDING_DEPTOS_SYNC_KEY);
//     const pendientes: OfflineDepartamento[] = pendientesString ? JSON.parse(pendientesString) : [];
    
//     pendientes.push(depto);
//     await AsyncStorage.setItem(PENDING_DEPTOS_SYNC_KEY, JSON.stringify(pendientes));
    
//     console.log("📝 Departamento agregado a cola de sincronización");
//   } catch (error) {
//     console.error("❌ Error agregando departamento a pendientes:", error);
//   }
// };

// // ===================================
// // SINCRONIZACIÓN CON FIREBASE
// // ===================================

// /**
//  * Sincronizar empresas pendientes
//  */
// export const sincronizarEmpresasPendientes = async (): Promise<{
//   exitosos: number;
//   fallidos: number;
// }> => {
//   try {
//     const pendientesString = await AsyncStorage.getItem(PENDING_EMPRESAS_SYNC_KEY);
//     if (!pendientesString) {
//       console.log("ℹ️ No hay empresas pendientes de sincronizar");
//       return { exitosos: 0, fallidos: 0 };
//     }

//     const pendientes: OfflineEmpresa[] = JSON.parse(pendientesString);
//     const resultados = { exitosos: 0, fallidos: 0 };

//     console.log(`🔄 Sincronizando ${pendientes.length} empresas pendientes...`);

//     // Mapeo de IDs temporales a IDs reales
//     const mapeoIds: Record<string, string> = {};

//     for (const empresa of pendientes) {
//       try {
//         // Verificar si ya existe una empresa con ese código
//         const q = query(
//           collection(db, "Empresas"),
//           where("codigoAcceso", "==", empresa.codigoAcceso)
//         );
//         const snapshot = await getDocs(q);

//         let empresaIdReal: string;

//         if (!snapshot.empty) {
//           // La empresa ya existe, usar ese ID
//           empresaIdReal = snapshot.docs[0].id;
//           console.log(`⚠️ Empresa ${empresa.nombre} ya existe en Firebase`);
//         } else {
//           // Crear nueva empresa en Firebase
//           const docRef = await addDoc(collection(db, "Empresas"), {
//             nombre: empresa.nombre,
//             codigoAcceso: empresa.codigoAcceso,
//             fechaCreacion: serverTimestamp(),
//             creadaPor: empresa.creadaPor,
//             rolesDisponibles: empresa.rolesDisponibles,
//           });

//           empresaIdReal = docRef.id;
//           console.log(`✅ Empresa creada en Firebase: ${empresa.nombre}`);
//         }

//         // Guardar mapeo de IDs
//         mapeoIds[empresa.id] = empresaIdReal;

//         // Vincular usuario administrador
//         await setDoc(doc(db, "Usuarios", empresa.creadaPor), {
//           uid: empresa.creadaPor,
//           nombre: empresa.nombreCreador,
//           correo: empresa.correoCreador,
//           rol: "Administrador",
//           empresaId: empresaIdReal,
//           fechaIngreso: empresa.fechaCreacion,
//         }, { merge: true });

//         // Marcar como sincronizada
//         await marcarEmpresaComoSincronizada(empresa.id, empresaIdReal);

//         resultados.exitosos++;
//       } catch (error: any) {
//         resultados.fallidos++;
//         console.error(`❌ Error sincronizando empresa ${empresa.nombre}:`, error.message);
//       }
//     }

//     // Sincronizar departamentos asociados
//     await sincronizarDepartamentosPendientes(mapeoIds);

//     // Limpiar empresas sincronizadas
//     await limpiarEmpresasSincronizadas();

//     console.log(`📊 Sincronización de empresas completa: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`);
//     return resultados;
//   } catch (error) {
//     console.error("❌ Error en sincronización de empresas:", error);
//     return { exitosos: 0, fallidos: 0 };
//   }
// };

// /**
//  * Sincronizar departamentos pendientes
//  */
// export const sincronizarDepartamentosPendientes = async (
//   mapeoIds?: Record<string, string>
// ): Promise<{
//   exitosos: number;
//   fallidos: number;
// }> => {
//   try {
//     const pendientesString = await AsyncStorage.getItem(PENDING_DEPTOS_SYNC_KEY);
//     if (!pendientesString) {
//       console.log("ℹ️ No hay departamentos pendientes de sincronizar");
//       return { exitosos: 0, fallidos: 0 };
//     }

//     const pendientes: OfflineDepartamento[] = JSON.parse(pendientesString);
//     const resultados = { exitosos: 0, fallidos: 0 };

//     console.log(`🔄 Sincronizando ${pendientes.length} departamentos pendientes...`);

//     for (const depto of pendientes) {
//       try {
//         // Obtener ID real de la empresa
//         let empresaIdReal = depto.empresaId;
        
//         if (mapeoIds && mapeoIds[depto.empresaId]) {
//           empresaIdReal = mapeoIds[depto.empresaId];
//         } else {
//           // Buscar en empresas offline sincronizadas
//           const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
//           if (empresasString) {
//             const empresas: OfflineEmpresa[] = JSON.parse(empresasString);
//             const empresa = empresas.find((e) => e.id === depto.empresaId);
//             if (empresa && !empresa.pendiente) {
//               empresaIdReal = empresa.id;
//             }
//           }
//         }

//         // Verificar que la empresa existe en Firebase
//         if (empresaIdReal.startsWith("offline_")) {
//           console.log(`⚠️ Empresa ${empresaIdReal} aún no sincronizada, saltando departamento ${depto.nombre}`);
//           continue;
//         }

//         // Crear departamento en Firebase
//         const departamentosRef = collection(db, "Empresas", empresaIdReal, "Departamentos");
//         const docRef = await addDoc(departamentosRef, {
//           nombre: depto.nombre,
//           activo: depto.activo,
//           fechaCreacion: serverTimestamp(),
//         });

//         console.log(`✅ Departamento creado en Firebase: ${depto.nombre}`);

//         // Marcar como sincronizado
//         await marcarDeptoComoSincronizado(depto.id, docRef.id, empresaIdReal);

//         resultados.exitosos++;
//       } catch (error: any) {
//         resultados.fallidos++;
//         console.error(`❌ Error sincronizando departamento ${depto.nombre}:`, error.message);
//       }
//     }

//     // Limpiar departamentos sincronizados
//     await limpiarDeptosSincronizados();

//     console.log(`📊 Sincronización de departamentos completa: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`);
//     return resultados;
//   } catch (error) {
//     console.error("❌ Error en sincronización de departamentos:", error);
//     return { exitosos: 0, fallidos: 0 };
//   }
// };

// // ===================================
// // MARCAR COMO SINCRONIZADO
// // ===================================

// const marcarEmpresaComoSincronizada = async (
//   idOffline: string,
//   idFirebase: string
// ): Promise<void> => {
//   try {
//     const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
//     if (empresasString) {
//       const empresas: OfflineEmpresa[] = JSON.parse(empresasString);
//       const index = empresas.findIndex((e) => e.id === idOffline);
      
//       if (index !== -1) {
//         empresas[index].pendiente = false;
//         empresas[index].id = idFirebase;
//         await AsyncStorage.setItem(OFFLINE_EMPRESAS_KEY, JSON.stringify(empresas));
//       }
//     }

//     await removerEmpresaDePendientes(idOffline);
//   } catch (error) {
//     console.error("❌ Error marcando empresa como sincronizada:", error);
//   }
// };

// const marcarDeptoComoSincronizado = async (
//   idOffline: string,
//   idFirebase: string,
//   empresaIdReal: string
// ): Promise<void> => {
//   try {
//     const deptosString = await AsyncStorage.getItem(OFFLINE_DEPARTAMENTOS_KEY);
//     if (deptosString) {
//       const deptos: OfflineDepartamento[] = JSON.parse(deptosString);
//       const index = deptos.findIndex((d) => d.id === idOffline);
      
//       if (index !== -1) {
//         deptos[index].pendiente = false;
//         deptos[index].id = idFirebase;
//         deptos[index].empresaId = empresaIdReal;
//         await AsyncStorage.setItem(OFFLINE_DEPARTAMENTOS_KEY, JSON.stringify(deptos));
//       }
//     }

//     await removerDeptoDePendientes(idOffline);
//   } catch (error) {
//     console.error("❌ Error marcando departamento como sincronizado:", error);
//   }
// };

// // ===================================
// // REMOVER DE PENDIENTES
// // ===================================

// const removerEmpresaDePendientes = async (id: string): Promise<void> => {
//   try {
//     const pendientesString = await AsyncStorage.getItem(PENDING_EMPRESAS_SYNC_KEY);
//     if (pendientesString) {
//       const pendientes: OfflineEmpresa[] = JSON.parse(pendientesString);
//       const actualizados = pendientes.filter((e) => e.id !== id);
//       await AsyncStorage.setItem(PENDING_EMPRESAS_SYNC_KEY, JSON.stringify(actualizados));
//     }
//   } catch (error) {
//     console.error("❌ Error removiendo empresa de pendientes:", error);
//   }
// };

// const removerDeptoDePendientes = async (id: string): Promise<void> => {
//   try {
//     const pendientesString = await AsyncStorage.getItem(PENDING_DEPTOS_SYNC_KEY);
//     if (pendientesString) {
//       const pendientes: OfflineDepartamento[] = JSON.parse(pendientesString);
//       const actualizados = pendientes.filter((d) => d.id !== id);
//       await AsyncStorage.setItem(PENDING_DEPTOS_SYNC_KEY, JSON.stringify(actualizados));
//     }
//   } catch (error) {
//     console.error("❌ Error removiendo departamento de pendientes:", error);
//   }
// };

// // ===================================
// // LIMPIAR SINCRONIZADOS
// // ===================================

// const limpiarEmpresasSincronizadas = async (): Promise<void> => {
//   try {
//     const pendientesString = await AsyncStorage.getItem(PENDING_EMPRESAS_SYNC_KEY);
//     if (!pendientesString) return;

//     const pendientes: OfflineEmpresa[] = JSON.parse(pendientesString);
//     const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
    
//     if (empresasString) {
//       const empresas: OfflineEmpresa[] = JSON.parse(empresasString);
//       const seguenPendientes = pendientes.filter((p) =>
//         empresas.some((e) => e.id === p.id && e.pendiente)
//       );
      
//       await AsyncStorage.setItem(PENDING_EMPRESAS_SYNC_KEY, JSON.stringify(seguenPendientes));
//     }
//   } catch (error) {
//     console.error("❌ Error limpiando empresas sincronizadas:", error);
//   }
// };

// const limpiarDeptosSincronizados = async (): Promise<void> => {
//   try {
//     const pendientesString = await AsyncStorage.getItem(PENDING_DEPTOS_SYNC_KEY);
//     if (!pendientesString) return;

//     const pendientes: OfflineDepartamento[] = JSON.parse(pendientesString);
//     const deptosString = await AsyncStorage.getItem(OFFLINE_DEPARTAMENTOS_KEY);
    
//     if (deptosString) {
//       const deptos: OfflineDepartamento[] = JSON.parse(deptosString);
//       const seguenPendientes = pendientes.filter((p) =>
//         deptos.some((d) => d.id === p.id && d.pendiente)
//       );
      
//       await AsyncStorage.setItem(PENDING_DEPTOS_SYNC_KEY, JSON.stringify(seguenPendientes));
//     }
//   } catch (error) {
//     console.error("❌ Error limpiando departamentos sincronizados:", error);
//   }
// };

// // ===================================
// // UTILIDADES
// // ===================================

// export const obtenerCantidadEmpresasPendientes = async (): Promise<number> => {
//   try {
//     const pendientesString = await AsyncStorage.getItem(PENDING_EMPRESAS_SYNC_KEY);
//     if (!pendientesString) return 0;
    
//     const pendientes: OfflineEmpresa[] = JSON.parse(pendientesString);
//     return pendientes.length;
//   } catch (error) {
//     return 0;
//   }
// };

// export const obtenerCantidadDeptosPendientes = async (): Promise<number> => {
//   try {
//     const pendientesString = await AsyncStorage.getItem(PENDING_DEPTOS_SYNC_KEY);
//     if (!pendientesString) return 0;
    
//     const pendientes: OfflineDepartamento[] = JSON.parse(pendientesString);
//     return pendientes.length;
//   } catch (error) {
//     return 0;
//   }
// };

// export const hayEmpresasODeptosPendientes = async (): Promise<boolean> => {
//   const empresas = await obtenerCantidadEmpresasPendientes();
//   const deptos = await obtenerCantidadDeptosPendientes();
//   return empresas > 0 || deptos > 0;
// };

import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "./firebaseConfig";
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from "firebase/firestore";

const OFFLINE_EMPRESAS_KEY = "@offline_empresas";
const OFFLINE_DEPARTAMENTOS_KEY = "@offline_departamentos";
const OFFLINE_VINCULACIONES_KEY = "@offline_vinculaciones"; // NUEVO
const PENDING_EMPRESAS_SYNC_KEY = "@pending_empresas_sync";
const PENDING_DEPTOS_SYNC_KEY = "@pending_deptos_sync";
const PENDING_VINCULACIONES_SYNC_KEY = "@pending_vinculaciones_sync"; // NUEVO

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

// NUEVO: Interface para vinculaciones offline
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
// EMPRESAS OFFLINE
// ===================================

export const crearEmpresaOffline = async (
  nombre: string,
  codigo: string,
  uidAdmin: string,
  nombreAdmin: string,
  correoAdmin: string
): Promise<OfflineEmpresa> => {
  try {
    const empresaId = `offline_empresa_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const offlineEmpresa: OfflineEmpresa = {
      id: empresaId,
      nombre: nombre.trim(),
      codigoAcceso: codigo.trim().toUpperCase(),
      creadaPor: uidAdmin,
      nombreCreador: nombreAdmin,
      correoCreador: correoAdmin,
      pendiente: true,
      fechaCreacion: new Date().toISOString(),
      rolesDisponibles: ["Administrador", "Jefe", "Empleado"],
    };

    const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
    const empresas: OfflineEmpresa[] = empresasString ? JSON.parse(empresasString) : [];

    const existeCodigo = empresas.some((e) => e.codigoAcceso === offlineEmpresa.codigoAcceso);
    if (existeCodigo) {
      throw new Error("Ya existe una empresa con ese código");
    }

    empresas.push(offlineEmpresa);
    await AsyncStorage.setItem(OFFLINE_EMPRESAS_KEY, JSON.stringify(empresas));

    await agregarEmpresaAPendientes(offlineEmpresa);

    console.log("✅ Empresa guardada offline:", offlineEmpresa.nombre);
    return offlineEmpresa;
  } catch (error) {
    console.error("❌ Error guardando empresa offline:", error);
    throw error;
  }
};

export const buscarEmpresaOfflinePorCodigo = async (
  codigo: string
): Promise<OfflineEmpresa | null> => {
  try {
    const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
    if (!empresasString) return null;

    const empresas: OfflineEmpresa[] = JSON.parse(empresasString);
    const empresa = empresas.find(
      (e) => e.codigoAcceso === codigo.trim().toUpperCase()
    );

    return empresa || null;
  } catch (error) {
    console.error("❌ Error buscando empresa offline:", error);
    return null;
  }
};

export const obtenerEmpresasOfflineDelUsuario = async (
  uid: string
): Promise<OfflineEmpresa[]> => {
  try {
    const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
    if (!empresasString) return [];

    const empresas: OfflineEmpresa[] = JSON.parse(empresasString);
    
    return empresas.filter((e) => e.creadaPor === uid);
  } catch (error) {
    console.error("❌ Error obteniendo empresas offline:", error);
    return [];
  }
};

// ===================================
// VINCULACIONES OFFLINE (NUEVO)
// ===================================

export const vincularUsuarioAEmpresaOffline = async (
  uid: string,
  nombre: string,
  correo: string,
  empresaId: string,
  rol: "Administrador" | "Jefe" | "Empleado"
): Promise<OfflineVinculacion> => {
  try {
    const vinculacionId = `offline_vinc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const offlineVinculacion: OfflineVinculacion = {
      id: vinculacionId,
      uid,
      nombre: nombre.trim(),
      correo: correo.trim(),
      empresaId,
      rol,
      pendiente: true,
      fechaCreacion: new Date().toISOString(),
    };

    const vinculacionesString = await AsyncStorage.getItem(OFFLINE_VINCULACIONES_KEY);
    const vinculaciones: OfflineVinculacion[] = vinculacionesString ? JSON.parse(vinculacionesString) : [];

    // Verificar si ya existe una vinculación para este usuario y empresa
    const existeVinculacion = vinculaciones.some(
      (v) => v.uid === uid && v.empresaId === empresaId
    );

    if (existeVinculacion) {
      console.log("⚠️ Ya existe una vinculación para este usuario y empresa");
      // Actualizar la existente
      const index = vinculaciones.findIndex((v) => v.uid === uid && v.empresaId === empresaId);
      vinculaciones[index] = offlineVinculacion;
    } else {
      vinculaciones.push(offlineVinculacion);
    }

    await AsyncStorage.setItem(OFFLINE_VINCULACIONES_KEY, JSON.stringify(vinculaciones));
    await agregarVinculacionAPendientes(offlineVinculacion);

    console.log("✅ Vinculación guardada offline:", uid, "->", empresaId);
    return offlineVinculacion;
  } catch (error) {
    console.error("❌ Error guardando vinculación offline:", error);
    throw error;
  }
};

export const obtenerVinculacionOffline = async (
  uid: string,
  empresaId: string
): Promise<OfflineVinculacion | null> => {
  try {
    const vinculacionesString = await AsyncStorage.getItem(OFFLINE_VINCULACIONES_KEY);
    if (!vinculacionesString) return null;

    const vinculaciones: OfflineVinculacion[] = JSON.parse(vinculacionesString);
    const vinculacion = vinculaciones.find(
      (v) => v.uid === uid && v.empresaId === empresaId
    );

    return vinculacion || null;
  } catch (error) {
    console.error("❌ Error obteniendo vinculación offline:", error);
    return null;
  }
};

// ===================================
// DEPARTAMENTOS OFFLINE
// ===================================

export const crearDepartamentoOffline = async (
  empresaId: string,
  nombre: string
): Promise<OfflineDepartamento> => {
  try {
    const deptoId = `offline_depto_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const offlineDepto: OfflineDepartamento = {
      id: deptoId,
      empresaId,
      nombre: nombre.trim(),
      activo: true,
      pendiente: true,
      fechaCreacion: new Date().toISOString(),
    };

    const deptosString = await AsyncStorage.getItem(OFFLINE_DEPARTAMENTOS_KEY);
    const deptos: OfflineDepartamento[] = deptosString ? JSON.parse(deptosString) : [];

    deptos.push(offlineDepto);
    await AsyncStorage.setItem(OFFLINE_DEPARTAMENTOS_KEY, JSON.stringify(deptos));

    await agregarDeptoAPendientes(offlineDepto);

    console.log("✅ Departamento guardado offline:", offlineDepto.nombre);
    return offlineDepto;
  } catch (error) {
    console.error("❌ Error guardando departamento offline:", error);
    throw error;
  }
};

export const obtenerDepartamentosOffline = async (
  empresaId: string
): Promise<OfflineDepartamento[]> => {
  try {
    const deptosString = await AsyncStorage.getItem(OFFLINE_DEPARTAMENTOS_KEY);
    if (!deptosString) return [];

    const deptos: OfflineDepartamento[] = JSON.parse(deptosString);
    
    return deptos.filter((d) => d.empresaId === empresaId);
  } catch (error) {
    console.error("❌ Error obteniendo departamentos offline:", error);
    return [];
  }
};

// ===================================
// COLAS DE SINCRONIZACIÓN
// ===================================

const agregarEmpresaAPendientes = async (empresa: OfflineEmpresa): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_EMPRESAS_SYNC_KEY);
    const pendientes: OfflineEmpresa[] = pendientesString ? JSON.parse(pendientesString) : [];
    
    pendientes.push(empresa);
    await AsyncStorage.setItem(PENDING_EMPRESAS_SYNC_KEY, JSON.stringify(pendientes));
    
    console.log("📋 Empresa agregada a cola de sincronización");
  } catch (error) {
    console.error("❌ Error agregando empresa a pendientes:", error);
  }
};

const agregarVinculacionAPendientes = async (vinculacion: OfflineVinculacion): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_VINCULACIONES_SYNC_KEY);
    const pendientes: OfflineVinculacion[] = pendientesString ? JSON.parse(pendientesString) : [];
    
    pendientes.push(vinculacion);
    await AsyncStorage.setItem(PENDING_VINCULACIONES_SYNC_KEY, JSON.stringify(pendientes));
    
    console.log("📋 Vinculación agregada a cola de sincronización");
  } catch (error) {
    console.error("❌ Error agregando vinculación a pendientes:", error);
  }
};

const agregarDeptoAPendientes = async (depto: OfflineDepartamento): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_DEPTOS_SYNC_KEY);
    const pendientes: OfflineDepartamento[] = pendientesString ? JSON.parse(pendientesString) : [];
    
    pendientes.push(depto);
    await AsyncStorage.setItem(PENDING_DEPTOS_SYNC_KEY, JSON.stringify(pendientes));
    
    console.log("📋 Departamento agregado a cola de sincronización");
  } catch (error) {
    console.error("❌ Error agregando departamento a pendientes:", error);
  }
};

// ===================================
// SINCRONIZACIÓN CON FIREBASE
// ===================================

export const sincronizarEmpresasPendientes = async (): Promise<{
  exitosos: number;
  fallidos: number;
}> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_EMPRESAS_SYNC_KEY);
    if (!pendientesString) {
      console.log("ℹ️ No hay empresas pendientes de sincronizar");
      return { exitosos: 0, fallidos: 0 };
    }

    const pendientes: OfflineEmpresa[] = JSON.parse(pendientesString);
    const resultados = { exitosos: 0, fallidos: 0 };

    console.log(`🔄 Sincronizando ${pendientes.length} empresas pendientes...`);

    const mapeoIds: Record<string, string> = {};

    for (const empresa of pendientes) {
      try {
        const q = query(
          collection(db, "Empresas"),
          where("codigoAcceso", "==", empresa.codigoAcceso)
        );
        const snapshot = await getDocs(q);

        let empresaIdReal: string;

        if (!snapshot.empty) {
          empresaIdReal = snapshot.docs[0].id;
          console.log(`⚠️ Empresa ${empresa.nombre} ya existe en Firebase`);
        } else {
          const docRef = await addDoc(collection(db, "Empresas"), {
            nombre: empresa.nombre,
            codigoAcceso: empresa.codigoAcceso,
            fechaCreacion: serverTimestamp(),
            creadaPor: empresa.creadaPor,
            rolesDisponibles: empresa.rolesDisponibles,
          });

          empresaIdReal = docRef.id;
          console.log(`✅ Empresa creada en Firebase: ${empresa.nombre}`);
        }

        mapeoIds[empresa.id] = empresaIdReal;

        await marcarEmpresaComoSincronizada(empresa.id, empresaIdReal);

        resultados.exitosos++;
      } catch (error: any) {
        resultados.fallidos++;
        console.error(`❌ Error sincronizando empresa ${empresa.nombre}:`, error.message);
      }
    }

    // Sincronizar vinculaciones después de empresas
    await sincronizarVinculacionesPendientes(mapeoIds);

    // Sincronizar departamentos asociados
    await sincronizarDepartamentosPendientes(mapeoIds);

    await limpiarEmpresasSincronizadas();

    console.log(`📊 Sincronización de empresas completa: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`);
    return resultados;
  } catch (error) {
    console.error("❌ Error en sincronización de empresas:", error);
    return { exitosos: 0, fallidos: 0 };
  }
};

export const sincronizarVinculacionesPendientes = async (
  mapeoIds?: Record<string, string>
): Promise<{
  exitosos: number;
  fallidos: number;
}> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_VINCULACIONES_SYNC_KEY);
    if (!pendientesString) {
      console.log("ℹ️ No hay vinculaciones pendientes de sincronizar");
      return { exitosos: 0, fallidos: 0 };
    }

    const pendientes: OfflineVinculacion[] = JSON.parse(pendientesString);
    const resultados = { exitosos: 0, fallidos: 0 };

    console.log(`🔄 Sincronizando ${pendientes.length} vinculaciones pendientes...`);

    for (const vinculacion of pendientes) {
      try {
        let empresaIdReal = vinculacion.empresaId;
        
        if (mapeoIds && mapeoIds[vinculacion.empresaId]) {
          empresaIdReal = mapeoIds[vinculacion.empresaId];
        }

        if (empresaIdReal.startsWith("offline_")) {
          console.log(`⚠️ Empresa ${empresaIdReal} aún no sincronizada, saltando vinculación`);
          continue;
        }

        await setDoc(doc(db, "Usuarios", vinculacion.uid), {
          uid: vinculacion.uid,
          nombre: vinculacion.nombre,
          correo: vinculacion.correo,
          rol: vinculacion.rol,
          empresaId: empresaIdReal,
          fechaIngreso: vinculacion.fechaCreacion,
        }, { merge: true });

        console.log(`✅ Vinculación sincronizada: ${vinculacion.uid} -> ${empresaIdReal}`);

        await marcarVinculacionComoSincronizada(vinculacion.id, empresaIdReal);

        resultados.exitosos++;
      } catch (error: any) {
        resultados.fallidos++;
        console.error(`❌ Error sincronizando vinculación:`, error.message);
      }
    }

    await limpiarVinculacionesSincronizadas();

    console.log(`📊 Sincronización de vinculaciones completa: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`);
    return resultados;
  } catch (error) {
    console.error("❌ Error en sincronización de vinculaciones:", error);
    return { exitosos: 0, fallidos: 0 };
  }
};

export const sincronizarDepartamentosPendientes = async (
  mapeoIds?: Record<string, string>
): Promise<{
  exitosos: number;
  fallidos: number;
}> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_DEPTOS_SYNC_KEY);
    if (!pendientesString) {
      console.log("ℹ️ No hay departamentos pendientes de sincronizar");
      return { exitosos: 0, fallidos: 0 };
    }

    const pendientes: OfflineDepartamento[] = JSON.parse(pendientesString);
    const resultados = { exitosos: 0, fallidos: 0 };

    console.log(`🔄 Sincronizando ${pendientes.length} departamentos pendientes...`);

    for (const depto of pendientes) {
      try {
        let empresaIdReal = depto.empresaId;
        
        if (mapeoIds && mapeoIds[depto.empresaId]) {
          empresaIdReal = mapeoIds[depto.empresaId];
        } else {
          const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
          if (empresasString) {
            const empresas: OfflineEmpresa[] = JSON.parse(empresasString);
            const empresa = empresas.find((e) => e.id === depto.empresaId);
            if (empresa && !empresa.pendiente) {
              empresaIdReal = empresa.id;
            }
          }
        }

        if (empresaIdReal.startsWith("offline_")) {
          console.log(`⚠️ Empresa ${empresaIdReal} aún no sincronizada, saltando departamento ${depto.nombre}`);
          continue;
        }

        const departamentosRef = collection(db, "Empresas", empresaIdReal, "Departamentos");
        const docRef = await addDoc(departamentosRef, {
          nombre: depto.nombre,
          activo: depto.activo,
          fechaCreacion: serverTimestamp(),
        });

        console.log(`✅ Departamento creado en Firebase: ${depto.nombre}`);

        await marcarDeptoComoSincronizado(depto.id, docRef.id, empresaIdReal);

        resultados.exitosos++;
      } catch (error: any) {
        resultados.fallidos++;
        console.error(`❌ Error sincronizando departamento ${depto.nombre}:`, error.message);
      }
    }

    await limpiarDeptosSincronizados();

    console.log(`📊 Sincronización de departamentos completa: ${resultados.exitosos} exitosos, ${resultados.fallidos} fallidos`);
    return resultados;
  } catch (error) {
    console.error("❌ Error en sincronización de departamentos:", error);
    return { exitosos: 0, fallidos: 0 };
  }
};

// ===================================
// MARCAR COMO SINCRONIZADO
// ===================================

const marcarEmpresaComoSincronizada = async (
  idOffline: string,
  idFirebase: string
): Promise<void> => {
  try {
    const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
    if (empresasString) {
      const empresas: OfflineEmpresa[] = JSON.parse(empresasString);
      const index = empresas.findIndex((e) => e.id === idOffline);
      
      if (index !== -1) {
        empresas[index].pendiente = false;
        empresas[index].id = idFirebase;
        await AsyncStorage.setItem(OFFLINE_EMPRESAS_KEY, JSON.stringify(empresas));
      }
    }

    await removerEmpresaDePendientes(idOffline);
  } catch (error) {
    console.error("❌ Error marcando empresa como sincronizada:", error);
  }
};

const marcarVinculacionComoSincronizada = async (
  idOffline: string,
  empresaIdReal: string
): Promise<void> => {
  try {
    const vinculacionesString = await AsyncStorage.getItem(OFFLINE_VINCULACIONES_KEY);
    if (vinculacionesString) {
      const vinculaciones: OfflineVinculacion[] = JSON.parse(vinculacionesString);
      const index = vinculaciones.findIndex((v) => v.id === idOffline);
      
      if (index !== -1) {
        vinculaciones[index].pendiente = false;
        vinculaciones[index].empresaId = empresaIdReal;
        await AsyncStorage.setItem(OFFLINE_VINCULACIONES_KEY, JSON.stringify(vinculaciones));
      }
    }

    await removerVinculacionDePendientes(idOffline);
  } catch (error) {
    console.error("❌ Error marcando vinculación como sincronizada:", error);
  }
};

const marcarDeptoComoSincronizado = async (
  idOffline: string,
  idFirebase: string,
  empresaIdReal: string
): Promise<void> => {
  try {
    const deptosString = await AsyncStorage.getItem(OFFLINE_DEPARTAMENTOS_KEY);
    if (deptosString) {
      const deptos: OfflineDepartamento[] = JSON.parse(deptosString);
      const index = deptos.findIndex((d) => d.id === idOffline);
      
      if (index !== -1) {
        deptos[index].pendiente = false;
        deptos[index].id = idFirebase;
        deptos[index].empresaId = empresaIdReal;
        await AsyncStorage.setItem(OFFLINE_DEPARTAMENTOS_KEY, JSON.stringify(deptos));
      }
    }

    await removerDeptoDePendientes(idOffline);
  } catch (error) {
    console.error("❌ Error marcando departamento como sincronizado:", error);
  }
};

// ===================================
// REMOVER DE PENDIENTES
// ===================================

const removerEmpresaDePendientes = async (id: string): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_EMPRESAS_SYNC_KEY);
    if (pendientesString) {
      const pendientes: OfflineEmpresa[] = JSON.parse(pendientesString);
      const actualizados = pendientes.filter((e) => e.id !== id);
      await AsyncStorage.setItem(PENDING_EMPRESAS_SYNC_KEY, JSON.stringify(actualizados));
    }
  } catch (error) {
    console.error("❌ Error removiendo empresa de pendientes:", error);
  }
};

const removerVinculacionDePendientes = async (id: string): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_VINCULACIONES_SYNC_KEY);
    if (pendientesString) {
      const pendientes: OfflineVinculacion[] = JSON.parse(pendientesString);
      const actualizados = pendientes.filter((v) => v.id !== id);
      await AsyncStorage.setItem(PENDING_VINCULACIONES_SYNC_KEY, JSON.stringify(actualizados));
    }
  } catch (error) {
    console.error("❌ Error removiendo vinculación de pendientes:", error);
  }
};

const removerDeptoDePendientes = async (id: string): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_DEPTOS_SYNC_KEY);
    if (pendientesString) {
      const pendientes: OfflineDepartamento[] = JSON.parse(pendientesString);
      const actualizados = pendientes.filter((d) => d.id !== id);
      await AsyncStorage.setItem(PENDING_DEPTOS_SYNC_KEY, JSON.stringify(actualizados));
    }
  } catch (error) {
    console.error("❌ Error removiendo departamento de pendientes:", error);
  }
};

// ===================================
// LIMPIAR SINCRONIZADOS
// ===================================

const limpiarEmpresasSincronizadas = async (): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_EMPRESAS_SYNC_KEY);
    if (!pendientesString) return;

    const pendientes: OfflineEmpresa[] = JSON.parse(pendientesString);
    const empresasString = await AsyncStorage.getItem(OFFLINE_EMPRESAS_KEY);
    
    if (empresasString) {
      const empresas: OfflineEmpresa[] = JSON.parse(empresasString);
      const seguenPendientes = pendientes.filter((p) =>
        empresas.some((e) => e.id === p.id && e.pendiente)
      );
      
      await AsyncStorage.setItem(PENDING_EMPRESAS_SYNC_KEY, JSON.stringify(seguenPendientes));
    }
  } catch (error) {
    console.error("❌ Error limpiando empresas sincronizadas:", error);
  }
};

const limpiarVinculacionesSincronizadas = async (): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_VINCULACIONES_SYNC_KEY);
    if (!pendientesString) return;

    const pendientes: OfflineVinculacion[] = JSON.parse(pendientesString);
    const vinculacionesString = await AsyncStorage.getItem(OFFLINE_VINCULACIONES_KEY);
    
    if (vinculacionesString) {
      const vinculaciones: OfflineVinculacion[] = JSON.parse(vinculacionesString);
      const seguenPendientes = pendientes.filter((p) =>
        vinculaciones.some((v) => v.id === p.id && v.pendiente)
      );
      
      await AsyncStorage.setItem(PENDING_VINCULACIONES_SYNC_KEY, JSON.stringify(seguenPendientes));
    }
  } catch (error) {
    console.error("❌ Error limpiando vinculaciones sincronizadas:", error);
  }
};

const limpiarDeptosSincronizados = async (): Promise<void> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_DEPTOS_SYNC_KEY);
    if (!pendientesString) return;

    const pendientes: OfflineDepartamento[] = JSON.parse(pendientesString);
    const deptosString = await AsyncStorage.getItem(OFFLINE_DEPARTAMENTOS_KEY);
    
    if (deptosString) {
      const deptos: OfflineDepartamento[] = JSON.parse(deptosString);
      const seguenPendientes = pendientes.filter((p) =>
        deptos.some((d) => d.id === p.id && d.pendiente)
      );
      
      await AsyncStorage.setItem(PENDING_DEPTOS_SYNC_KEY, JSON.stringify(seguenPendientes));
    }
  } catch (error) {
    console.error("❌ Error limpiando departamentos sincronizados:", error);
  }
};

// ===================================
// UTILIDADES
// ===================================

export const obtenerCantidadEmpresasPendientes = async (): Promise<number> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_EMPRESAS_SYNC_KEY);
    if (!pendientesString) return 0;
    
    const pendientes: OfflineEmpresa[] = JSON.parse(pendientesString);
    return pendientes.length;
  } catch {
    return 0;
  }
};

export const obtenerCantidadDeptosPendientes = async (): Promise<number> => {
  try {
    const pendientesString = await AsyncStorage.getItem(PENDING_DEPTOS_SYNC_KEY);
    if (!pendientesString) return 0;
    
    const pendientes: OfflineDepartamento[] = JSON.parse(pendientesString);
    return pendientes.length;
  } catch  {
    return 0;
  }
};

export const hayEmpresasODeptosPendientes = async (): Promise<boolean> => {
  const empresas = await obtenerCantidadEmpresasPendientes();
  const deptos = await obtenerCantidadDeptosPendientes();
  return empresas > 0 || deptos > 0;
};