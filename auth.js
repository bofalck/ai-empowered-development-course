// Global authentication system for After The Noise portfolio
import { supabase } from './supabase-client.js';

// Auth state - runtime only, not persisted manually (Supabase handles its own storage)
const authState = {
    user: null,
    isAdmin: false,
    isGuest: false,
    theme: localStorage.getItem('theme') || 'signal',
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

// Apply stored theme to current page
export function applyTheme() {
    document.body.className = document.body.className.replace(/theme-\w+/, '') + ` theme-${authState.theme}`;
    updateThemeButtons(authState.theme);
}

// Update active button indicator
export function updateThemeButtons(currentTheme) {
    document.querySelectorAll('.theme-btn[data-theme]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-theme') === currentTheme);
    });
}

// Wire up theme buttons — call once per page after DOM ready
export function setupThemeSwitcher() {
    document.querySelectorAll('.theme-btn[data-theme]').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
            updateThemeButtons(theme);
        });
    });
}

// Wire up hamburger menu toggle
function setupHamburger() {
    const btn = document.getElementById('hamburgerBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        btn.classList.toggle('open', isOpen);
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close on nav link click
    menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('open');
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('open');
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

// Login as admin via Supabase Auth
export async function loginAdmin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    authState.user = data.user;
    authState.isAdmin = true;
    authState.isGuest = false;
    return { success: true };
}

// Login as guest (local session only, no server auth)
export function loginGuest() {
    const guestUser = {
        id: 'guest_' + Date.now(),
        email: 'guest@local',
        role: 'guest',
    };
    authState.user = guestUser;
    authState.isGuest = true;
    authState.isAdmin = false;
    localStorage.setItem('guestSession', JSON.stringify(guestUser));
    return { success: true };
}

// Logout
export function logout() {
    if (authState.isAdmin) {
        supabase.auth.signOut(); // fire and forget — page navigates away anyway
    }
    localStorage.removeItem('guestSession');
    authState.user = null;
    authState.isAdmin = false;
    authState.isGuest = false;
    window.location.href = '/';
}

// Restore session from Supabase (admin) or localStorage (guest)
export async function restoreSession() {
    // Check Supabase session first
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        authState.user = session.user;
        authState.isAdmin = true;
        authState.isGuest = false;
        return true;
    }

    // Fall back to guest session
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

// Initialize
async function init() {
    // Skip redirect logic if running in iframe (app context)
    const isInIframe = window.parent !== window;

    if (!isInIframe) {
        const pathname = window.location.pathname;
        const loggedIn = await restoreSession();

        // Public pages that don't require authentication
        const isPublicPage = [
            '/',
            '/index.html',
            '/login.html',
            '/projects.html',
            '/project.html',
            '/blog.html',
            '/post.html',
            '/portfolio.html',
        ].includes(pathname);

        if (loggedIn) {
            // Redirect index/login to portfolio for logged-in users
            if (pathname === '/' || pathname === '/index.html' || pathname === '/login.html') {
                window.location.href = '/portfolio.html';
            }
        } else {
            // Redirect protected pages to login
            if (!isPublicPage) {
                window.location.href = '/';
            }
        }
    } else {
        await restoreSession();
    }

    applyTheme();
    setupThemeSwitcher();
    setupAdminLink();
    setupLogoutButton();
    setupHamburger();
}

// Inject admin nav link only for authenticated admins
function setupAdminLink() {
    if (!authState.isAdmin) return;

    ['.header-nav', '#mobileNav'].forEach(selector => {
        const nav = document.querySelector(selector);
        if (!nav) return;
        const link = document.createElement('a');
        link.href = '/cms.html';
        link.className = 'nav-link nav-link--admin';
        link.textContent = 'Admin';
        nav.appendChild(link);
    });
}

// Wire up logout button and populate mobile auth section
function setupLogoutButton() {
    // Desktop logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        if (authState.user) {
            logoutBtn.style.display = 'block';
            logoutBtn.addEventListener('click', logout);
        } else {
            logoutBtn.style.display = 'none';
            const authActions = logoutBtn.parentElement;
            if (authActions && !authActions.querySelector('.btn-signin')) {
                const signinLink = document.createElement('a');
                signinLink.href = '/login.html';
                signinLink.className = 'btn-signin';
                signinLink.textContent = 'Sign In';
                authActions.appendChild(signinLink);
            }
        }
    }

    // Mobile auth section
    const mobileAuth = document.getElementById('mobileAuthActions');
    if (mobileAuth && !mobileAuth.hasChildNodes()) {
        if (authState.user) {
            const btn = document.createElement('button');
            btn.className = 'btn-logout';
            btn.textContent = 'Sign Out';
            btn.addEventListener('click', logout);
            mobileAuth.appendChild(btn);
        } else {
            const link = document.createElement('a');
            link.href = '/login.html';
            link.className = 'btn-signin';
            link.textContent = 'Sign In';
            mobileAuth.appendChild(link);
        }
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
