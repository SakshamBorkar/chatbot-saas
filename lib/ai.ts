import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (openaiInstance) return openaiInstance;

  console.log("Runtime Environment Check:");
  console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY, "Length:", process.env.GROQ_API_KEY?.length ?? 0);
  console.log("OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY, "Length:", process.env.OPENAI_API_KEY?.length ?? 0);

  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined;

  openaiInstance = new OpenAI({
    apiKey: apiKey || "dummy-key",
    baseURL,
  });

  return openaiInstance;
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

  const openai = getOpenAIClient();
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
