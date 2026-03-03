import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
}

const SUPABASE_URL = "https://uaiymunelgvvnznkxeik.supabase.co";

const GallerySection = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section id="gallery" className="py-16 md:py-20 bg-secondary">
      <div className="container">
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark text-center mb-3">In Motion</motion.p>
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center">Community Moments</motion.h2>
        <p className="mt-3 text-center text-muted-foreground font-body">A few moments from Fempower—connection in motion.</p>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : (
          <div className="mt-10 columns-2 md:columns-3 gap-4 space-y-4">
            {images.map((img, i) => (
              <motion.div key={img.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="break-inside-avoid cursor-pointer overflow-hidden rounded-xl" onClick={() => setSelected(i)}>
                <img src={img.url} alt={`Community moment ${i + 1}`} className="w-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
              </motion.div>
            ))}
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
