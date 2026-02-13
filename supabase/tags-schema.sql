-- Tags Feature Schema
-- Run this in your Supabase SQL Editor

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Bookmark-Tag relationship (many-to-many)
CREATE TABLE IF NOT EXISTS public.bookmark_tags (
  bookmark_id UUID NOT NULL REFERENCES public.bookmarks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (bookmark_id, tag_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_bookmark_id ON public.bookmark_tags(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_tag_id ON public.bookmark_tags(tag_id);

-- Enable Row Level Security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Users can view own tags"
  ON public.tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tags"
  ON public.tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
  ON public.tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
  ON public.tags FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bookmark_tags (via bookmark ownership)
CREATE POLICY "Users can view own bookmark tags"
  ON public.bookmark_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookmarks 
      WHERE id = bookmark_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own bookmark tags"
  ON public.bookmark_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookmarks 
      WHERE id = bookmark_id AND user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.tags 
      WHERE id = tag_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own bookmark tags"
  ON public.bookmark_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookmarks 
      WHERE id = bookmark_id AND user_id = auth.uid()
    )
  );

-- Enable Realtime for tags
ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmark_tags;
