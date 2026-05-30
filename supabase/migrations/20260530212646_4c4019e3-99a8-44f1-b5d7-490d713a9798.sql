
CREATE TABLE public.field_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  canvas_data jsonb NOT NULL DEFAULT '{"blocks":[],"strokes":[]}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  reminder_at timestamptz,
  reminder_channel text,
  reminder_contact text,
  reminder_dismissed boolean NOT NULL DEFAULT false,
  date_created timestamptz NOT NULL DEFAULT now(),
  date_edited timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_notes TO authenticated;
GRANT ALL ON public.field_notes TO service_role;

ALTER TABLE public.field_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own field notes"
ON public.field_notes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own field notes"
ON public.field_notes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own field notes"
ON public.field_notes FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own field notes"
ON public.field_notes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_field_notes_user ON public.field_notes(user_id, date_created DESC);

CREATE OR REPLACE FUNCTION public.validate_field_note_reminder()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.reminder_channel IS NOT NULL AND NEW.reminder_channel NOT IN ('email','sms','studio') THEN
    RAISE EXCEPTION 'Invalid reminder_channel: %', NEW.reminder_channel;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER field_notes_validate
BEFORE INSERT OR UPDATE ON public.field_notes
FOR EACH ROW EXECUTE FUNCTION public.validate_field_note_reminder();
