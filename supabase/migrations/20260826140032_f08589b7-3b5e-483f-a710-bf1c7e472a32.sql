-- Editable style rule sets for Zara + A/B testing
CREATE TABLE public.coach_style_rulesets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  rules text NOT NULL DEFAULT '',
  notes text,
  is_active boolean NOT NULL DEFAULT false,
  traffic_weight integer NOT NULL DEFAULT 0,
  is_control boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_style_rulesets TO authenticated;
GRANT ALL ON public.coach_style_rulesets TO service_role;

ALTER TABLE public.coach_style_rulesets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage rulesets"
ON public.coach_style_rulesets FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER coach_style_rulesets_updated_at
BEFORE UPDATE ON public.coach_style_rulesets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-response anti-slop scoring log (production + harness evals)
CREATE TABLE public.coach_slop_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ruleset_id uuid REFERENCES public.coach_style_rulesets(id) ON DELETE SET NULL,
  ruleset_slug text,
  source text NOT NULL DEFAULT 'production',
  case_key text,
  user_id uuid,
  user_message text,
  reply text,
  score integer NOT NULL DEFAULT 100,
  violations jsonb NOT NULL DEFAULT '[]'::jsonb,
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX coach_slop_logs_created_idx ON public.coach_slop_logs (created_at DESC);
CREATE INDEX coach_slop_logs_ruleset_idx ON public.coach_slop_logs (ruleset_slug, source, created_at DESC);

GRANT SELECT ON public.coach_slop_logs TO authenticated;
GRANT ALL ON public.coach_slop_logs TO service_role;

ALTER TABLE public.coach_slop_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read slop logs"
ON public.coach_slop_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.coach_style_rulesets (name, slug, rules, notes, is_active, traffic_weight, is_control)
VALUES
  ('Baseline (prompt only)', 'baseline', '', 'Control: the anti-slop rules already baked into Zara''s system prompt, with no extra overlay.', true, 50, true),
  ('Tight register + specificity', 'tight-register',
'### EXTRA STYLE OVERLAY (highest priority)
- Mirror her message: count her words. Under 15 words -> one paragraph, max 3 sentences. Under 40 words -> max 5 sentences. Only a long, raw message earns a long reply.
- Mirror her formality: if she writes lowercase and clipped, you write plainly and clipped. If she writes in full, careful sentences, you do too. Never be more formal than she is.
- Every reply names at least one concrete noun from her world: her city, her employer, her job title, her manager, the number she gave you, the deadline she named, the school, the visa step. No concrete noun means the reply is not finished.
- Never open with a restatement of her message. Never close with a summary or an affirmation.',
   'Variant B: sharper register matching and a hard specificity quota.', true, 50, false);