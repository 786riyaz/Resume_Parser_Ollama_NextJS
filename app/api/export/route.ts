import { NextRequest, NextResponse } from "next/server";
import { createCandidateWorkbook } from "@/lib/excel";
import { candidateArraySchema } from "@/lib/validator";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { candidates?: unknown };
    const candidates = candidateArraySchema.parse(body.candidates);
    const workbook = await createCandidateWorkbook(candidates);

    return new NextResponse(new Uint8Array(workbook), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=\"Candidates.xlsx\""
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export candidates.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
