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
