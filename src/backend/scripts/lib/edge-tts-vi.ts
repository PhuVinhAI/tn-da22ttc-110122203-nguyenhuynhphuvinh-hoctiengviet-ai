/**
 * Vietnamese Edge TTS — same free Microsoft service as edge-tts-universal,
 * but SSML uses xml:lang from the voice (e.g. vi-VN) instead of hardcoded en-US.
 */

import { createHash, randomBytes } from 'crypto';
import { randomUUID } from 'crypto';
import type WebSocketType from 'ws';

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return char;
    }
  });
}

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const BASE_URL = 'speech.platform.bing.com/consumer/speech/synthesize/readaloud';
const WSS_URL = `wss://${BASE_URL}/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0];
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
const WIN_EPOCH = 11644473600;
const S_TO_NS = 1e9;

const WSS_HEADERS: Record<string, string> = {
  'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
  Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
  'Sec-WebSocket-Version': '13',
};

function generateSecMsGec(): string {
  let ticks = Date.now() / 1000;
  ticks += WIN_EPOCH;
  ticks -= ticks % 300;
  ticks *= S_TO_NS / 100;
  const strToHash = `${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`;
  return createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
}

function headersWithMuid(headers: Record<string, string>): Record<string, string> {
  const muid = randomBytes(16).toString('hex').toUpperCase();
  return { ...headers, Cookie: `muid=${muid};` };
}

function localeFromVoice(voice: string): string {
  const short = /^([a-z]{2})-([A-Z]{2})/.exec(voice);
  if (short) return `${short[1]}-${short[2]}`;
  const full = /Text to Speech Voice \(([a-z]{2})-([A-Z]{2})/.exec(voice);
  if (full) return `${full[1]}-${full[2]}`;
  return 'vi-VN';
}

function buildSsml(text: string, voice: string): string {
  const lang = localeFromVoice(voice);
  const safe = escapeXml(text);
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'><voice name='${voice}'><prosody rate='+0%' volume='+0%' pitch='+0Hz'>${safe}</prosody></voice></speak>`;
}

function connectId(): string {
  return randomUUID().replace(/-/g, '');
}

function dateToString(): string {
  return new Date().toUTCString().replace('GMT', 'GMT+0000 (Coordinated Universal Time)');
}

function ssmlMessage(ssml: string): string {
  return `X-RequestId:${connectId()}\r
Content-Type:application/ssml+xml\r
X-Timestamp:${dateToString()}Z\r
Path:ssml\r
\r
${ssml}`;
}

function parseBinaryAudio(message: Buffer): Buffer | null {
  if (message.length < 2) return null;
  const headerLength = message.readUInt16BE(0);
  const headerString = message.subarray(2, headerLength + 2).toString('utf-8');
  const headers: Record<string, string> = {};
  for (const line of headerString.split('\r\n')) {
    const [key, value] = line.split(':', 2);
    if (key && value) headers[key.trim()] = value.trim();
  }
  if (headers.Path !== 'audio' || headers['Content-Type'] !== 'audio/mpeg') {
    return null;
  }
  return message.subarray(headerLength + 2);
}

/**
 * Synthesize Vietnamese speech with correct locale (tone marks preserved).
 */
function normalizeVoice(voice: string): string {
  if (voice.startsWith('Microsoft Server Speech')) return voice;
  const m = /^([a-z]{2})-([A-Z]{2})-(.+Neural)$/.exec(voice);
  if (!m) return voice;
  return `Microsoft Server Speech Text to Speech Voice (${m[1]}-${m[2]}, ${m[3]})`;
}

async function synthesizeOnce(text: string, voice: string): Promise<Buffer> {
  const { default: WebSocket } = await import('ws');
  const url = `${WSS_URL}&Sec-MS-GEC=${generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectId()}`;
  const normalized = normalizeVoice(voice);
  const ssml = buildSsml(text, normalized);
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    let ws: WebSocketType;
    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('TTS timeout'));
    }, 30_000);

    ws = new WebSocket(url, {
      headers: headersWithMuid(WSS_HEADERS),
    }) as WebSocketType;

    ws.on('open', () => {
      ws.send(
        `X-Timestamp:${dateToString()}\r
Content-Type:application/json; charset=utf-8\r
Path:speech.config\r
\r
{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r
`,
      );
      ws.send(ssmlMessage(ssml));
    });

    ws.on('message', (data: Buffer, isBinary: boolean) => {
      if (!isBinary) return;
      const audio = parseBinaryAudio(data);
      if (audio && audio.length > 0) chunks.push(audio);
    });

    ws.on('close', () => {
      clearTimeout(timeout);
      resolve();
    });
    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  if (chunks.length === 0) {
    throw new Error(`No audio received for: ${text.slice(0, 80)}`);
  }
  return Buffer.concat(chunks);
}

export async function synthesizeVietnameseEdgeTts(
  text: string,
  voice: string,
  maxAttempts = 3,
): Promise<Buffer> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await synthesizeOnce(text, voice);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  }
  throw lastError ?? new Error('TTS failed');
}
