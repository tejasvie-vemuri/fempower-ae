import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import fempowerLogo from "@/assets/fempower-logo.png";

const pwSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery tokens in the URL hash on email click.
    // The client auto-parses the hash and emits a PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // Fallback: if a session already exists from the recovery link, allow the form.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        // Give the client a tick to parse the hash, then mark invalid if still nothing.
        setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (!data.session) setInvalidLink(true);
        }, 800);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = pwSchema.safeParse(password);
    if (!res.success) {
      setErr(res.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      setErr("Passwords don't match");
      return;
    }
    setErr(undefined);
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: res.data });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated");
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2">
        <img src={fempowerLogo} alt="Fempower" className="h-10 w-auto" />
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-primary">Set a new password</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          {invalidLink ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                This reset link is invalid or has expired.
              </p>
              <Link to="/forgot-password" className="inline-block text-sm text-primary underline">
                Request a new link
              </Link>
            </div>
          ) : !ready ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="rp-pw">New password</Label>
                <Input
                  id="rp-pw"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!err}
                />
              </div>
              <div>
                <Label htmlFor="rp-confirm">Confirm password</Label>
                <Input
                  id="rp-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={!!err}
                />
                {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
