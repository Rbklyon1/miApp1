import { useCallback, useEffect, useState } from "react";
import {
  asignarPermisosPorRol,
  obtenerPermisosDeEmpresa,
} from "../Services/empresaService";

export type RolEmpresa = "Administrador" | "Jefe" | "Empleado";

export type PermisosEmpresa = Record<string, Record<string, boolean>>;

export function usePermisosEmpresa(empresaId?: string | null) {
  const [permisos, setPermisos] = useState<PermisosEmpresa>({});
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargarPermisos = useCallback(async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      const data = await obtenerPermisosDeEmpresa(empresaId);
      setPermisos(data as PermisosEmpresa);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarPermisos();
  }, [cargarPermisos]);

  const togglePermiso = (rol: RolEmpresa, permiso: string) => {
    setPermisos((prev) => ({
      ...prev,
      [rol]: {
        ...prev[rol],
        [permiso]: !prev[rol]?.[permiso],
      },
    }));
  };

  const guardarPermisos = async (rol: RolEmpresa) => {
    if (!empresaId) return;

    setGuardando(true);
    try {
      await asignarPermisosPorRol(empresaId, rol, permisos[rol] || {});
    } finally {
      setGuardando(false);
    }
  };

  return {
    permisos,
    loading,
    guardando,
    refetch: cargarPermisos,
    togglePermiso,
    guardarPermisos,
  };
}