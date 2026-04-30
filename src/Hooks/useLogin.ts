import { useState } from "react";
import { Alert } from "react-native";
import { LoginFormData } from "../types";
import { loginOfflineService, loginOnline, resetPasswordOnline } from "../Services/authService";

type Params = {
  isOnline: boolean;
  setUser: (u: any) => void;
  navigation: any;
};

export function useLogin({ isOnline, setUser, navigation }: Params) {
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const mapAuthError = (err: any) => {
    if (err?.code === "auth/user-not-found") return "Usuario no encontrado";
    if (err?.code === "auth/wrong-password") return "Contraseña incorrecta";
    if (err?.code === "auth/invalid-email") return "Email inválido";
    if (err?.code === "auth/too-many-requests") return "Demasiados intentos. Intenta más tarde.";
    if (err?.code === "firestore/user-not-found") return "Usuario no encontrado en Firestore";
    return err?.message || "Error al iniciar sesión";
  };

  const login = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      if (isOnline) {
        const u = await loginOnline(formData.email, formData.password);

        setUser({
          uid: u.uid,
          nombre: u.nombre ?? "",
          correo: u.correo ?? "",
          rol: u.rol ?? "Empleado",
          empresaId: u.empresaId ?? null,
          empresaSeleccionada: u.empresaId ?? null,
          empresaNombre: u.empresaNombre ?? "",
          idDepartamento: u.idDepartamento ?? null,
          nombreDepartamento: u.nombreDepartamento ?? null,
        });

        navigation.replace("Empresa");
      } else {
        const offlineUser = await loginOfflineService(formData.email, formData.password);

        if (!offlineUser) {
          Alert.alert(
            "Sin conexión",
            "No se encontraron credenciales guardadas localmente.\n\nConecta a internet para iniciar sesión por primera vez."
          );
          return;
        }

        setUser({
          uid: offlineUser.uid,
          nombre: offlineUser.nombre,
          correo: offlineUser.email,
          rol: undefined,
          empresaId: undefined,
          empresaSeleccionada: undefined,
        });

        Alert.alert(
          "Modo Offline",
          `Bienvenido ${offlineUser.nombre}.\n\nEstás en modo offline. Algunas funciones estarán limitadas hasta que te conectes.`,
          [{ text: "Entendido", onPress: () => navigation.replace("Empresa") }]
        );
      }
    } catch (err: any) {
      Alert.alert("Error", mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = async () => {
    if (!formData.email) {
      Alert.alert("Error", "Ingresa tu correo");
      return;
    }
    if (!isOnline) {
      Alert.alert("Sin conexión", "Necesitas conexión a internet para recuperar tu contraseña.");
      return;
    }

    try {
      await resetPasswordOnline(formData.email);
      Alert.alert("Listo", "Revisa tu correo para restablecer tu contraseña");
    } catch (err: any) {
      Alert.alert("Error", mapAuthError(err));
    }
  };

  return {
    formData,
    setFormData,
    loading,
    login,
    reset,
  };
}