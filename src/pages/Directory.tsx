import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MemberCard } from "@/components/directory/MemberCard";
import { MemberDrawer } from "@/components/directory/MemberDrawer";
import { DirectoryFiltersBar } from "@/components/directory/DirectoryFilters";
import { useDirectory, DirectoryFilters } from "@/hooks/useDirectory";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";
import type { MemberProfile } from "@/lib/memberProfile";
import { Link } from "react-router-dom";
import { useMemberProfile } from "@/hooks/useMemberProfile";

const Directory = () => {
  const [filters, setFilters] = useState<DirectoryFilters>({ search: "", industry: null, city: null, lookingFor: null });
  const { items, loading, hasMore, loadMore } = useDirectory(filters);
  const [selected, setSelected] = useState<MemberProfile | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const { profile } = useMemberProfile();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("member_profiles")
        .select("city")
        .eq("status", "approved")
        .not("city", "is", null);
      const set = Array.from(new Set((data ?? []).map((r: any) => r.city).filter(Boolean))).sort();
      setCities(set);
    })();
  }, []);

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-heading text-4xl md:text-5xl text-primary">Member Directory</h1>
              <p className="text-muted-foreground mt-2">Meet the women in the Fempower community.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/account/profile">{profile?.status === "approved" ? "Edit your profile" : "Set up your profile"}</Link>
            </Button>
          </div>

          {profile && profile.status !== "approved" && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-6 text-sm">
              <strong className="text-primary">Your profile is {profile.status}.</strong>{" "}
              {profile.status === "pending" && "An admin will review it shortly. Complete it to speed things up."}
              {profile.status === "rejected" && "Please update your profile and ask an admin to re-review."}
              {profile.status === "hidden" && "Your profile is currently hidden from the directory."}
              {" "}<Link to="/account/profile" className="underline">Go to your profile</Link>
            </div>
          )}

          <DirectoryFiltersBar filters={filters} onChange={setFilters} cities={cities} />

          <div className="mt-8">
            {loading && items.length === 0 ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Users className="mx-auto mb-3 opacity-50" size={32} />
                No members match your filters yet.
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map(m => <MemberCard key={m.id} member={m} onClick={() => setSelected(m)} />)}
                </div>
                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button variant="outline" onClick={loadMore} disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <MemberDrawer member={selected} open={!!selected} onOpenChange={o => !o && setSelected(null)} />
      <Footer />
    </>
  );
};

export default Directory;
