import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { loginOffline } from "./offlineAuthService";

export type LoginUserFirestore = {
  uid: string;
  nombre?: string;
  correo?: string;
  rol?: string;
  empresaId?: string | null;
  empresaNombre?: string;
  idDepartamento?: string | null;
  nombreDepartamento?: string | null;
};

export async function loginOnline(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const uid = cred.user.uid;

  const snap = await getDoc(doc(db, "Usuarios", uid));
  if (!snap.exists()) {
    const err: any = new Error("Usuario no encontrado en Firestore");
    err.code = "firestore/user-not-found";
    throw err;
  }

  const data = snap.data() as any;

  const user: LoginUserFirestore = {
    uid,
    nombre: data.nombre ?? "",
    correo: data.correo ?? "",
    rol: data.rol ?? "Empleado",
    empresaId: data.empresaId ?? null,
    empresaNombre: data.empresaNombre ?? "",
    idDepartamento: data.idDepartamento ?? null,
    nombreDepartamento: data.nombreDepartamento ?? null,
  };

  return user;
}

export async function loginOfflineService(email: string, password: string) {
  return loginOffline(email.trim(), password);
}

export async function resetPasswordOnline(email: string) {
  return sendPasswordResetEmail(auth, email);
}