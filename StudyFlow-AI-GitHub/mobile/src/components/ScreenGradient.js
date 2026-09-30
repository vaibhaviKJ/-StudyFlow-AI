import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

// Subtle multi-stop gradient used behind every screen for a "premium" depth feel.
export default function ScreenGradient({ children, style, variant = "default" }) {
  const stops = {
    default: ["#0B0F1A", "#121834", "#0B0F1A"],
    auth: ["#0B0F1A", "#1A1440", "#0B0F1A"],
    success: ["#0B0F1A", "#0F2E2A", "#0B0F1A"],
  };
  return (
    <LinearGradient
      colors={stops[variant] || stops.default}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.fill, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
