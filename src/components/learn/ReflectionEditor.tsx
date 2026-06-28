import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { LearnReflection } from "@/lib/learn";

interface ReflectionEditorProps {
  wingId: string;
  existing: LearnReflection | null;
  onSaved: () => void;
}

const ReflectionEditor = ({ wingId, existing, onSaved }: ReflectionEditorProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState(existing?.content ?? "");
  const [isShared, setIsShared] = useState(existing?.is_shared ?? false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || !content.trim()) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      wing_id: wingId,
      content: content.trim(),
      is_shared: isShared,
    };
    const { error } = existing
      ? await (supabase as any)
          .from("learn_reflections")
          .update({ content: payload.content, is_shared: payload.is_shared })
          .eq("id", existing.id)
      : await (supabase as any).from("learn_reflections").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("Could not save reflection");
    } else {
      toast.success("Reflection saved");
      onSaved();
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reflection..."
        rows={4}
        className="font-body"
      />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="share-reflection"
            checked={isShared}
            onCheckedChange={setIsShared}
          />
          <Label htmlFor="share-reflection" className="text-sm font-body cursor-pointer">
            Share with other members
          </Label>
        </div>
        <Button onClick={save} disabled={saving || !content.trim()} size="sm">
          {saving && <Loader2 size={14} className="mr-2 animate-spin" />}
          {existing ? "Update reflection" : "Save reflection"}
        </Button>
      </div>
    </div>
  );
};

export default ReflectionEditor;
