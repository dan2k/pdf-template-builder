#!/usr/bin/env node
/**
 * Font Setup Script v4
 * Downloads Thai + Latin fonts directly from GitHub releases
 * (Google Fonts official GitHub repo - stable, versioned TTF files)
 * 
 * Run: node download-fonts.js
 */

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const zlib  = require('zlib');

const FONTS_DIR = path.join(__dirname, 'fonts');
if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });

// ─── Direct TTF download URLs from GitHub (stable) ──────────────────────────
// Source: https://github.com/google/fonts (official Google Fonts repo)
const FONTS = [

  // ── Thai Fonts ──────────────────────────────────────────────────────────────
  {
    family: 'Sarabun',
    variants: [
      { dest: 'Sarabun-Regular.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Regular.ttf' },
      { dest: 'Sarabun-Bold.ttf',       url: 'https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Bold.ttf' },
      { dest: 'Sarabun-Italic.ttf',     url: 'https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Italic.ttf' },
      { dest: 'Sarabun-BoldItalic.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-BoldItalic.ttf' },
    ],
  },
  {
    family: 'Kanit',
    variants: [
      { dest: 'Kanit-Regular.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-Regular.ttf' },
      { dest: 'Kanit-Bold.ttf',       url: 'https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-Bold.ttf' },
      { dest: 'Kanit-Italic.ttf',     url: 'https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-Italic.ttf' },
      { dest: 'Kanit-BoldItalic.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/kanit/Kanit-BoldItalic.ttf' },
    ],
  },
  {
    family: 'Prompt',
    variants: [
      { dest: 'Prompt-Regular.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/prompt/Prompt-Regular.ttf' },
      { dest: 'Prompt-Bold.ttf',       url: 'https://github.com/google/fonts/raw/main/ofl/prompt/Prompt-Bold.ttf' },
      { dest: 'Prompt-Italic.ttf',     url: 'https://github.com/google/fonts/raw/main/ofl/prompt/Prompt-Italic.ttf' },
      { dest: 'Prompt-BoldItalic.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/prompt/Prompt-BoldItalic.ttf' },
    ],
  },
  {
    family: 'Mitr',
    variants: [
      { dest: 'Mitr-Regular.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/mitr/Mitr-Regular.ttf' },
      { dest: 'Mitr-Bold.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/mitr/Mitr-Bold.ttf' },
    ],
  },
  {
    family: 'NotoSansThai',
    variants: [
      { dest: 'NotoSansThai-Regular.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/notosansthai/NotoSansThai%5Bwdth%2Cwght%5D.ttf' },
      { dest: 'NotoSansThai-Bold.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/notosansthai/NotoSansThai%5Bwdth%2Cwght%5D.ttf' },
    ],
  },
  {
    family: 'Chakra Petch',
    variants: [
      { dest: 'ChakraPetch-Regular.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/chakrapetch/ChakraPetch-Regular.ttf' },
      { dest: 'ChakraPetch-Bold.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/chakrapetch/ChakraPetch-Bold.ttf' },
    ],
  },
  {
    family: 'Trirong',
    variants: [
      { dest: 'Trirong-Regular.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/trirong/Trirong-Regular.ttf' },
      { dest: 'Trirong-Bold.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/trirong/Trirong-Bold.ttf' },
    ],
  },

  // ── Latin Fonts ─────────────────────────────────────────────────────────────
  {
    family: 'Roboto',
    variants: [
      { dest: 'Roboto-Regular.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/roboto/Roboto%5Bwdth%2Cwght%5D.ttf' },
      { dest: 'Roboto-Bold.ttf',       url: 'https://github.com/google/fonts/raw/main/ofl/roboto/Roboto%5Bwdth%2Cwght%5D.ttf' },
      { dest: 'Roboto-Italic.ttf',     url: 'https://github.com/google/fonts/raw/main/ofl/roboto/Roboto-Italic%5Bwdth%2Cwght%5D.ttf' },
      { dest: 'Roboto-BoldItalic.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/roboto/Roboto-Italic%5Bwdth%2Cwght%5D.ttf' },
    ],
  },
  {
    family: 'Open Sans',
    variants: [
      { dest: 'OpenSans-Regular.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/opensans/OpenSans%5Bwdth%2Cwght%5D.ttf' },
      { dest: 'OpenSans-Bold.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/opensans/OpenSans%5Bwdth%2Cwght%5D.ttf' },
      { dest: 'OpenSans-Italic.ttf',  url: 'https://github.com/google/fonts/raw/main/ofl/opensans/OpenSans-Italic%5Bwdth%2Cwght%5D.ttf' },
    ],
  },
  {
    family: 'Lato',
    variants: [
      { dest: 'Lato-Regular.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/lato/Lato-Regular.ttf' },
      { dest: 'Lato-Bold.ttf',       url: 'https://github.com/google/fonts/raw/main/ofl/lato/Lato-Bold.ttf' },
      { dest: 'Lato-Italic.ttf',     url: 'https://github.com/google/fonts/raw/main/ofl/lato/Lato-Italic.ttf' },
      { dest: 'Lato-BoldItalic.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/lato/Lato-BoldItalic.ttf' },
    ],
  },
  {
    family: 'IBM Plex Sans Thai',
    variants: [
      { dest: 'IBMPlexSansThai-Regular.ttf', url: 'https://github.com/google/fonts/raw/main/ofl/ibmplexsansthai/IBMPlexSansThai-Regular.ttf' },
      { dest: 'IBMPlexSansThai-Bold.ttf',    url: 'https://github.com/google/fonts/raw/main/ofl/ibmplexsansthai/IBMPlexSansThai-Bold.ttf' },
    ],
  },
];

// ─── Download helper ─────────────────────────────────────────────────────────
function download(url, destPath, retries = 2) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file   = fs.createWriteStream(destPath);
    let responded = false;

    const req = client.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 FontDownloader/4.0' },
      timeout: 20000,
    }, (res) => {
      responded = true;

      // Follow redirects (GitHub does 302 → raw content)
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        file.close();
        fs.unlinkSync(destPath);
        return download(res.headers.location, destPath, retries - 1).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode} — ${url}`));
      }

      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const size = fs.statSync(destPath).size;
        if (size < 1000) {
          fs.unlinkSync(destPath);
          reject(new Error(`File too small (${size} bytes) — likely an error page`));
        } else {
          resolve(size);
        }
      });
    });

    req.on('error', (e) => {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      if (retries > 0) {
        setTimeout(() => download(url, destPath, retries - 1).then(resolve).catch(reject), 1000);
      } else {
        reject(e);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error('Timeout'));
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🎨 PDF Template Builder — Font Setup v4');
  console.log(`📁 Output: ${FONTS_DIR}`);
  console.log('📡 Source: github.com/google/fonts (official)\n');

  let success = 0, skipped = 0, failed = 0;
  const errors = [];

  for (const font of FONTS) {
    console.log(`\n🔤 ${font.family}`);
    for (const v of font.variants) {
      const destPath = path.join(FONTS_DIR, v.dest);

      if (fs.existsSync(destPath)) {
        console.log(`  ⏭   ${v.dest} (already exists)`);
        skipped++;
        continue;
      }

      try {
        const size = await download(v.url, destPath);
        console.log(`  ✅  ${v.dest} (${Math.round(size / 1024)} KB)`);
        success++;
      } catch (e) {
        console.log(`  ❌  ${v.dest} — ${e.message}`);
        errors.push({ file: v.dest, error: e.message });
        failed++;
      }
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55));
  console.log(`  ✅  Downloaded : ${success}`);
  console.log(`  ⏭   Skipped   : ${skipped}`);
  console.log(`  ❌  Failed     : ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Some fonts failed. You can retry by running the script again.');
    console.log('   Failed files:');
    errors.forEach(e => console.log(`   • ${e.file}: ${e.error}`));
  }

  const allFiles = fs.readdirSync(FONTS_DIR).filter(f => f.endsWith('.ttf'));
  console.log(`\n📂 Fonts ready (${allFiles.length} files):`);
  allFiles.forEach(f => console.log(`   • ${f}`));

  console.log('\n🚀 Restart backend: npm run start:dev\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
