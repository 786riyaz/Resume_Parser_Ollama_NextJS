import { extractEmail, extractPhone } from "@/lib/regex";
import type { Candidate } from "@/lib/types";

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
    if (match?.[0]) return match[0].trim();
  }
  return null;
}

function guessName(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 3 && line.length <= 60);

  const badWords = /(resume|curriculum|vitae|email|phone|mobile|address|linkedin|github|education|skills|experience)/i;
  const nameLine = lines.find((line) => /^[A-Za-z][A-Za-z .'-]+$/.test(line) && !badWords.test(line));
  return nameLine ?? null;
}

function cleanLine(value: string | null): string | null {
  return value
    ?.replace(/\s+/g, " ")
    .replace(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+20\d{2}\b.*$/i, "")
    .replace(/20\d{2}\s*[-–]\s*20\d{2}.*$/i, "")
    .replace(/CGPA\s*[:\-]?\s*[0-9.\/]+.*$/i, "")
    .replace(/Percentage\s*[:\-]?\s*[0-9.]+\s*%?.*$/i, "")
    .replace(/,\s*B\.?\s?Tech.*$/i, "")
    .replace(/[|•]+$/g, "")
    .trim() || null;
}

function guessCollege(text: string): string | null {
  return cleanLine(firstMatch(text, [
    /Education\s*\n\s*([^\n]*(?:University|Institute|College|IIIT|IIT|NIT|School)[^\n]*)/i,
    /^([^\n]*(?:University|Institute|College|IIIT|IIT|NIT)[^\n]*)$/im,
    /^([^\n]*School[^\n]*)$/im
  ]));
}

function guessBranch(text: string): string | null {
  const branch = cleanLine(firstMatch(text, [
    /\bB\.?\s?Tech\s*(?:in|\()?\s*([A-Za-z &().-]*(?:Computer|Data|Information|Electronics|Mechanical|Civil|Engineering)[A-Za-z &().-]*)/i,
    /\bComputer Science\s*(?:&|and)?\s*[A-Za-z &().-]*/i
  ]));

  if (!branch) return null;
  return branch.includes("(") ? branch : branch.replace(/\)+$/g, "").trim();
}

export function buildFallbackCandidate(fileName: string, text: string, aiError?: string): Candidate {
  const email = extractEmail(text);
  const mobile = extractPhone(text);
  const cgpa = firstMatch(text, [
    /(?:CGPA|GPA)\s*[:\-]?\s*([0-9](?:\.[0-9]{1,2})?(?:\/10(?:\.0)?)?)/i,
    /\b([0-9](?:\.[0-9]{1,2})?\/10\s*CGPA)\b/i
  ]);
  const tenth = firstMatch(text, [/\b(?:10th|X|SSC)\b[^0-9%]{0,30}([0-9]{2,3}(?:\.[0-9]+)?\s*%?)/i]);
  const twelfth = firstMatch(text, [
    /Percentage\s*[:\-]?\s*([0-9]{2,3}(?:\.[0-9]+)?\s*%?)\s*(?:\n|.){0,80}?Class\s*12th/i,
    /Class\s*12th[\s\S]{0,120}?Percentage\s*[:\-]?\s*([0-9]{2,3}(?:\.[0-9]+)?\s*%?)/i,
    /Intermediate[\s\S]{0,120}?Percentage\s*[:\-]?\s*([0-9]{2,3}(?:\.[0-9]+)?\s*(?:%|percent)?)/i,
    /\b(?:12th|XII|HSC)\b[^%\n]{0,80}([0-9]{2,3}(?:\.[0-9]+)?\s*(?:%|percent))/i
  ]);
  const jeeRank = firstMatch(text, [
    /\bJEE\b[^.\n]{0,60}\b(?:AIR|Rank)\b[^0-9]{0,15}([0-9,]+)/i,
    /\brank\s+of\s+([0-9,]+)\s+in\s+JEE\b/i
  ]);
  const jeePercentile = firstMatch(text, [
    /\bJEE\b[^.\n]{0,60}\bPercentile\b[^0-9]{0,15}([0-9]{1,3}(?:\.[0-9]+)?)/i,
    /\bJEE\b[^.\n]{0,80}?([0-9]{1,3}(?:\.[0-9]+)?)\s*percentile/i,
    /([0-9]{1,3}(?:\.[0-9]+)?)\s*percentile\s*in\s*JEE/i
  ]);
  const graduationYear = firstMatch(text, [
    /20[0-9]{2}\s*[-–]\s*(20[0-9]{2})/i,
    /20[0-9]{2}\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(20[0-9]{2})/i,
    /\b(?:B\.?\s?Tech|Bachelor|Graduation)\b[^.\n]{0,120}\b(?:May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(20[0-9]{2})\b/i
  ]);
  const branch = guessBranch(text);
  const college = guessCollege(text);

  return {
    id: crypto.randomUUID(),
    fileName,
    name: guessName(text),
    mobile,
    email,
    tenth,
    twelfth,
    diploma: null,
    graduation: null,
    postGraduation: null,
    btechScore: cgpa,
    cgpa,
    percentage: null,
    jeeRank,
    jeePercentile,
    college,
    branch,
    graduationYear,
    comment: aiError ? `AI extraction needs review: ${aiError}` : "Regex fallback extraction. Review required."
  };
}

export function mergeWithFallback(fileName: string, text: string, candidate: Omit<Candidate, "id" | "fileName">): Candidate {
  const fallback = buildFallbackCandidate(fileName, text);

  return {
    ...fallback,
    ...candidate,
    id: crypto.randomUUID(),
    fileName,
    name: candidate.name ?? fallback.name,
    mobile: candidate.mobile ?? fallback.mobile,
    email: candidate.email ?? fallback.email,
    tenth: candidate.tenth ?? fallback.tenth,
    twelfth: candidate.twelfth ?? fallback.twelfth,
    btechScore: candidate.btechScore ?? fallback.btechScore,
    cgpa: candidate.cgpa ?? fallback.cgpa,
    jeeRank: candidate.jeeRank ?? fallback.jeeRank,
    jeePercentile: candidate.jeePercentile ?? fallback.jeePercentile,
    college: candidate.college ?? fallback.college,
    branch: candidate.branch ?? fallback.branch,
    graduationYear: candidate.graduationYear ?? fallback.graduationYear,
    comment: candidate.comment || fallback.comment
  };
}
