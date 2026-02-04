// Supabase client configuration
// In production, these come from environment variables.
// For local development, connect to a local Supabase instance or use the hosted project.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export { SUPABASE_URL, SUPABASE_ANON_KEY };

// When @supabase/supabase-js is installed, uncomment:
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Placeholder client for development without Supabase dependency
// This allows the UI to render with mock data while the real backend is being set up
export const supabaseReady = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);
