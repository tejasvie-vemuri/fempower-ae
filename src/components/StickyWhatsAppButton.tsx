import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "971547911282";
const WHATSAPP_TEXT = "Hello! I’d love to learn more about Fempower and how to join.";

const StickyWhatsAppButton = () => {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Fempower on WhatsApp"
      className="md:hidden fixed left-4 z-[55] inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 py-2 sm:py-3 font-body text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{
        backgroundColor: "#25D366",
        bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill="currentColor" />
      <span>Join WhatsApp</span>
    </a>
  );
};

export default StickyWhatsAppButton;
