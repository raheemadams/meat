// One-off rasterizer: SVG brand assets -> PNG exports.
// Run: node scripts/render-logos.mjs   (requires `npm i sharp --no-save`)
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => resolve(root, 'public', p);

const jobs = [
  { src: 'logo-mark.svg', out: 'icon-512.png', w: 512, h: 512 },
  { src: 'logo-mark.svg', out: 'icon-192.png', w: 192, h: 192 },
  { src: 'logo-mark.svg', out: 'favicon-64.png', w: 64, h: 64 },
  { src: 'logo-full.svg', out: 'logo-full.png', w: 840, h: 192 }, // ~3x for crisp email/header use
  { src: 'og-image.svg', out: 'og-image.png', w: 1200, h: 630 },
];

for (const j of jobs) {
  const svg = readFileSync(pub(j.src));
  await sharp(svg, { density: 384 })
    .resize(j.w, j.h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(pub(j.out));
  console.log(`✓ ${j.out} (${j.w}x${j.h})`);
}
console.log('Done.');
