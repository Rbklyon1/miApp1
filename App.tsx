import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";
import { UserProvider } from "./src/context/UserContext";
import OfflineIndicator from './src/storage/offlineIndicator';


export default function App() {

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
