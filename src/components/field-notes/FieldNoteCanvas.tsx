import { useRef, useState, useEffect, useCallback } from "react";
import { FieldNoteCanvas, FieldNoteBlock, FieldNoteStroke } from "@/types/fieldNote";
import { X, GripVertical } from "lucide-react";

interface Props {
  value: FieldNoteCanvas;
  onChange: (next: FieldNoteCanvas) => void;
  mode: "text" | "draw" | "erase";
  readOnly?: boolean;
  height?: number;
  innerRef?: React.RefObject<HTMLDivElement>;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const FieldNoteCanvasArea = ({
  value,
  onChange,
  mode,
  readOnly = false,
  height = 600,
  innerRef,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = innerRef || containerRef;
  const [drawing, setDrawing] = useState<{ points: { x: number; y: number }[] } | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const getPoint = (e: React.PointerEvent | PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const addBlock = (block: Omit<FieldNoteBlock, "id">) => {
    onChange({
      ...value,
      blocks: [...value.blocks, { id: uid(), ...block }],
    });
  };

  const updateBlock = (id: string, patch: Partial<FieldNoteBlock>) => {
    onChange({
      ...value,
      blocks: value.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  };

  const removeBlock = (id: string) => {
    onChange({ ...value, blocks: value.blocks.filter((b) => b.id !== id) });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (readOnly) return;
    if (mode !== "text") return;
    // Only place a text block when clicking the empty canvas itself
    if (e.target !== e.currentTarget) return;
    const rect = ref.current!.getBoundingClientRect();
    addBlock({
      type: "text",
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      width: 220,
      text: "",
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    if (mode === "draw") {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDrawing({ points: [getPoint(e)] });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    setDrawing({ points: [...drawing.points, getPoint(e)] });
  };

  const onPointerUp = () => {
    if (!drawing) return;
    if (drawing.points.length > 1) {
      const d = drawing.points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");
      const stroke: FieldNoteStroke = {
        id: uid(),
        d,
        color: "hsl(20 30% 22%)",
        width: 2,
      };
      onChange({ ...value, strokes: [...value.strokes, stroke] });
    }
    setDrawing(null);
  };

  const handleEraseStroke = (id: string) => {
    if (readOnly || mode !== "erase") return;
    onChange({ ...value, strokes: value.strokes.filter((s) => s.id !== id) });
  };

  const startDragBlock = (e: React.PointerEvent, block: FieldNoteBlock) => {
    if (readOnly) return;
    e.stopPropagation();
    const rect = ref.current!.getBoundingClientRect();
    setDragging({
      id: block.id,
      offsetX: e.clientX - rect.left - block.x,
      offsetY: e.clientY - rect.top - block.y,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: PointerEvent) => {
      const rect = ref.current!.getBoundingClientRect();
      updateBlock(dragging.id, {
        x: Math.max(0, e.clientX - rect.left - dragging.offsetX),
        y: Math.max(0, e.clientY - rect.top - dragging.offsetY),
      });
    };
    const handleUp = () => setDragging(null);
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  const cursorClass =
    mode === "draw"
      ? "cursor-crosshair"
      : mode === "erase"
      ? "cursor-cell"
      : mode === "text"
      ? "cursor-text"
      : "cursor-default";

  return (
    <div
      ref={ref}
      onClick={handleCanvasClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`relative w-full bg-card border border-border rounded-2xl overflow-hidden select-none ${cursorClass}`}
      style={{
        height,
        backgroundImage:
          "radial-gradient(hsl(var(--muted-foreground) / 0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Strokes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ pointerEvents: mode === "erase" ? "auto" : "none" }}
      >
        {value.strokes.map((s) => (
          <path
            key={s.id}
            d={s.d}
            stroke={s.color}
            strokeWidth={s.width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              pointerEvents: mode === "erase" ? "stroke" : "none",
              cursor: mode === "erase" ? "cell" : "default",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleEraseStroke(s.id);
            }}
          />
        ))}
        {drawing && drawing.points.length > 1 && (
          <path
            d={drawing.points
              .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(" ")}
            stroke="hsl(20 30% 22%)"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Blocks */}
      {value.blocks.map((block) => (
        <div
          key={block.id}
          className="absolute group"
          style={{
            left: block.x,
            top: block.y,
            width: block.width || (block.type === "divider" ? 240 : "auto"),
          }}
        >
          {!readOnly && (
            <div className="absolute -top-6 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onPointerDown={(e) => startDragBlock(e, block)}
                className="p-1 rounded bg-background border border-border text-muted-foreground hover:text-foreground"
                aria-label="Drag"
              >
                <GripVertical className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeBlock(block.id);
                }}
                className="p-1 rounded bg-background border border-border text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {block.type === "text" && (
            <textarea
              value={block.text || ""}
              readOnly={readOnly}
              autoFocus={!readOnly && !block.text}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type here…"
              className="w-full bg-transparent border-none outline-none resize-none font-fraunces text-foreground placeholder:text-muted-foreground/60 text-base leading-relaxed"
              style={{ minHeight: 32 }}
              rows={Math.max(2, (block.text || "").split("\n").length)}
            />
          )}

          {block.type === "image" && block.src && (
            <img
              src={block.src}
              alt=""
              draggable={false}
              className="max-w-[280px] rounded-md shadow-sm pointer-events-none"
            />
          )}

          {block.type === "divider" && (
            <div className="h-px bg-foreground/40 my-2" />
          )}
        </div>
      ))}
    </div>
  );
};
