import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Flame, Calendar } from "lucide-react";

interface StreakData {
  wingsThisWeek: number;
  streakDays: number;
}

function computeStreak(dates: string[]): StreakData {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const wingsThisWeek = dates.filter(
    (d) => new Date(d) >= startOfWeek
  ).length;

  const uniqueDays = [
    ...new Set(dates.map((d) => new Date(d).toDateString())),
  ]
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streakDays = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    expected.setHours(0, 0, 0, 0);

    const day = new Date(uniqueDays[i]);
    day.setHours(0, 0, 0, 0);

    if (day.getTime() === expected.getTime()) {
      streakDays++;
    } else {
      break;
    }
  }

  return { wingsThisWeek, streakDays };
}

const LearnStreak = () => {
  const { user } = useAuth();
  const [data, setData] = useState<StreakData | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: rows } = await (supabase as any)
        .from("learn_progress")
        .select("completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      if (rows) {
        setData(computeStreak(rows.map((r: any) => r.completed_at)));
      }
    })();
  }, [user]);

  if (!data || (data.wingsThisWeek === 0 && data.streakDays === 0)) return null;

  return (
    <div className="flex items-center gap-5 text-sm font-body">
      {data.streakDays > 0 && (
        <div className="flex items-center gap-1.5 text-blush-dark">
          <Flame size={16} />
          <span className="font-medium">{data.streakDays} day streak</span>
        </div>
      )}
      {data.wingsThisWeek > 0 && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Calendar size={16} />
          <span>{data.wingsThisWeek} wing{data.wingsThisWeek !== 1 ? "s" : ""} this week</span>
        </div>
      )}
    </div>
  );
};

export default LearnStreak;
