// CMS Logic for blog posts and projects
import { restoreSession, isAdmin, getTheme } from './auth.js';
import { supabase } from './supabase-client.js';

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

// Initialize CMS
async function init() {
    // Check auth
    if (!restoreSession() || !isAdmin()) {
        window.location.href = '/';
        return;
    }

    // Apply theme
    applyTheme();

    // Setup tabs
    setupTabs();

    // Setup blog
    setupBlog();

    // Setup projects
    setupProjects();
}

// Apply theme
function applyTheme() {
    const theme = getTheme();
    document.body.className = `theme-${theme}`;
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
        document.getElementById('blogList').classList.add('hidden');
        blogForm.classList.remove('hidden');
        blogFormElement.reset();
        document.getElementById('blogTitleEditor').innerHTML = '';
        document.getElementById('blogContentEditor').innerHTML = '';
        setupTitleEditor('blog');
        setupBlogEditor();
    });

    cancelBtn.addEventListener('click', () => {
        blogForm.classList.add('hidden');
        document.getElementById('blogList').classList.remove('hidden');
    });

    blogFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveBlogPost();
    });

    setupTitleEditor('blog');
    setupBlogEditor();
    loadBlogPosts();
}

// Setup title editor
function setupTitleEditor(prefix) {
    const editor = document.getElementById(`${prefix}TitleEditor`);
    const headingSelect = document.getElementById(`${prefix}TitleHeading`);
    const fontSelect = document.getElementById(`${prefix}TitleFont`);
    const sizeSelect = document.getElementById(`${prefix}TitleSize`);
    const boldBtn = document.getElementById(`${prefix}TitleBold`);
    const italicBtn = document.getElementById(`${prefix}TitleItalic`);
    const underlineBtn = document.getElementById(`${prefix}TitleUnderline`);
    const clearBtn = document.getElementById(`${prefix}TitleClear`);

    if (!editor) return; // Editor doesn't exist for this prefix

    headingSelect.addEventListener('change', () => {
        document.execCommand('formatBlock', false, `<${headingSelect.value}>`);
        editor.focus();
        headingSelect.value = 'p';
    });

    fontSelect.addEventListener('change', () => {
        if (fontSelect.value !== 'inherit') {
            document.execCommand('fontName', false, fontSelect.value);
            editor.focus();
        }
        fontSelect.value = 'inherit';
    });

    sizeSelect.addEventListener('change', () => {
        if (sizeSelect.value) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const span = document.createElement('span');
                span.style.fontSize = sizeSelect.value;
                range.surroundContents(span);
                editor.focus();
            }
        }
        sizeSelect.value = '';
    });

    boldBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand('bold', false, null);
        editor.focus();
    });

    italicBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand('italic', false, null);
        editor.focus();
    });

    underlineBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand('underline', false, null);
        editor.focus();
    });

    clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand('removeFormat', false, null);
        editor.focus();
    });

    // Sync editor content to hidden input
    editor.addEventListener('blur', () => {
        const hiddenField = prefix === 'blog' ? 'blogTitle' : 'projectTitle';
        document.getElementById(hiddenField).value = editor.innerHTML;
    });
}

// Generic content editor setup
function setupContentEditor(prefix) {
    const editor = document.getElementById(`${prefix}ContentEditor`);
    const headingSelect = document.getElementById(`${prefix}Heading`);
    const fontSelect = document.getElementById(`${prefix}Font`);
    const sizeSelect = document.getElementById(`${prefix}Size`);
    const boldBtn = document.getElementById(`${prefix}Bold`);
    const italicBtn = document.getElementById(`${prefix}Italic`);
    const underlineBtn = document.getElementById(`${prefix}Underline`);
    const bulletBtn = document.getElementById(`${prefix}Bullet`);
    const numberBtn = document.getElementById(`${prefix}Number`);
    const linkBtn = document.getElementById(`${prefix}Link`);
    const clearBtn = document.getElementById(`${prefix}Clear`);

    if (!editor) return; // Editor doesn't exist for this prefix

    headingSelect.addEventListener('change', () => {
        document.execCommand('formatBlock', false, `<${headingSelect.value}>`);
        editor.focus();
        headingSelect.value = 'p';
    });

    fontSelect.addEventListener('change', () => {
        if (fontSelect.value !== 'inherit') {
            document.execCommand('fontName', false, fontSelect.value);
            editor.focus();
        }
        fontSelect.value = 'inherit';
    });

    sizeSelect.addEventListener('change', () => {
        if (sizeSelect.value) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const span = document.createElement('span');
                span.style.fontSize = sizeSelect.value;
                range.surroundContents(span);
                editor.focus();
            }
        }
        sizeSelect.value = '';
    });

    boldBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand('bold', false, null);
        editor.focus();
    });

    italicBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand('italic', false, null);
        editor.focus();
    });

    underlineBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand('underline', false, null);
        editor.focus();
    });

    bulletBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand('insertUnorderedList', false, null);
        editor.focus();
    });

    numberBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand('insertOrderedList', false, null);
        editor.focus();
    });

    linkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
        editor.focus();
    });

    clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand('removeFormat', false, null);
        editor.focus();
    });

    // Sync editor content to hidden input
    editor.addEventListener('blur', () => {
        // For blog: blogContent, for project: projectDescription
        const hiddenField = prefix === 'blog' ? 'blogContent' : 'projectDescription';
        document.getElementById(hiddenField).value = editor.innerHTML;
    });
}

// Setup blog editor toolbar
function setupBlogEditor() {
    setupContentEditor('blog');
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
                    <h4>${post.title}</h4>
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
    // Get title from editor
    const titleEditor = document.getElementById('blogTitleEditor');
    const title = titleEditor.innerHTML.trim();
    document.getElementById('blogTitle').value = title;

    // Auto-generate slug from title and timestamp
    const slug = generateSlug(title);

    const excerpt = document.getElementById('blogExcerpt').value;

    // Get content from editor
    const editor = document.getElementById('blogContentEditor');
    const content = editor.innerHTML.trim();

    // Also save to hidden input for form submission
    document.getElementById('blogContent').value = content;

    if (!title || !content) {
        showCmsModal('Error', 'Please fill in all required fields', 'error');
        return;
    }

    try {
        const { data, error } = await supabase.from('blog_posts').insert([
            {
                title,
                slug,
                excerpt,
                content,
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
        document.getElementById('blogContentEditor').innerHTML = '';
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
        document.getElementById('projectsList').classList.add('hidden');
        projectForm.classList.remove('hidden');
        projectFormElement.reset();
        document.getElementById('projectTitleEditor').innerHTML = '';
        document.getElementById('projectContentEditor').innerHTML = '';
        setupTitleEditor('project');
        setupContentEditor('project');
    });

    cancelBtn.addEventListener('click', () => {
        projectForm.classList.add('hidden');
        document.getElementById('projectsList').classList.remove('hidden');
    });

    projectFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProject();
    });

    setupTitleEditor('project');
    setupContentEditor('project');
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
                            <td class="cms-project-title">${project.title}</td>
                            <td class="cms-project-description">
                                <div class="cms-project-description-preview">${project.description}</div>
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

// Save project
async function saveProject() {
    // Get title from editor
    const titleEditor = document.getElementById('projectTitleEditor');
    const title = titleEditor.innerHTML.trim();
    document.getElementById('projectTitle').value = title;

    // Get description from editor
    const editor = document.getElementById('projectContentEditor');
    const description = editor.innerHTML.trim();

    // Also save to hidden input
    document.getElementById('projectDescription').value = description;

    const link = document.getElementById('projectLink').value;
    const tags = document.getElementById('projectTags').value;

    if (!title || !description) {
        showCmsModal('Error', 'Please fill in all required fields', 'error');
        return;
    }

    try {
        const { data, error } = await supabase.from('projects').insert([
            {
                title,
                description,
                link: link || null,
                tags: tags || null,
                created_at: new Date().toISOString()
            }
        ]);

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(error.message || 'Failed to insert project');
        }

        showCmsModal('Success', 'Project saved successfully!', 'success');
        document.getElementById('projectForm').classList.add('hidden');
        document.getElementById('projectForm').querySelector('form').reset();
        document.getElementById('projectContentEditor').innerHTML = '';
        // Show list and reload projects
        document.getElementById('projectsList').classList.remove('hidden');
        await loadProjects();
    } catch (error) {
        console.error('Save project error:', error);
        showCmsModal('Error', 'Failed to save project: ' + error.message, 'error');
    }
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
    showCmsModal('Info', 'Edit functionality coming soon!', 'success');
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
