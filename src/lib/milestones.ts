export interface MemberMilestone {
  id: string;
  user_id: string;
  category: "journey" | "career" | "life" | "contribution";
  milestone_key: string;
  custom_text: string | null;
  status: "pending" | "approved" | "rejected";
  circle_post_id: string | null;
  created_at: string;
}

export interface MemberSpotlight {
  id: string;
  user_id: string;
  story: string;
  active_from: string;
  active_until: string;
  created_at: string;
}

export const MILESTONE_CATEGORIES = {
  career: { label: "Career Win", emoji: "💼" },
  life: { label: "Life Milestone", emoji: "🌟" },
  journey: { label: "FemPower Journey", emoji: "🦋" },
  contribution: { label: "Community Contribution", emoji: "🤝" },
} as const;

export const MILESTONE_PRESETS: Record<string, { label: string; emoji: string; category: string }> = {
  // Career
  got_promoted: { label: "Got promoted", emoji: "🚀", category: "career" },
  switched_jobs: { label: "Switched jobs", emoji: "🔄", category: "career" },
  started_business: { label: "Started a business", emoji: "✨", category: "career" },
  landed_client: { label: "Landed first client", emoji: "🤝", category: "career" },
  got_raise: { label: "Got a raise", emoji: "💰", category: "career" },

  // Life
  moved_to_uae: { label: "Moved to the UAE", emoji: "🇦🇪", category: "life" },
  golden_visa: { label: "Got golden visa", emoji: "🏅", category: "life" },
  became_mum: { label: "Became a mum", emoji: "👶", category: "life" },
  completed_certification: { label: "Completed a certification", emoji: "📜", category: "life" },

  // Journey (auto-detected)
  joined_1m: { label: "1 month in FemPower", emoji: "🌱", category: "journey" },
  joined_3m: { label: "3 months in FemPower", emoji: "🌿", category: "journey" },
  joined_6m: { label: "6 months in FemPower", emoji: "🌳", category: "journey" },
  joined_1y: { label: "1 year in FemPower", emoji: "🎂", category: "journey" },
  first_event: { label: "Attended first event", emoji: "🎟️", category: "journey" },
  first_reflection: { label: "Shared first reflection", emoji: "💭", category: "journey" },
  first_course: { label: "Completed first course", emoji: "🎓", category: "journey" },
  wings_10: { label: "Completed 10 wings", emoji: "🦅", category: "journey" },

  // Contribution (auto-detected)
  first_meetup_hosted: { label: "Hosted first meetup", emoji: "🎤", category: "contribution" },
  reflections_10: { label: "Shared 10+ reflections", emoji: "📝", category: "contribution" },

  // Custom
  custom: { label: "Custom milestone", emoji: "⭐", category: "" },
};

export function getMilestoneDisplay(key: string, customText?: string | null) {
  const preset = MILESTONE_PRESETS[key];
  if (preset && key !== "custom") {
    return { emoji: preset.emoji, label: preset.label };
  }
  return { emoji: "⭐", label: customText || "A personal milestone" };
}
