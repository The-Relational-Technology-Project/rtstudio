import { useRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldNoteCanvas, EMPTY_CANVAS, FieldNoteBlock } from "@/types/fieldNote";
import { FieldNoteCanvasArea } from "./FieldNoteCanvas";
import {
  Undo2,
  Redo2,
  Type,
  Pencil,
  Eraser,
  Minus,
  ImagePlus,
  Save,
  ArrowLeft,
} from "lucide-react";

interface Props {
  initialTitle?: string;
  initialCanvas?: FieldNoteCanvas;
  onSave: (data: { title: string; canvas: FieldNoteCanvas; changed: boolean }) => void;
  onBack: () => void;
  saving?: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const FieldNoteEditor = ({
  initialTitle = "",
  initialCanvas = EMPTY_CANVAS,
  onSave,
  onBack,
  saving = false,
}: Props) => {
  const [title, setTitle] = useState(initialTitle);
  const [history, setHistory] = useState<FieldNoteCanvas[]>([initialCanvas]);
  const [cursor, setCursor] = useState(0);
  const [mode, setMode] = useState<"text" | "draw" | "erase">("text");
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvas = history[cursor];
  const initialSerialized = useMemo(() => JSON.stringify(initialCanvas), [initialCanvas]);

  const pushHistory = (next: FieldNoteCanvas) => {
    const newHistory = history.slice(0, cursor + 1);
    newHistory.push(next);
    // cap history at 50
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setCursor(newHistory.length - 1);
  };

  const handleCanvasChange = (next: FieldNoteCanvas) => pushHistory(next);

  const undo = () => setCursor((c) => Math.max(0, c - 1));
  const redo = () => setCursor((c) => Math.min(history.length - 1, c + 1));

  const addDivider = () => {
    pushHistory({
      ...canvas,
      blocks: [
        ...canvas.blocks,
        { id: uid(), type: "divider", x: 40, y: 40 + canvas.blocks.length * 20 },
      ],
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      pushHistory({
        ...canvas,
        blocks: [
          ...canvas.blocks,
          { id: uid(), type: "image", x: 60, y: 60, src },
        ],
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = () => {
    const changed = JSON.stringify(canvas) !== initialSerialized || title !== initialTitle;
    onSave({ title: title.trim(), canvas, changed });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <p className="font-fraunces text-lg text-muted-foreground italic mb-4 leading-relaxed">
        What do you notice right now — in yourself, in your neighbors, and in your place?
      </p>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give this note a name (optional)"
        className="mb-4 font-fraunces text-lg bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-card border border-border rounded-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={cursor === 0}
          title="Undo"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={cursor === history.length - 1}
          title="Redo"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          variant={mode === "text" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMode("text")}
          title="Text mode (click canvas to add)"
        >
          <Type className="h-4 w-4 mr-1" />
          Text
        </Button>
        <Button
          variant={mode === "draw" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMode("draw")}
          title="Draw mode"
        >
          <Pencil className="h-4 w-4 mr-1" />
          Draw
        </Button>
        <Button
          variant={mode === "erase" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMode("erase")}
          title="Eraser (click a stroke to remove)"
        >
          <Eraser className="h-4 w-4 mr-1" />
          Erase
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} title="Add image">
          <ImagePlus className="h-4 w-4 mr-1" />
          Image
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <Button variant="ghost" size="sm" onClick={addDivider} title="Add divider">
          <Minus className="h-4 w-4 mr-1" />
          Divider
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground italic hidden sm:inline">
            There is no autosave.
          </span>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic sm:hidden mb-3">There is no autosave.</p>

      <FieldNoteCanvasArea
        innerRef={canvasRef}
        value={canvas}
        onChange={handleCanvasChange}
        mode={mode}
        height={620}
      />

      {mode === "text" && (
        <p className="text-xs text-muted-foreground mt-2">
          Click anywhere on the canvas to add a text block. Hover a block to drag or remove it.
        </p>
      )}
      {mode === "draw" && (
        <p className="text-xs text-muted-foreground mt-2">Click and drag to draw. Switch to Erase to remove strokes.</p>
      )}
    </div>
  );
};
