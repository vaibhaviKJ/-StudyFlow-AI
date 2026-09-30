import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { colors, spacing } from "../theme/colors";
import AmbientGlow from "../components/AmbientGlow";
import client from "../api/client";
import { getCurrentRoadmapId } from "../api/roadmapStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// This screen runs once, on cold start, BEFORE anything else.
// It replaces the old behavior of always dropping the user on Onboarding
// even if they were already logged in with an active roadmap — which is
// what caused confusing crashes/errors on relaunch.
export default function BootstrapScreen({ navigation }) {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    (async () => {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        navigation.replace("Onboarding");
        return;
      }

      // Token exists — verify it's still valid before trusting it.
      try {
        await client.get("/auth/me");
      } catch (e) {
        // Expired/invalid token — clear it and start fresh instead of
        // silently failing deeper in the app.
        await AsyncStorage.removeItem("token");
        navigation.replace("Onboarding");
        return;
      }

      const roadmapId = await getCurrentRoadmapId();
      if (roadmapId) {
        navigation.replace("MainTabs", { screen: "Roadmap", params: { roadmapId } });
      } else {
        navigation.replace("GoalSetup");
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <AmbientGlow />
      <Animated.Text style={[styles.logo, { opacity: pulse }]}>📚⚡</Animated.Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(2) }} />
      <Text style={styles.text}>Getting things ready…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  logo: { fontSize: 56 },
  text: { color: colors.textDim, marginTop: spacing(1.5), fontSize: 13 },
});
