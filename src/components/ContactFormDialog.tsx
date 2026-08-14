import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { track } from "@/lib/analytics";
import { Mail } from "lucide-react";

interface ContactFormDialogProps {
  trigger?: React.ReactNode;
}

const ContactFormDialog = ({ trigger }: ContactFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) track("contact_form_opened", { path: window.location.pathname });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Length only — the message body itself never leaves the browser.
    track("contact_form_submitted", { message_length: message.length });
    const subject = encodeURIComponent(`Contact from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    window.open(`mailto:tejasvie59@gmail.com?subject=${subject}&body=${body}`, "_blank");
    toast({ title: "Opening your email client…", description: "Please send the pre-filled email." });
    setName("");
    setEmail("");
    setMessage("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="font-body uppercase tracking-widest text-xs px-5">
            <Mail size={14} className="mr-1.5" />
            Contact Us
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Contact Us 🦋</DialogTitle>
        </DialogHeader>
        {/* Name, email and message stay out of session replays. */}
        <form onSubmit={handleSubmit} data-clarity-mask="True" className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">Name</Label>
            <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="How can we help?" rows={4} />
          </div>
          <Button type="submit" className="w-full bg-foreground text-primary-foreground hover:bg-foreground/90 font-body uppercase tracking-widest text-xs">
            Send Message
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
