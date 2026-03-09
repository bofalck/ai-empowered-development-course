<script>
    import { onMount } from 'svelte';
    import { formatDate, extractPlainText, getProjectEmoji } from '$lib/utils.js';
    import { trackProjectDetailView } from '$lib/events.js';

    let { data } = $props();
    let project = $derived(data.project);
    let title = $derived(extractPlainText(project.title));
    let tags = $derived(project.tags ? project.tags.split(',').map(t => t.trim()) : []);

    let iframeLoading = $state(true);
    let iframeBlocked = $state(false);
    let infoExpanded = $state(false);

    // X-Frame-Options blocking can't be detected via onload (it still fires).
    // Best-effort: after load, try accessing contentDocument. For cross-origin
    // blocked sites the iframe loads a blank page — we check via a short timeout.
    function onIframeLoad(e) {
        iframeLoading = false;
        // Heuristic: if the iframe rendered but is completely empty (blocked),
        // the browser shows a blank white frame. We can't read cross-origin
        // contentDocument, so just mark as loaded and let the user see it.
        // The "Open in new tab" link is always available as fallback.
    }

    function onIframeError() {
        iframeLoading = false;
        iframeBlocked = true;
    }

    onMount(() => {
        trackProjectDetailView(project.id);
    });
</script>

<svelte:head>
    <title>{title} - After The Noise</title>
</svelte:head>

{#if project.link}
    <!-- Full-viewport embed layout -->
    <div class="project-embed-page">

        <!-- Sticky top bar -->
        <div class="project-embed-bar">
            <a href="/projects" class="back-link">← Projects</a>

            <button
                class="project-embed-info-toggle"
                onclick={() => infoExpanded = !infoExpanded}
                aria-expanded={infoExpanded}
            >
                {#if project.logotype}
                    <img src={project.logotype} alt="{title} logo" class="embed-bar-logo" />
                {:else}
                    <span class="embed-bar-emoji">{getProjectEmoji(project)}</span>
                {/if}
                <span class="embed-bar-title">{title}</span>
                <span class="embed-bar-chevron">{infoExpanded ? '▲' : '▼'}</span>
            </button>

            <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                class="btn-view-project embed-open-btn"
            >↗ Open</a>
        </div>

        <!-- Expandable info panel -->
        {#if infoExpanded}
            <div class="project-embed-info-panel">
                {#if project.subtitle}
                    <p class="project-subtitle">{project.subtitle}</p>
                {/if}
                <div class="project-embed-meta">
                    <span class="project-date">📅 {formatDate(project.created_at)}</span>
                    {#if tags.length > 0}
                        <div class="project-tags">
                            {#each tags as tag}
                                <span class="tag">{tag}</span>
                            {/each}
                        </div>
                    {/if}
                </div>
                {#if project.description}
                    <div class="project-description-text">{@html project.description}</div>
                {/if}
            </div>
        {/if}

        <!-- Iframe panel -->
        <div class="project-embed-frame">
            {#if iframeBlocked}
                <div class="project-embed-blocked">
                    <p>This site can't be embedded.</p>
                    <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn-view-project"
                    >↗ Open {title}</a>
                </div>
            {:else}
                {#if iframeLoading}
                    <div class="project-embed-loading">
                        <div class="embed-spinner"></div>
                        <span>Loading…</span>
                    </div>
                {/if}
                <iframe
                    src={project.link}
                    title={title}
                    class="project-iframe"
                    class:hidden={iframeLoading}
                    onload={onIframeLoad}
                    onerror={onIframeError}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                ></iframe>
            {/if}
        </div>
    </div>

{:else}
    <!-- No link — standard info layout -->
    <main class="portfolio-main">
        <div class="project-detail-page">
            <div class="project-detail-header">
                <a href="/projects" class="back-link">← Back to Projects</a>
            </div>

            <article class="project-detail-content">
                <div class="project-detail-hero">
                    {#if project.logotype}
                        <img src={project.logotype} alt="{title} logo" class="project-logotype" />
                    {:else}
                        <div class="project-emoji">{getProjectEmoji(project)}</div>
                    {/if}
                    <h1 class="project-title">{title}</h1>
                    {#if project.subtitle}
                        <p class="project-subtitle">{project.subtitle}</p>
                    {/if}
                </div>

                <div class="project-meta-info">
                    <span class="project-date">📅 {formatDate(project.created_at)}</span>
                </div>

                {#if tags.length > 0}
                    <div class="project-tags-section">
                        <div class="project-tags">
                            {#each tags as tag}
                                <span class="tag">{tag}</span>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if project.description}
                    <div class="project-description-section">
                        <div class="project-description-text">{@html project.description}</div>
                    </div>
                {/if}

                <div class="project-detail-footer">
                    <a href="/projects" class="btn-back-link">← Back to All Projects</a>
                </div>
            </article>
        </div>
    </main>
{/if}

<style>
    /* Embed layout takes over full viewport, bypasses portfolio-main padding */
    .project-embed-page {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
    }

    .project-embed-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 1rem;
        background: var(--color-surface);
        border-bottom: 1px solid var(--color-divider);
        flex-shrink: 0;
        z-index: 10;
    }

    .project-embed-info-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--color-text);
        padding: 0.25rem 0.5rem;
        border-radius: var(--border-radius-sm);
        transition: background 0.15s;
        text-align: left;
        overflow: hidden;
    }

    .project-embed-info-toggle:hover {
        background: var(--color-bg);
    }

    .embed-bar-logo {
        height: 1.5rem;
        width: auto;
        object-fit: contain;
        flex-shrink: 0;
    }

    .embed-bar-emoji {
        font-size: 1.2rem;
        flex-shrink: 0;
    }

    .embed-bar-title {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .embed-bar-chevron {
        font-size: 0.65rem;
        opacity: 0.6;
        flex-shrink: 0;
    }

    .embed-open-btn {
        flex-shrink: 0;
        font-size: 0.85rem;
        padding: 0.3rem 0.75rem;
    }

    .project-embed-info-panel {
        padding: 1rem 1.5rem;
        background: var(--color-surface);
        border-bottom: 1px solid var(--color-divider);
        max-height: 40vh;
        overflow-y: auto;
        flex-shrink: 0;
    }

    .project-embed-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
        font-size: 0.85rem;
        color: var(--color-text-secondary);
    }

    .project-embed-frame {
        flex: 1;
        position: relative;
        overflow: hidden;
    }

    .project-iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
    }

    .project-iframe.hidden {
        visibility: hidden;
        position: absolute;
    }

    .project-embed-loading {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: var(--color-text-secondary);
        font-size: 0.9rem;
    }

    .embed-spinner {
        width: 2rem;
        height: 2rem;
        border: 3px solid var(--color-divider);
        border-top-color: var(--color-primary);
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .project-embed-blocked {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        color: var(--color-text-secondary);
        text-align: center;
        padding: 2rem;
    }
</style>
