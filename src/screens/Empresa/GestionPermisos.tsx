import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useUser } from "../../context/UserContext";
import {
  RolEmpresa,
  usePermisosEmpresa,
} from "../../Hooks/usePermisosEmpresas";
import { COLORS, FONT_SIZES } from "../../types/index";

const ROLES: RolEmpresa[] = ["Administrador", "Jefe", "Empleado"];

const PERMISOS_DEFECTO = ["publicar", "editar", "eliminar", "reaccionar"];

const GestionPermisosScreen: React.FC = () => {
  const { user } = useUser();

  const [rolSeleccionado, setRolSeleccionado] =
    useState<RolEmpresa>("Empleado");

  const {
    permisos,
    loading,
    guardando,
    togglePermiso,
    guardarPermisos,
  } = usePermisosEmpresa(user?.empresaId);

  const handleGuardar = async () => {
    try {
      await guardarPermisos(rolSeleccionado);
      Alert.alert("Éxito", `Permisos actualizados para ${rolSeleccionado}`);
    } catch {
      Alert.alert("Error", "No se pudieron guardar los permisos.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gestión de Permisos</Text>

      <View style={styles.rolContainer}>
        {ROLES.map((rol) => (
          <TouchableOpacity
            key={rol}
            style={[
              styles.rolButton,
              rolSeleccionado === rol && styles.rolButtonActive,
            ]}
            onPress={() => setRolSeleccionado(rol)}
          >
            <Text
              style={[
                styles.rolText,
                rolSeleccionado === rol && styles.rolTextActive,
              ]}
            >
              {rol}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subtitle}>
        Permisos del rol: {rolSeleccionado}
      </Text>

      {loading ? (
        <Text style={styles.emptyText}>Cargando permisos...</Text>
      ) : (
        PERMISOS_DEFECTO.map((permiso) => (
          <View key={permiso} style={styles.permRow}>
            <Text style={styles.permLabel}>{permiso}</Text>

            <Switch
              value={!!permisos[rolSeleccionado]?.[permiso]}
              onValueChange={() =>
                togglePermiso(rolSeleccionado, permiso)
              }
            />
          </View>
        ))
      )}

      <TouchableOpacity
        style={[
          styles.saveButton,
          guardando && styles.saveButtonDisabled,
        ]}
        onPress={handleGuardar}
        disabled={guardando}
      >
        <Text style={styles.saveText}>
          {guardando ? "Guardando..." : "Guardar Cambios"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "bold",
    marginBottom: 20,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.medium,
    marginTop: 20,
    marginBottom: 10,
    color: COLORS.text,
  },
  rolContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  rolButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  rolButtonActive: {
    backgroundColor: COLORS.primary,
  },
  rolText: {
    color: "#333",
    fontWeight: "bold",
  },
  rolTextActive: {
    color: "#fff",
  },
  permRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 8,
  },
  permLabel: {
    fontSize: FONT_SIZES.medium,
    textTransform: "capitalize",
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: COLORS.textSecondary,
  },
});

export default GestionPermisosScreen;