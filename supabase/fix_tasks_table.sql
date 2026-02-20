-- ============================================================
-- Fix: Add user_id to existing tasks table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add the user_id column if it doesn't exist
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. (Optional but recommended) Enable RLS on tasks if not enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 3. (Optional) Create policy so users only see their own tasks
-- WARNING: If you already have policies, check them first.
-- This simple policy allows users to see/edit only their own data.
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL
  USING (auth.uid() = user_id);
