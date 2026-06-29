import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { DuneWave } from "./GulfDecoratives";
import { useSiteImages } from "@/hooks/useSiteImages";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InstagramStrip from "./InstagramStrip";
import { responsiveImage } from "@/lib/responsiveImage";

interface GalleryImage {
  id: string;
  url: string;
}

const SUPABASE_URL = "https://uaiymunelgvvnznkxeik.supabase.co";
const MAX_IMAGES = 10;
const VISIBLE_COUNT = 3;
const ROTATE_INTERVAL = 5000;

const GallerySection = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"moments" | "instagram">("moments");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);
  const [nextHidden, setNextHidden] = useState(VISIBLE_COUNT);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const { data: managed, loading: managedLoading } = useSiteImages("gallery");

  useEffect(() => {
    if (managedLoading) return;
    if (managed.length > 0) {
      setImages(managed.slice(0, MAX_IMAGES).map((m) => ({ id: m.id, url: m.url })));
      setLoading(false);
      return;
    }
    const fetchGallery = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-gallery`);
        const data = await res.json();
        const all: GalleryImage[] = data.images || [];
        setImages(all.slice(0, MAX_IMAGES));
      } catch (err) {
        console.error("Failed to fetch gallery:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [managed, managedLoading]);

  // Initialize visible indices
  useEffect(() => {
    if (images.length > 0) {
      setVisibleIndices(
        Array.from({ length: Math.min(VISIBLE_COUNT, images.length) }, (_, i) => i)
      );
      setNextHidden(VISIBLE_COUNT);
    }
  }, [images]);

  // Track whether the section is in view
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Rotate one image at a time every 5s, only while in view
  useEffect(() => {
    if (!inView) return;
    if (images.length <= VISIBLE_COUNT) return;

    const interval = setInterval(() => {
      setVisibleIndices((prev) => {
        // Pick a hidden image (not currently visible)
        const visibleSet = new Set(prev);
        let candidate = nextHidden % images.length;
        let safety = images.length;
        while (visibleSet.has(candidate) && safety-- > 0) {
          candidate = (candidate + 1) % images.length;
        }
        const slotToReplace = Math.floor(Math.random() * prev.length);
        const newIndices = [...prev];
        newIndices[slotToReplace] = candidate;
        setNextHidden(candidate + 1);
        return newIndices;
      });
    }, ROTATE_INTERVAL);

    return () => clearInterval(interval);
  }, [images.length, inView, nextHidden]);

  return (
    <section ref={sectionRef} id="gallery" className="py-7 md:py-10 bg-secondary relative">
      <DuneWave className="absolute top-0 left-0 rotate-180" />
      <div className="container max-w-4xl relative z-10">
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3">In Motion</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center">Community Moments</motion.h2>
        <p className="mt-3 text-center text-muted-foreground font-body">A few moments from Fempower—connection in motion.</p>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "moments" | "instagram")} className="mt-8">
          <TabsList className="mx-auto flex w-fit bg-background/60 border border-border">
            <TabsTrigger value="moments">Moments</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
          </TabsList>

          <TabsContent value="moments">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-muted-foreground" size={32} />
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {visibleIndices.map((imgIndex, slot) => {
                    const img = images[imgIndex];
                    if (!img) return null;
                    return (
                      <motion.div
                        key={`${slot}-${img.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.6 }}
                        className={`overflow-hidden rounded-xl cursor-pointer ${
                          slot === 0 ? "md:row-span-2" : ""
                        }`}
                        onClick={() => setSelected(imgIndex)}
                      >
                        {(() => {
                          const r = responsiveImage(img.url, {
                            widths: [240, 360, 480, 720, 960],
                            sizes: "(min-width: 768px) 33vw, 50vw",
                          });
                          return (
                            <img
                              src={r.src}
                              srcSet={r.srcSet}
                              sizes={r.sizes}
                              alt={`Community moment ${imgIndex + 1}`}
                              width={600}
                              height={600}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 aspect-square"
                            />
                          );
                        })()}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="instagram">
            <InstagramStrip active={tab === "instagram"} />
          </TabsContent>
        </Tabs>
      </div>


      <AnimatePresence>
        {selected !== null && images[selected] && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <button className="absolute top-6 right-6 text-primary-foreground" onClick={() => setSelected(null)}><X size={28} /></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} src={images[selected].url} alt={`Community moment ${selected + 1}`} className="max-w-full max-h-[85vh] rounded-lg object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GallerySection;
