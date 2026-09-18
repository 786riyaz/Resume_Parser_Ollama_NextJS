import { buildResumePrompt } from "@/lib/prompt";
import { cleanCandidateJson, candidateSchema } from "@/lib/validator";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.5:9b";
console.log("Ollama URL & Model ::", OLLAMA_BASE_URL, "|||||", OLLAMA_MODEL);
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
        comment: { type: "string" },
        location: { type: "string" },
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
        "comment",
        "location",
    ],
    additionalProperties: false,
};
/**
 * Extract JSON from Ollama response.
 *
 * Handles:
 * 1. Normal JSON
 * 2. Markdown JSON blocks
 * 3. <think>...</think> blocks
 * 4. JSON embedded inside additional text
 */
function extractJson(raw: string): unknown {
    const withoutThinking = raw
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/```(?:json)?/gi, "")
        .replace(/```/g, "")
        .trim();
    // --------------------------------------------------
    // Try direct JSON parsing first
    // --------------------------------------------------
    try {
        return JSON.parse(withoutThinking);
    } catch {
        // Continue with balanced-object extraction.
    }
    // --------------------------------------------------
    // Find first JSON object
    // --------------------------------------------------
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
        // Handle escaped characters inside strings
        if (escaped) {
            escaped = false;
            continue;
        }
        if (char === "\\") {
            escaped = true;
            continue;
        }
        // Handle string boundaries
        if (char === "\"") {
            inString = !inString;
            continue;
        }
        // Ignore brackets inside strings
        if (inString) {
            continue;
        }
        if (char === "{") {
            depth += 1;
        }
        if (char === "}") {
            depth -= 1;
        }
        if (depth === 0) {
            end = index;
            break;
        }
    }
    if (end === -1) {
        throw new Error("Model returned incomplete JSON.");
    }
    const jsonText = withoutThinking.slice(start, end + 1);
    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Invalid JSON returned by Ollama:");
        console.error(jsonText);
        throw new Error(
            `Ollama returned invalid JSON: ${error instanceof Error
                ? error.message
                : "Unknown JSON error"
            }`
        );
    }
}

/**
 * Send a prompt to Ollama.
 */
async function askOllama(prompt: string): Promise<string> {
    const controller = new AbortController();
    // 120 seconds = 2 minutes
    const timeout = setTimeout(() => {
        controller.abort();
    }, 120_000);
    const endpoint = `${OLLAMA_BASE_URL}/api/chat`;
    console.log("Calling Ollama ::", endpoint);
    console.log("Model ::", OLLAMA_MODEL);
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [
                    {
                        role: "system",
                        content:
                            "You extract resume data. " +
                            "You only respond with a valid JSON object.",
                    },
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                stream: false,
                think: false,
                format: resumeJsonSchema,
                options: {
                    temperature: 0.1,
                    top_p: 0.9,
                },
            }),
        });
        // --------------------------------------------------
        // Handle HTTP errors
        // --------------------------------------------------
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Ollama HTTP Error:");
            console.error("Status:", response.status);
            console.error("Status Text:", response.statusText);
            console.error("Response:", errorBody);
            throw new Error(
                `Ollama request failed: ${response.status} ${response.statusText}`
            );
        }
        // --------------------------------------------------
        // Parse response
        // --------------------------------------------------
        const data = (await response.json()) as {
            message?: {
                content?: string;
            };
            response?: string;
        };
        const content =
            data.message?.content ??
            data.response ??
            "";
        if (!content) {
            throw new Error(
                "Ollama returned an empty response."
            );
        }
        return content;
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error(
                "Ollama extraction timed out after 120 seconds."
            );
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}
/**
 * Extract candidate information from resume text.
 */
export async function extractWithOllama(resumeText: string) {
    let lastError: unknown;
    // First try normal prompt
    // Then retry using strict prompt
    for (const strict of [false, true]) {
        try {
            console.log(
                `Ollama extraction attempt. strict=${strict}`
            );
            const prompt = buildResumePrompt(
                resumeText,
                strict
            );
            const raw = await askOllama(prompt);
            console.log("Ollama response received.");
            console.log("AI Response :: ", raw);
            console.log("=====================================================");
            const json = extractJson(raw);
            const cleaned = cleanCandidateJson(json);
            return candidateSchema.parse(cleaned);
        } catch (error) {
            console.error(`Ollama extraction failed. strict=${strict}`, error);
            lastError = error;
        }
    }
    throw (lastError instanceof Error ? lastError : new Error("Unable to extract candidate JSON.")
    );
}
