/**
 * SSR-safe stub for @/integrations/supabase/client, aliased in the Vite SSR
 * build only. The real client references `localStorage` at module top-level
 * and would crash during renderToString. Data-fetching code always runs
 * inside useEffect, so during SSR this stub is imported but never invoked;
 * the real client takes over on the browser after hydration.
 */
type Any = any;

// Kept in sync with the real client so SSR-imported modules can read them.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://uaiymunelgvvnznkxeik.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaXltdW5lbGd2dm56bmt4ZWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzQ2NzUsImV4cCI6MjA4ODExMDY3NX0.sL1kcUsg10yNj5YVjUNUhoHlVafpdFnDHH1RsJyIesU";

const noopSubscription = { unsubscribe: () => {} };

const asyncQuery = new Proxy(function () {}, {
  get(_target, prop) {
    if (prop === "then") {
      return (resolve: (v: Any) => Any) => resolve({ data: null, error: null });
    }
    return () => asyncQuery;
  },
  apply() {
    return asyncQuery;
  },
}) as Any;

export const supabase: Any = {
  from: () => asyncQuery,
  rpc: () => asyncQuery,
  channel: () => ({
    on: () => ({ subscribe: () => noopSubscription }),
    subscribe: () => noopSubscription,
    unsubscribe: () => {},
  }),
  removeChannel: () => {},
  auth: {
    onAuthStateChange: () => ({ data: { subscription: noopSubscription } }),
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({ data: null, error: null }),
    signInWithOAuth: async () => ({ data: null, error: null }),
    signUp: async () => ({ data: null, error: null }),
    resetPasswordForEmail: async () => ({ data: null, error: null }),
    updateUser: async () => ({ data: null, error: null }),
    exchangeCodeForSession: async () => ({ data: null, error: null }),
  },
  functions: {
    invoke: async () => ({ data: null, error: null }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      remove: async () => ({ data: null, error: null }),
      createSignedUrl: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
    }),
  },
};
