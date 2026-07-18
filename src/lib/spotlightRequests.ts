export type SpotlightRequestStatus = "pending" | "submitted" | "published" | "declined";

export interface SpotlightRequest {
  id: string;
  user_id: string;
  requested_by: string;
  personal_note: string | null;
  status: SpotlightRequestStatus;
  headline: string | null;
  the_before: string | null;
  the_turning_point: string | null;
  the_now: string | null;
  advice: string | null;
  shoutout: string | null;
  photo_url: string | null;
  consent_social: boolean;
  submitted_at: string | null;
  published_at: string | null;
  spotlight_id: string | null;
  created_at: string;
  // LinkedIn-kit fields (added later; nullable on older rows)
  role_company?: string | null;
  identity_tag?: string | null;
  stopped_waiting_for?: string | null;
  pull_quote?: string | null;
  rally_line?: string | null;
  linkedin_consent?: boolean | null;
  linkedin_url?: string | null;
  linkedin_posted_at?: string | null;
  linkedin_caption?: string | null;
}

export interface StoryAnswers {
  headline: string;
  role_company: string;
  identity_tag: string;
  stopped_waiting_for: string;
  the_before: string;
  the_turning_point: string;
  the_now: string;
  advice: string;
  shoutout: string;
}

export const emptyStoryAnswers: StoryAnswers = {
  headline: "",
  role_company: "",
  identity_tag: "",
  stopped_waiting_for: "",
  the_before: "",
  the_turning_point: "",
  the_now: "",
  advice: "",
  shoutout: "",
};

export interface StoryQuestion {
  field: keyof StoryAnswers;
  label: string;
  prompt: string;
  placeholder: string;
  maxLength: number;
  required: boolean;
  multiline: boolean;
}

// The guided arc: before -> turning point -> now -> advice. This shape is what
// makes both the on-site card and the LinkedIn snippet write themselves.
export const STORY_QUESTIONS: StoryQuestion[] = [
  {
    field: "headline",
    label: "The headline",
    prompt: "If your story had one headline, what would it say?",
    placeholder: "e.g. From career break to running my own studio in 8 months",
    maxLength: 80,
    required: true,
    multiline: false,
  },
  {
    field: "the_before",
    label: "The before",
    prompt: "Before this chapter, what did things look like?",
    placeholder: "e.g. I'd just moved to Dubai and didn't know a single person in my industry...",
    maxLength: 240,
    required: true,
    multiline: true,
  },
  {
    field: "the_turning_point",
    label: "The turning point",
    prompt: "What was the moment, decision, or nudge that changed things?",
    placeholder: "e.g. A FemPower sister introduced me to a client at a meetup, and I just said yes...",
    maxLength: 280,
    required: true,
    multiline: true,
  },
  {
    field: "the_now",
    label: "Where you are now",
    prompt: "What's true today that wasn't before?",
    placeholder: "e.g. I now run a team of 3 and just signed my biggest client yet.",
    maxLength: 280,
    required: true,
    multiline: true,
  },
  {
    field: "advice",
    label: "Advice to the sisterhood",
    prompt: "If another FemPower sister stood where you stood, what would you tell her?",
    placeholder: "e.g. Say yes before you feel ready. The readiness comes after.",
    maxLength: 220,
    required: true,
    multiline: true,
  },
  {
    field: "shoutout",
    label: "A shoutout (optional)",
    prompt: "Anyone in FemPower who helped get you here?",
    placeholder: "e.g. Sana, for pushing me to put myself out there",
    maxLength: 160,
    required: false,
    multiline: false,
  },
];

export function composeStoryText(answers: StoryAnswers): string {
  return [answers.the_before, answers.the_turning_point, answers.the_now]
    .filter((part) => part.trim())
    .join("\n\n");
}

export function composeLinkedInSnippet(answers: StoryAnswers, memberName: string): string {
  const lines = [
    answers.headline,
    "",
    answers.the_turning_point,
    "",
    answers.advice,
    "",
    `— ${memberName}, FemPower AE member 🦋💛`,
    "",
    "#FemPowerAE #WomenInUAE #CommunityOverCompetition",
  ];
  return lines.join("\n");
}
