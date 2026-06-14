import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import fempowerLogo from "@/assets/fempower-logo.png";

type State = "validating" | "ready" | "invalid" | "already" | "submitting" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("validating");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setState("invalid");
        return;
      }
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.valid) setState("ready");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        if (!cancelled) setState("invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    setError(undefined);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else if (data?.success) {
      setState("done");
    } else if (data?.reason === "already_unsubscribed") {
      setState("already");
    } else {
      setError(data?.error || "Could not process unsubscribe");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2">
        <img src={fempowerLogo} alt="Fempower" className="h-10 w-auto" />
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-primary">Unsubscribe</h1>
          <p className="mt-2 text-sm italic text-muted-foreground">Rooted Together, Rising Together</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          {state === "validating" && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {state === "ready" && (
            <div className="space-y-4 text-center">
              <p className="text-sm">
                Click below to confirm you'd like to stop receiving emails from Fempower.
                You can still sign in and manage your account.
              </p>
              <Button onClick={confirm} className="w-full">Confirm unsubscribe</Button>
              <Link to="/" className="block text-xs text-muted-foreground hover:text-foreground">
                Never mind — take me home
              </Link>
            </div>
          )}
          {state === "submitting" && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {state === "done" && (
            <div className="text-center space-y-3">
              <p className="text-sm">You've been unsubscribed. We're sorry to see you go.</p>
              <Link to="/" className="inline-block text-sm text-primary underline">Back to Fempower</Link>
            </div>
          )}
          {state === "already" && (
            <div className="text-center space-y-3">
              <p className="text-sm">This email is already unsubscribed.</p>
              <Link to="/" className="inline-block text-sm text-primary underline">Back to Fempower</Link>
            </div>
          )}
          {state === "invalid" && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
              <Link to="/" className="inline-block text-sm text-primary underline">Back to Fempower</Link>
            </div>
          )}
          {state === "error" && (
            <div className="text-center space-y-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={confirm}>Try again</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;
