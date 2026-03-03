// CMS Logic for blog posts and projects
import { restoreSession, isAdmin, applyTheme, setupThemeSwitcher } from './auth.js';
import { supabase } from './supabase-client.js';
import { blogApi, projectsApi, eventsApi, aboutApi } from './lib/api.js';
import { APP_IDS, APP_NAMES } from './lib/types.js';
import { extractPlainText as utilExtractPlainText } from './lib/utils.js';

// Edit state
const cmsState = {
    editingProjectId: null,
    editingBlogPostId: null,
};

// Helper function to extract plain text from HTML
function extractPlainText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

// Sanitize Quill output to remove duplicate tags and excessive breaks
function sanitizeQuillOutput(html) {
    if (!html) return '';

    let cleaned = html;

    // Remove excessive consecutive <br> tags (more than 2 in a row)
    cleaned = cleaned.replace(/<br\s*\/?>\s*<br\s*\/?>\s*<br\s*\/?>/g, '<br>');

    // Remove <br> tags at the beginning and end
    cleaned = cleaned.replace(/^(<br\s*\/?>\s*)+|(<br\s*\/?>\s*)+$/g, '');

    // Fix nested paragraph tags (remove empty paragraphs inside paragraphs)
    cleaned = cleaned.replace(/<p>\s*<p>/g, '<p>');
    cleaned = cleaned.replace(/<\/p>\s*<\/p>/g, '</p>');

    // Remove empty paragraphs
    cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');

    // Remove multiple consecutive spaces
    cleaned = cleaned.replace(/&nbsp;{2,}/g, '&nbsp;');

    // Trim whitespace around block elements
    cleaned = cleaned.replace(/>(\s+)</g, '><');

    // Remove trailing whitespace in tags
    cleaned = cleaned.trim();

    return cleaned;
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

// Cropper instance and state
let cropper = null;
let currentCropFile = null;
let currentCropEditor = null;

// Image upload handler for Quill - opens crop modal
function handleImageUpload(file, editor) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showCmsModal('Error', 'Invalid image type. Please use JPG, PNG, WebP, or GIF.', 'error');
        return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        showCmsModal('Error', 'Image too large. Maximum size is 50MB.', 'error');
        return;
    }

    // Store file and editor for cropping
    currentCropFile = file;
    currentCropEditor = editor;

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);

    // Show crop modal
    const cropImage = document.getElementById('cropImage');
    cropImage.src = objectUrl;

    const cropModal = document.getElementById('cropModal');
    const cropOverlay = document.getElementById('cmsOverlay');
    cropModal.classList.remove('hidden');
    cropModal.style.display = 'flex';
    cropOverlay.classList.remove('hidden');
    cropOverlay.style.display = 'block';

    // Initialize cropper when image loads
    cropImage.onload = () => {
        // Destroy existing cropper if any
        if (cropper) {
            cropper.destroy();
        }

        // Create new cropper instance
        cropper = new Cropper(cropImage, {
            aspectRatio: NaN,
            viewMode: 1,
            autoCropArea: 1,
            responsive: true,
            restore: true,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: true
        });
    };
}

// Crop and upload handler
async function performCrop() {
    if (!cropper || !currentCropFile || !currentCropEditor) {
        showCmsModal('Error', 'No image to crop', 'error');
        return;
    }

    try {
        // Store references before they get cleared
        const editorRef = currentCropEditor;
        const fileRef = currentCropFile;
        const fileType = currentCropFile.type;

        // Get cropped canvas
        const canvas = cropper.getCroppedCanvas({
            maxWidth: 2000,
            maxHeight: 2000,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            // Create new file from cropped blob
            const croppedFile = new File([blob], fileRef.name, { type: fileType });

            // Close crop modal
            closeCropModal();

            // Upload cropped image
            await uploadCroppedImage(croppedFile, editorRef);
        }, fileType, 0.85);
    } catch (error) {
        console.error('Crop error:', error);
        showCmsModal('Error', 'Error cropping image: ' + error.message, 'error');
    }
}

// Upload the cropped image
async function uploadCroppedImage(file, editor) {
    try {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const fileName = `private/image-${timestamp}-${random}.${ext}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('cms-media')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Image upload error:', uploadError);
            showCmsModal('Error', `Failed to upload image: ${uploadError.message}`, 'error');
            return;
        }

        // Get public URL
        const { data: urlData } = supabase
            .storage
            .from('cms-media')
            .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;
        console.log('Image uploaded successfully:', imageUrl);

        // Insert image into the editor
        const range = editor.getSelection();
        editor.insertEmbed(range.index, 'image', imageUrl);

        showCmsModal('Success', 'Image uploaded successfully!', 'success');
    } catch (error) {
        console.error('Upload error:', error);
        showCmsModal('Error', 'Error uploading image: ' + error.message, 'error');
    }
}

// Close crop modal
function closeCropModal() {
    const cropModal = document.getElementById('cropModal');
    const cropOverlay = document.getElementById('cmsOverlay');

    // Hide crop modal
    cropModal.classList.add('hidden');
    cropModal.style.display = 'none';

    // Keep overlay visible only if a different modal is open
    const cmsModal = document.getElementById('cmsModal');
    if (cmsModal && !cmsModal.classList.contains('hidden')) {
        cropOverlay.style.display = 'block';
    } else {
        cropOverlay.classList.add('hidden');
        cropOverlay.style.display = 'none';
    }

    // Destroy cropper
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }

    // Reset state
    currentCropFile = null;
    currentCropEditor = null;
    document.getElementById('cropImage').src = '';
}

// Video URL handler for Quill
function handleVideoUrl(editor) {
    const url = prompt('Enter video URL (YouTube, Vimeo, etc.):\n\nYouTube: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID\nVimeo: https://vimeo.com/VIDEO_ID');
    if (!url) return;

    // Validate URL
    if (!url.match(/^https?:\/\/.+/)) {
        showCmsModal('Error', 'Invalid URL. Please enter a valid video URL.', 'error');
        return;
    }

    try {
        let videoUrl = url;

        // Convert YouTube watch URL to embed format
        let youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (youtubeMatch) {
            videoUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        }

        // Handle Vimeo URLs
        let vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) {
            videoUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        const range = editor.getSelection();
        editor.insertEmbed(range.index, 'video', videoUrl);
    } catch (error) {
        console.warn('Warning - error inserting video:', error);
        showCmsModal('Error', 'Error inserting video: ' + error.message, 'error');
    }
}

// About editor global
let aboutBioEditor = null;

// Setup About section
function setupAbout() {
    // Initialize Quill for bio
    aboutBioEditor = new Quill('#aboutBioEditor', {
        theme: 'snow',
        placeholder: 'Write your bio here...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                ['link'],
                ['clean']
            ]
        }
    });

    // Sync Quill content to hidden input
    aboutBioEditor.on('text-change', () => {
        document.getElementById('aboutBio').value = aboutBioEditor.root.innerHTML;
    });

    // Load existing profile into form
    loadAboutProfile();

    // Handle form submit
    document.getElementById('aboutFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAboutProfile();
    });
}

// Load existing profile data into the form
async function loadAboutProfile() {
    const { data: profile, error } = await aboutApi.get();

    if (error || !profile) return; // Empty form is fine for first-time setup

    document.getElementById('aboutName').value = profile.name || '';
    document.getElementById('aboutPhotoUrl').value = profile.photo_url || '';
    document.getElementById('aboutLinkedin').value = profile.linkedin_url || '';
    document.getElementById('aboutInstagram').value = profile.instagram_url || '';
    document.getElementById('aboutMedium').value = profile.medium_url || '';
    document.getElementById('aboutBluesky').value = profile.bluesky_url || '';

    if (aboutBioEditor && profile.bio) {
        aboutBioEditor.root.innerHTML = profile.bio;
        document.getElementById('aboutBio').value = profile.bio;
    }
}

// Save about profile to database
async function saveAboutProfile() {
    const profile = {
        name: document.getElementById('aboutName').value.trim(),
        photo_url: document.getElementById('aboutPhotoUrl').value.trim() || null,
        bio: aboutBioEditor ? sanitizeQuillOutput(aboutBioEditor.root.innerHTML) : '',
        linkedin_url: document.getElementById('aboutLinkedin').value.trim() || null,
        instagram_url: document.getElementById('aboutInstagram').value.trim() || null,
        medium_url: document.getElementById('aboutMedium').value.trim() || null,
        bluesky_url: document.getElementById('aboutBluesky').value.trim() || null,
    };

    if (!profile.name) {
        showCmsModal('Error', 'Name is required', 'error');
        return;
    }

    // Check if a row already exists to decide insert vs update
    const { data: existing } = await aboutApi.get();

    if (existing) {
        profile.id = existing.id;
    }

    const { error } = await aboutApi.upsert(profile);

    if (error) {
        showCmsModal('Error', 'Failed to save: ' + error.message, 'error');
        return;
    }

    showCmsModal('Success', 'About profile saved!', 'success');
}

// Load analytics data
async function loadAnalytics() {
    try {
        // Get blog posts with their metrics
        const { data: blogData, error: blogError } = await blogApi.getAll();
        if (blogError) throw blogError;

        // Get projects with their metrics
        const { data: projectData, error: projectError } = await projectsApi.getAll();
        if (projectError) throw projectError;

        // Get engagement metrics for blog posts
        if (blogData && blogData.length > 0) {
            const blogMetrics = await Promise.all(
                blogData.map(async (post) => {
                    const { data: events, error } = await eventsApi.getByContentId('blog_post', post.id);

                    if (error) {
                        console.error('Error fetching blog metrics:', error);
                        return { ...post, views: 0, reactions: 0, shares: 0 };
                    }

                    const views = events.filter(e => e.event_type === 'view' || e.event_type === 'detail_view').length;
                    const reactions = events.filter(e => e.event_type === 'reaction').length;
                    const shares = events.filter(e => e.event_type === 'share').length;

                    return { ...post, views, reactions, shares };
                })
            );
            displayBlogAnalytics(blogMetrics);
        }

        // Get engagement metrics for projects
        if (projectData && projectData.length > 0) {
            const projectMetrics = await Promise.all(
                projectData.map(async (project) => {
                    const { data: events, error } = await eventsApi.getByContentId('project', project.id);

                    if (error) {
                        console.error('Error fetching project metrics:', error);
                        return { ...project, views: 0, reactions: 0, shares: 0 };
                    }

                    const views = events.filter(e => e.event_type === 'detail_view').length;
                    const reactions = events.filter(e => e.event_type === 'reaction').length;
                    const shares = events.filter(e => e.event_type === 'share').length;

                    return { ...project, views, reactions, shares };
                })
            );
            displayProjectAnalytics(projectMetrics);
        }

        // Get app launch counts
        const appMetrics = await Promise.all(
            Object.entries(APP_IDS).map(async ([key, appId]) => {
                const { data: events } = await eventsApi.getByContentId('app', appId);
                return {
                    id: appId,
                    name: APP_NAMES[appId] || key,
                    launches: events ? events.filter(e => e.event_type === 'app_launch').length : 0,
                    uniqueGuests: events ? new Set(events.map(e => e.user_identifier)).size : 0,
                };
            })
        );
        displayAppAnalytics(appMetrics);

    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Display blog analytics
function displayBlogAnalytics(blogMetrics) {
    const analyticsSection = document.getElementById('blogAnalytics');
    if (!analyticsSection) return;

    const totalViews = blogMetrics.reduce((sum, post) => sum + post.views, 0);
    const totalReactions = blogMetrics.reduce((sum, post) => sum + post.reactions, 0);

    // Sort by views for top posts
    const topPosts = blogMetrics.sort((a, b) => b.views - a.views).slice(0, 5);

    analyticsSection.innerHTML = `
        <h3>Blog Post Performance</h3>
        <div class="analytics-grid">
            <div class="metric-card">
                <div class="metric-value">${totalViews}</div>
                <div class="metric-label">Total Views</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${totalReactions}</div>
                <div class="metric-label">Total Reactions</div>
            </div>
        </div>

        <div class="top-posts-section">
            <h4>Top Blog Posts by Views</h4>
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Views</th>
                        <th>Reactions</th>
                        <th>Engagement %</th>
                    </tr>
                </thead>
                <tbody>
                    ${topPosts.map(post => {
                        const engagement = post.views > 0
                            ? (((post.reactions) / post.views) * 100).toFixed(1)
                            : 0;
                        return `
                            <tr>
                                <td>${extractPlainText(post.title)}</td>
                                <td>${post.views}</td>
                                <td>${post.reactions}</td>
                                <td>${engagement}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Display project analytics
function displayProjectAnalytics(projectMetrics) {
    const analyticsSection = document.getElementById('projectAnalytics');
    if (!analyticsSection) return;

    const totalViews = projectMetrics.reduce((sum, project) => sum + project.views, 0);
    const totalShares = projectMetrics.reduce((sum, project) => sum + project.shares, 0);

    // Sort by views for top projects
    const topProjects = projectMetrics.sort((a, b) => b.views - a.views).slice(0, 5);

    analyticsSection.innerHTML = `
        <h3>Project Performance</h3>
        <div class="analytics-grid">
            <div class="metric-card">
                <div class="metric-value">${totalViews}</div>
                <div class="metric-label">Total Views</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${totalShares}</div>
                <div class="metric-label">Total Shares</div>
            </div>
        </div>

        <div class="top-posts-section">
            <h4>Top Projects by Views</h4>
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Views</th>
                        <th>Shares</th>
                        <th>Engagement %</th>
                    </tr>
                </thead>
                <tbody>
                    ${topProjects.map(project => {
                        const engagement = project.views > 0
                            ? (((project.shares) / project.views) * 100).toFixed(1)
                            : 0;
                        return `
                            <tr>
                                <td>${extractPlainText(project.title)}</td>
                                <td>${project.views}</td>
                                <td>${project.shares}</td>
                                <td>${engagement}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Display app launch analytics
function displayAppAnalytics(appMetrics) {
    const analyticsSection = document.getElementById('appAnalytics');
    if (!analyticsSection) return;

    const totalLaunches = appMetrics.reduce((sum, app) => sum + app.launches, 0);
    const totalGuests = appMetrics.reduce((sum, app) => sum + app.uniqueGuests, 0);

    analyticsSection.innerHTML = `
        <h3>Application Usage</h3>
        <div class="analytics-grid">
            <div class="metric-card">
                <div class="metric-value">${totalLaunches}</div>
                <div class="metric-label">Total Launches</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${totalGuests}</div>
                <div class="metric-label">Unique Guests</div>
            </div>
        </div>

        <div class="top-posts-section">
            <h4>Launches per App</h4>
            <table class="analytics-table">
                <thead>
                    <tr>
                        <th>App</th>
                        <th>Launches</th>
                        <th>Unique Guests</th>
                    </tr>
                </thead>
                <tbody>
                    ${appMetrics.map(app => `
                        <tr>
                            <td>${app.name}</td>
                            <td>${app.launches}</td>
                            <td>${app.uniqueGuests}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Initialize CMS
async function init() {
    // Check auth
    const loggedIn = await restoreSession();
    if (!loggedIn || !isAdmin()) {
        window.location.href = '/';
        return;
    }

    // Apply theme
    applyTheme();

    // Setup theme switcher
    setupThemeSwitcher();

    // Setup tabs
    setupTabs();

    // Setup crop modal handlers
    setupCropModal();

    // Setup blog
    setupBlog();

    // Setup projects
    setupProjects();

    // Setup about
    setupAbout();

    // Load analytics
    loadAnalytics();
}

// Setup crop modal event listeners
function setupCropModal() {
    const cropBtn = document.getElementById('cropBtn');
    const cancelCropBtn = document.getElementById('cancelCropBtn');
    const cropModal = document.getElementById('cropModal');

    if (cropBtn) {
        cropBtn.addEventListener('click', performCrop);
    }

    if (cancelCropBtn) {
        cancelCropBtn.addEventListener('click', closeCropModal);
    }

    // Close crop modal on overlay click
    const cropOverlay = document.getElementById('cmsOverlay');
    if (cropOverlay) {
        // Don't close on overlay click for crop modal, only on cancel button
    }
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
        clearBlogEdit();
        document.getElementById('blogList').classList.add('hidden');
        blogForm.classList.remove('hidden');
        blogFormElement.reset();

        // Clear Quill editor
        if (blogContentEditor) {
            blogContentEditor.setContents([]);
        }

        document.querySelector('#blogForm h3').textContent = 'New Blog Post';
        document.getElementById('blogTitle').focus();
    });

    cancelBtn.addEventListener('click', () => {
        clearProjectEdit();
        clearBlogEdit();
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
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    // Set up custom image handler for blog editor
    const blogImageModule = blogContentEditor.getModule('toolbar');
    blogImageModule.addHandler('image', () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
            const file = input.files[0];
            if (file) {
                handleImageUpload(file, blogContentEditor);
            }
        };
    });

    // Set up custom video handler for blog editor
    blogImageModule.addHandler('video', () => {
        handleVideoUrl(blogContentEditor);
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
    const excerpt = document.getElementById('blogExcerpt').value.trim();
    const tags = document.getElementById('blogTags').value.trim();

    // Get content from Quill editor
    let content = blogContentEditor ? blogContentEditor.root.innerHTML.trim() : '';

    // Sanitize content to remove duplicate tags and excessive breaks
    content = sanitizeQuillOutput(content);

    if (!title || !content) {
        showCmsModal('Error', 'Please fill in Title and Content', 'error');
        return;
    }

    try {
        let result;
        if (cmsState.editingBlogPostId) {
            // Update existing blog post
            result = await supabase.from('blog_posts').update({
                title,
                excerpt: excerpt || null,
                content,
                tags: tags || null,
            }).eq('id', cmsState.editingBlogPostId);
        } else {
            // Create new blog post
            const slug = generateSlug(title);
            result = await supabase.from('blog_posts').insert([
                {
                    title,
                    slug,
                    excerpt: excerpt || null,
                    content,
                    tags: tags || null,
                    created_at: new Date().toISOString()
                }
            ]);
        }

        const { error } = result;
        if (error) {
            console.error('Supabase error:', error);
            throw new Error(error.message || 'Failed to save blog post');
        }

        showCmsModal('Success', cmsState.editingBlogPostId ? 'Blog post updated successfully!' : 'Blog post saved successfully!', 'success');
        clearBlogEdit();
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

// Clear blog edit state
function clearBlogEdit() {
    cmsState.editingBlogPostId = null;
    document.querySelector('#blogForm h3').textContent = 'New Blog Post';
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
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        }
    });

    // Set up custom image handler for project editor
    const projectImageModule = projectDescriptionEditor.getModule('toolbar');
    projectImageModule.addHandler('image', () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
            const file = input.files[0];
            if (file) {
                handleImageUpload(file, projectDescriptionEditor);
            }
        };
    });

    // Set up custom video handler for project editor
    projectImageModule.addHandler('video', () => {
        handleVideoUrl(projectDescriptionEditor);
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
    const subtitle = document.getElementById('projectSubtitle').value.trim();
    const logotype = document.getElementById('projectLogotype').value.trim();
    let description = projectDescriptionEditor ? projectDescriptionEditor.root.innerHTML.trim() : '';
    const link = document.getElementById('projectLink').value.trim();
    const tags = document.getElementById('projectTags').value.trim();

    // Sanitize description to remove duplicate tags and excessive breaks
    description = sanitizeQuillOutput(description);

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
                subtitle: subtitle || null,
                logotype: logotype || null,
                description,
                link: link || null,
                tags: tags || null,
            }).eq('id', cmsState.editingProjectId);
        } else {
            // Create new project
            result = await supabase.from('projects').insert([
                {
                    title,
                    subtitle: subtitle || null,
                    logotype: logotype || null,
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
    try {
        const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single();

        if (error) throw error;
        if (!data) throw new Error('Blog post not found');

        // Set edit state
        cmsState.editingBlogPostId = id;

        // Populate form with blog post data
        document.getElementById('blogTitle').value = data.title;
        document.getElementById('blogExcerpt').value = data.excerpt || '';
        document.getElementById('blogTags').value = data.tags || '';

        // Set Quill editor content
        if (blogContentEditor) {
            blogContentEditor.root.innerHTML = data.content;
            document.getElementById('blogContent').value = data.content;
        }

        // Update form header
        document.querySelector('#blogForm h3').textContent = 'Edit Blog Post';

        // Show form and hide list
        document.getElementById('blogList').classList.add('hidden');
        document.getElementById('blogForm').classList.remove('hidden');

        // Focus on title
        document.getElementById('blogTitle').focus();
    } catch (error) {
        console.error('Edit blog post error:', error);
        showCmsModal('Error', 'Failed to load blog post: ' + error.message, 'error');
    }
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
        document.getElementById('projectTitle').value = data.title;
        document.getElementById('projectSubtitle').value = data.subtitle || '';
        document.getElementById('projectLogotype').value = data.logotype || '';
        document.getElementById('projectLink').value = data.link || '';
        document.getElementById('projectTags').value = data.tags || '';

        // Set Quill editor content
        if (projectDescriptionEditor) {
            projectDescriptionEditor.root.innerHTML = data.description;
            document.getElementById('projectDescription').value = data.description;
        }

        // Update form header and button
        document.querySelector('#projectForm h3').textContent = 'Edit Project';

        // Show form and hide list
        document.getElementById('projectsList').classList.add('hidden');
        document.getElementById('projectForm').classList.remove('hidden');

        // Focus on title
        document.getElementById('projectTitle').focus();
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
    const tryAgainBtn = document.getElementById('cmsModalTryAgain');
    const okBtn = document.getElementById('cmsModalOk');

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.className = `cms-modal ${type}`;
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');

    // Show "Try Again" button only for errors
    if (type === 'error') {
        tryAgainBtn.style.display = 'block';
        okBtn.textContent = 'Close';
    } else {
        tryAgainBtn.style.display = 'none';
        okBtn.textContent = 'OK';
    }
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
window.clearBlogEdit = clearBlogEdit;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.closeCropModal = closeCropModal;
window.performCrop = performCrop;

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('cmsOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            // Check which modal is open
            const cropModal = document.getElementById('cropModal');
            const cmsModal = document.getElementById('cmsModal');

            if (cropModal && !cropModal.classList.contains('hidden')) {
                // Don't close on overlay click for crop modal
                return;
            }

            if (cmsModal && !cmsModal.classList.contains('hidden')) {
                closeCmsModal();
            }
        });
    }
});

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
