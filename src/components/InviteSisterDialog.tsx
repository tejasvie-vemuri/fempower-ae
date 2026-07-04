import { useState } from "react";
import { Copy, Check, MessageCircle, Instagram, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const INVITE_URL = "https://fempowerae.com/join";
const SHARE_TEXT = `I'm part of Fempower — a UAE women's circle for honest conversations, mentor walks and rising together. Come join us 🤍 ${INVITE_URL}`;

interface Props {
  children: React.ReactNode;
}

const InviteSisterDialog = ({ children }: Props) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      setCopied(true);
      toast({ title: "Copied!", description: "Invite message is on your clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Invite a sister 🤍</DialogTitle>
          <DialogDescription className="font-body">
            Know a woman who'd love this space? Send her in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input readOnly value={INVITE_URL} className="font-body text-sm" />
            <Button type="button" variant="outline" size="sm" onClick={copy} className="flex-shrink-0">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button variant="outline" asChild className="font-body text-xs uppercase tracking-widest">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={14} className="mr-2" /> WhatsApp
              </a>
            </Button>
            <Button variant="outline" asChild className="font-body text-xs uppercase tracking-widest">
              <a
                href={`mailto:?subject=${encodeURIComponent("Join me at Fempower")}&body=${encodeURIComponent(SHARE_TEXT)}`}
              >
                <Mail size={14} className="mr-2" /> Email
              </a>
            </Button>
            <Button variant="outline" asChild className="font-body text-xs uppercase tracking-widest">
              <a
                href="https://www.instagram.com/fempower.ae"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram size={14} className="mr-2" /> Instagram
              </a>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground font-body">
            Tip: tap copy, then paste into any DM or group chat.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteSisterDialog;
