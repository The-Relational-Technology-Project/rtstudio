-- Add title column to stories table
ALTER TABLE public.stories 
ADD COLUMN title TEXT;

-- Create story_notes table for user notes on stories
CREATE TABLE public.story_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID,
  note_text TEXT NOT NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.story_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for story_notes
CREATE POLICY "Story notes are viewable by everyone" 
ON public.story_notes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can add notes to stories" 
ON public.story_notes 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_story_notes_story_id ON public.story_notes(story_id);