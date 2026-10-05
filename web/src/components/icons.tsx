// Minimal inline icon set (no external icon package needed) — stroke-based, currentColor.
import React from "react";

type P = { size?: number; className?: string };
const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconHome = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>
);
export const IconUpload = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 20h16" /></svg>
);
export const IconChart = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 20V10" /><path d="M12 20V4" /><path d="M20 20v-6" /></svg>
);
export const IconLink = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M9 17H7a5 5 0 0 1 0-10h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /><path d="M8 12h8" /></svg>
);
export const IconUser = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>
);
export const IconSearch = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
);
export const IconStar = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" /></svg>
);
export const IconMessage = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M21 12a8 8 0 1 1-3.6-6.7L21 4l-1 4.3A8 8 0 0 1 21 12z" /></svg>
);
export const IconBell = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);
export const IconLock = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const IconCheck = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M20 6L9 17l-5-5" /></svg>
);
export const IconClock = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
);
export const IconArrowRight = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
);
export const IconArrowLeft = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M19 12H5" /><path d="M11 18l-6-6 6-6" /></svg>
);
export const IconVideo = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M21 8l-5 4 5 4z" /></svg>
);
export const IconVideoOff = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 3l18 18" /><path d="M21 8l-5 4v4a2 2 0 0 1-2 2H6" /><path d="M3 8v8a2 2 0 0 0 2 2h4" /></svg>
);
export const IconLogout = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);
export const IconTrophy = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M5 5H3v2a4 4 0 0 0 4 4" /><path d="M19 5h2v2a4 4 0 0 1-4 4" /><path d="M10 15h4v3h-4z" /><path d="M8 21h8" /></svg>
);
export const IconEye = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconCalendar = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M8 3v4M16 3v4" /></svg>
);
export const IconUsers = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.5 3.8-5.5 6.5-5.5s5.5 2 6.5 5.5" /><circle cx="17.5" cy="9" r="2.7" /><path d="M15.8 14.2c2.2.3 4 2 4.7 4.3" /></svg>
);
export const IconBarChart = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 20V10" /><path d="M12 20V4" /><path d="M20 20v-6" /><path d="M2 20h20" /></svg>
);
export const IconInbox = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 12h4l2 3h6l2-3h4" /><path d="M5 5h14l2 7v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7z" /></svg>
);
export const IconTrend = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
);
