"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import { Series } from "./TrendLineChart";

export default function CompareBarChart({
  data,
  series,
  height = 240,
}: {
  data: Record<string, any>[];
  series: Series[];
  height?: number;
}) {
  if (!data.length) {
    return <div className="h-[160px] flex items-center justify-center text-t3 text-sm">No comparable metrics yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
        <XAxis dataKey="label" stroke="#6b7385" fontSize={11} tickLine={false} axisLine={{ stroke: "#232838" }} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis stroke="#6b7385" fontSize={11} tickLine={false} axisLine={false} width={36} domain={[0, 100]} />
        <Tooltip
          contentStyle={{ background: "#12151f", border: "1px solid #232838", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "#9aa3b8" }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#9aa3b8" }} />
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
