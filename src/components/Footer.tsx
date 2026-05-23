import { Instagram } from "lucide-react";
import logo from "@/assets/fempower-logo.png";
import { CrescentStar, DuneWave } from "./GulfDecoratives";

const Footer = () => (
  <footer className="border-t border-border">
    <DuneWave className="-mt-[1px]" />
    <div className="py-12">
    <div className="container flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <img src={logo} alt="Fempower" className="h-8 w-auto" />
        <CrescentStar size={14} className="text-blush-dark" />
        <span className="text-xs text-muted-foreground font-body uppercase tracking-widest">Fempower · UAE</span>
      </div>

      <div className="flex items-center gap-5">
        <a href="https://www.instagram.com/fempower.ae?igsh=cDB1OXNxcmhxanY5&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Fempower on Instagram" className="text-muted-foreground hover:text-foreground transition-colors">
          <Instagram size={20} />
        </a>
        <a href="https://www.linkedin.com/company/fempowerae/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
        </a>
      </div>

      <p className="text-xs text-muted-foreground font-body">
        © {new Date().getFullYear()} Fempower. All rights reserved.
      </p>
    </div>
    </div>
  </footer>
);

export default Footer;
