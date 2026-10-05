// ParaSync 2.0 — Design Tokens
export const Colors = {
  cyan:    '#00d4ff',
  cyanDim: '#00a8cc',
  blue:    '#3b82f6',
  blueDim: '#2563eb',
  purple:  '#a855f7',
  purpleDim:'#9333ea',
  orange:  '#f97316',
  orangeDim:'#ea6f0f',
  red:     '#ef4444',
  green:   '#22c55e',
  greenDim:'#16a34a',
  yellow:  '#eab308',
  bg:   '#000000',
  bg1:  '#080810',
  bg2:  '#0f0f1a',
  bg3:  '#13131f',
  card:    '#0e0e1c',
  card2:   '#141428',
  card3:   '#1a1a30',
  border:  'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  borderCyan: 'rgba(0,212,255,0.25)',
  white:   '#ffffff',
  t1:      'rgba(255,255,255,0.90)',
  t2:      'rgba(255,255,255,0.55)',
  t3:      'rgba(255,255,255,0.30)',
  t4:      'rgba(255,255,255,0.15)',
  glowCyan:   'rgba(0,212,255,0.15)',
  glowBlue:   'rgba(59,130,246,0.15)',
  glowPurple: 'rgba(168,85,247,0.15)',
  glowOrange: 'rgba(249,115,22,0.15)',
};
export const RoleAccent: Record<string, string> = {
  athlete:    Colors.cyan,
  coach:      Colors.blue,
  scout:      Colors.purple,
  federation: Colors.orange,
  guest:      Colors.t2,
};
export const RoleGlow: Record<string, string> = {
  athlete:    Colors.glowCyan,
  coach:      Colors.glowBlue,
  scout:      Colors.glowPurple,
  federation: Colors.glowOrange,
  guest:      'rgba(255,255,255,0.05)',
};
export const ScoreColor = (score: number): string => {
  if (score >= 80) return Colors.green;
  if (score >= 60) return Colors.cyan;
  if (score >= 40) return Colors.yellow;
  return Colors.red;
};
