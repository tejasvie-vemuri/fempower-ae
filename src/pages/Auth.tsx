import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import fempowerLogo from "@/assets/fempower-logo.png";

const emailSchema = z.string().trim().min(1, "Email is required").email("Please enter a valid email address").max(255);
const passwordSchema = z.string().min(1, "Password is required").max(72);
const passwordSignUpSchema = z.string().min(6, "Password must be at least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Name is required").max(100);

type Errors = Record<string, string>;

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null;

const AuthPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirectTo = params.get("redirect") || "/";
  const defaultTab = params.get("tab") === "signup" ? "signup" : "signin";
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signInErrors, setSignInErrors] = useState<Errors>({});

  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "" });
  const [signUpErrors, setSignUpErrors] = useState<Errors>({});

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [user, loading, navigate, redirectTo]);

  const handleGoogle = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + redirectTo,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setSubmitting(false);
    }
  };

  const updateSignIn = (field: "email" | "password", value: string) => {
    setSignInData((d) => ({ ...d, [field]: value }));
    setSignInErrors((e) => {
      if (!e[field]) return e;
      const { [field]: _, ...rest } = e;
      return rest;
    });
  };

  const updateSignUp = (field: "name" | "email" | "password", value: string) => {
    setSignUpData((d) => ({ ...d, [field]: value }));
    setSignUpErrors((e) => {
      if (!e[field]) return e;
      const { [field]: _, ...rest } = e;
      return rest;
    });
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs: Errors = {};
    const emailRes = emailSchema.safeParse(signInData.email);
    if (!emailRes.success) errs.email = emailRes.error.issues[0].message;
    const pwRes = passwordSchema.safeParse(signInData.password);
    if (!pwRes.success) errs.password = pwRes.error.issues[0].message;
    setSignInErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailRes.data!,
      password: pwRes.data!,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back");
      navigate(redirectTo, { replace: true });
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs: Errors = {};
    const nameRes = nameSchema.safeParse(signUpData.name);
    if (!nameRes.success) errs.name = nameRes.error.issues[0].message;
    const emailRes = emailSchema.safeParse(signUpData.email);
    if (!emailRes.success) errs.email = emailRes.error.issues[0].message;
    const pwRes = passwordSignUpSchema.safeParse(signUpData.password);
    if (!pwRes.success) errs.password = pwRes.error.issues[0].message;
    setSignUpErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: emailRes.data!,
      password: pwRes.data!,
      options: {
        emailRedirectTo: window.location.origin + redirectTo,
        data: { name: nameRes.data! },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email to confirm your account");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2">
        <img src={fempowerLogo} alt="Fempower" className="h-10 w-auto" />
      </Link>
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <h1 className="font-heading text-3xl text-primary">Sign in to Fempower</h1>
          <p className="mt-2 text-sm italic text-muted-foreground">Rooted Together, Rising Together</p>
        </Link>
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <Tabs defaultValue={defaultTab}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <Input
                    id="si-email"
                    name="email"
                    type="email"
                    value={signInData.email}
                    onChange={(e) => updateSignIn("email", e.target.value)}
                    aria-invalid={!!signInErrors.email}
                  />
                  <FieldError message={signInErrors.email} />
                </div>
                <div>
                  <Label htmlFor="si-password">Password</Label>
                  <Input
                    id="si-password"
                    name="password"
                    type="password"
                    value={signInData.password}
                    onChange={(e) => updateSignIn("password", e.target.value)}
                    aria-invalid={!!signInErrors.password}
                  />
                  <FieldError message={signInErrors.password} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="su-name">Name</Label>
                  <Input
                    id="su-name"
                    name="name"
                    type="text"
                    value={signUpData.name}
                    onChange={(e) => updateSignUp("name", e.target.value)}
                    aria-invalid={!!signUpErrors.name}
                  />
                  <FieldError message={signUpErrors.name} />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input
                    id="su-email"
                    name="email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => updateSignUp("email", e.target.value)}
                    aria-invalid={!!signUpErrors.email}
                  />
                  <FieldError message={signUpErrors.email} />
                </div>
                <div>
                  <Label htmlFor="su-password">Password</Label>
                  <Input
                    id="su-password"
                    name="password"
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => updateSignUp("password", e.target.value)}
                    aria-invalid={!!signUpErrors.password}
                  />
                  <FieldError message={signUpErrors.password} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={submitting}
            onClick={handleGoogle}
          >
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
