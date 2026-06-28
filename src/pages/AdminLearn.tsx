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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type {
  LearnCourse,
  LearnModule,
  LearnWing,
  LearnResource,
} from "@/lib/learn";

// ── Courses Tab ──────────────────────────────────────────────

const emptyCourseForm = {
  id: "",
  title: "",
  description: "",
  emoji: "🦋",
  display_order: "0",
  status: "draft" as "draft" | "published" | "scheduled",
  published_at: "",
};

function CoursesTab() {
  const [items, setItems] = useState<LearnCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyCourseForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("learn_courses")
      .select("*")
      .order("display_order");
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyCourseForm); setOpen(true); };
  const openEdit = (c: LearnCourse) => {
    setForm({
      id: c.id,
      title: c.title,
      description: c.description ?? "",
      emoji: c.emoji,
      display_order: String(c.display_order),
      status: c.status,
      published_at: c.published_at ? c.published_at.slice(0, 16) : "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description || null,
      emoji: form.emoji || "🦋",
      display_order: parseInt(form.display_order) || 0,
      status: form.status,
      published_at: form.status === "scheduled" && form.published_at
        ? new Date(form.published_at).toISOString()
        : form.status === "published" ? new Date().toISOString() : null,
    };
    const { error } = form.id
      ? await (supabase as any).from("learn_courses").update(payload).eq("id", form.id)
      : await (supabase as any).from("learn_courses").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Course updated" : "Course created");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course and all its modules, wings, and resources?")) return;
    const { error } = await (supabase as any).from("learn_courses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Course deleted");
    load();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg">Courses</h2>
        <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" /> New course</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Emoji</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.emoji}</TableCell>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "published" ? "default" : c.status === "scheduled" ? "outline" : "secondary"}>
                    {c.status}
                  </Badge>
                  {c.status === "scheduled" && c.published_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(c.published_at).toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right">{c.display_order}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil size={14} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No courses yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Edit Course" : "New Course"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Emoji</Label><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} /></div>
              <div><Label>Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.status === "scheduled" && (
              <div>
                <Label>Publish at</Label>
                <Input type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Modules Tab ──────────────────────────────────────────────

const emptyModuleForm = {
  id: "",
  course_id: "",
  title: "",
  description: "",
  display_order: "0",
  published_at: "",
};

function ModulesTab() {
  const [courses, setCourses] = useState<LearnCourse[]>([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [items, setItems] = useState<LearnModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyModuleForm);
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    const { data } = await (supabase as any).from("learn_courses").select("*").order("display_order");
    setCourses(data ?? []);
  };

  const loadModules = async () => {
    setLoading(true);
    let q = (supabase as any).from("learn_modules").select("*").order("display_order");
    if (courseFilter) q = q.eq("course_id", courseFilter);
    const { data } = await q;
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { loadModules(); }, [courseFilter]);

  const openCreate = () => {
    setForm({ ...emptyModuleForm, course_id: courseFilter || "" });
    setOpen(true);
  };
  const openEdit = (m: LearnModule) => {
    setForm({
      id: m.id,
      course_id: m.course_id,
      title: m.title,
      description: m.description ?? "",
      display_order: String(m.display_order),
      published_at: m.published_at ? m.published_at.slice(0, 16) : "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      course_id: form.course_id,
      title: form.title,
      description: form.description || null,
      display_order: parseInt(form.display_order) || 0,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
    };
    const { error } = form.id
      ? await (supabase as any).from("learn_modules").update(payload).eq("id", form.id)
      : await (supabase as any).from("learn_modules").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Module updated" : "Module created");
    setOpen(false);
    loadModules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this module and all its wings?")) return;
    const { error } = await (supabase as any).from("learn_modules").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Module deleted");
    loadModules();
  };

  const courseName = (id: string) => courses.find((c) => c.id === id)?.title ?? "—";

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-lg">Modules</h2>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All courses</SelectItem>
              {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" /> New module</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Publish at</TableHead>
              <TableHead className="text-right">Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{courseName(m.course_id)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {m.published_at
                    ? new Date(m.published_at).toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" })
                    : <span className="italic">Immediate</span>}
                </TableCell>
                <TableCell className="text-right">{m.display_order}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Pencil size={14} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)}><Trash2 size={14} /></Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No modules yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Edit Module" : "New Module"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Course</Label>
              <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} /></div>
              <div><Label>Schedule publish (optional)</Label><Input type="datetime-local" value={form.published_at} onChange={(e) => setForm({ ...form, published_at: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.course_id}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Wings Tab ────────────────────────────────────────────────

const emptyWingForm = {
  id: "",
  module_id: "",
  title: "",
  context_content: "",
  reflection_prompt: "",
  extension_content: "",
  display_order: "0",
  estimated_minutes: "5",
};

function WingsTab() {
  const [courses, setCourses] = useState<LearnCourse[]>([]);
  const [modules, setModules] = useState<LearnModule[]>([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [items, setItems] = useState<LearnWing[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyWingForm);
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    const { data } = await (supabase as any).from("learn_courses").select("*").order("display_order");
    setCourses(data ?? []);
  };

  const loadModules = async () => {
    let q = (supabase as any).from("learn_modules").select("*").order("display_order");
    if (courseFilter) q = q.eq("course_id", courseFilter);
    const { data } = await q;
    setModules(data ?? []);
  };

  const loadWings = async () => {
    setLoading(true);
    let q = (supabase as any).from("learn_wings").select("*").order("display_order");
    if (moduleFilter) {
      q = q.eq("module_id", moduleFilter);
    } else if (courseFilter) {
      const moduleIds = modules.map((m) => m.id);
      if (moduleIds.length > 0) q = q.in("module_id", moduleIds);
      else { setItems([]); setLoading(false); return; }
    }
    const { data } = await q;
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { loadModules(); setModuleFilter(""); }, [courseFilter]);
  useEffect(() => { loadWings(); }, [moduleFilter, modules]);

  const openCreate = () => {
    setForm({ ...emptyWingForm, module_id: moduleFilter || "" });
    setOpen(true);
  };
  const openEdit = (w: LearnWing) => {
    setForm({
      id: w.id,
      module_id: w.module_id,
      title: w.title,
      context_content: w.context_content,
      reflection_prompt: w.reflection_prompt,
      extension_content: w.extension_content,
      display_order: String(w.display_order),
      estimated_minutes: String(w.estimated_minutes ?? 5),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      module_id: form.module_id,
      title: form.title,
      context_content: form.context_content,
      reflection_prompt: form.reflection_prompt,
      extension_content: form.extension_content,
      display_order: parseInt(form.display_order) || 0,
      estimated_minutes: parseInt(form.estimated_minutes) || 5,
    };
    const { error } = form.id
      ? await (supabase as any).from("learn_wings").update(payload).eq("id", form.id)
      : await (supabase as any).from("learn_wings").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Wing updated" : "Wing created");
    setOpen(false);
    loadWings();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this wing?")) return;
    const { error } = await (supabase as any).from("learn_wings").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Wing deleted");
    loadWings();
  };

  const moduleName = (id: string) => modules.find((m) => m.id === id)?.title ?? "—";

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-heading text-lg">Wings</h2>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All courses</SelectItem>
              {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
          {modules.length > 0 && (
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All modules" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All modules</SelectItem>
                {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" /> New wing</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Module</TableHead>
              <TableHead className="text-right">Min</TableHead>
              <TableHead className="text-right">Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{w.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{moduleName(w.module_id)}</TableCell>
                <TableCell className="text-right">{w.estimated_minutes}</TableCell>
                <TableCell className="text-right">{w.display_order}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(w)}><Pencil size={14} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(w.id)}><Trash2 size={14} /></Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No wings yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit Wing" : "New Wing"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Module</Label>
              <Select value={form.module_id} onValueChange={(v) => setForm({ ...form, module_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                <SelectContent>
                  {modules.length > 0
                    ? modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)
                    : courses.flatMap((c) => (
                        <SelectItem key={c.id} value={c.id} disabled>{c.title} (select a course filter first)</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Context (lesson content)</Label><Textarea value={form.context_content} onChange={(e) => setForm({ ...form, context_content: e.target.value })} rows={8} /></div>
            <div><Label>Reflection prompt</Label><Textarea value={form.reflection_prompt} onChange={(e) => setForm({ ...form, reflection_prompt: e.target.value })} rows={3} /></div>
            <div><Label>Extension (apply-it content)</Label><Textarea value={form.extension_content} onChange={(e) => setForm({ ...form, extension_content: e.target.value })} rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Estimated minutes</Label><Input type="number" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })} /></div>
              <div><Label>Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.module_id}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Resources Tab ────────────────────────────────────────────

const emptyResourceForm = {
  id: "",
  course_id: "",
  title: "",
  url: "",
  description: "",
  display_order: "0",
};

function ResourcesTab() {
  const [courses, setCourses] = useState<LearnCourse[]>([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [items, setItems] = useState<LearnResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyResourceForm);
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    const { data } = await (supabase as any).from("learn_courses").select("*").order("display_order");
    setCourses(data ?? []);
  };

  const loadResources = async () => {
    setLoading(true);
    let q = (supabase as any).from("learn_resources").select("*").order("display_order");
    if (courseFilter) q = q.eq("course_id", courseFilter);
    const { data } = await q;
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { loadResources(); }, [courseFilter]);

  const openCreate = () => {
    setForm({ ...emptyResourceForm, course_id: courseFilter || "" });
    setOpen(true);
  };
  const openEdit = (r: LearnResource) => {
    setForm({
      id: r.id,
      course_id: r.course_id,
      title: r.title,
      url: r.url,
      description: r.description ?? "",
      display_order: String(r.display_order),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      course_id: form.course_id,
      title: form.title,
      url: form.url,
      description: form.description || null,
      display_order: parseInt(form.display_order) || 0,
    };
    const { error } = form.id
      ? await (supabase as any).from("learn_resources").update(payload).eq("id", form.id)
      : await (supabase as any).from("learn_resources").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(form.id ? "Resource updated" : "Resource created");
    setOpen(false);
    loadResources();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    const { error } = await (supabase as any).from("learn_resources").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Resource deleted");
    loadResources();
  };

  const courseName = (id: string) => courses.find((c) => c.id === id)?.title ?? "—";

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-lg">Resources</h2>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All courses</SelectItem>
              {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={openCreate}><Plus size={14} className="mr-1" /> New resource</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Course</TableHead>
              <TableHead className="text-right">Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{r.url}</a>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{courseName(r.course_id)}</TableCell>
                <TableCell className="text-right">{r.display_order}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No resources yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Edit Resource" : "New Resource"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Course</Label>
              <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Description (optional)</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div><Label>Order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} className="w-24" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.url.trim() || !form.course_id}>
              {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────

const AdminLearn = () => (
  <div className="container max-w-6xl py-10">
    <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
      <ArrowLeft size={14} /> Back to site
    </Link>
    <h1 className="font-heading text-3xl mb-6">Manage Learn</h1>

    <Tabs defaultValue="courses">
      <TabsList className="mb-6">
        <TabsTrigger value="courses">Courses</TabsTrigger>
        <TabsTrigger value="modules">Modules</TabsTrigger>
        <TabsTrigger value="wings">Wings</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
      </TabsList>
      <TabsContent value="courses"><CoursesTab /></TabsContent>
      <TabsContent value="modules"><ModulesTab /></TabsContent>
      <TabsContent value="wings"><WingsTab /></TabsContent>
      <TabsContent value="resources"><ResourcesTab /></TabsContent>
    </Tabs>
  </div>
);

export default AdminLearn;
