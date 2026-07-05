## Diagnosis

In `src/pages/LifestyleManager.tsx`, the Settings tab holds the profile fields ("What should I be called?" and "What should I call you?"). They're stored in local draft state (`assistantNameDraft`, `preferredNameDraft`) and only persist to `lm_profile` when the user clicks the **Save** button (`saveAssistantIdentity`, line 240). If the user types and navigates away or refreshes, the changes are lost — that's what users are reporting as "not auto-saving." Nothing is actually broken; there's just no auto-save wired up.

## Plan

Add debounced auto-save to the two profile inputs so users never need to click Save.

1. **Add a debounced auto-save effect** in `LifestyleManager.tsx`:
   - Watch `assistantNameDraft` and `preferredNameDraft`.
   - Skip on the initial hydration (only run once the profile has loaded and drafts differ from the persisted values).
   - After ~800ms of no typing, run the same update to `lm_profile` that `saveAssistantIdentity` does.
   - Track a lightweight status: `idle | saving | saved | error`.

2. **Update the Settings UI** (lines 602–631):
   - Remove the manual Save button.
   - Replace it with a subtle status indicator under the fields: "Saving…", "Saved ✓" (fades after a couple seconds), or an error message with a retry link if the update fails.
   - Keep the existing input styling and layout.

3. **Keep the underlying save logic reusable**: refactor `saveAssistantIdentity` into a `persistProfile(values)` helper used by the debounced effect, so behavior stays identical (same table, same fallback of `"Zoya"` when blank, same profile state update).

4. **No schema, RLS, or edge-function changes needed** — the existing `lm_profile` update path already works and permissions are in place.

## Out of scope

- Auto-saving other tabs (people, dates, reminders, groceries) — those already persist on their own add/edit actions.
- Any changes to the chat, trial logic, or backend.
