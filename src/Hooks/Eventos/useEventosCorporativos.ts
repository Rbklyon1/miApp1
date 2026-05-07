import { useCallback, useEffect, useState } from "react";
import {
  obtenerEventosAsignados,
  obtenerEventosCreadosPor,
  obtenerEventosDeEmpresa,
} from "../../Services/eventosService";

export function useEventosCorporativos(user: any) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState<
    "todos" | "asignados" | "creados"
  >("asignados");

  const empresaId = user?.empresaId;
  const uid = user?.uid;

  const cargarEventos = useCallback(async () => {
    if (!empresaId || !uid) return;

    setLoading(true);
    try {
      let data = [];

      switch (vistaActual) {
        case "todos":
          data = await obtenerEventosDeEmpresa(empresaId);
          break;
        case "asignados":
          data = await obtenerEventosAsignados(uid, empresaId);
          break;
        case "creados":
          data = await obtenerEventosCreadosPor(uid, empresaId);
          break;
      }

      setEventos(data);
    } finally {
      setLoading(false);
    }
  }, [empresaId, uid, vistaActual]);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  return {
    eventos,
    loading,
    vistaActual,
    setVistaActual,
    refetch: cargarEventos,
  };
}
