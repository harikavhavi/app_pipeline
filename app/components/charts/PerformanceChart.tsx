import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Polyline, Circle as SvgCircle } from "react-native-svg";
import { Colors } from "../../constants/colors";

const W = Dimensions.get("window").width - 48;
const H = 140;

interface Props {
  data: number[];
  accent?: string;
  color?: string;   // alias for accent
  label?: string;   // optional chart label shown above
}

export const PerformanceChart: React.FC<Props> = ({ data, accent, color, label }) => {
  const lineColor = accent ?? color ?? Colors.cyan;
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * W;
    const y = H - ((v - min) / range) * (H - 20) - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: lineColor }]}>{label}</Text> : null}
      <Svg width={W} height={H}>
        <Polyline points={pts} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => {
          const x = (i / (data.length - 1 || 1)) * W;
          const y = H - ((v - min) / range) * (H - 20) - 10;
          return <SvgCircle key={i} cx={x} cy={y} r={4} fill={lineColor} />;
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { overflow: "hidden" },
  label: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3, marginBottom: 6, textTransform: "uppercase" },
});

export default PerformanceChart;
