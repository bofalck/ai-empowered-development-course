// Projects router - handles dynamic project detail pages
import { supabase } from './supabase-client.js';
import { getTheme, setTheme, getProjectEmoji, formatDate, extractPlainText } from './auth.js';
import { getProjectEmoji as getEmojiFromUtils, extractPlainText as extractText } from './page-utils.js';

// Check if we're on a project detail page
const pathParts = window.location.pathname.split('/').filter(p => p);

if (pathParts[0] === 'projects' && pathParts[1]) {
    // We're on a project detail page
    const projectSlug = pathParts[1].replace('.html', '');
    loadProjectDetail(projectSlug);
}

async function loadProjectDetail(slug) {
    try {
        // Fetch project by slug (or by ID if slug doesn't work)
        let project = null;

        // Try to find by ID first (in case slug is actually an ID)
        const { data: byId } = await supabase
            .from('projects')
            .select('*')
            .eq('id', slug)
            .single();

        if (byId) {
            project = byId;
        } else {
            // If not found by ID, search all projects and match by slug-like pattern
            const { data: allProjects } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (allProjects) {
                // Create a slug from project title to match
                project = allProjects.find(p => {
                    const projectSlug = generateProjectSlug(p.title);
                    return projectSlug === slug;
                });
            }
        }

        if (!project) {
            document.body.innerHTML = `
                <div class="project-not-found">
                    <h1>Project Not Found</h1>
                    <p>The project you're looking for doesn't exist.</p>
                    <a href="/projects.html" class="btn-back">← Back to Projects</a>
                </div>
            `;
            return;
        }

        renderProjectDetail(project);
    } catch (error) {
        console.error('Error loading project:', error);
        document.body.innerHTML = `
            <div class="project-error">
                <h1>Error Loading Project</h1>
                <p>${error.message}</p>
                <a href="/projects.html" class="btn-back">← Back to Projects</a>
            </div>
        `;
    }
}

function generateProjectSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function renderProjectDetail(project) {
    const emoji = getEmojiFromUtils(project);
    const title = extractText(project.title);
    const description = extractText(project.description || '');
    const tags = project.tags ? project.tags.split(',').map(tag => tag.trim()) : [];

    // Update page title
    document.title = `${title} - After The Noise`;

    // Find or create main content area
    let main = document.querySelector('main.portfolio-main');
    if (!main) {
        main = document.createElement('main');
        main.className = 'portfolio-main';
        document.body.appendChild(main);
    }

    // Render project detail
    main.innerHTML = `
        <div class="project-detail-page">
            <div class="project-detail-header">
                <a href="/projects.html" class="back-link">← Back to Projects</a>
            </div>

            <article class="project-detail-content">
                <div class="project-detail-hero">
                    <div class="project-emoji">${emoji}</div>
                    <h1 class="project-title">${title}</h1>
                </div>

                ${tags.length > 0 ? `
                    <div class="project-tags">
                        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="project-meta">
                    <span class="project-date">Created ${formatDate(project.created_at)}</span>
                </div>

                <div class="project-description">
                    <h2>Overview</h2>
                    <div class="description-text">${description}</div>
                </div>

                ${project.link ? `
                    <div class="project-actions">
                        <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="btn-view-project">
                            Visit Project →
                        </a>
                    </div>
                ` : ''}

                <div class="project-footer">
                    <a href="/projects.html" class="btn-back-full">← Back to All Projects</a>
                </div>
            </article>
        </div>
    `;

    // Apply theme
    const theme = getTheme();
    document.body.className = `theme-${theme}`;
}

// Helper functions from page-utils
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

export { loadProjectDetail };
