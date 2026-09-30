import React from "react";
import { View, StyleSheet } from "react-native";
import { colors, radius } from "../theme/colors";

export default function ProgressBar({ percent = 0, color = colors.accent, height = 10 }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: colors.bgCardAlt,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
