// CMS Logic for blog posts and projects
import { restoreSession, isAdmin, getTheme } from './auth.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vtvebpqjucqxvdmznqbq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dmVicHFqdWNxeHZkbXpucWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwOTg4MzEsImV4cCI6MjAyNDY3NDgzMX0.I9XnvTe0SHCqHN_Xx6q2c4ZN0cWAFRJDFEu8SvXDkpE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    const cancelBtn = blogForm.querySelector('.btn-cancel');
    const saveBtn = blogForm.querySelector('.btn-save');

    newBlogBtn.addEventListener('click', () => {
        blogForm.classList.remove('hidden');
        document.querySelector('#blog-tab form').reset();
    });

    cancelBtn.addEventListener('click', () => {
        blogForm.classList.add('hidden');
    });

    saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await saveBlogPost();
    });

    loadBlogPosts();
}

// Load blog posts
async function loadBlogPosts() {
    const container = document.getElementById('blogList');

    // Placeholder - will integrate with Supabase
    container.innerHTML = `
        <div class="cms-empty">
            <p>No blog posts yet. Create your first post!</p>
        </div>
    `;

    // In future: fetch from supabase
    // const { data, error } = await supabase.from('blog_posts').select('*');
}

// Save blog post
async function saveBlogPost() {
    const title = document.getElementById('blogTitle').value;
    const slug = document.getElementById('blogSlug').value;
    const excerpt = document.getElementById('blogExcerpt').value;
    const content = document.getElementById('blogContent').value;

    if (!title || !slug || !content) {
        alert('Please fill in all required fields');
        return;
    }

    // In future: save to Supabase
    alert('Blog post saved! (CMS integration in progress)');
    document.getElementById('blogForm').classList.add('hidden');
}

// Setup projects
function setupProjects() {
    const newProjectBtn = document.getElementById('newProjectBtn');
    const projectForm = document.getElementById('projectForm');
    const cancelBtn = projectForm.querySelector('.btn-cancel');
    const saveBtn = projectForm.querySelector('.btn-save');

    newProjectBtn.addEventListener('click', () => {
        projectForm.classList.remove('hidden');
        document.querySelector('#projects-tab form').reset();
    });

    cancelBtn.addEventListener('click', () => {
        projectForm.classList.add('hidden');
    });

    saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await saveProject();
    });

    loadProjects();
}

// Load projects
async function loadProjects() {
    const container = document.getElementById('projectsList');

    // Placeholder
    container.innerHTML = `
        <div class="cms-empty">
            <p>No projects yet. Create your first project!</p>
        </div>
    `;

    // In future: fetch from supabase
    // const { data, error } = await supabase.from('projects').select('*');
}

// Save project
async function saveProject() {
    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDescription').value;
    const link = document.getElementById('projectLink').value;
    const tags = document.getElementById('projectTags').value;

    if (!title || !description) {
        alert('Please fill in all required fields');
        return;
    }

    // In future: save to Supabase
    alert('Project saved! (CMS integration in progress)');
    document.getElementById('projectForm').classList.add('hidden');
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
