import React, { useEffect, useState } from "react";
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
  asignarPermisosPorRol,
  obtenerPermisosDeEmpresa,
} from "../../Services/empresaService";
import { COLORS, FONT_SIZES } from "../../types/index";

const GestionPermisosScreen: React.FC = () => {
  const { user } = useUser();
  const [permisos, setPermisos] = useState<Record<string, any>>({});
  const [rolSeleccionado, setRolSeleccionado] = useState("Empleado");

  useEffect(() => {
    if (user?.empresaSeleccionada) {
      obtenerPermisosDeEmpresa(user.empresaSeleccionada)
        .then(setPermisos)
        .catch(() =>
          Alert.alert("Error", "No se pudieron cargar los permisos.")
        );
    }
  }, [user?.empresaSeleccionada]);

  const roles = ["Administrador", "Jefe", "Empleado"];

  const togglePermiso = (permiso: string) => {
    setPermisos((prev) => ({
      ...prev,
      [rolSeleccionado]: {
        ...prev[rolSeleccionado],
        [permiso]: !prev[rolSeleccionado]?.[permiso],
      },
    }));
  };

  const handleGuardar = async () => {
    try {
      if (!user?.empresaSeleccionada) return;
      await asignarPermisosPorRol(
        user.empresaSeleccionada,
        rolSeleccionado,
        permisos[rolSeleccionado] || {}
      );
      Alert.alert("Éxito", `Permisos actualizados para ${rolSeleccionado}`);
    } catch {
      Alert.alert("Error", "No se pudieron guardar los permisos.");
    }
  };

  const permisosDefecto = ["publicar", "editar", "eliminar", "reaccionar"];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gestión de Permisos</Text>

      {/* Selección de rol */}
      <View style={styles.rolContainer}>
        {roles.map((rol) => (
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

      <Text style={styles.subtitle}>Permisos del rol: {rolSeleccionado}</Text>

      {permisosDefecto.map((permiso) => (
        <View key={permiso} style={styles.permRow}>
          <Text style={styles.permLabel}>{permiso}</Text>
          <Switch
            value={!!permisos[rolSeleccionado]?.[permiso]}
            onValueChange={() => togglePermiso(permiso)}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleGuardar}>
        <Text style={styles.saveText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  title: {
    fontSize: FONT_SIZES.xlarge,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: { fontSize: FONT_SIZES.medium, marginTop: 20, marginBottom: 10 },
  rolContainer: { flexDirection: "row", justifyContent: "space-around" },
  rolButton: { padding: 10, borderRadius: 8, backgroundColor: "#eee" },
  rolButtonActive: { backgroundColor: COLORS.primary },
  rolText: { color: "#333", fontWeight: "bold" },
  rolTextActive: { color: "#fff" },
  permRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  permLabel: {
    fontSize: FONT_SIZES.medium,
    textTransform: "capitalize",
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  saveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default GestionPermisosScreen;
