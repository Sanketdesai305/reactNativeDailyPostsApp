ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT true;

ALTER TABLE public.messages
ALTER COLUMN is_read SET DEFAULT false;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_sender_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.messages
  SET is_read = true
  WHERE receiver_id = (SELECT auth.uid())
    AND sender_id = p_sender_id
    AND is_read = false;
$$;

REVOKE ALL ON FUNCTION public.mark_messages_as_read(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(uuid) TO authenticated;
