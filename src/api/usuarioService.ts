import { db } from "./firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";

/**
 * Obtener usuario por UID
 */
export const obtenerUsuarioPorUid = async (uid: string) => {
  const ref = doc(db, "Usuarios", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;
  return snap.data();
};
/**
 * Actualizar datos de usuario
 */
export const actualizarUsuario = async (
  uid: string,
  cambios: Record<string, any>
) => {
  await updateDoc(doc(db, "Usuarios", uid), cambios);
};

/**
 * Eliminar usuario completamente
 */
export const eliminarUsuario = async (uid: string) => {
  await deleteDoc(doc(db, "Usuarios", uid));
};

/**
 * Obtener lista completa de usuarios
 */
export const obtenerTodosLosUsuarios = async () => {
  const snap = await getDocs(collection(db, "Usuarios"));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const asignarDepartamentoAUsuario = async (
  uid: string,
  idDepartamento: string,
  nombreDepartamento: string
) => {
  await updateDoc(doc(db, "Usuarios", uid), {
    idDepartamento,
    nombreDepartamento,
  });
};

