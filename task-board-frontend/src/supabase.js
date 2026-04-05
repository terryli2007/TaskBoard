import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tzrvnrsfpuiobmsfccwi.supabase.co';
const supabaseAnonKey = 'sb_publishable_KKyaHkIdwfjbp2nQzTxyDw_RJ6JZNfF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getOrCreateUser = async () => {
    // 1 Session Check
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        console.log("Existing guest session found:", session.user.id);
        return session.user.id;
    }

    // 2 Anonymous Login
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
        console.error("Anonymous login failed:", error.message);
        throw error;
    }

    console.log("New guest session created:", data.user.id);
    return data.user.id;
};