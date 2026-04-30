import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { COLORS, FONT_SIZES } from "../../types";

import { useOffline } from "../../Hooks/useOffline";
import { useOfflineAuth } from "../../Hooks/useOfflineAuth";

import { useLogin } from "../../Hooks/useLogin";

const loginImage = require("../../../assets/LogIn.png");

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, "Login">;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { setUser } = useUser();

  const { isOnline } = useOffline();
  const { isSyncingUsers, usersPending } = useOfflineAuth();

  const { formData, setFormData, loading, login, reset } = useLogin({
    isOnline,
    setUser,
    navigation,
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <MaterialIcons name="cloud-off" size={20} color="#fff" />
          <Text style={styles.bannerText}>Sin conexión - Funcionalidad limitada</Text>
        </View>
      )}

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

        {!isOnline && (
          <View style={styles.offlineWarning}>
            <MaterialIcons name="info" size={16} color={COLORS.warning} />
            <Text style={styles.offlineWarningText}>Modo Offline activado</Text>
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
          onPress={login}
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

        <TouchableOpacity onPress={reset} disabled={loading}>
          <Text style={[styles.link, loading && styles.linkDisabled]}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Register")} disabled={loading}>
          <Text style={[styles.link, loading && styles.linkDisabled]}>¿No tienes cuenta? Crea una</Text>
        </TouchableOpacity>

        {!isOnline && (
          <View style={styles.offlineInfo}>
            <Text style={styles.offlineInfoText}>
              Solo puedes iniciar sesión con cuentas previamente guardadas
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  image: { width: 120, height: 120, marginBottom: 20 },
  title: { fontSize: FONT_SIZES.xlarge, fontWeight: "bold", marginBottom: 20, color: COLORS.text },
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
  buttonDisabled: { opacity: 0.6 },
  buttonLoading: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: FONT_SIZES.medium },
  link: { marginTop: 20, color: COLORS.primary, fontSize: FONT_SIZES.medium },
  linkDisabled: { opacity: 0.5 },

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
  bannerText: { color: "#fff", fontSize: FONT_SIZES.small, fontWeight: "600" },

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
  offlineWarningText: { fontSize: FONT_SIZES.small, color: "#E65100", fontWeight: "600" },

  offlineInfo: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    maxWidth: 280,
  },
  offlineInfoText: { fontSize: FONT_SIZES.small, color: COLORS.text, textAlign: "center", lineHeight: 18 },
});

export default LoginScreen;