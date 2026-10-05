"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Input, Button } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      router.replace(`/${user.role}`);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm fade-in">
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-9 h-9 rounded-lg bg-purple/15 border border-purple/40 flex items-center justify-center">
            <span className="text-purple font-black text-base">P</span>
          </div>
          <span className="font-extrabold tracking-tight text-xl">ParaSync Insights</span>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
        <p className="text-sm text-t3 text-center mb-8">Log in to your account</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-red text-xs">{error}</p>}
          <Button type="submit" accent="purple" disabled={loading} className="w-full">
            {loading ? "Logging in…" : "Log In"}
          </Button>
        </form>

        <p className="text-center text-sm text-t3 mt-6">
          No account?{" "}
          <Link href="/signup" className="text-purple font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
