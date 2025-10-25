-- Fix RLS Policies for blog_posts table
-- Run this in Supabase SQL Editor to resolve the RLS issue

-- Step 1: Enable RLS (if not already enabled)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow API to insert new posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow public read access" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow API to update posts" ON public.blog_posts;

-- Step 3: Create new policies for public read and API write access

-- Allow public to read all published blog posts
CREATE POLICY "Allow public read access" ON public.blog_posts
FOR SELECT USING (status = 'published');

-- Allow service role (API) to insert new blog posts
CREATE POLICY "Allow API to insert new posts" ON public.blog_posts
FOR INSERT TO service_role WITH CHECK (true);

-- Allow service role (API) to update blog posts  
CREATE POLICY "Allow API to update posts" ON public.blog_posts
FOR UPDATE TO service_role USING (true);

-- Step 4: Verify the policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'blog_posts';

-- Step 5: Test the configuration
-- This should return the RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'blog_posts';
