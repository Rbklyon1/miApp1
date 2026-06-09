import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";
import { UserProvider } from "./src/context/UserContext";
import OfflineIndicator from './src/Components/offlineIndicator';
import { initDatabase } from "./src/Services/sqlite/database";
import { syncPendientes } from "./src/Services/sqlite/syncService";
import { initEmpresaTables } from "./src/Services/sqlite/offlineEmpresaService";
import { initAuthTable } from "./src/Services/sqlite/offlineAuthService";
import NetInfo from "@react-native-community/netinfo";

export default function App() {

  useEffect(() => {
    // Inicializar todas las tablas SQLite
    initDatabase();
    initEmpresaTables();
    initAuthTable();

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncPendientes();
      }
    });

    return () => unsubscribe(); 
  }, []); 
  return (
    <>
      <OfflineIndicator />
      <UserProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </UserProvider>
    </>
  );
}