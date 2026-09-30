import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing, radius } from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import AmbientGlow from "../components/AmbientGlow";
import client, { clearToken } from "../api/client";
import { isReminderEnabled, enableDailyReminder, disableDailyReminder } from "../api/notifications";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderBusy, setReminderBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      client.get("/auth/me").then((res) => setUser(res.data)).catch(() => {});
      isReminderEnabled().then(setReminderOn);
    }, [])
  );

  const handleToggleReminder = async (value) => {
    setReminderBusy(true);
    try {
      if (value) {
        const res = await enableDailyReminder();
        if (!res.ok) {
          if (res.reason === "not_supported_in_expo_go") {
            Alert.alert(
              "Not available in Expo Go",
              "Daily reminders need a development build to work — Expo Go doesn't support this feature as of SDK 53. Everything else in the app works normally."
            );
          } else {
            Alert.alert(
              "Notifications blocked",
              "Enable notifications for StudyFlow AI in your phone's settings to get daily reminders."
            );
          }
          setReminderOn(false);
        } else {
          setReminderOn(true);
        }
      } else {
        await disableDailyReminder();
        setReminderOn(false);
      }
    } finally {
      setReminderBusy(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "You'll need to log in again to see your roadmap.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await clearToken();
          navigation.getParent()?.reset({ index: 0, routes: [{ name: "Onboarding" }] });
        },
      },
    ]);
  };

  if (!user) return <SafeAreaView style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <AmbientGlow />
      <ScrollView contentContainerStyle={{ padding: spacing(3) }}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user.name)}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={[styles.planBadge, user.is_pro && styles.planBadgePro]}>
            <Text style={styles.planBadgeText}>{user.is_pro ? "⭐ PRO" : "FREE PLAN"}</Text>
          </View>
        </View>

        {!user.is_pro && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>You're on the Free plan</Text>
            <Text style={styles.cardBody}>
              {5 - user.ai_sessions_used_this_month} of 5 AI roadmap generations left this month.
            </Text>
            <View style={{ height: spacing(1.5) }} />
            <PrimaryButton title="Upgrade to Pro" onPress={() => navigation.getParent()?.navigate("Paywall")} />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Daily reminder</Text>
              <Text style={styles.cardBody}>Get nudged at 7 PM if you haven't studied yet.</Text>
            </View>
            <Switch
              value={reminderOn}
              onValueChange={handleToggleReminder}
              disabled={reminderBusy}
              trackColor={{ false: colors.bgCardAlt, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={{ height: spacing(2) }} />
        <PrimaryButton title="Log out" variant="outline" onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: "center", marginBottom: spacing(3) },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.primaryDim, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.primary, marginBottom: spacing(1.5),
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  name: { color: colors.text, fontSize: 22, fontWeight: "800" },
  email: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  planBadge: {
    marginTop: spacing(1.5), paddingHorizontal: spacing(1.75), paddingVertical: spacing(0.5),
    borderRadius: radius.pill, backgroundColor: colors.bgCardAlt, borderWidth: 1, borderColor: colors.border,
  },
  planBadgePro: { backgroundColor: "rgba(255,193,94,0.15)", borderColor: colors.gold },
  planBadgeText: { color: colors.textDim, fontSize: 11.5, fontWeight: "800", letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing(2.5),
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing(2),
  },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  cardBody: { color: colors.textDim, fontSize: 13, marginTop: spacing(0.5), lineHeight: 18 },
  rowBetween: { flexDirection: "row", alignItems: "center", gap: spacing(1.5) },
});
