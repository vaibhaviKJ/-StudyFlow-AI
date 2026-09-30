import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import AmbientGlow from "../components/AmbientGlow";

export default function OnboardingScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <AmbientGlow />
      <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.logo}>📚⚡</Text>
        <Text style={styles.title}>StudyFlow AI</Text>
        <Text style={styles.subtitle}>
          Tell it your goal. It builds your daily plan, quizzes you, finds your
          weak spots, and keeps you coming back — every single day.
        </Text>
      </Animated.View>

      <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
        <Feature icon="🎯" text="Personalized day-by-day roadmap for any goal" />
        <Feature icon="🧠" text="AI quizzes that target your weak areas" />
        <Feature icon="🔥" text="Streaks that keep you consistent" />
        <Feature icon="🏆" text="Unlockable achievements as you progress" />
      </Animated.View>

      <View style={styles.actions}>
        <PrimaryButton title="Get Started" onPress={() => navigation.replace("Register")} />
        <View style={{ height: spacing(1.5) }} />
        <PrimaryButton
          title="I already have an account"
          variant="outline"
          onPress={() => navigation.replace("Login")}
        />
      </View>
    </SafeAreaView>
  );
}

function Feature({ icon, text }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing(3), justifyContent: "space-between" },
  hero: { marginTop: spacing(4) },
  logo: { fontSize: 56, marginBottom: spacing(2) },
  title: { color: colors.text, fontSize: 34, fontWeight: "800" },
  subtitle: { color: colors.textDim, fontSize: 15, marginTop: spacing(1.5), lineHeight: 22 },
  features: { gap: spacing(2) },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
  featureIcon: { fontSize: 22 },
  featureText: { color: colors.text, fontSize: 15, flex: 1 },
  actions: { marginBottom: spacing(2) },
});
