/**
 * Website Crawler
 * Discovers pages from a root URL, follows internal links,
 * extracts clean text, and returns structured page content.
 */

export type CrawledPage = {
  url: string;
  content: string;
};

const MAX_PAGES = 50;
const FETCH_TIMEOUT_MS = 8000;

/** Tags whose inner content we discard entirely */
const STRIP_TAGS = [
  "script", "style", "noscript", "nav", "footer", "header",
  "aside", "iframe", "svg", "form", "button",
];

/**
 * Extract visible text from raw HTML, removing boilerplate.
 */
export function extractText(html: string): string {
  let clean = html;

  // Remove strip-tag blocks entirely (including content)
  for (const tag of STRIP_TAGS) {
    clean = clean.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
  }

  // Remove all remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  clean = clean
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

/**
 * Resolve and normalise a URL relative to a base,
 * returning null if it's external or not crawlable.
 */
function resolveInternal(base: URL, currentUrl: URL, href: string): string | null {
  try {
    const resolved = new URL(href, currentUrl);
    // Only same origin
    if (resolved.origin !== base.origin) return null;
    // Skip anchors, mailto, tel
    if (["mailto:", "tel:", "javascript:"].includes(resolved.protocol)) return null;
    // Drop hash and query for deduplication
    resolved.hash = "";
    return resolved.href;
  } catch {
    return null;
  }
}

/**
 * Extract all <a href="..."> links from HTML.
 */
function extractLinks(html: string, base: URL, currentUrl: URL): string[] {
  const links: string[] = [];
  const re = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const resolved = resolveInternal(base, currentUrl, match[1]);
    if (resolved) links.push(resolved);
  }
  return links;
}

/**
 * Crawl a website starting from rootUrl.
 * Returns up to MAX_PAGES pages with extracted text.
 */
export async function crawlWebsite(rootUrl: string): Promise<CrawledPage[]> {
  const base = new URL(rootUrl);
  const visited = new Set<string>();
  const queue: string[] = [base.href];
  const pages: CrawledPage[] = [];

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "ChatbotCrawler/1.0 (knowledge-base-builder)" },
      });
      clearTimeout(timer);

      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) continue;

      const html = await res.text();
      const content = extractText(html);

      if (content.length > 100) {
        pages.push({ url, content });
      }

      // Discover new links
      const links = extractLinks(html, base, new URL(url));
      for (const link of links) {
        if (!visited.has(link) && !queue.includes(link)) {
          queue.push(link);
        }
      }
    } catch {
      // Timeout or network error — skip page
    }
  }

  return pages;
}
