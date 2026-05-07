import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useUser } from "../../context/UserContext";
import { useEmpresas } from "../../Hooks/useEmpresa";
import { validarAccesoAEmpresa } from "../../Services/empresaService";
import { COLORS, FONT_SIZES } from "../../types/index";

interface Empresa {
  id: string;
  nombre: string;
  codigoAcceso: string;
}

const EmpresaScreen: React.FC = () => {
  const { user, updateUser } = useUser();
  const navigation = useNavigation();

  const { empresas, loading, refetch } = useEmpresas(user?.uid);

  const handleSeleccionarEmpresa = async (empresa: Empresa) => {
    if (!empresa?.id || !user?.uid) {
      Alert.alert("Error", "No se pudo seleccionar la empresa.");
      return;
    }

    try {
      const tieneAcceso = await validarAccesoAEmpresa(user.uid, empresa.id);

      if (!tieneAcceso) {
        Alert.alert(
          "Acceso restringido",
          "Has sido deshabilitado de esta empresa.",
        );
        return;
      }

     updateUser({
      empresaId: empresa.id,
      empresaNombre: empresa.nombre,
    });

      Alert.alert(
        "Empresa seleccionada",
        `Ahora estás en ${empresa.nombre}`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Home" as never),
          },
        ],
        { cancelable: false },
      );
    } catch {
      Alert.alert("Error", "No se pudo validar el acceso a esta empresa.");
    }
  };

  const renderEmpresa = ({ item }: { item: Empresa }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSeleccionarEmpresa(item)}
    >
      <Text style={styles.cardTitle}>{item.nombre}</Text>
      <Text style={styles.cardCode}>Código: {item.codigoAcceso}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona una Empresa</Text>

      <FlatList
        data={empresas}
        keyExtractor={(item) => item.id}
        renderItem={renderEmpresa}
        refreshing={loading}
        onRefresh={refetch}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading
              ? "Cargando empresas..."
              : "No tienes empresas registradas aún."}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.text,
  },
  cardCode: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.textSecondary,
  },
});

export default EmpresaScreen;
