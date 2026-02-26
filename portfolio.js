// Portfolio page logic
import {
    getCurrentUser,
    isLoggedIn,
    isAdmin,
    isGuest,
    getTheme,
    setTheme,
    restoreSession,
    logout
} from './auth.js';

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vtvebpqjucqxvdmznqbq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dmVicHFqdWNxeHZkbXpucWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwOTg4MzEsImV4cCI6MjAyNDY3NDgzMX0.I9XnvTe0SHCqHN_Xx6q2c4ZN0cWAFRJDFEu8SvXDkpE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// App state
const appState = {
    currentApp: null,
};

// Initialize portfolio
async function init() {
    // Check auth
    if (!restoreSession() || !isLoggedIn()) {
        window.location.href = '/';
        return;
    }

    // Apply theme
    applyTheme();

    // Setup theme switcher
    setupThemeSwitcher();

    // Setup logout
    setupLogout();

    // Setup navigation
    setupNavigation();

    // Load content
    await loadBlog();
    await loadProjects();
    loadAbout();
    loadCV();

    // Setup app launcher
    setupAppLauncher();

    // Show admin CMS link if admin
    if (isAdmin()) {
        setupAdminCMS();
    }
}

// Apply theme
function applyTheme() {
    const theme = getTheme();
    document.body.className = `theme-${theme}`;
    updateThemeButtons(theme);
}

// Setup theme switcher
function setupThemeSwitcher() {
    const themeButtons = document.querySelectorAll('#themeSelector .theme-btn');
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
            applyTheme();
        });
    });
}

// Update theme buttons
function updateThemeButtons(currentTheme) {
    const themeButtons = document.querySelectorAll('#themeSelector .theme-btn');
    themeButtons.forEach(btn => {
        if (btn.getAttribute('data-theme') === currentTheme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Setup logout
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to sign out?')) {
                logout();
            }
        });
    }
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.portfolio-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            const section = document.querySelector(href);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Load blog posts from Supabase
async function loadBlog() {
    const container = document.getElementById('blogContainer');

    // Placeholder for now - will connect to Supabase
    container.innerHTML = `
        <div class="empty-state">
            <p>Blog coming soon...</p>
        </div>
    `;

    // In future: fetch from supabase
    // const { data, error } = await supabase.from('blog_posts').select('*');
}

// Load projects from Supabase
async function loadProjects() {
    const container = document.getElementById('projectsContainer');

    // Placeholder for now
    container.innerHTML = `
        <div class="empty-state">
            <p>Projects coming soon...</p>
        </div>
    `;

    // In future: fetch from supabase
    // const { data, error } = await supabase.from('projects').select('*');
}

// Load about content
function loadAbout() {
    const container = document.getElementById('aboutContainer');

    // Placeholder
    container.innerHTML = `
        <div class="empty-state">
            <p>About section coming soon...</p>
        </div>
    `;
}

// Load CV
function loadCV() {
    const container = document.getElementById('cvContainer');

    // Placeholder
    container.innerHTML = `
        <div class="empty-state">
            <p>CV coming soon...</p>
        </div>
    `;
}

// Setup app launcher
function setupAppLauncher() {
    const transcriberApp = document.getElementById('transcriberApp');
    const launchBtn = transcriberApp.querySelector('.btn-launch');

    launchBtn.addEventListener('click', () => {
        launchApp('transcriber');
    });
}

// Launch app
function launchApp(appName) {
    if (appName === 'transcriber') {
        // Hide portfolio
        document.querySelector('header').style.display = 'none';
        document.querySelector('main').style.display = 'none';

        // Show app frame
        const appFrame = document.getElementById('appFrame');
        appFrame.src = '/apps/transcriber/index.html';
        appFrame.classList.remove('hidden');
        appState.currentApp = 'transcriber';
    }
}

// Close app and return to portfolio
export function closeApp() {
    // Hide app frame
    const appFrame = document.getElementById('appFrame');
    appFrame.classList.add('hidden');
    appFrame.src = '';

    // Show portfolio
    document.querySelector('header').style.display = 'block';
    document.querySelector('main').style.display = 'block';

    appState.currentApp = null;
}

// Listen for messages from child apps
window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'closeApp') {
        closeApp();
    }
});

// Setup admin CMS
function setupAdminCMS() {
    const header = document.querySelector('.header-actions');
    const cmsLink = document.createElement('a');
    cmsLink.href = '/cms.html';
    cmsLink.className = 'btn-admin-cms';
    cmsLink.textContent = 'CMS';
    header.insertBefore(cmsLink, header.firstChild);
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
