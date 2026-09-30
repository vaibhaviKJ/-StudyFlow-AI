import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius } from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import AmbientGlow from "../components/AmbientGlow";
import client from "../api/client";

const SUGGESTIONS = [
  "Crack a Python developer interview in 30 days",
  "Pass my DBMS final exam",
  "Learn React from scratch in 3 weeks",
  "Prepare for a machine learning internship",
];

export default function GoalSetupScreen({ navigation }) {
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!goal.trim()) {
      Alert.alert("Add a goal", "Tell StudyFlow what you're working toward.");
      return;
    }
    const duration = parseInt(days, 10) || 30;
    setLoading(true);
    try {
      const res = await client.post("/roadmap/generate", {
        goal_text: goal.trim(),
        duration_days: duration,
      });
      navigation.replace("MainTabs", { screen: "Roadmap", params: { roadmapId: res.data.id } });
    } catch (err) {
      if (err?.response?.status === 402) {
        navigation.navigate("Paywall");
      } else {
        Alert.alert(
          "Couldn't generate roadmap",
          err?.response?.data?.detail || "Could not reach the server. Is the backend running?"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AmbientGlow />
      <ScrollView contentContainerStyle={{ padding: spacing(3) }}>
        <Text style={styles.title}>What's your goal?</Text>
        <Text style={styles.subtitle}>
          Be specific — a deadline helps StudyFlow build a sharper plan.
        </Text>

        <TextInput
          style={styles.textarea}
          placeholder="e.g. I have an interview in 30 days for a Python developer role"
          placeholderTextColor={colors.textDim}
          value={goal}
          onChangeText={setGoal}
          multiline
        />

        <Text style={styles.label}>Plan length (days)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={days}
          onChangeText={setDays}
        />

        <Text style={styles.label}>Or try a suggestion</Text>
        <View style={styles.chips}>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity key={s} style={styles.chip} onPress={() => setGoal(s)}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: spacing(2) }} />
        <PrimaryButton title="Generate my roadmap" onPress={handleGenerate} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: "800" },
  subtitle: { color: colors.textDim, marginTop: spacing(1), marginBottom: spacing(2.5) },
  textarea: {
    backgroundColor: colors.bgCard,
    color: colors.text,
    borderRadius: radius.md,
    padding: spacing(2),
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing(2),
  },
  label: { color: colors.textDim, marginBottom: spacing(1), fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: colors.bgCard,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing(2.5),
    width: 120,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1) },
  chip: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(1.75),
    paddingVertical: spacing(1),
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.textDim, fontSize: 12.5 },
});
