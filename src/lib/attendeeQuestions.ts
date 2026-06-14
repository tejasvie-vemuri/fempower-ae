// Attendee questions: shared types and helpers used by both admin and attendee UIs.

export type AttendeeQuestionType = "short_text" | "long_text" | "select";

export interface AttendeeQuestion {
  id: string;
  label: string;
  type: AttendeeQuestionType;
  required: boolean;
  options?: string[]; // only used for 'select'
}

export type AttendeeResponses = Record<string, string>;

// Default questions asked on every event registration. Stable IDs so saved
// responses survive copy edits. Always required.
export const DEFAULT_ATTENDEE_QUESTIONS: AttendeeQuestion[] = [
  {
    id: "nibbles",
    label: "Nibbles & bites will be floating around — are you in? 🍇🧀",
    type: "select",
    required: true,
    options: ["Yes please, feed me 🙋‍♀️", "I'll pass, thanks 🙅‍♀️"],
  },
  {
    id: "dietary",
    label:
      "Any food no-nos we should know about? 🌱🥜 (allergies, vegan, halal — spill it)",
    type: "short_text",
    required: true,
  },
  {
    id: "heard_about_us",
    label: "How did our little circle find you? 💌✨",
    type: "select",
    required: true,
    options: [
      "Instagram",
      "LinkedIn",
      "A Fempower friend",
      "WhatsApp community",
      "An event/meetup",
      "Somewhere else",
    ],
  },
  {
    id: "instagram_follow",
    label:
      "One tiny ask — are you following us on Instagram yet? 📸💕 (@fempower.ae)",
    type: "select",
    required: true,
    options: [
      "Already there 💕",
      "Just followed — see you in the DMs!",
      "Will follow before the event 🤞",
    ],
  },
  {
    id: "media_consent",
    label:
      "We sometimes capture the magic on camera 📷✨ — okay to feature you in photos/videos on our socials?",
    type: "select",
    required: true,
    options: ["Yes, tag me in 💃", "No thanks, keep me off-camera 🙈"],
  },
];

export const DEFAULT_ATTENDEE_QUESTION_IDS = new Set(
  DEFAULT_ATTENDEE_QUESTIONS.map((q) => q.id),
);


export function parseQuestions(value: unknown): AttendeeQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((q): AttendeeQuestion | null => {
      if (!q || typeof q !== "object") return null;
      const o = q as Record<string, unknown>;
      const id = typeof o.id === "string" && o.id ? o.id : null;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      const type =
        o.type === "long_text" || o.type === "select" ? o.type : "short_text";
      if (!id || !label) return null;
      return {
        id,
        label,
        type,
        required: !!o.required,
        options: Array.isArray(o.options)
          ? (o.options as unknown[]).map((x) => String(x)).filter(Boolean)
          : undefined,
      };
    })
    .filter((q): q is AttendeeQuestion => q !== null);
}

export function newQuestionId() {
  return `q_${Math.random().toString(36).slice(2, 10)}`;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

export function validateResponses(
  questions: AttendeeQuestion[],
  responses: AttendeeResponses,
): ValidationResult {
  const errors: Record<string, string> = {};
  for (const q of questions) {
    const raw = (responses[q.id] ?? "").trim();
    if (q.required && !raw) {
      errors[q.id] = "Required";
      continue;
    }
    if (raw.length > 1000) {
      errors[q.id] = "Answer must be under 1000 characters";
      continue;
    }
    if (q.type === "select" && raw && q.options && !q.options.includes(raw)) {
      errors[q.id] = "Pick one of the options";
    }
  }
  return { ok: Object.keys(errors).length === 0, errors };
}
