-- Create table to track chat usage for rate limiting
CREATE TABLE public.chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT date_trunc('day', now()),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, window_start)
);

-- Enable RLS
ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can manage this
CREATE POLICY "No public access to chat usage"
ON public.chat_usage
FOR ALL
USING (false);

-- Create index for fast lookups
CREATE INDEX idx_chat_usage_user_window ON public.chat_usage (user_id, window_start);