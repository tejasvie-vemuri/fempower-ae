import { LifeBuoy } from "lucide-react";
import { UAE_HELPLINES } from "@/lib/circle";

const CrisisBanner = () => (
  <div className="rounded-xl border border-blush-dark/30 bg-blush-light/40 p-4 md:p-5">
    <div className="flex items-start gap-3">
      <LifeBuoy className="text-blush-dark flex-shrink-0 mt-0.5" size={18} />
      <div>
        <p className="font-heading text-base text-foreground">If you're in immediate distress, you don't have to wait.</p>
        <p className="text-xs text-muted-foreground font-body mt-1">UAE support lines, free and confidential:</p>
        <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm font-body">
          {UAE_HELPLINES.map((h) => (
            <li key={h.name} className="text-foreground">
              <a href={h.href} className="font-medium hover:text-blush-dark">{h.value}</a>
              <span className="text-muted-foreground"> · {h.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default CrisisBanner;
