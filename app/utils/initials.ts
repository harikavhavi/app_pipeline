export const getInitials = (name: string): string => {
  if (!name) return "??";
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").slice(0,2).join("");
};
