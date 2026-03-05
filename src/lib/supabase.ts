import { createClient } from '@supabase/supabase-js';

// ===================================================================
// Supabase Client Configuration
//
// Replace these with your actual Supabase project credentials:
//   1. Go to https://supabase.com/dashboard → Your Project → Settings → API
//   2. Copy "Project URL" → VITE_SUPABASE_URL
//   3. Copy "anon public" key → VITE_SUPABASE_ANON_KEY
//
// Create a .env file in the project root:
//   VITE_SUPABASE_URL=https://your-project.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
// ===================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '⚠️ Supabase credentials missing!\n' +
        'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
        'The app will run in demo mode with mock data.'
    );
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    }
);

/** Check if Supabase is properly configured */
export const isSupabaseConfigured = (): boolean => {
    return !!(
        supabaseUrl &&
        supabaseAnonKey &&
        !supabaseUrl.includes('placeholder') &&
        !supabaseAnonKey.includes('PASTE_YOUR') &&
        supabaseAnonKey.startsWith('eyJ')
    );
};
