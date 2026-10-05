import React, { useRef, useEffect } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { ScoreColor, Colors } from "../../constants/colors";

interface Props { score: number; height?: number; color?: string; style?: ViewStyle; }

export const BarMetric: React.FC<Props> = ({ score, height = 4, color, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const barColor = color ?? ScoreColor(score);

  useEffect(() => {
    Animated.timing(anim, { toValue: score / 100, duration: 1200, useNativeDriver: false }).start();
  }, [score]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={[styles.track, { height }, style]}>
      <Animated.View style={[styles.fill, { width, height, backgroundColor: barColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { backgroundColor: Colors.border, borderRadius: 9999, overflow: "hidden" },
  fill: { borderRadius: 9999 },
});
