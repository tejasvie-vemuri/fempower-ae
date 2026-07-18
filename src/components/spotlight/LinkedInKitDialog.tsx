import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import { getMemberPhotoUrl } from "@/components/directory/MemberAvatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, Download, Loader2, Sparkles, Link as LinkIcon, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { LinkedInPoster, POSTER_SIZE } from "./LinkedInPoster";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ExportStep = "idle" | "caption" | "poster" | "download" | "done" | "error";
const STEP_LABEL: Record<ExportStep, string> = {
  idle: "",
  caption: "Copying caption to clipboard…",
  poster: "Rendering 1080×1080 poster…",
  download: "Downloading PNG…",
  done: "Assets ready",
  error: "Something went wrong",
};
import type { SpotlightRequest, LinkedInPostAttempt } from "@/lib/spotlightRequests";

// LinkedIn caption limits: hard cap 3000, recommended first-screen ~210 chars.
const LINKEDIN_HARD_LIMIT = 3000;
const LINKEDIN_WARN_LIMIT = 2600;

interface Props {
  open: boolean;
  onClose: () => void;
  row: (SpotlightRequest & { member_name?: string; member_photo?: string }) | null;
  onSaved?: () => void;
}

/**
 * Admin-only tool. Turns an approved spotlight into a ready-to-post LinkedIn
 * kit: a 1080×1080 poster PNG + AI-drafted caption in FemPower voice.
 * Pull quote defaults to her advice; admin can polish before capturing.
 */
export const LinkedInKitDialog = ({ open, onClose, row, onSaved }: Props) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [pullQuote, setPullQuote] = useState("");
  const [rallyLine, setRallyLine] = useState("");
  const [caption, setCaption] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exportStep, setExportStep] = useState<ExportStep>("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<LinkedInPostAttempt[]>([]);

  const captionLen = caption.length;
  const captionOver = captionLen > LINKEDIN_HARD_LIMIT;
  const captionNear = captionLen > LINKEDIN_WARN_LIMIT && !captionOver;

  useEffect(() => {
    if (!row) return;
    setPullQuote(row.pull_quote || row.advice || "");
    setRallyLine(row.rally_line || "Rooted together, rising together.");
    setCaption(row.linkedin_caption || "");
    setLinkedinUrl(row.linkedin_url || "");
    setAttempts(Array.isArray(row.linkedin_post_attempts) ? row.linkedin_post_attempts : []);
    setPhotoDataUrl(null);

    // Resolve the photo to a data URL so html-to-image can inline it without
    // hitting CORS-tainted canvas errors during capture.
    (async () => {
      const path = row.photo_url ?? row.member_photo ?? null;
      const signed = await getMemberPhotoUrl(path);
      if (!signed) return;
      try {
        const res = await fetch(signed);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => setPhotoDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error("[LinkedInKit] photo load failed", e);
      }
    })();
  }, [row]);

  if (!row) return null;

  const buildPng = async (): Promise<string | null> => {
    if (!posterRef.current) return null;
    return await toPng(posterRef.current, {
      width: POSTER_SIZE,
      height: POSTER_SIZE,
      pixelRatio: 2,
      cacheBust: true,
    });
  };

  const downloadPng = async () => {
    setDownloading(true);
    try {
      const dataUrl = await buildPng();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `fempower-spotlight-${(row.member_name ?? "member").replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Poster downloaded");
    } catch (e: any) {
      console.error("[LinkedInKit] toPng failed", e);
      toast.error(`Could not export: ${e.message ?? e}`);
    } finally {
      setDownloading(false);
    }
  };

  const persistAttempt = async (attempt: LinkedInPostAttempt) => {
    const next = [attempt, ...attempts].slice(0, 25);
    setAttempts(next);
    const { error } = await (supabase as any)
      .from("spotlight_requests")
      .update({
        linkedin_caption: caption || null,
        linkedin_post_attempts: next,
      })
      .eq("id", row.id);
    if (error) {
      console.error("[LinkedInKit] persistAttempt failed", error);
      toast.error(`Audit log not saved: ${error.message}`);
    } else {
      onSaved?.();
    }
  };

  const runExport = async () => {
    if (captionOver) {
      toast.error(`Caption is ${captionLen} chars — LinkedIn cap is ${LINKEDIN_HARD_LIMIT}. Trim before posting.`);
      return;
    }
    setDownloading(true);
    setExportError(null);
    try {
      if (caption) {
        setExportStep("caption");
        // Copy caption first (clipboard write must be inside the user gesture).
        await navigator.clipboard.writeText(caption);
      }
      setExportStep("poster");
      const dataUrl = await buildPng();
      if (!dataUrl) throw new Error("Poster rendering returned empty output");
      setExportStep("download");
      const link = document.createElement("a");
      link.download = `fempower-spotlight-${(row.member_name ?? "member").replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
      setExportStep("done");
      toast.success(
        caption ? "Caption copied · poster downloading" : "Poster downloading (no caption yet)",
      );
      await persistAttempt({
        at: new Date().toISOString(),
        status: "success",
        caption_len: captionLen,
      });
    } catch (e: any) {
      console.error("[LinkedInKit] copyAssets failed", e);
      const msg = e?.message ?? String(e);
      setExportStep("error");
      setExportError(msg);
      toast.error(`Could not copy assets: ${msg}`);
      await persistAttempt({
        at: new Date().toISOString(),
        status: "error",
        error: msg.slice(0, 500),
        caption_len: captionLen,
      });
    } finally {
      setDownloading(false);
    }
  };

  const copyAssets = () => {
    if (captionOver) {
      toast.error(`Caption is ${captionLen} chars — LinkedIn cap is ${LINKEDIN_HARD_LIMIT}. Trim before posting.`);
      return;
    }
    // Confirm first — this triggers a download and clipboard write.
    setExportStep("idle");
    setExportError(null);
    setConfirmOpen(true);
  };

  const confirmAndExport = async () => {
    setConfirmOpen(false);
    await runExport();
  };

  const generateCaption = async () => {
    setGenerating(true);
    const { data, error } = await supabase.functions.invoke("generate-spotlight-caption", {
      body: {
        memberName: row.member_name,
        roleCompany: row.role_company,
        headline: row.headline,
        identityTag: row.identity_tag,
        stoppedWaitingFor: row.stopped_waiting_for,
        pullQuote,
        rallyLine,
        the_before: row.the_before,
        the_turning_point: row.the_turning_point,
        the_now: row.the_now,
        advice: row.advice,
      },
    });
    setGenerating(false);
    if (error) {
      toast.error(`Caption failed: ${error.message}`);
      return;
    }
    setCaption(data?.caption ?? "");
    toast.success("Caption drafted");
  };

  const copyCaption = async () => {
    if (!caption) return;
    await navigator.clipboard.writeText(caption);
    toast.success("Caption copied");
  };

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("spotlight_requests")
      .update({
        pull_quote: pullQuote,
        rally_line: rallyLine,
        linkedin_caption: caption || null,
        linkedin_url: linkedinUrl.trim() || null,
        linkedin_posted_at: linkedinUrl.trim() ? new Date().toISOString() : row.linkedin_posted_at,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("LinkedIn kit saved");
    onSaved?.();
    onClose();
  };

  // Scale preview to fit dialog width (~600px viewport width available)
  const previewScale = 0.42;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-blush-dark" /> LinkedIn Kit — {row.member_name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Preview */}
          <div>
            <Label className="mb-2 block">Poster preview (1080×1080)</Label>
            <div
              className="rounded-lg border border-border overflow-hidden bg-muted/30"
              style={{ width: POSTER_SIZE * previewScale, height: POSTER_SIZE * previewScale }}
            >
              <div style={{ transform: `scale(${previewScale})`, transformOrigin: "top left" }}>
                <LinkedInPoster
                  memberName={row.member_name ?? ""}
                  photoUrl={photoDataUrl}
                  headline={row.headline ?? ""}
                  roleCompany={row.role_company ?? ""}
                  identityTag={row.identity_tag ?? ""}
                  stoppedWaitingFor={row.stopped_waiting_for ?? "permission"}
                  pullQuote={pullQuote}
                  rallyLine={rallyLine}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button
                onClick={copyAssets}
                disabled={downloading || !photoDataUrl}
              >
                {downloading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Sparkles size={14} className="mr-2" />}
                Copy assets
              </Button>
              <Button
                onClick={downloadPng}
                disabled={downloading || !photoDataUrl}
                variant="outline"
              >
                <Download size={14} className="mr-2" /> Poster only
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 text-center">
              One click: caption → clipboard, poster → downloads.
            </p>

            {/* Progress / error surface */}
            {(downloading || exportStep === "done" || exportStep === "error") && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-3 rounded-md border p-2.5 text-xs flex items-start gap-2 ${
                  exportStep === "error"
                    ? "border-destructive/50 bg-destructive/5 text-destructive"
                    : exportStep === "done"
                    ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                    : "border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                {downloading ? (
                  <Loader2 size={14} className="animate-spin mt-0.5 shrink-0" />
                ) : exportStep === "done" ? (
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{STEP_LABEL[exportStep]}</div>
                  {exportError && (
                    <div className="mt-0.5 text-[11px] break-words opacity-90">{exportError}</div>
                  )}
                  {downloading && (
                    <div className="mt-1.5 flex gap-1">
                      {(["caption", "poster", "download"] as ExportStep[]).map((s) => {
                        const order = ["caption", "poster", "download"] as const;
                        const currentIdx = order.indexOf(exportStep as any);
                        const idx = order.indexOf(s as any);
                        const done = currentIdx > idx;
                        const active = currentIdx === idx;
                        return (
                          <div
                            key={s}
                            className={`h-1 flex-1 rounded-full ${
                              done ? "bg-emerald-500" : active ? "bg-primary animate-pulse" : "bg-muted"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                  {exportStep === "error" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7"
                      onClick={runExport}
                    >
                      <RotateCcw size={12} className="mr-1" /> Retry
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>


          {/* Controls */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="pullQuote">Pull quote (shown on poster)</Label>
              <Textarea
                id="pullQuote"
                value={pullQuote}
                onChange={(e) => setPullQuote(e.target.value.slice(0, 180))}
                rows={3}
                placeholder="Short, punchy — 15 words or less"
              />
              <p className="text-xs text-muted-foreground mt-1">{pullQuote.length}/180</p>
            </div>
            <div>
              <Label htmlFor="rallyLine">Rally line (bottom of poster)</Label>
              <Input
                id="rallyLine"
                value={rallyLine}
                onChange={(e) => setRallyLine(e.target.value.slice(0, 100))}
                placeholder="Rooted together, rising together."
              />
            </div>
            <div>
              <Label>Caption for LinkedIn post <span className="text-muted-foreground font-normal">(edit freely before posting)</span></Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={8}
                placeholder="Click 'Draft with AI' to generate in FemPower voice"
                className={captionOver ? "border-destructive focus-visible:ring-destructive" : undefined}
              />
              <div
                className={`flex justify-between items-center text-[11px] mt-1 ${
                  captionOver ? "text-destructive" : captionNear ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                }`}
                aria-live="polite"
              >
                <span>
                  {captionLen.toLocaleString()} / {LINKEDIN_HARD_LIMIT.toLocaleString()} chars
                </span>
                <span>
                  {captionOver
                    ? `Over LinkedIn's ${LINKEDIN_HARD_LIMIT}-char cap — trim before posting`
                    : captionNear
                    ? `Approaching LinkedIn's ${LINKEDIN_HARD_LIMIT}-char cap`
                    : captionLen > 210
                    ? "First ~210 chars show before 'see more'"
                    : ""}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={generateCaption} disabled={generating}>
                  {generating ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Sparkles size={14} className="mr-1" />}
                  Draft with AI
                </Button>
                <Button size="sm" variant="outline" onClick={copyCaption} disabled={!caption}>
                  <Copy size={14} className="mr-1" /> Copy
                </Button>
              </div>
            </div>
            {attempts.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <div className="text-xs font-medium mb-2">Posting attempts ({attempts.length})</div>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto text-[11px]">
                  {attempts.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {a.status === "success" ? (
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle size={12} className="mt-0.5 shrink-0 text-destructive" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium capitalize">{a.status}</span>
                          <span className="text-muted-foreground">
                            {new Date(a.at).toLocaleString()}
                          </span>
                          {typeof a.caption_len === "number" && (
                            <span className="text-muted-foreground">· {a.caption_len} chars</span>
                          )}
                        </div>
                        {a.error && (
                          <div className="text-destructive break-words mt-0.5">{a.error}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <Label htmlFor="linkedinUrl" className="flex items-center gap-1">
                <LinkIcon size={12} /> Posted URL (optional)
              </Label>
              <Input
                id="linkedinUrl"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/posts/..."
              />
            </div>
          </div>
        </div>

        {/* Off-screen full-size poster for capture */}
        <div style={{ position: "fixed", top: -99999, left: -99999, pointerEvents: "none" }} aria-hidden>
          <LinkedInPoster
            ref={posterRef}
            memberName={row.member_name ?? ""}
            photoUrl={photoDataUrl}
            headline={row.headline ?? ""}
            roleCompany={row.role_company ?? ""}
            identityTag={row.identity_tag ?? ""}
            stoppedWaitingFor={row.stopped_waiting_for ?? "permission"}
            pullQuote={pullQuote}
            rallyLine={rallyLine}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 size={14} className="mr-2 animate-spin" />} Save kit
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ready to export the LinkedIn kit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will {caption ? "copy the caption to your clipboard and " : ""}download the 1080×1080 poster PNG for {row.member_name}.
              {!caption && (
                <span className="block mt-2 text-amber-700 dark:text-amber-400">
                  No caption drafted yet — only the poster will be exported.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndExport}>
              {caption ? "Copy & download" : "Download poster"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>

  );
};
