import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const WELCOME_EMAIL_MAX_ATTEMPTS = 3;
const WELCOME_EMAIL_BASE_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function describeSendError(err: unknown): string {
  if (!err) return "Unknown error";
  const anyErr = err as { message?: string; context?: { status?: number } };
  const status = anyErr?.context?.status;
  if (status === 429) return "Email service is rate-limited. We'll retry shortly.";
  if (status === 403) return "Email service rejected this address (it may be suppressed).";
  if (status && status >= 500) return "Email service is temporarily unavailable.";
  if (anyErr?.message?.toLowerCase().includes("failed to fetch")) return "Network error reaching the email service.";
  return anyErr?.message || "Unexpected error sending welcome email.";
}

function isRetryable(err: unknown): boolean {
  const anyErr = err as { message?: string; context?: { status?: number } };
  const status = anyErr?.context?.status;
  if (status === 429) return true;
  if (status && status >= 500) return true;
  if (!status && anyErr?.message?.toLowerCase().includes("failed to fetch")) return true;
  // No status info at all – be optimistic and retry once.
  if (!status && !anyErr?.message) return true;
  return false;
}

async function maybeSendWelcomeEmail(user: User) {
  try {
    // Check the flag in profiles (created by handle_new_user trigger)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("welcome_email_sent, name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.welcome_email_sent) return;

    const recipient = profile.email || user.email;
    if (!recipient) return;

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= WELCOME_EMAIL_MAX_ATTEMPTS; attempt++) {
      const { error: sendError } = await supabase.functions.invoke(
        "send-transactional-email",
        {
          body: {
            templateName: "welcome",
            recipientEmail: recipient,
            idempotencyKey: `welcome-${user.id}`,
            templateData: {
              name: profile.name || user.user_metadata?.full_name || "",
              siteUrl: "https://fempowerae.com",
            },
            // Server-side diagnostic context — surfaced in Edge Function logs
            // under the [welcome-email] tag for grep-friendly debugging.
            diagnostics: {
              userId: user.id,
              provider: user.app_metadata?.provider ?? "unknown",
              attempt,
              maxAttempts: WELCOME_EMAIL_MAX_ATTEMPTS,
              clientTs: new Date().toISOString(),
            },
          },
        },
      );

      if (!sendError) {
        await supabase
          .from("profiles")
          .update({ welcome_email_sent: true })
          .eq("user_id", user.id);
        return;
      }

      lastError = sendError;
      const status = (sendError as { context?: { status?: number } })?.context?.status;
      console.warn(
        `[welcome-email] attempt ${attempt}/${WELCOME_EMAIL_MAX_ATTEMPTS} failed (status=${status ?? "n/a"}): ${sendError.message}`,
        sendError,
      );

      if (attempt === WELCOME_EMAIL_MAX_ATTEMPTS || !isRetryable(sendError)) break;

      // Exponential backoff: 1s, 2s, 4s (+ small jitter)
      const delay =
        WELCOME_EMAIL_BASE_DELAY_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
      await sleep(delay);
    }

    console.error("Welcome email send failed after retries", lastError);
    toast({
      title: "Welcome email couldn't be sent",
      description: `${describeSendError(lastError)} You're signed in — we'll try again next time you visit.`,
      variant: "destructive",
    });
  } catch (e) {
    console.error("Welcome email error", e);
  }
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const isBrowser = typeof window !== "undefined";
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  // Default to non-loading on the server so prerendered pages render their
  // logged-out content instead of a loading spinner.
  const [loading, setLoading] = useState(isBrowser);


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      // Send welcome email on first Google sign-in.
      // Email/password users already get a signup confirmation email.
      if (event === "SIGNED_IN" && s?.user) {
        const provider = s.user.app_metadata?.provider;
        if (provider === "google") {
          // Defer so we don't block the auth listener
          setTimeout(() => {
            void maybeSendWelcomeEmail(s.user);
          }, 0);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
