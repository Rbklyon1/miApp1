import { useEffect, useState } from "react";
import { Alert } from "react-native";
import {
  hayUsuariosPendientes,
  obtenerCantidadPendientes,
  sincronizarUsuariosPendientes,
} from "../Services/sqlite/offlineAuthService";
import { useOffline } from "./useOffline";

export const useOfflineAuth = () => {
  const { isOnline, isSyncing } = useOffline();
  const [usersPending, setUsersPending] = useState(0);
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);

  useEffect(() => {
    // Cargar cantidad de usuarios pendientes al iniciar
    cargarPendientes();

    // Sincronizar cuando hay conexión
    if (isOnline && !isSyncing) {
      sincronizarUsuarios();
    }
  }, [isOnline]);

  const cargarPendientes = async () => {
    const cantidad = await obtenerCantidadPendientes();
    setUsersPending(cantidad);
  };

  const sincronizarUsuarios = async () => {
    if (isSyncingUsers) return;

    try {
      const hayPendientes = await hayUsuariosPendientes();

      if (hayPendientes) {
        console.log("🔄 Iniciando sincronización de usuarios...");
        setIsSyncingUsers(true);

        const resultado = await sincronizarUsuariosPendientes();

        if (resultado.exitosos > 0) {
          Alert.alert(
            "✅ Usuarios sincronizados",
            `${resultado.exitosos} cuenta(s) creada(s) en Firebase.${
              resultado.fallidos > 0
                ? `\n${resultado.fallidos} no pudieron sincronizarse.`
                : ""
            }`,
          );
        }

        await cargarPendientes();
      }
    } catch (error) {
      console.error("❌ Error sincronizando usuarios:", error);
    } finally {
      setIsSyncingUsers(false);
    }
  };

  return {
    isOnline,
    usersPending,
    isSyncingUsers,
    sincronizarUsuarios,
  };
};
