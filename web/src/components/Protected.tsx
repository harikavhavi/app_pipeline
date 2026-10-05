"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, ALLOWED_ROLES } from "@/lib/auth";
import { Role } from "@/lib/api";

export default function Protected({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!ALLOWED_ROLES.includes(user.role)) { logout(); router.replace("/login"); return; }
    if (user.role !== role) router.replace(`/${user.role}`);
  }, [user, loading, role, router, logout]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan/30 border-t-cyan animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
