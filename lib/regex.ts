export function extractEmail(text: string): string | null {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? null;
}

export function extractPhone(text: string): string | null {
  const match = text.match(/(?:\+?91[-.\s]?)?(?:\(?\d{3,5}\)?[-.\s]?)?\d{5}[-.\s]?\d{5}/);
  return match?.[0]?.replace(/\s+/g, " ").trim() ?? null;
}

