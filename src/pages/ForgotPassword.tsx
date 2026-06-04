import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import fempowerLogo from "@/assets/fempower-logo.png";

const emailSchema = z.string().trim().min(1, "Email is required").email("Enter a valid email").max(255);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = emailSchema.safeParse(email);
    if (!res.success) {
      setErr(res.error.issues[0].message);
      return;
    }
    setErr(undefined);
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(res.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
      toast.success("Reset link sent — check your inbox");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2">
        <img src={fempowerLogo} alt="Fempower" className="h-10 w-auto" />
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl text-primary">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll email you a secure link to set a new password.
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm">
                If an account exists for <strong>{email}</strong>, a reset link is on its way.
              </p>
              <Link to="/auth" className="inline-block text-sm text-primary underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="fp-email">Email</Label>
                <Input
                  id="fp-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (err) setErr(undefined);
                  }}
                  aria-invalid={!!err}
                />
                {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
              <div className="text-center">
                <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
