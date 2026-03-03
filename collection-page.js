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
import { blogApi, projectsApi, reactionsApi } from './lib/api.js';
import { trackEvent, trackBlogDetailView, trackProjectDetailView, trackBlogReaction, trackShare } from './lib/events.js';
import { getGuestId, extractPlainText as utilExtractPlainText } from './lib/utils.js';
import { CONTENT_TYPES, SHARE_PLATFORMS } from './lib/types.js';

// Page state
let allItems = [];
let activeTag = '';
let pageType = null; // 'projects' or 'blog'
let currentBlogPostId = null;
let currentUserReactions = {}; // Track current user's reactions: { emoji: true/false }

// Emoji reactions available
const AVAILABLE_REACTIONS = ['👍', '❤️', '🎉', '😂'];


// Load reactions for a blog post
async function loadBlogPostReactions(blogPostId) {
    try {
        const { data, error } = await supabase
            .from('blog_post_reactions')
            .select('emoji')
            .eq('blog_post_id', blogPostId);

        if (error) {
            console.error('Error loading reactions:', error);
            return {};
        }

        // Count reactions by emoji
        const reactions = {};
        AVAILABLE_REACTIONS.forEach(emoji => {
            reactions[emoji] = data.filter(r => r.emoji === emoji).length;
        });

        return reactions;
    } catch (error) {
        console.error('Error loading reactions:', error);
        return {};
    }
}

// Check if current user has reacted with a specific emoji
async function checkUserReaction(blogPostId, emoji) {
    try {
        const isAuthenticated = !!(await supabase.auth.getUser()).data.user;
        const identifier = isAuthenticated
            ? (await supabase.auth.getUser()).data.user.id
            : getGuestId();

        const column = isAuthenticated ? 'user_id' : 'guest_id';

        const { data, error } = await supabase
            .from('blog_post_reactions')
            .select('id')
            .eq('blog_post_id', blogPostId)
            .eq(column, identifier)
            .eq('emoji', emoji);

        if (error) {
            console.error('Error checking reaction:', error);
            return false;
        }

        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking reaction:', error);
        return false;
    }
}

// Load all current user reactions for a blog post
async function loadCurrentUserReactions(blogPostId) {
    try {
        const isAuthenticated = !!(await supabase.auth.getUser()).data.user;
        const identifier = isAuthenticated
            ? (await supabase.auth.getUser()).data.user.id
            : getGuestId();

        const column = isAuthenticated ? 'user_id' : 'guest_id';

        const { data, error } = await supabase
            .from('blog_post_reactions')
            .select('emoji')
            .eq('blog_post_id', blogPostId)
            .eq(column, identifier);

        if (error) {
            console.error('Error loading user reactions:', error);
            return {};
        }

        const reactions = {};
        AVAILABLE_REACTIONS.forEach(emoji => {
            reactions[emoji] = data.some(r => r.emoji === emoji);
        });

        return reactions;
    } catch (error) {
        console.error('Error loading user reactions:', error);
        return {};
    }
}

// Toggle reaction (add or remove)
async function toggleReaction(blogPostId, emoji) {
    try {
        const isAuthenticated = !!(await supabase.auth.getUser()).data.user;
        const identifier = isAuthenticated
            ? (await supabase.auth.getUser()).data.user.id
            : getGuestId();

        const column = isAuthenticated ? 'user_id' : 'guest_id';

        // Check if user already has this reaction
        const { data: existing, error: checkError } = await supabase
            .from('blog_post_reactions')
            .select('id')
            .eq('blog_post_id', blogPostId)
            .eq(column, identifier)
            .eq('emoji', emoji);

        if (checkError) {
            console.error('Error checking existing reaction:', checkError);
            return;
        }

        if (existing && existing.length > 0) {
            // Remove reaction
            const { error: deleteError } = await supabase
                .from('blog_post_reactions')
                .delete()
                .eq('id', existing[0].id);

            if (deleteError) {
                console.error('Error removing reaction:', deleteError);
                return;
            }
        } else {
            // Add reaction
            const { error: insertError } = await supabase
                .from('blog_post_reactions')
                .insert([{
                    blog_post_id: blogPostId,
                    [column]: identifier,
                    emoji: emoji
                }]);

            if (insertError) {
                console.error('Error adding reaction:', insertError);
                return;
            }

            // Track reaction event (only on add, not on remove)
            trackBlogReaction(blogPostId);
        }

        // Reload reactions and UI
        await loadAndDisplayReactions(blogPostId);
    } catch (error) {
        console.error('Error toggling reaction:', error);
    }
}

// Load and display reactions
async function loadAndDisplayReactions(blogPostId) {
    const reactions = await loadBlogPostReactions(blogPostId);
    currentUserReactions = await loadCurrentUserReactions(blogPostId);

    const reactionsContainer = document.getElementById('blogReactionsContainer');
    if (reactionsContainer) {
        reactionsContainer.innerHTML = createReactionsHTML(reactions);
        setupReactionEventListeners(blogPostId);
    }
}

// Create reactions HTML
function createReactionsHTML(reactions) {
    return `
        <div class="blog-reactions">
            ${AVAILABLE_REACTIONS.map(emoji => {
                const count = reactions[emoji] || 0;
                const isActive = currentUserReactions[emoji] || false;
                return `
                    <button
                        class="reaction-button ${isActive ? 'active' : ''}"
                        data-emoji="${emoji}"
                        title="${emoji}"
                    >
                        <span class="reaction-emoji">${emoji}</span>
                        <span class="reaction-count">${count > 0 ? count : ''}</span>
                    </button>
                `;
            }).join('')}
        </div>
    `;
}

// Setup reaction event listeners
function setupReactionEventListeners(blogPostId) {
    const buttons = document.querySelectorAll('.reaction-button');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const emoji = button.getAttribute('data-emoji');
            await toggleReaction(blogPostId, emoji);
        });
    });
}

// Create share buttons HTML
function createShareButtonsHTML(title, excerpt) {
    const shareUrl = window.location.href;
    const shareText = `"${title}" - ${excerpt.substring(0, 100)}...`;

    return `
        <div class="blog-share-buttons-group">
            <button class="share-button" id="shareNativeBtn" title="Share">
                <span class="share-icon">🔗</span>
            </button>
            <button class="share-button" id="shareBlueskyBtn" title="Share on Bluesky">
                <span class="share-icon">🦋</span>
            </button>
            <button class="share-button" id="shareLinkedInBtn" title="Share on LinkedIn">
                <span class="share-icon">in</span>
            </button>
        </div>
    `;
}

// Setup share event listeners
function setupShareEventListeners(title, excerpt, blogPostId) {
    const shareUrl = window.location.href;
    const shareText = `Check out "${title}" on After The Noise`;

    // Native share
    const nativeBtn = document.getElementById('shareNativeBtn');
    if (nativeBtn) {
        nativeBtn.addEventListener('click', async () => {
            // Track share event
            trackShare(CONTENT_TYPES.BLOG_POST, blogPostId, SHARE_PLATFORMS.NATIVE);

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: title,
                        text: excerpt,
                        url: shareUrl
                    });
                } catch {
                    // share cancelled or not supported
                }
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(shareUrl);
                nativeBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    nativeBtn.innerHTML = '<span class="share-icon">🔗</span>';
                }, 2000);
            }
        });
    }

    // Bluesky share
    const blueskyBtn = document.getElementById('shareBlueskyBtn');
    if (blueskyBtn) {
        blueskyBtn.addEventListener('click', () => {
            // Track share event
            trackShare(CONTENT_TYPES.BLOG_POST, blogPostId, SHARE_PLATFORMS.BLUESKY);

            const blueskyUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
            window.open(blueskyUrl, '_blank', 'width=550,height=420');
        });
    }

    // LinkedIn share
    const linkedInBtn = document.getElementById('shareLinkedInBtn');
    if (linkedInBtn) {
        linkedInBtn.addEventListener('click', () => {
            // Track share event
            trackShare(CONTENT_TYPES.BLOG_POST, blogPostId, SHARE_PLATFORMS.LINKEDIN);

            const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
            window.open(linkedinUrl, '_blank', 'width=550,height=420');
        });
    }
}

// Load and display share buttons
function loadAndDisplayShareButtons(title, excerpt, blogPostId) {
    const shareContainer = document.getElementById('blogShareContainer');
    if (shareContainer) {
        shareContainer.innerHTML = createShareButtonsHTML(title, excerpt);
        setupShareEventListeners(title, excerpt, blogPostId);
    }
}

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
        const item = allItems.find(i => String(i.id) === String(detailId));
        if (item) {
            await renderDetailView(item);
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
    const gridId = tableType === 'projects' ? 'projectsGrid' : 'blogGrid';

    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Supabase error fetching ${tableName}:`, {
                message: error.message,
                status: error.status,
                code: error.code
            });
            // Show error to user
            const grid = document.getElementById(gridId);
            if (grid) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <p>Error loading ${tableType}: ${error.message}</p>
                    </div>
                `;
            }
            return null;
        }

        return data;
    } catch (error) {
        console.error(`Failed to fetch ${tableName}:`, error);
        const grid = document.getElementById(gridId);
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>Error loading ${tableType}: ${error.message}</p>
                </div>
            `;
        }
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

    // Use subtitle if available, otherwise extract first paragraph from description
    let description = project.subtitle;
    if (!description) {
        const fullDescription = extractPlainText(project.description || '');
        description = fullDescription.split('\n\n')[0].split('\n')[0];
    }

    const tags = project.tags ? project.tags.split(',').slice(0, 3).map(tag =>
        `<span class="tag">${tag.trim()}</span>`
    ).join('') : '';

    // Use logotype if available, otherwise fall back to emoji
    const clientImage = project.logotype
        ? `<img src="${project.logotype}" alt="${title} logo" class="card-logotype">`
        : `<div class="card-emoji">${emoji}</div>`;

    return `
        <a href="/project.html?id=${project.id}" class="card project-card">
            ${clientImage}
            <h3 class="card-title">${title}</h3>
            ${description ? `<p class="card-description">${description}</p>` : ''}
            ${tags ? `<div class="card-tags">${tags}</div>` : ''}
            <div class="card-link">Read More →</div>
        </a>
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
            ${post.id ? `<a href="/post.html?id=${post.id}" class="card-link">Read More →</a>` : ''}
        </div>
    `;
}

/**
 * Render detail view for a single item
 * @param {Object} item - The item to display in detail
 */
async function renderDetailView(item) {
    // Track detail view
    if (pageType === 'projects') {
        trackProjectDetailView(item.id);
    } else {
        trackBlogDetailView(item.id);
    }

    const gridId = pageType === 'projects' ? 'projectsGrid' : 'blogGrid';
    const filterBar = document.getElementById('filterBar');
    const collectionHeader = document.querySelector('.collection-header');

    // Hide filter bar and collection header in detail view
    if (filterBar) {
        filterBar.style.display = 'none';
        filterBar.style.visibility = 'hidden';
    }
    if (collectionHeader) {
        collectionHeader.style.display = 'none';
        collectionHeader.style.visibility = 'hidden';
    }

    const grid = document.getElementById(gridId);
    if (grid) {
        grid.style.display = 'block';
        grid.style.visibility = 'visible';
    }
    let detailHTML;

    if (pageType === 'projects') {
        const emoji = getProjectEmoji(item);
        const title = extractPlainText(item.title);
        const description = item.description || '';
        const tags = item.tags ? item.tags.split(',').map(tag =>
            `<span class="tag">${tag.trim()}</span>`
        ).join('') : '';

        // Use logotype if available, otherwise fall back to emoji
        const clientImage = item.logotype
            ? `<img src="${item.logotype}" alt="${title} logo" class="detail-logotype">`
            : `<div class="detail-emoji">${emoji}</div>`;

        detailHTML = `
            <div class="detail-view">
                <div class="detail-header">
                    <a href="/projects.html" class="back-link">← Back to Projects</a>
                </div>
                <div class="detail-content project-detail">
                    ${clientImage}
                    <h1 class="detail-title">${title}</h1>
                    ${item.subtitle ? `<p class="detail-subtitle">${item.subtitle}</p>` : ''}
                    ${description ? `<div class="detail-description">${description}</div>` : ''}
                    ${tags ? `<div class="detail-tags">${tags}</div>` : ''}
                    ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="detail-link">View Project →</a>` : ''}
                </div>
            </div>
        `;
    } else {
        const date = formatDate(item.created_at);
        const title = extractPlainText(item.title);
        const excerpt = item.excerpt || '';
        const content = item.content || item.description || '';
        const tags = item.tags ? item.tags.split(',').map(tag => tag.trim()) : [];

        detailHTML = `
            <div class="blog-detail-header">
                <a href="/blog.html" class="back-link">← Back to Blog</a>
            </div>

            <article class="blog-detail-content">
                <div class="blog-detail-hero">
                    <h1 class="blog-title">${title}</h1>
                    <time class="blog-date">📅 ${date}</time>
                </div>

                ${excerpt ? `
                    <div class="blog-excerpt-section">
                        <p class="blog-excerpt">${extractPlainText(excerpt)}</p>
                        <div id="blogReactionsContainer"></div>
                        <div id="blogShareContainer" class="blog-share-buttons"></div>
                    </div>
                ` : ''}

                ${tags.length > 0 ? `
                    <div class="blog-tags-section">
                        <div class="blog-tags">
                            ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="blog-content-section">
                    <div class="blog-content-text">${content}</div>
                </div>

                <div class="blog-detail-footer">
                    <a href="/blog.html" class="btn-back-link">← Back to All Posts</a>
                </div>
            </article>
        `;
    }

    grid.innerHTML = detailHTML;

    // Load and display reactions for blog posts
    if (pageType === 'blog') {
        currentBlogPostId = item.id;
        await loadAndDisplayReactions(item.id);
        loadAndDisplayShareButtons(extractPlainText(item.title), item.excerpt || '', item.id);
    }
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
