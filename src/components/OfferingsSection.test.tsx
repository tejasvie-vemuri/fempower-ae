import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import OfferingsSection from "./OfferingsSection";

// Asset pointers used by OfferingsSection
import whatsappAsset from "@/assets/whatsapp-community-group.jpg.asset.json";
import walkAsset from "@/assets/mentor-walks.jpg.asset.json";
import coachingAsset from "@/assets/coaching-circle.jpg.asset.json";
import eventAsset from "@/assets/event-presentation.jpg.asset.json";

describe("OfferingsSection", () => {
  it("renders the four community pillar buttons in order", () => {
    render(<OfferingsSection />);
    const titles = [
      "WhatsApp Community",
      "Mentor Walks",
      "Peer-to-Peer Coaching Circles",
      "Events Every 15 Days",
    ];
    titles.forEach((t) => {
      expect(screen.getByRole("heading", { name: t })).toBeInTheDocument();
    });
  });

  it("renders the section heading and eyebrow", () => {
    render(<OfferingsSection />);
    expect(
      screen.getByRole("heading", { level: 2, name: /what we do/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/how we show up/i)).toBeInTheDocument();
  });

  it("uses the latest CDN asset URLs for each pillar image", () => {
    render(<OfferingsSection />);
    // Initial active offering is WhatsApp Community.
    const initial = screen.getByRole("img");
    expect(initial.getAttribute("src")).toBe(whatsappAsset.url);

    // The hidden prefetch container should reference the other three.
    const allImgs = document.querySelectorAll("img");
    const srcs = Array.from(allImgs).map((i) => i.getAttribute("src"));
    expect(srcs).toContain(walkAsset.url);
    expect(srcs).toContain(coachingAsset.url);
    expect(srcs).toContain(eventAsset.url);
  });

  it("applies lazy-loading and async decoding to the showcase image", () => {
    render(<OfferingsSection />);
    const img = screen.getAllByRole("img")[0];
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute("sizes");
  });

  it("provides descriptive alt text for the active showcase image", () => {
    render(<OfferingsSection />);
    const img = screen.getByAltText(
      /large group of fempower women smiling together/i
    );
    expect(img).toBeInTheDocument();
  });

  it("marks each pillar button as a togglable pressed control", () => {
    render(<OfferingsSection />);
    const whatsappBtn = screen
      .getByRole("heading", { name: "WhatsApp Community" })
      .closest("button");
    expect(whatsappBtn).not.toBeNull();
    expect(whatsappBtn).toHaveAttribute("aria-pressed", "true");

    const walkBtn = screen
      .getByRole("heading", { name: "Mentor Walks" })
      .closest("button");
    expect(walkBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("renders the tag chip for each pillar", () => {
    render(<OfferingsSection />);
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText(/quarterly/i)).toBeInTheDocument();
    expect(screen.getByText("Ongoing")).toBeInTheDocument();
    expect(screen.getByText(/bi-monthly/i)).toBeInTheDocument();
  });
});
