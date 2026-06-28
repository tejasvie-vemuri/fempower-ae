import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReflectionEditor from "@/components/learn/ReflectionEditor";
import SharedReflections from "@/components/learn/SharedReflections";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  Rocket,
  Clock,
} from "lucide-react";
import type { LearnCourse, LearnModule, LearnWing as LearnWingType, LearnReflection } from "@/lib/learn";

const LearnWing = () => {
  const { courseId, moduleId, wingId } = useParams<{
    courseId: string;
    moduleId: string;
    wingId: string;
  }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<LearnCourse | null>(null);
  const [mod, setMod] = useState<LearnModule | null>(null);
  const [wing, setWing] = useState<LearnWingType | null>(null);
  const [allWings, setAllWings] = useState<LearnWingType[]>([]);
  const [completed, setCompleted] = useState(false);
  const [completedSiblingIds, setCompletedSiblingIds] = useState<Set<string>>(new Set());
  const [myReflection, setMyReflection] = useState<LearnReflection | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    if (!courseId || !moduleId || !wingId) return;
    setLoading(true);

    const [courseRes, moduleRes, wingRes, siblingsRes] = await Promise.all([
      (supabase as any).from("learn_courses").select("*").eq("id", courseId).single(),
      (supabase as any).from("learn_modules").select("*").eq("id", moduleId).single(),
      (supabase as any).from("learn_wings").select("*").eq("id", wingId).single(),
      (supabase as any).from("learn_wings").select("id, title, display_order").eq("module_id", moduleId).order("display_order"),
    ]);

    setCourse(courseRes.data);
    setMod(moduleRes.data);
    setWing(wingRes.data);
    setAllWings(siblingsRes.data ?? []);

    if (user && wingId) {
      const [progressRes, reflectionRes, moduleProgressRes] = await Promise.all([
        (supabase as any)
          .from("learn_progress")
          .select("id")
          .eq("user_id", user.id)
          .eq("wing_id", wingId)
          .maybeSingle(),
        (supabase as any)
          .from("learn_reflections")
          .select("*")
          .eq("user_id", user.id)
          .eq("wing_id", wingId)
          .maybeSingle(),
        (supabase as any)
          .from("learn_progress")
          .select("wing_id")
          .eq("user_id", user.id)
          .in("wing_id", (siblingsRes.data ?? []).map((w: { id: string }) => w.id)),
      ]);
      setCompleted(!!progressRes.data);
      setMyReflection(reflectionRes.data);
      setCompletedSiblingIds(
        new Set((moduleProgressRes.data ?? []).map((r: { wing_id: string }) => r.wing_id))
      );
    } else {
      setCompletedSiblingIds(new Set());
    }

    setLoading(false);
  }, [courseId, moduleId, wingId, user]);

  useEffect(() => {
    load();
  }, [load]);

  const markComplete = async () => {
    if (!user || !wingId) return;
    setMarking(true);
    const { error } = await (supabase as any)
      .from("learn_progress")
      .insert({ user_id: user.id, wing_id: wingId });
    setMarking(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("Could not mark as complete");
      return;
    }
    setCompleted(true);
    setCompletedSiblingIds((prev) => new Set(prev).add(wingId));
    toast.success("Wing completed!");
  };

  const currentIdx = allWings.findIndex((w) => w.id === wingId);
  const prevWing = currentIdx > 0 ? allWings[currentIdx - 1] : null;
  const nextWing = currentIdx < allWings.length - 1 ? allWings[currentIdx + 1] : null;
  const totalWings = allWings.length;
  const doneCount = completedSiblingIds.size;
  const progressPct = totalWings > 0 ? Math.round((doneCount / totalWings) * 100) : 0;

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

  if (!course || !mod || !wing) {
    return (
      <>
        <Header />
        <div className="container max-w-3xl pt-32 pb-20 text-center">
          <p className="text-muted-foreground font-body">Wing not found.</p>
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

      <main className="container max-w-3xl pt-28 md:pt-32 pb-20">
        {/* Breadcrumb */}
        <nav className="text-sm font-body text-muted-foreground mb-8 flex items-center gap-1 flex-wrap">
          <Link to="/learn" className="hover:text-foreground">Learn</Link>
          <span>/</span>
          <Link to={`/learn/${courseId}`} className="hover:text-foreground">{course.title}</Link>
          <span>/</span>
          <Link to={`/learn/${courseId}/${moduleId}`} className="hover:text-foreground">{mod.title}</Link>
        </nav>

        <h1 className="font-heading text-3xl md:text-4xl font-semibold leading-tight text-foreground">
          {wing.title}
        </h1>
        <div className="flex items-center gap-3 mt-3">
          {wing.estimated_minutes && (
            <Badge variant="secondary" className="font-body">
              <Clock size={12} className="mr-1" /> {wing.estimated_minutes} min
            </Badge>
          )}
          {completed && (
            <Badge variant="outline" className="text-blush-dark border-blush-dark font-body">
              <CheckCircle2 size={12} className="mr-1" /> Completed
            </Badge>
          )}
        </div>

        {/* Context */}
        <section className="mt-10">
          <h2 className="font-heading text-xl flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-blush-dark" /> Context
          </h2>
          <div className="font-body text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {wing.context_content}
          </div>
        </section>

        <Separator className="my-10" />

        {/* Reflection */}
        <section>
          <h2 className="font-heading text-xl flex items-center gap-2 mb-4">
            <Lightbulb size={18} className="text-blush-dark" /> Reflect
          </h2>
          {wing.reflection_prompt && (
            <p className="font-body italic text-blush-dark mb-5 leading-relaxed">
              {wing.reflection_prompt}
            </p>
          )}
          <ReflectionEditor
            wingId={wingId!}
            existing={myReflection}
            onSaved={() => {
              setRefreshKey((k) => k + 1);
              load();
            }}
          />
          <SharedReflections wingId={wingId!} refreshKey={refreshKey} />
        </section>

        <Separator className="my-10" />

        {/* Extension */}
        <section>
          <h2 className="font-heading text-xl flex items-center gap-2 mb-4">
            <Rocket size={18} className="text-blush-dark" /> Extend
          </h2>
          <div className="font-body text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {wing.extension_content}
          </div>
        </section>

        {/* Mark complete + navigation */}
        <div className="mt-12 flex items-center justify-between flex-wrap gap-4">
          {prevWing ? (
            <Button variant="outline" size="sm" asChild className="font-body">
              <Link to={`/learn/${courseId}/${moduleId}/${prevWing.id}`}>
                <ArrowLeft size={14} className="mr-1" /> Previous
              </Link>
            </Button>
          ) : (
            <div />
          )}

          {!completed ? (
            <Button onClick={markComplete} disabled={marking} className="font-body">
              {marking && <Loader2 size={14} className="mr-2 animate-spin" />}
              <CheckCircle2 size={14} className="mr-1" /> Mark as complete
            </Button>
          ) : (
            <p className="text-sm text-blush-dark font-body flex items-center gap-1">
              <CheckCircle2 size={14} /> Completed
            </p>
          )}

          {nextWing ? (
            <Button variant="outline" size="sm" asChild className="font-body">
              <Link to={`/learn/${courseId}/${moduleId}/${nextWing.id}`}>
                Next <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild className="font-body">
              <Link to={`/learn/${courseId}/${moduleId}`}>
                Back to module <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default LearnWing;
