# Embeddable Chatbot SaaS

Turn your Next.js chatbot into an embeddable SaaS widget with a single `<script>` tag.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, OPENAI_API_KEY, NEXT_PUBLIC_BASE_URL
```

### 3. Set up the database

```bash
npm run db:generate   # generate Prisma client
npm run db:push       # push schema to DB
npm run db:seed       # seed demo bots
```

### 4. Run locally

```bash
npm run dev
```

### 5. Embed on any website

```html
<script
  src="https://your-chatbot.vercel.app/widget.js"
  data-bot-id="your-bot-id"
  async>
</script>
```

---

## Widget Options

| Attribute           | Description                        | Default         |
|---------------------|------------------------------------|-----------------|
| `data-bot-id`       | **Required.** Your bot identifier  | —               |
| `data-primary-color`| Hex color for header & bubbles     | Bot config      |
| `data-position`     | `"bottom-right"` or `"bottom-left"`| `"bottom-right"`|

---

## Project Structure

```
├── app/
│   ├── page.tsx                  # Landing / demo page
│   ├── chat/page.tsx             # Full-page chat
│   ├── embed/page.tsx            # iframe-safe embed page
│   └── api/
│       ├── chat/route.ts         # Streaming chat endpoint
│       ├── bot/[botId]/route.ts  # Bot config endpoint
│       └── analytics/route.ts   # Analytics tracking
│
├── components/
│   ├── Chatbot.tsx               # Main chat UI
│   ├── Message.tsx               # Individual message bubble
│   └── WidgetLauncher.tsx        # Floating button + window
│
├── lib/
│   ├── ai.ts                     # OpenAI streaming + rate limiting
│   ├── analytics.ts              # Event tracking helpers
│   ├── bots.ts                   # Bot config CRUD
│   ├── db.ts                     # Prisma singleton
│   └── rate-limit.ts             # IP extraction
│
├── public/
│   └── widget.js                 # The embeddable loader script
│
└── prisma/
    ├── schema.prisma             # Database schema
    └── seed.ts                   # Demo data
```

---

## API Reference

### `GET /api/bot/:botId`
Returns bot configuration. Called by `widget.js` on load.

### `POST /api/chat`
Streams AI responses via SSE. Body:
```json
{
  "botId": "school001",
  "sessionId": "uuid",
  "messages": [{ "role": "user", "content": "Hello!" }]
}
```

### `POST /api/analytics`
Tracks widget events (`widget_loaded`, `widget_opened`, `message_sent`, `message_received`).

### `GET /api/analytics?botId=xxx`
Returns event summary counts for a bot.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import into Vercel
3. Add environment variables in Vercel dashboard
4. Deploy — done ✅

---

## Security

- **Bot validation** — every request checks the bot exists and is active
- **Rate limiting** — `/api/chat` is limited to 50 requests/min per IP (in-memory; swap for Redis/Upstash in production)
- **CORS** — all API routes and `widget.js` allow cross-origin requests so the widget works on any domain
- **iframe sandboxing** — the widget iframe uses `sandbox="allow-scripts allow-same-origin allow-forms"`
- **No key exposure** — OpenAI keys and DB credentials stay server-side only

---

## Future Enhancements

- Customer dashboard (snippet generator, usage stats)
- Custom branding / logos
- Usage-based billing (Free / Starter / Pro / Enterprise)
- Redis-backed rate limiting for multi-instance deployments
