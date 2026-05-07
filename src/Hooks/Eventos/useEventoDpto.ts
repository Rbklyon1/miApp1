import { useEffect, useMemo, useState, useCallback } from "react";
import { Alert } from "react-native";
import { eventosDeptoService } from "../../Services/eventoDptoService";
import { Evento, EstadoAsistencia } from "../../types/eventos";
import { Departamento } from "../../Services/departamentosService";

export function useEventosDepto(user: any) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState<"todos" | "asignados">("todos");

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [deptoSeleccionado, setDeptoSeleccionado] = useState<string | null>(null);
  const [modalDeptosVisible, setModalDeptosVisible] = useState(false);

  const esAdmin = user?.rol === "Administrador";
  const esJefe = user?.rol === "Jefe";
  const puedeCrear = esAdmin || esJefe;

  const departamentoActual = useMemo(
    () => (esAdmin ? deptoSeleccionado : user?.nombreDepartamento),
    [esAdmin, deptoSeleccionado, user?.nombreDepartamento]
  );

  // cargar departamentos
  useEffect(() => {
    if (esAdmin && user?.empresaId) {
      eventosDeptoService.cargarDepartamentos(user.empresaId)
        .then((deptos) => {
          setDepartamentos(deptos);
          if (deptos.length > 0 && !deptoSeleccionado) setDeptoSeleccionado(deptos[0].nombre);
        })
        .catch(() => Alert.alert("Error", "No se pudieron cargar los departamentos"));
    }
  }, [esAdmin, user?.empresaId, deptoSeleccionado]);

  const cargarEventos = useCallback(async () => {
    if (!user?.empresaId || !departamentoActual) return;

    setLoading(true);
    try {
      const data =
        vistaActual === "todos"
          ? await eventosDeptoService.obtenerEventosDepartamento(user.empresaId, departamentoActual)
          : await eventosDeptoService.obtenerEventosAsignadosDepartamento(
              user.uid,
              user.empresaId,
              departamentoActual
            );
      setEventos(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los eventos");
    } finally {
      setLoading(false);
    }
  }, [user?.empresaId, user?.uid, departamentoActual, vistaActual]);

  useEffect(() => {
    if (departamentoActual) cargarEventos();
  }, [departamentoActual, vistaActual, cargarEventos]);

  const cambiarDepartamento = (depto: Departamento) => {
    setDeptoSeleccionado(depto.nombre);
    setModalDeptosVisible(false);
  };

  const cambiarAsistencia = async (eventoId: string, estado: EstadoAsistencia) => {
    await eventosDeptoService.actualizarEstadoAsistencia(eventoId, user?.uid || "", estado);
    Alert.alert("Éxito", "Tu respuesta ha sido registrada");
    cargarEventos();
  };

  const eliminar = (eventoId: string) => {
    Alert.alert("Eliminar evento", "¿Seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await eventosDeptoService.eliminarEvento(eventoId);
          Alert.alert("Éxito", "Evento eliminado");
          cargarEventos();
        },
      },
    ]);
  };

  return {
    eventos,
    loading,
    vistaActual,
    setVistaActual,

    departamentos,
    deptoSeleccionado,
    modalDeptosVisible,
    setModalDeptosVisible,

    esAdmin,
    puedeCrear,
    departamentoActual,

    cargarEventos,
    cambiarDepartamento,
    cambiarAsistencia,
    eliminar,
  };
}
