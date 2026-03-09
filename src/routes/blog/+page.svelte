<script>
    import { extractUniqueTags, filterItemsByTag, formatDate, extractPlainText } from '$lib/utils.js';

    let { data } = $props();

    let posts = $derived(data.posts ?? []);
    let activeTag = $state('');
    let tags = $derived(extractUniqueTags(posts));
    let filtered = $derived(filterItemsByTag(posts, activeTag));
</script>

<svelte:head>
    <title>Blog - After The Noise</title>
</svelte:head>

<main class="portfolio-main">
    <div class="collection-page">
        <div class="collection-header">
            <h2>Writing</h2>
            <a href="/" class="back-link">← Back to Portfolio</a>
        </div>

        {#if tags.length > 0}
            <div class="filter-bar">
                <button
                    class="filter-btn"
                    class:active={activeTag === ''}
                    onclick={() => activeTag = ''}
                >All</button>
                {#each tags as tag}
                    <button
                        class="filter-btn"
                        class:active={activeTag === tag}
                        onclick={() => activeTag = tag}
                    >{tag}</button>
                {/each}
            </div>
        {/if}

        <div class="items-grid" id="blogGrid">
            {#if filtered.length === 0}
                <div class="empty-state">
                    <p>No posts found{activeTag ? ` with tag "${activeTag}"` : ''}.</p>
                </div>
            {:else}
                {#each filtered as post (post.id)}
                    <div class="card blog-card">
                        <time class="card-date">{formatDate(post.created_at)}</time>
                        <h3 class="card-title">{extractPlainText(post.title)}</h3>
                        {#if post.excerpt}
                            <p class="card-excerpt">{extractPlainText(post.excerpt)}</p>
                        {/if}
                        {#if post.tags}
                            <div class="card-tags">
                                {#each post.tags.split(',').slice(0, 2) as tag}
                                    <span class="tag">{tag.trim()}</span>
                                {/each}
                            </div>
                        {/if}
                        <a href="/blog/{post.id}" class="card-link">Read More →</a>
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</main>
