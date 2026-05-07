import { useCallback, useEffect, useState } from "react";
import {
  obtenerEventosPersonales,
  crearEventoPersonal,
  editarEventoPersonal,
  eliminarEventoPersonal,
  toggleCompletadoEventoPersonal,
} from "../../Services/agendaPersonal";

export function useAgendaPersonal(uid?: string) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargar = useCallback(async () => {
    if (!uid) return;

    setLoading(true);
    try {
      const data = await obtenerEventosPersonales(uid);
      setEventos(data);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const crear = async (data: any) => {
    if (!uid) return;
    await crearEventoPersonal(data, uid);
    await cargar();
  };

  const editar = async (id: string, data: any) => {
    if (!uid) return;
    await editarEventoPersonal(id, uid, data);
    await cargar();
  };

  const eliminar = async (id: string) => {
    if (!uid) return;
    await eliminarEventoPersonal(id, uid);
    await cargar();
  };

  const toggle = async (id: string, completado: boolean) => {
    if (!uid) return;
    await toggleCompletadoEventoPersonal(id, uid, completado);
    await cargar();
  };

  return {
    eventos,
    loading,
    refetch: cargar,
    crear,
    editar,
    eliminar,
    toggle,
  };
}