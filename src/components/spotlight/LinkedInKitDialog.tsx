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
import { Copy, Download, Loader2, Sparkles, Link as LinkIcon } from "lucide-react";
import { LinkedInPoster, POSTER_SIZE } from "./LinkedInPoster";
import type { SpotlightRequest } from "@/lib/spotlightRequests";

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

  useEffect(() => {
    if (!row) return;
    setPullQuote(row.pull_quote || row.advice || "");
    setRallyLine(row.rally_line || "Rooted together, rising together.");
    setCaption(row.linkedin_caption || "");
    setLinkedinUrl(row.linkedin_url || "");
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

  const copyAssets = async () => {
    setDownloading(true);
    try {
      // Copy caption first (clipboard write must be inside the user gesture).
      if (caption) await navigator.clipboard.writeText(caption);
      const dataUrl = await buildPng();
      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `fempower-spotlight-${(row.member_name ?? "member").replace(/\s+/g, "-").toLowerCase()}.png`;
        link.href = dataUrl;
        link.click();
      }
      toast.success(
        caption ? "Caption copied · poster downloading" : "Poster downloading (no caption yet)",
      );
    } catch (e: any) {
      console.error("[LinkedInKit] copyAssets failed", e);
      toast.error(`Could not copy assets: ${e.message ?? e}`);
    } finally {
      setDownloading(false);
    }
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
              />
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
    </Dialog>
  );
};
