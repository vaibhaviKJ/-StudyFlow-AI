import React from "react";
import { StyleSheet, Dimensions } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { colors } from "../theme/colors";

const { width, height } = Dimensions.get("window");

// Soft layered glow blobs — gives screens a sense of depth without any
// images or extra native dependencies (pure SVG gradients).
export default function AmbientGlow() {
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      <Defs>
        <RadialGradient id="glowPrimary" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glowAccent" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.25" />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={width * 0.15} cy={height * 0.08} r={width * 0.55} fill="url(#glowPrimary)" />
      <Circle cx={width * 0.9} cy={height * 0.35} r={width * 0.45} fill="url(#glowAccent)" />
    </Svg>
  );
}
