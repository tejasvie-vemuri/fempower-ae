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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/account/tickets");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("registrations")
        .select(
          "id, status, ticket_code, amount_paid_cents, currency, checked_in_at, created_at, event:events(id, slug, title, starts_at, ends_at, location, cover_image_url)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setTickets(data as unknown as TicketRow[]);
      }
      setLoading(false);
    };
    load();
  }, [user]);

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
              <Link to="/#events">Browse events</Link>
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
                          <h2 className="font-serif text-2xl mb-1">
                            {event?.title ?? "Event"}
                          </h2>
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

                      <div className="flex gap-2 pt-2">
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
    </div>
  );
};

export default MyTickets;
