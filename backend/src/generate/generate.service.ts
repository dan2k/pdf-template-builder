import { Injectable, BadRequestException } from '@nestjs/common';
import { TemplatesService } from '../templates/templates.service';
import { FontService } from '../fonts/font.service';
import {
  TemplatePage, TemplateElement, TextElement,
  ImageElement, TableElement, ShapeElement, DividerElement, BarcodeElement, PageConfig,
  HeaderFooterConfig, PageNumberConfig, RichBlock, ListBlock, ListItem,
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
      case 'text':
        if ((s as TextElement).richMode && (s as TextElement).richContent?.length) {
          this.renderRichText(s, data);
        } else {
          this.renderText(s, data);
        }
        break;
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

  renderRichText(el: TextElement, data: Record<string, any>) {
    const { doc, fontSvc } = this;
    const blocks: RichBlock[] = el.richContent || [];

    const padT = el.paddingTop ?? el.padding ?? 0;
    const padR = el.paddingRight ?? el.padding ?? 0;
    const padB = el.paddingBottom ?? el.padding ?? 0;
    const padL = el.paddingLeft ?? el.padding ?? 0;

    // Draw background & border (same as renderText)
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

    const contentWidth = el.width - padL - padR;
    let curY = el.y + padT;
    const maxY = el.y + el.height - padB;
    const baseFontSize = el.fontSize || 12;
    const baseColor = el.color || '#000000';
    const baseFontFamily = el.fontFamily || 'Helvetica';
    const baseAlign = el.align || 'left';
    const lineGap = el.lineHeight ? (el.lineHeight - 1) * baseFontSize : 0;

    const HEADING_SIZES = { 1: 1.8, 2: 1.4, 3: 1.15 };
    const INDENT_PX = 20;

    // ── Marker helpers ──────────────────────────────────────────────────────
    const UNORDERED_MARKERS: Record<string, string[]> = {
      disc:   ['●', '○', '■'],
      circle: ['○', '◦', '▪'],
      square: ['■', '▪', '▫'],
      dash:   ['–', '–', '–'],
      arrow:  ['▸', '▹', '▸'],
      check:  ['✓', '✓', '✓'],
    };

    const toRoman = (n: number, upper: boolean): string => {
      const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
      const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
      let r = ''; for (let i = 0; i < vals.length; i++) { while (n >= vals[i]) { r += syms[i]; n -= vals[i]; } }
      return upper ? r : r.toLowerCase();
    };

    const toAlpha = (n: number, upper: boolean): string => {
      let r = ''; while (n > 0) { n--; r = String.fromCharCode(65 + (n % 26)) + r; n = Math.floor(n / 26); }
      return upper ? r : r.toLowerCase();
    };

    const THAI_DIGITS = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'];
    const toThai = (n: number): string => String(n).split('').map(d => THAI_DIGITS[+d]).join('');

    const isOrdered = (s: string) => ['decimal','decimal-zero','lower-alpha','upper-alpha','lower-roman','upper-roman','thai'].includes(s);

    const getOrderedMarker = (style: string, num: number): string => {
      switch (style) {
        case 'decimal':      return `${num}.`;
        case 'decimal-zero': return `${String(num).padStart(2, '0')}.`;
        case 'lower-alpha':  return `${toAlpha(num, false)}.`;
        case 'upper-alpha':  return `${toAlpha(num, true)}.`;
        case 'lower-roman':  return `${toRoman(num, false)}.`;
        case 'upper-roman':  return `${toRoman(num, true)}.`;
        case 'thai':         return `${toThai(num)}.`;
        default:             return `${num}.`;
      }
    };

    const getUnorderedMarker = (style: string, level: number): string => {
      const chars = UNORDERED_MARKERS[style] || UNORDERED_MARKERS['disc'];
      return chars[Math.min(level, chars.length - 1)];
    };

    for (const block of blocks) {
      if (curY >= maxY) break;

      const blockIndent = (block.indent || 0) * INDENT_PX;
      const blockAlign = (block.align || baseAlign) as any;
      const blockColor = block.color || baseColor;
      const [cr, cg, cb] = hexToRgb(blockColor);
      const isBold = block.bold ?? (el.fontWeight === 'bold');
      const isItalic = block.italic ?? (el.fontStyle === 'italic');
      const fontWeight = isBold ? 'bold' : 'normal';
      const fontStyle = isItalic ? 'italic' : 'normal';

      if (block.type === 'heading') {
        const scale = HEADING_SIZES[block.level] || 1;
        const fs = Math.round(baseFontSize * scale);
        const font = fontSvc.resolveFont(baseFontFamily, 'bold', fontStyle);
        const text = resolveTemplate(block.text || '', data);
        const blockGap = fs * 0.4;

        doc.font(font).fontSize(fs).fillColor([cr, cg, cb]);
        doc.text(text, el.x + padL + blockIndent, curY, {
          width: contentWidth - blockIndent,
          align: blockAlign,
          lineGap: lineGap,
          lineBreak: true,
        });
        curY = doc.y + blockGap;

      } else if (block.type === 'list') {
        const font = fontSvc.resolveFont(baseFontFamily, fontWeight, fontStyle);
        const listBlock = block as ListBlock;
        const listStyle = listBlock.style || 'disc';
        const startNum = listBlock.startNumber || 1;
        const markerWidth = INDENT_PX;

        // Resolve items: static items or dynamic from data
        let resolvedItems: ListItem[] = [];

        if (listBlock.dataKey) {
          // Dynamic binding: pull array from data
          const arr = listBlock.dataKey.split('.').reduce((o: any, k) => o?.[k], data);
          if (Array.isArray(arr)) {
            const tpl = listBlock.itemTemplate || '{{.}}';
            // checkedKey: resolve which items are checked
            const checkedSet = new Set<string>();
            if (listBlock.checkedKey) {
              const cv = listBlock.checkedKey.split('.').reduce((o: any, k) => o?.[k], data);
              if (Array.isArray(cv)) cv.forEach((v: any) => checkedSet.add(String(v)));
            }
            resolvedItems = arr.map((item: any, idx: number) => {
              let text: string;
              let itemChecked = false;
              if (typeof item === 'string' || typeof item === 'number') {
                text = tpl.replace(/\{\{\.\}\}/g, String(item));
                text = resolveTemplate(text, { ...data, item });
                itemChecked = checkedSet.has(String(item));
              } else if (typeof item === 'object' && item !== null) {
                text = resolveTemplate(tpl, { ...data, ...item, item });
                itemChecked = !!(item.checked ?? (checkedSet.has(String(item.value ?? item.name ?? idx))));
              } else {
                text = String(item ?? '');
              }
              return { text, indent: 0, checked: itemChecked };
            });
          }
        }

        if (resolvedItems.length === 0) {
          // Static items (backward compat: items can be string[] or ListItem[])
          const rawItems = listBlock.items || [];
          resolvedItems = rawItems.map((it: any) => {
            if (typeof it === 'string') return { text: resolveTemplate(it, data) || it, indent: 0, checked: false };
            return { text: resolveTemplate(it.text || '', data) || it.text || '', indent: it.indent || 0, style: it.style, checked: !!it.checked };
          });
          // Filter out completely empty items
          resolvedItems = resolvedItems.filter(it => it.text.trim() !== '');
        }

        let orderedCounter = startNum;

        // ── Draw unordered marker as vector graphic ─────────────────────────
        // cy = vertical midpoint of Thai text body (between ascender and baseline)
        const drawVectorMarker = (style: string, level: number, cx: number, cy: number, size: number, checked = false) => {
          const r = size / 2;
          doc.fillColor([cr, cg, cb]);
          doc.strokeColor([cr, cg, cb]);

          if (style === 'disc') {
            const radii = [r, r * 0.75, r * 0.55];
            const rad = radii[Math.min(level, radii.length - 1)];
            doc.circle(cx, cy, rad).fill([cr, cg, cb]);
          } else if (style === 'circle') {
            const rad = r * 0.85;
            doc.circle(cx, cy, rad).lineWidth(size * 0.12).stroke([cr, cg, cb]);
          } else if (style === 'square') {
            const lvlScale = [0.85, 0.65, 0.5];
            const sc = lvlScale[Math.min(level, lvlScale.length - 1)];
            const ss = size * sc;
            doc.rect(cx - ss / 2, cy - ss / 2, ss, ss).fill([cr, cg, cb]);
          } else if (style === 'dash') {
            const w = size * 1.0;
            doc.moveTo(cx - w / 2, cy).lineTo(cx + w / 2, cy).lineWidth(size * 0.15).stroke([cr, cg, cb]);
          } else if (style === 'arrow') {
            const s = size * 0.75;
            doc.moveTo(cx - s / 3, cy - s / 2)
              .lineTo(cx + s / 2, cy)
              .lineTo(cx - s / 3, cy + s / 2)
              .closePath().fill([cr, cg, cb]);
          } else if (style === 'check') {
            const fs = baseFontSize;
            const lw = Math.max(0.7, fs * 0.055);
            doc.moveTo(cx - fs * 0.2, cy + fs * 0.02)
              .lineTo(cx - fs * 0.02, cy + fs * 0.3)
              .lineTo(cx + fs * 0.25, cy - fs * 0.3)
              .lineWidth(lw)
              .lineJoin('round')
              .lineCap('round')
              .stroke([cr, cg, cb]);
            doc.lineJoin('miter').lineCap('butt');
          } else if (style === 'checkbox') {
            const fs = baseFontSize;
            const boxSize = fs * 0.6;
            const bx = cx - boxSize / 2;
            const by = cy - boxSize / 2;
            const lw = Math.max(0.7, fs * 0.045);
            // Draw box
            doc.rect(bx, by, boxSize, boxSize).lineWidth(lw).stroke([cr, cg, cb]);
            // Draw checkmark inside if checked
            if (checked) {
              const m = boxSize * 0.18;
              const clw = Math.max(1, fs * 0.07);
              doc.moveTo(bx + m, cy + boxSize * 0.02)
                .lineTo(bx + boxSize * 0.4, by + boxSize - m)
                .lineTo(bx + boxSize - m, by + m)
                .lineWidth(clw)
                .lineJoin('round')
                .lineCap('round')
                .stroke([cr, cg, cb]);
              doc.lineJoin('miter').lineCap('butt');
            }
          } else if (style === 'radio') {
            const fs = baseFontSize;
            const outerR = fs * 0.3;
            const lw = Math.max(0.7, fs * 0.045);
            // Draw outer circle
            doc.circle(cx, cy, outerR).lineWidth(lw).stroke([cr, cg, cb]);
            // Draw filled inner circle if checked
            if (checked) {
              const innerR = outerR * 0.5;
              doc.circle(cx, cy, innerR).fill([cr, cg, cb]);
            }
          }
        };

        for (let i = 0; i < resolvedItems.length; i++) {
          if (curY >= maxY) break;
          const item = resolvedItems[i];
          const itemLevel = (block.indent || 0) + (item.indent || 0);
          const itemIndent = itemLevel * INDENT_PX;
          const itemStyle = item.style || listStyle;

          if (isOrdered(itemStyle)) {
            const marker = getOrderedMarker(itemStyle, orderedCounter);
            orderedCounter++;
            doc.font(font).fontSize(baseFontSize).fillColor([cr, cg, cb]);
            doc.text(marker, el.x + padL + itemIndent, curY, {
              width: markerWidth,
              align: 'right' as any,
              lineBreak: false,
              continued: false,
            });
          } else {
            // All markers: cy at vertical center of Thai text x-height
            const markerSize = baseFontSize * 0.55;
            const markerCx = el.x + padL + itemIndent + markerWidth - markerSize * 0.5;
            const markerCy = curY + baseFontSize * 0.78;
            drawVectorMarker(itemStyle, itemLevel, markerCx, markerCy, markerSize, !!(item as any).checked);
          }

          // Render item text with the user's chosen font
          doc.font(font).fontSize(baseFontSize).fillColor([cr, cg, cb]);
          doc.text(item.text, el.x + padL + itemIndent + markerWidth + 4, curY, {
            width: contentWidth - itemIndent - markerWidth - 4,
            align: blockAlign,
            lineGap: lineGap,
            lineBreak: true,
          });
          curY = doc.y + 2;
        }
        curY += baseFontSize * 0.3;

      } else {
        // paragraph
        const font = fontSvc.resolveFont(baseFontFamily, fontWeight, fontStyle);
        const text = resolveTemplate((block as any).text || '', data);

        doc.font(font).fontSize(baseFontSize).fillColor([cr, cg, cb]);
        doc.text(text, el.x + padL + blockIndent, curY, {
          width: contentWidth - blockIndent,
          align: blockAlign,
          lineGap: lineGap,
          paragraphGap: el.paragraphGap || 0,
          lineBreak: true,
        });
        curY = doc.y + (el.paragraphGap || baseFontSize * 0.3);
      }
    }

    if (opacity < 1) doc.opacity(1);
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

    const sorted = [...elements].sort((a, b) => (a.y || 0) - (b.y || 0) || (a.zIndex || 0) - (b.zIndex || 0));
    // Flow tables = tables with dataKey (dynamic data, can overflow pages)
    const flowTables = sorted.filter(e => e.type === 'table' && (e as TableElement).dataKey) as TableElement[];
    // Everything else (including static tables) renders at fixed position
    const fixedEls = sorted.filter(e => !(e.type === 'table' && (e as TableElement).dataKey));

    if (flowTables.length === 0) {
      // No flow tables — render everything at fixed Y
      for (const el of sorted) {
        if (el.type === 'table') {
          this.renderFlowTable(el as TableElement, data, drawBg, marginTop, marginBottom, pdfPageRefs);
        } else {
          await this.drawAt(el, el.y, data);
        }
      }
    } else {
      const flowTable = flowTables.reduce((a, b) => a.y <= b.y ? a : b);
      const tableTop = flowTable.y;

      // Render fixed elements ABOVE the first flow table
      for (const el of fixedEls.filter(e => e.y < tableTop)) {
        if (el.type === 'table') {
          this.renderFlowTable(el as TableElement, data, drawBg, marginTop, marginBottom, pdfPageRefs);
        } else {
          await this.drawAt(el, el.y, data);
        }
      }

      // Render flow tables
      let lastResult = { finalY: tableTop, overflowed: false, pagesAdded: 0 };
      for (const table of flowTables) {
        lastResult = this.renderFlowTable(table, data, drawBg, marginTop, marginBottom, pdfPageRefs);
        pdfPageCount += lastResult.pagesAdded;
      }

      // Render fixed elements BELOW the first flow table (shifted by flow)
      for (const el of fixedEls.filter(e => e.y >= tableTop)) {
        const gap = el.y - (flowTable.y + flowTable.height);
        let drawY = lastResult.finalY + Math.max(0, gap);
        if (drawY + el.height > ph - marginBottom) {
          doc.addPage({ size: [pw, ph], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
          drawBg();
          pdfPageCount++;
          pdfPageRefs.push(doc.bufferedPageRange().start + doc.bufferedPageRange().count - 1);
          drawY = marginTop;
        }
        if (el.type === 'table') {
          // Static table below flow table
          const savedY = (el as any).y;
          (el as any).y = drawY;
          this.renderFlowTable(el as TableElement, data, drawBg, marginTop, marginBottom, pdfPageRefs);
          (el as any).y = savedY;
        } else {
          await this.drawAt(el, drawY, data);
        }
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
      ? (el.dataKey.split('.').reduce((o: any, k) => o?.[k], data) || [])
      : ((el as any).staticRows || []);
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
        ? (t.dataKey.split('.').reduce((o: any, k) => o?.[k], data) || [])
        : ((t as any).staticRows || []);
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
