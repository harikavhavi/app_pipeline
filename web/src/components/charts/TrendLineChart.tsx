"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

export interface Series {
  key: string;
  color: string;
  name: string;
}

export default function TrendLineChart({
  data,
  series,
  height = 220,
  unit = "",
}: {
  data: Record<string, any>[];
  series: Series[];
  height?: number;
  unit?: string;
}) {
  if (!data.length) {
    return <div className="h-[160px] flex items-center justify-center text-t3 text-sm">Not enough session history yet</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232838" vertical={false} />
        <XAxis dataKey="label" stroke="#6b7385" fontSize={11} tickLine={false} axisLine={{ stroke: "#232838" }} />
        <YAxis stroke="#6b7385" fontSize={11} tickLine={false} axisLine={false} width={40} />
        <Tooltip
          contentStyle={{ background: "#12151f", border: "1px solid #232838", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "#9aa3b8" }}
          formatter={(value: number) => [`${value}${unit ? " " + unit : ""}`, ""]}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: "#9aa3b8" }} />}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
