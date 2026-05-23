export const CIRCLE_TOPICS = [
  { value: "career", label: "Career" },
  { value: "relationships", label: "Relationships" },
  { value: "motherhood", label: "Motherhood" },
  { value: "mental-health", label: "Mental Health" },
  { value: "money", label: "Money" },
  { value: "faith", label: "Faith" },
  { value: "visa-legal", label: "Visa & Legal" },
  { value: "body-health", label: "Body & Health" },
  { value: "other", label: "Other" },
] as const;

export type CircleTopic = (typeof CIRCLE_TOPICS)[number]["value"];

// Topics that should display the crisis-resources banner
export const CRISIS_TOPICS: CircleTopic[] = ["mental-health", "relationships", "body-health"];

export const CIRCLE_REACTIONS = [
  { emoji: "🤍", label: "You're not alone" },
  { emoji: "🌷", label: "Sending love" },
  { emoji: "💪", label: "Been there" },
  { emoji: "✨", label: "Thank you for sharing" },
] as const;

export const UAE_HELPLINES = [
  { name: "DHA Mental Health Hotline", value: "800-HOPE (4673)", href: "tel:8004673" },
  { name: "Aman Service (Abu Dhabi Police)", value: "116111", href: "tel:116111" },
  { name: "Dubai Foundation for Women & Children", value: "800-111", href: "tel:800111" },
  { name: "UAE Ministry of Interior – Child & Women Protection", value: "116111", href: "tel:116111" },
];

export const REPORT_REASONS = [
  { value: "harmful", label: "Harmful or unsafe" },
  { value: "spam", label: "Spam or self-promotion" },
  { value: "identifying", label: "Reveals someone's identity" },
  { value: "other", label: "Other" },
];

export const topicLabel = (value: string) =>
  CIRCLE_TOPICS.find((t) => t.value === value)?.label ?? value;

// WhatsApp deep link for notifying a moderator. Replace if you have a dedicated number.
export const wa = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;
