import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors, spacing, radius } from "../theme/colors";

// Lightweight bar chart built from plain Views + Animated — no extra charting
// library needed since react-native-svg is already a dependency for other
// visuals. Good for small datasets (weekly activity, last N quiz scores).
export default function BarChart({ data, height = 120, barColor = colors.accent, valueSuffix = "" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const anims = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      60,
      data.map((d, i) =>
        Animated.timing(anims[i], {
          toValue: d.value / max,
          duration: 500,
          useNativeDriver: false,
        })
      )
    ).start();
  }, [data]);

  if (!data.length) {
    return <Text style={styles.empty}>No data yet — complete a few days to see this fill in.</Text>;
  }

  return (
    <View style={[styles.row, { height: height + 28 }]}>
      {data.map((d, i) => {
        const barHeight = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [2, height],
        });
        return (
          <View key={i} style={styles.col}>
            <Text style={styles.value}>{d.value}{valueSuffix}</Text>
            <View style={[styles.track, { height }]}>
              <Animated.View style={[styles.bar, { height: barHeight, backgroundColor: d.color || barColor }]} />
            </View>
            <Text style={styles.label}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  col: { flex: 1, alignItems: "center" },
  track: {
    width: 20,
    justifyContent: "flex-end",
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  bar: { width: "100%", borderRadius: radius.sm },
  value: { color: colors.textDim, fontSize: 10, marginBottom: 4, fontWeight: "600" },
  label: { color: colors.textDim, fontSize: 10, marginTop: spacing(0.75) },
  empty: { color: colors.textDim, fontSize: 13, textAlign: "center", paddingVertical: spacing(3) },
});
