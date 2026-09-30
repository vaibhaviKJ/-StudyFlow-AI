import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { colors, spacing, radius } from "../theme/colors";

// UI + working reward flow for a rewarded-ad monetization moment. The actual
// "ad" step is a placeholder delay — swap the setTimeout in onWatchAd (in the
// parent screen) for a real ad SDK call (e.g. react-native-google-mobile-ads'
// RewardedAd) and the reward logic (fetching bonus questions) stays the same.
export default function AdBanner({ onWatchAd, loading }) {
  return (
    <TouchableOpacity style={styles.wrap} onPress={onWatchAd} disabled={loading} activeOpacity={0.85}>
      <Text style={styles.icon}>🎬</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Want 5 more practice questions?</Text>
        <Text style={styles.subtitle}>Watch a short ad to unlock a bonus round — free plan</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.gold} />
      ) : (
        <Text style={styles.cta}>Watch</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,193,94,0.1)",
    borderRadius: radius.md,
    padding: spacing(1.75),
    borderWidth: 1,
    borderColor: colors.gold,
    gap: spacing(1.25),
    width: "100%",
  },
  icon: { fontSize: 22 },
  title: { color: colors.text, fontSize: 13.5, fontWeight: "700" },
  subtitle: { color: colors.textDim, fontSize: 11.5, marginTop: 2 },
  cta: { color: colors.gold, fontWeight: "800", fontSize: 13 },
});
