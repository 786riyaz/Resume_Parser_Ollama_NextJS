function buildResumeContext(resumeText: string): string {
  const normalized = resumeText.replace(/\s{3,}/g, "\n").trim();
  const lines = normalized.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const importantLines = lines.filter((line) =>
    /(education|b\.?\s?tech|bachelor|graduation|cgpa|gpa|percentage|percentile|jee|rank|college|university|institute|school|class 10|class 12|10th|12th|xii|ssc|hsc|email|mobile|phone|\+91)/i.test(line)
  );

  const context = [
    lines.slice(0, 80).join("\n"),
    importantLines.slice(0, 80).join("\n"),
    lines.slice(-25).join("\n")
  ].join("\n");

  return context.slice(0, 9000);
}

export function buildResumePrompt(resumeText: string, strict = false): string {
  const strictNote = strict
    ? "Your previous answer was invalid. Return a single valid JSON object only."
    : "Return a single valid JSON object only.";

  return `${strictNote}

You are an HR resume extraction system. Extract only facts explicitly present in the resume. Never guess. If a value is missing, use null.
Do not include markdown, thinking text, XML tags, explanations, or extra keys.

Use this exact JSON shape:
{
  "name": null,
  "mobile": null,
  "email": null,
  "tenth": null,
  "twelfth": null,
  "diploma": null,
  "graduation": null,
  "postGraduation": null,
  "btechScore": null,
  "cgpa": null,
  "percentage": null,
  "jeeRank": null,
  "jeePercentile": null,
  "college": null,
  "branch": null,
  "graduationYear": null,
  "comment": "Review required."
}

Comment should be a short HR-friendly summary of the academic profile. If important fields are missing, mention that manual review is needed.

Resume text:
"""${buildResumeContext(resumeText)}"""`;
}
