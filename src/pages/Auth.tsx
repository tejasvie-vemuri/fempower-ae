import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { LOOKING_FOR_OPTIONS } from "@/lib/memberProfile";
import fempowerLogo from "@/assets/fempower-logo.png";

const emailSchema = z.string().trim().min(1, "Email is required").email("Please enter a valid email address").max(255);
const passwordSchema = z.string().min(1, "Password is required").max(72);
const passwordSignUpSchema = z.string().min(6, "Password must be at least 6 characters").max(72);
const nameSchema = z.string().trim().min(1, "Full name is required").max(100);
const citySchema = z.string().trim().min(1, "City is required").max(100);
const companySchema = z.string().trim().min(1, "Company is required").max(120);
const bioSchema = z.string().trim().min(20, "Please write at least 20 characters").max(500, "Keep it under 500 characters");
const linkedinSchema = z
  .string()
  .trim()
  .min(1, "LinkedIn URL is required")
  .max(255)
  .refine((v) => /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i.test(v), "Enter a full LinkedIn profile URL (https://linkedin.com/in/…)");

type Errors = Record<string, string>;

type SignUpField = "name" | "email" | "password" | "city" | "company" | "bio" | "linkedin_url" | "looking_for";

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

  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    company: "",
    bio: "",
    linkedin_url: "",
    looking_for: [] as string[],
  });
  const [signUpErrors, setSignUpErrors] = useState<Errors>({});


  useEffect(() => {
    track("auth_page_viewed", { tab: defaultTab, redirect: redirectTo });
  }, [defaultTab, redirectTo]);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      const [{ data: profile }, { data: roleRow }] = await Promise.all([
        supabase.from("member_profiles").select("status").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
      ]);
      const active = profile?.status === "approved" || profile?.status === "hidden";
      const isAdmin = !!roleRow;
      if (active || isAdmin) {
        navigate(redirectTo, { replace: true });
      } else {
        navigate("/pending-approval", { replace: true });
      }
    })();
  }, [user, loading, navigate, redirectTo]);

  const handleGoogle = async () => {
    setSubmitting(true);
    track("oauth_started", { provider: "google", redirect: redirectTo });
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + redirectTo,
    });
    if (result.error) {
      track("oauth_failed", { provider: "google", reason: result.error.message });
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

  const clearSignUpError = (field: SignUpField) =>
    setSignUpErrors((e) => {
      if (!e[field]) return e;
      const { [field]: _, ...rest } = e;
      return rest;
    });

  const updateSignUp = (field: Exclude<SignUpField, "looking_for">, value: string) => {
    setSignUpData((d) => ({ ...d, [field]: value }));
    clearSignUpError(field);
  };

  const toggleLookingFor = (opt: string) => {
    setSignUpData((d) => ({
      ...d,
      looking_for: d.looking_for.includes(opt)
        ? d.looking_for.filter((x) => x !== opt)
        : [...d.looking_for, opt],
    }));
    clearSignUpError("looking_for");
  };


  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs: Errors = {};
    const emailRes = emailSchema.safeParse(signInData.email);
    if (!emailRes.success) errs.email = emailRes.error.issues[0].message;
    const pwRes = passwordSchema.safeParse(signInData.password);
    if (!pwRes.success) errs.password = pwRes.error.issues[0].message;
    setSignInErrors(errs);
    if (Object.keys(errs).length) {
      track("sign_in_failed", { stage: "validation", fields: Object.keys(errs).join(",") });
      return;
    }

    setSubmitting(true);
    track("sign_in_submitted", { method: "password" });
    const { error } = await supabase.auth.signInWithPassword({
      email: emailRes.data!,
      password: pwRes.data!,
    });
    setSubmitting(false);
    if (error) {
      track("sign_in_failed", { stage: "server", method: "password", reason: error.message });
      toast.error(error.message);
    } else {
      track("sign_in_succeeded", { method: "password" });
      toast.success("Welcome back");
      // The useEffect above will route to /pending-approval or redirectTo
      // based on the user's approval status.
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
    const cityRes = citySchema.safeParse(signUpData.city);
    if (!cityRes.success) errs.city = cityRes.error.issues[0].message;
    const companyRes = companySchema.safeParse(signUpData.company);
    if (!companyRes.success) errs.company = companyRes.error.issues[0].message;
    const bioRes = bioSchema.safeParse(signUpData.bio);
    if (!bioRes.success) errs.bio = bioRes.error.issues[0].message;
    const liRes = linkedinSchema.safeParse(signUpData.linkedin_url);
    if (!liRes.success) errs.linkedin_url = liRes.error.issues[0].message;
    if (signUpData.looking_for.length === 0) errs.looking_for = "Pick at least one";
    setSignUpErrors(errs);
    if (Object.keys(errs).length) {
      track("sign_up_failed", { stage: "validation", fields: Object.keys(errs).join(",") });
      const first = document.querySelector<HTMLElement>("[data-signup-error='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    track("sign_up_submitted", { method: "password" });
    const { error } = await supabase.auth.signUp({
      email: emailRes.data!,
      password: pwRes.data!,
      options: {
        emailRedirectTo: window.location.origin + redirectTo,
        data: {
          name: nameRes.data!,
          city: cityRes.data!,
          company: companyRes.data!,
          bio: bioRes.data!,
          linkedin_url: liRes.data!,
          looking_for: signUpData.looking_for,
        },
      },
    });

    setSubmitting(false);
    if (error) {
      track("sign_up_failed", { stage: "server", method: "password", reason: error.message });
      toast.error(error.message);
    } else {
      track("sign_up_succeeded", { method: "password" });
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
        {/* Session replays must never show credentials — mask the whole card. */}
        <div
          data-clarity-mask="True"
          className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm"
        >
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
                <div className="text-center">
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
                    Forgot your password?
                  </Link>
                </div>
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
