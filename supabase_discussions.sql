-- Create unit discussions table
CREATE TABLE IF NOT EXISTS public.unit_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id INTEGER NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups by unit
CREATE INDEX IF NOT EXISTS unit_comments_unit_id_idx ON public.unit_comments(unit_id);

-- Create reactions (likes) table
CREATE TABLE IF NOT EXISTS public.unit_comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.unit_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- RLS (Row Level Security)
ALTER TABLE public.unit_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_comment_likes ENABLE ROW LEVEL SECURITY;

-- Unit Comments Policies
CREATE POLICY "Anyone can read unit comments" ON public.unit_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own unit comments" ON public.unit_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unit comments" ON public.unit_comments
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unit comments" ON public.unit_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Unit Comment Likes Policies
CREATE POLICY "Anyone can read comment likes" ON public.unit_comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.unit_comment_likes
    FOR ALL USING (auth.uid() = user_id);
