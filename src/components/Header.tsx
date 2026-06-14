import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Instagram, User, LogOut, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import HashLink from "@/components/HashLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import logo from "@/assets/fempower-logo.png";

const navLinks = [
  { label: "About", to: "/#about", showFrom: "md" as const },
  { label: "What We Do", to: "/#offerings", showFrom: "lg" as const },
  { label: "Programs", to: "/#programs", showFrom: "xl" as const },
  { label: "Events", to: "/#events-calendar", showFrom: "md" as const },
  { label: "Directory", to: "/directory", showFrom: "md" as const },
  { label: "Gallery", to: "/#gallery", showFrom: "lg" as const },
  { label: "Join", to: "/join", showFrom: "md" as const },
  { label: "Circle", to: "/circle", showFrom: "lg" as const },
  { label: "FAQs", to: "/#faqs", showFrom: "xl" as const, requiresAuth: true },
];

const showFromClass: Record<"md" | "lg" | "xl", string> = {
  md: "hidden md:inline-flex",
  lg: "hidden lg:inline-flex",
  xl: "hidden xl:inline-flex",
};

const Header = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const displayName =
    (user?.user_metadata?.name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "Account";
  const initial = displayName.charAt(0).toUpperCase();
  const visibleNavLinks = navLinks.filter((link) => !link.requiresAuth || user);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex-shrink-0 flex items-center">
          <img src={logo} alt="Fempower" className="h-10 md:h-12 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8 xl:gap-10">
          {visibleNavLinks.map((link) => (
            <HashLink
              key={link.to}
              to={link.to}
              className={`${showFromClass[link.showFrom]} text-xs font-body font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors`}
            >
              {link.label}
            </HashLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <a href="https://www.instagram.com/fempower.ae?igsh=cDB1OXNxcmhxanY5&utm_source=qr" target="_blank" rel="noreferrer" aria-label="Fempower on Instagram" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground transition-colors">
            <Instagram size={18} />
          </a>
          <a href="https://www.linkedin.com/company/fempowerae/" target="_blank" rel="noopener noreferrer" aria-label="Fempower on LinkedIn" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-full bg-foreground text-primary-foreground text-sm font-body font-medium hover:bg-foreground/90"
                >
                  {initial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-body">
                  <div className="text-sm font-medium truncate">{displayName}</div>
                  {user.email && displayName !== user.email && (
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/join">Membership status</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/profile">My profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/tickets">My tickets</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/saved" className="inline-flex items-center gap-2">
                    <Bookmark size={13} /> Saved
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/members">Admin · Members</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/events">Admin · Events</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/circle">Admin · Circle</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut size={14} className="mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="hidden sm:inline-flex font-body uppercase tracking-widest text-xs"
              asChild
            >
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          <Button size="sm" className="hidden sm:inline-flex bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs px-5" asChild>
            <Link to="/join">Join Us</Link>
          </Button>

          <button className="md:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background border-t border-border pb-6">
          <nav className="container flex flex-col gap-4 pt-4">
            {visibleNavLinks.map((link) => (
              <HashLink
                key={link.to}
                to={link.to}
                className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </HashLink>
            ))}
            {user ? (
              <>
                <Link
                  to="/account/profile"
                  onClick={() => setOpen(false)}
                  className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  My profile
                </Link>
                <Link
                  to="/account/saved"
                  onClick={() => setOpen(false)}
                  className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                >
                  <Bookmark size={13} /> Saved
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/members"
                    onClick={() => setOpen(false)}
                    className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="text-left text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                <User size={14} className="inline mr-2" /> Sign in
              </Link>
            )}
            <Button className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs w-full" asChild>
              <Link to="/join" onClick={() => setOpen(false)}>Join Us</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
