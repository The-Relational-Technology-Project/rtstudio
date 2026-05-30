import { useEffect, useState, useRef } from "react";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { FieldNotesWelcome } from "@/components/field-notes/FieldNotesWelcome";
import { FieldNotesGallery } from "@/components/field-notes/FieldNotesGallery";
import { FieldNoteEditor } from "@/components/field-notes/FieldNoteEditor";
import { FieldNoteSaveModal, ReminderChoice } from "@/components/field-notes/FieldNoteSaveModal";
import { FieldNoteRecord, FieldNoteCanvas, EMPTY_CANVAS } from "@/types/fieldNote";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type View = "loading" | "welcome" | "gallery" | "editor";

const FieldNotes = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [view, setView] = useState<View>("loading");
  const [notes, setNotes] = useState<FieldNoteRecord[]>([]);
  const [activeNote, setActiveNote] = useState<FieldNoteRecord | null>(null);
  const [pendingSave, setPendingSave] = useState<{
    note: FieldNoteRecord;
    isNew: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reminderBanner, setReminderBanner] = useState<FieldNoteRecord | null>(null);

  const fetchNotes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("field_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("date_created", { ascending: false });
    if (error) {
      toast({ title: "Couldn't load Field Notes", description: error.message, variant: "destructive" });
      return;
    }
    const records = (data || []) as unknown as FieldNoteRecord[];
    setNotes(records);
    // Reminder check — "studio" channel, due, not dismissed
    const due = records.find(
      (n) =>
        n.reminder_channel === "studio" &&
        !n.reminder_dismissed &&
        n.reminder_at &&
        new Date(n.reminder_at) <= new Date()
    );
    if (due) setReminderBanner(due);

    if (records.length === 0) setView("welcome");
    else setView("gallery");
  };

  useEffect(() => {
    if (user) fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const startNew = () => {
    setActiveNote(null);
    setView("editor");
  };

  const openNote = (note: FieldNoteRecord) => {
    setActiveNote(note);
    setView("editor");
  };

  const handleEditorSave = async ({
    title,
    canvas,
    changed,
  }: {
    title: string;
    canvas: FieldNoteCanvas;
    changed: boolean;
  }) => {
    if (!user) return;
    setSaving(true);
    try {
      if (activeNote) {
        const updates: any = {
          title: title || null,
          canvas_data: canvas,
        };
        if (changed) updates.date_edited = new Date().toISOString();
        const { data, error } = await supabase
          .from("field_notes")
          .update(updates)
          .eq("id", activeNote.id)
          .select()
          .single();
        if (error) throw error;
        const updated = data as unknown as FieldNoteRecord;
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        setPendingSave({ note: updated, isNew: false });
      } else {
        const { data, error } = await supabase
          .from("field_notes")
          .insert({
            user_id: user.id,
            title: title || null,
            canvas_data: canvas as any,
          })
          .select()
          .single();
        if (error) throw error;
        const created = data as unknown as FieldNoteRecord;
        setNotes((prev) => [created, ...prev]);
        setPendingSave({ note: created, isNew: true });
      }
      setShowSaveModal(true);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const generatePdfBase64 = async (note: FieldNoteRecord): Promise<string | null> => {
    // Render the note off-screen and snapshot it
    const holder = document.createElement("div");
    holder.style.position = "fixed";
    holder.style.left = "-9999px";
    holder.style.top = "0";
    holder.style.width = "900px";
    holder.style.padding = "32px";
    holder.style.background = "hsl(30 40% 92%)";
    document.body.appendChild(holder);

    try {
      // Build a simple HTML representation
      holder.innerHTML = `
        <h1 style="font-family: Fraunces, Georgia, serif; font-size: 32px; color: #3d3129; margin: 0 0 12px;">
          ${(note.title || "Untitled").replace(/</g, "&lt;")}
        </h1>
        <p style="font-family: Inter, sans-serif; color: #7a6d61; margin: 0 0 24px;">
          Field Note · ${new Date(note.date_created).toLocaleDateString()}
        </p>
        <div id="fn-canvas" style="position: relative; width: 840px; height: 600px; background: hsl(30 45% 96%); border: 1px solid #d8c9b8; border-radius: 16px;"></div>
      `;
      const canvasEl = holder.querySelector("#fn-canvas") as HTMLDivElement;

      // Render strokes
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%;");
      for (const s of note.canvas_data.strokes || []) {
        const p = document.createElementNS(svgNS, "path");
        p.setAttribute("d", s.d);
        p.setAttribute("stroke", s.color);
        p.setAttribute("stroke-width", String(s.width));
        p.setAttribute("fill", "none");
        p.setAttribute("stroke-linecap", "round");
        svg.appendChild(p);
      }
      canvasEl.appendChild(svg);

      // Render blocks
      for (const b of note.canvas_data.blocks || []) {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.left = `${b.x}px`;
        el.style.top = `${b.y}px`;
        if (b.width) el.style.width = `${b.width}px`;
        if (b.type === "text") {
          el.style.fontFamily = "Fraunces, Georgia, serif";
          el.style.color = "#3d3129";
          el.style.fontSize = "16px";
          el.style.whiteSpace = "pre-wrap";
          el.textContent = b.text || "";
        } else if (b.type === "image" && b.src) {
          const img = document.createElement("img");
          img.src = b.src;
          img.style.maxWidth = "280px";
          img.style.borderRadius = "6px";
          el.appendChild(img);
        } else if (b.type === "divider") {
          el.style.width = `${b.width || 240}px`;
          el.style.height = "1px";
          el.style.background = "#3d3129";
          el.style.opacity = "0.4";
        }
        canvasEl.appendChild(el);
      }

      await new Promise((r) => setTimeout(r, 100));
      const snapshot = await html2canvas(holder, { backgroundColor: "#f3e8d8", scale: 2 });
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [snapshot.width, snapshot.height] });
      pdf.addImage(snapshot.toDataURL("image/jpeg", 0.85), "JPEG", 0, 0, snapshot.width, snapshot.height);
      const dataUri = pdf.output("datauristring");
      return dataUri.split(",")[1] || null;
    } catch (e) {
      console.error("PDF export failed", e);
      return null;
    } finally {
      document.body.removeChild(holder);
    }
  };

  const handleSaveModalSubmit = async ({
    share,
    reminder,
  }: {
    share: boolean;
    reminder: ReminderChoice;
  }) => {
    if (!pendingSave) return;
    setSaving(true);
    try {
      const note = pendingSave.note;
      const updates: any = { is_public: share };

      if (reminder.kind !== "none") {
        const remindAt = new Date(Date.now() + reminder.days * 24 * 60 * 60 * 1000).toISOString();
        updates.reminder_at = remindAt;
        updates.reminder_dismissed = false;
        if (reminder.kind === "studio") {
          updates.reminder_channel = "studio";
          updates.reminder_contact = null;
        } else if (reminder.kind === "email") {
          updates.reminder_channel = "email";
          updates.reminder_contact = reminder.email;
        } else if (reminder.kind === "sms") {
          updates.reminder_channel = "sms";
          updates.reminder_contact = reminder.phone;
        }
      }

      const { data, error } = await supabase
        .from("field_notes")
        .update(updates)
        .eq("id", note.id)
        .select()
        .single();
      if (error) throw error;
      const updated = data as unknown as FieldNoteRecord;
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));

      if (share) {
        const pdfBase64 = await generatePdfBase64(updated);
        try {
          await supabase.functions.invoke("notify-field-note", {
            body: {
              noteId: updated.id,
              title: updated.title || "Untitled",
              builderName: profile?.display_name || profile?.full_name || "A builder",
              builderEmail: profile?.email || user?.email || null,
              pdfBase64,
            },
          });
        } catch (e) {
          console.error("notify-field-note failed", e);
        }
      }

      toast({
        title: "Saved",
        description: share ? "Your Field Note was shared." : "Your Field Note is saved.",
      });
      setShowSaveModal(false);
      setPendingSave(null);
      setActiveNote(null);
      setView("gallery");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (note: FieldNoteRecord) => {
    const { error } = await supabase.from("field_notes").delete().eq("id", note.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    const next = notes.filter((n) => n.id !== note.id);
    setNotes(next);
    if (next.length === 0) setView("welcome");
  };

  const dismissReminder = async () => {
    if (!reminderBanner) return;
    await supabase
      .from("field_notes")
      .update({ reminder_dismissed: true })
      .eq("id", reminderBanner.id);
    setReminderBanner(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />

      {reminderBanner && view !== "loading" && (
        <div className="bg-secondary border-b border-border px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <p className="font-fraunces text-foreground text-sm sm:text-base">
              A gentle reminder — take a moment to write a new Field Note.
            </p>
            <button
              type="button"
              onClick={dismissReminder}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1">
        {view === "loading" && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        )}

        {view === "welcome" && <FieldNotesWelcome onStart={startNew} />}

        {view === "gallery" && (
          <FieldNotesGallery
            notes={notes}
            onOpen={openNote}
            onNew={startNew}
            onDelete={handleDelete}
          />
        )}

        {view === "editor" && (
          <FieldNoteEditor
            initialTitle={activeNote?.title || ""}
            initialCanvas={activeNote?.canvas_data || EMPTY_CANVAS}
            onSave={handleEditorSave}
            onBack={() => {
              setActiveNote(null);
              setView(notes.length === 0 ? "welcome" : "gallery");
            }}
            saving={saving}
          />
        )}
      </div>

      <FieldNoteSaveModal
        open={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setPendingSave(null);
        }}
        defaultEmail={profile?.email || user?.email || ""}
        onSubmit={handleSaveModalSubmit}
        submitting={saving}
      />

      <Footer />
    </div>
  );
};

export default FieldNotes;
