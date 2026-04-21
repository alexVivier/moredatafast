"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PaywallDialog } from "@/components/billing/paywall-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddSiteForm() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [nameOverride, setNameOverride] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywallOrgId, setPaywallOrgId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          nameOverride: nameOverride.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 402 || body?.code === "PAYWALL") {
        setPaywallOrgId(body.organizationId ?? "");
        return;
      }
      if (!res.ok) {
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      if (body.viewId) {
        router.push(`/view/${body.viewId}`);
      } else {
        router.push("/settings");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PaywallDialog
        open={paywallOrgId !== null}
        onClose={() => setPaywallOrgId(null)}
        organizationId={paywallOrgId ?? ""}
        reason="add more sites"
      />
      <Card>
        <CardHeader>
          <CardTitle>Connect your DataFast website</CardTitle>
          <CardDescription>
            Paste the API key from{" "}
            <span className="font-mono">Website Settings → API</span>. The key is
            validated against <span className="font-mono">/analytics/metadata</span>{" "}
            and encrypted before it touches the disk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="dfapi_..."
                required
                autoFocus
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display name (optional)</Label>
              <Input
                id="name"
                placeholder="Leave blank to use the name from DataFast"
                value={nameOverride}
                onChange={(e) => setNameOverride(e.target.value)}
              />
            </div>

            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={submitting || apiKey.length < 8}>
                {submitting ? "Validating…" : "Add site"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
