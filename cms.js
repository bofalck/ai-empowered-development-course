// CMS Logic for blog posts and projects
import { restoreSession, isAdmin, getTheme, setTheme } from './auth.js';
import { supabase } from './supabase-client.js';

// Edit state
const cmsState = {
    editingProjectId: null,
};

// Helper function to extract plain text from HTML
function extractPlainText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

// Generate slug from title and timestamp
function generateSlug(title) {
    const timestamp = Math.floor(Date.now() / 1000);
    const titleSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens

    return `${titleSlug}-${timestamp}`;
}

// Quill editors global
let blogContentEditor = null;
let projectDescriptionEditor = null;

// Initialize CMS
async function init() {
    // Check auth
    if (!restoreSession() || !isAdmin()) {
        window.location.href = '/';
        return;
    }

    // Apply theme
    applyTheme();

    // Setup theme switcher
    setupThemeSwitcher();

    // Setup tabs
    setupTabs();

    // Setup blog
    setupBlog();

    // Setup projects
    setupProjects();
}

// Sanitize pasted content - strip disallowed formatting and attributes
function sanitizeEditorContent(html, allowedTags = ['b', 'strong', 'i', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'a']) {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    const allowed = new Set(allowedTags.map(tag => tag.toLowerCase()));

    // Remove all attributes and disallowed tags
    const walk = (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            if (!allowed.has(tagName)) {
                // Unwrap but keep text content
                while (node.firstChild) {
                    node.parentNode.insertBefore(node.firstChild, node);
                }
                node.parentNode.removeChild(node);
            } else {
                // Only keep href for links, remove all other attributes
                if (tagName !== 'a') {
                    while (node.attributes.length > 0) {
                        node.removeAttribute(node.attributes[0].name);
                    }
                } else {
                    // For links, keep only href and sanitize it
                    const href = node.getAttribute('href');
                    while (node.attributes.length > 0) {
                        node.removeAttribute(node.attributes[0].name);
                    }
                    if (href && (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('/'))) {
                        node.setAttribute('href', href);
                    }
                }
                let child = node.firstChild;
                while (child) {
                    const next = child.nextSibling;
                    walk(child);
                    child = next;
                }
            }
        }
    };

    walk(temp);
    return temp.innerHTML;
}

// Setup simple editor (title, description) with limited formatting
// Old editor functions - replaced by Quill
// (setupSimpleEditor and setupFullEditor removed - now using Quill)

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

// Setup tabs
function setupTabs() {
    const tabs = document.querySelectorAll('.cms-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

// Switch tab
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.cms-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.cms-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// Setup blog
function setupBlog() {
    const newBlogBtn = document.getElementById('newBlogBtn');
    const blogForm = document.getElementById('blogForm');
    const blogFormElement = blogForm.querySelector('form');
    const cancelBtn = blogForm.querySelector('.btn-cancel');

    newBlogBtn.addEventListener('click', () => {
        clearProjectEdit();
        document.getElementById('blogList').classList.add('hidden');
        blogForm.classList.remove('hidden');
        blogFormElement.reset();

        // Clear Quill editor
        if (blogContentEditor) {
            blogContentEditor.setContents([]);
        }

        document.getElementById('blogTitle').focus();
    });

    cancelBtn.addEventListener('click', () => {
        clearProjectEdit();
        blogForm.classList.add('hidden');
        document.getElementById('blogList').classList.remove('hidden');
    });

    blogFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveBlogPost();
    });

    // Initialize Quill editor for blog content
    blogContentEditor = new Quill('#blogContentEditor', {
        theme: 'snow',
        placeholder: 'Write your blog post content here...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // Sync Quill content to hidden input
    blogContentEditor.on('text-change', () => {
        document.getElementById('blogContent').value = blogContentEditor.root.innerHTML;
    });

    loadBlogPosts();
}

// Load blog posts
async function loadBlogPosts() {
    const container = document.getElementById('blogList');

    try {
        const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="cms-empty">
                    <p>No blog posts yet. Create your first post!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.map(post => `
            <div class="cms-item">
                <div class="cms-item-header">
                    <h4>${extractPlainText(post.title)}</h4>
                    <span class="cms-item-date">${new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <p class="cms-item-slug">Slug: ${post.slug}</p>
                ${post.excerpt ? `<p class="cms-item-excerpt">${post.excerpt}</p>` : ''}
                <div class="cms-item-preview">
                    ${post.content}
                </div>
                <div class="cms-item-actions">
                    <button class="cms-item-edit" onclick="editBlogPost('${post.id}')">Edit</button>
                    <button class="cms-item-delete" onclick="deleteBlogPost('${post.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load blog posts:', error);
        container.innerHTML = `
            <div class="cms-empty" style="color: #ef4444;">
                <p>Error loading blog posts: ${error.message}</p>
            </div>
        `;
    }
}

// Save blog post
async function saveBlogPost() {
    // Get form values
    const title = document.getElementById('blogTitle').value.trim();
    const description = document.getElementById('blogDescription').value.trim();
    const excerpt = document.getElementById('blogExcerpt').value.trim();
    const tags = document.getElementById('blogTags').value.trim();

    // Get content from Quill editor
    const content = blogContentEditor ? blogContentEditor.root.innerHTML.trim() : '';

    // Auto-generate slug from title and timestamp
    const slug = generateSlug(title);

    if (!title || !description || !content) {
        showCmsModal('Error', 'Please fill in Title, Description, and Content', 'error');
        return;
    }

    try {
        const { data, error } = await supabase.from('blog_posts').insert([
            {
                title,
                slug,
                excerpt,
                description,
                content,
                tags,
                created_at: new Date().toISOString()
            }
        ]);

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(error.message || 'Failed to insert blog post');
        }

        showCmsModal('Success', 'Blog post saved successfully!', 'success');
        document.getElementById('blogForm').classList.add('hidden');
        document.getElementById('blogForm').querySelector('form').reset();
        if (blogContentEditor) {
            blogContentEditor.setContents([]);
        }
        // Show list and reload blog posts
        document.getElementById('blogList').classList.remove('hidden');
        await loadBlogPosts();
    } catch (error) {
        console.error('Save blog post error:', error);
        showCmsModal('Error', 'Failed to save blog post: ' + error.message, 'error');
    }
}

// Setup projects
function setupProjects() {
    const newProjectBtn = document.getElementById('newProjectBtn');
    const projectForm = document.getElementById('projectForm');
    const projectFormElement = projectForm.querySelector('form');
    const cancelBtn = projectForm.querySelector('.btn-cancel');

    newProjectBtn.addEventListener('click', () => {
        clearProjectEdit();
        document.getElementById('projectsList').classList.add('hidden');
        projectForm.classList.remove('hidden');
        projectFormElement.reset();

        // Clear Quill editor
        if (projectDescriptionEditor) {
            projectDescriptionEditor.setContents([]);
        }

        document.querySelector('#projectForm h3').textContent = 'New Project';
        document.getElementById('projectTitle').focus();
    });

    cancelBtn.addEventListener('click', () => {
        clearProjectEdit();
        projectForm.classList.add('hidden');
        document.getElementById('projectsList').classList.remove('hidden');
    });

    projectFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProject();
    });

    // Initialize Quill editor for project description
    projectDescriptionEditor = new Quill('#projectDescriptionEditor', {
        theme: 'snow',
        placeholder: 'Write your project description here...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
            ]
        }
    });

    // Sync Quill content to hidden input
    projectDescriptionEditor.on('text-change', () => {
        document.getElementById('projectDescription').value = projectDescriptionEditor.root.innerHTML;
    });

    loadProjects();
}

// Load projects
async function loadProjects() {
    const container = document.getElementById('projectsList');

    try {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="cms-empty">
                    <p>No projects yet. Create your first project!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="cms-projects-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Tags</th>
                        <th>Link</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(project => `
                        <tr>
                            <td class="cms-project-title">${extractPlainText(project.title)}</td>
                            <td class="cms-project-description">
                                <div class="cms-project-description-preview">${extractPlainText(project.description)}</div>
                            </td>
                            <td class="cms-project-tags">
                                ${project.tags ? `<div class="cms-tags-list">${project.tags.split(',').map(tag => `<span class="cms-tag">${tag.trim()}</span>`).join('')}</div>` : '<span class="cms-no-tags">—</span>'}
                            </td>
                            <td class="cms-project-link">
                                ${project.link ? `<a href="${project.link}" target="_blank" class="cms-link-icon">🔗</a>` : '<span class="cms-no-link">—</span>'}
                            </td>
                            <td class="cms-project-actions">
                                <button class="cms-item-edit" onclick="editProject('${project.id}')">Edit</button>
                                <button class="cms-item-delete" onclick="deleteProject('${project.id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Failed to load projects:', error);
        container.innerHTML = `
            <div class="cms-empty" style="color: #ef4444;">
                <p>Error loading projects: ${error.message}</p>
            </div>
        `;
    }
}

// Save project (create or update)
async function saveProject() {
    // Get form values
    const title = document.getElementById('projectTitle').value.trim();
    const description = projectDescriptionEditor ? projectDescriptionEditor.root.innerHTML.trim() : '';
    const link = document.getElementById('projectLink').value.trim();
    const tags = document.getElementById('projectTags').value.trim();

    if (!title || !description) {
        showCmsModal('Error', 'Please fill in Title and Description', 'error');
        return;
    }

    try {
        let result;
        if (cmsState.editingProjectId) {
            // Update existing project
            result = await supabase.from('projects').update({
                title,
                description,
                link: link || null,
                tags: tags || null,
            }).eq('id', cmsState.editingProjectId);
        } else {
            // Create new project
            result = await supabase.from('projects').insert([
                {
                    title,
                    description,
                    link: link || null,
                    tags: tags || null,
                    created_at: new Date().toISOString()
                }
            ]);
        }

        const { error } = result;
        if (error) {
            console.error('Supabase error:', error);
            throw new Error(error.message || 'Failed to save project');
        }

        showCmsModal('Success', cmsState.editingProjectId ? 'Project updated successfully!' : 'Project saved successfully!', 'success');
        clearProjectEdit();
        document.getElementById('projectForm').classList.add('hidden');
        document.getElementById('projectForm').querySelector('form').reset();
        if (projectDescriptionEditor) {
            projectDescriptionEditor.setContents([]);
        }
        // Show list and reload projects
        document.getElementById('projectsList').classList.remove('hidden');
        await loadProjects();
    } catch (error) {
        console.error('Save project error:', error);
        showCmsModal('Error', 'Failed to save project: ' + error.message, 'error');
    }
}

// Clear project edit state
function clearProjectEdit() {
    cmsState.editingProjectId = null;
    document.querySelector('#projectForm h3').textContent = 'New Project';
}

// Delete blog post
async function deleteBlogPost(id) {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
        const { error } = await supabase.from('blog_posts').delete().eq('id', id);
        if (error) throw error;

        showCmsModal('Success', 'Blog post deleted successfully!', 'success');
        await loadBlogPosts();
    } catch (error) {
        showCmsModal('Error', 'Failed to delete blog post: ' + error.message, 'error');
    }
}

// Edit blog post
async function editBlogPost(id) {
    showCmsModal('Info', 'Edit functionality coming soon!', 'success');
}

// Delete project
async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;

        showCmsModal('Success', 'Project deleted successfully!', 'success');
        await loadProjects();
    } catch (error) {
        showCmsModal('Error', 'Failed to delete project: ' + error.message, 'error');
    }
}

// Edit project
async function editProject(id) {
    try {
        const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();

        if (error) throw error;
        if (!data) throw new Error('Project not found');

        // Set edit state
        cmsState.editingProjectId = id;

        // Populate form with project data
        document.getElementById('projectTitleEditor').innerHTML = data.title;
        document.getElementById('projectTitle').value = data.title;

        document.getElementById('projectDescriptionEditor').innerHTML = data.description;
        document.getElementById('projectDescription').value = data.description;

        document.getElementById('projectLink').value = data.link || '';
        document.getElementById('projectTags').value = data.tags || '';

        // Update form header and button
        document.querySelector('#projectForm h3').textContent = 'Edit Project';

        // Show form and hide list
        document.getElementById('projectsList').classList.add('hidden');
        document.getElementById('projectForm').classList.remove('hidden');

        // Focus on title
        document.getElementById('projectTitleEditor').focus();
    } catch (error) {
        console.error('Edit project error:', error);
        showCmsModal('Error', 'Failed to load project: ' + error.message, 'error');
    }
}

// Show CMS Modal
function showCmsModal(title, message, type = 'success') {
    const modal = document.getElementById('cmsModal');
    const overlay = document.getElementById('cmsOverlay');
    const titleEl = document.getElementById('cmsModalTitle');
    const messageEl = document.getElementById('cmsModalMessage');

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.className = `cms-modal ${type}`;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

// Close CMS Modal
function closeCmsModal() {
    const modal = document.getElementById('cmsModal');
    const overlay = document.getElementById('cmsOverlay');
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
}

// Make globally available for inline onclick handlers
window.closeCmsModal = closeCmsModal;
window.editBlogPost = editBlogPost;
window.deleteBlogPost = deleteBlogPost;
window.editProject = editProject;
window.deleteProject = deleteProject;

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('cmsOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeCmsModal);
    }
});

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
