import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';

import { User } from '../users/user.entity';

export enum TemplateVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface PageConfig {
  size: 'A4' | 'A3' | 'Letter' | 'Legal' | 'custom';
  orientation: 'portrait' | 'landscape';
  width?: number;
  height?: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  backgroundColor?: string;
}

export type ElementType = 'text' | 'image' | 'table' | 'shape' | 'divider' | 'barcode' | 'qrcode' | 'group';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  zIndex?: number;
  hidden?: boolean;
  locked?: boolean;
  opacity?: number;           // 0–1
  rotation?: number;          // degrees
  label?: string;             // editor display name
}

// ─── RICH CONTENT BLOCKS ─────────────────────────────────────────────────────
export type RichBlockType = 'paragraph' | 'heading' | 'list';

export interface RichBlockBase {
  type: RichBlockType;
  align?: 'left' | 'center' | 'right' | 'justify';
  indent?: number;            // indent level (0, 1, 2...)
  color?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface ParagraphBlock extends RichBlockBase {
  type: 'paragraph';
  text: string;
}

export interface HeadingBlock extends RichBlockBase {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

export interface ListBlock extends RichBlockBase {
  type: 'list';
  style: 'disc' | 'circle' | 'square' | 'dash' | 'arrow' | 'check' | 'checkbox' | 'radio' | 'decimal' | 'decimal-zero' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman' | 'thai';
  items: ListItem[];
  startNumber?: number;
  dataKey?: string;
  itemTemplate?: string;
  checkedKey?: string;        // dynamic binding: key to boolean or array of checked values
}

export interface ListItem {
  text: string;
  indent?: number;
  style?: ListBlock['style'];
  checked?: boolean;          // for checkbox/radio: is this item checked?
}

export type RichBlock = ParagraphBlock | HeadingBlock | ListBlock;

// ─── TEXT ────────────────────────────────────────────────────────────────────
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  // Rich text mode
  richMode?: boolean;
  richContent?: RichBlock[];
  // Typography
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  // Layout
  align: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  characterSpacing?: number;  // PDFKit: characterSpacing
  wordSpacing?: number;       // PDFKit: wordSpacing
  indent?: number;            // PDFKit: indent
  paragraphGap?: number;      // PDFKit: paragraphGap
  // Decoration
  textDecoration?: 'none' | 'underline' | 'line-through';
  // Box
  backgroundColor?: string;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  // Ellipsis/clipping
  ellipsis?: boolean;         // PDFKit: ellipsis
  // Binding
  bindingKey?: string;
  // Advanced PDFKit
  continued?: boolean;        // PDFKit: continued (inline text chain)
  features?: string[];        // PDFKit: OpenType features e.g. ['kern','liga']
  fill?: boolean;
  stroke?: boolean;
  link?: string;              // PDFKit: link annotation
  goTo?: string;              // PDFKit: internal go-to link
  destination?: string;
  oblique?: boolean;          // PDFKit: oblique (synthetic italic)
  baseline?: 'alphabetic' | 'top' | 'middle' | 'bottom' | 'ideographic' | 'hanging';
}

// ─── IMAGE ───────────────────────────────────────────────────────────────────
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  objectFit: 'fill' | 'contain' | 'cover';
  // Styling
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  // PDFKit image options
  scale?: number;             // PDFKit: scale factor
  fit?: [number, number];     // PDFKit: fit [w, h]
  cover?: [number, number];   // PDFKit: cover [w, h]
  // Binding
  bindingKey?: string;
  // Link annotation
  link?: string;
}

// ─── TABLE ───────────────────────────────────────────────────────────────────
export interface TableColumn {
  key: string;
  label: string;
  width?: number;             // percentage of table width
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  format?: string;            // e.g. 'currency', 'number', 'date', 'percent'
  prefix?: string;
  suffix?: string;
  wrap?: boolean;             // allow cell text wrap
}

export interface TableElement extends BaseElement {
  type: 'table';
  columns: TableColumn[];
  dataKey: string;
  staticRows?: Record<string, any>[];  // static data rows (used when dataKey is empty)
  // Header styling
  headerBgColor: string;
  headerTextColor: string;
  headerFontSize?: number;
  headerFontWeight?: 'normal' | 'bold';
  headerFontFamily?: string;
  headerAlign?: 'left' | 'center' | 'right';
  headerPadding?: number;
  headerBorderColor?: string;
  headerBorderWidth?: number;
  showHeader?: boolean;
  // Row styling
  rowBgColor: string;
  altRowBgColor?: string;
  rowTextColor?: string;
  bodyFontWeight?: 'normal' | 'bold';
  bodyAlign?: 'left' | 'center' | 'right';
  // Border
  borderColor: string;
  borderWidth: number;
  innerBorderColor?: string;
  innerBorderWidth?: number;
  // Typography
  fontSize: number;
  fontFamily?: string;
  cellPadding: number;
  cellPaddingH?: number;
  cellPaddingV?: number;
  // Behavior
  repeatHeaderOnNewPage: boolean;
  maxRowsPerPage?: number;
  // Footer
  showFooter?: boolean;
  footerText?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  // Summary row (aggregates)
  showSummary?: boolean;
  summaryLabel?: string;
  summaryKey?: string;
  summaryType?: 'sum' | 'count' | 'avg' | 'custom';
  summaryCustomText?: string;
}

// ─── SHAPE ───────────────────────────────────────────────────────────────────
export interface ShapeElement extends BaseElement {
  type: 'shape';
  shape: 'rectangle' | 'circle' | 'ellipse' | 'line' | 'polygon' | 'triangle';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;      // for rounded rectangle
  // Line-specific
  dash?: number;              // PDFKit: dash length
  dashSpace?: number;         // PDFKit: dash gap
  lineCap?: 'butt' | 'round' | 'square';   // PDFKit: lineCap
  lineJoin?: 'miter' | 'round' | 'bevel';  // PDFKit: lineJoin
  miterLimit?: number;
  // Fill options
  fillOpacity?: number;
  strokeOpacity?: number;
  // Polygon points (for polygon/triangle)
  points?: Array<[number, number]>;
  // Gradient (stored as config, applied at render)
  gradient?: {
    type: 'linear' | 'radial';
    stops: Array<{ offset: number; color: string; opacity?: number }>;
    x1?: number; y1?: number; x2?: number; y2?: number;
  };
  // Shadow
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

// ─── DIVIDER ─────────────────────────────────────────────────────────────────
export interface DividerElement extends BaseElement {
  type: 'divider';
  color: string;
  thickness: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double';
  dash?: number;
  dashSpace?: number;
  lineCap?: 'butt' | 'round' | 'square';
}

// ─── BARCODE / QR ────────────────────────────────────────────────────────────
export interface BarcodeElement extends BaseElement {
  type: 'barcode' | 'qrcode';
  value: string;           // static value or {{variable}}
  bindingKey?: string;
  format?: string;         // barcode: 'CODE128','EAN13','QR', etc.
  // QR options
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  // Display
  showText?: boolean;
  textPosition?: 'bottom' | 'top';
  foregroundColor?: string;
  backgroundColor?: string;
}

export interface GroupElement extends BaseElement {
  type: 'group';
  children: TemplateElement[];
}

export type TemplateElement =
  | TextElement
  | ImageElement
  | TableElement
  | ShapeElement
  | DividerElement
  | BarcodeElement
  | GroupElement;

// ─── HEADER / FOOTER ─────────────────────────────────────────────────────────
export type PageNumberPosition =
  | 'none' | 'bottom-center' | 'bottom-right' | 'bottom-left'
  | 'top-center' | 'top-right' | 'top-left';

export interface HeaderFooterConfig {
  enabled: boolean;
  height: number;
  backgroundColor?: string;
  elements: TemplateElement[];
}

export interface PageNumberConfig {
  enabled: boolean;
  position: PageNumberPosition;
  format: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  margin: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  opacity?: number;
}

export interface GlobalHeaderFooter {
  applyToAllPages: boolean;
  header?: HeaderFooterConfig;
  footer?: HeaderFooterConfig;
  pageNumber?: PageNumberConfig;
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export interface TemplatePage {
  id: string;
  config: PageConfig;
  elements: TemplateElement[];
  header?: HeaderFooterConfig;
  footer?: HeaderFooterConfig;
  pageNumber?: PageNumberConfig;
}

// ─── TEMPLATE ENTITY ─────────────────────────────────────────────────────────
@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'varchar', default: TemplateVisibility.PRIVATE })
  visibility: TemplateVisibility;

  @Column({ type: 'int', default: 0 })
  allowCopy: boolean;

  @Column({ type: 'text', default: '[]' })
  pages: string;

  @Column({ type: 'text', nullable: true })
  variables: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  tags: string;

  @Column({ type: 'text', nullable: true })
  globalHeaderFooter: string;

  @Column({ type: 'int', default: 1 })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}