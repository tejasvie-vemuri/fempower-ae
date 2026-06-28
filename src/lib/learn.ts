export interface LearnCourse {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  display_order: number;
  status: "draft" | "published" | "scheduled";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearnModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearnWing {
  id: string;
  module_id: string;
  title: string;
  context_content: string;
  reflection_prompt: string;
  extension_content: string;
  display_order: number;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface LearnResource {
  id: string;
  course_id: string;
  title: string;
  url: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface LearnProgress {
  id: string;
  user_id: string;
  wing_id: string;
  completed_at: string;
}

export interface LearnReflection {
  id: string;
  user_id: string;
  wing_id: string;
  content: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseWithProgress extends LearnCourse {
  totalWings: number;
  completedWings: number;
}
