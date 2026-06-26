import { NextRequest, NextResponse } from "next/server";
import { buildFallbackCandidate, mergeWithFallback } from "@/lib/fallback";
import { extractWithOllama } from "@/lib/ollama";
import { extractEmail, extractPhone } from "@/lib/regex";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { text?: string };
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
    }

    try {
      const extracted = await extractWithOllama(text);
      const email = extracted.email ?? extractEmail(text);
      const mobile = extracted.mobile ?? extractPhone(text);

      return NextResponse.json({ candidate: mergeWithFallback("resume-text", text, { ...extracted, email, mobile }) });
    } catch (aiError) {
      const message = aiError instanceof Error ? aiError.message : "AI extraction failed.";
      return NextResponse.json({
        candidate: buildFallbackCandidate("resume-text", text, message),
        warning: `${message} Added regex fallback row for manual review.`
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to extract resume details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
