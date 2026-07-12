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
      className="md:hidden fixed bottom-4 left-4 right-4 z-50 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 font-body text-sm font-semibold uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle size={20} fill="currentColor" />
      <span>Join us on WhatsApp</span>
    </a>
  );
};

export default StickyWhatsAppButton;
