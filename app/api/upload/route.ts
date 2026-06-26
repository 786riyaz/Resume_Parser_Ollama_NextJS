import { NextRequest, NextResponse } from "next/server";
import { buildFallbackCandidate, mergeWithFallback } from "@/lib/fallback";
import { extractWithOllama } from "@/lib/ollama";
import { extractPdfText } from "@/lib/pdf";
import { extractEmail, extractPhone } from "@/lib/regex";
import type { Candidate, UploadResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File);
  const result: UploadResult = { candidates: [], errors: [] };

  if (!files.length) {
    return NextResponse.json({ error: "Please upload at least one PDF resume." }, { status: 400 });
  }

  for (const file of files) {
    try {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("Only PDF files are supported.");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Resume is larger than 10 MB.");
      }

      const text = await extractPdfText(file);
      if (!text || text.length < 40) {
        throw new Error("Unable to parse Resume. The PDF may be scanned or empty.");
      }

      let candidate: Candidate;

      try {
        const extracted = await extractWithOllama(text);
        candidate = mergeWithFallback(file.name, text, {
          ...extracted,
          email: extracted.email ?? extractEmail(text),
          mobile: extracted.mobile ?? extractPhone(text)
        });
      } catch (aiError) {
        const message = aiError instanceof Error ? aiError.message : "AI extraction failed.";
        candidate = buildFallbackCandidate(file.name, text, message);
        result.errors.push({
          fileName: file.name,
          message: `${message} Added regex fallback row for manual review.`
        });
      }

      result.candidates.push(candidate);
    } catch (error) {
      result.errors.push({
        fileName: file.name,
        message: error instanceof Error ? error.message : "Unable to parse Resume."
      });
    }
  }

  return NextResponse.json(result);
}
