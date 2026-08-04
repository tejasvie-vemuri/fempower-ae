import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import instagramQr from "@/assets/instagram-qr.png";

interface JoinGateValue {
  /** Returns true if the user may proceed; otherwise opens the join prompt and returns false. */
  requireJoin: () => boolean;
  isAuthed: boolean;
}

const JoinGateContext = createContext<JoinGateValue>({
  requireJoin: () => true,
  isAuthed: true,
});

export const useJoinGate = () => useContext(JoinGateContext);

const INSTAGRAM_URL =
  "https://www.instagram.com/fempower.ae";

export const JoinGateProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const requireJoin = useCallback(() => {
    if (loading) return false;
    if (user) return true;
    setOpen(true);
    return false;
  }, [user, loading]);

  return (
    <JoinGateContext.Provider value={{ requireJoin, isAuthed: !!user }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Join Fempower to continue</DialogTitle>
            <DialogDescription className="font-body">
              This is part of our members' space. Join the community — or sign in if you're already a member — to explore programs, events and more.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" asChild className="font-body uppercase tracking-widest text-xs">
              <Link to="/auth" onClick={() => setOpen(false)}>Sign In</Link>
            </Button>
            <Button asChild className="font-body uppercase tracking-widest text-xs">
              <Link to="/join" onClick={() => setOpen(false)}>Join Us</Link>
            </Button>
          </DialogFooter>

          <div className="mt-2 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-body uppercase tracking-widest text-muted-foreground">
              or follow us
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <img
              src={instagramQr}
              alt="Scan to open @fempower.ae on Instagram"
              className="w-24 h-24 rounded-md border border-border bg-white p-2 flex-shrink-0"
            />
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h4 className="font-heading text-base font-semibold text-foreground">
                Join via Instagram
              </h4>
              <p className="text-sm text-muted-foreground font-body">
                Scan the QR or tap below to follow <span className="font-medium">@fempower.ae</span> and DM us to join.
              </p>
              <Button
                variant="outline"
                asChild
                className="font-body uppercase tracking-widest text-xs"
              >
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                >
                  <Instagram size={14} className="mr-2" />
                  Open Instagram
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </JoinGateContext.Provider>
  );
};
