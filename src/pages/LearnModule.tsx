import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WingListItem from "@/components/learn/WingListItem";
import CourseProgress from "@/components/learn/CourseProgress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft } from "lucide-react";
import type { LearnCourse, LearnModule as LearnModuleType, LearnWing } from "@/lib/learn";

const LearnModule = () => {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<LearnCourse | null>(null);
  const [mod, setMod] = useState<LearnModuleType | null>(null);
  const [wings, setWings] = useState<LearnWing[]>([]);
  const [completedWingIds, setCompletedWingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!courseId || !moduleId) return;
      setLoading(true);

      const [courseRes, moduleRes, wingsRes] = await Promise.all([
        (supabase as any).from("learn_courses").select("*").eq("id", courseId).single(),
        (supabase as any).from("learn_modules").select("*").eq("id", moduleId).single(),
        (supabase as any).from("learn_wings").select("*").eq("module_id", moduleId).order("display_order"),
      ]);

      setCourse(courseRes.data);
      setMod(moduleRes.data);
      setWings(wingsRes.data ?? []);

      const wingIds = (wingsRes.data ?? []).map((w: LearnWing) => w.id);
      if (user && wingIds.length > 0) {
        const { data: progress } = await (supabase as any)
          .from("learn_progress")
          .select("wing_id")
          .eq("user_id", user.id)
          .in("wing_id", wingIds);
        setCompletedWingIds(new Set((progress ?? []).map((p: any) => p.wing_id)));
      }

      setLoading(false);
    };
    load();
  }, [courseId, moduleId, user]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="animate-spin text-muted-foreground" size={28} />
        </div>
      </>
    );
  }

  if (!course || !mod) {
    return (
      <>
        <Header />
        <div className="container max-w-4xl pt-32 pb-20 text-center">
          <p className="text-muted-foreground font-body">Module not found.</p>
          <Link to="/learn" className="text-sm text-blush-dark hover:underline mt-4 inline-block">
            Back to courses
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <section className="relative pt-28 pb-10 md:pt-32 md:pb-14 bg-background overflow-hidden">
        <div className="container max-w-4xl">
          <Link
            to={`/learn/${courseId}`}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft size={14} /> {course.title}
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="font-heading text-3xl md:text-4xl font-semibold leading-tight text-foreground">
              {mod.title}
            </h1>
            {mod.description && (
              <p className="mt-4 text-base text-muted-foreground font-body leading-relaxed max-w-2xl">
                {mod.description}
              </p>
            )}
            <div className="mt-6 max-w-sm">
              <CourseProgress completed={completedWingIds.size} total={wings.length} />
            </div>
          </motion.div>
        </div>
      </section>

      <main className="bg-secondary pb-20">
        <div className="container max-w-4xl pt-10">
          {wings.length === 0 ? (
            <p className="text-center text-muted-foreground font-body py-12">
              Wings are being added. Check back soon!
            </p>
          ) : (
            <div className="space-y-3">
              {wings.map((w) => (
                <WingListItem
                  key={w.id}
                  wing={w}
                  courseId={courseId!}
                  moduleId={moduleId!}
                  completed={completedWingIds.has(w.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default LearnModule;
