import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing } from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const PIECES = ["🎉", "✨", "⭐", "🔥", "🎊"];

function Piece({ startX, delay, emoji }) {
  const translateY = useRef(new Animated.Value(-40)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 120;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 420 + Math.random() * 200,
          duration: 2200 + Math.random() * 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: drift,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: Math.random() > 0.5 ? 1 : -1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 2200,
          delay: 1400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const rotateStr = rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-180deg", "180deg"] });

  return (
    <Animated.Text
      style={{
        position: "absolute",
        top: 0,
        left: startX,
        fontSize: 22,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: rotateStr }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function Confetti({ count = 18 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        startX: Math.random() * SCREEN_W,
        delay: Math.random() * 300,
        emoji: PIECES[i % PIECES.length],
      })),
    [count]
  );

  return (
    <>
      {pieces.map((p) => (
        <Piece key={p.id} startX={p.startX} delay={p.delay} emoji={p.emoji} />
      ))}
    </>
  );
}
