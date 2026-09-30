import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing, radius } from "../theme/colors";
import StreakBadge from "../components/StreakBadge";
import ProgressRing from "../components/ProgressRing";
import AchievementBadges from "../components/AchievementBadges";
import BarChart from "../components/BarChart";
import client from "../api/client";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DashboardScreen({ navigation }) {
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState(null);
  const [weakAreas, setWeakAreas] = useState(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        client.get("/progress"),
        client.get("/progress/history"),
        client.get("/progress/weak-areas"),
      ])
        .then(([pRes, hRes, wRes]) => {
          setProgress(pRes.data);
          setHistory(hRes.data);
          setWeakAreas(wRes.data);
          Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
        })
        .catch(() => {});
    }, [])
  );

  if (!progress || !history || !weakAreas) return <SafeAreaView style={styles.container} />;

  const overallPct = progress.days_total
    ? (progress.days_completed / progress.days_total) * 100
    : 0;

  const activityData = history.weekly_activity.map((d) => ({
    label: DAY_LABELS[new Date(d.date).getDay()],
    value: d.count,
    color: colors.primary,
  }));

  const quizData = history.quiz_history.map((q, i) => ({
    label: `#${i + 1}`,
    value: Math.round(q.percent),
    color: q.percent >= 70 ? colors.accent : colors.gold,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={{ padding: spacing(3) }}>
        <Text style={styles.title}>Dashboard</Text>
        <StreakBadge days={progress.current_streak} />

        <View style={styles.ringRow}>
          <ProgressRing percent={overallPct} size={130} strokeWidth={11} label="completed" />
          <View style={styles.ringSideStats}>
            <StatLine label="Longest streak" value={`${progress.longest_streak} days`} />
            <StatLine label="Quiz average" value={`${progress.quiz_average}%`} />
            <StatLine label="Days done" value={`${progress.days_completed} / ${progress.days_total}`} />
            <StatLine label="Active roadmaps" value={progress.active_roadmaps} />
          </View>
        </View>

        <View style={{ height: spacing(3) }} />
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>This week's activity</Text>
          <Text style={styles.chartSubtitle}>Days completed, last 7 days</Text>
          <View style={{ height: spacing(2) }} />
          <BarChart data={activityData} height={90} barColor={colors.primary} />
        </View>

        <View style={{ height: spacing(2) }} />
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Quiz scores</Text>
          <Text style={styles.chartSubtitle}>Your last {quizData.length || 0} attempts</Text>
          <View style={{ height: spacing(2) }} />
          <BarChart data={quizData} height={90} valueSuffix="%" />
        </View>

        {weakAreas.areas.length > 0 && (
          <>
            <View style={{ height: spacing(2) }} />
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Where you need the most work</Text>
              <Text style={styles.chartSubtitle}>Topics missed most across {weakAreas.total_quizzes_taken} quizzes</Text>
              <View style={{ height: spacing(1.5) }} />
              {weakAreas.areas.map((a) => (
                <View key={a.topic} style={styles.weakRow}>
                  <Text style={styles.weakTopic} numberOfLines={1}>{a.topic}</Text>
                  <View style={styles.weakCountBadge}>
                    <Text style={styles.weakCountText}>missed {a.miss_count}×</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: spacing(3) }} />
        <AchievementBadges currentStreak={progress.current_streak} longestStreak={progress.longest_streak} />
        <View style={{ height: spacing(2) }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function StatLine({ label, value }) {
  return (
    <View style={styles.statLine}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: spacing(1.5) },
  ringRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing(2.5),
    marginTop: spacing(2.5),
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(2.5),
  },
  ringSideStats: { flex: 1, gap: spacing(1.25) },
  statLine: { borderLeftWidth: 2, borderLeftColor: colors.primaryDim, paddingLeft: spacing(1.25) },
  statValue: { color: colors.accent, fontSize: 17, fontWeight: "800" },
  statLabel: { color: colors.textDim, fontSize: 11.5, marginTop: 1 },
  chartCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing(2.5),
    borderWidth: 1, borderColor: colors.border,
  },
  chartTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  chartSubtitle: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  weakRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: spacing(1), borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  weakTopic: { color: colors.text, fontSize: 13, flex: 1, marginRight: spacing(1) },
  weakCountBadge: {
    backgroundColor: "rgba(255,92,108,0.15)", borderRadius: radius.pill,
    paddingHorizontal: spacing(1), paddingVertical: 3,
  },
  weakCountText: { color: colors.danger, fontSize: 11, fontWeight: "700" },
});
