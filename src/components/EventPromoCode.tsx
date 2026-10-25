import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
export interface AppliedPromo { code: string; discount_cents: number; total_cents: number }
export default function EventPromoCode({ eventId, quantity, userId, currency, value, onChange, disabled }: { eventId: string; quantity: number; userId?: string; currency: string; value: AppliedPromo | null; onChange: (value: AppliedPromo | null) => void; disabled: boolean }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  useEffect(() => { onChange(null); setError(""); }, [eventId, quantity, userId]);
  const apply = async () => {
    setChecking(true); setError("");
    try {
      const { data, error: failure } = await supabase.functions.invoke("validate-event-promo", { body: { event_id: eventId, quantity, promo_code: code.trim() } });
      if (failure) {
        let message = "Could not apply promo code";
        try { message = (await failure.context?.json())?.error ?? message; } catch { /* fallback */ }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
      onChange(data); setCode(data.code);
    } catch (failure) { onChange(null); setError(failure instanceof Error ? failure.message : "Could not apply promo code"); }
    finally { setChecking(false); }
  };
  return <div className="space-y-2">
    <Label htmlFor="event-promo-code">Promo code</Label>
    {value ? <div className="flex items-center justify-between gap-2 text-sm text-primary bg-muted rounded-md p-2" role="status"><span>{value.code} · −{currency} {(value.discount_cents / 100).toFixed(2)}</span><Button variant="ghost" size="icon" aria-label="Remove promo code" disabled={disabled} onClick={() => onChange(null)}><X className="h-4 w-4" /></Button></div> : <div className="flex gap-2"><Input id="event-promo-code" maxLength={40} value={code} disabled={disabled || checking} onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (code.trim()) apply(); } }} /><Button variant="outline" onClick={apply} disabled={disabled || checking || !code.trim()}>{checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}</Button></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}