import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";

import { colors } from "./src/theme/colors";
import BootstrapScreen from "./src/screens/BootstrapScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import LoginScreen from "./src/screens/LoginScreen";
import GoalSetupScreen from "./src/screens/GoalSetupScreen";
import RoadmapScreen from "./src/screens/RoadmapScreen";
import LessonScreen from "./src/screens/LessonScreen";
import QuizScreen from "./src/screens/QuizScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import AssistantScreen from "./src/screens/AssistantScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import PaywallScreen from "./src/screens/PaywallScreen";
import MaterialsScreen from "./src/screens/MaterialsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

const TAB_ICONS = {
  Roadmap: "🗺️",
  Dashboard: "📊",
  Assistant: "🤖",
  Profile: "👤",
};

// Bottom tabs are the app's home base once a user has a roadmap — Roadmap,
// Dashboard (charts/streaks/achievements), and Profile (plan, reminders,
// logout) are all one tap away instead of buried behind header buttons.
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.bgCard, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name] || "M"}</Text>,
      })}
    >
      <Tab.Screen name="Roadmap" component={RoadmapScreen} options={{ title: "Your Roadmap" }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Materials" component={MaterialsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Assistant" component={AssistantScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={screenOptions} initialRouteName="Bootstrap">
        <Stack.Screen name="Bootstrap" component={BootstrapScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "", headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "", headerShown: false }} />
        <Stack.Screen name="GoalSetup" component={GoalSetupScreen} options={{ title: "New Goal" }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: "Today's Lesson" }} />
        <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: "Quiz" }} />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ title: "", presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
