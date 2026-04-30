import { useState } from "react";
import { Alert } from "react-native";
import { registerOffline, registerOnline } from "../Services/registerService";

type Params = {
  isOnline: boolean;
  setUser: (u: any) => void;
  navigation: any;
};

export function useRegister({ isOnline, setUser, navigation }: Params) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const mapRegisterError = (error: any) => {
    if (error?.code === "auth/email-already-in-use") return "Este correo ya está registrado";
    if (error?.code === "auth/invalid-email") return "Email inválido";
    if (error?.code === "auth/weak-password") return "La contraseña es muy débil (mínimo 6 caracteres)";
    return error?.message || "Error al crear cuenta";
  };

  const validate = () => {
    if (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Completa todos los campos.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    return true;
  };

  const register = async () => {
    if (!validate()) return;

    setIsLoading(true);

    try {
      if (isOnline) {
        const u = await registerOnline({ nombre, email, password });

        setUser({
          uid: u.uid,
          nombre: u.nombre,
          correo: u.correo,
          rol: u.rol,
        });

        Alert.alert("Éxito", "Cuenta creada correctamente.", [
          { text: "OK", onPress: () => navigation.replace("Empresa") },
        ]);
      } else {
        const offlineUser = await registerOffline({ nombre, email, password });

        setUser({
          uid: offlineUser.uid,
          nombre: offlineUser.nombre,
          correo: offlineUser.correo,
          rol: undefined,
        });

        Alert.alert(
          " Cuenta creada (Offline)",
          `Hola ${offlineUser.nombre}!\n\nTu cuenta se ha guardado localmente y se sincronizará automáticamente con Firebase cuando tengas conexión a internet.\n\nPor ahora podrás usar la app con funcionalidad limitada.`,
          [{ text: "Entendido", onPress: () => navigation.replace("Empresa") }]
        );
      }
    } catch (error: any) {
      Alert.alert("Error", mapRegisterError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    nombre,
    email,
    password,
    confirmPassword,
    isLoading,

    setNombre,
    setEmail,
    setPassword,
    setConfirmPassword,

    register,
  };
}