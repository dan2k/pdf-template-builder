import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as zlib from 'zlib';

const A4_W = 595.28;
const A4_H = 841.89;

// ── zlib decompress ───────────────────────────────────────────────────────────
function decompress(raw: Buffer): Buffer | null {
  try { return zlib.inflateSync(raw); } catch {}
  try { return zlib.inflateRawSync(raw); } catch {}
  return null;
}

// ── CMap parser: beginbfchar / beginbfrange → CID→Unicode map ─────────────────
function hexCodesToStr(hex: string): string {
  let r = '';
  for (let i = 0; i < hex.length; i += 4) {
    const cp = parseInt(hex.slice(i, i + 4), 16);
    if (cp > 0) { try { r += String.fromCodePoint(cp); } catch {} }
  }
  return r;
}

function parseCMap(txt: string): Map<string, string> {
  const map = new Map<string, string>();

  const bfc = txt.match(/beginbfchar([\s\S]*?)endbfchar/);
  if (bfc) {
    for (const p of bfc[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const u = hexCodesToStr(p[2]);
      if (u) map.set(p[1].toUpperCase().padStart(4, '0'), u);
    }
  }

  const bfr = txt.match(/beginbfrange([\s\S]*?)endbfrange/);
  if (bfr) {
    const blk = bfr[1];
    // array form: <start> <end> [<u1> <u2> ...]
    for (const a of blk.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*\[([\s\S]*?)\]/g)) {
      let cid = parseInt(a[1], 16);
      const end = parseInt(a[2], 16);
      const hexes = [...a[3].matchAll(/<([0-9A-Fa-f]+)>/g)].map(x => x[1]);
      for (let i = 0; i < hexes.length && cid + i <= end; i++) {
        const u = hexCodesToStr(hexes[i]);
        if (u) map.set((cid + i).toString(16).toUpperCase().padStart(4, '0'), u);
      }
    }
    // simple form: <start> <end> <uStart>
    for (const a of blk.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      let cid = parseInt(a[1], 16), end = parseInt(a[2], 16), uStart = parseInt(a[3], 16);
      for (let i = 0; cid + i <= end; i++) {
        try { map.set((cid + i).toString(16).toUpperCase().padStart(4, '0'), String.fromCodePoint(uStart + i)); } catch {}
      }
    }
  }
  return map;
}

// ── hex token decoder ─────────────────────────────────────────────────────────
function decodeHex(hex: string, cmap: Map<string, string> | undefined): string {
  if (cmap && cmap.size > 0) {
    let r = '';
    for (let i = 0; i < hex.length; i += 4)
      r += cmap.get(hex.slice(i, i + 4).toUpperCase().padStart(4, '0')) || '';
    return r;
  }
  // fallback ASCII (2-char per byte)
  if (hex.length % 4 !== 0) {
    let r = '';
    for (let i = 0; i < hex.length; i += 2) {
      const b = parseInt(hex.slice(i, i + 2), 16);
      if (b > 31 && b < 128) r += String.fromCharCode(b);
    }
    return r;
  }
  // fallback UTF-16BE
  let r = '';
  for (let i = 0; i < hex.length; i += 4) {
    const cp = parseInt(hex.slice(i, i + 4), 16);
    if (cp > 31) { try { r += String.fromCodePoint(cp); } catch {} }
  }
  return r;
}

function decodeLiteral(s: string): string {
  return s
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
    .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')');
}

function decodeTJArray(raw: string, cmap: Map<string, string> | undefined): string {
  const parts: string[] = [];
  for (const m of raw.slice(1, -1).matchAll(/(<[0-9A-Fa-f]*>|\([^)]*\)|[-\d.]+)/g)) {
    const p = m[1];
    if (p.startsWith('<'))      { const t = decodeHex(p.slice(1, -1), cmap); if (t) parts.push(t); }
    else if (p.startsWith('(')){ const t = decodeLiteral(p.slice(1, -1)); if (t) parts.push(t); }
    else if (parseFloat(p) < -150) parts.push(' ');
  }
  return parts.join('');
}

// ── main extractor ────────────────────────────────────────────────────────────
interface TextChunk { text: string; x: number; y: number; fontSize: number; }

function extractPdf(buf: Buffer): {
  pages: Array<{ chunks: TextChunk[]; width: number; height: number }>;
  info:  Record<string, string>;
} {
  const src = buf.toString('binary');

  // 1. collect all objects
  const objects = new Map<string, string>();
  for (const m of src.matchAll(/(\d+)\s+(\d+)\s+obj\s([\s\S]*?)endobj/g))
    objects.set(m[1] + ' ' + m[2], m[3].trim());

  function getStreamText(v: string): string | null {
    const sm = v.match(/stream\r?\n([\s\S]*?)\r?\nendstream/);
    if (!sm) return null;
    const raw = Buffer.from(sm[1], 'binary');
    if (v.includes('FlateDecode')) { const d = decompress(raw); return d ? d.toString('utf8') : null; }
    return raw.toString('latin1');
  }
  function getStreamBuf(v: string): Buffer | null {
    const sm = v.match(/stream\r?\n([\s\S]*?)\r?\nendstream/);
    if (!sm) return null;
    const raw = Buffer.from(sm[1], 'binary');
    if (v.includes('FlateDecode')) return decompress(raw);
    return raw;
  }

  // 2. build CMap table for every stream that has bfrange/bfchar
  const cmaps = new Map<string, Map<string, string>>();
  for (const [key, val] of objects) {
    let txt = val;
    const st = getStreamText(val);
    if (st) txt = st;
    if (txt.includes('beginbfrange') || txt.includes('beginbfchar'))
      cmaps.set(key, parseCMap(txt));
  }

  // 3. fontObjKey → CMap (via /ToUnicode ref)
  const fontObjCmaps = new Map<string, Map<string, string>>();
  for (const [key, val] of objects) {
    const tu = val.match(/\/ToUnicode\s+(\d+)\s+(\d+)\s+R/);
    if (!tu) continue;
    const cmap = cmaps.get(tu[1] + ' ' + tu[2]);
    if (cmap) fontObjCmaps.set(key, cmap);
  }

  // 4. PDF info dict
  const info: Record<string, string> = {};
  const infoRef = src.match(/\/Info\s+(\d+)\s+(\d+)\s+R/);
  if (infoRef) {
    const ic = objects.get(infoRef[1] + ' ' + infoRef[2]) || '';
    for (const f of ['Title', 'Author', 'Subject', 'Creator']) {
      const m = ic.match(new RegExp('/' + f + '\\s*\\(([^)]*)\\)'));
      if (m) info[f] = m[1];
    }
  }

  // 5. page objects (Type /Page not /Pages)
  const pageObjs: Array<{ key: string; val: string }> = [];
  for (const [key, val] of objects)
    if (/\/Type\s*\/Page[^s]/.test(val)) pageObjs.push({ key, val });
  pageObjs.sort((a, b) => parseInt(a.key) - parseInt(b.key));

  const pages = pageObjs.map(({ val: pageDictContent }) => {
    // page size
    const mb = pageDictContent.match(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    const pw = mb ? parseFloat(mb[3]) : A4_W;
    const ph = mb ? parseFloat(mb[4]) : A4_H;

    // per-page font alias → CMap
    const pageFontCmaps = new Map<string, Map<string, string>>();
    let resContent = pageDictContent;
    const resRef = pageDictContent.match(/\/Resources\s+(\d+)\s+(\d+)\s+R/);
    if (resRef) resContent = objects.get(resRef[1] + ' ' + resRef[2]) || pageDictContent;
    const fontSec = resContent.match(/\/Font\s*<<([\s\S]*?)>>/);
    if (fontSec) {
      for (const fe of fontSec[1].matchAll(/\/(F\w+)\s+(\d+)\s+(\d+)\s+R/g)) {
        const cmap = fontObjCmaps.get(fe[2] + ' ' + fe[3]);
        if (cmap) pageFontCmaps.set(fe[1], cmap);
      }
    }

    // collect all content streams
    let allContent = '';
    const cr = pageDictContent.match(/\/Contents\s+(\d+\s+\d+\s+R|\[[\s\S]*?\])/);
    if (cr) {
      const raw = cr[1];
      const refs = raw.includes('[')
        ? [...raw.matchAll(/(\d+)\s+(\d+)\s+R/g)].map(m => m[1] + ' ' + m[2])
        : (() => { const p = raw.trim().match(/^(\d+)\s+(\d+)/); return p ? [p[1]+' '+p[2]] : []; })();
      for (const ref of refs) {
        const co = objects.get(ref); if (!co) continue;
        const b  = getStreamBuf(co); if (b) allContent += b.toString('latin1') + '\n';
      }
    }

    // detect Y-flip CTM: 1 0 0 -1 0 ph cm
    let flipY = false, flipOffset = 0;
    for (const m of allContent.matchAll(/([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+cm/g)) {
      if (parseFloat(m[1]) === 1 && parseFloat(m[4]) === -1) {
        flipY = true; flipOffset = parseFloat(m[6]);
      }
    }

    // tokenize
    const tokens = allContent.match(
      /(<[0-9A-Fa-f]*>|\[[^\]]*\]|\([^)]*\)|\/[^\s\/<>\[\]()]+|[^\s<>\[\]()/]+)/g
    ) || [];

    let curFont = '', curFontSize = 10, tmX = 0, tmY = 0;
    const chunks: TextChunk[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok === 'Tf' && i >= 2) {
        curFont = tokens[i-2].replace(/^\//, '');
        curFontSize = parseFloat(tokens[i-1]) || 10;
        continue;
      }
      if (tok === 'Tm' && i >= 6) { tmX = parseFloat(tokens[i-2]); tmY = parseFloat(tokens[i-1]); continue; }
      if ((tok === 'Td' || tok === 'TD') && i >= 2) { tmX += parseFloat(tokens[i-2])||0; tmY += parseFloat(tokens[i-1])||0; continue; }
      if (tok === 'T*') { tmY -= curFontSize * 1.2; continue; }

      const cmap = pageFontCmaps.get(curFont);
      let text = '';

      if (tok === 'Tj' && i >= 1) {
        const raw = tokens[i-1];
        if (raw.startsWith('<'))       text = decodeHex(raw.slice(1, -1), cmap);
        else if (raw.startsWith('(')) text = decodeLiteral(raw.slice(1, -1));
      } else if (tok === 'TJ' && i >= 1 && tokens[i-1].startsWith('[')) {
        text = decodeTJArray(tokens[i-1], cmap);
      }

      if (text.trim()) {
        const y = flipY ? flipOffset - tmY : ph - tmY;
        chunks.push({ text, x: tmX, y, fontSize: curFontSize });
      }
    }

    chunks.sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);
    return { chunks, width: pw, height: ph };
  });

  return { pages, info };
}

// ─── NestJS Service ───────────────────────────────────────────────────────────
@Injectable()
export class PdfImportService {

  async importPdf(buffer: Buffer, filename: string): Promise<any> {
    let extracted: ReturnType<typeof extractPdf>;
    try {
      extracted = extractPdf(buffer);
    } catch (e) {
      throw new Error('Could not parse PDF: ' + (e as any).message);
    }

    const { pages: rawPages, info } = extracted;
    const pages = rawPages.map((rp, i) => ({
      id: uuidv4(),
      config: {
        size:        Math.abs(rp.width - A4_W) < 2 ? 'A4' : 'custom',
        orientation: rp.width > rp.height ? 'landscape' : 'portrait',
        width: rp.width, height: rp.height,
        marginTop: 40, marginBottom: 40, marginLeft: 40, marginRight: 40,
        backgroundColor: '#ffffff',
      },
      elements: this.chunksToElements(rp.chunks, rp.width, rp.height, i),
    }));

    if (pages.length === 0) pages.push({
      id: uuidv4(),
      config: { size: 'A4', orientation: 'portrait', width: A4_W, height: A4_H,
                marginTop: 40, marginBottom: 40, marginLeft: 40, marginRight: 40, backgroundColor: '#ffffff' },
      elements: [],
    });

    const name = (info['Title'] || filename.replace(/\.pdf$/i, '') || 'Imported PDF').slice(0, 80);
    return {
      name,
      description: 'Imported from ' + filename + ' — ' + pages.length + ' page(s)' + (info['Author'] ? '. Author: ' + info['Author'] : ''),
      pages, variables: [],
      importMeta: { originalFile: filename, pageCount: pages.length, pdfInfo: info },
    };
  }

  private chunksToElements(chunks: TextChunk[], pw: number, ph: number, pageIndex: number): any[] {
    if (!chunks.length) return [];

    // group into lines (Y within 5pt = same row)
    const lines: TextChunk[][] = [];
    let curLine: TextChunk[] = [], lastY = -99999;
    for (const c of chunks) {
      if (curLine.length > 0 && Math.abs(c.y - lastY) > 5) { lines.push(curLine); curLine = []; }
      curLine.push(c); lastY = c.y;
    }
    if (curLine.length > 0) lines.push(curLine);

    const elements: any[] = [];
    for (const line of lines) {
      const text = line.map(c => c.text).join('').replace(/\s+/g, ' ').trim();
      if (!text) continue;

      const x    = Math.max(0, Math.round(line[0].x));
      const y    = Math.max(0, Math.round(line[0].y));
      const fs   = Math.max(6, Math.round(line[0].fontSize));
      const last = line[line.length - 1];
      const estW = Math.round(last.x + last.text.length * last.fontSize * 0.55) - x + 20;
      const width = Math.max(60, Math.min(estW, pw - x - 20));

      if (x > pw + 10 || y > ph + 100) continue; // skip totally out-of-bounds

      elements.push({
        id: uuidv4(), type: 'text', pageIndex,
        x, y, width, height: fs + 8,
        content:    text,
        fontSize:   fs,
        fontFamily: 'Sarabun',
        fontWeight: fs >= 12 ? 'bold' : 'normal',
        fontStyle:  'normal',
        color:      '#111111',
        align:      'left',
        lineHeight: 1.4,
        padding:    0,
        opacity:    1,
        zIndex:     elements.length,
        label:      text.slice(0, 24),
      });
    }
    return elements;
  }
}