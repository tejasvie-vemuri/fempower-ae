/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_PAYMENTS_CLIENT_TOKEN?: string;

  /** Microsoft Clarity project id. Unset → Clarity never loads. */
  readonly VITE_CLARITY_PROJECT_ID?: string;
  /** `true` to log every tracked event to the console. */
  readonly VITE_ANALYTICS_DEBUG?: string;
  /** `true` to honour the legacy `DNT` header as an opt-out signal. */
  readonly VITE_ANALYTICS_RESPECT_DNT?: string;
  /** `true` to allow tracking from localhost (off by default). */
  readonly VITE_ANALYTICS_ALLOW_LOCALHOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
