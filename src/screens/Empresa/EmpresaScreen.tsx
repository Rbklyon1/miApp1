import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { useUser } from "../../context/UserContext";
import { obtenerEmpresasPorUsuario } from "../../api/empresaService";
import { COLORS, FONT_SIZES } from "../../types/index";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../api/firebaseConfig";

const EmpresaScreen: React.FC = () => {
  const { user, updateUser } = useUser();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const navigation = useNavigation();

  interface Empresa {
  id: string;
  nombre: string;
  codigoAcceso: string;
}

  useEffect(() => {
    if (user) {
      obtenerEmpresasPorUsuario(user.uid)
        .then(setEmpresas)
        .catch(() => Alert.alert("Error", "No se pudieron cargar las empresas"));
    }
  }, [user]);

  const handleSeleccionar = async (empresa: any) => {
    if (!empresa?.id) {
      Alert.alert("Error", "No se pudo seleccionar la empresa.");
      return;
    }

    const uid = user?.uid;
    if (!uid) return;

    try {
      const userRef = doc(db, "Usuarios", uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();

        if (data.empresaId === empresa.id && data.activo === false) {
          Alert.alert("Acceso restringido", "Has sido deshabilitado de esta empresa.");
          return;
        }
      }

      updateUser({
        empresaSeleccionada: empresa.id,
        empresaNombre: empresa.nombre,
      });

      Alert.alert(
        "Empresa seleccionada",
        `Ahora estás en ${empresa.nombre}`,
        [
          { text: "OK", onPress: () => navigation.navigate("Home" as never) },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("❌ Error al validar empresa:", error);
      Alert.alert("Error", "No se pudo validar el acceso a esta empresa.");
    }
    
  };

useEffect(() => {
  console.log(" USER CONTEXT ACTUAL:", user);
}, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona una Empresa</Text>

      <FlatList
        data={empresas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: Empresa }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleSeleccionar(item)}>
            <Text style={styles.cardTitle}>{item.nombre}</Text>
            <Text style={styles.cardCode}>Código: {item.codigoAcceso}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tienes empresas registradas aún.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  title: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.text,
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
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.textSecondary,
  },
});

export default EmpresaScreen;
