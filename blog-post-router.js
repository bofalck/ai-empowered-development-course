// Blog post detail page loader
import { supabase } from './supabase-client.js';
import { extractPlainText, formatDate } from './page-utils.js';
import { trackBlogDetailView } from './lib/events.js';
import { getGuestId } from './lib/utils.js';
import { applyTheme } from './auth.js';

const AVAILABLE_REACTIONS = ['👍', '❤️', '🎉', '😂'];

const params = new URLSearchParams(window.location.search);
const postId = params.get('id');

if (!postId) {
    showError('No post specified', 'Please use a valid post URL.');
} else {
    loadPost(postId);
}

async function loadPost(id) {
    try {
        const { data: post, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !post) {
            showError('Post not found', 'This post may have been removed or the link is invalid.');
            return;
        }

        renderPost(post);
    } catch (error) {
        showError('Error loading post', error.message);
    }
}

async function renderPost(post) {
    trackBlogDetailView(post.id);

    const title = extractPlainText(post.title);
    const date = formatDate(post.created_at);
    const content = post.content || '';
    const tags = post.tags ? post.tags.split(',').map(t => t.trim()) : [];

    document.title = `${title} - After The Noise`;

    const shareUrl = window.location.href;
    const shareText = `Check out "${title}" on After The Noise`;
    const blueskyUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

    document.getElementById('postDetail').innerHTML = `
        <div class="blog-detail-header">
            <a href="/blog.html" class="back-link">← Back to Blog</a>
        </div>

        <article class="blog-detail-content">
            <div class="blog-detail-hero">
                <h1 class="blog-title">${title}</h1>
                <time class="blog-date">📅 ${date}</time>
            </div>

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

            <div class="blog-share-section">
                <div class="blog-share-buttons">
                    <a href="${blueskyUrl}" target="_blank" rel="noopener noreferrer" class="share-btn share-bluesky">🦋 Share on Bluesky</a>
                    <a href="${linkedinUrl}" target="_blank" rel="noopener noreferrer" class="share-btn share-linkedin">in Share on LinkedIn</a>
                </div>
            </div>

            <div id="reactionsContainer" class="blog-reactions-section"></div>

            <div class="blog-detail-footer">
                <a href="/blog.html" class="btn-back-link">← Back to All Posts</a>
            </div>
        </article>
    `;

    applyTheme();
    await loadReactions(post.id);
}

async function loadReactions(postId) {
    const container = document.getElementById('reactionsContainer');
    if (!container) return;

    try {
        const { data: allReactions } = await supabase
            .from('blog_post_reactions')
            .select('emoji')
            .eq('blog_post_id', postId);

        const counts = {};
        AVAILABLE_REACTIONS.forEach(e => { counts[e] = 0; });
        (allReactions || []).forEach(r => {
            if (counts[r.emoji] !== undefined) counts[r.emoji]++;
        });

        const guestId = getGuestId();
        const { data: myReactions } = await supabase
            .from('blog_post_reactions')
            .select('emoji')
            .eq('blog_post_id', postId)
            .eq('guest_id', guestId);

        const mySet = new Set((myReactions || []).map(r => r.emoji));

        container.innerHTML = `
            <div class="reactions-bar">
                ${AVAILABLE_REACTIONS.map(emoji => `
                    <button class="reaction-btn ${mySet.has(emoji) ? 'active' : ''}"
                            data-emoji="${emoji}" data-post-id="${postId}">
                        ${emoji} <span class="reaction-count">${counts[emoji]}</span>
                    </button>
                `).join('')}
            </div>
        `;

        container.querySelectorAll('.reaction-btn').forEach(btn => {
            btn.addEventListener('click', () => toggleReaction(btn, postId));
        });
    } catch {
        // silent fail — reactions are non-critical
    }
}

async function toggleReaction(btn, postId) {
    const emoji = btn.getAttribute('data-emoji');
    const isActive = btn.classList.contains('active');
    const countEl = btn.querySelector('.reaction-count');
    const guestId = getGuestId();

    if (isActive) {
        await supabase.from('blog_post_reactions').delete()
            .eq('blog_post_id', postId)
            .eq('guest_id', guestId)
            .eq('emoji', emoji);
        btn.classList.remove('active');
        countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
    } else {
        await supabase.from('blog_post_reactions').insert([{
            blog_post_id: postId,
            guest_id: guestId,
            emoji
        }]);
        btn.classList.add('active');
        countEl.textContent = parseInt(countEl.textContent) + 1;
    }
}

function showError(title, message) {
    document.getElementById('postDetail').innerHTML = `
        <div class="project-error">
            <h1>${title}</h1>
            <p>${message}</p>
            <a href="/blog.html" class="back-link">← Back to Blog</a>
        </div>
    `;
}
