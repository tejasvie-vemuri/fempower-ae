import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, ArrowLeft, Users } from "lucide-react";
import {
  AttendeeQuestion,
  parseQuestions,
  DEFAULT_ATTENDEE_QUESTIONS,
} from "@/lib/attendeeQuestions";

import { AttendeeQuestionsEditor } from "@/components/admin/AttendeeQuestionsEditor";

type EventStatus = "draft" | "published" | "cancelled" | "completed";

interface EventRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  price_cents: number;
  currency: string;
  capacity: number;
  status: EventStatus;
  waitlist_enabled: boolean;
  attendee_questions: unknown;
}

const emptyForm = {
  id: "",
  slug: "",
  title: "",
  description: "",
  cover_image_url: "",
  location: "",
  starts_at: "",
  ends_at: "",
  timezone: "Asia/Dubai",
  price_aed: "0",
  currency: "AED",
  capacity: "0",
  status: "draft" as EventStatus,
  waitlist_enabled: true,
  attendee_questions: [] as AttendeeQuestion[],
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdminEvents = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("starts_at", { ascending: false });
    if (error) toast.error(error.message);
    setEvents((data as EventRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (e: EventRow) => {
    setForm({
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description ?? "",
      cover_image_url: e.cover_image_url ?? "",
      location: e.location ?? "",
      starts_at: toLocalInput(e.starts_at),
      ends_at: toLocalInput(e.ends_at),
      timezone: e.timezone,
      price_aed: (e.price_cents / 100).toString(),
      currency: e.currency,
      capacity: e.capacity.toString(),
      status: e.status,
      waitlist_enabled: e.waitlist_enabled,
      attendee_questions: parseQuestions(e.attendee_questions),
    });
    setOpen(true);
  };

  const handleSave = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!form.title || !form.starts_at) {
      toast.error("Title and start date are required");
      return;
    }
    setSaving(true);
    const slug = form.slug.trim() || slugify(form.title);
    const payload = {
      slug,
      title: form.title.trim(),
      description: form.description || null,
      cover_image_url: form.cover_image_url || null,
      location: form.location || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      timezone: form.timezone || "Asia/Dubai",
      price_cents: Math.round(parseFloat(form.price_aed || "0") * 100),
      currency: form.currency || "AED",
      capacity: parseInt(form.capacity || "0", 10),
      status: form.status,
      waitlist_enabled: form.waitlist_enabled,
      attendee_questions: JSON.parse(
        JSON.stringify(form.attendee_questions.filter((q) => q.label.trim())),
      ),
    };
    const { error } = form.id
      ? await supabase.from("events").update(payload).eq("id", form.id)
      : await supabase.from("events").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Event updated" : "Event created");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event? Registrations will be removed.")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Event deleted");
    load();
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to site
            </Link>
            <h1 className="font-heading text-3xl text-primary">Manage Events</h1>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> New event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{form.id ? "Edit event" : "Create event"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        title: e.target.value,
                        slug: f.slug || slugify(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="auto-generated from title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="starts_at">Starts at *</Label>
                    <Input
                      id="starts_at"
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ends_at">Ends at</Label>
                    <Input
                      id="ends_at"
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cover">Cover image URL</Label>
                    <Input
                      id="cover"
                      value={form.cover_image_url}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, cover_image_url: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Price (AED)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price_aed}
                      onChange={(e) => setForm((f) => ({ ...f, price_aed: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity (0 = ∞)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="0"
                      value={form.capacity}
                      onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm((f) => ({ ...f, status: v as EventStatus }))}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="waitlist"
                    type="checkbox"
                    checked={form.waitlist_enabled}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, waitlist_enabled: e.target.checked }))
                    }
                  />
                  <Label htmlFor="waitlist" className="cursor-pointer">
                    Enable waitlist when full
                  </Label>
                </div>

                <AttendeeQuestionsEditor
                  value={form.attendee_questions}
                  onChange={(next) =>
                    setForm((f) => ({ ...f, attendee_questions: next }))
                  }
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {form.id ? "Save changes" : "Create event"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No events yet. Create your first one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell>{fmtDate(e.starts_at)}</TableCell>
                    <TableCell>
                      {e.price_cents === 0
                        ? "Free"
                        : `${e.currency} ${(e.price_cents / 100).toFixed(2)}`}
                    </TableCell>
                    <TableCell>{e.capacity === 0 ? "∞" : e.capacity}</TableCell>
                    <TableCell>
                      <span className="text-xs uppercase tracking-wide px-2 py-1 rounded bg-muted">
                        {e.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="Registrations">
                        <Link to={`/admin/events/${e.id}/registrations`}>
                          <Users className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEvents;
