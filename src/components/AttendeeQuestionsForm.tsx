import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AttendeeQuestion,
  AttendeeResponses,
} from "@/lib/attendeeQuestions";

interface Props {
  questions: AttendeeQuestion[];
  values: AttendeeResponses;
  errors?: Record<string, string>;
  onChange: (next: AttendeeResponses) => void;
  disabled?: boolean;
}

export function AttendeeQuestionsForm({
  questions,
  values,
  errors = {},
  onChange,
  disabled,
}: Props) {
  if (!questions.length) return null;

  const set = (id: string, v: string) => {
    onChange({ ...values, [id]: v });
  };

  return (
    <div className="space-y-4 border border-border rounded-lg p-4 bg-card/50">
      <div>
        <h3 className="font-medium text-foreground">A few quick questions</h3>
        <p className="text-xs text-muted-foreground">
          Helps us prepare for you ✨
        </p>
      </div>
      {questions.map((q) => {
        const err = errors[q.id];
        const labelText = q.required ? `${q.label} *` : q.label;
        const current = values[q.id] ?? "";

        if (q.type === "long_text") {
          return (
            <div key={q.id} className="space-y-1">
              <Label htmlFor={q.id}>{labelText}</Label>
              <Textarea
                id={q.id}
                rows={3}
                disabled={disabled}
                maxLength={1000}
                value={current}
                onChange={(e) => set(q.id, e.target.value)}
              />
              {err && <p className="text-xs text-destructive">{err}</p>}
            </div>
          );
        }

        if (q.type === "select") {
          const opts = q.options ?? [];
          const usePills = opts.length > 0 && opts.length <= 4;
          const showIgLink = q.id === "instagram_follow";
          const showMediaHelper = q.id === "media_consent";

          return (
            <div key={q.id} className="space-y-2">
              <Label htmlFor={q.id}>{labelText}</Label>

              {showIgLink && (
                <a
                  href="https://instagram.com/fempower.ae"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open Instagram <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {usePills ? (
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={q.id}>
                  {opts.map((opt) => {
                    const selected = current === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={disabled}
                        onClick={() => set(q.id, opt)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/60 hover:bg-primary/5",
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Select
                  value={current}
                  onValueChange={(v) => set(q.id, v)}
                  disabled={disabled}
                >
                  <SelectTrigger id={q.id}>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {opts.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {showMediaHelper && (
                <p className="text-xs text-muted-foreground">
                  Either answer is totally fine — we'll respect it on the day.
                </p>
              )}
              {err && <p className="text-xs text-destructive">{err}</p>}
            </div>
          );
        }

        return (
          <div key={q.id} className="space-y-1">
            <Label htmlFor={q.id}>{labelText}</Label>
            <Input
              id={q.id}
              disabled={disabled}
              maxLength={200}
              placeholder={
                q.id === "dietary"
                  ? "e.g. nut allergy, vegetarian, gluten-free… (or 'none')"
                  : undefined
              }
              value={current}
              onChange={(e) => set(q.id, e.target.value)}
            />
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
        );
      })}
    </div>
  );
}
