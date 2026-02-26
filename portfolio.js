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

import { supabase } from './supabase-client.js';

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

    // Setup drag and drop for widgets
    setupWidgetDragAndDrop();

    // Restore widget order from localStorage
    restoreWidgetOrder();

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

    try {
        // Show loading state
        container.innerHTML = `
            <div class="loading-state">
                <p>Loading projects...</p>
            </div>
        `;

        console.log('Starting to load projects from Supabase...');
        console.log('Supabase client:', supabase);

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        console.log('Projects query result - Data:', data, 'Error:', error);

        if (error) {
            console.error('Supabase error details:', {
                message: error.message,
                code: error.code,
                status: error.status,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        if (!data || data.length === 0) {
            console.log('No projects found in database');
            container.innerHTML = `
                <div class="empty-state">
                    <p>No projects yet...</p>
                </div>
            `;
            return;
        }

        console.log(`Successfully loaded ${data.length} projects`);

        // Render projects as a list of clickable items
        const projectsHTML = `
            <div class="projects-list">
                ${data.map(project => `
                    <a href="${project.link || '#'}" ${project.link ? 'target="_blank" rel="noopener noreferrer"' : 'class="project-item-disabled"'} class="project-item">
                        <div class="project-item-header">
                            <h3 class="project-item-title">${project.title}</h3>
                            ${project.link ? '<span class="project-item-external">↗</span>' : ''}
                        </div>
                        ${project.description ? `
                            <p class="project-item-description">${project.description}</p>
                        ` : ''}
                        ${project.tags ? `
                            <div class="project-item-tags">
                                ${project.tags.split(',').map(tag =>
                                    `<span class="project-tag">${tag.trim()}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </a>
                `).join('')}
            </div>
        `;

        container.innerHTML = projectsHTML;
    } catch (error) {
        console.error('Failed to load projects:', error);
        container.innerHTML = `
            <div class="empty-state" style="color: #ef4444;">
                <p>Error loading projects:</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message}</p>
            </div>
        `;
    }
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

// Setup drag and drop for widgets
function setupWidgetDragAndDrop() {
    const widgets = document.querySelectorAll('.widget');
    let draggedElement = null;

    widgets.forEach(widget => {
        widget.draggable = true;

        widget.addEventListener('dragstart', (e) => {
            draggedElement = widget;
            widget.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', widget.innerHTML);
        });

        widget.addEventListener('dragend', () => {
            widget.classList.remove('dragging');
            widgets.forEach(w => w.classList.remove('drag-over'));
            draggedElement = null;
            saveWidgetOrder();
        });

        widget.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (widget !== draggedElement) {
                widget.classList.add('drag-over');
            }
        });

        widget.addEventListener('dragleave', () => {
            widget.classList.remove('drag-over');
        });

        widget.addEventListener('drop', (e) => {
            e.preventDefault();
            if (widget !== draggedElement) {
                // Swap widgets
                const grid = document.querySelector('.widgets-grid');
                const allWidgets = Array.from(grid.querySelectorAll('.widget'));
                const draggedIndex = allWidgets.indexOf(draggedElement);
                const targetIndex = allWidgets.indexOf(widget);

                if (draggedIndex < targetIndex) {
                    widget.parentNode.insertBefore(draggedElement, widget.nextSibling);
                } else {
                    widget.parentNode.insertBefore(draggedElement, widget);
                }
            }
            widget.classList.remove('drag-over');
        });
    });
}

// Save widget order to localStorage
function saveWidgetOrder() {
    const grid = document.querySelector('.widgets-grid');
    const order = Array.from(grid.querySelectorAll('.widget')).map(w => w.id);
    localStorage.setItem('widgetOrder', JSON.stringify(order));
}

// Restore widget order from localStorage
function restoreWidgetOrder() {
    const saved = localStorage.getItem('widgetOrder');
    if (saved) {
        try {
            const order = JSON.parse(saved);
            const grid = document.querySelector('.widgets-grid');
            const widgets = new Map();

            // Create a map of widget ID to element
            grid.querySelectorAll('.widget').forEach(widget => {
                widgets.set(widget.id, widget);
            });

            // Reorder widgets
            order.forEach(id => {
                const widget = widgets.get(id);
                if (widget) {
                    grid.appendChild(widget);
                }
            });
        } catch (e) {
            console.error('Failed to restore widget order:', e);
        }
    }
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
