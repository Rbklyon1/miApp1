import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { guardarUsuarioOffline } from "./sqlite/offlineAuthService";

export async function registerOnline(params: {
  nombre: string;
  email: string;
  password: string;
}) {
  const { nombre, email, password } = params;

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  const uid = userCredential.user.uid;

  await setDoc(doc(db, "Usuarios", uid), {
    uid,
    nombre: nombre.trim(),
    correo: email.toLowerCase().trim(),
    rol: "Empleado",
    empresaId: "",
    activo: true,
    fechaIngreso: new Date().toISOString(),
  });

  return {
    uid,
    nombre: nombre.trim(),
    correo: email.toLowerCase().trim(),
    rol: "Empleado",
  };
}

export async function registerOffline(params: {
  nombre: string;
  email: string;
  password: string;
}) {
  const { nombre, email, password } = params;

  const offlineUser = await guardarUsuarioOffline(
    email.trim(),
    password,
    nombre.trim(),
  );

  return {
    uid: offlineUser.uid,
    nombre: offlineUser.nombre,
    correo: offlineUser.email,
  };
}
