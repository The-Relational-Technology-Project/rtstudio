import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ExternalLink, Pencil, Users } from "lucide-react";

interface ToolCardProps {
  id: string;
  name: string;
  description: string;
  url: string;
}

export const ToolCard = ({ id, name, description, url }: ToolCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteName, setNoteName] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isPlayGroupOpen, setIsPlayGroupOpen] = useState(false);
  const [playGroupName, setPlayGroupName] = useState("");
  const [playGroupEmail, setPlayGroupEmail] = useState("");
  const [isSubmittingPlayGroup, setIsSubmittingPlayGroup] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadNotes = async () => {
    const { data } = await supabase
      .from("tool_notes")
      .select("*")
      .eq("tool_id", id)
      .order("created_at", { ascending: false });
    
    if (data) setNotes(data);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingNote(true);

    try {
      const { error } = await supabase
        .from("tool_notes")
        .insert({
          tool_id: id,
          note_text: newNote,
          author_name: noteName,
        });

      if (error) throw error;

      toast({
        title: "Note added!",
        description: "Your note is now visible to others.",
      });

      setNewNote("");
      setNoteName("");
      await loadNotes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  const handlePlayGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPlayGroup(true);

    try {
      // Require authentication for play group signup
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to join a play group.",
          variant: "destructive",
        });
        setIsSubmittingPlayGroup(false);
        return;
      }

      const { error } = await supabase
        .from("play_group_signups")
        .insert({
          tool_name: name,
          user_id: user.id,
        });

      if (error) throw error;

      toast({
        title: "Thanks!",
        description: "We'll be in touch about the play group!",
      });

      setPlayGroupName("");
      setPlayGroupEmail("");
      setIsPlayGroupOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingPlayGroup(false);
    }
  };

  const handleExpand = async () => {
    if (!isExpanded) {
      await loadNotes();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3 sm:mb-2">
          <h3 className="text-lg sm:text-xl font-bold font-fraunces text-foreground flex-1">{name}</h3>
          <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <ExternalLink className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </a>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
        
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExpand} 
            className="w-full sm:w-auto"
          >
            <Pencil className="w-4 h-4 mr-2" />
            {isExpanded ? "Hide Notes" : "Notes"}
          </Button>
          
          <Dialog open={isPlayGroupOpen} onOpenChange={setIsPlayGroupOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
              >
                <Users className="w-4 h-4 mr-2" />
                Play Group
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Express Interest in Play Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePlayGroupSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Join a play group to learn and build with {name} together!
                </p>
                <div className="space-y-2">
                  <Label htmlFor="playGroupName">Name</Label>
                  <Input
                    id="playGroupName"
                    value={playGroupName}
                    onChange={(e) => setPlayGroupName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playGroupEmail">Email</Label>
                  <Input
                    id="playGroupEmail"
                    type="email"
                    value={playGroupEmail}
                    onChange={(e) => setPlayGroupEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmittingPlayGroup} className="w-full">
                  {isSubmittingPlayGroup ? "Submitting..." : "Express Interest"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isExpanded && (
          <div className="border-t pt-4 space-y-4">
            <div className="space-y-2">
              {notes.length > 0 ? (
                notes.map((note) => (
                <div key={note.id} className="bg-secondary/50 border border-border p-3 rounded-lg text-sm">
                  <p className="mb-1">{note.note_text}</p>
                  <p className="text-xs text-muted-foreground">— {note.author_name}</p>
                </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet. Be the first to add one!</p>
              )}
            </div>

            <form onSubmit={handleNoteSubmit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="note">Your note</Label>
                <Textarea
                  id="note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  placeholder="Share your tips, tricks, or experiences..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noteName">Your name (optional)</Label>
                <Input
                  id="noteName"
                  value={noteName}
                  onChange={(e) => setNoteName(e.target.value)}
                  placeholder="Your first name or 'Anonymous'"
                />
              </div>
              <Button type="submit" disabled={isAddingNote} size="sm">
                {isAddingNote ? "Adding..." : "Add Note"}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
