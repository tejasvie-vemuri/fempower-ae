import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Star, GraduationCap, MapPin, ExternalLink, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  EMIRATES,
  CURRICULA,
  fetchPublishedSchools,
  fetchSchoolReviews,
  formatFees,
  type School,
  type SchoolReview,
} from "@/lib/schools";

const StarRow = ({ value, onChange, size = 18 }: { value: number; onChange?: (n: number) => void; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange?.(n)}
        className={onChange ? "cursor-pointer" : "cursor-default"}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
      >
        <Star
          size={size}
          className={n <= value ? "fill-blush-dark text-blush-dark" : "text-muted-foreground/40"}
        />
      </button>
    ))}
  </div>
);

const Schools = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [emirate, setEmirate] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [curriculum, setCurriculum] = useState<string>("all");
  const [active, setActive] = useState<School | null>(null);
  const [reviews, setReviews] = useState<SchoolReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    fetchPublishedSchools()
      .then(setSchools)
      .catch((e) => toast({ title: "Failed to load schools", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    if (!active) return;
    setReviewsLoading(true);
    fetchSchoolReviews(active.id)
      .then(setReviews)
      .finally(() => setReviewsLoading(false));
  }, [active]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schools.filter((s) => {
      if (emirate !== "all" && s.emirate !== emirate) return false;
      if (type !== "all" && s.type !== type) return false;
      if (curriculum !== "all" && !s.curriculum.some((c) => c.toLowerCase().includes(curriculum.toLowerCase()))) return false;
      if (q && !`${s.name} ${s.area ?? ""} ${s.emirate ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [schools, search, emirate, type, curriculum]);

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen bg-background">
        {/* Hero */}
        <section className="container max-w-5xl">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={16} className="text-blush-dark" />
            <p className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark">
              Real parent reviews
            </p>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground">
            UAE School & Nursery Directory
          </h1>
          <p className="mt-3 text-muted-foreground font-body max-w-2xl">
            Fees, curriculum, age range, waitlist status — and what other Fempower mothers actually experienced.
          </p>

          {/* Filters */}
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input placeholder="Search by name or area…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={emirate} onValueChange={setEmirate}>
              <SelectTrigger><SelectValue placeholder="Emirate" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All emirates</SelectItem>
                {EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Schools & nurseries</SelectItem>
                <SelectItem value="school">Schools</SelectItem>
                <SelectItem value="nursery">Nurseries</SelectItem>
              </SelectContent>
            </Select>
            <Select value={curriculum} onValueChange={setCurriculum}>
              <SelectTrigger><SelectValue placeholder="Curriculum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All curricula</SelectItem>
                {CURRICULA.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setRequestOpen(true)} className="font-body text-xs">
              <PlusCircle size={14} className="mr-1.5" /> Request a school
            </Button>
          </div>
        </section>

        {/* Grid */}
        <section className="container max-w-5xl mt-8">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-body">
              No schools match your filters yet. {schools.length === 0 && "The directory is being curated — check back soon."}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((s) => (
                <SchoolCard key={s.id} school={s} onClick={() => setActive(s)} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />

      {/* Detail drawer */}
      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle className="font-heading text-2xl">{active.name}</SheetTitle>
                <SheetDescription className="font-body">
                  {[active.area, active.emirate].filter(Boolean).join(", ")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">{active.type}</Badge>
                  {active.curriculum.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
                  {active.waitlist_status && active.waitlist_status !== "unknown" && (
                    <Badge variant="outline" className="capitalize">Waitlist: {active.waitlist_status}</Badge>
                  )}
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm font-body">
                  {(active.age_min != null || active.age_max != null) && (
                    <div><dt className="text-muted-foreground">Age range</dt><dd>{active.age_min ?? "?"}–{active.age_max ?? "?"} yrs</dd></div>
                  )}
                  {formatFees(active) && (
                    <div><dt className="text-muted-foreground">Fees</dt><dd>{formatFees(active)}</dd></div>
                  )}
                  {active.website_url && (
                    <div className="col-span-2">
                      <a href={active.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blush-dark hover:underline">
                        Official site <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </dl>

                {active.description && (
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">{active.description}</p>
                )}

                {/* Reviews */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading text-lg font-semibold">Member reviews</h3>
                    {user ? (
                      <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>Write a review</Button>
                    ) : (
                      <Button size="sm" variant="outline" asChild><Link to="/auth">Sign in to review</Link></Button>
                    )}
                  </div>

                  {reviewsLoading ? (
                    <Loader2 className="animate-spin text-muted-foreground" size={18} />
                  ) : reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground font-body">No reviews yet. Be the first.</p>
                  ) : (
                    <ul className="space-y-4">
                      {reviews.map((r) => (
                        <li key={r.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between">
                            <StarRow value={r.rating} size={14} />
                            <span className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="mt-2 text-sm font-body whitespace-pre-wrap">{r.body}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground font-body">
                            {r.curriculum && <span>Curriculum: {r.curriculum}</span>}
                            {r.child_age_group && <span>· Age: {r.child_age_group}</span>}
                            {r.fees_paid_cents != null && <span>· Paid AED {(r.fees_paid_cents / 100).toLocaleString()}{r.fees_year ? ` (${r.fees_year})` : ""}</span>}
                          </div>
                          {r.waitlist_experience && (
                            <p className="mt-1.5 text-xs text-muted-foreground font-body italic">Waitlist: {r.waitlist_experience}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Review submit dialog */}
      {active && (
        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          school={active}
          onSubmitted={() => { setReviewOpen(false); toast({ title: "Thanks! Your review is pending review." }); }}
        />
      )}

      {/* Request school dialog */}
      <RequestSchoolDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </>
  );
};

const SchoolCard = ({ school, onClick }: { school: School; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left bg-card rounded-xl p-5 border border-border hover:shadow-md hover:border-blush-dark/40 transition-all"
  >
    <div className="flex items-start justify-between gap-3">
      <h3 className="font-heading text-base font-semibold text-foreground">{school.name}</h3>
      <Badge variant="secondary" className="capitalize text-[10px]">{school.type}</Badge>
    </div>
    {(school.emirate || school.area) && (
      <p className="mt-1 text-xs text-muted-foreground font-body inline-flex items-center gap-1">
        <MapPin size={11} /> {[school.area, school.emirate].filter(Boolean).join(", ")}
      </p>
    )}
    {school.curriculum.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-1">
        {school.curriculum.slice(0, 3).map((c) => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
      </div>
    )}
    {formatFees(school) && (
      <p className="mt-3 text-xs font-body text-muted-foreground">{formatFees(school)}</p>
    )}
  </button>
);

const ReviewDialog = ({ open, onOpenChange, school, onSubmitted }: { open: boolean; onOpenChange: (o: boolean) => void; school: School; onSubmitted: () => void }) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [childAge, setChildAge] = useState("");
  const [waitlist, setWaitlist] = useState("");
  const [feesPaid, setFeesPaid] = useState("");
  const [feesYear, setFeesYear] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (body.trim().length < 10) {
      toast({ title: "Review must be at least 10 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("schools-submit-review", {
        body: {
          school_id: school.id,
          rating,
          body: body.trim(),
          curriculum: curriculum || null,
          child_age_group: childAge || null,
          waitlist_experience: waitlist || null,
          fees_paid_aed: feesPaid ? parseInt(feesPaid, 10) : null,
          fees_year: feesYear || null,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      onSubmitted();
      setBody(""); setCurriculum(""); setChildAge(""); setWaitlist(""); setFeesPaid(""); setFeesYear(""); setRating(5);
    } catch (e: any) {
      toast({ title: "Could not submit", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Review {school.name}</DialogTitle>
          <DialogDescription>Your review will be visible after admin approval.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Overall rating</Label>
            <div className="mt-1"><StarRow value={rating} onChange={setRating} /></div>
          </div>
          <div>
            <Label className="text-xs">Your experience *</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="What worked, what didn't, what you wish you'd known…" maxLength={4000} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Curriculum</Label>
              <Input value={curriculum} onChange={(e) => setCurriculum(e.target.value)} placeholder="e.g. British" />
            </div>
            <div>
              <Label className="text-xs">Child's age group</Label>
              <Input value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="e.g. FS2" />
            </div>
            <div>
              <Label className="text-xs">Fees paid (AED)</Label>
              <Input type="number" value={feesPaid} onChange={(e) => setFeesPaid(e.target.value)} placeholder="e.g. 45000" />
            </div>
            <div>
              <Label className="text-xs">Academic year</Label>
              <Input value={feesYear} onChange={(e) => setFeesYear(e.target.value)} placeholder="e.g. 2025-26" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Waitlist experience</Label>
            <Textarea value={waitlist} onChange={(e) => setWaitlist(e.target.value)} rows={2} placeholder="How long did you wait? Did you get in?" maxLength={1000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="animate-spin mr-2" size={14} />}
            Submit review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RequestSchoolDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) {
      toast({ title: "Please sign in to request a school", variant: "destructive" });
      return;
    }
    if (!name.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("school_requests").insert({
      user_id: user.id,
      name: name.trim(),
      website_url: website.trim() || null,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Thanks — we'll review your request." });
    setName(""); setWebsite(""); setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Request a school</DialogTitle>
          <DialogDescription>Tell us what's missing and we'll add it to the directory.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">School / nursery name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !name.trim()}>
            {submitting && <Loader2 className="animate-spin mr-2" size={14} />}
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Schools;
