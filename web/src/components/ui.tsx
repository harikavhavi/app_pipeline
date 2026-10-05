"use client";

import React from "react";
import Link from "next/link";
import { MetricCard as MetricCardT } from "@/lib/api";
import { groupByPillar } from "@/lib/api";

export function Card({
  children,
  className = "",
  onClick,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`bg-card border border-border rounded-xl2 ${className}`} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "cyan" | "purple" | "blue" | "green" | "orange" | "red";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-card2 text-t2 border-border",
    cyan: "bg-cyan/12 text-cyan border-cyan/30",
    purple: "bg-purple/12 text-purple border-purple/30",
    blue: "bg-blue/12 text-blue border-blue/30",
    green: "bg-green/12 text-green border-green/30",
    orange: "bg-orange/12 text-orange border-orange/30",
    red: "bg-red/12 text-red border-red/30",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  accent = "cyan",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  accent?: "cyan" | "purple" | "blue" | "green";
}) {
  const accentSolid: Record<string, string> = {
    cyan: "bg-cyan text-black hover:brightness-110",
    purple: "bg-purple text-black hover:brightness-110",
    blue: "bg-blue text-black hover:brightness-110",
    green: "bg-green text-black hover:brightness-110",
  };
  const accentSoft: Record<string, string> = {
    cyan: "bg-cyan/12 text-cyan border border-cyan/30 hover:bg-cyan/20",
    purple: "bg-purple/12 text-purple border border-purple/30 hover:bg-purple/20",
    blue: "bg-blue/12 text-blue border border-blue/30 hover:bg-blue/20",
    green: "bg-green/12 text-green border border-green/30 hover:bg-green/20",
  };
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const style =
    variant === "primary" ? accentSolid[accent] : variant === "secondary" ? accentSoft[accent] : "text-t2 hover:text-t1 hover:bg-card2";
  return (
    <button className={`${base} ${style} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ScoreRing({ score, size = 56, accentClass = "text-cyan" }: { score: number; size?: number; accentClass?: string }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = score >= 70 ? "text-green" : score >= 40 ? "text-orange" : "text-red";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={4} fill="none" className="text-border" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="currentColor"
        strokeWidth={4}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round"
        className={color}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        className="fill-current text-t1"
        style={{ fontSize: size * 0.32, fontWeight: 800 }}
      >
        {score}
      </text>
    </svg>
  );
}

export function StatCard({ label, value, accentClass = "text-cyan" }: { label: string; value: React.ReactNode; accentClass?: string }) {
  return (
    <Card className="p-5 flex-1">
      <div className={`text-2xl font-extrabold ${accentClass}`}>{value}</div>
      <div className="text-xs text-t3 mt-1">{label}</div>
    </Card>
  );
}

export function SessionRow({
  href,
  sport,
  date,
  duration,
  score,
  subtitle,
}: {
  href: string;
  sport: string;
  date: string;
  duration?: string;
  score: number;
  subtitle?: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 flex items-center justify-between hover:border-t3/40 transition-colors mb-3 group">
        <div>
          <div className="font-semibold capitalize group-hover:text-cyan transition-colors">{sport?.replace(/_/g, " ")}</div>
          <div className="text-xs text-t3 mt-1">
            {date} {duration ? `· ${duration}` : ""}
          </div>
          {subtitle && <div className="text-xs text-t2 mt-1.5">{subtitle}</div>}
        </div>
        <ScoreRing score={score} size={48} />
      </Card>
    </Link>
  );
}

export function PillarSection({ title, cards, accentClass = "text-cyan" }: { title: string; cards: MetricCardT[]; accentClass?: string }) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${accentClass.replace("text-", "bg-")}`} />
        <h3 className="text-sm font-bold text-t1">{title}</h3>
        <span className="text-xs text-t3">{cards.length}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="text-[10px] text-t3 uppercase tracking-wide mb-2 truncate">{c.label}</div>
            <div className="text-lg font-extrabold text-t1">
              {typeof c.value === "number" ? c.value.toFixed(1) : c.value}
              {c.unit && <span className="text-xs text-t3 font-normal ml-1">{c.unit}</span>}
            </div>
            {c.score != null && (
              <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full ${accentClass.replace("text-", "bg-")}`}
                  style={{ width: `${Math.max(0, Math.min(100, c.score))}%` }}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export function MetricsByPillar({ cards, accentClass }: { cards: MetricCardT[]; accentClass?: string }) {
  const pillars = groupByPillar(cards);
  if (!pillars.length) return <p className="text-t3 text-sm">No metrics recorded for this session.</p>;
  return (
    <>
      {pillars.map(([name, group]) => (
        <PillarSection key={name} title={name} cards={group} accentClass={accentClass} />
      ))}
    </>
  );
}

export function EmptyState({ icon, title, sub, action }: { icon: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <Card className="p-12 flex flex-col items-center text-center">
      <div className="text-t3 mb-4">{icon}</div>
      <div className="font-bold text-t1 mb-1.5">{title}</div>
      {sub && <div className="text-sm text-t3 max-w-sm">{sub}</div>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <div className={`w-6 h-6 rounded-full border-2 border-cyan/25 border-t-cyan animate-spin ${className}`} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-card2 border border-border rounded-xl px-4 py-3 text-sm text-t1 placeholder:text-t3 outline-none focus:border-cyan/50 transition-colors ${props.className ?? ""}`}
    />
  );
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-card2 border border-border rounded-xl px-4 py-3 text-sm text-t1 outline-none focus:border-cyan/50 transition-colors ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}
