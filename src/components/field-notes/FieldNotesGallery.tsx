import { FieldNoteRecord } from "@/types/fieldNote";
import { FieldNoteCanvasArea } from "./FieldNoteCanvas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  notes: FieldNoteRecord[];
  onOpen: (note: FieldNoteRecord) => void;
  onNew: () => void;
  onDelete: (note: FieldNoteRecord) => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export const FieldNotesGallery = ({ notes, onOpen, onNew, onDelete }: Props) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-fraunces text-4xl text-foreground">Field Notes</h1>
          <p className="text-muted-foreground mt-1">
            A slow record of what you've noticed — in yourself, in your neighbors, in your place.
          </p>
        </div>
        <Button onClick={onNew} size="lg" className="self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Field Note
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <Card
            key={note.id}
            className="group overflow-hidden cursor-pointer hover:shadow-md transition-shadow border-border"
            onClick={() => onOpen(note)}
          >
            {/* Thumbnail */}
            <div className="relative">
              <div
                className="pointer-events-none"
                style={{
                  transform: "scale(0.4)",
                  transformOrigin: "top left",
                  width: "250%",
                  height: 240,
                  overflow: "hidden",
                }}
              >
                <FieldNoteCanvasArea
                  value={note.canvas_data}
                  onChange={() => {}}
                  mode="text"
                  readOnly
                  height={600}
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this Field Note?")) onDelete(note);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur border border-border text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-4 border-t border-border bg-card">
              <h3 className="font-fraunces text-lg text-foreground truncate">
                {note.title || "Untitled"}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Created {formatDate(note.date_created)}
              </p>
              {note.date_edited && (
                <p className="text-xs text-muted-foreground/80 mt-0.5">
                  Edited {formatDate(note.date_edited)}
                </p>
              )}
              {note.is_public && (
                <span className="inline-block mt-2 text-xs text-primary">Shared publicly</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
