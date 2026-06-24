import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import DashboardScreen from "./src/screens/DashboardScreen";
import AssetsScreen from "./src/screens/AssetsScreen";
import TransactionsScreen from "./src/screens/TransactionsScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: "#1e293b" },
            headerTintColor: "#fff",
            tabBarStyle: { backgroundColor: "#1e293b" },
            tabBarActiveTintColor: "#60a5fa",
            tabBarInactiveTintColor: "#94a3b8",
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: "Dashboard" }}
          />
          <Tab.Screen
            name="Assets"
            component={AssetsScreen}
            options={{ title: "Assets" }}
          />
          <Tab.Screen
            name="Transactions"
            component={TransactionsScreen}
            options={{ title: "Transactions" }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
