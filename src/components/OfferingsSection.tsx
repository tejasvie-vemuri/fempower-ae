import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Footprints, Users, CalendarHeart } from "lucide-react";
import whatsappAsset from "@/assets/community-networking.jpg.asset.json";
const whatsappImg = whatsappAsset.url;
import walkImg from "@/assets/mentor-walk-women.jpg";
import coachingImg from "@/assets/community-coaching.jpg";
import eventImg from "@/assets/community-event.jpg";
import { PalmDivider } from "./GulfDecoratives";

const offerings = [
  {
    icon: MessageCircle,
    title: "WhatsApp Community",
    tag: "Daily",
    desc: "Daily prompts + unfiltered conversations on women at work in the UAE, book club, fitness challenges, and real-life wins.",
    image: whatsappImg,
  },
  {
    icon: Footprints,
    title: "Mentor Walks",
    tag: "Quarterly · Limited Slots",
    desc: "We match you with mentors. Runs quarterly. 10 mentor–mentee pairs only per cohort.",
    image: walkImg,
  },
  {
    icon: Users,
    title: "Peer-to-Peer Coaching Circles",
    tag: "Ongoing",
    desc: "Group coaching conversations on leading with empathy, negotiation skills, personal brand, and your inner compass journey.",
    image: coachingImg,
  },
  {
    icon: CalendarHeart,
    title: "Events Every 15 Days",
    tag: "Bi-monthly",
    desc: "Engaging meetups like Iftar nights, annual review sessions, Busy Girl Glam Ups, and more.",
    image: eventImg,
  },
];

const OfferingsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = offerings[activeIndex];

  return (
    <section id="offerings" className="py-7 md:py-10 bg-secondary">
      <PalmDivider className="mb-6" />
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-3"
            >
              How We Show Up
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-heading text-3xl md:text-4xl font-semibold text-foreground"
            >
              What We Do
            </motion.h2>

            <div className="mt-8 grid gap-5">
              {offerings.map((o, i) => (
                <motion.button
                  type="button"
                  key={o.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onMouseEnter={() => setActiveIndex(i)}
                  onFocus={() => setActiveIndex(i)}
                  onClick={() => setActiveIndex(i)}
                  aria-pressed={activeIndex === i}
                  className={`text-left bg-card rounded-xl p-4 sm:p-5 shadow-sm border transition-all ${
                    activeIndex === i
                      ? "border-blush-dark/60 shadow-md ring-1 ring-blush-dark/20"
                      : "border-border hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blush-light flex items-center justify-center flex-shrink-0 mt-0.5">
                      <o.icon size={20} className="text-blush-dark" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">{o.title}</h3>
                        <span className="text-[10px] sm:text-xs font-body font-medium text-blush-dark bg-blush-light px-2 py-0.5 rounded-full whitespace-nowrap">{o.tag}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground font-body leading-relaxed">{o.desc}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative aspect-[4/5] xl:aspect-square w-full">
            <AnimatePresence mode="wait">
              <motion.img
                key={active.image}
                src={active.image}
                alt={active.title}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0 rounded-2xl shadow-lg object-cover object-[center_60%] xl:object-center w-full h-full"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferingsSection;
