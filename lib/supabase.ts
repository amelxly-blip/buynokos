import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

// In-memory fallback for local preview / standalone operation without database
class MemoryStorage {
  orders = new Map<string, any>();
  deposits = new Map<string, any>();
  userBalance = 50000; // Default starter balance for sandbox demo

  getUserBalance() {
    return this.userBalance;
  }

  deductBalance(amount: number) {
    if (this.userBalance < amount) return false;
    this.userBalance -= amount;
    return true;
  }

  addBalance(amount: number) {
    this.userBalance += amount;
    return this.userBalance;
  }
}

// Global singleton in memory
export const memoryStore = new MemoryStorage();
