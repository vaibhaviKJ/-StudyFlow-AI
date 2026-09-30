import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors, spacing, radius } from "../theme/colors";

const MILESTONES = [
  { days: 3, icon: "🌱", label: "3-Day Spark" },
  { days: 7, icon: "🔥", label: "1-Week Streak" },
  { days: 14, icon: "⚡", label: "2-Week Momentum" },
  { days: 30, icon: "🏆", label: "30-Day Master" },
  { days: 60, icon: "💎", label: "Unstoppable" },
];

export default function AchievementBadges({ currentStreak = 0, longestStreak = 0 }) {
  const best = Math.max(currentStreak, longestStreak);
  return (
    <View>
      <Text style={styles.heading}>Achievements</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing(1.5) }}>
        {MILESTONES.map((m) => {
          const unlocked = best >= m.days;
          return (
            <View key={m.days} style={[styles.badge, !unlocked && styles.badgeLocked]}>
              <Text style={[styles.icon, !unlocked && styles.iconLocked]}>{unlocked ? m.icon : "🔒"}</Text>
              <Text style={[styles.label, !unlocked && styles.labelLocked]}>{m.label}</Text>
              <Text style={styles.days}>{m.days}d</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: spacing(1.25), textTransform: "uppercase", letterSpacing: 0.5 },
  badge: {
    width: 92,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing(1.5),
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  badgeLocked: {
    borderColor: colors.border,
    opacity: 0.5,
  },
  icon: { fontSize: 26, marginBottom: spacing(0.75) },
  iconLocked: { fontSize: 22 },
  label: { color: colors.text, fontSize: 11, fontWeight: "700", textAlign: "center" },
  labelLocked: { color: colors.textDim },
  days: { color: colors.textDim, fontSize: 10, marginTop: 4 },
});
