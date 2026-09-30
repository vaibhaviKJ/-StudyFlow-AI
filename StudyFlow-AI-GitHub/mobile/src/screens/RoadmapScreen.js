import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing, radius } from "../theme/colors";
import ProgressRing from "../components/ProgressRing";
import StreakBadge from "../components/StreakBadge";
import PrimaryButton from "../components/PrimaryButton";
import client from "../api/client";
import { getCurrentRoadmapId, setCurrentRoadmapId } from "../api/roadmapStore";

const STATUS_META = {
  completed: { icon: "✅", color: colors.accent },
  in_progress: { icon: "🔵", color: colors.primary },
  pending: { icon: "⚪", color: colors.textDim },
  locked: { icon: "🔒", color: colors.textDim },
};

export default function RoadmapScreen({ route, navigation }) {
  const [roadmap, setRoadmap] = useState(null);
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // IMPORTANT: this never trusts route.params alone. If this screen is ever
  // reached without a roadmapId (e.g. a nested "navigate back" call, a deep
  // link, or a cold start), it falls back to the last roadmap the user was
  // viewing instead of crashing.
  const resolveRoadmapId = useCallback(async () => {
    const fromParams = route.params?.roadmapId;
    if (fromParams) {
      await setCurrentRoadmapId(fromParams);
      return fromParams;
    }
    return await getCurrentRoadmapId();
  }, [route.params]);

  const load = useCallback(async () => {
    const id = await resolveRoadmapId();
    if (!id) {
      setNotFound(true);
      return;
    }
    setNotFound(false);
    try {
      const [rRes, meRes] = await Promise.all([
        client.get(`/roadmap/${id}`),
        client.get("/auth/me"),
      ]);
      setRoadmap(rRes.data);
      setStreak(meRes.data.current_streak);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (e) {
      if (e?.response?.status === 404) setNotFound(true);
    }
  }, [resolveRoadmapId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (notFound) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>No active roadmap yet</Text>
          <Text style={styles.emptySubtitle}>Set a goal and StudyFlow will build your plan.</Text>
          <View style={{ height: spacing(3) }} />
          <PrimaryButton title="Set a new goal" onPress={() => navigation.replace("GoalSetup")} />
        </View>
      </SafeAreaView>
    );
  }

  if (!roadmap) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading your roadmap…</Text>
      </SafeAreaView>
    );
  }

  const completedCount = roadmap.days.filter((d) => d.status === "completed").length;
  const percent = roadmap.days.length ? (completedCount / roadmap.days.length) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.goal} numberOfLines={2}>{roadmap.goal_text}</Text>
              <View style={{ height: spacing(1) }} />
              <StreakBadge days={streak} />
            </View>
            <ProgressRing percent={percent} size={84} strokeWidth={8} />
          </View>
        </View>
      </Animated.View>

      <FlatList
        data={roadmap.days}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing(3), paddingTop: spacing(1) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status] || STATUS_META.pending;
          const disabled = item.status === "locked" || item.status === "pending";
          return (
            <TouchableOpacity
              disabled={disabled}
              activeOpacity={0.8}
              style={[
                styles.dayCard,
                item.status === "in_progress" && styles.dayCardActive,
                disabled && { opacity: 0.45 },
              ]}
              onPress={() => navigation.navigate("Lesson", { day: item })}
            >
              <View style={[styles.dayIconWrap, { borderColor: meta.color }]}>
                <Text style={styles.dayIcon}>{meta.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayNumber}>DAY {item.day_number}</Text>
                <Text style={styles.dayTitle}>{item.title}</Text>
              </View>
              {item.status === "in_progress" && <Text style={styles.chevron}>›</Text>}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { color: colors.textDim, textAlign: "center", marginTop: spacing(6) },
  header: { paddingHorizontal: spacing(3), paddingTop: spacing(2), paddingBottom: spacing(1) },
  headerTop: { flexDirection: "row", alignItems: "center", gap: spacing(2) },
  goal: { color: colors.text, fontSize: 19, fontWeight: "800", lineHeight: 25 },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing(2),
    marginBottom: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing(1.5),
  },
  dayCardActive: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dayIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, backgroundColor: colors.bgCardAlt,
  },
  dayIcon: { fontSize: 16 },
  dayNumber: { color: colors.textDim, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  dayTitle: { color: colors.text, fontSize: 15, fontWeight: "600", marginTop: 2 },
  chevron: { color: colors.primary, fontSize: 22, fontWeight: "800" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing(4) },
  emptyEmoji: { fontSize: 48, marginBottom: spacing(2) },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  emptySubtitle: { color: colors.textDim, fontSize: 14, marginTop: spacing(1), textAlign: "center" },
});
