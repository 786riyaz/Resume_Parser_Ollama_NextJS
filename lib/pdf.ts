import pdfParse from "pdf-parse";

export async function extractPdfText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  return parsed.text.replace(/\s{3,}/g, "\n\n").trim();
}

