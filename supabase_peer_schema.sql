-- Create peer registration table
CREATE TABLE IF NOT EXISTS public.peer_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    about TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS peer_registrations_user_id_idx ON public.peer_registrations(user_id);
CREATE INDEX IF NOT EXISTS peer_registrations_subject_idx ON public.peer_registrations(subject);

-- RLS (Row Level Security)
ALTER TABLE public.peer_registrations ENABLE ROW LEVEL SECURITY;

-- Allow users to read all peer registrations
CREATE POLICY "Anyone can read peer registrations" ON public.peer_registrations
    FOR SELECT
    USING (true);

-- Allow users to insert their own registration
CREATE POLICY "Users can create their own peer registration" ON public.peer_registrations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own registration
CREATE POLICY "Users can update their own peer registration" ON public.peer_registrations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own registration
CREATE POLICY "Users can delete their own peer registration" ON public.peer_registrations
    FOR DELETE
    USING (auth.uid() = user_id);
