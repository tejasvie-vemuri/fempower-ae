import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Footprints,
  Users,
  CalendarHeart,
  Heart,
  TrendingUp,
  Sparkles,
  Globe2,
} from "lucide-react";
import whatsappAsset from "@/assets/whatsapp-community-group.jpg.asset.json";
const whatsappImg = whatsappAsset.url;
import walkAsset from "@/assets/mentor-walks.jpg.asset.json";
const walkImg = walkAsset.url;
import coachingAsset from "@/assets/coaching-circle.jpg.asset.json";
const coachingImg = coachingAsset.url;
import eventAsset from "@/assets/event-presentation.jpg.asset.json";
const eventImg = eventAsset.url;
import { PalmDivider, SkylineSilhouette } from "./GulfDecoratives";
import { useSiteImages } from "@/hooks/useSiteImages";

const stats = [
  { icon: Globe2, value: "15+", label: "Nationalities" },
  { icon: Users, value: "300+", label: "Members" },
];

const pillars = [
  { icon: Heart, label: "Belonging", desc: "A safe space where you feel seen." },
  { icon: TrendingUp, label: "Growth", desc: "Practical tools to move forward." },
  { icon: Sparkles, label: "Confidence", desc: "The courage to show up fully." },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

const offerings = [
  {
    icon: MessageCircle,
    title: "WhatsApp Community",
    tag: "Daily",
    desc: "Daily prompts + unfiltered conversations on women at work in the UAE, book club, fitness challenges, and real-life wins.",
    image: whatsappImg,
    imageAlt: "A large group of Fempower women smiling together at a community gathering",
  },
  {
    icon: Footprints,
    title: "Mentor Walks",
    tag: "Quarterly · Limited Slots",
    desc: "We match you with mentors. Runs quarterly. 10 mentor–mentee pairs only per cohort.",
    image: walkImg,
    imageAlt: "Two Fempower members smiling together in front of the community memories wall",
  },
  {
    icon: Users,
    title: "Peer-to-Peer Coaching Circles",
    tag: "Ongoing",
    desc: "Group coaching conversations on leading with empathy, negotiation skills, personal brand, and your inner compass journey.",
    image: coachingImg,
    imageAlt: "A small group of Fempower women in close conversation during a peer coaching circle",
  },
  {
    icon: CalendarHeart,
    title: "Events Every 15 Days",
    tag: "Bi-monthly",
    desc: "Engaging meetups like Iftar nights, annual review sessions, Busy Girl Glam Ups, and more.",
    image: eventImg,
    imageAlt: "A Fempower facilitator presenting the Annual Planning 2026 session at a community event",
  },
];

const OfferingsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = offerings[activeIndex];
  const { data: team } = useSiteImages("team");

  return (
    <section id="offerings" className="relative overflow-hidden">
      {/* Story + Pillars + Stats */}
      <div className="py-7 md:py-10">
        <div className="container max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-3"
          >
            Our Story
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl font-semibold text-foreground"
          >
            Why Fempower
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground font-body leading-relaxed"
          >
            Fempower is a safe, energizing space for women in the UAE—newcomers, professionals, founders—who want community that&apos;s practical and deeply human.
          </motion.p>

          <PalmDivider className="mt-5 mb-5" />

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <motion.div
                key={p.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-blush-light flex items-center justify-center">
                  <p.icon size={24} className="text-blush-dark" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground">{p.label}</h3>
                <p className="text-sm text-muted-foreground font-body">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-center mt-10">
            <SkylineSilhouette className="text-foreground" />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md mx-auto">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-1.5 bg-card rounded-xl border border-border py-5 px-4 shadow-sm"
              >
                <s.icon size={20} className="text-blush-dark" />
                <p className="font-heading text-2xl md:text-3xl font-semibold text-foreground leading-none">{s.value}</p>
                <p className="text-xs font-body font-medium uppercase tracking-widest text-muted-foreground">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {team.length > 0 && (
            <div className="mt-16 max-w-5xl mx-auto">
              <h3 className="font-heading text-2xl md:text-3xl font-semibold text-foreground text-center mb-8">
                Meet the Team
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {team.map((m) => (
                  <div key={m.id} className="flex flex-col items-center text-center">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-muted mb-3">
                      <img src={m.url} alt={m.alt ?? m.title ?? ""} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    {m.title && <p className="font-heading text-base font-semibold text-foreground">{m.title}</p>}
                    {m.subtitle && <p className="text-xs font-body uppercase tracking-widest text-muted-foreground mt-1">{m.subtitle}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <PalmDivider className="mb-6" />

      {/* What We Do offerings */}
      <div className="py-7 md:py-10 bg-secondary">
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
                  alt={active.imageAlt}
                  loading="lazy"
                  decoding="async"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  width={1200}
                  height={1200}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 rounded-2xl shadow-lg object-cover object-[center_60%] xl:object-center w-full h-full"
                />
              </AnimatePresence>
              {/* Preload non-active images at low priority so transitions are instant */}
              <div className="hidden" aria-hidden="true">
                {offerings.map((o) =>
                  o.image === active.image ? null : (
                    <img key={o.image} src={o.image} alt="" loading="lazy" decoding="async" />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfferingsSection;
