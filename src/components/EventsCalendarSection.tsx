import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import eventBanner1 from "@/assets/event-banner-1.jpg";
import eventBanner2 from "@/assets/event-banner-2.jpg";
import eventBanner3 from "@/assets/event-banner-3.jpg";

const upcomingEvents = [
  {
    banner: eventBanner1,
    type: "In-Person",
    location: "Dubai Marina, UAE",
    date: "Sat, Mar 7, 2026",
    title: "Fempower @ Networking Walk",
    rsvpLink: "#join",
  },
  {
    banner: eventBanner2,
    type: "In-Person",
    location: "Business Bay, Dubai",
    date: "Sun, Mar 22, 2026",
    title: "Fempower @ Coaching Circle",
    rsvpLink: "#join",
  },
  {
    banner: eventBanner3,
    type: "In-Person",
    location: "Abu Dhabi Corniche",
    date: "Sat, Apr 5, 2026",
    title: "Fempower @ Book Club",
    rsvpLink: "#join",
  },
];

const EventsCalendarSection = () => (
  <section id="events-calendar" className="py-24 md:py-32">
    <div className="container">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-body font-medium uppercase tracking-widest-xl text-blush-dark mb-4"
          >
            Event Calendar
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-3xl md:text-4xl font-semibold text-foreground"
          >
            Upcoming Events
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-muted-foreground font-body max-w-lg"
          >
            Here are a few of our upcoming in-person events across the UAE.
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Button
            variant="outline"
            className="font-body uppercase tracking-widest text-xs border-foreground text-foreground hover:bg-foreground hover:text-primary-foreground transition-colors h-11 px-6"
            asChild
          >
            <a href="#join">
              View Full Calendar <ArrowRight size={14} className="ml-2" />
            </a>
          </Button>
        </motion.div>
      </div>

      {/* Event cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {upcomingEvents.map((event, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group"
          >
            {/* Banner image */}
            <div className="overflow-hidden rounded-xl aspect-[4/3]">
              <img
                src={event.banner}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>

            {/* Event details */}
            <div className="mt-5">
              {/* Type + Location */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-block text-xs font-body font-semibold uppercase tracking-widest border border-foreground text-foreground px-3 py-1">
                  {event.type}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground font-body">
                  <MapPin size={13} /> {event.location}
                </span>
              </div>

              {/* Date */}
              <p className="mt-3 text-sm text-blush-dark font-body font-medium">
                {event.date}
              </p>

              {/* Title */}
              <h3 className="mt-1 font-heading text-lg font-semibold text-foreground leading-snug">
                {event.title}
              </h3>

              {/* RSVP */}
              <a
                href={event.rsvpLink}
                className="mt-3 inline-block text-xs font-body font-semibold uppercase tracking-widest text-foreground border-b border-foreground pb-0.5 hover:text-blush-dark hover:border-blush-dark transition-colors"
              >
                RSVP Here
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default EventsCalendarSection;
