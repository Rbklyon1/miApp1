const API_URL = "http://192.168.3.49:8000"; 

export type TareaRailway = {
  id?: number;
  titulo: string;
  descripcion?: string;
  estado?: string;
};


export const crearTareaRealRailway = async (data: {
  titulo: string;
  descripcion: string;
  prioridad: string;
  creadaPor: string;
  nombreCreador: string;
  empresaId: string;
  asignadoA: string[];
  nombresAsignados: string[];
}) => {
  const response = await fetch(`${API_URL}/tareas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      estado: "Pendiente",
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error("No se pudo crear la tarea en FastAPI");
  }

  console.log("✅ Tarea real enviada a FastAPI:", result);
  return result;
};

// 🔹 Obtener tareas
export const obtenerTareasRailway = async () => {
    const response = await fetch(`${API_URL}/tareas`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error("No se pudieron obtener las tareas desde fastAPI");
    }
    return data.tareas || [];

};

// 🔹 Health check (para evidencia 👀)
export const probarConexionRailway = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);

    const data = await response.json();

    console.log("🌐 API activa:", data);
    return true;
  } catch (error) {
    console.error("❌ API no responde:", error);
    return false;
  }
};