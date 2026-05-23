import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRIES, LOOKING_FOR_OPTIONS } from "@/lib/memberProfile";
import type { DirectoryFilters } from "@/hooks/useDirectory";

interface Props {
  filters: DirectoryFilters;
  onChange: (next: DirectoryFilters) => void;
  cities: string[];
}

const ANY = "__any__";

export const DirectoryFiltersBar = ({ filters, onChange, cities }: Props) => {
  const reset = () =>
    onChange({ search: "", industry: null, city: null, lookingFor: null });
  const hasFilter = filters.search || filters.industry || filters.city || filters.lookingFor;

  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
      <div className="relative flex-1 min-w-0">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder="Search by name, role, company…"
          className="pl-9"
        />
      </div>
      <div className="grid grid-cols-3 gap-2 md:flex">
        <Select value={filters.industry ?? ANY} onValueChange={v => onChange({ ...filters, industry: v === ANY ? null : v })}>
          <SelectTrigger className="md:w-40"><SelectValue placeholder="Industry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All industries</SelectItem>
            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.city ?? ANY} onValueChange={v => onChange({ ...filters, city: v === ANY ? null : v })}>
          <SelectTrigger className="md:w-36"><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>All cities</SelectItem>
            {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.lookingFor ?? ANY} onValueChange={v => onChange({ ...filters, lookingFor: v === ANY ? null : v })}>
          <SelectTrigger className="md:w-44"><SelectValue placeholder="Open to" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Anything</SelectItem>
            {LOOKING_FOR_OPTIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={reset}><X size={14} className="mr-1" />Clear</Button>
      )}
    </div>
  );
};
