// Project detail page loader
import { supabase } from './supabase-client.js';
import { getProjectEmoji, extractPlainText, formatDate } from './page-utils.js';
import { projectsApi } from './lib/api.js';
import { trackProjectDetailView } from './lib/events.js';

// Get project ID from URL query parameter
const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');

if (!projectId) {
    showError('No project specified', 'Please use a valid project URL with an ID parameter');
} else {
    loadProject(projectId);
}

async function loadProject(projectId) {
    try {
        // Fetch the specific project by ID
        const { data: project, error: fetchError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (fetchError) {
            console.error('Fetch error:', fetchError);
            showError('Project not found', `Could not find project with ID: ${projectId}`);
            return;
        }

        if (!project) {
            showError('Project not found', `Could not find project with ID: ${projectId}`);
            return;
        }

        renderProject(project);
    } catch (error) {
        console.error('Error loading project:', error);
        showError('Error loading project', error.message);
    }
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function renderProject(project) {
    // Track project detail view
    trackProjectDetailView(project.id);

    const emoji = getProjectEmoji(project);
    const title = extractPlainText(project.title);
    const description = project.description || '';
    const tags = project.tags ? project.tags.split(',').map(tag => tag.trim()) : [];
    const date = formatDate(project.created_at);

    // Update page title
    document.title = `${title} - After The Noise`;

    // Use logotype if available, otherwise fall back to emoji
    const clientImage = project.logotype
        ? `<img src="${project.logotype}" alt="${title} logo" class="project-logotype">`
        : `<div class="project-emoji">${emoji}</div>`;

    const html = `
        <div class="project-detail-header">
            <a href="/projects.html" class="back-link">← Back to Projects</a>
        </div>

        <article class="project-detail-content">
            <div class="project-detail-hero">
                ${clientImage}
                <h1 class="project-title">${title}</h1>
                ${project.subtitle ? `<p class="project-subtitle">${project.subtitle}</p>` : ''}
            </div>

            <div class="project-meta-info">
                <span class="project-date">📅 ${date}</span>
            </div>

            ${tags.length > 0 ? `
                <div class="project-tags-section">
                    <div class="project-tags">
                        ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="project-description-section">
                <div class="project-description-text">${description}</div>
            </div>

            ${project.link ? `
                <div class="project-actions">
                    <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="btn-view-project">
                        🔗 Visit Project
                    </a>
                </div>
            ` : ''}

            <div class="project-detail-footer">
                <a href="/projects.html" class="btn-back-link">← Back to All Projects</a>
            </div>
        </article>
    `;

    document.getElementById('projectDetail').innerHTML = html;
}

function showError(title, message) {
    document.getElementById('projectDetail').innerHTML = `
        <div class="project-error">
            <h1>${title}</h1>
            <p>${message}</p>
            <a href="/projects.html" class="back-link">← Back to Projects</a>
        </div>
    `;
}
