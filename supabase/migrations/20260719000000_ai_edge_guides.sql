-- AI Edge: allow a single entry to be a multi-prompt "guide"
-- (a title + an instructions section + several prompts under it),
-- instead of only a single prompt. Backward compatible: existing rows
-- have steps = NULL and continue to render from prompt_text.

ALTER TABLE public.ai_edge_prompts
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS steps JSONB;

-- Guides don't use prompt_text, so let it default to empty and stay NOT NULL.
ALTER TABLE public.ai_edge_prompts
  ALTER COLUMN prompt_text SET DEFAULT '';

COMMENT ON COLUMN public.ai_edge_prompts.instructions IS
  'Optional intro/how-to shown above the prompts when this entry is a multi-prompt guide.';
COMMENT ON COLUMN public.ai_edge_prompts.steps IS
  'Optional JSON array of guide steps: [{ "label": string, "text": string }]. When present, the entry renders as a guide and prompt_text is ignored.';
