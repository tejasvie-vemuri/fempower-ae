import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
}

const SUPABASE_URL = "https://uaiymunelgvvnznkxeik.supabase.co";
const VISIBLE_COUNT = 5;
const ROTATE_INTERVAL = 3000;

const GallerySection = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleIndices, setVisibleIndices] = useState<number[]>([]);
  const [nextHidden, setNextHidden] = useState(VISIBLE_COUNT);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/fetch-gallery`);
        const data = await res.json();
        setImages(data.images || []);
      } catch (err) {
        console.error("Failed to fetch gallery:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  // Initialize visible indices
  useEffect(() => {
    if (images.length > 0) {
      setVisibleIndices(
        Array.from({ length: Math.min(VISIBLE_COUNT, images.length) }, (_, i) => i)
      );
      setNextHidden(VISIBLE_COUNT);
    }
  }, [images]);

  // Rotate one image at a time every 3s
  useEffect(() => {
    if (images.length <= VISIBLE_COUNT) return;

    const interval = setInterval(() => {
      setVisibleIndices((prev) => {
        const slotToReplace = Math.floor(Math.random() * prev.length);
        const newIndices = [...prev];
        setNextHidden((nh) => {
          newIndices[slotToReplace] = nh % images.length;
          return nh + 1;
        });
        return newIndices;
      });
    }, ROTATE_INTERVAL);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section id="gallery" className="py-16 md:py-20 bg-secondary">
      <div className="container max-w-4xl">
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3">In Motion</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center">Community Moments</motion.h2>
        <p className="mt-3 text-center text-muted-foreground font-body">A few moments from Fempower—connection in motion.</p>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {visibleIndices.map((imgIndex, slot) => {
                const img = images[imgIndex];
                if (!img) return null;
                return (
                  <motion.div
                    key={img.id}
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
                    <img
                      src={img.url}
                      alt={`Community moment ${imgIndex + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 aspect-square"
                      loading="lazy"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
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
