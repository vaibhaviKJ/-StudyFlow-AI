import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius } from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";
import ProgressBar from "../components/ProgressBar";
import ProgressRing from "../components/ProgressRing";
import Confetti from "../components/Confetti";
import AdBanner from "../components/AdBanner";
import client from "../api/client";

export default function QuizScreen({ route, navigation }) {
  const { day, initialQuestions, quizTitle } = route.params;
  const [questions, setQuestions] = useState(initialQuestions || null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [isPro, setIsPro] = useState(true); // assume pro until we know otherwise, to avoid a flash of the ad banner
  const [bonusRound, setBonusRound] = useState(false);
  const [bonusLoading, setBonusLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    client.get("/auth/me").then((res) => setIsPro(res.data.is_pro)).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialQuestions) return;
    (async () => {
      try {
        const res = await client.post("/quiz/generate", {
          roadmap_day_id: day.id,
          num_questions: 5,
        });
        setQuestions(res.data.questions);
      } catch (err) {
        Alert.alert("Couldn't load quiz", err?.response?.data?.detail || "Please try again.");
        navigation.goBack();
      }
    })();
  }, [initialQuestions]);

  const handleNext = async () => {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      setSubmitting(true);
      try {
        const res = await client.post("/quiz/submit", {
          roadmap_day_id: day.id,
          answers: newAnswers,
          questions,
        });
        setResult(res.data);
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
      } catch (err) {
        Alert.alert("Couldn't submit quiz", err?.response?.data?.detail || "Please try again.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleWatchAd = async () => {
    setBonusLoading(true);
    try {
      // Placeholder for a real rewarded-ad SDK call — swap this timeout for
      // e.g. RewardedAd.show() and call the block below in its onEarnedReward.
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const res = await client.post("/quiz/generate", {
        roadmap_day_id: day.id,
        num_questions: 5,
      });
      setQuestions(res.data.questions);
      setIndex(0);
      setAnswers([]);
      setSelected(null);
      setResult(null);
      setBonusRound(true);
      scaleAnim.setValue(0.5);
    } catch (err) {
      Alert.alert("Couldn't load bonus questions", "Please try again.");
    } finally {
      setBonusLoading(false);
    }
  };

  if (!questions) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(6) }} />
      </SafeAreaView>
    );
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    const celebrate = pct >= 70;
    return (
      <SafeAreaView style={styles.container}>
        {celebrate && <Confetti />}
        <View style={styles.resultWrap}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <ProgressRing
              percent={pct}
              size={140}
              strokeWidth={12}
              color={celebrate ? colors.accent : colors.gold}
            />
          </Animated.View>
          <View style={{ height: spacing(2) }} />
          {bonusRound && <Text style={styles.bonusTag}>BONUS ROUND</Text>}
          <Text style={styles.resultEmoji}>{celebrate ? "🎉" : "💪"}</Text>
          <Text style={styles.resultScore}>{result.score} / {result.total}</Text>
          <Text style={styles.resultLabel}>{celebrate ? "Great work!" : "Keep going — you'll get there"}</Text>

          {result.weak_topics.length > 0 && (
            <View style={styles.weakBox}>
              <Text style={styles.weakTitle}>Focus areas for revision</Text>
              {result.weak_topics.map((t) => (
                <Text key={t} style={styles.weakItem}>• {t}</Text>
              ))}
            </View>
          )}

          {!isPro && !bonusRound && (
            <>
              <View style={{ height: spacing(2.5) }} />
              <AdBanner onWatchAd={handleWatchAd} loading={bonusLoading} />
            </>
          )}

          <View style={{ height: spacing(3) }} />
          <PrimaryButton
            title="Back to roadmap"
            onPress={() => navigation.navigate("MainTabs", { screen: "Roadmap", params: { roadmapId: day.roadmap_id } })}
          />
        </View>
      </SafeAreaView>
    );
  }

  const q = questions[index];

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: spacing(3) }}>
        <Text style={styles.progressText}>{quizTitle || "Daily quiz"} - Question {index + 1} of {questions.length}</Text>
        <ProgressBar percent={((index) / questions.length) * 100} />

        <Text style={styles.question}>{q.question}</Text>

        {q.options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.option, selected === i && styles.optionSelected]}
            onPress={() => setSelected(i)}
          >
            <Text style={[styles.optionText, selected === i && styles.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: spacing(2) }} />
        <PrimaryButton
          title={index + 1 === questions.length ? "Submit quiz" : "Next question"}
          onPress={handleNext}
          disabled={selected === null}
          loading={submitting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  progressText: { color: colors.textDim, fontSize: 13, marginBottom: spacing(1) },
  question: { color: colors.text, fontSize: 18, fontWeight: "700", marginVertical: spacing(2.5), lineHeight: 25 },
  option: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing(2),
    marginBottom: spacing(1.25), borderWidth: 1.5, borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.bgCardAlt },
  optionText: { color: colors.text, fontSize: 14.5 },
  optionTextSelected: { color: colors.text, fontWeight: "700" },
  resultWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing(3) },
  resultEmoji: { fontSize: 56, marginBottom: spacing(1) },
  bonusTag: {
    color: colors.gold, fontWeight: "800", fontSize: 11, letterSpacing: 1,
    marginBottom: spacing(0.5),
  },
  resultScore: { color: colors.text, fontSize: 34, fontWeight: "800" },
  resultLabel: { color: colors.textDim, fontSize: 15, marginTop: spacing(0.5) },
  weakBox: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing(2),
    marginTop: spacing(3), width: "100%", borderWidth: 1, borderColor: colors.border,
  },
  weakTitle: { color: colors.gold, fontWeight: "700", marginBottom: spacing(1) },
  weakItem: { color: colors.text, fontSize: 14, marginBottom: 4 },
});
