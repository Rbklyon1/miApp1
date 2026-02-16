import { MaterialIcons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { createStackNavigator } from "@react-navigation/stack";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUser } from "../context/UserContext";
import {
  buscarEmpresaPorCodigo,
  crearEmpresa,
  vincularUsuarioAEmpresa,
} from "../Services/empresaService";
import { auth } from "../Services/firebaseConfig";
import { COLORS, FONT_SIZES } from "../types/index";

//Pantallas
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import EmpresaScreen from "../screens/Empresa/EmpresaScreen";
import GestionPermisosScreen from "../screens/Empresa/GestionPermisos";
import GestionUsuariosScreen from "../screens/Empresa/GestionUsuariosScreen";
import CrearEventoScreen from "../screens/Eventos/CrearEventoScreen";
import DetalleEventoScreen from "../screens/Eventos/DetalleEventoScreen";
import EventosDeptoScreen from "../screens/Eventos/EventosDptoScreen";
import EventosScreen from "../screens/Eventos/EventosScreen";
import HomeScreen from "../screens/home/HomeScreen";
import MuroDepartamentoScreen from "../screens/muro/MuroDptoScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import CrearTareaScreen from "../screens/Tareas/CrearTareaScreen";
import DetalleTareaScreen from "../screens/Tareas/DetalleTareaScreen";
import TareasDeptoScreen from "../screens/Tareas/TareasDptoScreen";
import TareasScreen from "../screens/Tareas/TareasScreen";

//  Tipo de parámetros de navegación
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  Empresa: undefined;
  GestionPermisos: undefined;
  GestionUsuarios: undefined;
  Tareas: undefined;
  CrearTarea: undefined;
  DetalleTarea: { tareaId: string };
  Eventos: undefined;
  CrearEvento: undefined;
  DetalleEvento: { eventoId: string };
  MuroDpto: undefined;
  TareaDpto: undefined;
  EventoDpto: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const StackNavigator: React.FC = () => {
  // Estados para el menú y modales
  const [menuVisible, setMenuVisible] = useState(false);
  const [empresaModal, setEmpresaModal] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState("");
  const [codigoAcceso, setCodigoAcceso] = useState("");
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [unirseModal, setUnirseModal] = useState(false);
  const [codigoUnirse, setCodigoUnirse] = useState("");

  const { user, setUser } = useUser();

  //  Cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error.message);
      Alert.alert("Error", "No se pudo cerrar la sesión.");
    }
  };

  //  Crear empresa y vincular usuario
  const handleCrearEmpresa = async () => {
    if (!nombreEmpresa.trim() || !codigoAcceso.trim()) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    try {
      const empresaId = await crearEmpresa(
        nombreEmpresa.trim(),
        codigoAcceso.trim(),
        auth.currentUser?.uid || "",
        user?.nombre || "",
        user?.correo || ""
      );

      await vincularUsuarioAEmpresa(
        auth.currentUser?.uid || "",
        user?.nombre || "",
        user?.correo || "",
        empresaId,
        "Administrador"
      );

      setUser({
        ...user!,
        rol: "Administrador",
        empresaId,
        empresaNombre: nombreEmpresa,
      });

      Alert.alert("Éxito", "Empresa creada y vinculada correctamente.");
      setEmpresaModal(false);
      setNombreEmpresa("");
      setCodigoAcceso("");
    } catch (error) {
      console.error(" Error al crear empresa:", error);
      Alert.alert("Error", "No se pudo crear la empresa.");
    }
  };

  const handleUnirseEmpresa = async () => {
    if (!codigoUnirse.trim()) {
      Alert.alert("Error", "Por favor ingresa un código de empresa.");
      return;
    }

    try {
      const empresa = await buscarEmpresaPorCodigo(codigoUnirse.trim());
      if (!empresa) {
        Alert.alert("Error", "No existe ninguna empresa con ese código.");
        return;
      }

      //  Vincular usuario actual
      await vincularUsuarioAEmpresa(
        auth.currentUser?.uid || "",
        user?.nombre || "",
        user?.correo || "",
        empresa.id,
        "Empleado"
      );

      //  Actualizar contexto
      setUser({
        ...user!,
        rol: "Empleado",
        empresaId: empresa.id,
        empresaNombre: empresa.nombre,
      });

      Alert.alert("Éxito", `Te uniste a ${empresa.nombre}`);
      setUnirseModal(false);
      setCodigoUnirse("");
    } catch (error) {
      console.error(" Error al unirse:", error);
      Alert.alert("Error", "No se pudo unir a la empresa.");
    }
  };

  console.log("USER EN STACK:", user);

  return (
    <>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#000",
          headerTitleAlign: "center",
          headerTitleStyle: { fontWeight: "bold" },
          // 🔹 Ícono de menú de hamburguesa
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={() => setMenuVisible(true)}
            >
              <MaterialIcons name="menu" size={28} color="#000" />
            </TouchableOpacity>
          ),
        })}
      >
        {/* Pantallas */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Muro" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Perfil" }}
        />
        <Stack.Screen
          name="Empresa"
          component={EmpresaScreen}
          options={{ title: "Mis empresas" }}
        />
        <Stack.Screen
          name="GestionPermisos"
          component={GestionPermisosScreen}
          options={{ title: "Gestión de Permisos" }}
        />
        <Stack.Screen
          name="GestionUsuarios"
          component={GestionUsuariosScreen}
          options={{ title: "Gestión de Usuarios" }}
        />
        <Stack.Screen
          name="Tareas"
          component={TareasScreen}
          options={{ title: "Tareas" }}
        />
        <Stack.Screen
          name="CrearTarea"
          component={CrearTareaScreen}
          options={{ title: "Nueva Tarea" }}
        />
        <Stack.Screen
          name="DetalleTarea"
          component={DetalleTareaScreen}
          options={{ title: "Detalle de Tarea" }}
        />
        <Stack.Screen
          name="Eventos"
          component={EventosScreen}
          options={{ title: "Eventos" }}
        />
        <Stack.Screen
          name="CrearEvento"
          component={CrearEventoScreen}
          options={{ title: "Nuevo Evento" }}
        />
        <Stack.Screen
          name="DetalleEvento"
          component={DetalleEventoScreen}
          options={{ title: "Detalle del Evento" }}
        />
        <Stack.Screen
          name="MuroDpto"
          component={MuroDepartamentoScreen}
          options={{ title: "Muro Departamental" }}
        />
        <Stack.Screen
          name="TareaDpto"
          component={TareasDeptoScreen}
          options={{ title: "Tareas Departamental" }}
        />
        <Stack.Screen
          name="EventoDpto"
          component={EventosDeptoScreen}
          options={{ title: "Evento Departamental" }}
        />
      </Stack.Navigator>

      {/*  Modal del Menú */}
      <Modal
        animationType="fade"
        transparent
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuOverlay}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Menú de Usuario</Text>

            {/* Mi Perfil */}
            <Pressable
              style={styles.menuOption}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Profile");
              }}
            >
              <MaterialIcons name="person" size={22} color={COLORS.primary} />
              <Text style={styles.menuText}>Mi Perfil</Text>
            </Pressable>

            {/* Muro departamental */}
            {user &&
              user.rol !== "Administrador" &&
              (user.idDepartamento ? (
                <Pressable
                  style={styles.menuOption}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("MuroDpto");
                  }}
                >
                  <MaterialIcons
                    name="groups"
                    size={22}
                    color={COLORS.primary}
                  />
                  <Text style={styles.menuText}>Muro de mi departamento</Text>
                </Pressable>
              ) : (
                <View style={styles.menuOption}>
                  <MaterialIcons
                    name="info"
                    size={22}
                    color={COLORS.textSecondary}
                  />
                  <Text
                    style={[styles.menuText, { color: COLORS.textSecondary }]}
                  >
                    Aún no estás asignado a un departamento
                  </Text>
                </View>
              ))}

            {/* Sección de Empresas */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionHeader}>Empresas</Text>
            </View>

            {/* Crear Empresa */}
            <Pressable
              style={styles.menuOption}
              onPress={() => {
                setMenuVisible(false);
                setEmpresaModal(true);
              }}
            >
              <MaterialIcons
                name="add-business"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.menuText}>Crear Empresa</Text>
            </Pressable>

            {/* Unirse a Empresa */}
            <Pressable
              style={styles.menuOption}
              onPress={() => {
                setMenuVisible(false);
                setUnirseModal(true);
              }}
            >
              <MaterialIcons name="business" size={22} color={COLORS.primary} />
              <Text style={styles.menuText}>Unirse a Empresa</Text>
            </Pressable>

            {/* Sección de Administración */}
            <View style={styles.sectionDivider}>
              <Text style={styles.sectionHeader}>Administración</Text>
            </View>

            {user?.rol === "Administrador" && user?.empresaSeleccionada && (
              <>
                <Pressable
                  style={styles.menuOption}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("GestionPermisos");
                  }}
                >
                  <MaterialIcons
                    name="security"
                    size={22}
                    color={COLORS.primary}
                  />
                  <Text style={styles.menuText}>Gestionar Permisos</Text>
                </Pressable>
                <Pressable
                  style={styles.menuOption}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("GestionUsuarios");
                  }}
                >
                  <MaterialIcons
                    name="person-search"
                    size={22}
                    color={COLORS.primary}
                  />
                  <Text style={styles.menuText}>Gestiona Usuarios</Text>
                </Pressable>
              </>
            )}

            {/* Cerrar Sesión */}
            <Pressable
              style={styles.menuOption}
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
            >
              <MaterialIcons name="logout" size={22} color={COLORS.error} />
              <Text style={[styles.menuText, { color: COLORS.error }]}>
                Cerrar Sesión
              </Text>
            </Pressable>

            {/* Botón Cancelar */}
            <Pressable
              style={styles.closeMenuButton}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.closeMenuText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/*  Modal de crear empresa */}
      <Modal
        animationType="slide"
        transparent
        visible={empresaModal}
        onRequestClose={() => setEmpresaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Crear Nueva Empresa</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre de la empresa"
              placeholderTextColor={COLORS.textSecondary}
              value={nombreEmpresa}
              onChangeText={setNombreEmpresa}
            />

            <TextInput
              style={styles.input}
              placeholder="Código de acceso (ej. BH-9823)"
              placeholderTextColor={COLORS.textSecondary}
              value={codigoAcceso}
              onChangeText={setCodigoAcceso}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCrearEmpresa}
            >
              <Text style={styles.createButtonText}>Guardar Empresa</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEmpresaModal(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de unirse a empresa */}
      <Modal
        animationType="slide"
        transparent
        visible={unirseModal}
        onRequestClose={() => setUnirseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Unirse a una Empresa</Text>

            <TextInput
              style={styles.input}
              placeholder="Código de empresa (ej. BH-9823)"
              placeholderTextColor={COLORS.textSecondary}
              value={codigoUnirse}
              onChangeText={setCodigoUnirse}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleUnirseEmpresa}
            >
              <Text style={styles.createButtonText}>Unirse</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setUnirseModal(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  menuTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  menuText: {
    fontSize: FONT_SIZES.medium,
    color: COLORS.text,
  },
  closeMenuButton: {
    alignSelf: "center",
    marginTop: 10,
    paddingVertical: 10,
  },
  closeMenuText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.medium,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: FONT_SIZES.large,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelText: {
    textAlign: "center",
    color: COLORS.error,
    marginTop: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: FONT_SIZES.medium,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 10,
  },
});

export default StackNavigator;
