<script>
    import { onMount } from 'svelte';
    import { formatDate, extractPlainText, getProjectEmoji } from '$lib/utils.js';
    import { trackProjectDetailView } from '$lib/events.js';

    let { data } = $props();
    let project = $derived(data.project);
    let title = $derived(extractPlainText(project.title));
    let tags = $derived(project.tags ? project.tags.split(',').map(t => t.trim()) : []);

    onMount(() => {
        trackProjectDetailView(project.id);
    });
</script>

<svelte:head>
    <title>{title} - After The Noise</title>
</svelte:head>

<main class="portfolio-main">
    <div class="project-detail-page">
        <div class="project-detail-header">
            <a href="/projects" class="back-link">← Back to Projects</a>
        </div>

        <article class="project-detail-content">
            <div class="project-detail-hero">
                {#if project.logotype}
                    <img
                        src={project.logotype}
                        alt="{title} logo"
                        class="project-logotype"
                    />
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

            {#if project.link}
                <div class="project-actions">
                    <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn-view-project"
                    >🔗 Visit Project</a>
                </div>
            {/if}

            <div class="project-detail-footer">
                <a href="/projects" class="btn-back-link">← Back to All Projects</a>
            </div>
        </article>
    </div>
</main>
