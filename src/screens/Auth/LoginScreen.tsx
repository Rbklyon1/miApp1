import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { LoginFormData, COLORS, FONT_SIZES } from "../../types";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../../api/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useUser } from "../../context/UserContext";

const loginImage = require("../../../assets/LogIn.png");

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { setUser } = useUser();
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      const uid = cred.user.uid;
      const snap = await getDoc(doc(db, "Usuarios", uid));

      if (!snap.exists()) {
        Alert.alert("Error", "Usuario no encontrado en Firestore");
        return;
      }

      const data = snap.data();

      // 🔥 AQUÍ SE ARREGLA TODO
      setUser({
        uid,
        nombre: data.nombre ?? "",
        correo: data.correo ?? "",
        rol: data.rol ?? "Empleado",
        empresaId: data.empresaId ?? null,
        empresaSeleccionada: data.empresaId ?? null,
        empresaNombre: data.empresaNombre ?? "",
        idDepartamento: data.idDepartamento ?? null,
        nombreDepartamento: data.nombreDepartamento ?? null,
      });

      navigation.replace("Empresa");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!formData.email) {
      Alert.alert("Error", "Ingresa tu correo");
      return;
    }

    await sendPasswordResetEmail(auth, formData.email);
    Alert.alert("Listo", "Revisa tu correo");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Image source={loginImage} style={styles.image} />

        <Text style={styles.title}>WorkStation</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo"
          value={formData.email}
          onChangeText={(t) => setFormData({ ...formData, email: t })}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={formData.password}
          onChangeText={(t) => setFormData({ ...formData, password: t })}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=> navigation.navigate ("Register")}>
          <Text style={styles.link}>¿no tienes cuenta? Crea una</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: 120, height: 120, marginBottom: 20 },
  title: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: 280,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  button: {
    width: 280,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  link: { marginTop: 20, color: COLORS.primary },
});

export default LoginScreen;
