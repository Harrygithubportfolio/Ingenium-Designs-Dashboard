-- Migration 002: Add 'ai_text' to intake_method enum
-- Run this in the Supabase SQL Editor on the data project (ftorqizpzrjhwarjuqst)

ALTER TYPE intake_method ADD VALUE IF NOT EXISTS 'ai_text';
