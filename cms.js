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
function setupSimpleEditor(editorId, hiddenInputId, allowBold = true, allowItalic = false) {
    const editor = document.getElementById(editorId);
    const hiddenInput = document.getElementById(hiddenInputId);

    if (!editor) return;

    const toolbar = editor.previousElementSibling;
    const boldBtn = toolbar ? toolbar.querySelector('button[title*="Bold"]') : null;
    const italicBtn = toolbar ? toolbar.querySelector('button[title*="Italic"]') : null;

    if (boldBtn && allowBold) {
        boldBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('bold', false, null);
            editor.focus();
        });
    }

    if (italicBtn && allowItalic) {
        italicBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('italic', false, null);
            editor.focus();
        });
    }

    // Handle paste - sanitize immediately
    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
        const allowedTags = [];
        if (allowBold) allowedTags.push('b', 'strong');
        if (allowItalic) allowedTags.push('i', 'em');
        const sanitized = sanitizeEditorContent(text, allowedTags);
        document.execCommand('insertHTML', false, sanitized);
    });

    // Sync to hidden input
    editor.addEventListener('blur', () => {
        hiddenInput.value = editor.innerHTML;
    });

    editor.addEventListener('input', () => {
        hiddenInput.value = editor.innerHTML;
    });
}

// Setup full editor for content with all formatting options
function setupFullEditor(editorId, hiddenInputId) {
    const editor = document.getElementById(editorId);
    const hiddenInput = document.getElementById(hiddenInputId);

    if (!editor) {
        console.error('Editor not found:', editorId);
        return;
    }

    const toolbar = editor.previousElementSibling;
    const prefix = editorId.replace('Editor', '').replace('Content', '').replace('Editor', '');

    console.log('Setting up editor:', editorId, 'prefix:', prefix, 'toolbar found:', !!toolbar);

    // Heading select
    const headingSelect = toolbar ? toolbar.querySelector(`#${prefix}Heading`) : null;
    console.log('Heading select found:', !!headingSelect, 'looking for:', `#${prefix}Heading`);
    if (headingSelect) {
        headingSelect.addEventListener('change', (e) => {
            document.execCommand('formatBlock', false, `<${e.target.value}>`);
            editor.focus();
        });
    }

    // Font select
    const fontSelect = toolbar ? toolbar.querySelector(`#${prefix}Font`) : null;
    console.log('Font select found:', !!fontSelect);
    if (fontSelect) {
        fontSelect.addEventListener('change', (e) => {
            console.log('Font changed to:', e.target.value);
            if (e.target.value !== 'inherit') {
                document.execCommand('fontName', false, e.target.value);
            }
            editor.focus();
        });
    }

    // Size select
    const sizeSelect = toolbar ? toolbar.querySelector(`#${prefix}Size`) : null;
    console.log('Size select found:', !!sizeSelect);
    if (sizeSelect) {
        sizeSelect.addEventListener('change', (e) => {
            console.log('Size changed to:', e.target.value);
            if (e.target.value) {
                document.execCommand('fontSize', false, '7');
                const selections = editor.querySelectorAll('span[style*="font-size"]');
                selections.forEach(s => s.style.fontSize = e.target.value);
            }
            editor.focus();
        });
    }

    // Text formatting buttons
    const boldBtn = toolbar ? toolbar.querySelector(`#${prefix}Bold`) : null;
    if (boldBtn) {
        boldBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('bold', false, null);
            editor.focus();
        });
    }

    const italicBtn = toolbar ? toolbar.querySelector(`#${prefix}Italic`) : null;
    if (italicBtn) {
        italicBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('italic', false, null);
            editor.focus();
        });
    }

    const underlineBtn = toolbar ? toolbar.querySelector(`#${prefix}Underline`) : null;
    if (underlineBtn) {
        underlineBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('underline', false, null);
            editor.focus();
        });
    }

    // List buttons
    const bulletBtn = toolbar ? toolbar.querySelector(`#${prefix}Bullet`) : null;
    if (bulletBtn) {
        bulletBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('insertUnorderedList', false, null);
            editor.focus();
        });
    }

    const numberBtn = toolbar ? toolbar.querySelector(`#${prefix}Number`) : null;
    if (numberBtn) {
        numberBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('insertOrderedList', false, null);
            editor.focus();
        });
    }

    // Link button
    const linkBtn = toolbar ? toolbar.querySelector(`#${prefix}Link`) : null;
    if (linkBtn) {
        linkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = prompt('Enter URL:');
            if (url) {
                document.execCommand('createLink', false, url);
            }
            editor.focus();
        });
    }

    // Clear formatting button
    const clearBtn = toolbar ? toolbar.querySelector(`#${prefix}Clear`) : null;
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.execCommand('removeFormat', false, null);
            editor.focus();
        });
    }

    // Handle paste - sanitize to allowed tags only
    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
        const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'a'];
        const sanitized = sanitizeEditorContent(text, allowedTags);
        document.execCommand('insertHTML', false, sanitized);
    });

    // Sync to hidden input
    editor.addEventListener('blur', () => {
        hiddenInput.value = editor.innerHTML;
    });

    editor.addEventListener('input', () => {
        hiddenInput.value = editor.innerHTML;
    });
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
        document.getElementById('blogTitleEditor').innerHTML = '';
        document.getElementById('blogDescriptionEditor').innerHTML = '';
        document.getElementById('blogContentEditor').innerHTML = '';
        document.getElementById('blogTitleEditor').focus();
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

    // Setup editors
    setupSimpleEditor('blogTitleEditor', 'blogTitle', true, false);
    setupSimpleEditor('blogDescriptionEditor', 'blogDescription', true, true);
    setupFullEditor('blogContentEditor', 'blogContent');

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
    // Get title from editor
    const titleEditor = document.getElementById('blogTitleEditor');
    const title = titleEditor.innerHTML.trim();
    document.getElementById('blogTitle').value = title;

    // Auto-generate slug from title and timestamp
    const slug = generateSlug(title);

    const excerpt = document.getElementById('blogExcerpt').value;

    // Get description from editor
    const descriptionEditor = document.getElementById('blogDescriptionEditor');
    const description = descriptionEditor.innerHTML.trim();
    document.getElementById('blogDescription').value = description;

    // Get content from editor
    const contentEditor = document.getElementById('blogContentEditor');
    const content = contentEditor.innerHTML.trim();
    document.getElementById('blogContent').value = content;

    if (!title) {
        showCmsModal('Error', 'Please fill in the title', 'error');
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
        document.getElementById('blogTitleEditor').innerHTML = '';
        document.getElementById('blogDescriptionEditor').innerHTML = '';
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
        clearProjectEdit();
        document.getElementById('projectsList').classList.add('hidden');
        projectForm.classList.remove('hidden');
        projectFormElement.reset();
        document.getElementById('projectTitleEditor').innerHTML = '';
        document.getElementById('projectDescriptionEditor').innerHTML = '';
        document.querySelector('#projectForm h3').textContent = 'New Project';
        document.getElementById('projectTitleEditor').focus();
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

    // Setup editors
    setupSimpleEditor('projectTitleEditor', 'projectTitle', true, false);
    setupSimpleEditor('projectDescriptionEditor', 'projectDescription', true, true);

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
    // Get title from editor
    const titleEditor = document.getElementById('projectTitleEditor');
    const title = titleEditor.innerHTML.trim();
    document.getElementById('projectTitle').value = title;

    // Get description from editor
    const descriptionEditor = document.getElementById('projectDescriptionEditor');
    const description = descriptionEditor.innerHTML.trim();
    document.getElementById('projectDescription').value = description;

    const link = document.getElementById('projectLink').value;
    const tags = document.getElementById('projectTags').value;

    if (!title) {
        showCmsModal('Error', 'Please fill in the title', 'error');
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
        document.getElementById('projectTitleEditor').innerHTML = '';
        document.getElementById('projectDescriptionEditor').innerHTML = '';
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
