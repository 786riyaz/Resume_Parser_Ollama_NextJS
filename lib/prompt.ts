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
    ? "Your previous response was invalid. Return ONLY a single valid JSON object."
    : "Return ONLY a single valid JSON object.";

  return `${strictNote}

You are an expert HR Resume Parser.

Your job is to extract ONLY information that is explicitly present in the resume.
Never infer, estimate, calculate, or guess any value.

If a field is missing, unavailable, or cannot be confidently extracted, return null.

Do NOT return:
- Markdown
- XML
- HTML
- Explanations
- Thinking process
- Notes outside JSON
- Additional keys

Return ONLY this exact JSON structure:

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

=========================
FORMATTING RULES
=========================

Return every extracted value in a clean, professional, HR-friendly format suitable for storing directly in Excel.

1. Candidate Name
- Convert to Proper Title Case (Camel Case).
- Examples:
  - "JOHN DOE" → "John Doe"
  - "riYAz khAn" → "Riyaz Khan"

2. Mobile Number
- Always format as:
  +XX XXXXX XXXXX
- Examples:
  +91 98765 43210
  +44 77000 12345
- Preserve the country code if available.
- If country code is missing, do NOT invent one.
- Format only the available number cleanly.
- If multiple numbers exist, return the primary contact number.

3. Email
- Convert to lowercase.
- Remove accidental spaces.

Example:
JOHN.DOE @GMAIL.COM
→
john.doe@gmail.com

4. Percentages
Every percentage value must include the "%" symbol.

Examples:
90
→ 90%

88.5
→ 88.5%

99percent
→ 99%

Top 1%
→ Top 1%

5. CGPA / GPA / B.Tech Score
Always preserve the score scale exactly as written.

Examples:
8.8
(out of 10)
→ 8.8/10

9.12 CGPA
→ 9.12/10

7.5 GPA
→ 7.5/10

If the denominator is explicitly mentioned as 4, return:
3.75/4

Never assume the denominator if it cannot be determined.

6. Academic Scores
Return them exactly as shown but properly formatted.

Examples:
84percent
→ 84%

92 %
→ 92%

8.8 /10
→ 8.8/10

7. College Name
Expand obvious abbreviations if they are explicitly present.

Example:
L.D. College Of Engg.
→ L.D. College of Engineering

Otherwise preserve the official name.

8. Branch
Return a properly formatted branch name.

Examples:
computer engineering
→ Computer Engineering

information technology
→ Information Technology

B.E COMPUTER
→ Computer Engineering

9. Graduation Year
Return only the four-digit year.

Examples:
Graduated in 2023
→ 2023

Passing Year : 2024
→ 2024

10. JEE Rank
Remove commas and unnecessary spaces.

Examples:
12,345
→ 12345

AIR 1523
→ AIR 1523

11. JEE Percentile
Always include the "%" sign.

Examples:
99.82
→ 99.82%

98 percentile
→ 98%

12. General Text Cleaning
Correct:
- Extra spaces
- Multiple spaces
- Wrong capitalization
- Inconsistent punctuation
- OCR spacing issues

Examples:
Computer   Engineering
→ Computer Engineering

gujarat technological university
→ Gujarat Technological University

13. Null Values
If a value is not explicitly present in the resume, return:
null

Never guess.

=========================
COMMENT
=========================

The "comment" field should contain a concise HR-friendly academic summary.

Examples:
"Strong academic profile with 8.82/10 CGPA and 92% in Class 12."

"Average academic profile. Manual review required due to missing graduation score."

"Good academic record. JEE Percentile 98.73%. Graduation details available."

If important academic information is missing, clearly mention:
"Manual review required due to missing academic information."

=========================
FINAL RULES
=========================

- Return ONLY valid JSON.
- Do NOT add any extra keys.
- Do NOT omit any key.
- Every value must be clean, human-readable, and consistently formatted.
- The JSON must be directly suitable for exporting into Excel without any additional processing.

Resume Text:

"""${buildResumeContext(resumeText)}"""`;
}