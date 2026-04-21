"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthTitle } from "@/components/auth/auth-parts";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const error = params.get("error");

  if (error) {
    return (
      <>
        <AuthTitle
          title="Verification failed"
          description={
            <>
              The link is invalid or has expired ({error}). Request a new one by signing up
              again or trying to log in.
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
        title="Check your email"
        description="Click the verification link we just sent to finish signing in."
      />
      <Link href="/login">
        <Button variant="outline" className="w-full">
          Back to sign in
        </Button>
      </Link>
    </>
  );
}
