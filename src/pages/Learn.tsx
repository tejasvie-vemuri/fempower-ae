import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CourseCard from "@/components/learn/CourseCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen } from "lucide-react";
import LearnStreak from "@/components/learn/LearnStreak";
import WingOfTheWeek from "@/components/learn/WingOfTheWeek";
import type { LearnCourse, CourseWithProgress } from "@/lib/learn";

const Learn = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: courseRows } = await (supabase as any)
        .from("learn_courses")
        .select("*")
        .eq("status", "published")
        .order("display_order");

      if (!courseRows || courseRows.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      const courseIds = courseRows.map((c: LearnCourse) => c.id);

      const { data: moduleRows } = await (supabase as any)
        .from("learn_modules")
        .select("id, course_id")
        .in("course_id", courseIds);

      const moduleIds = (moduleRows ?? []).map((m: any) => m.id);
      const moduleCourseMap = new Map<string, string>(
        (moduleRows ?? []).map((m: any) => [m.id, m.course_id])
      );

      const { data: wingRows } = moduleIds.length > 0
        ? await (supabase as any)
            .from("learn_wings")
            .select("id, module_id")
            .in("module_id", moduleIds)
        : { data: [] };

      const wingCourseMap = new Map<string, string>();
      (wingRows ?? []).forEach((w: any) => {
        const courseId = moduleCourseMap.get(w.module_id);
        if (courseId) wingCourseMap.set(w.id, courseId);
      });

      const totalByCourse = new Map<string, number>();
      wingCourseMap.forEach((courseId) => {
        totalByCourse.set(courseId, (totalByCourse.get(courseId) ?? 0) + 1);
      });

      let completedByCourse = new Map<string, number>();
      if (user) {
        const allWingIds = Array.from(wingCourseMap.keys());
        const { data: progressRows } = allWingIds.length > 0
          ? await (supabase as any)
              .from("learn_progress")
              .select("wing_id")
              .eq("user_id", user.id)
              .in("wing_id", allWingIds)
          : { data: [] };
        (progressRows ?? []).forEach((p: any) => {
          const courseId = wingCourseMap.get(p.wing_id);
          if (courseId) {
            completedByCourse.set(courseId, (completedByCourse.get(courseId) ?? 0) + 1);
          }
        });
      }

      setCourses(
        courseRows.map((c: LearnCourse) => ({
          ...c,
          totalWings: totalByCourse.get(c.id) ?? 0,
          completedWings: completedByCourse.get(c.id) ?? 0,
        }))
      );
      setLoading(false);
    };

    load();
  }, [user]);

  return (
    <>
      <Header />

      <section className="relative pt-28 pb-10 md:pt-32 md:pb-14 bg-background overflow-hidden">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="flex items-center gap-2 text-xs md:text-sm font-body font-bold uppercase tracking-widest-xl text-blush-dark mb-4">
              <BookOpen size={14} /> FemPower Learn
            </p>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-foreground">
              Build your wings, one lesson at a time.
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground font-body leading-relaxed max-w-2xl">
              Bite-sized learning designed for ambitious women. Pick a course, work through the wings, and reflect on what you learn along the way.
            </p>
            <div className="mt-7 flex items-center gap-6 flex-wrap">
              <Button asChild variant="outline" size="sm" className="font-body uppercase tracking-widest text-xs">
                <Link to="/learn/journal">My Learning Journal</Link>
              </Button>
              <LearnStreak />
            </div>
          </motion.div>
        </div>
      </section>

      <main className="bg-secondary pb-20">
        <div className="container max-w-6xl pt-10">
          <WingOfTheWeek />
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
          ) : courses.length === 0 ? (
            <p className="text-center text-muted-foreground font-body py-20">
              Courses are being prepared. Check back soon!
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Learn;
