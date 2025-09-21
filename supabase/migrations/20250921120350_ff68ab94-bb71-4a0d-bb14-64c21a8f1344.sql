-- Create messages table for anonymous chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('general', 'confessions', 'support')),
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  reported BOOLEAN DEFAULT false,
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  reporter_session TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages (anonymous access)
CREATE POLICY "Messages are publicly readable" 
ON public.messages 
FOR SELECT 
USING (true);

-- Allow anyone to create messages
CREATE POLICY "Anyone can create messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to report messages
CREATE POLICY "Anyone can report messages" 
ON public.reports 
FOR INSERT 
WITH CHECK (true);

-- Create function to auto-delete old messages (24 hours)
CREATE OR REPLACE FUNCTION public.delete_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.messages 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create function to increment report count
CREATE OR REPLACE FUNCTION public.increment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.messages 
  SET report_count = report_count + 1,
      reported = CASE WHEN report_count >= 2 THEN true ELSE reported END
  WHERE id = NEW.message_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for report count
CREATE TRIGGER update_report_count
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.increment_report_count();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Set up replica identity for realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;