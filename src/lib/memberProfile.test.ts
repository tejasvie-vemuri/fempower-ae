import { describe, expect, it } from "vitest";
import { memberProfileSchema, type MemberProfileInput } from "./memberProfile";

const validProfile: MemberProfileInput = {
  name: "Maya Hassan",
  role: "Founder",
  company: "Fempower",
  city: "Dubai",
  why_here: "To meet ambitious women in the UAE.",
  linkedin_url: "https://www.linkedin.com/in/maya-hassan",
  instagram_url: "https://www.instagram.com/maya.hassan",
  website_url: "",
  bio: "",
  photo_url: "",
  industry: "",
  expertise_tags: [],
  interests: [],
  looking_for: [],
};

const parseWith = (patch: Partial<MemberProfileInput>) =>
  memberProfileSchema.safeParse({ ...validProfile, ...patch });

describe("memberProfileSchema social URL validation", () => {
  it("accepts LinkedIn and Instagram profile links", () => {
    expect(parseWith({}).success).toBe(true);
    expect(parseWith({ linkedin_url: "https://linkedin.com/in/maya-hassan_22" }).success).toBe(true);
    expect(parseWith({ instagram_url: "https://instagram.com/maya.hassan_22" }).success).toBe(true);
  });

  it("rejects generic LinkedIn URLs that are not user profiles", () => {
    expect(parseWith({ linkedin_url: "https://linkedin.com" }).success).toBe(false);
    expect(parseWith({ linkedin_url: "https://www.linkedin.com/" }).success).toBe(false);
    expect(parseWith({ linkedin_url: "https://www.linkedin.com/company/fempower" }).success).toBe(false);
    expect(parseWith({ linkedin_url: "https://www.linkedin.com/in/" }).success).toBe(false);
  });

  it("rejects generic or non-profile Instagram URLs", () => {
    expect(parseWith({ instagram_url: "https://instagram.com" }).success).toBe(false);
    expect(parseWith({ instagram_url: "https://www.instagram.com/" }).success).toBe(false);
    expect(parseWith({ instagram_url: "https://www.instagram.com/p/ABC123" }).success).toBe(false);
    expect(parseWith({ instagram_url: "https://www.instagram.com/explore" }).success).toBe(false);
  });

  it("allows Instagram to be omitted", () => {
    expect(parseWith({ instagram_url: "" }).success).toBe(true);
  });
});
