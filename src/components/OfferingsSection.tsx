import { motion } from "framer-motion";
import { MessageCircle, Footprints, Users, CalendarHeart } from "lucide-react";
import coachingImg from "@/assets/community-coaching.jpg";
import { PalmDivider } from "./GulfDecoratives";

const offerings = [
  {
    icon: MessageCircle,
    title: "WhatsApp Community",
    tag: "Daily",
    desc: "Daily prompts + unfiltered conversations on women at work in the UAE, book club, fitness challenges, and real-life wins.",
  },
  {
    icon: Footprints,
    title: "Mentor Walks",
    tag: "Quarterly · Limited Slots",
    desc: "We match you with mentors. Runs quarterly. 10 mentor–mentee pairs only per cohort.",
  },
  {
    icon: Users,
    title: "Peer-to-Peer Coaching Circles",
    tag: "Ongoing",
    desc: "Group coaching conversations on leading with empathy, negotiation skills, personal brand, and your inner compass journey.",
  },
  {
    icon: CalendarHeart,
    title: "Events Every 15 Days",
    tag: "Bi-monthly",
    desc: "Engaging meetups like Iftar nights, annual review sessions, Busy Girl Glam Ups, and more.",
  },
];

const OfferingsSection = () => (
  <section id="offerings" className="py-16 md:py-20 bg-secondary">
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
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blush-light flex items-center justify-center flex-shrink-0 mt-0.5">
                    <o.icon size={20} className="text-blush-dark" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-heading text-lg font-semibold text-foreground">{o.title}</h3>
                      <span className="text-xs font-body font-medium text-blush-dark bg-blush-light px-2 py-0.5 rounded-full">{o.tag}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground font-body leading-relaxed">{o.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="hidden lg:block"
        >
          <img
            src={coachingImg}
            alt="Fempower coaching circle"
            className="rounded-2xl shadow-lg object-cover w-full aspect-square"
          />
        </motion.div>
      </div>
    </div>
  </section>
);

export default OfferingsSection;
