import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";
import { crearAviso } from "../../api/avisosService";
import { COLORS, FONT_SIZES } from "../../types/index";
import { TipoMuro } from "../../types/avisos";

const CrearAvisoScreen: React.FC = ({ navigation }: any) => {
  const { user } = useUser();

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [tipoMuro, setTipoMuro] = useState<TipoMuro>("General");
  const [destacado, setDestacado] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const esAdmin = user?.rol === "Administrador";
  const esJefe = user?.rol === "Jefe";

  const handleCrearAviso = async () => {
    if (!titulo.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }

    if (!contenido.trim()) {
      Alert.alert("Error", "El contenido es obligatorio");
      return;
    }

    // Validación de permisos
    if (esJefe && tipoMuro === "General") {
      Alert.alert(
        "Permiso denegado",
        "Los Jefes solo pueden crear avisos en su departamento"
      );
      return;
    }

    if (esJefe && !user?.nombreDepartamento) {
      Alert.alert("Error", "No tienes un departamento asignado");
      return;
    }

    setIsLoading(true);
    try {
      await crearAviso(
        {
          titulo,
          contenido,
          tipoMuro,
          departamento: tipoMuro === "Departamento" ? user?.nombreDepartamento : undefined,
          destacado: esAdmin ? destacado : false, // Solo admins pueden destacar
        },
        user?.uid!,
        user?.nombre!,
        user?.rol!,
        user?.empresaSeleccionada!,
        user?.empresaNombre!
      );

      Alert.alert("Éxito", "Aviso publicado correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("Error:", error);
      Alert.alert("Error", "No se pudo publicar el aviso");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="announcement" size={40} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Nuevo Aviso</Text>
        <Text style={styles.headerSubtitle}>
          Publica información importante para tu equipo
        </Text>
      </View>

      {/* Título */}
      <Text style={styles.label}>Título *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Reunión importante el viernes"
        value={titulo}
        onChangeText={setTitulo}
        maxLength={100}
      />
      <Text style={styles.charCount}>{titulo.length}/100</Text>

      {/* Contenido */}
      <Text style={styles.label}>Contenido *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Escribe el contenido del aviso..."
        value={contenido}
        onChangeText={setContenido}
        multiline
        numberOfLines={8}
        maxLength={1000}
      />
      <Text style={styles.charCount}>{contenido.length}/1000</Text>

      {/* Tipo de muro */}
      <Text style={styles.sectionTitle}>¿Dónde publicar?</Text>

      {esAdmin && (
        <>
          <TouchableOpacity
            style={[
              styles.radioOption,
              tipoMuro === "General" && styles.radioOptionActive,
            ]}
            onPress={() => setTipoMuro("General")}
          >
            <View style={styles.radioLeft}>
              <MaterialIcons
                name={tipoMuro === "General" ? "radio-button-checked" : "radio-button-unchecked"}
                size={24}
                color={tipoMuro === "General" ? COLORS.primary : "#999"}
              />
              <View style={styles.radioTextContainer}>
                <Text style={styles.radioTitle}>Muro General</Text>
                <Text style={styles.radioSubtitle}>
                  Visible para toda la empresa
                </Text>
              </View>
            </View>
            <MaterialIcons name="public" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              tipoMuro === "Departamento" && styles.radioOptionActive,
            ]}
            onPress={() => setTipoMuro("Departamento")}
          >
            <View style={styles.radioLeft}>
              <MaterialIcons
                name={tipoMuro === "Departamento" ? "radio-button-checked" : "radio-button-unchecked"}
                size={24}
                color={tipoMuro === "Departamento" ? COLORS.primary : "#999"}
              />
              <View style={styles.radioTextContainer}>
                <Text style={styles.radioTitle}>Muro de Departamento</Text>
                <Text style={styles.radioSubtitle}>
                  Solo visible para {user?.nombreDepartamento || "tu departamento"}
                </Text>
              </View>
            </View>
            <MaterialIcons name="business" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </>
      )}

      {esJefe && (
        <View style={styles.infoBox}>
          <MaterialIcons name="info" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Como Jefe, solo puedes publicar en el muro de tu departamento:{" "}
            <Text style={styles.infoBold}>{user?.nombreDepartamento}</Text>
          </Text>
        </View>
      )}

      {/* Destacar (solo admins) */}
      {esAdmin && (
        <View style={styles.destacarContainer}>
          <View style={styles.destacarInfo}>
            <MaterialIcons name="push-pin" size={24} color={COLORS.primary} />
            <View style={styles.destacarTexto}>
              <Text style={styles.destacarTitle}>Destacar aviso</Text>
              <Text style={styles.destacarSubtitle}>
                Aparecerá al inicio del muro
              </Text>
            </View>
          </View>
          <Switch
            value={destacado}
            onValueChange={setDestacado}
            trackColor={{ false: "#ddd", true: COLORS.primary }}
            thumbColor="#fff"
          />
        </View>
      )}

      {/* Botón publicar */}
      <TouchableOpacity
        style={[styles.publicarButton, { opacity: isLoading ? 0.6 : 1 }]}
        onPress={handleCrearAviso}
        disabled={isLoading}
      >
        <MaterialIcons name="send" size={22} color="#fff" />
        <Text style={styles.publicarButtonText}>
          {isLoading ? "Publicando..." : "Publicar Aviso"}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    marginTop: 5,
    textAlign: "center",
  },
  label: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZES.medium,
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 25,
    marginBottom: 15,
  },
  radioOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  radioOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: "#E3F2FD",
  },
  radioLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  radioTextContainer: {
    flex: 1,
  },
  radioTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: COLORS.text,
  },
  radioSubtitle: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 8,
    gap: 12,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  destacarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  destacarInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  destacarTexto: {
    flex: 1,
  },
  destacarTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "600",
    color: COLORS.text,
  },
  destacarSubtitle: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  publicarButton: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    gap: 8,
  },
  publicarButtonText: {
    color: "#fff",
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
  },
  bottomSpace: {
    height: 40,
  },
});

export default CrearAvisoScreen;