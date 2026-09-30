import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius } from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import client from "../api/client";

export default function LessonScreen({ route, navigation }) {
  const { day } = route.params;
  const [completing, setCompleting] = useState(false);

  const handleTakeQuiz = () => {
    navigation.navigate("Quiz", { day });
  };

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      await client.post(`/roadmap/day/${day.id}/complete`);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Couldn't update", err?.response?.data?.detail || "Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing(3) }}>
        <Text style={styles.dayLabel}>Day {day.day_number}</Text>
        <Text style={styles.title}>{day.title}</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today's focus</Text>
          <Text style={styles.summary}>{day.summary}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Suggested flow</Text>
          <Step n={1} text="Read/watch core material on this topic (bring your own notes or resources)" />
          <Step n={2} text="Take the AI quiz to test your understanding" />
          <Step n={3} text="Review any weak areas the quiz surfaces" />
          <Step n={4} text="Mark the day complete to keep your streak alive" />
        </View>

        <PrimaryButton title="Take today's quiz" onPress={handleTakeQuiz} />
        <View style={{ height: spacing(1.5) }} />
        <PrimaryButton
          title="Mark day complete"
          variant="outline"
          onPress={handleMarkComplete}
          loading={completing}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ n, text }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  dayLabel: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: spacing(0.5), marginBottom: spacing(2.5) },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing(2),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing(2),
  },
  cardLabel: { color: colors.textDim, fontSize: 12, fontWeight: "700", marginBottom: spacing(1), textTransform: "uppercase" },
  summary: { color: colors.text, fontSize: 15, lineHeight: 22 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing(1.25), marginBottom: spacing(1.25) },
  stepBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primaryDim, alignItems: "center", justifyContent: "center", marginTop: 2,
  },
  stepBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  stepText: { color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 },
});
