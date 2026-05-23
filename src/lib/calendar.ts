// Calendar helpers: build .ics file + Google Calendar URL for an event.

export interface CalendarEvent {
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string | Date;
  endsAt?: string | Date | null;
  url?: string;
  uid?: string;
}

const toUtcStamp = (d: Date) =>
  d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const escapeIcs = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const resolveEnd = (start: Date, end?: Date | null) =>
  end ?? new Date(start.getTime() + 60 * 60 * 1000); // default 1h

export function buildIcs(ev: CalendarEvent): string {
  const start = new Date(ev.startsAt);
  const end = resolveEnd(start, ev.endsAt ? new Date(ev.endsAt) : null);
  const uid = ev.uid ?? `${start.getTime()}-${Math.random().toString(36).slice(2)}@fempowerae.com`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Fempower UAE//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcs(ev.title)}`,
    ev.description ? `DESCRIPTION:${escapeIcs(ev.description)}` : "",
    ev.location ? `LOCATION:${escapeIcs(ev.location)}` : "",
    ev.url ? `URL:${ev.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function downloadIcs(ev: CalendarEvent, filename = "event.ics") {
  const blob = new Blob([buildIcs(ev)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function googleCalendarUrl(ev: CalendarEvent): string {
  const start = new Date(ev.startsAt);
  const end = resolveEnd(start, ev.endsAt ? new Date(ev.endsAt) : null);
  const fmt = (d: Date) => toUtcStamp(d);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  if (ev.description) params.set("details", ev.description);
  if (ev.location) params.set("location", ev.location);
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(ev: CalendarEvent): string {
  const start = new Date(ev.startsAt);
  const end = resolveEnd(start, ev.endsAt ? new Date(ev.endsAt) : null);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: ev.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });
  if (ev.description) params.set("body", ev.description);
  if (ev.location) params.set("location", ev.location);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function slugifyFilename(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event";
}
