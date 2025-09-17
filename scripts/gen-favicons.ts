import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

/*
 * Favicon generation script
 * Source: public/javelin-logo.png (assumed transparent square or rectangular logo)
 * Outputs to public/:
 *  - favicon.ico (32x32 multires)
 *  - favicon-16x16.png
 *  - favicon-32x32.png
 *  - favicon-192.png
 *  - favicon-512.png
 *  - site.webmanifest
 *  - favicon.svg (placeholder simple SVG wrapper referencing PNG if no vector provided)
 */

async function main() {
  const publicDir = path.resolve('public');
  const srcPng = path.join(publicDir, 'javelin-logo.png');
  try {
    await fs.access(srcPng);
  } catch {
    console.error('Source logo not found at', srcPng);
    process.exit(1);
  }

  const sizes = [16, 32, 192, 512];
  await Promise.all(sizes.map(async size => {
    const out = path.join(publicDir, `favicon-${size === 16 || size === 32 ? size + 'x' + size : size}.png`);
    const pipeline = sharp(srcPng).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }});
    await pipeline.png().toFile(out);
    console.log('Wrote', out);
  }));

  // ICO (include 16 & 32)
  const icoPngs = [16, 32].map(size => path.join(publicDir, `favicon-${size}x${size}.png`));
  const icoBuf = await pngToIco(icoPngs);
  await fs.writeFile(path.join(publicDir, 'favicon.ico'), icoBuf);
  console.log('Wrote favicon.ico');

  // Basic web manifest
  const manifest = {
    name: 'Javelin',
    short_name: 'Javelin',
    icons: [
      { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    theme_color: '#0a0a0a',
    background_color: '#0a0a0a',
    display: 'standalone'
  };
  await fs.writeFile(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
  console.log('Wrote site.webmanifest');

  // Simple SVG (if actual vector exists replace this manually later)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image href="/favicon-512.png" width="512" height="512"/></svg>`;
  await fs.writeFile(path.join(publicDir, 'favicon.svg'), svg, 'utf8');
  console.log('Wrote favicon.svg');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
