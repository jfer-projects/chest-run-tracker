'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Shares the MealApp Supabase project (and its logins). These are publishable values;
// row-level security on the chestrun_* tables is what keeps each account's data private.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xamzenezncjsmmvkafxq.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'sb_publishable_ouCtW1z5jcvxE1PaDbT1eQ_Xlu5CbNy';

let client: SupabaseClient | null = null;

/** Lazily created so nothing touches browser storage during server rendering. */
export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'chest-run-auth' },
    });
  }
  return client;
}
