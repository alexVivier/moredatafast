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

export default function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: err } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: next,
      });
      if (err) {
        setError(err.message || "Could not create account");
        return;
      }
      setSent(true);
    } finally {
      setPending(false);
    }
  }

  async function onOAuth(provider: "github" | "google") {
    setError(null);
    await authClient.signIn.social({ provider, callbackURL: next });
  }

  if (sent) {
    return (
      <>
        <AuthTitle
          title="Check your email"
          description={
            <>
              We sent a verification link to{" "}
              <strong className="text-mdf-fg-1">{email}</strong>. Click it to activate your
              account, then sign in.
            </>
          }
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          Back to sign in
        </Button>
      </>
    );
  }

  return (
    <>
      <AuthTitle
        title="Create your account"
        description="Start tracking your SaaS analytics in one place."
      />

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
          />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
          <p className="text-[11px] text-mdf-fg-3">At least 8 characters.</p>
        </div>
        {error ? <AuthError message={error} /> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Sign up"}
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
        Already have an account?{" "}
        <Link
          href={next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`}
          className="text-mdf-fg-1 underline underline-offset-2 hover:text-mdf-brand"
        >
          Sign in
        </Link>
      </AuthFootNote>
    </>
  );
}
