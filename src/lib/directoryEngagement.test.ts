import { describe, it, expect } from "vitest";
import { badgesFor, matchScore, suggestMembers, isNewMember, profileCompleteness } from "./directoryEngagement";

const base = { user_id: "x", city: null, industry: null, looking_for: [], interests: [], expertise_tags: [] };

describe("directory engagement rules", () => {
  it("roundtable regular needs 3 attended events", () => {
    expect(badgesFor({ looking_for: [] }, { events_attended: 2, spotlighted: false, founding: false })).not.toContain("regular");
    expect(badgesFor({ looking_for: [] }, { events_attended: 3, spotlighted: false, founding: false })).toContain("regular");
  });
  it("mentor badge comes from being open to mentoring", () => {
    expect(badgesFor({ looking_for: ["Mentoring"] }, null)).toEqual(["mentor"]);
  });
  it("matches a mentor with someone wanting to be mentored", () => {
    const r = matchScore({ ...base, user_id: "a", looking_for: ["Being mentored"] }, { ...base, user_id: "b", looking_for: ["Mentoring"] });
    expect(r.score).toBe(3);
  });
  it("never suggests yourself and skips zero-score members", () => {
    const me = { ...base, user_id: "me", city: "Dubai" };
    const out = suggestMembers(me, [me, { ...base, user_id: "b", city: "Dubai" }, { ...base, user_id: "c", city: "Abu Dhabi" }]);
    expect(out.map((r) => r.member.user_id)).toEqual(["b"]);
  });
  it("new this week means approved within 7 days", () => {
    const now = new Date("2026-10-28T12:00:00Z");
    expect(isNewMember("2026-10-22T12:00:00Z", now)).toBe(true);
    expect(isNewMember("2026-10-20T12:00:00Z", now)).toBe(false);
  });
  it("empty profile is 0%", () => {
    expect(profileCompleteness({})).toBe(0);
  });
});
