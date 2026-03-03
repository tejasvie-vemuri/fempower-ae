import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { CalendarHeart, MapPin, Clock } from "lucide-react";

// Placeholder events — will be replaced with real data from an Excel upload
const placeholderEvents = [
  {
    date: new Date(2026, 2, 7),
    title: "Networking Walk – Dubai Marina",
    time: "7:00 AM",
    location: "Dubai Marina Walk",
  },
  {
    date: new Date(2026, 2, 15),
    title: "Busy Girl Glam Up",
    time: "5:00 PM",
    location: "Downtown Dubai",
  },
  {
    date: new Date(2026, 2, 22),
    title: "Coaching Circle: Personal Brand",
    time: "6:30 PM",
    location: "Business Bay, Dubai",
  },
  {
    date: new Date(2026, 3, 5),
    title: "Mentor Walks Cohort Launch",
    time: "8:00 AM",
    location: "Al Qudra Lakes",
  },
  {
    date: new Date(2026, 3, 18),
    title: "Book Club Meetup",
    time: "4:00 PM",
    location: "Abu Dhabi Corniche",
  },
];

const EventsCalendarSection = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const eventDates = placeholderEvents.map((e) => e.date);

  const eventsForDate = selectedDate
    ? placeholderEvents.filter(
        (e) =>
          e.date.getFullYear() === selectedDate.getFullYear() &&
          e.date.getMonth() === selectedDate.getMonth() &&
          e.date.getDate() === selectedDate.getDate()
      )
    : [];

  return (
    <section id="events-calendar" className="py-24 md:py-32 bg-secondary">
      <div className="container max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-3xl md:text-4xl font-semibold text-foreground text-center"
        >
          Upcoming Events
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-4 text-center text-muted-foreground font-body"
        >
          Tap a highlighted date to see what's coming up.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 grid md:grid-cols-2 gap-10 items-start"
        >
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{ event: eventDates }}
              modifiersClassNames={{
                event: "bg-accent text-accent-foreground font-bold rounded-full",
              }}
              className="rounded-xl border border-border bg-card shadow-sm p-4"
            />
          </div>

          {/* Event list */}
          <div className="space-y-4 min-h-[280px]">
            {selectedDate && eventsForDate.length > 0 ? (
              eventsForDate.map((event, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blush-light flex items-center justify-center flex-shrink-0">
                      <CalendarHeart size={20} className="text-blush-dark" />
                    </div>
                    <div>
                      <h4 className="font-heading text-base font-semibold text-foreground">
                        {event.title}
                      </h4>
                      <div className="mt-1.5 flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
                          <Clock size={14} /> {event.time}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-body">
                          <MapPin size={14} /> {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : selectedDate ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <p className="text-muted-foreground font-body text-sm">
                  No events on this date. Try selecting a highlighted date!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-body font-medium mb-4">
                  All upcoming events:
                </p>
                {placeholderEvents.map((event, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedDate(event.date)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blush-light flex items-center justify-center flex-shrink-0">
                        <CalendarHeart size={16} className="text-blush-dark" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-body text-sm font-semibold text-foreground truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-muted-foreground font-body">
                          {event.date.toLocaleDateString("en-AE", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          · {event.time} · {event.location}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default EventsCalendarSection;
