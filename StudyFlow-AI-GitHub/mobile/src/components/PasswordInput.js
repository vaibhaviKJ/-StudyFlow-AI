import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme/colors";

export default function PasswordInput({ value, onChangeText, placeholder = "Password" }) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity
        style={styles.eyeButton}
        onPress={() => setVisible((v) => !v)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.eyeIcon}>{visible ? "🙈" : "👁️"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing(1.5),
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.75),
  },
  eyeButton: { paddingHorizontal: spacing(1.5) },
  eyeIcon: { fontSize: 18 },
});
