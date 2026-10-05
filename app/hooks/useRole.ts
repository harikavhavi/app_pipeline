import { useAuthStore } from "../store/auth.store";
import { RoleAccent, RoleGlow } from "../constants/colors";
export const useRole = () => {
  const role = useAuthStore(s=>s.role) ?? "guest";
  return { role, accent: RoleAccent[role] ?? RoleAccent.guest, glow: RoleGlow[role] ?? RoleGlow.guest };
};
