import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../api/firebaseConfig";
import { COLORS, FONT_SIZES } from "../../types/index";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useUser } from "../../context/UserContext";
import { doc, setDoc } from "firebase/firestore";

type RegisterScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Register"
>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { setUser } = useUser();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterUser = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const uid = userCredential.user.uid;

      await setDoc(doc(db, "Usuarios", uid), {
        uid,
        nombre,
        correo: email,
        rol: "Empleado",
        empresaId: "",
        activo: true,
        fechaIngreso: new Date().toISOString(),
      });

      setUser({
        uid,
        nombre,
        correo: email,
        rol: "",
      });

      Alert.alert("Éxito", "Usuario registrado correctamente.");
      navigation.replace("Empresa");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Regístrate en WorkStation</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor={COLORS.textSecondary}
          value={nombre}
          onChangeText={setNombre}
        />

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor={COLORS.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.loginButton, { opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleRegisterUser}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? "Creando cuenta..." : "Registrarse"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>¿Ya tienes una cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: FONT_SIZES.large,
    color: COLORS.textSecondary,
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    width: "100%",
    maxWidth: 300,
    backgroundColor: COLORS.surface,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  link: {
    marginTop: 20,
    color: COLORS.primary,
    fontSize: FONT_SIZES.medium,
  },
});

export default RegisterScreen;
