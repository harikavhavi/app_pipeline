import React from "react";
import { View, Dimensions } from "react-native";
import Svg, { Polygon, Circle as SvgCircle, Text as SvgText, Line } from "react-native-svg";
import { Colors } from "../../constants/colors";

const SIZE = Math.min(Dimensions.get("window").width - 64, 280);
const CENTER = SIZE / 2;
const R = SIZE * 0.38;
const DEFAULT_AXES = ["Speed", "Symmetry", "Reaction", "Stability", "Technique", "Endurance"];

const toXY = (angle: number, r: number) => ({ x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) });

interface Props {
  /** Single dataset (legacy) */
  values?: number[];
  /** Multi-dataset: primary (current session) values */
  current?: number[];
  /** Multi-dataset: secondary (best) values */
  best?: number[];
  /** Axis labels — overrides default */
  labels?: string[];
  accent?: string;
  secondaryAccent?: string;
}

export const RadarChart: React.FC<Props> = ({
  values,
  current,
  best,
  labels = DEFAULT_AXES,
  accent = Colors.cyan,
  secondaryAccent = Colors.purple,
}) => {
  const n = labels.length;
  const primaryVals = current ?? values ?? Array(n).fill(50);
  const secondaryVals = best;

  const makePoly = (vals: number[]) =>
    vals.map((v, i) => {
      const a = (2 * Math.PI * i / n) - Math.PI / 2;
      return toXY(a, (Math.min(v, 100) / 100) * R);
    });

  const primaryPts = makePoly(primaryVals);
  const secondaryPts = secondaryVals ? makePoly(secondaryVals) : null;

  const toPoly = (pts: { x: number; y: number }[]) => pts.map(p => `${p.x},${p.y}`).join(" ");

  const grids = [0.25, 0.5, 0.75, 1].map(f => {
    const gpts = labels.map((_, i) => {
      const a = (2 * Math.PI * i / n) - Math.PI / 2;
      return toXY(a, R * f);
    });
    return toPoly(gpts);
  });

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={SIZE} height={SIZE}>
        {/* Grid rings */}
        {grids.map((gp, gi) => (
          <Polygon key={gi} points={gp} fill="none" stroke={Colors.border2} strokeWidth={1} />
        ))}
        {/* Axis lines */}
        {labels.map((_, i) => {
          const a = (2 * Math.PI * i / n) - Math.PI / 2;
          const end = toXY(a, R);
          return <Line key={i} x1={CENTER} y1={CENTER} x2={end.x} y2={end.y} stroke={Colors.border2} strokeWidth={1} />;
        })}
        {/* Secondary (best) fill */}
        {secondaryPts && (
          <Polygon points={toPoly(secondaryPts)} fill={`${secondaryAccent}18`} stroke={secondaryAccent} strokeWidth={1.5} />
        )}
        {/* Primary fill */}
        <Polygon points={toPoly(primaryPts)} fill={`${accent}22`} stroke={accent} strokeWidth={2} />
        {/* Dots */}
        {primaryPts.map((p, i) => <SvgCircle key={i} cx={p.x} cy={p.y} r={4} fill={accent} />)}
        {/* Axis labels */}
        {labels.map((lbl, i) => {
          const a = (2 * Math.PI * i / n) - Math.PI / 2;
          const pos = toXY(a, R + 22);
          return (
            <SvgText key={i} x={pos.x} y={pos.y} textAnchor="middle" fill={Colors.t2} fontSize={10}>
              {lbl}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

export default RadarChart;
