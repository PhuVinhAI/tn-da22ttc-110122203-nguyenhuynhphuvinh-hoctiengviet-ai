/**
 * Fast free Vietnamese TTS via Google Translate (unofficial endpoint).
 * Preserves Unicode tone marks; typical latency ~200–500ms per request.
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MAX_CHARS = 200;

export async function synthesizeGoogleTtsVi(text: string): Promise<Buffer> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty TTS text');

  if (trimmed.length <= MAX_CHARS) {
    return fetchChunk(trimmed);
  }

  const parts: Buffer[] = [];
  const sentences = trimmed.match(/[^.!?…]+[.!?…]?/g) ?? [trimmed];
  let chunk = '';
  for (const sentence of sentences) {
    const next = (chunk + sentence).trim();
    if (next.length > MAX_CHARS && chunk) {
      parts.push(await fetchChunk(chunk.trim()));
      chunk = sentence;
    } else {
      chunk = next;
    }
  }
  if (chunk.trim()) parts.push(await fetchChunk(chunk.trim()));
  return Buffer.concat(parts);
}

async function fetchChunk(text: string): Promise<Buffer> {
  const url = new URL('https://translate.google.com/translate_tts');
  url.searchParams.set('ie', 'UTF-8');
  url.searchParams.set('client', 'tw-ob');
  url.searchParams.set('tl', 'vi');
  url.searchParams.set('q', text);

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Google TTS HTTP ${res.status} for: ${text.slice(0, 60)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) {
    throw new Error(`Google TTS empty response for: ${text.slice(0, 60)}`);
  }
  return buf;
}

export async function runPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
