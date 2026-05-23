// Guests helpers for "bring a friend" bookings.
export const MAX_QUANTITY = 4;

export interface Guest {
  name: string;
  email?: string;
}

export function parseGuests(value: unknown): Guest[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((g): Guest | null => {
      if (!g || typeof g !== "object") return null;
      const o = g as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name.trim() : "";
      if (!name) return null;
      const email = typeof o.email === "string" ? o.email.trim() : "";
      return email ? { name, email } : { name };
    })
    .filter((g): g is Guest => g !== null);
}

export function sanitizeGuests(quantity: number, guests: Guest[]): Guest[] {
  const slots = Math.max(0, Math.min(MAX_QUANTITY, quantity) - 1);
  const out: Guest[] = [];
  for (let i = 0; i < slots; i++) {
    const g = guests[i] ?? { name: "" };
    const name = (g.name ?? "").trim().slice(0, 120);
    const email = (g.email ?? "").trim().slice(0, 200);
    out.push(email ? { name, email } : { name });
  }
  return out;
}

export function validateGuests(quantity: number, guests: Guest[]): string | null {
  if (quantity < 1 || quantity > MAX_QUANTITY) return "Invalid quantity";
  const expected = quantity - 1;
  if (guests.length !== expected) return "Please add a name for each guest";
  for (let i = 0; i < expected; i++) {
    const g = guests[i];
    if (!g?.name?.trim()) return `Guest ${i + 1}: name is required`;
    if (g.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email)) {
      return `Guest ${i + 1}: invalid email`;
    }
  }
  return null;
}
