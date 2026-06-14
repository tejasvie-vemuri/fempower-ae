import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
        },
      },
    );

    if (sendError) {
      console.error("Welcome email send failed", sendError);
      return;
    }

    await supabase
      .from("profiles")
      .update({ welcome_email_sent: true })
      .eq("user_id", user.id);
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
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
