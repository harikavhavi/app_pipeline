"use client";

import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend,
} from "recharts";
import { Series } from "./TrendLineChart";

export default function RadarCompareChart({
  data,
  series,
  height = 340,
}: {
  data: Record<string, any>[];
  series: Series[];
  height?: number;
}) {
  if (!data.length) {
    return <div className="h-[200px] flex items-center justify-center text-t3 text-sm">No comparable metrics yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
        <PolarGrid stroke="#232838" />
        <PolarAngleAxis dataKey="label" stroke="#9aa3b8" fontSize={11} />
        <PolarRadiusAxis domain={[0, 100]} stroke="#6b7385" fontSize={10} tickCount={5} />
        {series.map((s) => (
          <Radar key={s.key} name={s.name} dataKey={s.key} stroke={s.color} fill={s.color} fillOpacity={0.15} strokeWidth={2} />
        ))}
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip contentStyle={{ background: "#12151f", border: "1px solid #232838", borderRadius: 10, fontSize: 12 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
