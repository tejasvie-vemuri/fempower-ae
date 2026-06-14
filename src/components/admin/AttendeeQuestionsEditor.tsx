import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  AttendeeQuestion,
  newQuestionId,
} from "@/lib/attendeeQuestions";

interface Props {
  value: AttendeeQuestion[];
  onChange: (next: AttendeeQuestion[]) => void;
}

const QUICK_PRESETS = [
  { label: "Dietary requirements", type: "short_text" as const },
  { label: "Accessibility needs", type: "short_text" as const },
  {
    label: "How did you hear about us?",
    type: "select" as const,
    options: ["Instagram", "LinkedIn", "Friend", "WhatsApp", "Other"],
  },
];

export function AttendeeQuestionsEditor({ value, onChange }: Props) {
  const update = (idx: number, patch: Partial<AttendeeQuestion>) => {
    const next = [...value];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const remove = (idx: number) => {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  };

  const addBlank = () => {
    onChange([
      ...value,
      { id: newQuestionId(), label: "", type: "short_text", required: false },
    ]);
  };

  const addPreset = (p: (typeof QUICK_PRESETS)[number]) => {
    onChange([
      ...value,
      {
        id: newQuestionId(),
        label: p.label,
        type: p.type,
        required: false,
        options: "options" in p ? p.options : undefined,
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Attendee questions</Label>
        <span className="text-xs text-muted-foreground">
          Asked before checkout
        </span>
      </div>

      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        5 default questions (nibbles, dietary, source, Instagram, media
        consent) are always asked on every event — add any extras below.
      </div>

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No extra questions yet. Add custom or use a quick preset below.
        </p>
      )}


      <div className="space-y-3">
        {value.map((q, idx) => (
          <div
            key={q.id}
            className="border border-border rounded-lg p-3 space-y-2 bg-muted/30"
          >
            <div className="flex items-start gap-2">
              <div className="flex flex-col pt-1 text-muted-foreground">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  className="hover:text-primary disabled:opacity-30"
                  disabled={idx === 0}
                  aria-label="Move up"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
                <Input
                  placeholder="Question label (e.g. Dietary requirements)"
                  value={q.label}
                  onChange={(e) => update(idx, { label: e.target.value })}
                />
                <Select
                  value={q.type}
                  onValueChange={(v) =>
                    update(idx, {
                      type: v as AttendeeQuestion["type"],
                      options:
                        v === "select"
                          ? q.options ?? ["Option 1", "Option 2"]
                          : undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_text">Short text</SelectItem>
                    <SelectItem value="long_text">Long text</SelectItem>
                    <SelectItem value="select">Single choice</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm whitespace-nowrap px-2">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) =>
                      update(idx, { required: e.target.checked })
                    }
                  />
                  Required
                </label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(idx)}
                aria-label="Remove question"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {q.type === "select" && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  Options (one per line)
                </Label>
                <Textarea
                  rows={3}
                  value={(q.options ?? []).join("\n")}
                  onChange={(e) =>
                    update(idx, {
                      options: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={addBlank}>
          <Plus className="h-3 w-3 mr-1" /> Add question
        </Button>
        {QUICK_PRESETS.map((p) => (
          <Button
            key={p.label}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => addPreset(p)}
          >
            + {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
