import { describe, expect, it } from "vitest";
import { readCampaignParams, redactPath, sanitizeProps, scrubText } from "./config";
import { sectionForPath } from "./events";

describe("sanitizeProps", () => {
  it("keeps flat primitives and rounds numbers", () => {
    expect(sanitizeProps({ location: "sticky_mobile", seats: 3, is_free: true })).toEqual({
      location: "sticky_mobile",
      seats: 3,
      is_free: true,
    });
    expect(sanitizeProps({ ratio: 1.23456 })).toEqual({ ratio: 1.23 });
  });

  it("drops keys that name personal data", () => {
    const clean = sanitizeProps({
      email: "maya@example.com",
      phone: "+971 50 123 4567",
      password: "hunter2",
      full_name: "Maya Hassan",
      access_token: "abc",
      slug: "mentor-walk-jbr",
    });
    expect(clean).toEqual({ slug: "mentor-walk-jbr" });
  });

  it("scrubs personal data that hides inside an allowed value", () => {
    expect(
      sanitizeProps({ reason: "User maya@example.com already registered" }).reason,
    ).toBe("User [email] already registered");
  });

  it("drops nested objects and arrays rather than serialising them", () => {
    expect(sanitizeProps({ profile: { name: "Maya" }, tags: ["a"], cb: () => {} })).toEqual({});
  });

  it("ignores null and undefined", () => {
    expect(sanitizeProps({ city: null, industry: undefined, ok: "yes" })).toEqual({ ok: "yes" });
  });
});

describe("scrubText", () => {
  it("replaces emails and phone numbers", () => {
    expect(scrubText("call +971501234567 or mail a.b@c.co")).toBe("call [phone] or mail [email]");
  });
});

describe("redactPath", () => {
  it("keeps campaign parameters verbatim", () => {
    expect(redactPath("/join", "?utm_source=instagram&utm_medium=bio")).toBe(
      "/join?utm_source=instagram&utm_medium=bio",
    );
  });

  it("redacts the value of anything it does not recognise", () => {
    // /reset-password carries a recovery token in the query string.
    expect(redactPath("/reset-password", "?token=super-secret")).toBe(
      "/reset-password?token=[redacted]",
    );
  });

  it("returns a bare path when there is no query string", () => {
    expect(redactPath("/events/mentor-walk")).toBe("/events/mentor-walk");
  });
});

describe("readCampaignParams", () => {
  it("extracts only the attribution keys", () => {
    expect(readCampaignParams("?utm_source=ig&slot=hero&ref=digest")).toEqual({
      utm_source: "ig",
      ref: "digest",
    });
  });
});

describe("sectionForPath", () => {
  it("buckets routes into product areas", () => {
    expect(sectionForPath("/")).toBe("public");
    expect(sectionForPath("/lonely-in-dubai")).toBe("public");
    expect(sectionForPath("/auth")).toBe("auth");
    expect(sectionForPath("/pending-approval")).toBe("auth");
    expect(sectionForPath("/events/mentor-walk")).toBe("events");
    expect(sectionForPath("/learn/foundations/module-1")).toBe("learn");
    expect(sectionForPath("/admin/events")).toBe("admin");
    expect(sectionForPath("/privacy")).toBe("legal");
    expect(sectionForPath("/the-pause")).toBe("other");
  });
});
