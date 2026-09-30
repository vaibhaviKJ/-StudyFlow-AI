import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors, radius, spacing } from "../theme/colors";

export default function StreakBadge({ days = 0 }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (days <= 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(1400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [days]);

  return (
    <View style={styles.wrap}>
      <Animated.Text style={[styles.fire, { transform: [{ scale: pulse }] }]}>🔥</Animated.Text>
      <Text style={styles.text}>{days}-day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCardAlt,
    paddingVertical: spacing(0.75),
    paddingHorizontal: spacing(1.5),
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
  },
  fire: { fontSize: 16, marginRight: 6 },
  text: { color: colors.gold, fontWeight: "700", fontSize: 13 },
});
