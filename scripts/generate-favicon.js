/**
 * Generates app/favicon.ico from the brand logo PNG.
 * Run: node scripts/generate-favicon.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

const projectRoot = path.join(__dirname, '..');
const logoPath = path.join(projectRoot, 'public/brand/notime-storage-logo.png');
const outPath = path.join(projectRoot, 'app/favicon.ico');

async function main() {
  const sizes = [16, 32];
  const buffers = await Promise.all(
    sizes.map((size) =>
      sharp(logoPath)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  const ico = await toIco(buffers);
  fs.writeFileSync(outPath, ico);
  console.log('Wrote app/favicon.ico');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
