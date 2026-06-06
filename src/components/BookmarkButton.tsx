import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface BookmarkButtonProps {
  itemType: "circle_post" | "resource";
  itemId: string;
  className?: string;
  /** Optional callback when save state changes */
  onToggle?: (saved: boolean) => void;
}

const BookmarkButton = ({ itemType, itemId, className = "", onToggle }: BookmarkButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();
      setSaved(!!data);
    })();
  }, [user, itemType, itemId]);

  if (!user) return null;

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      if (saved) {
        await (supabase as any)
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId);
        setSaved(false);
        onToggle?.(false);
        toast({ title: "Removed from bookmarks" });
      } else {
        await (supabase as any)
          .from("bookmarks")
          .insert({ user_id: user.id, item_type: itemType, item_id: itemId });
        setSaved(true);
        onToggle?.(true);
        toast({ title: "Saved to your bookmarks" });
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Remove bookmark" : "Save to bookmarks"}
      title={saved ? "Remove bookmark" : "Save to bookmarks"}
      disabled={loading}
      className={`inline-flex items-center justify-center transition-transform active:scale-125 disabled:opacity-50 ${className}`}
    >
      <Bookmark
        size={15}
        className={`transition-colors ${saved ? "fill-blush-dark text-blush-dark" : "text-muted-foreground hover:text-foreground"}`}
      />
    </button>
  );
};

export default BookmarkButton;
