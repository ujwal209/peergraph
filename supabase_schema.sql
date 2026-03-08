-- Create OTP table for custom authentication flow
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('signup', 'recovery')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    used BOOLEAN DEFAULT false
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS otps_email_idx ON public.otps(email);

-- RLS (Row Level Security) - Only Service Role/Admin should touch this table directly for generation
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;

-- Allow reading by email for verification on the server side
CREATE POLICY "Service role can do everything" ON public.otps
    USING (true)
    WITH CHECK (true);
