import { MaterialIcons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { RootStackParamList } from "../../navigation/StackNavigator";
import { auth } from "../../Services/firebaseConfig";
import { COLORS, FONT_SIZES } from "../../types/index";

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Profile"
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { setUser, user, updateUser } = useUser();
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [editandoCorreo, setEditandoCorreo] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigation.replace("Login");
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error.message);
      Alert.alert("Error", "No se pudo cerrar la sesión.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#000" barStyle="light-content" />

      {/* Imagen de perfil */}
      <View style={styles.headerSection}>
        <Image
          source={require("../../../assets/alumno_image1.png")}
          style={styles.ProfileImage}
        />
        <Text style={styles.nameText}>
          {user?.nombre || "Usuario sin nombre"}
        </Text>
        <Text style={styles.roleText}>{user?.rol || "Empleado"}</Text>
      </View>

      {/* Campo NOMBRE */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>NOMBRE</Text>
        <TouchableOpacity onPress={() => setEditandoNombre(!editandoNombre)}>
          <MaterialIcons name="edit" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {editandoNombre ? (
        <TextInput
          style={styles.input}
          value={user?.nombre || ""}
          onChangeText={(text) => updateUser({ nombre: text })}
          placeholder="Ingresa tu nombre"
          autoFocus
          onBlur={() => setEditandoNombre(false)}
        />
      ) : (
        <Text style={styles.fieldValue}>{user?.nombre || "—"}</Text>
      )}

      {/* Campo CORREO */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>CORREO</Text>
        <TouchableOpacity onPress={() => setEditandoCorreo(!editandoCorreo)}>
          <MaterialIcons name="edit" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {editandoCorreo ? (
        <TextInput
          style={styles.input}
          value={user?.correo || ""}
          onChangeText={(text) => updateUser({ correo: text })}
          placeholder="Ingresa tu correo"
          keyboardType="email-address"
          autoFocus
          onBlur={() => setEditandoCorreo(false)}
        />
      ) : (
        <Text style={styles.fieldValue}>{user?.correo || "—"}</Text>
      )}

      {/* Botón cerrar sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerSection: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  ProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  nameText: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    color: COLORS.text,
  },
  roleText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  fieldContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 6,
  },
  label: { fontWeight: "bold", fontSize: 15, color: "#000" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 20,
    fontSize: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  fieldValue: {
    fontSize: 15,
    marginLeft: 20,
    marginBottom: 15,
    color: "#000",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingVertical: 12,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    elevation: 8,
  },
  iconButton: { padding: 8, borderRadius: 20 },
  logoutButton: {
    backgroundColor: COLORS.error,
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: FONT_SIZES.medium,
  },
});

export default ProfileScreen;
