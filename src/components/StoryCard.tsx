import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Pencil, Mail } from "lucide-react";

interface StoryCardProps {
  id: string;
  title: string;
  story: string;
  attribution: string;
  fullStory?: string;
}

export const StoryCard = ({ id, title, story, attribution, fullStory }: StoryCardProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullStory, setShowFullStory] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteName, setNoteName] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const { toast } = useToast();

  const loadNotes = async () => {
    const { data } = await supabase
      .from("story_notes")
      .select("*")
      .eq("story_id", id)
      .order("created_at", { ascending: false });
    
    if (data) setNotes(data);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingNote(true);

    try {
      const { error } = await supabase
        .from("story_notes")
        .insert({
          story_id: id,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("contact_submissions")
        .insert({
          story_id: id,
          name,
          email,
          message,
        });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We'll be in touch soon.",
      });

      setName("");
      setEmail("");
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpand = async () => {
    if (!isExpanded) {
      await loadNotes();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className={`border-l-4 border-l-accent hover:shadow-md transition-shadow ${showFullStory ? 'lg:col-span-2' : ''}`}>
      <CardContent className="p-4 sm:p-6">
        <div className={showFullStory ? 'lg:max-w-4xl lg:mx-auto' : ''}>
        {showFullStory ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold font-fraunces mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground">— {attribution}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFullStory(false)} 
                className="shrink-0"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Hide Full Story
              </Button>
            </div>
            {fullStory && (
              <div className="prose prose-sm max-w-none mb-4 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: fullStory }} />
            )}
            <div className="flex flex-col xl:flex-row gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExpand} 
                className="w-full xl:w-auto"
              >
                <Pencil className="w-4 h-4 mr-2" />
                {isExpanded ? "Hide Notes" : "Notes"}
              </Button>
              
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full xl:w-auto"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Get in Touch
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Get in touch</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base sm:text-lg font-semibold font-fraunces mb-2">{title}</h3>
            <p className="text-sm mb-4 leading-relaxed">{story}</p>
            <p className="text-xs text-muted-foreground mb-4">— {attribution}</p>
            
            <div className="flex flex-col xl:flex-row gap-2 mb-4">
              {fullStory && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFullStory(true)} 
                  className="w-full xl:w-auto"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Read Full Story
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExpand} 
                className="w-full xl:w-auto"
              >
                <Pencil className="w-4 h-4 mr-2" />
                {isExpanded ? "Hide Notes" : "Notes"}
              </Button>
              
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full xl:w-auto"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Get in Touch
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Get in touch</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}

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
                  placeholder="Add your thoughts or ideas..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noteName">Your name</Label>
                <Input
                  id="noteName"
                  value={noteName}
                  onChange={(e) => setNoteName(e.target.value)}
                  placeholder="Your first name or 'Anonymous'"
                  required
                />
              </div>
              <Button type="submit" disabled={isAddingNote} size="sm">
                {isAddingNote ? "Adding..." : "Add Note"}
              </Button>
            </form>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  );
};
