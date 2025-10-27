import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function ensureDir(dirPath) {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

async function loadModules() {
  const sharp = (await import('sharp')).default;
  const toIco = (await import('png-to-ico')).default;
  return { sharp, toIco };
}

async function generateIcon() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const projectRoot = path.resolve(__dirname, '..');
  const svgPath = path.resolve(projectRoot, '..', 'web-next', 'spark-logo.svg');
  const outDir = path.resolve(projectRoot, 'build');
  const outIco = path.resolve(outDir, 'icon.ico');

  if (!fs.existsSync(svgPath)) {
    throw new Error(`SVG bulunamadı: ${svgPath}`);
  }

  await ensureDir(outDir);
  const { sharp, toIco } = await loadModules();

  // NSIS installer, ICO içinde 256 px üzeri boyutlarla sorun yaşayabilir
  const sizes = [16, 24, 32, 48, 64, 96, 128, 256];
  const pngBuffers = [];

  for (const size of sizes) {
    const density = Math.max(72, size * 2); // SVG raster için yeterli yoğunluk
    const buf = await sharp(svgPath, { density })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    pngBuffers.push(buf);
  }

  const icoBuffer = await toIco(pngBuffers);
  await fs.promises.writeFile(outIco, icoBuffer);
  console.log(`ICO yazıldı: ${outIco}`);
}

generateIcon().catch((err) => {
  console.error(err);
  process.exit(1);
});


