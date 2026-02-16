import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc 
} from "firebase/firestore";
import { db } from "./firebaseConfig";

export type Departamento = {
  id: string;
  nombre: string;
  activo?: boolean;
  fechaCreacion?: any;
};

/**
 * Cargar todos los departamentos de una empresa
 */
export const cargarDepartamentos = async (empresaId: string): Promise<Departamento[]> => {
  try {
    const departamentosRef = collection(db, "Empresas", empresaId, "Departamentos");
    const snapshot = await getDocs(departamentosRef);

    const departamentos = snapshot.docs.map((doc) => ({
      id: doc.id,
      nombre: doc.data().nombre || "",
      activo: doc.data().activo,
      fechaCreacion: doc.data().fechaCreacion,
    }));

    console.log(`✅ ${departamentos.length} departamentos cargados de la empresa ${empresaId}`);
    return departamentos;
  } catch (error) {
    console.error("❌ Error cargando departamentos:", error);
    throw error;
  }
};

/**
 * Obtener un departamento específico por ID
 */
export const obtenerDepartamentoPorId = async (
  empresaId: string, 
  departamentoId: string
): Promise<Departamento | null> => {
  try {
    const deptoRef = doc(db, "Empresas", empresaId, "Departamentos", departamentoId);
    const deptoSnap = await getDoc(deptoRef);

    if (!deptoSnap.exists()) {
      console.log("⚠️ Departamento no encontrado");
      return null;
    }

    return {
      id: deptoSnap.id,
      nombre: deptoSnap.data().nombre || "",
      activo: deptoSnap.data().activo,
      fechaCreacion: deptoSnap.data().fechaCreacion,
    };
  } catch (error) {
    console.error("❌ Error obteniendo departamento:", error);
    throw error;
  }
};

/**
 * Crear un nuevo departamento
 */
export const crearDepartamento = async (
  empresaId: string,
  nombre: string
): Promise<string> => {
  try {
    const departamentosRef = collection(db, "Empresas", empresaId, "Departamentos");
    
    const docRef = await addDoc(departamentosRef, {
      nombre: nombre.trim(),
      activo: true,
      fechaCreacion: serverTimestamp(),
    });

    console.log(`✅ Departamento creado con ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creando departamento:", error);
    throw error;
  }
};