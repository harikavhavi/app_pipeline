"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/api";
import { Input, Button } from "@/components/ui";

const ROLES: { id: Role; label: string; desc: string; accent: "purple" | "blue" | "green" }[] = [
  { id: "scout", label: "Scout", desc: "Discover, compare, and connect with athletes", accent: "purple" },
  { id: "coach", label: "Coach", desc: "Assign training plans to your connected athletes", accent: "blue" },
  { id: "federation", label: "Federation", desc: "Oversee every athlete's metrics and trends", accent: "green" },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const accent = ROLES.find((r) => r.id === role)?.accent ?? "purple";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setError("");
    setLoading(true);
    try {
      const user = await signup({ name, email, password, role });
      router.replace(`/${user.role}`);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md fade-in">
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-9 h-9 rounded-lg bg-purple/15 border border-purple/40 flex items-center justify-center">
            <span className="text-purple font-black text-base">P</span>
          </div>
          <span className="font-extrabold tracking-tight text-xl">ParaSync Insights</span>
        </div>

        {!role ? (
          <>
            <h1 className="text-2xl font-bold text-center mb-1">Join ParaSync Insights</h1>
            <p className="text-sm text-t3 text-center mb-8">This site is for scouts, coaches, and federations</p>
            <div className="grid grid-cols-1 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className="text-left p-4 rounded-xl2 border border-border bg-card hover:border-cyan/40 hover:bg-cyan/5 transition-all"
                >
                  <div className="font-bold text-t1 text-sm mb-1">{r.label}</div>
                  <div className="text-xs text-t3">{r.desc}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setRole(null)} className="text-xs text-t3 hover:text-t1 mb-5">
              ← Change role
            </button>
            <h1 className="text-2xl font-bold text-center mb-1">
              Sign up as <span className={`text-${accent} capitalize`}>{role}</span>
            </h1>
            <p className="text-sm text-t3 text-center mb-8">Create your account</p>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {error && <p className="text-red text-xs">{error}</p>}
              <Button type="submit" accent={accent} disabled={loading} className="w-full">
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-t3 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-purple font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
