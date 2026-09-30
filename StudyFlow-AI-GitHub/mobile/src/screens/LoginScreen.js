import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, Alert,
  KeyboardAvoidingView, ScrollView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius } from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import PasswordInput from "../components/PasswordInput";
import AmbientGlow from "../components/AmbientGlow";
import client, { saveToken } from "../api/client";
import { getCurrentRoadmapId } from "../api/roadmapStore";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await client.post("/auth/login", { email, password });
      await saveToken(res.data.access_token);
      const roadmapId = await getCurrentRoadmapId();
      if (roadmapId) {
        navigation.reset({ index: 0, routes: [{ name: "MainTabs", params: { screen: "Roadmap", params: { roadmapId } } }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "GoalSetup" }] });
      }
    } catch (err) {
      Alert.alert(
        "Login failed",
        err?.response?.data?.detail || "Could not reach the server. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientGlow />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>📚⚡</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Keep the streak alive.</Text>

          <View style={{ height: spacing(3) }} />

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <View style={{ height: spacing(1.5) }} />

            <Text style={styles.fieldLabel}>Password</Text>
            <PasswordInput value={password} onChangeText={setPassword} />

            <View style={{ height: spacing(1) }} />
            <PrimaryButton title="Log in" onPress={handleLogin} loading={loading} />
          </View>

          <Text style={styles.link} onPress={() => navigation.replace("Register")}>
            New here? <Text style={styles.linkStrong}>Create an account</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: spacing(3.5) },
  logoWrap: { alignItems: "center", marginBottom: spacing(2) },
  logo: { fontSize: 44 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { color: colors.textDim, marginTop: spacing(0.5), textAlign: "center", fontSize: 14 },
  card: {
    backgroundColor: "rgba(20, 26, 42, 0.85)",
    borderRadius: radius.lg,
    padding: spacing(2.5),
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: { color: colors.textDim, fontSize: 12.5, fontWeight: "600", marginBottom: spacing(0.75) },
  input: {
    backgroundColor: colors.bgCard,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.75),
    borderWidth: 1,
    borderColor: colors.border,
  },
  link: { color: colors.textDim, textAlign: "center", marginTop: spacing(3), fontSize: 14 },
  linkStrong: { color: colors.primary, fontWeight: "700" },
});
