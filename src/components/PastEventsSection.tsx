import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { PalmDivider } from "./GulfDecoratives";

interface Photo {
  id: string;
  storage_path: string;
  caption: string | null;
  alt_text: string | null;
  sort_order: number;
}

interface PastEvent {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
  photos: Photo[];
}

const BUCKET = "event-photos";
const publicUrl = (path: string) =>
  supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

const PastEventsSection = () => {
  const [events, setEvents] = useState<PastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<PastEvent | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: evs } = await supabase
        .from("events")
        .select("id, title, starts_at, location")
        .eq("status", "published")
        .lt("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: false })
        .limit(12);
      if (!evs || evs.length === 0) {
        setLoading(false);
        return;
      }
      const ids = evs.map((e) => e.id);
      const { data: ph } = await (supabase as any)
        .from("event_photos")
        .select("id, event_id, storage_path, caption, alt_text, sort_order")
        .in("event_id", ids)
        .order("sort_order", { ascending: true });
      const byEvent = new Map<string, Photo[]>();
      ((ph as any[]) ?? []).forEach((p) => {
        if (!byEvent.has(p.event_id)) byEvent.set(p.event_id, []);
        byEvent.get(p.event_id)!.push(p);
      });
      const merged: PastEvent[] = evs
        .map((e) => ({ ...e, photos: byEvent.get(e.id) ?? [] }))
        .filter((e) => e.photos.length > 0);
      setEvents(merged);
      setLoading(false);
    })();
  }, []);

  if (loading || events.length === 0) return null;

  const openLightbox = (ev: PastEvent, idx = 0) => {
    setActiveEvent(ev);
    setActivePhotoIdx(idx);
  };

  const closeLightbox = () => setActiveEvent(null);

  const nextPhoto = () => {
    if (!activeEvent) return;
    setActivePhotoIdx((i) => (i + 1) % activeEvent.photos.length);
  };
  const prevPhoto = () => {
    if (!activeEvent) return;
    setActivePhotoIdx((i) => (i - 1 + activeEvent.photos.length) % activeEvent.photos.length);
  };

  return (
    <section id="past-events" className="py-7 md:py-10">
      <PalmDivider className="mb-6" />
      <div className="container max-w-6xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3"
        >
          Where We've Been
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center"
        >
          Moments from Past Gatherings
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-center text-muted-foreground font-body"
        >
          Tap any card to see photos from the event.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {events.map((ev) => {
            const cover = ev.photos[0];
            const dateLabel = new Date(ev.starts_at).toLocaleDateString("en-AE", {
              month: "short",
              year: "numeric",
            });
            return (
              <button
                key={ev.id}
                onClick={() => openLightbox(ev, 0)}
                className="group text-left rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-md transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={publicUrl(cover.storage_path)}
                    alt={cover.caption ?? ev.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {ev.photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[11px] font-body font-semibold text-white bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <Camera size={11} /> {ev.photos.length}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-body uppercase tracking-widest text-blush-dark">
                    {dateLabel}
                  </p>
                  <h3 className="mt-1 font-heading text-lg font-semibold text-foreground group-hover:text-blush-dark transition-colors">
                    {ev.title}
                  </h3>
                  {ev.location && (
                    <p className="mt-0.5 text-sm text-muted-foreground font-body truncate">
                      {ev.location}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </motion.div>
      </div>

      <Dialog open={!!activeEvent} onOpenChange={(o) => !o && closeLightbox()}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          {activeEvent && (
            <div className="relative">
              <button
                onClick={closeLightbox}
                className="absolute -top-2 -right-2 sm:top-2 sm:right-2 z-20 bg-black/70 text-white rounded-full p-2 hover:bg-black"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-black">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeEvent.photos[activePhotoIdx].id}
                    src={publicUrl(activeEvent.photos[activePhotoIdx].storage_path)}
                    alt={activeEvent.photos[activePhotoIdx].caption ?? activeEvent.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                </AnimatePresence>

                {activeEvent.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white rounded-full p-2"
                      aria-label="Previous"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black text-white rounded-full p-2"
                      aria-label="Next"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </div>
              <div className="p-4 text-white">
                <p className="font-heading text-lg">{activeEvent.title}</p>
                {activeEvent.photos[activePhotoIdx].caption && (
                  <p className="text-sm text-white/70 mt-1">
                    {activeEvent.photos[activePhotoIdx].caption}
                  </p>
                )}
                {activeEvent.photos.length > 1 && (
                  <p className="text-xs text-white/50 mt-2">
                    {activePhotoIdx + 1} / {activeEvent.photos.length}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default PastEventsSection;
