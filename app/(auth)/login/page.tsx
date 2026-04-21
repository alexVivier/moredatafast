"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import {
  AuthDivider,
  AuthError,
  AuthFootNote,
  AuthTitle,
} from "@/components/auth/auth-parts";
import { ProviderIcon } from "@/components/auth/provider-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: err } = await authClient.signIn.email({
        email,
        password,
        callbackURL: next,
      });
      if (err) {
        setError(err.message || "Invalid email or password");
        return;
      }
      router.replace(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onOAuth(provider: "github" | "google") {
    setError(null);
    await authClient.signIn.social({ provider, callbackURL: next });
  }

  return (
    <>
      <AuthTitle title="Sign in" description="Welcome back — sign in to continue." />

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-mdf-fg-3 hover:text-mdf-fg-1"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
        </div>
        {error ? <AuthError message={error} /> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <AuthDivider />

      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOAuth("github")}
          disabled={pending}
        >
          <ProviderIcon provider="github" />
          Continue with GitHub
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOAuth("google")}
          disabled={pending}
        >
          <ProviderIcon provider="google" />
          Continue with Google
        </Button>
      </div>

      <AuthFootNote>
        No account?{" "}
        <Link
          href={next === "/" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`}
          className="text-mdf-fg-1 underline underline-offset-2 hover:text-mdf-brand"
        >
          Create one
        </Link>
      </AuthFootNote>
    </>
  );
}
