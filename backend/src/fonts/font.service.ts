import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface FontVariant {
  weight: 'normal' | 'bold';
  style: 'normal' | 'italic';
  file: string;
}

export interface FontFamily {
  name: string;
  key: string;
  language: 'latin' | 'thai' | 'both';
  variants: FontVariant[];
}

const BUILTIN_FONTS: FontFamily[] = [
  {
    name: 'Helvetica', key: 'Helvetica', language: 'latin',
    variants: [
      { weight: 'normal', style: 'normal', file: 'Helvetica' },
      { weight: 'bold',   style: 'normal', file: 'Helvetica-Bold' },
      { weight: 'normal', style: 'italic', file: 'Helvetica-Oblique' },
      { weight: 'bold',   style: 'italic', file: 'Helvetica-BoldOblique' },
    ],
  },
  {
    name: 'Times New Roman', key: 'Times-Roman', language: 'latin',
    variants: [
      { weight: 'normal', style: 'normal', file: 'Times-Roman' },
      { weight: 'bold',   style: 'normal', file: 'Times-Bold' },
      { weight: 'normal', style: 'italic', file: 'Times-Italic' },
      { weight: 'bold',   style: 'italic', file: 'Times-BoldItalic' },
    ],
  },
  {
    name: 'Courier', key: 'Courier', language: 'latin',
    variants: [
      { weight: 'normal', style: 'normal', file: 'Courier' },
      { weight: 'bold',   style: 'normal', file: 'Courier-Bold' },
      { weight: 'normal', style: 'italic', file: 'Courier-Oblique' },
      { weight: 'bold',   style: 'italic', file: 'Courier-BoldOblique' },
    ],
  },
];

const TTF_FONT_DEFS = [
  { name: 'Sarabun',          key: 'Sarabun',          language: 'thai'  as const, files: { 'normal/normal': 'Sarabun-Regular.ttf', 'bold/normal': 'Sarabun-Bold.ttf', 'normal/italic': 'Sarabun-Italic.ttf', 'bold/italic': 'Sarabun-BoldItalic.ttf' } },
  { name: 'Kanit',            key: 'Kanit',            language: 'thai'  as const, files: { 'normal/normal': 'Kanit-Regular.ttf',   'bold/normal': 'Kanit-Bold.ttf',   'normal/italic': 'Kanit-Italic.ttf',   'bold/italic': 'Kanit-BoldItalic.ttf'   } },
  { name: 'Prompt',           key: 'Prompt',           language: 'thai'  as const, files: { 'normal/normal': 'Prompt-Regular.ttf',  'bold/normal': 'Prompt-Bold.ttf',  'normal/italic': 'Prompt-Italic.ttf',  'bold/italic': 'Prompt-BoldItalic.ttf'  } },
  { name: 'Mitr',             key: 'Mitr',             language: 'thai'  as const, files: { 'normal/normal': 'Mitr-Regular.ttf',    'bold/normal': 'Mitr-Bold.ttf',    'normal/italic': 'Mitr-Regular.ttf',   'bold/italic': 'Mitr-Bold.ttf'          } },
  { name: 'Noto Sans Thai',   key: 'NotoSansThai',     language: 'thai'  as const, files: { 'normal/normal': 'NotoSansThai-Regular.ttf', 'bold/normal': 'NotoSansThai-Bold.ttf', 'normal/italic': 'NotoSansThai-Regular.ttf', 'bold/italic': 'NotoSansThai-Bold.ttf' } },
  { name: 'Chakra Petch',     key: 'ChakraPetch',      language: 'thai'  as const, files: { 'normal/normal': 'ChakraPetch-Regular.ttf', 'bold/normal': 'ChakraPetch-Bold.ttf', 'normal/italic': 'ChakraPetch-Regular.ttf', 'bold/italic': 'ChakraPetch-Bold.ttf' } },
  { name: 'Trirong',          key: 'Trirong',          language: 'thai'  as const, files: { 'normal/normal': 'Trirong-Regular.ttf', 'bold/normal': 'Trirong-Bold.ttf', 'normal/italic': 'Trirong-Regular.ttf', 'bold/italic': 'Trirong-Bold.ttf' } },
  { name: 'IBM Plex Sans Thai', key: 'IBMPlexSansThai', language: 'thai' as const, files: { 'normal/normal': 'IBMPlexSansThai-Regular.ttf', 'bold/normal': 'IBMPlexSansThai-Bold.ttf', 'normal/italic': 'IBMPlexSansThai-Regular.ttf', 'bold/italic': 'IBMPlexSansThai-Bold.ttf' } },
  { name: 'Roboto',           key: 'Roboto',           language: 'latin' as const, files: { 'normal/normal': 'Roboto-Regular.ttf',  'bold/normal': 'Roboto-Bold.ttf',  'normal/italic': 'Roboto-Italic.ttf',  'bold/italic': 'Roboto-BoldItalic.ttf'  } },
  { name: 'Open Sans',        key: 'OpenSans',         language: 'latin' as const, files: { 'normal/normal': 'OpenSans-Regular.ttf','bold/normal': 'OpenSans-Bold.ttf', 'normal/italic': 'OpenSans-Italic.ttf','bold/italic': 'OpenSans-Bold.ttf'      } },
  { name: 'Lato',             key: 'Lato',             language: 'latin' as const, files: { 'normal/normal': 'Lato-Regular.ttf',    'bold/normal': 'Lato-Bold.ttf',    'normal/italic': 'Lato-Italic.ttf',    'bold/italic': 'Lato-BoldItalic.ttf'    } },
];

@Injectable()
export class FontService implements OnModuleInit {
  private readonly logger = new Logger(FontService.name);
  private availableFonts: FontFamily[] = [];
  private fontsDir: string;

  onModuleInit() {
    this.fontsDir = this.resolveFontsDir();
    if (!fs.existsSync(this.fontsDir)) fs.mkdirSync(this.fontsDir, { recursive: true });
    this.loadFonts();
    this.loadHiddenConfig();
    this.logger.log(`Fonts dir: ${this.fontsDir}`);
    this.logger.log(`Loaded fonts: ${this.availableFonts.map(f => f.key).join(', ')}`);
  }

  /** Try multiple candidate paths to find the fonts directory */
  private resolveFontsDir(): string {
    const candidates = [
      // When running via ts-node / nest start (cwd = backend/)
      path.join(process.cwd(), 'fonts'),
      // When running compiled (dist/) — go up to backend/
      path.join(__dirname, '..', '..', 'fonts'),
      path.join(__dirname, '..', '..', '..', 'fonts'),
      path.join(__dirname, '..', 'fonts'),
    ];
    const found = candidates.find(d => fs.existsSync(d) && fs.readdirSync(d).some(f => f.endsWith('.ttf')));
    if (found) return found;
    // Default to cwd/fonts even if empty
    return candidates[0];
  }

  private loadFonts() {
    this.availableFonts = [...BUILTIN_FONTS];
    const dir = this.fontsDir;

    for (const def of TTF_FONT_DEFS) {
      const variants: FontVariant[] = [];
      let anyFound = false;

      const combos: Array<{ weight: 'normal'|'bold', style: 'normal'|'italic' }> = [
        { weight: 'normal', style: 'normal'  },
        { weight: 'bold',   style: 'normal'  },
        { weight: 'normal', style: 'italic'  },
        { weight: 'bold',   style: 'italic'  },
      ];

      for (const combo of combos) {
        const filename = def.files[`${combo.weight}/${combo.style}`];
        const filePath = path.join(dir, filename);
        if (fs.existsSync(filePath)) {
          variants.push({ weight: combo.weight, style: combo.style, file: filePath });
          anyFound = true;
        }
      }

      if (!anyFound) continue; // skip entirely if no files found

      // Fill gaps: find best available fallback for missing variants
      const getFile = (w: 'normal'|'bold', s: 'normal'|'italic') => {
        return variants.find(v => v.weight === w && v.style === s)?.file
          ?? variants.find(v => v.weight === w)?.file
          ?? variants[0].file;
      };

      this.availableFonts.push({
        name: def.name, key: def.key, language: def.language,
        variants: combos.map(c => ({
          weight: c.weight, style: c.style,
          file: variants.find(v => v.weight === c.weight && v.style === c.style)?.file ?? getFile(c.weight, c.style),
        })),
      });
    }

    // Auto-detect any extra .ttf files placed directly in fonts/
    this.scanExtraFonts();
  }

  private scanExtraFonts() {
    const knownFiles = new Set(
      TTF_FONT_DEFS.flatMap(d => Object.values(d.files))
    );
    try {
      for (const file of fs.readdirSync(this.fontsDir)) {
        if (!file.endsWith('.ttf') && !file.endsWith('.otf')) continue;
        if (knownFiles.has(file)) continue;
        const key = path.basename(file, path.extname(file));
        if (this.availableFonts.some(f => f.key === key)) continue;
        const full = path.join(this.fontsDir, file);
        this.availableFonts.push({
          name: key, key, language: 'both',
          variants: [
            { weight: 'normal', style: 'normal', file: full },
            { weight: 'bold',   style: 'normal', file: full },
            { weight: 'normal', style: 'italic', file: full },
            { weight: 'bold',   style: 'italic', file: full },
          ],
        });
        this.logger.log(`Auto-detected font: ${key}`);
      }
    } catch {}
  }

  getFonts(): FontFamily[] { return this.availableFonts; }
  getFontsDir(): string    { return this.fontsDir; }

  /** Get fonts filtered by hidden state */
  getVisibleFonts(): FontFamily[] {
    return this.availableFonts.filter(f => !(f as any).hidden);
  }

  /** Set hidden flag on a font */
  setFontVisibility(key: string, hidden: boolean): boolean {
    const font = this.availableFonts.find(f => f.key === key);
    if (!font) return false;
    (font as any).hidden = hidden;
    this.saveHiddenConfig();
    return true;
  }

  /** Delete a custom font (not builtin) */
  deleteFont(key: string): boolean {
    const idx = this.availableFonts.findIndex(f => f.key === key);
    if (idx === -1) return false;
    const font = this.availableFonts[idx];
    // Don't allow deleting builtin fonts
    if (BUILTIN_FONTS.some(b => b.key === key)) return false;
    // Delete font files
    for (const v of font.variants) {
      if (v.file && v.file.includes(this.fontsDir)) {
        try { fs.unlinkSync(v.file); } catch {}
      }
    }
    this.availableFonts.splice(idx, 1);
    this.saveHiddenConfig();
    return true;
  }

  /** Reload fonts from disk */
  reloadFonts() {
    this.loadFonts();
    this.loadHiddenConfig();
    this.logger.log(`Reloaded fonts: ${this.availableFonts.map(f => f.key).join(', ')}`);
  }

  private getHiddenConfigPath(): string {
    return path.join(this.fontsDir, '.font-config.json');
  }

  private loadHiddenConfig() {
    try {
      const configPath = this.getHiddenConfigPath();
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const hiddenKeys: string[] = config.hidden || [];
        for (const font of this.availableFonts) {
          (font as any).hidden = hiddenKeys.includes(font.key);
        }
      }
    } catch {}
  }

  private saveHiddenConfig() {
    try {
      const hiddenKeys = this.availableFonts.filter(f => (f as any).hidden).map(f => f.key);
      fs.writeFileSync(this.getHiddenConfigPath(), JSON.stringify({ hidden: hiddenKeys }, null, 2));
    } catch {}
  }

  resolveFont(fontKey: string, weight: string, style: string): string {
    const family = this.availableFonts.find(f => f.key === fontKey);
    if (!family) return 'Helvetica';
    const isBold   = weight === 'bold';
    const isItalic = style  === 'italic';
    const v = family.variants.find(v => v.weight === (isBold ? 'bold' : 'normal') && v.style === (isItalic ? 'italic' : 'normal'))
           ?? family.variants[0];
    return v.file;
  }
}
