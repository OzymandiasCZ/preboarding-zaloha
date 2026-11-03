// Čistá funkce bez závislostí (testovatelná přes `node --test`).
// Fail closed: když není nastaven ani seznam e-mailů, ani seznam domén, nepustí nikoho.

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function isEmailAllowed(
  email: string | null | undefined,
  allowedEmails: string | undefined,
  allowedDomains: string | undefined,
): boolean {
  const normalized = (email ?? "").trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return false;

  const emails = parseList(allowedEmails);
  const domains = parseList(allowedDomains);
  if (emails.length === 0 && domains.length === 0) return false;

  if (emails.includes(normalized)) return true;
  // Přesná shoda domény – subdomény (např. x.example.com) se nepočítají.
  return domains.includes(normalized.slice(at + 1));
}
