import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const WHATSAPP_NUMBER = "971547911282";
const WHATSAPP_TEXT = "Hello! I’d love to learn more about Fempower and how to join.";
const BASE_GAP_PX = 16; // 1rem gap above safe area
const COACH_GAP_PX = 12; // spacing between coach and WhatsApp button when stacked

const StickyWhatsAppButton = () => {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;
  const buttonRef = useRef<HTMLAnchorElement | null>(null);
  const [bottomOffset, setBottomOffset] = useState(BASE_GAP_PX);

  useEffect(() => {
    const recalc = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const btnRect = btn.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const anchors = document.querySelectorAll<HTMLElement>("[data-coach-anchor]");
      let maxOverlapTop = viewportH; // no overlap by default
      anchors.forEach((el) => {
        const r = el.getBoundingClientRect();
        // Check horizontal overlap
        const horizontallyOverlaps = r.right > btnRect.left && r.left < btnRect.right;
        if (!horizontallyOverlaps) return;
        // Track the highest (smallest top) overlapping element
        if (r.top < maxOverlapTop) maxOverlapTop = r.top;
      });
      if (maxOverlapTop >= viewportH) {
        setBottomOffset(BASE_GAP_PX);
      } else {
        // Position the button so its bottom sits COACH_GAP_PX above the coach's top edge
        const desired = viewportH - maxOverlapTop + COACH_GAP_PX;
        setBottomOffset(Math.max(BASE_GAP_PX, desired));
      }
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(document.body);
    document.querySelectorAll<HTMLElement>("[data-coach-anchor]").forEach((el) => ro.observe(el));

    const mo = new MutationObserver(() => {
      document
        .querySelectorAll<HTMLElement>("[data-coach-anchor]")
        .forEach((el) => ro.observe(el));
      recalc();
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });

    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, { passive: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc);
    };
  }, []);

  return (
    <a
      ref={buttonRef}
      href={href}
      target="_blank"
      rel="noreferrer"
      // Auto-capture (src/lib/analytics/autoCapture.ts) recognises wa.me links
      // and fires `whatsapp_cta_click`, which also persists to
      // engagement_events for the Northstar dashboard. `data-location` becomes
      // the `location` dimension on that event.
      data-location="sticky_mobile"
      aria-label="Chat with Fempower on WhatsApp"
      className="md:hidden fixed left-4 z-[55] inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2 sm:py-3 font-body text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{
        backgroundColor: "#25D366",
        bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="currentColor" />
      <span>Join WhatsApp</span>
    </a>
  );
};

export default StickyWhatsAppButton;
