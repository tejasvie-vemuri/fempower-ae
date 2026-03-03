import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import heroImg from "@/assets/hero-community.jpg";
import coachingImg from "@/assets/community-coaching.jpg";
import eventImg from "@/assets/community-event.jpg";
import networkingImg from "@/assets/community-networking.jpg";
import walkImg from "@/assets/community-walk.jpg";

const images = [
  { src: heroImg, alt: "Fempower networking event" },
  { src: coachingImg, alt: "Coaching circle session" },
  { src: eventImg, alt: "Community dinner event" },
  { src: networkingImg, alt: "Networking evening" },
  { src: walkImg, alt: "Mentor walk along the waterfront" },
];

const GallerySection = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <section id="gallery" className="py-24 md:py-32 bg-secondary">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center"
        >
          Community Moments
        </motion.h2>
        <p className="mt-4 text-center text-muted-foreground font-body">
          A few moments from Fempower—connection in motion.
        </p>

        <div className="mt-12 columns-2 md:columns-3 gap-4 space-y-4">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="break-inside-avoid cursor-pointer overflow-hidden rounded-xl"
              onClick={() => setSelected(i)}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full object-cover hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <button className="absolute top-6 right-6 text-primary-foreground" onClick={() => setSelected(null)}>
              <X size={28} />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={images[selected].src}
              alt={images[selected].alt}
              className="max-w-full max-h-[85vh] rounded-lg object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GallerySection;
