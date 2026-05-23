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
          Helps us prepare for you.
        </p>
      </div>
      {questions.map((q) => {
        const err = errors[q.id];
        const labelText = q.required ? `${q.label} *` : q.label;
        if (q.type === "long_text") {
          return (
            <div key={q.id} className="space-y-1">
              <Label htmlFor={q.id}>{labelText}</Label>
              <Textarea
                id={q.id}
                rows={3}
                disabled={disabled}
                maxLength={1000}
                value={values[q.id] ?? ""}
                onChange={(e) => set(q.id, e.target.value)}
              />
              {err && <p className="text-xs text-destructive">{err}</p>}
            </div>
          );
        }
        if (q.type === "select") {
          return (
            <div key={q.id} className="space-y-1">
              <Label htmlFor={q.id}>{labelText}</Label>
              <Select
                value={values[q.id] ?? ""}
                onValueChange={(v) => set(q.id, v)}
                disabled={disabled}
              >
                <SelectTrigger id={q.id}>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(q.options ?? []).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              value={values[q.id] ?? ""}
              onChange={(e) => set(q.id, e.target.value)}
            />
            {err && <p className="text-xs text-destructive">{err}</p>}
          </div>
        );
      })}
    </div>
  );
}
