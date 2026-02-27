// Global authentication system for After The Noise portfolio
import { supabase } from './supabase-client.js';

// Admin credentials (in production, use proper auth)
const ADMIN_EMAIL = 'admin@afterthenoise.com';
const ADMIN_PASSWORD = 'admin123';

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
    // Skip redirect logic if running in iframe (app context)
    const isInIframe = window.parent !== window;

    if (!isInIframe) {
        const pathname = window.location.pathname;
        const isLoggedIn = restoreSession();

        // Public pages that don't require authentication (login pages and public portfolio)
        const isPublicPage = pathname === '/' ||
                            pathname === '/index.html' ||
                            pathname === '/login.html' ||
                            pathname === '/admin/' ||
                            pathname === '/admin/index.html' ||
                            pathname === '/projects.html' ||
                            pathname === '/blog.html' ||
                            pathname === '/portfolio.html';

        if (isLoggedIn) {
            // User is logged in - redirect home to portfolio
            if (pathname === '/' || pathname === '/index.html') {
                window.location.href = '/portfolio.html';
            }
            // Let them access any page including admin pages
        } else {
            // User is NOT logged in
            if (isPublicPage) {
                // Allow public pages without login
            } else {
                // Redirect protected pages to login
                window.location.href = '/';
            }
        }
    } else {
        // In iframe - just restore session without redirecting
        restoreSession();
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
