/**
 * Member-facing analytics switch, rendered on the Privacy page.
 *
 * PDPL gives people the right to object to processing, and the privacy policy
 * promises this control exists — so it has to be real, not decorative. The
 * preference is stored per browser in localStorage and read on every tracking
 * call, so flipping it takes effect immediately.
 */

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { hasOptedOutOfTracking, setTrackingOptOut } from "@/lib/analytics";

const AnalyticsOptOutToggle = () => {
  // Read on the client only — /privacy is prerendered, where there is no
  // localStorage to read from.
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEnabled(!hasOptedOutOfTracking());
    setReady(true);
  }, []);

  const onChange = (next: boolean) => {
    setEnabled(next);
    setTrackingOptOut(!next);
  };

  return (
    <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div>
        <Label htmlFor="analytics-opt-out" className="font-body text-sm font-medium text-foreground">
          Allow analytics on this browser
        </Label>
        <p className="mt-1 text-sm text-muted-foreground font-body">
          {ready && !enabled
            ? "Analytics and session replay are off for this browser."
            : "Helps us find broken and confusing parts of the site."}
        </p>
      </div>
      <Switch
        id="analytics-opt-out"
        checked={enabled}
        onCheckedChange={onChange}
        disabled={!ready}
        aria-label="Allow analytics on this browser"
      />
    </div>
  );
};

export default AnalyticsOptOutToggle;
