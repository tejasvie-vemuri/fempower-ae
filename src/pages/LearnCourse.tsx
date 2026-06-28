import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ModuleAccordion from "@/components/learn/ModuleAccordion";
import CourseProgress from "@/components/learn/CourseProgress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import type { LearnCourse, LearnModule, LearnWing, LearnResource } from "@/lib/learn";

const LearnCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<LearnCourse | null>(null);
  const [modules, setModules] = useState<LearnModule[]>([]);
  const [wingsByModule, setWingsByModule] = useState<Record<string, LearnWing[]>>({});
  const [resources, setResources] = useState<LearnResource[]>([]);
  const [completedWingIds, setCompletedWingIds] = useState<Set<string>>(new Set());
  const [totalWings, setTotalWings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!courseId) return;
      setLoading(true);

      const [courseRes, modulesRes, resourcesRes] = await Promise.all([
        (supabase as any).from("learn_courses").select("*").eq("id", courseId).single(),
        (supabase as any).from("learn_modules").select("*").eq("course_id", courseId).order("display_order"),
        (supabase as any).from("learn_resources").select("*").eq("course_id", courseId).order("display_order"),
      ]);

      setCourse(courseRes.data);
      setModules(modulesRes.data ?? []);
      setResources(resourcesRes.data ?? []);

      const moduleIds = (modulesRes.data ?? []).map((m: LearnModule) => m.id);
      if (moduleIds.length > 0) {
        const { data: wings } = await (supabase as any)
          .from("learn_wings")
          .select("*")
          .in("module_id", moduleIds)
          .order("display_order");

        const grouped: Record<string, LearnWing[]> = {};
        (wings ?? []).forEach((w: LearnWing) => {
          if (!grouped[w.module_id]) grouped[w.module_id] = [];
          grouped[w.module_id].push(w);
        });
        setWingsByModule(grouped);

        const allWingIds = (wings ?? []).map((w: LearnWing) => w.id);
        setTotalWings(allWingIds.length);

        if (user && allWingIds.length > 0) {
          const { data: progress } = await (supabase as any)
            .from("learn_progress")
            .select("wing_id")
            .eq("user_id", user.id)
            .in("wing_id", allWingIds);
          setCompletedWingIds(new Set((progress ?? []).map((p: any) => p.wing_id)));
        }
      }

      setLoading(false);
    };
    load();
  }, [courseId, user]);

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

  if (!course) {
    return (
      <>
        <Header />
        <div className="container max-w-4xl pt-32 pb-20 text-center">
          <p className="text-muted-foreground font-body">Course not found.</p>
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
            to="/learn"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft size={14} /> All courses
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-4xl block mb-3">{course.emoji}</span>
            <h1 className="font-heading text-3xl md:text-4xl font-semibold leading-tight text-foreground">
              {course.title}
            </h1>
            {course.description && (
              <p className="mt-4 text-base text-muted-foreground font-body leading-relaxed max-w-2xl">
                {course.description}
              </p>
            )}
            <div className="mt-6 max-w-sm">
              <CourseProgress completed={completedWingIds.size} total={totalWings} />
              <p className="mt-3 text-sm font-body font-semibold text-foreground/80">
                Inspired by Karthi Subburaman
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="bg-secondary pb-20">
        <div className="container max-w-4xl pt-10">
          {modules.length === 0 ? (
            <p className="text-center text-muted-foreground font-body py-12">
              Modules are being added. Check back soon!
            </p>
          ) : (
            <ModuleAccordion
              modules={modules}
              wingsByModule={wingsByModule}
              courseId={courseId!}
              completedWingIds={completedWingIds}
            />
          )}

          {resources.length > 0 && (
            <section className="mt-12">
              <h2 className="font-heading text-2xl mb-4">Resources</h2>
              <div className="space-y-3">
                {resources.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body font-medium">{r.title}</p>
                        {r.description && (
                          <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                        )}
                      </div>
                      <ExternalLink size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default LearnCourse;
