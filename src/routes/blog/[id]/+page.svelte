<script>
    import { onMount } from 'svelte';
    import { formatDate, extractPlainText, getGuestId } from '$lib/utils.js';
    import { trackBlogDetailView, trackShare } from '$lib/events.js';
    import { supabase } from '$lib/supabase-client.js';
    import { CONTENT_TYPES, SHARE_PLATFORMS } from '$lib/types.js';

    let { data } = $props();
    let post = $derived(data.post);
    let title = $derived(extractPlainText(post.title));
    let tags = $derived(post.tags ? post.tags.split(',').map(t => t.trim()) : []);

    const REACTIONS = ['👍', '❤️', '🎉', '😂'];

    let counts = $state({});
    let myReactions = $state(new Set());
    let shareUrl = $state('');
    let copyConfirmed = $state(false);

    onMount(async () => {
        shareUrl = window.location.href;
        trackBlogDetailView(post.id);
        await loadReactions();
    });

    async function loadReactions() {
        const { data: all } = await supabase
            .from('blog_post_reactions')
            .select('emoji')
            .eq('blog_post_id', post.id);

        const newCounts = {};
        REACTIONS.forEach(e => { newCounts[e] = 0; });
        (all ?? []).forEach(r => { if (newCounts[r.emoji] !== undefined) newCounts[r.emoji]++; });
        counts = newCounts;

        const guestId = getGuestId();
        const { data: mine } = await supabase
            .from('blog_post_reactions')
            .select('emoji')
            .eq('blog_post_id', post.id)
            .eq('guest_id', guestId);

        myReactions = new Set((mine ?? []).map(r => r.emoji));
    }

    async function toggleReaction(emoji) {
        const guestId = getGuestId();
        const isActive = myReactions.has(emoji);

        // Optimistic update
        const next = new Set(myReactions);
        const nextCounts = { ...counts };
        if (isActive) {
            next.delete(emoji);
            nextCounts[emoji] = Math.max(0, (nextCounts[emoji] ?? 1) - 1);
        } else {
            next.add(emoji);
            nextCounts[emoji] = (nextCounts[emoji] ?? 0) + 1;
        }
        myReactions = next;
        counts = nextCounts;

        if (isActive) {
            await supabase.from('blog_post_reactions').delete()
                .eq('blog_post_id', post.id)
                .eq('guest_id', guestId)
                .eq('emoji', emoji);
        } else {
            await supabase.from('blog_post_reactions').insert([{
                blog_post_id: post.id,
                guest_id: guestId,
                emoji
            }]);
            trackBlogDetailView(post.id);
        }
    }

    async function shareNative() {
        trackShare(CONTENT_TYPES.BLOG_POST, post.id, SHARE_PLATFORMS.NATIVE);
        if (navigator.share) {
            try {
                await navigator.share({ title: title, text: post.excerpt ?? '', url: shareUrl });
            } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(shareUrl);
            copyConfirmed = true;
            setTimeout(() => { copyConfirmed = false; }, 2000);
        }
    }

    function shareBluesky() {
        trackShare(CONTENT_TYPES.BLOG_POST, post.id, SHARE_PLATFORMS.BLUESKY);
        const text = encodeURIComponent(`Check out "${title}" on After The Noise\n\n${shareUrl}`);
        window.open(`https://bsky.app/intent/compose?text=${text}`, '_blank', 'width=550,height=420');
    }

    function shareLinkedIn() {
        trackShare(CONTENT_TYPES.BLOG_POST, post.id, SHARE_PLATFORMS.LINKEDIN);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=550,height=420');
    }
</script>

<svelte:head>
    <title>{title} - After The Noise</title>
</svelte:head>

<main class="portfolio-main">
    <div class="blog-post-page">
        <div class="blog-detail-header">
            <a href="/blog" class="back-link">← Back to Blog</a>
        </div>

        <article class="blog-detail-content">
            <div class="blog-detail-hero">
                <h1 class="blog-title">{title}</h1>
                <time class="blog-date">📅 {formatDate(post.created_at)}</time>
            </div>

            {#if tags.length > 0}
                <div class="blog-tags-section">
                    <div class="blog-tags">
                        {#each tags as tag}
                            <span class="tag">{tag}</span>
                        {/each}
                    </div>
                </div>
            {/if}

            <div class="blog-content-section">
                <div class="blog-content-text">{@html post.content ?? ''}</div>
            </div>

            <div class="blog-share-section">
                <div class="blog-share-buttons">
                    <button class="share-btn" onclick={shareNative}>
                        {copyConfirmed ? '✓ Copied!' : '🔗 Share'}
                    </button>
                    <button class="share-btn share-bluesky" onclick={shareBluesky}>🦋 Bluesky</button>
                    <button class="share-btn share-linkedin" onclick={shareLinkedIn}>in LinkedIn</button>
                </div>
            </div>

            <div class="blog-reactions-section">
                <div class="reactions-bar">
                    {#each REACTIONS as emoji}
                        <button
                            class="reaction-btn"
                            class:active={myReactions.has(emoji)}
                            onclick={() => toggleReaction(emoji)}
                        >
                            {emoji} <span class="reaction-count">{counts[emoji] ?? 0}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <div class="blog-detail-footer">
                <a href="/blog" class="btn-back-link">← Back to All Posts</a>
            </div>
        </article>
    </div>
</main>
