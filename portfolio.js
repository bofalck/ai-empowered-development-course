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

// Helper function to extract plain text from HTML
function extractPlainText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

// Helper function to get emoji for project
function getProjectEmoji(project) {
    const text = (project.title + ' ' + project.tags + ' ' + project.description).toLowerCase();

    // Project type emojis
    const emojiMap = {
        'scania': '🚛',
        'truck': '🚛',
        'music': '🎵',
        'audio': '🎧',
        'sound': '🎧',
        'video': '🎬',
        'film': '🎬',
        'web': '🌐',
        'app': '📱',
        'design': '🎨',
        'ai': '🤖',
        'machine': '🤖',
        'data': '📊',
        'analytics': '📊',
        'tools': '🛠️',
        'portfolio': '📂',
    };

    for (const [keyword, emoji] of Object.entries(emojiMap)) {
        if (text.includes(keyword)) {
            return emoji;
        }
    }

    return '✨'; // Default emoji
}

// Initialize portfolio
async function init() {
    // Restore session if exists (optional for public portfolio)
    restoreSession();

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

    // Drag and drop disabled for masonry layout
    // setupWidgetDragAndDrop();

    // Widget order locked for masonry layout
    // restoreWidgetOrder();

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

    try {
        console.log('Starting to load blog posts from Supabase...');

        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        console.log('Blog posts query result - Data:', data, 'Error:', error);

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
            console.log('No blog posts found in database');
            container.innerHTML = `
                <div class="widget-teaser">
                    <p class="widget-teaser-text">No blog posts yet. Check back soon!</p>
                </div>
            `;
            return;
        }

        console.log(`Successfully loaded ${data.length} blog posts`);

        // Get top 3 most recent blog posts
        const topPosts = data.slice(0, 3);

        // Render as a compact widget with preview of recent posts
        const blogHTML = `
            <div class="widget-blog-preview">
                ${topPosts.map(post => {
                    return `
                        <a href="/blog.html?id=${post.id}" class="blog-preview-item blog-preview-link">
                            <div class="blog-preview-header">
                                <time class="blog-preview-date">${formatDate(post.created_at)}</time>
                                <h4 class="blog-preview-title">${extractPlainText(post.title)}</h4>
                            </div>
                            ${post.excerpt ? `
                                <div class="blog-preview-excerpt">${extractPlainText(post.excerpt)}</div>
                            ` : ''}
                        </a>
                    `;
                }).join('')}
                <a href="/blog.html" class="widget-blog-link">View all ${data.length} posts →</a>
            </div>
        `;

        container.innerHTML = blogHTML;
    } catch (error) {
        console.error('Failed to load blog posts:', error);
        container.innerHTML = `
            <div class="widget-teaser">
                <p class="widget-teaser-text">Unable to load blog posts</p>
            </div>
        `;
    }
}

// Format date to readable string
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Load projects from Supabase
async function loadProjects() {
    const container = document.getElementById('projectsContainer');

    try {
        console.log('Starting to load projects from Supabase...');

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
                <div class="widget-teaser">
                    <p class="widget-teaser-text">No projects yet. Check back soon!</p>
                </div>
            `;
            return;
        }

        console.log(`Successfully loaded ${data.length} projects`);

        // Get top 3 most recent projects
        const topProjects = data.slice(0, 3);
        console.log('Top projects:', topProjects);

        // Render as a compact widget with preview of recent projects
        const projectsHTML = `
            <div class="widget-projects-preview">
                ${topProjects.map(project => {
                    const projectUrl = `/projects.html?id=${project.id}`;
                    console.log('Creating project link:', projectUrl);
                    return `
                        <a href="${projectUrl}" class="project-preview-item project-preview-link">
                            <div class="project-preview-header">
                                <span class="project-preview-emoji">${getProjectEmoji(project)}</span>
                                <h4 class="project-preview-title">${extractPlainText(project.title)}</h4>
                            </div>
                            ${project.description ? `
                                <div class="project-preview-description">${extractPlainText(project.description)}</div>
                            ` : ''}
                            ${project.tags ? `
                                <div class="project-preview-tags">
                                    ${project.tags.split(',').slice(0, 2).map(tag =>
                                        `<span class="project-preview-tag">${tag.trim()}</span>`
                                    ).join('')}
                                </div>
                            ` : ''}
                        </a>
                    `;
                }).join('')}
                <a href="/projects.html" class="widget-projects-link">View all ${data.length} projects →</a>
            </div>
        `;

        container.innerHTML = projectsHTML;
    } catch (error) {
        console.error('Failed to load projects:', error);
        container.innerHTML = `
            <div class="widget-teaser">
                <p class="widget-teaser-text">Unable to load projects</p>
                <a href="#projects" class="widget-teaser-link">Try again →</a>
            </div>
        `;
    }
}

// Load about content
function loadAbout() {
    const container = document.getElementById('aboutContainer');

    container.innerHTML = `
        <div class="about-content">
            <div class="about-image">
                <img src="/assets/bobby.png" alt="Bobby Falck" />
            </div>
            <div class="about-text-content">
                <h3 class="about-greeting">Hi, I'm Bobby <span class="waving-hand">👋</span></h3>
                <p>Strategic leader with 11+ years shaping digital transformation, AI Enablement, scaling organizations, and aligning design, technology, and business. I build high-performing teams and coach leaders through a style that's playful, safe, and caring, creating environments where people thrive, ideas grow, and outcomes align with company vision.</p>
            </div>
            <div class="about-social-links">
                <a href="https://www.linkedin.com/in/bobby-falck/" target="_blank" rel="noopener noreferrer" class="social-link" title="LinkedIn" aria-label="Visit LinkedIn profile">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.39v-1.2h-2.5v8.5h2.5v-4.34c0-.77.62-1.4 1.4-1.4.77 0 1.4.63 1.4 1.4v4.34h2.5zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69-.93 0-1.69.76-1.69 1.69 0 .93.76 1.68 1.69 1.68zm1.39 9.94v-8.5H5.5v8.5h2.77z"/></svg>
                </a>
                <a href="https://www.instagram.com/samuraii_bob/" target="_blank" rel="noopener noreferrer" class="social-link" title="Instagram" aria-label="Visit Instagram profile">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.07 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/></svg>
                </a>
                <a href="https://medium.com/@bofalck" target="_blank" rel="noopener noreferrer" class="social-link" title="Medium" aria-label="Visit Medium profile">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42c1.87 0 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75c.66 0 1.19 2.58 1.19 5.75z"/></svg>
                </a>
            </div>
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
