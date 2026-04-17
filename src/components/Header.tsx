import { useState } from "react";
import { Menu, X, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactFormDialog from "@/components/ContactFormDialog";
import logo from "@/assets/fempower-logo.jpg";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "What We Do", href: "#offerings" },
  { label: "Programs", href: "#programs" },
  { label: "Events", href: "#events-calendar" },
  { label: "Gallery", href: "#gallery" },
  { label: "Newsletter", href: "#newsletter" },
  { label: "Join", href: "#join" },
  { label: "FAQs", href: "#faqs" },
];

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <a href="#" className="flex-shrink-0">
          <img src={logo} alt="Fempower" className="h-10 md:h-12 w-auto" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-body font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <ContactFormDialog />
          <a href="https://www.instagram.com/fempower.ae?igsh=cDB1OXNxcmhxanY5&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Fempower on Instagram" className="text-muted-foreground hover:text-foreground transition-colors">
            <Instagram size={18} />
          </a>
          <a href="https://www.linkedin.com/company/fempowerae/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
          <Button size="sm" className="ml-2 bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs px-5" asChild>
            <a href="#join">Join Us</a>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button className="lg:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="lg:hidden bg-background border-t border-border pb-6">
          <nav className="container flex flex-col gap-4 pt-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <ContactFormDialog
              trigger={
                <Button variant="outline" className="font-body uppercase tracking-widest text-xs w-full">
                  Contact Us
                </Button>
              }
            />
            <Button className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs w-full" asChild>
              <a href="#join" onClick={() => setOpen(false)}>Join Us</a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
