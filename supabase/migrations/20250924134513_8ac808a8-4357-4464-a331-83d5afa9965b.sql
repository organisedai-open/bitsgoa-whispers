-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage on the cron schema to postgres
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the cleanup function to run every hour
SELECT cron.schedule(
  'cleanup-old-messages',
  '0 * * * *', -- Run every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://slezeceipspeinnrlrpc.supabase.co/functions/v1/cleanup-messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsZXplY2VpcHNwZWlubnJscnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NTYwMzgsImV4cCI6MjA3NDAzMjAzOH0.v7xzWPWtedd8W9SMaiNhNxLbExmuOhmqWJvWF0wqWDs'
    ),
    body := jsonb_build_object('time', now())
  ) AS request_id;
  $$
);