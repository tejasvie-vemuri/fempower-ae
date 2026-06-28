import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface SharedReflection {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name?: string;
}

interface SharedReflectionsProps {
  wingId: string;
  refreshKey: number;
}

const SharedReflections = ({ wingId, refreshKey }: SharedReflectionsProps) => {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<SharedReflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("learn_reflections")
        .select("id, content, created_at, user_id")
        .eq("wing_id", wingId)
        .eq("is_shared", true)
        .neq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((r: any) => r.user_id))];
        const { data: profiles } = await supabase
          .from("member_profiles")
          .select("user_id, name")
          .in("user_id", userIds as string[]);
        const nameMap = new Map(
          (profiles ?? []).map((p) => [p.user_id, p.name])
        );
        setReflections(
          data.map((r: any) => ({
            ...r,
            author_name: nameMap.get(r.user_id) ?? "A member",
          }))
        );
      } else {
        setReflections([]);
      }
      setLoading(false);
    };
    load();
  }, [wingId, user?.id, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3 mt-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (reflections.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h3 className="font-heading text-lg">What others are reflecting on</h3>
      {reflections.map((r) => (
        <div key={r.id} className="border border-border rounded-xl p-4 bg-secondary/30">
          <p className="font-body text-sm italic text-foreground/80">{r.content}</p>
          <p className="text-xs text-muted-foreground mt-2">— {r.author_name}</p>
        </div>
      ))}
    </div>
  );
};

export default SharedReflections;
