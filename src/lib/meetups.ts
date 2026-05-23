export const EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
] as const;

export const MEETUP_REPORT_REASONS = [
  { value: "unsafe", label: "Unsafe or inappropriate" },
  { value: "spam", label: "Spam or self-promotion" },
  { value: "fake", label: "Doesn't seem real" },
  { value: "other", label: "Other" },
];

export type Meetup = {
  id: string;
  host_id: string;
  title: string;
  place: string;
  emirate: string | null;
  starts_at: string;
  capacity: number | null;
  note: string | null;
  host_visibility: "full" | "first_name";
  status: string;
  created_at: string;
};

export const hostDisplayName = (full: string | null | undefined, visibility: string) => {
  if (!full) return "A member";
  if (visibility === "first_name") return full.split(" ")[0];
  return full;
};

export const formatMeetupWhen = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isSameDay(d, today)) return `Today · ${time}`;
  if (isSameDay(d, tomorrow)) return `Tomorrow · ${time}`;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) + ` · ${time}`;
};
