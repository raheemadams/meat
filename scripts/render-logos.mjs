// Brand asset pipeline — all derived from the real logo: public/halaliy-logo.png
// Run: npm i sharp --no-save && node scripts/render-logos.mjs
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => resolve(root, 'public', p);
const SRC = pub('halaliy-logo.png');

// 1) Trimmed full lockup (icon + wordmark + tagline)
const full = await sharp(SRC).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
await sharp(full.data).png().toFile(pub('logo-full.png'));
const H = full.info.height;
console.log(`✓ logo-full.png (${full.info.width}x${H})`);

// 2) Square icon crop (the green tile, flush-left after trim)
const iconSq = await sharp(full.data).extract({ left: 0, top: 0, width: H, height: H }).png().toBuffer();
await sharp(iconSq).png().toFile(pub('logo-mark.png'));
console.log(`✓ logo-mark.png (${H}x${H})`);

// 3) App-icon sizes (square, white corners — fine on light/app backgrounds)
for (const [w, out] of [[512, 'icon-512.png'], [192, 'icon-192.png'], [64, 'favicon-64.png']]) {
  await sharp(iconSq).resize(w, w).png().toFile(pub(out));
  console.log(`✓ ${out} (${w}x${w})`);
}

// 4) Rounded transparent-corner icon (for compositing on dark backgrounds)
const r = Math.round(H * 0.17);
const mask = Buffer.from(`<svg width="${H}" height="${H}"><rect rx="${r}" ry="${r}" width="${H}" height="${H}" fill="#fff"/></svg>`);
const iconT = await sharp(iconSq).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
const tIcon = (size) => sharp(iconT).resize(size, size).png().toBuffer();

// 5) OG social card — render mark-less SVG, composite real icon
const ogBg = await sharp(pub('og-image.svg'), { density: 384 })
  .resize(1200, 630, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await sharp(ogBg).composite([{ input: await tIcon(120), left: 420, top: 150 }]).png().toFile(pub('og-image.png'));
console.log('✓ og-image.png (1200x630)');

// 6) Brand sheet — render mark-less SVG, composite real icon in 3 spots
const bsBg = await sharp(pub('brand-sheet.svg'), { density: 384 })
  .resize(1600, 1220, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toBuffer();
await sharp(bsBg).composite([
  { input: await tIcon(100), left: 60, top: 70 },
  { input: await tIcon(70), left: 60, top: 1148 },
  { input: await tIcon(48), left: 180, top: 1160 },
]).png().toFile(pub('brand-sheet.png'));
console.log('✓ brand-sheet.png (1600x1220)');

console.log('Done.');
