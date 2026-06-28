import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, BookOpen, Globe } from "lucide-react";

interface JournalEntry {
  id: string;
  content: string;
  is_shared: boolean;
  created_at: string;
  wing_title: string;
  module_title: string;
  course_title: string;
  course_id: string;
  module_id: string;
  wing_id: string;
}

const LearnJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const { data: reflections } = await (supabase as any)
        .from("learn_reflections")
        .select("id, content, is_shared, created_at, wing_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!reflections || reflections.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }

      const wingIds = reflections.map((r: any) => r.wing_id);
      const { data: wings } = await (supabase as any)
        .from("learn_wings")
        .select("id, title, module_id")
        .in("id", wingIds);

      const moduleIds = [...new Set((wings ?? []).map((w: any) => w.module_id))];
      const { data: modules } = await (supabase as any)
        .from("learn_modules")
        .select("id, title, course_id")
        .in("id", moduleIds);

      const courseIds = [...new Set((modules ?? []).map((m: any) => m.course_id))];
      const { data: courses } = await (supabase as any)
        .from("learn_courses")
        .select("id, title")
        .in("id", courseIds);

      const wingMap = new Map<string, any>((wings ?? []).map((w: any) => [w.id, w]));
      const moduleMap = new Map<string, any>((modules ?? []).map((m: any) => [m.id, m]));
      const courseMap = new Map<string, any>((courses ?? []).map((c: any) => [c.id, c]));

      setEntries(
        reflections.map((r: any) => {
          const wing = wingMap.get(r.wing_id);
          const mod = wing ? moduleMap.get(wing.module_id) : null;
          const course = mod ? courseMap.get(mod.course_id) : null;
          return {
            id: r.id,
            content: r.content,
            is_shared: r.is_shared,
            created_at: r.created_at,
            wing_title: wing?.title ?? "Unknown",
            module_title: mod?.title ?? "Unknown",
            course_title: course?.title ?? "Unknown",
            course_id: course?.id ?? "",
            module_id: mod?.id ?? "",
            wing_id: r.wing_id,
          };
        })
      );
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <>
      <Header />

      <section className="relative pt-28 pb-10 md:pt-32 md:pb-14 bg-background overflow-hidden">
        <div className="container max-w-3xl">
          <Link
            to="/learn"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft size={14} /> Back to courses
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="flex items-center gap-2 text-xs md:text-sm font-body font-bold uppercase tracking-widest-xl text-blush-dark mb-4">
              <BookOpen size={14} /> My Learning Journal
            </p>
            <h1 className="font-heading text-3xl md:text-4xl font-semibold leading-tight text-foreground">
              All your reflections in one place.
            </h1>
          </motion.div>
        </div>
      </section>

      <main className="bg-secondary pb-20">
        <div className="container max-w-3xl pt-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-muted-foreground font-body py-20">
              No reflections yet. Start a course and write your first one!
            </p>
          ) : (
            <div className="space-y-5">
              {entries.map((e) => (
                <article key={e.id} className="border border-border rounded-xl p-5 bg-card">
                  <div className="flex items-center gap-2 text-xs font-body text-muted-foreground mb-3 flex-wrap">
                    <Link
                      to={`/learn/${e.course_id}`}
                      className="hover:text-foreground"
                    >
                      {e.course_title}
                    </Link>
                    <span>/</span>
                    <Link
                      to={`/learn/${e.course_id}/${e.module_id}`}
                      className="hover:text-foreground"
                    >
                      {e.module_title}
                    </Link>
                    <span>/</span>
                    <Link
                      to={`/learn/${e.course_id}/${e.module_id}/${e.wing_id}`}
                      className="hover:text-foreground font-medium text-foreground"
                    >
                      {e.wing_title}
                    </Link>
                  </div>
                  <p className="font-body text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {e.content}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleDateString("en-AE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {e.is_shared && (
                      <Badge variant="outline" className="text-xs font-body">
                        <Globe size={10} className="mr-1" /> Shared
                      </Badge>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default LearnJournal;
