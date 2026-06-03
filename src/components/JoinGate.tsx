import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Link } from "react-router-dom";
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
        <DialogContent className="sm:max-w-md">
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
        </DialogContent>
      </Dialog>
    </JoinGateContext.Provider>
  );
};
