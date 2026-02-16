import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Configuration
 * 
 * Replace these with your Supabase project credentials:
 * 1. Go to https://supabase.com → Create project
 * 2. Go to Settings → API
 * 3. Copy "Project URL" and "anon public" key
 */
const SUPABASE_URL = 'https://wommnicmtwargyuxuksv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvbW1uaWNtdHdhcmd5dXh1a3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzYzMDcsImV4cCI6MjA4MTMxMjMwN30.TUfoiGcuDTD8xoePF6fs8hRkXXldov4BZXrnJuavla4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

