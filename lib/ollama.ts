import { buildResumePrompt } from "@/lib/prompt";
import { cleanCandidateJson, candidateSchema } from "@/lib/validator";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.5:9b";

const resumeJsonSchema = {
  type: "object",
  properties: {
    name: { type: ["string", "null"] },
    mobile: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    tenth: { type: ["string", "null"] },
    twelfth: { type: ["string", "null"] },
    diploma: { type: ["string", "null"] },
    graduation: { type: ["string", "null"] },
    postGraduation: { type: ["string", "null"] },
    btechScore: { type: ["string", "null"] },
    cgpa: { type: ["string", "null"] },
    percentage: { type: ["string", "null"] },
    jeeRank: { type: ["string", "null"] },
    jeePercentile: { type: ["string", "null"] },
    college: { type: ["string", "null"] },
    branch: { type: ["string", "null"] },
    graduationYear: { type: ["string", "null"] },
    comment: { type: "string" }
  },
  required: [
    "name",
    "mobile",
    "email",
    "tenth",
    "twelfth",
    "diploma",
    "graduation",
    "postGraduation",
    "btechScore",
    "cgpa",
    "percentage",
    "jeeRank",
    "jeePercentile",
    "college",
    "branch",
    "graduationYear",
    "comment"
  ],
  additionalProperties: false
};

function extractJson(raw: string): unknown {
  const withoutThinking = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim();

  try {
    return JSON.parse(withoutThinking);
  } catch {
    // Continue to balanced-object extraction below.
  }

  const start = withoutThinking.indexOf("{");
  if (start === -1) {
    throw new Error("Model did not return JSON.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let index = start; index < withoutThinking.length; index += 1) {
    const char = withoutThinking[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      end = index;
      break;
    }
  }

  if (start === -1 || end === -1) {
    throw new Error("Model did not return JSON.");
  }
  return JSON.parse(withoutThinking.slice(start, end + 1));
}

async function askOllama(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content: "You extract resume data. You only respond with a valid JSON object."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false,
      think: false,
      format: resumeJsonSchema,
      options: {
        temperature: 0.1,
        top_p: 0.9
      }
    })
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error("Cannot connect to Ollama. Please start the Ollama service.");
  }

  const data = await response.json() as { message?: { content?: string }, response?: string };
  return data.message?.content ?? data.response ?? "";
}

export async function extractWithOllama(resumeText: string) {
  let lastError: unknown;

  for (const strict of [false, true]) {
    try {
      const raw = await askOllama(buildResumePrompt(resumeText, strict));
      const json = extractJson(raw);
      const cleaned = cleanCandidateJson(json);
      return candidateSchema.parse(cleaned);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Ollama extraction timed out after 20 seconds.");
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to extract candidate JSON.");
}
