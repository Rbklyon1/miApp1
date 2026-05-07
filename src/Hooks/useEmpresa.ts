import { useCallback, useEffect, useState } from "react";
import { obtenerEmpresasPorUsuario } from "../Services/empresaService";

interface Empresa {
  id: string;
  nombre: string;
  codigoAcceso: string;
}

export function useEmpresas(uid?: string) {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    if (!uid) {
      setEmpresas([]);
      return;
    }

    setLoading(true);
    try {
      const data = await obtenerEmpresasPorUsuario(uid);
      setEmpresas(data);
    } catch (error) {
      console.error("Error cargando empresas:", error);
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return {
    empresas,
    loading,
    refetch: cargar,
  };
}

