// One-off: remove the solid light background from the master logo by flood-filling
// from the borders, so interior white (the H/knife inside the green tile) is preserved.
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => resolve(root, 'public', p);

const IN = process.argv[2] ? resolve(process.argv[2]) : pub('halaliy-logo.png');
const OUT = process.argv[3] ? resolve(process.argv[3]) : pub('_transparent.png');

const { data, info } = await sharp(IN).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

// A pixel counts as background if it's light/near-white (grayish & bright).
const isBg = (i) => {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  return r >= 230 && g >= 230 && b >= 230 && Math.max(r, g, b) - Math.min(r, g, b) <= 12;
};

const visited = new Uint8Array(W * H);
const stack = [];
const pushIf = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const p = y * W + x;
  if (visited[p]) return;
  if (!isBg(p * C)) return;
  visited[p] = 1;
  stack.push(p);
};

// Seed from all border pixels
for (let x = 0; x < W; x++) { pushIf(x, 0); pushIf(x, H - 1); }
for (let y = 0; y < H; y++) { pushIf(0, y); pushIf(W - 1, y); }

while (stack.length) {
  const p = stack.pop();
  const x = p % W, y = (p / W) | 0;
  pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1);
}

// Set alpha 0 on every flooded background pixel
let cleared = 0;
for (let p = 0; p < W * H; p++) {
  if (visited[p]) { data[p * C + 3] = 0; cleared++; }
}

await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toFile(OUT);
console.log(`Cleared ${cleared} bg px → ${OUT}`);
