/**
 * Dynamic Industry Persona Generator
 *
 * Instead of maintaining a hardcoded prompt per industry, this module asks
 * Groq to generate a precise, industry-scoped behavioral prompt on the fly.
 *
 * The generated prompt is then injected into the RAG system prompt so the
 * bot behaves as a specialist for that exact industry — and refuses to answer
 * anything outside it.
 *
 * Caching strategy:
 *   Generated prompts are cached in-memory keyed by industry.
 *   This means Groq is called only ONCE per industry per server process
 *   lifetime (or on first use after a cold start), not on every chat message.
 */

import { groq } from "./ai";
import { getIndustryLabel } from "./industries";

// ── In-memory cache ───────────────────────────────────────────────────────────

const personaCache = new Map<string, string>();

// ── Prompt that instructs Groq to write the industry persona ─────────────────

function buildGeneratorPrompt(industry: string, industryLabel: string): string {
    return `You are an expert AI prompt engineer. Your task is to write a strict behavioral persona for a website chatbot assistant.

The chatbot belongs to a company in the "${industryLabel}" industry (industry key: "${industry}").

Write a precise, structured persona prompt that:

1. Clearly defines what topics the bot IS allowed to discuss (specific to "${industryLabel}" — be concrete, list real topic categories for this industry)
2. Clearly defines what topics the bot must REFUSE (anything outside "${industryLabel}")
3. Sets the correct professional tone for "${industryLabel}" visitors
4. Includes the EXACT refusal message the bot must say word-for-word when asked something outside scope:
   "I'm sorry, but answering this question is outside my scope. I can only help with questions related to ${industryLabel}. Please ask something specific to that domain."
5. Includes any critical legal/ethical guardrails specific to "${industryLabel}" (e.g. pharma bots must not give medical advice, finance bots must not give investment advice)

FORMAT RULES — very important:
- Output ONLY the persona prompt text itself. No preamble, no explanation, no markdown headings, no "Here is the prompt:" prefix.
- Write in second person ("You are...", "You must...", "You help...")
- Be specific and strict. Vague instructions will be ignored.
- Length: 150–250 words maximum. Dense and precise.`;
}

// ── Core generator function ───────────────────────────────────────────────────

/**
 * Generate (or return cached) an industry-specific behavioral persona prompt.
 *
 * @param industry  The industry key from the database (e.g. "education")
 * @returns         A strict persona prompt string ready to embed in the system prompt
 */

export async function generateIndustryPersona(industry: string): Promise<string> {
    // Return cached version if available 
    const cached = personaCache.get(industry);
    if (cached) {
        return cached;
    }

    const industryLabel = getIndustryLabel(industry);

    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: buildGeneratorPrompt(industry, industryLabel),
                },
            ],
            temperature: 0.4,
            max_tokens: 400,
            stream: false,
        });

        const generated = response.choices[0]?.message?.content?.trim();

        if (!generated || generated.length < 50) {
            console.warn(`[persona-generator] Groq returned empty/short persona for "${industry}", using fallback`);
            const fallback = buildFallbackPersona(industry, industryLabel);
            personaCache.set(industry, fallback);
            return fallback;
        }

        console.log(`[persona-generator] Persona generated successfully for industry="${industry}"`);
        personaCache.set(industry, generated);
        return generated;

    } catch (err) {
        console.error(`[persona-generator] Groq call failed for industry="${industry}":`, err);
        // On error use a safe fallback so that chat still works
        const fallback = buildFallbackPersona(industry, industryLabel);
        personaCache.set(industry, fallback);
        return fallback;
    }
}

/**
 * Minimal safe fallback persona. Used only if the Groq generation call fails.
 * Keeps the bot functional without exposing errors to the end user.
 */
function buildFallbackPersona(industry: string, industryLabel: string): string {
    return `You are a professional website assistant for a company in the ${industryLabel} industry.

You help visitors with questions that are directly related to ${industryLabel} topics and the content of this website.

You must REFUSE any question that is not related to ${industryLabel} or this website's content. When refusing, say exactly:
"I'm sorry, but answering this question is outside my scope. I can only help with questions related to ${industryLabel}. Please ask something specific to that domain."

Stay professional, concise, and factual. Only use information from the website context provided to you. Never speculate or use outside knowledge.`;
}

// ── Cache management (for testing/admin use) ──────────────────────────────────
/**
 * Clear the persona cache for a specific industry or all industries.
 * Useful if you want to force regeneration (e.g. after updating the generator prompt).
 */
export function clearPersonaCache(industry?: string): void {
    if (industry) {
        personaCache.delete(industry);
        console.log(`[persona-generator] Cache cleared for industry = "${industry}"`);
    } else {
        personaCache.clear();
        console.log(`[persona-generator] Full persona cache cleared`);
    }
}

/**
 * Return a snapshot of what's currently cached.
 * Used by the debug endpoint.
 */
export function getPersonaCacheSnapshot(): Record<string, { length: number; preview: string }> {
    const snapshot: Record<string, { length: number; preview: string }> = {};
    for (const [key, value] of personaCache.entries()) {
        snapshot[key] = {
            length: value.length,
            preview: value.slice(0, 120) + "...",
        };
    }
    return snapshot;
}








