"use client";

import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";
import { AuthTitle } from "@/components/auth/auth-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      setSent(true);
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <>
        <AuthTitle
          title="Check your inbox"
          description={
            <>
              If an account exists for <strong className="text-mdf-fg-1">{email}</strong>,
              we&apos;ve sent a reset link. It expires in 1 hour.
            </>
          }
        />
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthTitle
        title="Forgot your password?"
        description="Enter your email and we'll send you a reset link."
      />

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
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-mdf-fg-3">
        Remembered it?{" "}
        <Link
          href="/login"
          className="text-mdf-fg-1 underline underline-offset-2 hover:text-mdf-brand"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
