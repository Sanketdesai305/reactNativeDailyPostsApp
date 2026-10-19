CREATE OR REPLACE FUNCTION public.assign_accepted_worker(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.requests%ROWTYPE;
  v_payment_id uuid;
BEGIN
  SELECT *
  INTO v_request
  FROM public.requests
  WHERE id = p_request_id
    AND receiver_id = (SELECT auth.uid())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or user is not the job poster';
  END IF;

  IF v_request.status NOT IN ('pending', 'accepted') THEN
    RAISE EXCEPTION 'Only pending or previously accepted requests can be assigned';
  END IF;

  SELECT id
  INTO v_payment_id
  FROM public.payments
  WHERE post_id = v_request.post_id
    AND payer_id = (SELECT auth.uid())
    AND status = 'held'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job payment must be on hold to assign a worker';
  END IF;

  UPDATE public.requests
  SET status = 'accepted',
      accepted_at = COALESCE(accepted_at, now())
  WHERE id = v_request.id;

  UPDATE public.payments
  SET request_id = v_request.id,
      worker_id = v_request.sender_id
  WHERE id = v_payment_id;

  UPDATE public.posts
  SET status = 'in_progress'
  WHERE id = v_request.post_id
    AND user_id = (SELECT auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.assign_accepted_worker(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_accepted_worker(uuid) TO authenticated;
