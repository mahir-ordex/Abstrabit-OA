-- Share Links Feature Schema
-- Run this in your Supabase SQL Editor

-- Shared collections table
CREATE TABLE IF NOT EXISTS public.shared_collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection bookmarks junction table
CREATE TABLE IF NOT EXISTS public.collection_bookmarks (
  collection_id UUID NOT NULL REFERENCES public.shared_collections(id) ON DELETE CASCADE,
  bookmark_id UUID NOT NULL REFERENCES public.bookmarks(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (collection_id, bookmark_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_collections_user_id ON public.shared_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_collections_slug ON public.shared_collections(slug);
CREATE INDEX IF NOT EXISTS idx_collection_bookmarks_collection_id ON public.collection_bookmarks(collection_id);

-- Enable Row Level Security
ALTER TABLE public.shared_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_collections
-- Owner can do anything
CREATE POLICY "Users can manage own collections"
  ON public.shared_collections FOR ALL
  USING (auth.uid() = user_id);

-- Public collections can be viewed by anyone
CREATE POLICY "Public collections are viewable"
  ON public.shared_collections FOR SELECT
  USING (is_public = true);

-- RLS Policies for collection_bookmarks
-- Owner can manage
CREATE POLICY "Users can manage own collection bookmarks"
  ON public.collection_bookmarks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_collections
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

-- Public collection bookmarks can be viewed
CREATE POLICY "Public collection bookmarks are viewable"
  ON public.collection_bookmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_collections
      WHERE id = collection_id AND is_public = true
    )
  );

-- IMPORTANT: Allow viewing bookmarks that are part of a public collection
-- This policy allows anyone to view bookmarks if they belong to a public shared collection
CREATE POLICY "Bookmarks in public collections are viewable"
  ON public.bookmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collection_bookmarks cb
      JOIN public.shared_collections sc ON sc.id = cb.collection_id
      WHERE cb.bookmark_id = id AND sc.is_public = true
    )
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_collections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collection_bookmarks;
