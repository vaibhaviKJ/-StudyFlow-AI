import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius } from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import AmbientGlow from "../components/AmbientGlow";

// NOTE: This screen is UI-only. Wire it to RevenueCat's react-native-purchases
// SDK (see mobile/README section "Wiring up RevenueCat") to take real payments.

const PLANS = [
  { id: "monthly", label: "Monthly", price: "₹149", period: "/month" },
  { id: "yearly", label: "Yearly", price: "₹999", period: "/year", badge: "Best value" },
];

export default function PaywallScreen({ navigation }) {
  const [selected, setSelected] = useState("yearly");

  return (
    <SafeAreaView style={styles.container}>
      <AmbientGlow />
      <ScrollView contentContainerStyle={{ padding: spacing(3) }}>
        <Text style={styles.kicker}>StudyFlow PRO</Text>
        <Text style={styles.title}>Unlock unlimited AI coaching</Text>

        <View style={styles.card}>
          <Feature text="Unlimited AI roadmaps & quizzes" />
          <Feature text="Full mock interviews" />
          <Feature text="Advanced weak-area analytics" />
          <Feature text="No ads" />
        </View>

        <View style={styles.plans}>
          {PLANS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.plan, selected === p.id && styles.planSelected]}
              onPress={() => setSelected(p.id)}
            >
              {p.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{p.badge}</Text>
                </View>
              )}
              <Text style={styles.planLabel}>{p.label}</Text>
              <Text style={styles.planPrice}>
                {p.price}
                <Text style={styles.planPeriod}>{p.period}</Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: spacing(2) }} />
        <PrimaryButton
          title={`Continue with ${selected === "yearly" ? "Yearly" : "Monthly"}`}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.hint}>
          Payments aren't wired up in this build — connect RevenueCat to enable
          real purchases (see mobile/README.md).
        </Text>
        <Text style={styles.skip} onPress={() => navigation.goBack()}>
          Maybe later
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({ text }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.check}>✓</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  kicker: { color: colors.gold, fontWeight: "800", fontSize: 13, letterSpacing: 1 },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: spacing(0.5), marginBottom: spacing(2.5) },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing(2.5),
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing(3), gap: spacing(1.25),
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing(1.25) },
  check: { color: colors.accent, fontWeight: "800" },
  featureText: { color: colors.text, fontSize: 14.5 },
  plans: { flexDirection: "row", gap: spacing(1.5) },
  plan: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing(2),
    borderWidth: 1.5, borderColor: colors.border,
  },
  planSelected: { borderColor: colors.primary, backgroundColor: colors.bgCardAlt },
  badge: {
    position: "absolute", top: -10, right: 10, backgroundColor: colors.gold,
    borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { color: "#1a1a1a", fontSize: 10, fontWeight: "800" },
  planLabel: { color: colors.textDim, fontSize: 13, fontWeight: "700" },
  planPrice: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: spacing(0.5) },
  planPeriod: { color: colors.textDim, fontSize: 13, fontWeight: "400" },
  hint: { color: colors.textDim, fontSize: 12, textAlign: "center", marginTop: spacing(2), lineHeight: 17 },
  skip: { color: colors.textDim, textAlign: "center", marginTop: spacing(2), textDecorationLine: "underline" },
});
