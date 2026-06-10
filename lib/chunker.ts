/**
 * Content Chunker
 * Splits page text into overlapping chunks suitable for embedding.
 */

const CHUNK_SIZE = 500;     // characters per chunk
const CHUNK_OVERLAP = 100;  // characters overlap between chunks

/**
 * Split text into overlapping chunks.
 * Tries to split on sentence boundaries where possible.
 */
export function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + CHUNK_SIZE;

    if (end < text.length) {
      // Try to break at a sentence boundary (. ! ?)
      const boundary = text.lastIndexOf(". ", end);
      if (boundary > start + CHUNK_SIZE / 2) {
        end = boundary + 1;
      }
    } else {
      end = text.length;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);

    start = end - CHUNK_OVERLAP;
    if (start >= text.length) break;
  }

  return chunks;
}
