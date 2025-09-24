-- Fix security issue: Add search_path to all functions to prevent schema injection
CREATE OR REPLACE FUNCTION public.delete_old_messages()
RETURNS integer
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.messages 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS json
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  deleted_count integer;
BEGIN
  deleted_count := public.delete_old_messages();
  RETURN json_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'timestamp', NOW()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_report_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE public.messages 
  SET report_count = report_count + 1,
      reported = CASE WHEN report_count >= 2 THEN true ELSE reported END
  WHERE id = NEW.message_id;
  RETURN NEW;
END;
$function$;

-- Update the cron job to use service role key (stored as secret) instead of hardcoded anon key
-- First, unschedule the existing job
SELECT cron.unschedule('cleanup-old-messages');

-- Recreate with proper authentication using service role key from vault
SELECT cron.schedule(
  'cleanup-old-messages',
  '0 * * * *', -- Run every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://slezeceipspeinnrlrpc.supabase.co/functions/v1/cleanup-messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object('time', now())
  ) AS request_id;
  $$
);

-- Add SELECT policy for reports table for moderators/admins (currently only INSERT is allowed)
-- This allows potential future moderation workflows
CREATE POLICY "Service role can view reports"
ON public.reports
FOR SELECT
USING (
  -- Only allow service role or authenticated users with specific conditions
  -- For now, we'll keep it restricted as there's no moderation UI
  false
);