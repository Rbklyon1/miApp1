import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import * as Linking from "expo-linking";
import { detalleTareaService } from "../Services/detalleTareaService";
import { Adjunto, EstadoTarea, Tarea } from "../types/tareas";

type UserLike = {
  uid: string;
  nombre?: string;
  rol?: string;
};

export function useDetalleTarea(
  tareaId: string,
  user: UserLike | null | undefined,
  navigation: any
) {
  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [loading, setLoading] = useState(true);

  const [comentario, setComentario] = useState("");

  const [modalEnlaceVisible, setModalEnlaceVisible] = useState(false);
  const [enlaceNombre, setEnlaceNombre] = useState("");
  const [enlaceUrl, setEnlaceUrl] = useState("");
  const [guardandoEnlace, setGuardandoEnlace] = useState(false);

  const cargarTarea = useCallback(async () => {
    try {
      setLoading(true);

      const data = await detalleTareaService.obtenerTareaPorId(tareaId);

      if (!data) {
        Alert.alert("Error", "Tarea no encontrada");
        navigation.goBack();
        return;
      }

      setTarea(data);
    } catch {
      Alert.alert("Error", "No se pudo cargar la tarea");
    } finally {
      setLoading(false);
    }
  }, [tareaId, navigation]);

  useEffect(() => {
    cargarTarea();
  }, [cargarTarea]);

  const cambiarEstado = (nuevoEstado: EstadoTarea) => {
    Alert.alert("Cambiar estado", `¿Cambiar estado a "${nuevoEstado}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          try {
            await detalleTareaService.actualizarEstadoTarea(
              tareaId,
              nuevoEstado
            );
            await cargarTarea();
            Alert.alert("Éxito", "Estado actualizado");
          } catch {
            Alert.alert("Error", "No se pudo actualizar el estado");
          }
        },
      },
    ]);
  };

  const agregarComentarioTarea = async () => {
    if (!comentario.trim()) return;
    if (!user?.uid || !user?.nombre) return;

    try {
      await detalleTareaService.agregarComentario(tareaId, {
        texto: comentario.trim(),
        autorUid: user.uid,
        autorNombre: user.nombre,
      });

      setComentario("");
      await cargarTarea();
      Alert.alert("Éxito", "Comentario agregado");
    } catch {
      Alert.alert("Error", "No se pudo agregar el comentario");
    }
  };

  const abrirModalEnlace = () => {
    setEnlaceNombre("");
    setEnlaceUrl("");
    setModalEnlaceVisible(true);
  };

  const guardarEnlace = async () => {
    if (!enlaceNombre.trim()) {
      Alert.alert("Campo requerido", "Escribe un nombre para el enlace.");
      return;
    }

    if (!enlaceUrl.trim()) {
      Alert.alert("Campo requerido", "Pega la URL del archivo.");
      return;
    }

    if (!enlaceUrl.trim().startsWith("http")) {
      Alert.alert("URL inválida", "La URL debe comenzar con http:// o https://");
      return;
    }

    if (!user?.uid || !user?.nombre) return;

    setGuardandoEnlace(true);

    try {
      await detalleTareaService.agregarEnlaceAdjunto(
        tareaId,
        {
          nombre: enlaceNombre.trim(),
          url: enlaceUrl.trim(),
        },
        user.uid,
        user.nombre
      );

      setModalEnlaceVisible(false);
      await cargarTarea();
      Alert.alert("Éxito", "Enlace agregado correctamente");
    } catch {
      Alert.alert("Error", "No se pudo guardar el enlace");
    } finally {
      setGuardandoEnlace(false);
    }
  };

  const eliminarAdjuntoTarea = (adjunto: Adjunto) => {
    const puedeEliminar =
      adjunto.subidoPor === user?.uid || user?.rol === "Administrador";

    if (!puedeEliminar) {
      Alert.alert(
        "Sin permiso",
        "Solo quien agregó el enlace o un Administrador puede eliminarlo."
      );
      return;
    }

    Alert.alert("Eliminar enlace", `¿Eliminar "${adjunto.nombre}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await detalleTareaService.eliminarAdjunto(tareaId, adjunto.id);
            await cargarTarea();
          } catch {
            Alert.alert("Error", "No se pudo eliminar el enlace");
          }
        },
      },
    ]);
  };

  const abrirEnlace = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "No se pudo abrir el enlace")
    );
  };

  const eliminar = () => {
    Alert.alert(
      "Eliminar tarea",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await detalleTareaService.eliminarTarea(tareaId);
              Alert.alert("Éxito", "Tarea eliminada", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch {
              Alert.alert("Error", "No se pudo eliminar la tarea");
            }
          },
        },
      ]
    );
  };

  const puedeEditar =
    user?.uid === tarea?.creadaPor || user?.rol === "Administrador";

  const esAsignado = tarea?.asignadoA?.includes(user?.uid || "") ?? false;

  const estados: EstadoTarea[] = [
    "Pendiente",
    "En Progreso",
    "Completada",
    "Cancelada",
  ];

  return {
    tarea,
    loading,

    comentario,
    setComentario,

    modalEnlaceVisible,
    setModalEnlaceVisible,
    enlaceNombre,
    setEnlaceNombre,
    enlaceUrl,
    setEnlaceUrl,
    guardandoEnlace,

    puedeEditar,
    esAsignado,
    estados,

    cargarTarea,
    cambiarEstado,
    agregarComentarioTarea,
    abrirModalEnlace,
    guardarEnlace,
    eliminarAdjuntoTarea,
    abrirEnlace,
    eliminar,
  };
}