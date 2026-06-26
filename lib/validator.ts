import { z } from "zod";

const nullableText = z.string().nullable();

export const candidateSchema = z.object({
  id: z.string().optional(),
  fileName: z.string().optional(),
  name: nullableText,
  mobile: nullableText,
  email: nullableText,
  tenth: nullableText,
  twelfth: nullableText,
  diploma: nullableText,
  graduation: nullableText,
  postGraduation: nullableText,
  btechScore: nullableText,
  cgpa: nullableText,
  percentage: nullableText,
  jeeRank: nullableText,
  jeePercentile: nullableText,
  college: nullableText,
  branch: nullableText,
  graduationYear: nullableText,
  comment: z.string().min(1)
});

export const candidateArraySchema = z.array(candidateSchema.extend({
  id: z.string(),
  fileName: z.string()
}));

export function normalizeNullable(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/^["']|["']$/g, "").trim();
  if (!text || ["n/a", "na", "none", "null", "-"].includes(text.toLowerCase())) return null;
  return text;
}

function normalizeEmail(value: unknown): string | null {
  const text = normalizeNullable(value)?.replace(/[),.;:]+$/g, "") ?? null;
  if (!text) return null;
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(text) ? text : null;
}

export function cleanCandidateJson(input: unknown) {
  const record = input && typeof input === "object" ? input as Record<string, unknown> : {};

  return {
    name: normalizeNullable(record.name),
    mobile: normalizeNullable(record.mobile ?? record.phone),
    email: normalizeEmail(record.email),
    tenth: normalizeNullable(record.tenth ?? record["10th"]),
    twelfth: normalizeNullable(record.twelfth ?? record["12th"]),
    diploma: normalizeNullable(record.diploma),
    graduation: normalizeNullable(record.graduation),
    postGraduation: normalizeNullable(record.postGraduation ?? record.post_graduation),
    btechScore: normalizeNullable(record.btechScore ?? record.btech ?? record["B.Tech Score"]),
    cgpa: normalizeNullable(record.cgpa),
    percentage: normalizeNullable(record.percentage),
    jeeRank: normalizeNullable(record.jeeRank ?? record.jee_rank),
    jeePercentile: normalizeNullable(record.jeePercentile ?? record.jee_percentile),
    college: normalizeNullable(record.college),
    branch: normalizeNullable(record.branch),
    graduationYear: normalizeNullable(record.graduationYear ?? record.graduation_year),
    comment: normalizeNullable(record.comment) ?? "Review required."
  };
}
