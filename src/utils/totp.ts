// Minimal TOTP utilities without external deps
// RFC 6238 TOTP with SHA-1, 30-second step

function base32Alphabet() {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
}

export function randomSecret(length = 20): string {
  const alphabet = base32Alphabet();
  let s = '';
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (let b of bytes) s += alphabet[b % alphabet.length];
  } else {
    for (let i = 0; i < length; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

function base32Decode(input: string): Uint8Array {
  const alphabet = base32Alphabet();
  const clean = input.replace(/=+$/,'').toUpperCase().replace(/\s+/g,'');
  let bits = '';
  for (let char of clean) {
    const val = alphabet.indexOf(char);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
}

async function hmacSha1(key: Uint8Array, msg: Uint8Array): Promise<ArrayBuffer> {
  const keyView = new Uint8Array(key.buffer as ArrayBuffer);
  const msgView = new Uint8Array(msg.buffer as ArrayBuffer);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyView,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, msgView);
}

function toBytes(num: number): Uint8Array {
  const b = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    b[i] = num & 0xff;
    num = Math.floor(num / 256);
  }
  return b;
}

function truncate(hmac: Uint8Array): number {
  const offset = hmac[hmac.length - 1] & 0xf;
  const p = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | (hmac[offset + 3]);
  return p;
}

export async function generateTOTP(secretBase32: string, step = 30, digits = 6, forTime?: number): Promise<string> {
  const key = base32Decode(secretBase32);
  const epoch = Math.floor((forTime ?? Date.now()) / 1000);
  const counter = Math.floor(epoch / step);
  const msg = toBytes(counter);
  const mac = new Uint8Array(await hmacSha1(key, msg));
  const p = truncate(mac);
  const code = (p % 10 ** digits).toString().padStart(digits, '0');
  return code;
}

export async function verifyTOTP(secretBase32: string, code: string, window = 1, step = 30, digits = 6): Promise<boolean> {
  const now = Date.now();
  const offsets = [];
  for (let w = -window; w <= window; w++) offsets.push(w);
  const results = await Promise.all(offsets.map((off) => generateTOTP(secretBase32, step, digits, now + off * step * 1000)));
  return results.includes(code.trim());
}

export function otpauthURI({ secret, account, issuer }: { secret: string; account: string; issuer: string }): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const query = new URLSearchParams({ secret, issuer, digits: '6', period: '30' }).toString();
  return `otpauth://totp/${label}?${query}`;
}

export function qrCodeUrlFromOtpauth(otpauth: string, size = 200) {
  const encoded = encodeURIComponent(otpauth);
  return `https://chart.googleapis.com/chart?chs=${size}x${size}&chld=M|0&cht=qr&chl=${encoded}`;
}

export async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  const arr = Array.from(new Uint8Array(hash));
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('');
}