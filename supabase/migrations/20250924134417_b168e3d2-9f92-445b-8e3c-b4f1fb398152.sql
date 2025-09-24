-- Drop the existing function first since we need to change its return type
DROP FUNCTION IF EXISTS public.delete_old_messages();

-- Create improved delete_old_messages function that returns the count
CREATE OR REPLACE FUNCTION public.delete_old_messages()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.messages 
  WHERE created_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function that can be called periodically to clean up old messages
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS json AS $$
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
$$ LANGUAGE plpgsql;