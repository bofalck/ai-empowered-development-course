<script>
    import { extractUniqueTags, filterItemsByTag, extractPlainText, getProjectEmoji } from '$lib/utils.js';

    let { data } = $props();

    let projects = $derived(data.projects ?? []);
    let activeTag = $state('');
    let tags = $derived(extractUniqueTags(projects));
    let filtered = $derived(filterItemsByTag(projects, activeTag));
</script>

<svelte:head>
    <title>Projects - After The Noise</title>
</svelte:head>

<main class="portfolio-main">
    <div class="collection-page">
        <div class="collection-header">
            <h2>Selected Work</h2>
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

        <div class="items-grid" id="projectsGrid">
            {#if filtered.length === 0}
                <div class="empty-state">
                    <p>No projects found{activeTag ? ` with tag "${activeTag}"` : ''}.</p>
                </div>
            {:else}
                {#each filtered as project (project.id)}
                    <a href="/projects/{project.id}" class="card project-card">
                        {#if project.logotype}
                            <img
                                src={project.logotype}
                                alt="{extractPlainText(project.title)} logo"
                                class="card-logotype"
                            />
                        {:else}
                            <div class="card-emoji">{getProjectEmoji(project)}</div>
                        {/if}
                        <h3 class="card-title">{extractPlainText(project.title)}</h3>
                        {#if project.subtitle}
                            <p class="card-description">{project.subtitle}</p>
                        {:else if project.description}
                            <p class="card-description">{extractPlainText(project.description).split('\n')[0]}</p>
                        {/if}
                        {#if project.tags}
                            <div class="card-tags">
                                {#each project.tags.split(',').slice(0, 3) as tag}
                                    <span class="tag">{tag.trim()}</span>
                                {/each}
                            </div>
                        {/if}
                        <div class="card-link">Read More →</div>
                    </a>
                {/each}
            {/if}
        </div>
    </div>
</main>
