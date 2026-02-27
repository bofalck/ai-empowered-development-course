// Shared logic for collection pages (projects and blog)
import { supabase } from './supabase-client.js';
import {
    extractUniqueTags,
    filterItemsByTag,
    sortChronological,
    getProjectEmoji,
    formatDate,
    extractPlainText
} from './page-utils.js';

// Page state
let allItems = [];
let activeTag = '';
let pageType = null; // 'projects' or 'blog'

/**
 * Initialize collection page
 * @param {String} type - Type of collection ('projects' or 'blog')
 */
export async function initializePage(type) {
    pageType = type;

    // Check for detail view (query param id)
    const params = new URLSearchParams(window.location.search);
    const detailId = params.get('id');

    // Fetch data from Supabase
    const items = await fetchCollectionData(type);

    if (!items || items.length === 0) {
        showEmptyState();
        return;
    }

    // Store and sort items
    allItems = sortChronological(items);

    // If viewing a detail page for a specific item
    if (detailId) {
        const item = allItems.find(i => i.id === detailId);
        if (item) {
            renderDetailView(item);
        } else {
            showEmptyState();
        }
        return;
    }

    // Otherwise show collection grid
    // Render filter bar
    renderFilterBar();

    // Render collection
    renderCollection(allItems);
}

/**
 * Fetch collection data from Supabase
 * @param {String} tableType - Type of data to fetch ('projects' or 'blog_posts')
 * @returns {Array} - Array of items or null if error
 */
async function fetchCollectionData(tableType) {
    const tableName = tableType === 'projects' ? 'projects' : 'blog_posts';

    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Error fetching ${tableName}:`, error);
            return null;
        }

        return data;
    } catch (error) {
        console.error(`Failed to fetch ${tableName}:`, error);
        return null;
    }
}

/**
 * Render the filter bar with available tags
 */
function renderFilterBar() {
    const filterBar = document.getElementById('filterBar');
    const tags = extractUniqueTags(allItems);

    if (tags.length === 0) {
        filterBar.innerHTML = '';
        return;
    }

    const filterButtons = ['All', ...tags].map(tag => {
        const isActive = activeTag === (tag === 'All' ? '' : tag) ? 'active' : '';
        const buttonClass = `filter-btn ${isActive}`;
        const dataTag = tag === 'All' ? '' : tag;

        return `<button class="${buttonClass}" data-tag="${dataTag}">${tag}</button>`;
    }).join('');

    filterBar.innerHTML = filterButtons;

    // Add event listeners
    const filterButtons_elements = filterBar.querySelectorAll('.filter-btn');
    filterButtons_elements.forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleFilterClick(e.target.getAttribute('data-tag'));
        });
    });
}

/**
 * Handle filter button click
 * @param {String} tag - Selected tag (empty string for 'All')
 */
function handleFilterClick(tag) {
    activeTag = tag;
    renderFilterBar();
    renderCollection(filterItemsByTag(allItems, tag));
}

/**
 * Render the collection grid
 * @param {Array} items - Items to render
 */
export function renderCollection(items) {
    const gridId = pageType === 'projects' ? 'projectsGrid' : 'blogGrid';
    const grid = document.getElementById(gridId);

    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>No ${pageType} found${activeTag ? ` with tag "${activeTag}"` : ''}.</p>
            </div>
        `;
        return;
    }

    const itemsHTML = items.map(item => {
        if (pageType === 'projects') {
            return renderProjectCard(item);
        } else {
            return renderBlogCard(item);
        }
    }).join('');

    grid.innerHTML = itemsHTML;
}

/**
 * Render a project card
 * @param {Object} project - Project object
 * @returns {String} - HTML string
 */
function renderProjectCard(project) {
    const emoji = getProjectEmoji(project);
    const title = extractPlainText(project.title);
    const description = extractPlainText(project.description || '');
    const tags = project.tags ? project.tags.split(',').slice(0, 3).map(tag =>
        `<span class="tag">${tag.trim()}</span>`
    ).join('') : '';

    return `
        <div class="card project-card">
            <div class="card-emoji">${emoji}</div>
            <h3 class="card-title">${title}</h3>
            ${description ? `<p class="card-description">${description}</p>` : ''}
            ${tags ? `<div class="card-tags">${tags}</div>` : ''}
            ${project.link ? `<a href="${project.link}" target="_blank" rel="noopener noreferrer" class="card-link">View Project →</a>` : ''}
        </div>
    `;
}

/**
 * Render a blog card
 * @param {Object} post - Blog post object
 * @returns {String} - HTML string
 */
function renderBlogCard(post) {
    const date = formatDate(post.created_at);
    const title = extractPlainText(post.title);
    const excerpt = extractPlainText(post.excerpt || '');
    const tags = post.tags ? post.tags.split(',').slice(0, 2).map(tag =>
        `<span class="tag">${tag.trim()}</span>`
    ).join('') : '';

    return `
        <div class="card blog-card">
            <time class="card-date">${date}</time>
            <h3 class="card-title">${title}</h3>
            ${excerpt ? `<p class="card-excerpt">${excerpt}</p>` : ''}
            ${tags ? `<div class="card-tags">${tags}</div>` : ''}
            ${post.slug ? `<a href="/blog/${post.slug}.html" class="card-link">Read More →</a>` : ''}
        </div>
    `;
}

/**
 * Render detail view for a single item
 * @param {Object} item - The item to display in detail
 */
function renderDetailView(item) {
    const gridId = pageType === 'projects' ? 'projectsGrid' : 'blogGrid';
    const filterBar = document.getElementById('filterBar');
    const collectionHeader = document.querySelector('.collection-header');

    // Hide filter bar and collection header in detail view
    if (filterBar) filterBar.style.display = 'none';
    if (collectionHeader) collectionHeader.style.display = 'none';

    const grid = document.getElementById(gridId);
    let detailHTML;

    if (pageType === 'projects') {
        const emoji = getProjectEmoji(item);
        const title = extractPlainText(item.title);
        const description = extractPlainText(item.description || '');
        const tags = item.tags ? item.tags.split(',').map(tag =>
            `<span class="tag">${tag.trim()}</span>`
        ).join('') : '';

        detailHTML = `
            <div class="detail-view">
                <div class="detail-header">
                    <a href="/projects.html" class="back-link">← Back to Projects</a>
                </div>
                <div class="detail-content project-detail">
                    <div class="detail-emoji">${emoji}</div>
                    <h1 class="detail-title">${title}</h1>
                    ${description ? `<div class="detail-description">${description}</div>` : ''}
                    ${tags ? `<div class="detail-tags">${tags}</div>` : ''}
                    ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="detail-link">View Project →</a>` : ''}
                </div>
            </div>
        `;
    } else {
        const date = formatDate(item.created_at);
        const title = extractPlainText(item.title);
        const excerpt = extractPlainText(item.excerpt || '');
        const content = extractPlainText(item.content || item.description || '');
        const tags = item.tags ? item.tags.split(',').map(tag =>
            `<span class="tag">${tag.trim()}</span>`
        ).join('') : '';

        detailHTML = `
            <div class="detail-view">
                <div class="detail-header">
                    <a href="/blog.html" class="back-link">← Back to Blog</a>
                </div>
                <div class="detail-content blog-detail">
                    <time class="detail-date">${date}</time>
                    <h1 class="detail-title">${title}</h1>
                    ${excerpt ? `<p class="detail-excerpt">${excerpt}</p>` : ''}
                    ${tags ? `<div class="detail-tags">${tags}</div>` : ''}
                    ${content ? `<div class="detail-body">${content}</div>` : ''}
                </div>
            </div>
        `;
    }

    grid.innerHTML = detailHTML;
}

/**
 * Show empty state message
 */
function showEmptyState() {
    const gridId = pageType === 'projects' ? 'projectsGrid' : 'blogGrid';
    const grid = document.getElementById(gridId);

    grid.innerHTML = `
        <div class="empty-state">
            <p>No ${pageType} found. Check back soon!</p>
        </div>
    `;
}
