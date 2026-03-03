import { Instagram } from "lucide-react";
import logo from "@/assets/fempower-logo.jpg";

const Footer = () => (
  <footer className="py-12 border-t border-border">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <img src={logo} alt="FEmpower" className="h-8 w-auto" />
        <span className="text-sm text-muted-foreground font-body">FEmpower · UAE</span>
      </div>

      <div className="flex items-center gap-5">
        <a href="https://www.instagram.com/fempower.ae" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          <Instagram size={20} />
        </a>
        <a href="https://www.linkedin.com/company/fempowerae/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
        </a>
        <a href="mailto:hello@fempower.ae" className="text-sm text-muted-foreground hover:text-foreground font-body transition-colors">
          hello@fempower.ae
        </a>
      </div>

      <p className="text-xs text-muted-foreground font-body">
        © {new Date().getFullYear()} FEmpower. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
