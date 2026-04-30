// import { db } from "./firebaseConfig";
// import {
//   collection,
//   addDoc,
//   getDocs,
//   query,
//   where,
//   serverTimestamp,
//   doc,
//   setDoc,
//   getDoc,
// } from "firebase/firestore";

// /**
//  * Interfaz para Usuario de Empresa
//  */
// export interface UsuarioEmpresa {
//   id: string;
//   uid: string;
//   nombre: string;
//   correo: string;
//   rol: "Administrador" | "Jefe" | "Empleado";
//   empresaId: string;
//   activo?: boolean;
//   fechaIngreso?: string;
// }

// /**
//  * Interfaz para definir el tipo Empresa
//  */
// export interface Empresa {
//   id: string;
//   nombre: string;
//   codigoAcceso: string;
//   fechaCreacion?: any;
//   creadaPor: string;
//   rolesDisponibles: string[];
// }

// /**
//  * Crear una nueva empresa
//  */
// export async function crearEmpresa(
//   nombre: string,
//   codigo: string,
//   uidAdmin: string,
//   nombreAdmin: string,
//   correoAdmin: string
// ): Promise<string> {
//   try {
//     const docRef = await addDoc(collection(db, "Empresas"), {
//       nombre,
//       codigoAcceso: codigo,
//       fechaCreacion: serverTimestamp(),
//       creadaPor: uidAdmin,
//       rolesDisponibles: ["Administrador", "Jefe", "Empleado"],
//     });
  
//     console.log(" Empresa creada con ID:", docRef.id);

//     await setDoc(doc(db, "Usuarios", uidAdmin),{
//       uid:uidAdmin,
//       nombre:nombreAdmin,
//       correo:correoAdmin,
//       rol:"Administrador",
//       empresaId: docRef.id,
//       fechaIngreso: new Date().toISOString(),
//     });

//     console.log(" Usuario Administrador vinculado a Empresa:", uidAdmin);

//     return docRef.id;
//   } catch (error) {
//     console.error(" Error al crear empresa:", error);
//     throw error;  
//   }
// }

// /**
//  * Buscar empresa por código de acceso
//  */
// export async function buscarEmpresaPorCodigo(
//   codigo: string
// ): Promise<Empresa | null> {
//   try {
//     const q = query(
//       collection(db, "Empresas"),
//       where("codigoAcceso", "==", codigo)
//     );
//     const snapshot = await getDocs(q);

//     if (snapshot.empty) {
//       console.log(" No existe empresa con ese código.");
//       return null;
//     }

//     const empresaDoc = snapshot.docs[0];
//     const data = empresaDoc.data() as Omit<Empresa, "id">;
//     return { id: empresaDoc.id, ...data };
//   } catch (error) {
//     console.error(" Error al buscar empresa:", error);
//     throw error;
//   }
// }

// /**
//  * Obtener empresas creadas o asociadas a un usuario
//  */
// export async function obtenerEmpresasPorUsuario(
//   uid: string
// ): Promise<Empresa[]> {
//   try {
//     const empresas: Empresa[] = [];

//     // 🔹 Empresas creadas por el usuario
//     const creadasQuery = query(
//       collection(db, "Empresas"),
//       where("creadaPor", "==", uid)
//     );
//     const creadasSnap = await getDocs(creadasQuery);
//     creadasSnap.forEach((d) => {
//       const data = d.data() as Omit<Empresa, "id">;
//       empresas.push({ id: d.id, ...data });
//     });

//     // 🔹 Empresa(s) a las que el usuario está vinculado
//     const usuarioRef = doc(db, "Usuarios", uid);
//     const usuarioSnap = await getDoc(usuarioRef);

//     if (usuarioSnap.exists()) {
//       const usuarioData = usuarioSnap.data() as { empresaId?: string };

//       if (usuarioData.empresaId) {
//         const empresaRef = doc(db, "Empresas", usuarioData.empresaId);
//         const empresaSnap = await getDoc(empresaRef);

//         if (empresaSnap.exists()) {
//           const empresaData = empresaSnap.data() as Omit<Empresa, "id">;

//           // Evita duplicar si ya está incluida
//           if (!empresas.some((e) => e.id === empresaSnap.id)) {
//             empresas.push({ id: empresaSnap.id, ...empresaData });
//           }
//         }
//       }
//     }

//     console.log(" Empresas obtenidas para usuario:", empresas.length);
//     return empresas;
//   } catch (error) {
//     console.error(" Error al obtener empresas:", error);
//     throw error;
//   }
// }

// /**
//  * Vincular un usuario a una empresa
//  */
// export async function vincularUsuarioAEmpresa(
//   uid: string,
//   nombre: string,
//   correo: string,
//   empresaId: string,
//   rol: "Administrador" | "Jefe" | "Empleado"
// ): Promise<void> {
//   try {
//     await setDoc(doc(db, "Usuarios", uid), {
//       uid,
//       nombre,
//       correo,
//       rol,
//       empresaId,
//       fechaIngreso: new Date().toISOString(),
//     });

//     console.log(" Usuario vinculado a empresa:", empresaId);
//   } catch (error) {
//     console.error(" Error al vincular usuario:", error);
//     throw error;
//   }
// }
// // usuario por departamento
// export async function obtenerUsuariosPorDepartamento(
//   empresaId: string,
//   nombreDepartamento: string
// ) {
//   const q = query(
//     collection(db, "Usuarios"),
//     where("empresaId", "==", empresaId),
//     where("nombreDepartamento", "==", nombreDepartamento)
//   );

//   const snapshot = await getDocs(q);

//   return snapshot.docs.map((doc) => ({
//     uid: doc.id, 
//     ...doc.data(),
//   }));
// }

// // Roles y permisos dentro de la empresa

// export async function asignarPermisosPorRol(
//   empresaId: string,
//   rol: string,
//   permisos: Record<string, boolean>
// ): Promise<void> {
//   try {
//     const empresaRef = doc(db, "Empresas", empresaId);
//     await setDoc(
//       empresaRef,
//       { permisos: { [rol]: permisos } },
//       { merge: true }
//     );
//     console.log(` Permisos actualizados para el rol ${rol}`);
//   } catch (error) {
//     console.error(" Error al asignar permisos:", error);
//     throw error;
//   }
// }

// export async function obtenerPermisosDeEmpresa(
//   empresaId: string
// ): Promise<Record<string, any>> {
//   try {
//     const empresaRef = doc(db, "Empresas", empresaId);
//     const empresaSnap = await getDoc(empresaRef);

//     if (!empresaSnap.exists()) return {};
//     const data = empresaSnap.data() as { permisos?: Record<string, any> };
//     return data.permisos || {};
//   } catch (error) {
//     console.error(" Error al obtener permisos:", error);
//     throw error;
//   }
// }

// /**
//  * Obtener todos los usuarios de una empresa
//  * TIPADO CORRECTO - Devuelve UsuarioEmpresa[]
//  */
// export async function obtenerUsuariosDeEmpresa(
//   empresaId: string
// ): Promise<UsuarioEmpresa[]> {
//   try {
//     const q = query(
//       collection(db, "Usuarios"), 
//       where("empresaId", "==", empresaId)
//     );
//     const snapshot = await getDocs(q);
    
//     return snapshot.docs.map((doc) => ({
//       id: doc.id,
//       uid: doc.data().uid || doc.id,
//       nombre: doc.data().nombre || "",
//       correo: doc.data().correo || "",
//       rol: doc.data().rol || "Empleado",
//       empresaId: doc.data().empresaId || "",
//       activo: doc.data().activo,
//       fechaIngreso: doc.data().fechaIngreso,
//     })) as UsuarioEmpresa[];
//   } catch (error) {
//     console.error(" Error al obtener usuarios de empresa:", error);
//     throw error;
//   }
// }

// // Actualizar el rol de un usuario

// export async function actualizarRolUsuario(uid: string, nuevoRol: string): Promise<void> {
//   try {
//     const userRef = doc(db, "Usuarios", uid);
//     await setDoc(userRef, { rol: nuevoRol }, { merge: true });
//     console.log(` Rol actualizado para usuario ${uid}: ${nuevoRol}`);
//   } catch (error) {
//     console.error(" Error al actualizar rol:", error);
//     throw error;
//   }
// }

// // Eliminar un usuario de la empresa
 
// export async function eliminarUsuarioDeEmpresa(uid: string): Promise<void> {
//   try {
//     const userRef = doc(db, "Usuarios", uid);
//     await setDoc(userRef, { empresaId: "", rol: "Empleado" }, { merge: true });
//     console.log(` Usuario ${uid} desvinculado de la empresa`);
//   } catch (error) {
//     console.error(" Error al eliminar usuario:", error);
//     throw error;
//   }
// }
import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "firebase/firestore";

/**
 * Interfaz para Usuario de Empresa
 */
export interface UsuarioEmpresa {
  id: string;
  uid: string;
  nombre: string;
  correo: string;
  rol: "Administrador" | "Jefe" | "Empleado";
  empresaId: string;
  activo?: boolean;
  fechaIngreso?: string;

  // Departamento
  idDepartamento?: string | null;
  nombreDepartamento?: string | null;
}

/**
 * Interfaz para definir el tipo Empresa
 */
export interface Empresa {
  id: string;
  nombre: string;
  codigoAcceso: string;
  fechaCreacion?: any;
  creadaPor: string;
  rolesDisponibles: string[];
}

/**
 * Crear una nueva empresa
 */
export async function crearEmpresa(
  nombre: string,
  codigo: string,
  uidAdmin: string,
  nombreAdmin: string,
  correoAdmin: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "Empresas"), {
      nombre,
      codigoAcceso: codigo,
      fechaCreacion: serverTimestamp(),
      creadaPor: uidAdmin,
      rolesDisponibles: ["Administrador", "Jefe", "Empleado"],
    });

    console.log("Empresa creada con ID:", docRef.id);

    await setDoc(doc(db, "Usuarios", uidAdmin), {
      uid: uidAdmin,
      nombre: nombreAdmin,
      correo: correoAdmin,
      rol: "Administrador",
      empresaId: docRef.id,
      idDepartamento: null,
      nombreDepartamento: null,
      activo: true,
      fechaIngreso: new Date().toISOString(),
    });

    console.log("Usuario Administrador vinculado a Empresa:", uidAdmin);

    return docRef.id;
  } catch (error) {
    console.error("Error al crear empresa:", error);
    throw error;
  }
}

/**
 * Buscar empresa por código de acceso
 */
export async function buscarEmpresaPorCodigo(
  codigo: string
): Promise<Empresa | null> {
  try {
    const q = query(
      collection(db, "Empresas"),
      where("codigoAcceso", "==", codigo)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("No existe empresa con ese código.");
      return null;
    }

    const empresaDoc = snapshot.docs[0];
    const data = empresaDoc.data() as Omit<Empresa, "id">;

    return {
      id: empresaDoc.id,
      ...data,
    };
  } catch (error) {
    console.error("Error al buscar empresa:", error);
    throw error;
  }
}

/**
 * Obtener empresas creadas o asociadas a un usuario
 */
export async function obtenerEmpresasPorUsuario(
  uid: string
): Promise<Empresa[]> {
  try {
    const empresas: Empresa[] = [];

    const creadasQuery = query(
      collection(db, "Empresas"),
      where("creadaPor", "==", uid)
    );

    const creadasSnap = await getDocs(creadasQuery);

    creadasSnap.forEach((d) => {
      const data = d.data() as Omit<Empresa, "id">;
      empresas.push({
        id: d.id,
        ...data,
      });
    });

    const usuarioRef = doc(db, "Usuarios", uid);
    const usuarioSnap = await getDoc(usuarioRef);

    if (usuarioSnap.exists()) {
      const usuarioData = usuarioSnap.data() as { empresaId?: string };

      if (usuarioData.empresaId) {
        const empresaRef = doc(db, "Empresas", usuarioData.empresaId);
        const empresaSnap = await getDoc(empresaRef);

        if (empresaSnap.exists()) {
          const empresaData = empresaSnap.data() as Omit<Empresa, "id">;

          if (!empresas.some((e) => e.id === empresaSnap.id)) {
            empresas.push({
              id: empresaSnap.id,
              ...empresaData,
            });
          }
        }
      }
    }

    console.log("Empresas obtenidas para usuario:", empresas.length);
    return empresas;
  } catch (error) {
    console.error("Error al obtener empresas:", error);
    throw error;
  }
}

/**
 * Vincular un usuario a una empresa
 */
export async function vincularUsuarioAEmpresa(
  uid: string,
  nombre: string,
  correo: string,
  empresaId: string,
  rol: "Administrador" | "Jefe" | "Empleado"
): Promise<void> {
  try {
    await setDoc(
      doc(db, "Usuarios", uid),
      {
        uid,
        nombre,
        correo,
        rol,
        empresaId,
        idDepartamento: null,
        nombreDepartamento: null,
        activo: true,
        fechaIngreso: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("Usuario vinculado a empresa:", empresaId);
  } catch (error) {
    console.error("Error al vincular usuario:", error);
    throw error;
  }
}

/**
 * Obtener usuarios por departamento
 */
export async function obtenerUsuariosPorDepartamento(
  empresaId: string,
  nombreDepartamento: string
): Promise<UsuarioEmpresa[]> {
  try {
    const q = query(
      collection(db, "Usuarios"),
      where("empresaId", "==", empresaId),
      where("nombreDepartamento", "==", nombreDepartamento)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();

      return {
        id: d.id,
        uid: data.uid || d.id,
        nombre: data.nombre || "",
        correo: data.correo || "",
        rol: data.rol || "Empleado",
        empresaId: data.empresaId || "",
        activo: data.activo ?? true,
        fechaIngreso: data.fechaIngreso,
        idDepartamento: data.idDepartamento || null,
        nombreDepartamento: data.nombreDepartamento || null,
      } as UsuarioEmpresa;
    });
  } catch (error) {
    console.error("Error al obtener usuarios por departamento:", error);
    throw error;
  }
}

/**
 * Roles y permisos dentro de la empresa
 */
export async function asignarPermisosPorRol(
  empresaId: string,
  rol: string,
  permisos: Record<string, boolean>
): Promise<void> {
  try {
    const empresaRef = doc(db, "Empresas", empresaId);

    await setDoc(
      empresaRef,
      {
        permisos: {
          [rol]: permisos,
        },
      },
      { merge: true }
    );

    console.log(`Permisos actualizados para el rol ${rol}`);
  } catch (error) {
    console.error("Error al asignar permisos:", error);
    throw error;
  }
}

export async function obtenerPermisosDeEmpresa(
  empresaId: string
): Promise<Record<string, any>> {
  try {
    const empresaRef = doc(db, "Empresas", empresaId);
    const empresaSnap = await getDoc(empresaRef);

    if (!empresaSnap.exists()) return {};

    const data = empresaSnap.data() as { permisos?: Record<string, any> };

    return data.permisos || {};
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    throw error;
  }
}

/**
 * Obtener todos los usuarios de una empresa
 */
export async function obtenerUsuariosDeEmpresa(
  empresaId: string
): Promise<UsuarioEmpresa[]> {
  try {
    const q = query(
      collection(db, "Usuarios"),
      where("empresaId", "==", empresaId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();

      return {
        id: d.id,
        uid: data.uid || d.id,
        nombre: data.nombre || "",
        correo: data.correo || "",
        rol: data.rol || "Empleado",
        empresaId: data.empresaId || "",
        activo: data.activo ?? true,
        fechaIngreso: data.fechaIngreso,

        // IMPORTANTE PARA QUE SE REFLEJE EN GESTIÓN DE USUARIOS
        idDepartamento: data.idDepartamento || null,
        nombreDepartamento: data.nombreDepartamento || null,
      } as UsuarioEmpresa;
    });
  } catch (error) {
    console.error("Error al obtener usuarios de empresa:", error);
    throw error;
  }
}

/**
 * Actualizar el rol de un usuario
 */
export async function actualizarRolUsuario(
  uid: string,
  nuevoRol: "Administrador" | "Jefe" | "Empleado" | string
): Promise<void> {
  try {
    const userRef = doc(db, "Usuarios", uid);

    await setDoc(
      userRef,
      {
        rol: nuevoRol,
      },
      { merge: true }
    );

    console.log(`Rol actualizado para usuario ${uid}: ${nuevoRol}`);
  } catch (error) {
    console.error("Error al actualizar rol:", error);
    throw error;
  }
}

/**
 * Eliminar/desvincular un usuario de la empresa
 */
export async function eliminarUsuarioDeEmpresa(uid: string): Promise<void> {
  try {
    const userRef = doc(db, "Usuarios", uid);

    await setDoc(
      userRef,
      {
        empresaId: "",
        empresaNombre: "",
        rol: "Empleado",
        idDepartamento: null,
        nombreDepartamento: null,
        activo: false,
      },
      { merge: true }
    );

    console.log(`Usuario ${uid} desvinculado de la empresa`);
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    throw error;
  }
}

export async function asignarDepartamentoUsuario(
  uid: string,
  idDepartamento: string,
  nombreDepartamento: string
): Promise<void> {
  const usuarioRef = doc(db, "Usuarios", uid);

  await updateDoc(usuarioRef, {
    idDepartamento,
    nombreDepartamento,
  });
}

export async function quitarDepartamentoUsuario(uid: string): Promise<void> {
  const usuarioRef = doc(db, "Usuarios", uid);

  await updateDoc(usuarioRef, {
    idDepartamento: null,
    nombreDepartamento: null,
  });
}