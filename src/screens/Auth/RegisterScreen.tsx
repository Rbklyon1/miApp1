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
  ActivityIndicator,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../api/firebaseConfig";
import { COLORS, FONT_SIZES } from "../../types/index";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { useUser } from "../../context/UserContext";
import { doc, setDoc } from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";

//  Imports para offline
import { useOffline } from "../../Hooks/useOffline";
import { guardarUsuarioOffline } from "../../api/offlineAuthService";

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

  // 🔥 Hook offline
  const { isOnline } = useOffline();

  const handleRegisterUser = async () => {
    // Validaciones
    if (!nombre.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      if (isOnline) {
        // ============ REGISTRO ONLINE (Firebase) ============
        console.log("🌐 Registrando usuario online...");

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        const uid = userCredential.user.uid;

        await setDoc(doc(db, "Usuarios", uid), {
          uid,
          nombre: nombre.trim(),
          correo: email.toLowerCase().trim(),
          rol: "Empleado",
          empresaId: "",
          activo: true,
          fechaIngreso: new Date().toISOString(),
        });

        setUser({
          uid,
          nombre: nombre.trim(),
          correo: email.toLowerCase().trim(),
          rol: "Empleado",
        });

        Alert.alert(
          "✅ Éxito", 
          "Cuenta creada correctamente.",
          [{ text: "OK", onPress: () => navigation.replace("Empresa") }]
        );

      } else {
        // ============ REGISTRO OFFLINE ============
        console.log("📴 Registrando usuario offline...");

        const offlineUser = await guardarUsuarioOffline(
          email.trim(),
          password,
          nombre.trim()
        );

        setUser({
          uid: offlineUser.uid,
          nombre: offlineUser.nombre,
          correo: offlineUser.email,
          rol: undefined,
        });

        Alert.alert(
          "✅ Cuenta creada (Offline)",
          `Hola ${offlineUser.nombre}!\n\nTu cuenta se ha guardado localmente y se sincronizará automáticamente con Firebase cuando tengas conexión a internet.\n\nPor ahora podrás usar la app con funcionalidad limitada.`,
          [
            { 
              text: "Entendido", 
              onPress: () => navigation.replace("Empresa") 
            }
          ]
        );
      }
    } catch (error: any) {
      console.error("❌ Error en registro:", error);
      
      let mensaje = "Error al crear cuenta";
      if (error.code === "auth/email-already-in-use") {
        mensaje = "Este correo ya está registrado";
      } else if (error.code === "auth/invalid-email") {
        mensaje = "Email inválido";
      } else if (error.code === "auth/weak-password") {
        mensaje = "La contraseña es muy débil (mínimo 6 caracteres)";
      } else if (error.message) {
        mensaje = error.message;
      }
      
      Alert.alert("Error", mensaje);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ============ BANNER OFFLINE ============ */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <MaterialIcons name="cloud-off" size={20} color="#fff" />
          <Text style={styles.bannerText}>
            Modo Offline - La cuenta se sincronizará después
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Regístrate en WorkStation</Text>

        {/* Indicador de modo offline */}
        {!isOnline && (
          <View style={styles.offlineWarning}>
            <MaterialIcons name="info" size={16} color={COLORS.warning} />
            <Text style={styles.offlineWarningText}>
              Creando cuenta offline
            </Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor={COLORS.textSecondary}
          value={nombre}
          onChangeText={setNombre}
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña (mínimo 6 caracteres)"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor={COLORS.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.buttonDisabled]}
          onPress={handleRegisterUser}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.buttonLoading}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.loginButtonText}>Creando cuenta...</Text>
            </View>
          ) : (
            <Text style={styles.loginButtonText}>Registrarse</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate("Login")}
          disabled={isLoading}
        >
          <Text style={[styles.link, isLoading && styles.linkDisabled]}>
            ¿Ya tienes una cuenta? Inicia sesión
          </Text>
        </TouchableOpacity>

        {/* Información adicional en modo offline */}
        {!isOnline && (
          <View style={styles.offlineInfo}>
            <MaterialIcons name="cloud-queue" size={24} color={COLORS.primary} />
            <Text style={styles.offlineInfoTitle}>
              📱 Registro Offline
            </Text>
            <Text style={styles.offlineInfoText}>
              Tu cuenta se guardará localmente y se sincronizará con Firebase automáticamente cuando recuperes la conexión a internet.
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  content: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  title: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 5,
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
    fontSize: FONT_SIZES.medium,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
    maxWidth: 300,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  linkDisabled: {
    opacity: 0.5,
  },

  // Estilos para banner
  offlineBanner: {
    backgroundColor: "#666",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  bannerText: {
    color: "#fff",
    fontSize: FONT_SIZES.small,
    fontWeight: "600",
  },

  // Advertencia inline
  offlineWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 15,
    width: "100%",
    maxWidth: 300,
  },
  offlineWarningText: {
    fontSize: FONT_SIZES.small,
    color: "#E65100",
    fontWeight: "600",
  },

  // Info adicional
  offlineInfo: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    maxWidth: 300,
    width: "100%",
    alignItems: "center",
  },
  offlineInfoTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 8,
  },
  offlineInfoText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 18,
  },
});

export default RegisterScreen;
