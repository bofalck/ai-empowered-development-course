// Global authentication system for After The Noise portfolio

// Admin credentials (in production, use proper auth)
const ADMIN_EMAIL = 'admin@afterthenoise.com';
const ADMIN_PASSWORD = 'admin123';

// Initialize Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vtvebpqjucqxvdmznqbq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dmVicHFqdWNxeHZkbXpucWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwOTg4MzEsImV4cCI6MjAyNDY3NDgzMX0.I9XnvTe0SHCqHN_Xx6q2c4ZN0cWAFRJDFEu8SvXDkpE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Auth state management
const authState = {
    user: null,
    isAdmin: false,
    isGuest: false,
    theme: localStorage.getItem('theme') || 'default',
};

// Get current user
export function getCurrentUser() {
    return authState.user;
}

// Check if logged in
export function isLoggedIn() {
    return authState.user !== null;
}

// Check if admin
export function isAdmin() {
    return authState.isAdmin;
}

// Check if guest
export function isGuest() {
    return authState.isGuest;
}

// Get theme
export function getTheme() {
    return authState.theme;
}

// Set theme globally
export function setTheme(theme) {
    authState.theme = theme;
    localStorage.setItem('theme', theme);
    document.body.className = document.body.className.replace(/theme-\w+/, `theme-${theme}`);
}

// Login as admin
export async function loginAdmin(email, password) {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        authState.user = {
            id: 'admin',
            email: email,
            role: 'admin',
        };
        authState.isAdmin = true;
        authState.isGuest = false;
        localStorage.setItem('authState', JSON.stringify(authState));
        return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
}

// Login as guest
export function loginGuest() {
    authState.user = {
        id: 'guest_' + Date.now(),
        email: 'guest@afterthenoise.com',
        role: 'guest',
    };
    authState.isGuest = true;
    authState.isAdmin = false;
    localStorage.setItem('authState', JSON.stringify(authState));
    return { success: true };
}

// Logout
export function logout() {
    authState.user = null;
    authState.isAdmin = false;
    authState.isGuest = false;
    localStorage.removeItem('authState');
    window.location.href = '/';
}

// Restore session
export function restoreSession() {
    const saved = localStorage.getItem('authState');
    if (saved) {
        try {
            const restored = JSON.parse(saved);
            Object.assign(authState, restored);
            return true;
        } catch (e) {
            console.error('Failed to restore session:', e);
            return false;
        }
    }
    return false;
}

// Apply theme
function applyTheme() {
    document.body.className = `theme-${authState.theme}`;
}

// Handle login form
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const guestBtn = document.getElementById('guestBtn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const result = await loginAdmin(email, password);
            if (result.success) {
                window.location.href = '/portfolio.html';
            } else {
                alert(result.error);
            }
        });
    }

    if (guestBtn) {
        guestBtn.addEventListener('click', () => {
            loginGuest();
            window.location.href = '/portfolio.html';
        });
    }
}

// Initialize
function init() {
    // If already logged in, redirect to portfolio
    if (restoreSession()) {
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            window.location.href = '/portfolio.html';
        }
    } else {
        // Not logged in, show login form
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
            window.location.href = '/';
        }
    }

    applyTheme();
    setupLoginForm();
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
