"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { AuthError, AuthTitle } from "@/components/auth/auth-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: err } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (err) {
        setError(err.message || "Could not reset password");
        return;
      }
      router.replace("/login");
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <>
        <AuthTitle
          title="Invalid reset link"
          description="This page must be opened from the email link we sent you. Request a new one."
        />
        <Link href="/forgot-password">
          <Button variant="outline" className="w-full">
            Request new link
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthTitle
        title="Set a new password"
        description="Pick at least 8 characters."
      />

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
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
        </div>
        {error ? <AuthError message={error} /> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </>
  );
}
