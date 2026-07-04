import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";

const AdminLifestyleManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [trialDays, setTrialDays] = useState("30");
  const [priceAmount, setPriceAmount] = useState("29");
  const [priceCurrency, setPriceCurrency] = useState("AED");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("plan_config")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (data) {
        setTrialDays(String(data.trial_days));
        setPriceAmount(String(data.price_amount));
        setPriceCurrency(data.price_currency);
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("plan_config")
      .update({
        trial_days: Number(trialDays) || 0,
        price_amount: Number(priceAmount) || 0,
        price_currency: priceCurrency.trim().toUpperCase() || "AED",
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: "Trial length and price are live everywhere now." });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-20 min-h-screen bg-background">
        <div className="container max-w-xl">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-body uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft size={13} /> Home
          </Link>

          <h1 className="font-heading text-3xl text-foreground mb-1">Lifestyle Manager settings</h1>
          <p className="text-muted-foreground font-body mb-8">
            Trial length and price, editable here, read live by the app everywhere else.
          </p>

          <Card className="p-6 space-y-5">
            <div>
              <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                Free trial length (days)
              </Label>
              <Input
                type="number"
                min={0}
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                className="font-body mt-1.5"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                  Price
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(e.target.value)}
                  className="font-body mt-1.5"
                />
              </div>
              <div className="w-28">
                <Label className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                  Currency
                </Label>
                <Input
                  value={priceCurrency}
                  onChange={(e) => setPriceCurrency(e.target.value)}
                  className="font-body mt-1.5"
                />
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="w-full">
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Save"}
            </Button>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AdminLifestyleManager;
