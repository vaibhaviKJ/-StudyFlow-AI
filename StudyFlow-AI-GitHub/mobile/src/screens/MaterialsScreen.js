import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import client from "../api/client";
import { colors, radius, spacing } from "../theme/colors";
import PrimaryButton from "../components/PrimaryButton";

export default function MaterialsScreen({ navigation }) {
  const [materials, setMaterials] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [revealedCard, setRevealedCard] = useState(null);

  const loadMaterials = useCallback(async () => {
    try {
      const response = await client.get("/materials");
      setMaterials(response.data);
    } catch {
      Alert.alert("Couldn't load materials", "Check that the backend is running and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadMaterials(); }, [loadMaterials]));

  const openMaterial = async (id) => {
    try {
      const response = await client.get(`/materials/${id}`);
      setSelected(response.data);
      setRevealedCard(null);
    } catch {
      Alert.alert("Couldn't open material", "Please try again.");
    }
  };

  const uploadPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const form = new FormData();
    form.append("file", { uri: asset.uri, name: asset.name || "study-material.pdf", type: asset.mimeType || "application/pdf" });
    setUploading(true);
    try {
      const response = await client.post("/materials/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setSelected(response.data);
      setRevealedCard(null);
      await loadMaterials();
    } catch (error) {
      Alert.alert("Upload failed", error?.response?.data?.detail || "Choose a text-based PDF under 10 MB.");
    } finally {
      setUploading(false);
    }
  };

  const startMaterialQuiz = async () => {
    setGenerating(true);
    try {
      const response = await client.post(`/materials/${selected.id}/questions`, { num_questions: 10 });
      navigation.navigate("Quiz", { day: { id: response.data.roadmap_day_id }, initialQuestions: response.data.questions, quizTitle: selected.filename });
    } catch (error) {
      Alert.alert("Couldn't start quiz", error?.response?.data?.detail || "Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (selected) {
    return <SafeAreaView style={styles.container}><FlatList data={selected.flashcards} keyExtractor={(_, index) => String(index)} contentContainerStyle={styles.listContent}
      ListHeaderComponent={<View><TouchableOpacity onPress={() => setSelected(null)}><Text style={styles.back}>Back to materials</Text></TouchableOpacity><Text style={styles.title} numberOfLines={2}>{selected.filename}</Text><View style={styles.summaryCard}><Text style={styles.sectionLabel}>AI SUMMARY</Text><Text style={styles.summary}>{selected.summary}</Text></View><Text style={styles.sectionLabel}>IMPORTANT TOPICS</Text><View style={styles.topicWrap}>{selected.important_topics.map((topic) => <View key={topic} style={styles.topic}><Text style={styles.topicText}>{topic}</Text></View>)}</View><PrimaryButton title="Generate 10 MCQs" onPress={startMaterialQuiz} loading={generating} /><View style={{ height: spacing(1.25) }} /><PrimaryButton title="Ask tutor about this PDF" variant="outline" onPress={() => navigation.navigate("Assistant", { material: selected })} /><Text style={styles.sectionTitle}>Flashcards</Text><Text style={styles.helper}>Tap a card to reveal the answer.</Text></View>}
      renderItem={({ item, index }) => { const revealed = revealedCard === index; return <TouchableOpacity style={styles.flashcard} onPress={() => setRevealedCard(revealed ? null : index)} activeOpacity={0.85}><Text style={styles.cardSide}>{revealed ? "ANSWER" : "QUESTION"}</Text><Text style={styles.cardText}>{revealed ? item.answer : item.question}</Text></TouchableOpacity>; }}
      ListFooterComponent={<View style={{ height: spacing(3) }} />} /></SafeAreaView>;
  }

  return <SafeAreaView style={styles.container}><View style={styles.header}><Text style={styles.title}>Study materials</Text><Text style={styles.subtitle}>Turn your PDF notes into a focused study pack.</Text><View style={{ height: spacing(2) }} /><PrimaryButton title="Upload PDF" onPress={uploadPdf} loading={uploading} /></View>{loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing(5) }} /> : <FlatList data={materials} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.listContent} ListEmptyComponent={<Text style={styles.empty}>Upload your first PDF to get a summary, flashcards, and practice questions.</Text>} renderItem={({ item }) => <TouchableOpacity style={styles.materialRow} onPress={() => openMaterial(item.id)}><View style={styles.fileMark}><Text style={styles.fileMarkText}>PDF</Text></View><View style={{ flex: 1 }}><Text style={styles.fileName} numberOfLines={1}>{item.filename}</Text><Text style={styles.fileTopics} numberOfLines={1}>{item.important_topics.join(" | ")}</Text></View><Text style={styles.chevron}>{">"}</Text></TouchableOpacity>} />}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg }, header: { padding: spacing(3), paddingBottom: spacing(1) }, title: { color: colors.text, fontSize: 25, fontWeight: "800" }, subtitle: { color: colors.textDim, fontSize: 14, lineHeight: 20, marginTop: spacing(0.75) }, listContent: { padding: spacing(3), paddingTop: spacing(2) }, materialRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing(2), marginBottom: spacing(1.5), gap: spacing(1.5) }, fileMark: { width: 42, height: 42, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryDim }, fileMarkText: { color: "#fff", fontSize: 11, fontWeight: "800" }, fileName: { color: colors.text, fontSize: 15, fontWeight: "700" }, fileTopics: { color: colors.textDim, fontSize: 12, marginTop: 3 }, chevron: { color: colors.primary, fontSize: 20 }, empty: { color: colors.textDim, textAlign: "center", lineHeight: 21, marginTop: spacing(5), paddingHorizontal: spacing(2) }, back: { color: colors.primary, fontSize: 14, fontWeight: "700", marginBottom: spacing(2) }, summaryCard: { backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing(2), marginTop: spacing(2), marginBottom: spacing(2) }, sectionLabel: { color: colors.textDim, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: spacing(1) }, summary: { color: colors.text, fontSize: 14.5, lineHeight: 22 }, topicWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1), marginBottom: spacing(2.5) }, topic: { backgroundColor: colors.bgCardAlt, borderRadius: radius.pill, paddingHorizontal: spacing(1.25), paddingVertical: spacing(0.75) }, topicText: { color: colors.primary, fontSize: 12, fontWeight: "700" }, sectionTitle: { color: colors.text, fontSize: 19, fontWeight: "800", marginTop: spacing(3) }, helper: { color: colors.textDim, fontSize: 13, marginTop: spacing(0.5), marginBottom: spacing(1.5) }, flashcard: { minHeight: 120, backgroundColor: colors.bgCard, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing(2), marginBottom: spacing(1.5), justifyContent: "center" }, cardSide: { color: colors.primary, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginBottom: spacing(1) }, cardText: { color: colors.text, fontSize: 15, lineHeight: 22 },
});
