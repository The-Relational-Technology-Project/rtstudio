export type FieldNoteBlockType = "text" | "image" | "divider";

export interface FieldNoteBlock {
  id: string;
  type: FieldNoteBlockType;
  x: number;
  y: number;
  width?: number;
  text?: string;
  src?: string; // data URL for images
}

export interface FieldNoteStroke {
  id: string;
  // SVG path "d" attribute
  d: string;
  color: string;
  width: number;
}

export interface FieldNoteCanvas {
  blocks: FieldNoteBlock[];
  strokes: FieldNoteStroke[];
}

export interface FieldNoteRecord {
  id: string;
  user_id: string;
  title: string | null;
  canvas_data: FieldNoteCanvas;
  is_public: boolean;
  reminder_at: string | null;
  reminder_channel: "email" | "sms" | "studio" | null;
  reminder_contact: string | null;
  reminder_dismissed: boolean;
  date_created: string;
  date_edited: string | null;
}

export const EMPTY_CANVAS: FieldNoteCanvas = { blocks: [], strokes: [] };
