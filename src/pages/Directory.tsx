import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MemberCard } from "@/components/directory/MemberCard";
import { MemberDrawer } from "@/components/directory/MemberDrawer";
import { DirectoryFiltersBar } from "@/components/directory/DirectoryFilters";
import { useDirectory, DirectoryFilters } from "@/hooks/useDirectory";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, Sparkles } from "lucide-react";
import type { MemberProfile } from "@/lib/memberProfile";
import { Link } from "react-router-dom";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { PalmDivider, DuneWave, CrescentStar } from "@/components/GulfDecoratives";

const Directory = () => {
  const [filters, setFilters] = useState<DirectoryFilters>({ search: "", industry: null, city: null, lookingFor: null });
  const { items, loading, hasMore, loadMore } = useDirectory(filters);
  const [selected, setSelected] = useState<MemberProfile | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const { profile } = useMemberProfile();

  useEffect(() => {
    (async () => {
      const [{ data: cityRows }, { count }] = await Promise.all([
        supabase.from("member_profiles").select("city").eq("status", "approved").not("city", "is", null),
        supabase.from("member_profiles").select("*", { count: "exact", head: true }).eq("status", "approved"),
      ]);
      const set = Array.from(new Set((cityRows ?? []).map((r: any) => r.city).filter(Boolean))).sort();
      setCities(set);
      setTotalCount(count ?? null);
    })();
  }, []);

  return (
    <>
      <Header />

      {/* Hero — editorial intro inline with Fempower brand */}
      <section className="relative pt-28 pb-10 md:pt-32 md:pb-14 bg-background overflow-hidden">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="flex items-center gap-2 text-xs md:text-sm font-body font-bold uppercase tracking-widest-xl text-blush-dark mb-4">
              <CrescentStar size={14} /> The Sisterhood · UAE
            </p>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight text-foreground">
              Meet the women rising together.
            </h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground font-body leading-relaxed max-w-2xl">
              A living directory of the Fempower community — founders, creatives, mentors, and changemakers across Dubai and the UAE. Search, filter, and find your people.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button asChild size="lg" className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs px-8 h-12">
                <Link to="/account/profile">
                  {profile?.status === "approved" ? "Edit your profile" : "Set up your profile"}
                </Link>
              </Button>
              {totalCount !== null && (
                <p className="text-xs font-body uppercase tracking-widest text-muted-foreground">
                  {totalCount} {totalCount === 1 ? "member" : "members"} listed
                </p>
              )}
            </div>
          </motion.div>
        </div>
        <DuneWave className="absolute bottom-0 left-0" />
      </section>

      {/* Main grid */}
      <main className="bg-secondary pb-20">
        <PalmDivider className="pt-10 pb-2" />
        <div className="container max-w-6xl pt-6">
          {profile && profile.status !== "approved" && (
            <div className="rounded-xl border border-blush-dark/30 bg-blush-light/60 p-4 mb-8 text-sm font-body flex items-start gap-3">
              <Sparkles size={16} className="text-blush-dark mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">Your profile is {profile.status}.</strong>{" "}
                {profile.status === "pending" && "An admin will review it shortly. Complete it to speed things up."}
                {profile.status === "rejected" && "Please update your profile and ask an admin to re-review."}
                {profile.status === "hidden" && "Your profile is currently hidden from the directory."}
                {" "}
                <Link to="/account/profile" className="underline underline-offset-2 text-blush-dark hover:text-foreground">
                  Go to your profile →
                </Link>
              </div>
            </div>
          )}

          {/* Filter bar — elevated card */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4 md:p-5 mb-8">
            <DirectoryFiltersBar filters={filters} onChange={setFilters} cities={cities} />
          </div>

          {loading && items.length === 0 ? (
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-blush-dark" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground font-body">
              <Users className="mx-auto mb-3 opacity-40 text-blush-dark" size={36} />
              <p className="font-heading text-xl text-foreground">No members match your search</p>
              <p className="mt-1 text-sm">Try clearing a filter or search term.</p>
            </div>
          ) : (
            <>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {items.map(m => (
                  <motion.div
                    key={m.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  >
                    <MemberCard member={m} onClick={() => setSelected(m)} />
                  </motion.div>
                ))}
              </motion.div>
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                    className="font-body uppercase tracking-widest text-xs px-10 h-12 border-foreground/20"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Load more members"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <MemberDrawer member={selected} open={!!selected} onOpenChange={o => !o && setSelected(null)} />
      <Footer />
    </>
  );
};

export default Directory;
