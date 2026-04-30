import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import {
  ActivityIndicator,
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
import { COLORS, FONT_SIZES } from "../../types/index";

import { useOffline } from "../../Hooks/useOffline";
import { useRegister } from "../../Hooks/useRegister";

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, "Register">;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { setUser } = useUser();
  const { isOnline } = useOffline();

  const {
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
  } = useRegister({ isOnline, setUser, navigation });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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

        {!isOnline && (
          <View style={styles.offlineWarning}>
            <MaterialIcons name="info" size={16} color={COLORS.warning} />
            <Text style={styles.offlineWarningText}>Creando cuenta offline</Text>
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
          onPress={register}
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

        <TouchableOpacity onPress={() => navigation.navigate("Login")} disabled={isLoading}>
          <Text style={[styles.link, isLoading && styles.linkDisabled]}>
            ¿Ya tienes una cuenta? Inicia sesión
          </Text>
        </TouchableOpacity>

        {!isOnline && (
          <View style={styles.offlineInfo}>
            <MaterialIcons name="cloud-queue" size={24} color={COLORS.primary} />
            <Text style={styles.offlineInfoTitle}>📱 Registro Offline</Text>
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
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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