import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, radius } from "../theme/colors";
import client from "../api/client";

const STARTER_PROMPTS = [
  "What should I focus on today?",
  "Why do I keep struggling with this?",
  "I feel like giving up",
];

export default function AssistantScreen({ route }) {
  const material = route.params?.material;
  const [messages, setMessages] = useState([
    { id: "welcome", role: "assistant", text: "Hi! Ask me what to focus on, why something feels hard, or how your weak areas are trending." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = { id: `u-${Date.now()}`, role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await client.post("/assistant/ask", { message: trimmed, material_id: material?.id });
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: res.data.reply, poweredBy: res.data.powered_by },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: "I couldn't reach the server just now — try again in a moment." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Assistant 🤖</Text>
        <Text style={styles.subtitle}>Grounded in your real quiz history — not generic advice</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing(2), gap: spacing(1.25) }}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>
            <Text style={item.role === "user" ? styles.bubbleTextUser : styles.bubbleText}>{item.text}</Text>
          </View>
        )}
      />

      {messages.length <= 1 && (
        <View style={styles.starterRow}>
          {STARTER_PROMPTS.map((p) => (
            <TouchableOpacity key={p} style={styles.starterChip} onPress={() => send(p)}>
              <Text style={styles.starterText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask something..."
            placeholderTextColor={colors.textDim}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => send(input)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendText}>➤</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing(2.5), paddingTop: spacing(2), paddingBottom: spacing(1) },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  subtitle: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  bubble: { maxWidth: "85%", padding: spacing(1.5), borderRadius: radius.md },
  bubbleAssistant: { backgroundColor: colors.bgCard, alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border },
  bubbleUser: { backgroundColor: colors.primary, alignSelf: "flex-end" },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: "#fff", fontSize: 14, lineHeight: 20 },
  starterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing(1), paddingHorizontal: spacing(2), paddingBottom: spacing(1) },
  starterChip: {
    backgroundColor: colors.bgCardAlt, borderRadius: radius.pill, paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75), borderWidth: 1, borderColor: colors.border,
  },
  starterText: { color: colors.textDim, fontSize: 12 },
  inputRow: {
    flexDirection: "row", alignItems: "center", padding: spacing(1.5), gap: spacing(1),
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, backgroundColor: colors.bgCard, color: colors.text, borderRadius: radius.pill,
    paddingHorizontal: spacing(2), paddingVertical: spacing(1.25), borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  sendText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
