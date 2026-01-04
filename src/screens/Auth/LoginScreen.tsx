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
  ActivityIndicator,
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
import { MaterialIcons } from "@expo/vector-icons";

// 🔥 Imports para offline
import { useOffline } from "../../Hooks/useOffline";
import { useOfflineAuth } from "../../Hooks/useOfflineAuth";
import { loginOffline } from "../../api/offlineAuthService";

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

  // 🔥 Hooks offline
  const { isOnline } = useOffline();
  const { isSyncingUsers, usersPending } = useOfflineAuth();

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      if (isOnline) {
        // ============ LOGIN ONLINE (Firebase) ============
        console.log("Iniciando login online...");
        
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
      } else {
        // ============ LOGIN OFFLINE ============
        console.log("📴 Iniciando login offline...");
        
        const offlineUser = await loginOffline(
          formData.email.trim(),
          formData.password
        );

        if (!offlineUser) {
          Alert.alert(
            "Sin conexión",
            "No se encontraron credenciales guardadas localmente.\n\nConecta a internet para iniciar sesión por primera vez."
          );
          return;
        }

        // Guardar en contexto con datos offline
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
      console.error("❌ Error en login:", err);
      
      let mensaje = "Error al iniciar sesión";
      if (err.code === "auth/user-not-found") {
        mensaje = "Usuario no encontrado";
      } else if (err.code === "auth/wrong-password") {
        mensaje = "Contraseña incorrecta";
      } else if (err.code === "auth/invalid-email") {
        mensaje = "Email inválido";
      } else if (err.code === "auth/too-many-requests") {
        mensaje = "Demasiados intentos. Intenta más tarde.";
      } else if (err.message) {
        mensaje = err.message;
      }
      
      Alert.alert("Error", mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!formData.email) {
      Alert.alert("Error", "Ingresa tu correo");
      return;
    }

    if (!isOnline) {
      Alert.alert(
        "Sin conexión",
        "Necesitas conexión a internet para recuperar tu contraseña."
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, formData.email);
      Alert.alert("Listo", "Revisa tu correo para restablecer tu contraseña");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ============ BANNER OFFLINE ============ */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <MaterialIcons name="cloud-off" size={20} color="#fff" />
          <Text style={styles.bannerText}>
            Sin conexión - Funcionalidad limitada
          </Text>
        </View>
      )}

      {/* ============ BANNER SINCRONIZACIÓN ============ */}
      {isSyncingUsers && usersPending > 0 && (
        <View style={styles.syncBanner}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.bannerText}>
            Sincronizando {usersPending} cuenta(s) pendiente(s)...
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <Image source={loginImage} style={styles.image} />

        <Text style={styles.title}>WorkStation</Text>

        {/* Indicador de modo offline */}
        {!isOnline && (
          <View style={styles.offlineWarning}>
            <MaterialIcons name="info" size={16} color={COLORS.warning} />
            <Text style={styles.offlineWarningText}>
              Modo Offline activado
            </Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Correo"
          value={formData.email}
          onChangeText={(t) => setFormData({ ...formData, email: t })}
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={formData.password}
          onChangeText={(t) => setFormData({ ...formData, password: t })}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.buttonLoading}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.buttonText}>Entrando...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={[styles.link, loading && styles.linkDisabled]}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate("Register")}
          disabled={loading}
        >
          <Text style={[styles.link, loading && styles.linkDisabled]}>
            ¿No tienes cuenta? Crea una
          </Text>
        </TouchableOpacity>

        {/* Información adicional en modo offline */}
        {!isOnline && (
          <View style={styles.offlineInfo}>
            <Text style={styles.offlineInfoText}>
              💡 Solo puedes iniciar sesión con cuentas previamente guardadas
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
    padding: 20,
  },
  image: { 
    width: 120, 
    height: 120, 
    marginBottom: 20 
  },
  title: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "bold",
    marginBottom: 20,
    color: COLORS.text,
  },
  input: {
    width: "100%",
    maxWidth: 280,
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
  },
  button: {
    width: "100%",
    maxWidth: 280,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: FONT_SIZES.medium,
  },
  link: { 
    marginTop: 20, 
    color: COLORS.primary,
    fontSize: FONT_SIZES.medium,
  },
  linkDisabled: {
    opacity: 0.5,
  },

  // Estilos para banners
  offlineBanner: {
    backgroundColor: "#666",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  syncBanner: {
    backgroundColor: COLORS.primary,
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
    paddingVertical: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    maxWidth: 280,
  },
  offlineInfoText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text,
    textAlign: "center",
    lineHeight: 18,
  },
});

export default LoginScreen;