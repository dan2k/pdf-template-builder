import { Injectable, BadRequestException } from '@nestjs/common';
import { TemplatesService } from '../templates/templates.service';
import { FontService } from '../fonts/font.service';
import {
  TemplatePage, TemplateElement, TextElement,
  ImageElement, TableElement, ShapeElement, DividerElement, BarcodeElement, PageConfig,
  HeaderFooterConfig, PageNumberConfig,
} from '../templates/template.entity';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89], A3: [841.89, 1190.55],
  Letter: [612, 792], Legal: [612, 1008],
};

function resolveTemplate(text: string, data: Record<string, any>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const val = key.trim().split('.').reduce((o: any, k: string) => o?.[k], data);
    return val !== undefined && val !== null ? String(val) : '';
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const c = (hex || '#000000').replace('#', '');
  const n = parseInt(c.length === 3 ? c.split('').map((x: string) => x + x).join('') : c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function isBase64Image(str: string): boolean {
  if (!str || str.length < 100) return false;
  if (!/^[A-Za-z0-9+/=]+$/.test(str)) return false;
  try {
    const s = Buffer.from(str.substring(0, 20), 'base64');
    return (s[0] === 0x89 && s[1] === 0x50) || (s[0] === 0xFF && s[1] === 0xD8) ||
      (s[0] === 0x47 && s[1] === 0x49) || (s[0] === 0x52 && s[1] === 0x49);
  } catch { return false; }
}

// ─── Element renderer ─────────────────────────────────────────────────────────
class ElementRenderer {
  private imageCache = new Map<string, Buffer>();

  constructor(private doc: PDFKit.PDFDocument, private fontSvc: FontService) { }

  async render(el: TemplateElement, data: Record<string, any>, offsetY = 0) {
    const s = { ...el, y: el.y + offsetY } as any;
    switch (el.type) {
      case 'text': this.renderText(s, data); break;
      case 'image': await this.renderImage(s, data); break;
      case 'shape': this.renderShape(s); break;
      case 'divider': this.renderDivider(s); break;
      case 'barcode':
      case 'qrcode': this.renderBarcode(s, data); break;
      case 'group': await this.renderGroup(s, data, offsetY); break;
    }
  }

  async renderGroup(el: any, data: Record<string, any>, parentOffsetY = 0) {
    const children: any[] = el.children || [];
    for (const child of children) {
      const resolved = {
        ...child,
        x: el.x + child.x,
        y: el.y + child.y,
      };
      await this.render(resolved as TemplateElement, data, 0);
    }
  }

  renderText(el: TextElement, data: Record<string, any>) {
    const { doc, fontSvc } = this;
    const content = resolveTemplate(el.content || '', data);

    const padT = el.paddingTop ?? el.padding ?? 0;
    const padR = el.paddingRight ?? el.padding ?? 0;
    const padB = el.paddingBottom ?? el.padding ?? 0;
    const padL = el.paddingLeft ?? el.padding ?? 0;

    if (el.backgroundColor && el.backgroundColor !== 'transparent') {
      const [r, g, b] = hexToRgb(el.backgroundColor);
      if (el.borderRadius) doc.roundedRect(el.x, el.y, el.width, el.height, el.borderRadius).fill([r, g, b]);
      else doc.rect(el.x, el.y, el.width, el.height).fill([r, g, b]);
    }
    if (el.borderColor && el.borderWidth) {
      const [r, g, b] = hexToRgb(el.borderColor);
      if (el.borderRadius) doc.roundedRect(el.x, el.y, el.width, el.height, el.borderRadius).lineWidth(el.borderWidth).stroke([r, g, b]);
      else doc.rect(el.x, el.y, el.width, el.height).lineWidth(el.borderWidth).stroke([r, g, b]);
    }

    const opacity = el.opacity ?? 1;
    if (opacity < 1) doc.opacity(opacity);

    const [r, g, b] = hexToRgb(el.color || '#000000');
    const indent = el.indent || 0;
    const font = fontSvc.resolveFont(el.fontFamily || 'Helvetica', el.fontWeight || 'normal', el.fontStyle || 'normal');
    const fs = el.fontSize || 12;

    const textOpts: any = {
      width: el.width - padL - padR - indent,
      height: el.height - padT - padB,
      align: (el.align as any) || 'left',
      lineGap: el.lineHeight ? (el.lineHeight - 1) * fs : 0,
      indent,
      paragraphGap: el.paragraphGap || 0,
      features: el.features || ['kern'],
      underline: el.textDecoration === 'underline',
      strike: el.textDecoration === 'line-through',
      ellipsis: el.ellipsis || false,
      continued: el.continued || false,
      lineBreak: true,
      characterSpacing: el.characterSpacing || 0,
      wordSpacing: el.wordSpacing || 0,
    };
    if (el.link) textOpts.link = el.link;
    if (el.goTo) textOpts.goTo = el.goTo;
    if (el.destination) textOpts.destination = el.destination;

    doc.font(font).fontSize(fs).fillColor([r, g, b])
      .text(content, el.x + padL + indent, el.y + padT, textOpts);

    if (opacity < 1) doc.opacity(1);
  }

  async renderImage(el: ImageElement, data: Record<string, any>) {
    const { doc } = this;
    let src = el.src || '';
    if (el.bindingKey) { const v = resolveTemplate('{{' + el.bindingKey + '}}', data); if (v) src = v; }
    if (!src) return;

    const opts: any = { x: el.x, y: el.y };
    if (el.objectFit === 'contain' || el.fit) opts.fit = el.fit || [el.width, el.height];
    else if (el.objectFit === 'cover' || el.cover) opts.cover = el.cover || [el.width, el.height];
    else { opts.width = el.width; opts.height = el.height; }
    if (el.scale) opts.scale = el.scale;
    if (el.link) opts.link = el.link;

    const opacity = el.opacity ?? 1;
    if (opacity < 1) doc.opacity(opacity);

    try {
      let buffer: Buffer | null = null;
      let contentType: string | null = null;

      if (src.startsWith('data:')) {
        const parts = src.split(',');
        const meta = parts[0];
        const b64 = parts[1];
        buffer = Buffer.from(b64, 'base64');
        if (meta.includes('image/svg+xml')) contentType = 'image/svg+xml';
      }
      else if (isBase64Image(src)) {
        buffer = Buffer.from(src, 'base64');
      }
      else if (src.startsWith('http')) {
        buffer = this.imageCache.get(src) || null;
        if (!buffer) {
          const resp = await fetch(src);
          if (resp.ok) {
            contentType = resp.headers.get('content-type');
            buffer = Buffer.from(await resp.arrayBuffer());
            this.imageCache.set(src, buffer);
          }
        }
      }
      else if (src.startsWith('/uploads/')) {
        const fp = path.join(process.cwd(), src);
        if (fs.existsSync(fp)) buffer = fs.readFileSync(fp);
      }
      else if (fs.existsSync(src)) {
        buffer = fs.readFileSync(src);
      }

      if (buffer) {
        // --- Sharp conversion logic for non-native formats ---
        const isSvg = (contentType === 'image/svg+xml') || src.toLowerCase().endsWith('.svg') || buffer.slice(0, 100).toString().includes('<svg');

        if (isSvg) {
          const sharp = require('sharp');
          buffer = await sharp(buffer)
            .png()
            .toBuffer();
        }

        doc.image(buffer, opts);
      } else {
        console.warn('[GenerateService] Image not found or failed to fetch:', src.substring(0, 50));
      }
    } catch (e) {
      console.error('[GenerateService] Exception in renderImage:', (e as any).message, src.substring(0, 100));
    }

    if (el.borderColor && el.borderWidth) {
      const [r, g, b] = hexToRgb(el.borderColor);
      if (el.borderRadius) doc.roundedRect(el.x, el.y, el.width, el.height, el.borderRadius).lineWidth(el.borderWidth).stroke([r, g, b]);
      else doc.rect(el.x, el.y, el.width, el.height).lineWidth(el.borderWidth).stroke([r, g, b]);
    }
    if (opacity < 1) doc.opacity(1);
  }

  renderShape(el: ShapeElement) {
    const { doc } = this;
    const fill = el.fillColor && el.fillColor !== 'transparent' ? hexToRgb(el.fillColor) : null;
    const stroke = el.strokeColor ? hexToRgb(el.strokeColor) : null;
    const { x, y, width: w, height: h } = el;

    const opacity = el.opacity ?? 1;
    if (opacity < 1) doc.opacity(opacity);

    if (el.dash) doc.dash(el.dash, { space: el.dashSpace || el.dash });
    if (el.lineCap) doc.lineCap(el.lineCap);
    if (el.lineJoin) doc.lineJoin(el.lineJoin);
    if (el.miterLimit) doc.miterLimit(el.miterLimit);

    if (el.shape === 'line') {
      if (stroke) doc.moveTo(x, y).lineTo(x + w, y + h).lineWidth(el.strokeWidth || 1).stroke(stroke);
    } else if (el.shape === 'circle') {
      doc.circle(x + w / 2, y + h / 2, Math.min(w, h) / 2);
      this.applyFillStroke(doc, fill, stroke, el.strokeWidth);
    } else if (el.shape === 'ellipse') {
      doc.ellipse(x + w / 2, y + h / 2, w / 2, h / 2);
      this.applyFillStroke(doc, fill, stroke, el.strokeWidth);
    } else if (el.shape === 'triangle') {
      doc.moveTo(x + w / 2, y).lineTo(x + w, y + h).lineTo(x, y + h).closePath();
      this.applyFillStroke(doc, fill, stroke, el.strokeWidth);
    } else if (el.shape === 'polygon' && el.points?.length) {
      const pts = el.points;
      doc.moveTo(x + pts[0][0], y + pts[0][1]);
      for (let i = 1; i < pts.length; i++) doc.lineTo(x + pts[i][0], y + pts[i][1]);
      doc.closePath();
      this.applyFillStroke(doc, fill, stroke, el.strokeWidth);
    } else {
      if (el.borderRadius) doc.roundedRect(x, y, w, h, el.borderRadius);
      else doc.rect(x, y, w, h);
      this.applyFillStroke(doc, fill, stroke, el.strokeWidth);
    }

    if (el.dash) doc.undash();
    if (opacity < 1) doc.opacity(1);
    doc.lineCap('butt').lineJoin('miter');
  }

  renderBarcode(el: BarcodeElement, data: Record<string, any>) {
    const { doc, fontSvc } = this;
    const value = el.bindingKey
      ? resolveTemplate('{{' + el.bindingKey + '}}', data)
      : resolveTemplate(el.value || '', data);

    const [r, g, b] = hexToRgb(el.foregroundColor || '#000000');
    const [br, bg, bb] = hexToRgb(el.backgroundColor || '#ffffff');
    doc.rect(el.x, el.y, el.width, el.height).fill([br, bg, bb]);
    doc.rect(el.x, el.y, el.width, el.height).lineWidth(1).stroke([r, g, b]);

    const label = el.type === 'qrcode' ? '[QR: ' + value + ']' : '[BAR: ' + value + ']';
    const font = fontSvc.resolveFont('Helvetica', 'normal', 'normal');
    doc.font(font).fontSize(8).fillColor([r, g, b])
      .text(label, el.x + 4, el.y + el.height / 2 - 5, { width: el.width - 8, align: 'center', lineBreak: false });
  }

  private applyFillStroke(doc: PDFKit.PDFDocument, fill: any, stroke: any, sw?: number) {
    if (fill && stroke) doc.lineWidth(sw || 1).fillAndStroke(fill, stroke);
    else if (fill) doc.fill(fill);
    else if (stroke) doc.lineWidth(sw || 1).stroke(stroke);
  }

  renderDivider(el: DividerElement) {
    const { doc } = this;
    const [r, g, b] = hexToRgb(el.color || '#cccccc');
    const midY = el.y + el.height / 2;
    const thickness = el.thickness || 1;
    const opacity = el.opacity ?? 1;
    if (opacity < 1) doc.opacity(opacity);
    if (el.lineCap) doc.lineCap(el.lineCap);

    if (el.style === 'dashed') doc.dash(el.dash || 6, { space: el.dashSpace || 4 });
    else if (el.style === 'dotted') doc.dash(el.dash || 2, { space: el.dashSpace || 3 });
    else if (el.style === 'double') {
      const gap = Math.max(2, thickness);
      doc.moveTo(el.x, midY - gap).lineTo(el.x + el.width, midY - gap).lineWidth(thickness).stroke([r, g, b]);
      doc.moveTo(el.x, midY + gap).lineTo(el.x + el.width, midY + gap).lineWidth(thickness).stroke([r, g, b]);
      if (opacity < 1) doc.opacity(1);
      return;
    }
    doc.moveTo(el.x, midY).lineTo(el.x + el.width, midY).lineWidth(thickness).stroke([r, g, b]);
    if (el.style !== 'solid') doc.undash();
    if (el.lineCap) doc.lineCap('butt');
    if (opacity < 1) doc.opacity(1);
  }
}

// ─── Page renderer ────────────────────────────────────────────────────────────
class PageRenderer {
  elRenderer: ElementRenderer;

  constructor(
    private doc: PDFKit.PDFDocument,
    private pw: number, private ph: number,
    private config: PageConfig,
    private fontSvc: FontService,
  ) {
    this.elRenderer = new ElementRenderer(doc, fontSvc);
  }

  /** Render header zone on CURRENT pdf page */
  async renderHeader(hdr: HeaderFooterConfig, data: Record<string, any>) {
    const { doc, pw } = this;
    if (hdr.backgroundColor && hdr.backgroundColor !== 'transparent') {
      const [r, g, b] = hexToRgb(hdr.backgroundColor);
      doc.rect(0, 0, pw, hdr.height || 60).fill([r, g, b]);
    }
    for (const el of (hdr.elements || [])) await this.elRenderer.render(el, data, 0);
  }

  /** Render footer zone on CURRENT pdf page */
  async renderFooter(ftr: HeaderFooterConfig, data: Record<string, any>) {
    const { doc, pw, ph } = this;
    const footerY = ph - (ftr.height || 40);
    if (ftr.backgroundColor && ftr.backgroundColor !== 'transparent') {
      const [r, g, b] = hexToRgb(ftr.backgroundColor);
      doc.rect(0, footerY, pw, ftr.height || 40).fill([r, g, b]);
    }
    for (const el of (ftr.elements || [])) await this.elRenderer.render(el, data, footerY);
  }

  /** Render page number on CURRENT pdf page */
  renderPageNumber(pn: PageNumberConfig, currentPage: number, totalPages: number) {
    const { doc, pw, ph, fontSvc } = this;
    if (!pn.enabled || pn.position === 'none') return;
    const text = pn.format
      .replace(/\{page\}/g, String(currentPage))
      .replace(/\{total\}/g, String(totalPages));
    const font = fontSvc.resolveFont(pn.fontFamily || 'Helvetica', 'normal', 'normal');
    const [r, g, b] = hexToRgb(pn.color || '#666666');
    const fs = pn.fontSize || 10;
    const mg = pn.margin ?? 15;
    const tw = 150;
    let x = 0, y = 0, align = 'center';
    switch (pn.position) {
      case 'bottom-center': x = (pw - tw) / 2; y = ph - mg - fs; align = 'center'; break;
      case 'bottom-right': x = pw - tw - mg; y = ph - mg - fs; align = 'right'; break;
      case 'bottom-left': x = mg; y = ph - mg - fs; align = 'left'; break;
      case 'top-center': x = (pw - tw) / 2; y = mg; align = 'center'; break;
      case 'top-right': x = pw - tw - mg; y = mg; align = 'right'; break;
      case 'top-left': x = mg; y = mg; align = 'left'; break;
    }
    doc.font(font).fontSize(fs).fillColor([r, g, b])
      .text(text, x, y, { width: tw, align: align as any, lineBreak: false });
  }

  /**
   * Render one template page. Returns how many PDF pages were actually created.
   *
   * @param globalPageStart  The global PDF page number of the FIRST page created here (1-based)
   * @param totalPages       Pre-calculated total PDF pages across whole document
   */
  async render(
    elements: TemplateElement[],
    data: Record<string, any>,
    header: HeaderFooterConfig | undefined,
    footer: HeaderFooterConfig | undefined,
    pageNumber: PageNumberConfig | undefined,
    globalPageStart: number,
    totalPages: number,
  ): Promise<number> /* pages created */ {
    const { doc, pw, ph, config } = this;
    const headerH = header?.enabled ? (header.height || 60) : 0;
    const footerH = footer?.enabled ? (footer.height || 40) : 0;
    const marginTop = Math.max((config as any).marginTop || 20, headerH);
    const marginBottom = Math.max((config as any).marginBottom || 20, footerH);

    const drawBg = () => {
      if (config.backgroundColor && config.backgroundColor.toLowerCase() !== '#ffffff') {
        const [r, g, b] = hexToRgb(config.backgroundColor);
        doc.rect(0, 0, pw, ph).fill([r, g, b]);
      }
    };

    // Add first PDF page
    doc.addPage({ size: [pw, ph], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    drawBg();

    const rangeStart = doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1;
    const pdfPageRefs: number[] = [rangeStart];
    let pdfPageCount = 1;

    const sorted = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const tables = sorted.filter(e => e.type === 'table') as TableElement[];
    const statics = sorted.filter(e => e.type !== 'table');

    if (tables.length === 0) {
      for (const el of statics) await this.drawAt(el, el.y, data);
    } else {
      const flowTable = tables.reduce((a, b) => a.y <= b.y ? a : b);
      const tableTop = flowTable.y;

      for (const el of statics.filter(e => (e.y + e.height) <= tableTop || (e.y <= tableTop && e.y + e.height > tableTop))) {
        await this.drawAt(el, el.y, data);
      }

      let lastResult = { finalY: tableTop, overflowed: false, pagesAdded: 0 };
      for (const table of tables) {
        lastResult = this.renderFlowTable(table, data, drawBg, marginTop, marginBottom, pdfPageRefs);
        pdfPageCount += lastResult.pagesAdded;
      }

      for (const el of statics.filter(e => e.y > tableTop)) {
        const gap = el.y - (flowTable.y + flowTable.height);
        let drawY = lastResult.finalY + Math.max(0, gap);
        if (drawY + el.height > ph - marginBottom) {
          doc.addPage({ size: [pw, ph], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
          drawBg();
          pdfPageCount++;
          pdfPageRefs.push(doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1);
          drawY = marginTop;
        }
        await this.drawAt(el, drawY, data);
      }
    }

    // ── Apply header / footer / page number on every PDF page in this group ──
    for (let i = 0; i < pdfPageCount; i++) {
      try { doc.switchToPage(rangeStart + i); } catch { continue; }
      if (header?.enabled) await this.renderHeader(header, data);
      if (footer?.enabled) await this.renderFooter(footer, data);
      if (pageNumber?.enabled) {
        this.renderPageNumber(pageNumber, globalPageStart + i, totalPages);
      }
    }

    // Switch back to last page
    try { doc.switchToPage(rangeStart + pdfPageCount - 1); } catch { }

    return pdfPageCount;
  }

  private async drawAt(el: TemplateElement, atY: number, data: Record<string, any>) {
    await this.elRenderer.render({ ...el, y: atY } as any, data);
  }

  private renderFlowTable(
    el: TableElement, data: Record<string, any>,
    drawBg: () => void,
    marginTop: number, marginBottom: number,
    pdfPageRefs: number[],
  ): { finalY: number; overflowed: boolean; pagesAdded: number } {
    const { doc, pw, ph, fontSvc } = this;
    const rows: any[] = el.dataKey
      ? (el.dataKey.split('.').reduce((o: any, k) => o?.[k], data) || []) : [];
    const cols = el.columns || [];
    if (!cols.length) return { finalY: el.y, overflowed: false, pagesAdded: 0 };

    // ── resolved header style ────────────────────────────────────────────────
    const hCellPad = el.headerPadding ?? el.cellPadding ?? 4;
    const hFs = el.headerFontSize ?? el.fontSize ?? 10;
    const hFontFamily = el.headerFontFamily || el.fontFamily || 'Helvetica';
    const hFontWeight = el.headerFontWeight || 'bold';
    const hAlign = el.headerAlign || 'left';
    const hFont = fontSvc.resolveFont(hFontFamily, hFontWeight, 'normal');
    const headerH = hFs + hCellPad * 2 + 4;

    // ── resolved body style ──────────────────────────────────────────────────
    const bCellPad = el.cellPadding ?? 4;
    const bFs = el.fontSize ?? 10;
    const bFontFamily = el.fontFamily || 'Helvetica';
    const bFontWeight = el.bodyFontWeight || 'normal';
    const bAlign = el.bodyAlign || 'left';
    const rowH = bFs + bCellPad * 2 + 4;

    const borderW = el.borderWidth || 1;
    const innerBorderW = el.innerBorderWidth != null ? el.innerBorderWidth : borderW;
    const colWidths = cols.map(c => c.width ? (c.width / 100) * el.width : el.width / cols.length);

    const [hBr, hBg, hBb] = hexToRgb(el.headerBgColor || '#1a56db');
    const [hTr, hTg, hTb] = hexToRgb(el.headerTextColor || '#ffffff');
    const [bdr, bdg, bdb] = hexToRgb(el.borderColor || '#dee2e6');
    const [ibr, ibg, ibb] = hexToRgb(el.innerBorderColor || el.borderColor || '#dee2e6');

    const drawHeader = (y: number) => {
      let cx = el.x;
      for (let i = 0; i < cols.length; i++) {
        doc.rect(cx, y, colWidths[i], headerH).fill([hBr, hBg, hBb]);
        if (borderW > 0) doc.rect(cx, y, colWidths[i], headerH).lineWidth(borderW).stroke([bdr, bdg, bdb]);
        // per-column header align override, fallback to hAlign
        const colHAlign = (cols[i] as any).headerAlign || hAlign;
        doc.font(hFont).fontSize(hFs).fillColor([hTr, hTg, hTb])
          .text(cols[i].label || cols[i].key, cx + hCellPad, y + hCellPad,
            { width: colWidths[i] - hCellPad * 2, height: headerH - hCellPad * 2, align: colHAlign as any, lineBreak: false });
        cx += colWidths[i];
      }
      return y + headerH;
    };

    let curY = el.y, overflowed = false, pagesAdded = 0;
    curY = drawHeader(curY);

    for (let ri = 0; ri < rows.length; ri++) {
      if (curY + rowH > ph - marginBottom) {
        doc.addPage({ size: [pw, ph], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
        drawBg();
        pagesAdded++;
        pdfPageRefs.push(doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1);
        curY = marginTop; overflowed = true;
        if (el.repeatHeaderOnNewPage) curY = drawHeader(curY);
      }
      const row = rows[ri];
      const bg = (ri % 2 === 1 && el.altRowBgColor) ? el.altRowBgColor : (el.rowBgColor || '#ffffff');
      const [rr, rg, rb] = hexToRgb(bg);
      // body text color: column override → element rowTextColor → black
      const [rTr, rTg, rTb] = hexToRgb(el.rowTextColor || '#111827');
      let cx = el.x;
      for (let ci = 0; ci < cols.length; ci++) {
        const col = cols[ci];
        // per-column overrides: fontWeight, fontSize, align
        const cFontWeight = col.fontWeight || bFontWeight;
        const cFontSize = col.fontSize || bFs;
        const cAlign = (col.align || bAlign) as any;
        const cFont = fontSvc.resolveFont(bFontFamily, cFontWeight, 'normal');
        const val = String(row[col.key] ?? '');
        doc.rect(cx, curY, colWidths[ci], rowH).fill([rr, rg, rb]);
        // inner border (between cells)
        if (innerBorderW > 0) doc.rect(cx, curY, colWidths[ci], rowH).lineWidth(innerBorderW).stroke([ibr, ibg, ibb]);
        doc.font(cFont).fontSize(cFontSize).fillColor([rTr, rTg, rTb])
          .text(val, cx + bCellPad, curY + bCellPad,
            { width: colWidths[ci] - bCellPad * 2, height: rowH - bCellPad * 2, align: cAlign, lineBreak: false });
        cx += colWidths[ci];
      }
      curY += rowH;
    }
    return { finalY: curY, overflowed, pagesAdded };
  }
}

// ─── Main service ─────────────────────────────────────────────────────────────
@Injectable()
export class GenerateService {
  constructor(
    private templatesService: TemplatesService,
    private fontService: FontService,
  ) { }

  async generatePdf(templateId: string, data: Record<string, any>): Promise<Buffer> {
    const template = await this.templatesService.findOne(templateId);
    const pages: TemplatePage[] = (template as any).pages || [];
    if (!pages.length) throw new BadRequestException('Template has no pages');

    // Parse global header/footer setting
    // templates.service already parses it, but guard for both string and object
    let globalHF: any = null;
    const rawGHF = (template as any).globalHeaderFooter;
    if (rawGHF) {
      try {
        globalHF = typeof rawGHF === 'string' ? JSON.parse(rawGHF) : rawGHF;
      } catch { globalHF = null; }
    }
    console.log('[Generate] globalHF:', JSON.stringify(globalHF)?.substring(0, 200));

    // ── Step 1: Count exact total PDF pages (two-pass) ─────────────────────
    const totalPdfPages = this.countTotalPages(pages, data);

    const [pw0, ph0] = this.getPageDimensions(pages[0].config);
    const doc = new PDFDocument({
      autoFirstPage: false, size: [pw0, ph0],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', c => chunks.push(c));
    const endPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // ── Step 2: Render each template page ─────────────────────────────────
    let globalPageStart = 1; // global PDF page counter (1-based)

    for (const page of pages) {
      const [pw, ph] = this.getPageDimensions(page.config);
      const renderer = new PageRenderer(doc, pw, ph, page.config, this.fontService);
      const visible = (page.elements || []).filter((e: any) => !e.hidden);

      // Resolve which header/footer/pageNumber to use
      const hdr = this.resolveHF('header', page, globalHF);
      const ftr = this.resolveHF('footer', page, globalHF);
      const pn = this.resolvePN(page, globalHF);

      const pagesCreated = await renderer.render(
        visible, data, hdr, ftr, pn,
        globalPageStart, totalPdfPages,
      );

      globalPageStart += pagesCreated; // advance EXACTLY by how many pdf pages were created
    }

    doc.flushPages();
    doc.end();

    return endPromise;
  }

  /** Resolve header or footer:
   *  - applyToAllPages=true  → always use globalHF (ignores per-page setting)
   *  - applyToAllPages=false → use per-page setting
   */
  private resolveHF(
    zone: 'header' | 'footer',
    page: TemplatePage,
    globalHF: any,
  ): HeaderFooterConfig | undefined {
    if (globalHF?.applyToAllPages === true) {
      const g = globalHF[zone] as HeaderFooterConfig | undefined;
      if (g?.enabled) {
        console.log('[Generate] Using global ' + zone + ' with ' + (g.elements?.length || 0) + ' elements');
        return g;
      }
      return undefined;
    }
    const cfg = (page as any)[zone] as HeaderFooterConfig | undefined;
    return cfg?.enabled ? cfg : undefined;
  }

  private resolvePN(page: TemplatePage, globalHF: any): PageNumberConfig | undefined {
    if (globalHF?.applyToAllPages === true) {
      const g = globalHF.pageNumber as PageNumberConfig | undefined;
      return g?.enabled ? g : undefined;
    }
    return page.pageNumber?.enabled ? page.pageNumber : undefined;
  }

  /**
   * Count EXACT total PDF pages by simulating the layout without rendering.
   * This gives accurate {total} for page numbers.
   */
  private countTotalPages(pages: TemplatePage[], data: Record<string, any>): number {
    let total = 0;
    for (const page of pages) {
      total += this.countPdfPagesForTemplatePage(page, data);
    }
    return Math.max(total, 1);
  }

  private countPdfPagesForTemplatePage(page: TemplatePage, data: Record<string, any>): number {
    const [, ph] = this.getPageDimensions(page.config);
    const tables = (page.elements || []).filter(e => e.type === 'table') as TableElement[];
    if (!tables.length) return 1;

    const marginTop = (page.config as any).marginTop || 20;
    const marginBottom = (page.config as any).marginBottom || 20;

    let maxPagesFromTables = 1;
    for (const t of tables) {
      const rows: any[] = t.dataKey
        ? (t.dataKey.split('.').reduce((o: any, k) => o?.[k], data) || []) : [];
      const cellPad = t.cellPadding || 4;
      const fs = t.fontSize || 10;
      const headerH = fs + cellPad * 2 + 4;
      const rowH = fs + cellPad * 2 + 4;
      const availFirst = ph - t.y - headerH - marginBottom;                    // space on first page after header
      const availNext = ph - marginTop - marginBottom - (t.repeatHeaderOnNewPage ? headerH : 0); // space on subsequent pages

      if (rows.length === 0) continue;

      const rowsOnFirst = Math.max(0, Math.floor(availFirst / rowH));
      if (rows.length <= rowsOnFirst) { maxPagesFromTables = Math.max(maxPagesFromTables, 1); continue; }

      const remaining = rows.length - rowsOnFirst;
      const rowsPerNext = Math.max(1, Math.floor(availNext / rowH));
      const extraPages = Math.ceil(remaining / rowsPerNext);
      maxPagesFromTables = Math.max(maxPagesFromTables, 1 + extraPages);
    }
    return maxPagesFromTables;
  }

  private getPageDimensions(config: PageConfig): [number, number] {
    let [w, h] = PAGE_SIZES[config?.size] || PAGE_SIZES['A4'];
    if (config?.size === 'custom' && config.width && config.height) { w = config.width; h = config.height; }
    if (config?.orientation === 'landscape') return [h, w];
    return [w, h];
  }
}
