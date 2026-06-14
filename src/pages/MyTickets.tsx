import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, Ticket, ArrowLeft, Download, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AddToCalendarButton } from "@/components/AddToCalendarButton";
import HashLink from "@/components/HashLink";

interface TicketRow {
  id: string;
  status: string;
  ticket_code: string;
  amount_paid_cents: number;
  currency: string;
  checked_in_at: string | null;
  created_at: string;
  cancellation_requested_at: string | null;
  cancellation_reason: string | null;
  quantity: number | null;
  guests: Array<{ name?: string; email?: string }> | null;
  event: {
    id: string;
    slug: string;
    title: string;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    cover_image_url: string | null;
  } | null;
}

const formatPrice = (cents: number, currency: string) => {
  if (cents <= 0) return "Free";
  return `${currency} ${(cents / 100).toFixed(2)}`;
};

const statusVariant = (status: string) => {
  switch (status) {
    case "confirmed":
      return "default";
    case "pending":
      return "secondary";
    case "cancelled":
    case "refunded":
      return "outline";
    default:
      return "secondary";
  }
};

const downloadQr = (ticketCode: string, eventTitle: string) => {
  const svg = document.getElementById(`qr-${ticketCode}`) as unknown as SVGSVGElement | null;
  if (!svg) return;
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);
  const canvas = document.createElement("canvas");
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  img.onload = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.download = `${eventTitle.replace(/\s+/g, "-").toLowerCase()}-ticket.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
  img.src = url;
};

const MyTickets = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<TicketRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/account/tickets");
    }
  }, [authLoading, user, navigate]);

  const loadTickets = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("registrations")
      .select(
        "id, status, ticket_code, amount_paid_cents, currency, checked_in_at, created_at, cancellation_requested_at, cancellation_reason, quantity, guests, event:events(id, slug, title, starts_at, ends_at, location, cover_image_url)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setTickets(data as unknown as TicketRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submitCancellation = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    const { error } = await supabase
      .from("registrations")
      .update({
        cancellation_requested_at: new Date().toISOString(),
        cancellation_reason: cancelReason.trim() || null,
      })
      .eq("id", cancelTarget.id);
    setCancelling(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cancellation request sent. Our team will review it shortly.");
    setCancelTarget(null);
    setCancelReason("");
    loadTickets();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="mb-10">
          <h1 className="font-serif text-4xl md:text-5xl mb-3">My tickets</h1>
          <p className="text-muted-foreground">
            Your registrations and QR codes for upcoming Fempower events.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : tickets.length === 0 ? (
          <Card className="p-12 text-center">
            <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-serif text-2xl mb-2">No tickets yet</h2>
            <p className="text-muted-foreground mb-6">
              Browse upcoming events and book your first one.
            </p>
            <Button asChild>
              <HashLink to="/#events-calendar">Browse events</HashLink>
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {tickets.map((t) => {
              const event = t.event;
              const isConfirmed = t.status === "confirmed";
              return (
                <Card key={t.id} className="overflow-hidden">
                  <div className="grid md:grid-cols-[1fr_auto] gap-6 p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h2 className="font-serif text-2xl mb-1 flex items-center gap-2">
                            {event?.title ?? "Event"}
                            {(t.quantity ?? 1) > 1 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-sans">
                                +{(t.quantity ?? 1) - 1} guest{(t.quantity ?? 1) - 1 === 1 ? "" : "s"}
                              </span>
                            )}
                          </h2>
                          {Array.isArray(t.guests) && t.guests.length > 0 && (
                            <div className="text-xs text-muted-foreground mb-1">
                              With: {t.guests.map((g) => g?.name).filter(Boolean).join(", ")}
                            </div>
                          )}
                          {event && (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(event.starts_at), "EEE, MMM d • h:mm a")}
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {event.location}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <Badge variant={statusVariant(t.status)} className="capitalize">
                          {t.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm pt-2 border-t">
                        <div>
                          <div className="text-muted-foreground">Paid</div>
                          <div className="font-medium">
                            {formatPrice(t.amount_paid_cents, t.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Ticket code</div>
                          <div className="font-mono text-xs">{t.ticket_code}</div>
                        </div>
                        {t.checked_in_at && (
                          <div>
                            <div className="text-muted-foreground">Checked in</div>
                            <div className="font-medium">
                              {format(new Date(t.checked_in_at), "MMM d, h:mm a")}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {event && (
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/events/${event.slug}`}>View event</Link>
                          </Button>
                        )}
                        {isConfirmed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadQr(t.ticket_code, event?.title ?? "ticket")
                            }
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download QR
                          </Button>
                        )}
                        {isConfirmed && event && (
                          <AddToCalendarButton
                            size="sm"
                            event={{
                              title: event.title,
                              location: event.location,
                              startsAt: event.starts_at,
                              endsAt: event.ends_at,
                              uid: `ticket-${t.id}@fempowerae.com`,
                            }}
                          />
                        )}
                        {isConfirmed && !t.cancellation_requested_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setCancelTarget(t);
                              setCancelReason("");
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Request cancellation
                          </Button>
                        )}
                        {t.cancellation_requested_at && t.status !== "refunded" && (
                          <Badge variant="outline" className="text-xs">
                            Cancellation requested
                          </Badge>
                        )}
                      </div>
                    </div>

                    {isConfirmed ? (
                      <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg border">
                        <QRCodeSVG
                          id={`qr-${t.ticket_code}`}
                          value={t.ticket_code}
                          size={160}
                          level="M"
                          includeMargin={false}
                        />
                        <div className="text-xs text-muted-foreground mt-2">
                          Show at check-in
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center bg-muted/40 p-6 rounded-lg border border-dashed text-center min-w-[180px]">
                        <Ticket className="w-8 h-8 text-muted-foreground mb-2" />
                        <div className="text-xs text-muted-foreground">
                          QR available after payment is confirmed
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request cancellation</DialogTitle>
            <DialogDescription>
              Our team will review your request and process a refund per our policy:
              full refund if we cancel; credit or transfer if you cancel ≥72 hours
              before; no refund within 72 hours or for no-shows.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Let us know why you can't attend…"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Never mind
            </Button>
            <Button onClick={submitCancellation} disabled={cancelling}>
              {cancelling ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyTickets;
