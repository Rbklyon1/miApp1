import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  actualizarEstadoAsistencia,
  eliminarEvento,
  obtenerEventoPorId,
} from "../../Services/eventosService";
import { EstadoAsistencia, Evento } from "../../types/eventos";

export function useDetalleEvento(eventoId: string, user: any, navigation: any) {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarEvento = useCallback(async () => {
    try {
      setLoading(true);

      const data = await obtenerEventoPorId(eventoId);

      if (!data) {
        Alert.alert("Error", "Evento no encontrado");
        navigation.goBack();
        return;
      }

      setEvento(data);
    } catch {
      Alert.alert("Error", "No se pudo cargar el evento");
    } finally {
      setLoading(false);
    }
  }, [eventoId, navigation]);

  useEffect(() => {
    cargarEvento();
  }, [cargarEvento]);

  const cambiarAsistencia = useCallback(
    (nuevoEstado: EstadoAsistencia) => {
      Alert.alert(
        "Confirmar",
        `¿Deseas ${
          nuevoEstado === "Confirmado" ? "confirmar" : "rechazar"
        } tu asistencia?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: async () => {
              try {
                await actualizarEstadoAsistencia(
                  eventoId,
                  user?.uid!,
                  nuevoEstado
                );
                await cargarEvento();
                Alert.alert("Éxito", "Tu respuesta ha sido registrada");
              } catch {
                Alert.alert("Error", "No se pudo actualizar tu respuesta");
              }
            },
          },
        ]
      );
    },
    [eventoId, user?.uid, cargarEvento]
  );

  const eliminar = useCallback(() => {
    Alert.alert(
      "Eliminar evento",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await eliminarEvento(eventoId);
              Alert.alert("Éxito", "Evento eliminado", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert("Error", "No se pudo eliminar el evento");
            }
          },
        },
      ]
    );
  }, [eventoId, navigation]);

  const eventoPasado = useMemo(() => {
    if (!evento) return false;

    const hoy = new Date();
    const fechaEvento = new Date(evento.fechaInicio);

    hoy.setHours(0, 0, 0, 0);
    fechaEvento.setHours(0, 0, 0, 0);

    return fechaEvento < hoy;
  }, [evento]);

  const puedeEditar = useMemo(() => {
    if (!evento) return false;
    return user?.uid === evento.creadoPor || user?.rol === "Administrador";
  }, [evento, user?.uid, user?.rol]);

  const esAsistente = useMemo(() => {
    if (!evento) return false;
    return evento.asistentes.some((a) => a.uid === user?.uid);
  }, [evento, user?.uid]);

  const miEstado = useMemo(() => {
    if (!evento) return undefined;
    return evento.asistentes.find((a) => a.uid === user?.uid)?.estadoAsistencia;
  }, [evento, user?.uid]);

  return {
    evento,
    loading,
    cargarEvento,
    cambiarAsistencia,
    eliminar,
    eventoPasado,
    puedeEditar,
    esAsistente,
    miEstado,
  };
}