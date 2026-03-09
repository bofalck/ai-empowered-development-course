// Self-contained auth module for the transcriber app (no external relative paths)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xqpqcuvvjgnjtqmhrtku.supabase.co';
const supabaseKey = 'sb_publishable_XsrMMvQjHZcj6Cql1xA5Fw_nF9nfubb';
const supabase = createClient(supabaseUrl, supabaseKey);

const authState = {
    user: null,
    isAdmin: false,
    isGuest: false,
};

export function isLoggedIn() {
    return authState.user !== null;
}

export function getTheme() {
    return localStorage.getItem('theme') || 'signal';
}

export async function restoreSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        authState.user = session.user;
        authState.isAdmin = true;
        authState.isGuest = false;
        return true;
    }

    const savedGuest = localStorage.getItem('guestSession');
    if (savedGuest) {
        try {
            authState.user = JSON.parse(savedGuest);
            authState.isGuest = true;
            authState.isAdmin = false;
            return true;
        } catch (e) {
            localStorage.removeItem('guestSession');
        }
    }

    return false;
}
