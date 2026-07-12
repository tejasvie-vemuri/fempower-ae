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
      className="md:hidden fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 font-body text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] max-w-[45vw]"
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle size={18} fill="currentColor" />
      <span className="truncate">Join WhatsApp</span>
    </a>
  );
};

export default StickyWhatsAppButton;
