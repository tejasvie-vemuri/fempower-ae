import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Instagram, User, LogOut, Bookmark, Heart, ChevronDown } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import InviteSisterDialog from "@/components/InviteSisterDialog";
import logo from "@/assets/fempower-logo.png";

// Primary nav — kept intentionally short (3 items) for a premium, editorial feel.
const navLinks = [
  { label: "What We Do", to: "/#offerings" },
  { label: "Events", to: "/#events-calendar" },
  { label: "Directory", to: "/directory" },
];

// Grouped under the "Members" dropdown. Learn is public; the rest are member-only.
const membersMenu = [
  { label: "Learn", to: "/learn", memberOnly: false },
  { label: "Lifestyle Manager", to: "/lifestyle-manager", memberOnly: true },
  { label: "The Pause", to: "/the-pause", memberOnly: true },
  { label: "AI Edge", to: "/ai-edge", memberOnly: true },
  { label: "Starter Kit", to: "/starter-kit", memberOnly: true },
];


const Header = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { profile } = useMemberProfile();
  const isApprovedMember = profile?.status === "approved" || profile?.status === "hidden";
  const displayName =
    (user?.user_metadata?.name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "Account";
  const initial = displayName.charAt(0).toUpperCase();
  const visibleNavLinks = navLinks;
  const visibleMembersMenu = membersMenu.filter((m) => !m.memberOnly || !!user);

  const linkClass =
    "text-[11px] font-body font-medium uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex-shrink-0 flex items-center">
          <img src={logo} alt="Fempower" className="h-10 md:h-12 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-7 lg:gap-9 xl:gap-11">
          {visibleNavLinks.map((link) => (
            <HashLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </HashLink>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`${linkClass} inline-flex items-center gap-1 outline-none focus-visible:text-foreground`}
              aria-label="Members menu"
            >
              Members <ChevronDown size={12} aria-hidden="true" className="opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 mt-2">
              {visibleMembersMenu.map((m) => (
                <DropdownMenuItem key={m.to} asChild>
                  <Link
                    to={m.to}
                    className="font-body text-sm tracking-wide"
                  >
                    {m.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              {!user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/join" className="font-body text-sm tracking-wide text-foreground">
                      Unlock member tools →
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>


        <div className="flex items-center gap-3 md:gap-4">
          <a href="https://www.instagram.com/fempower.ae" target="_blank" rel="noreferrer" aria-label="Fempower on Instagram" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground transition-colors">
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
                      <Link to="/admin/northstar">Admin · Northstar</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/members">Admin · Members</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/events">Admin · Events</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/circle">Admin · Circle</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/learn">Admin · Learn</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/milestones">Admin · Milestones</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/lifestyle-manager">Admin · Lifestyle Manager</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/ai-edge">Admin · AI Edge</Link>
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

          {isApprovedMember ? (
            <InviteSisterDialog>
              <Button
                size="sm"
                data-analytics-event="invite_sister_opened"
                data-analytics-location="header"
                className="hidden sm:inline-flex bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs px-5"
              >
                <Heart size={13} className="mr-2" /> Invite a sister
              </Button>
            </InviteSisterDialog>
          ) : (
            <Button size="sm" className="hidden sm:inline-flex bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs px-5" asChild>
              {/* Internal links aren't auto-captured (page_view covers them) —
                  CTAs opt in explicitly so we can measure the funnel entry. */}
              <Link to="/join" data-analytics-event="join_cta_click" data-analytics-location="header">
                Join Us
              </Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden inline-flex items-center justify-center min-h-11 min-w-11 text-foreground rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Toggle menu"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls="mobile-nav-drawer"
              >
                <Menu size={24} aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              id="mobile-nav-drawer"
              aria-label="Main navigation"
              className="w-[85vw] max-w-sm overflow-y-auto"
              onOpenAutoFocus={(e) => {
                // Focus the first nav link inside the drawer for keyboard users.
                e.preventDefault();
                const first = document.querySelector<HTMLElement>(
                  '#mobile-nav-drawer a, #mobile-nav-drawer button'
                );
                first?.focus();
              }}
            >
              <SheetTitle className="sr-only">Main navigation</SheetTitle>
              <nav aria-label="Mobile" className="flex flex-col gap-4 pt-2">
                {visibleNavLinks.map((link) => (
                  <HashLink
                    key={link.to}
                    to={link.to}
                    className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors min-h-11 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </HashLink>
                ))}
                {/* Members section — mirrors the desktop dropdown */}
                <div className="pt-2 mt-1 border-t border-border/60">
                  <p className="text-[10px] font-body uppercase tracking-[0.22em] text-muted-foreground/70 mb-2">Members</p>
                  {visibleMembersMenu.map((m) => (
                    <Link
                      key={m.to}
                      to={m.to}
                      onClick={() => setOpen(false)}
                      className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground min-h-11 flex items-center"
                    >
                      {m.label}
                    </Link>
                  ))}
                </div>
                {user ? (
                  <>

                    <Link
                      to="/account/profile"
                      onClick={() => setOpen(false)}
                      className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground min-h-11 flex items-center"
                    >
                      My profile
                    </Link>
                    <Link
                      to="/account/saved"
                      onClick={() => setOpen(false)}
                      className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground min-h-11 inline-flex items-center gap-2"
                    >
                      <Bookmark size={13} aria-hidden="true" /> Saved
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin/members"
                        onClick={() => setOpen(false)}
                        className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground min-h-11 flex items-center"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setOpen(false);
                        signOut();
                      }}
                      className="text-left text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground min-h-11"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="text-sm font-body uppercase tracking-widest text-muted-foreground hover:text-foreground min-h-11 flex items-center"
                  >
                    <User size={14} className="inline mr-2" aria-hidden="true" /> Sign in
                  </Link>
                )}
                {isApprovedMember ? (
                  <InviteSisterDialog>
                    <Button
                      onClick={() => setOpen(false)}
                      data-analytics-event="invite_sister_opened"
                      data-analytics-location="mobile_menu"
                      className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs w-full mt-2"
                    >
                      <Heart size={13} className="mr-2" aria-hidden="true" /> Invite a sister
                    </Button>
                  </InviteSisterDialog>
                ) : (
                  <Button className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs w-full mt-2" asChild>
                    <Link
                      to="/join"
                      onClick={() => setOpen(false)}
                      data-analytics-event="join_cta_click"
                      data-analytics-location="mobile_menu"
                    >
                      Join Us
                    </Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

    </header>
  );
};

export default Header;
