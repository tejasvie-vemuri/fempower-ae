import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * OAuth 2.1 consent screen for MCP clients (ChatGPT, Claude, Cursor, Lovable).
 * Supabase Auth redirects here with an authorization_id; we approve or deny it
 * on behalf of the signed-in member and bounce back to the client.
 */

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the FULL consent URL so sign-in returns the user here.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?redirect=" + encodeURIComponent(next);
        return;
      }
      const { data, error: detailsError } = await oauth().getAuthorizationDetails(
        authorizationId,
      );
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error: decisionError } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (decisionError) {
      setBusy(false);
      setError(decisionError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "this app";

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        {error ? (
          <>
            <h1 className="font-serif text-2xl text-foreground">
              Could not load this request
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{error}</p>
            <Button asChild className="mt-6 w-full">
              <a href="/">Back to Fempower</a>
            </Button>
          </>
        ) : !details ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <h1 className="font-serif text-2xl text-foreground">
              Connect {clientName} to your Fempower account
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {clientName} will be able to use Fempower as you — reading the events,
              meetups, directory entries and saved checklists your membership gives
              you access to, and RSVPing on your behalf. You can disconnect it at any
              time from {clientName}.
            </p>
            <div className="mt-8 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={busy}
                onClick={() => decide(false)}
              >
                Deny
              </Button>
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                {busy ? "Working…" : "Approve"}
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
