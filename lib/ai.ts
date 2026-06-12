import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;
let llmInstance: OpenAI | null = null;

// Groq uses the OpenAI-compatible SDK — just swap the baseURL and key
export const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy-key",
  baseURL: "https://api.groq.com/openai/v1",
});

export function getOpenAIClient(): OpenAI {
  if (openaiInstance) return openaiInstance;

  console.log("Runtime Environment Check:");
  console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY, "Length:", process.env.OPENAI_API_KEY?.length ?? 0);

  openaiInstance = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy-key",
  });

  return openaiInstance;
}

export function getLLMClient(): OpenAI {
  if (llmInstance) return llmInstance;

  console.log("LLM Environment Check:");
  console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY, "Length:", process.env.GROQ_API_KEY?.length ?? 0);

  if (process.env.GROQ_API_KEY) {
    llmInstance = groq;
  } else {
    llmInstance = getOpenAIClient();
  }

  return llmInstance;
}

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/**
 * Stream a chat completion from OpenAI/Groq.
 * Returns a ReadableStream compatible with Next.js Response.
 */
export async function streamChatCompletion(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<ReadableStream> {
  const allMessages: ChatMessage[] = systemPrompt
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  const model = process.env.GROQ_API_KEY
    ? (process.env.GROQ_MODEL || "llama-3.3-70b-versatile")
    : "gpt-4o-mini";

  const openai = getLLMClient();
  const stream = await openai.chat.completions.create({
    model,
    messages: allMessages,
    stream: true,
    max_tokens: 1024,
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) {
          // Stream as SSE data
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
    cancel() {
      stream.controller.abort();
    },
  });
}

/**
 * Rate limiter — simple in-memory store.
 * For production, replace with Redis or Upstash.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit = 50,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return { allowed: entry.count <= limit, remaining };
}
