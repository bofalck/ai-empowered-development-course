<script>
    import { onMount } from 'svelte';
    import { formatDate, extractPlainText, getProjectEmoji } from '$lib/utils.js';
    import { trackAppLaunch } from '$lib/events.js';
    import { APP_IDS } from '$lib/types.js';

    let { data } = $props();

    const FALLBACK_ABOUT = {
        name: 'Bobby',
        photo_url: '/images/bobby.png',
        bio: `<p>Strategic leader and Design Engineer, with 11+ years shaping digital transformation, M&A, AI Enablement, scaling organizations, and aligning design, technology, and business. I build high-performing teams and coach leaders through a style that's playful, safe, and caring, creating environments where people thrive, ideas grow, and outcomes align with company vision.</p>`,
        linkedin_url: 'https://www.linkedin.com/in/bobby-falck/',
        instagram_url: 'https://www.instagram.com/samuraii_bob/',
        medium_url: 'https://medium.com/@bofalck',
        bluesky_url: '',
    };

    let posts = $derived(data.posts ?? []);
    let projects = $derived(data.projects ?? []);
    let postCount = $derived(data.postCount ?? posts.length);
    let projectCount = $derived(data.projectCount ?? projects.length);
    let profile = $derived(data.about ?? FALLBACK_ABOUT);

    const SOCIAL_ICONS = {
        linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.39v-1.2h-2.5v8.5h2.5v-4.34c0-.77.62-1.4 1.4-1.4.77 0 1.4.63 1.4 1.4v4.34h2.5zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69-.93 0-1.69.76-1.69 1.69 0 .93.76 1.68 1.69 1.68zm1.39 9.94v-8.5H5.5v8.5h2.77z"/></svg>`,
        instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.07 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/></svg>`,
        medium: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42c1.87 0 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75c.66 0 1.19 2.58 1.19 5.75z"/></svg>`,
        bluesky: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.299-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/></svg>`,
    };

    let socialLinks = $derived.by(() =>
        ['linkedin_url', 'instagram_url', 'medium_url', 'bluesky_url']
            .filter(key => profile[key])
            .map(key => ({
                href: profile[key],
                label: key.replace('_url', '').replace(/^\w/, c => c.toUpperCase()),
                icon: SOCIAL_ICONS[key.replace('_url', '')],
            }))
    );

    // Transcriber iframe state
    let appFrameVisible = $state(false);

    function launchTranscriber() {
        trackAppLaunch(APP_IDS.TRANSCRIBER);
        appFrameVisible = true;
    }

    function closeApp() {
        appFrameVisible = false;
    }

    onMount(() => {
        window.addEventListener('message', (event) => {
            if (event.data?.action === 'closeApp') closeApp();
        });
    });
</script>

<svelte:head>
    <title>After The Noise - Portfolio</title>
</svelte:head>

{#if appFrameVisible}
    <iframe
        src="/apps/transcriber/index.html"
        class="app-frame"
        title="Transcriber App"
    ></iframe>
{:else}
    <main class="portfolio-main">
        <div class="widgets-grid">

            <!-- Blog Widget -->
            <section id="blog" class="widget widget-blog">
                <div class="widget-header">
                    <h2>Writing</h2>
                </div>
                <div class="widget-content">
                    {#if posts.length === 0}
                        <div class="widget-teaser">
                            <p class="widget-teaser-text">No blog posts yet. Check back soon!</p>
                        </div>
                    {:else}
                        <div class="widget-blog-preview">
                            {#each posts as post (post.id)}
                                <a href="/blog/{post.slug || post.id}" class="blog-preview-item blog-preview-link">
                                    <div class="blog-preview-header">
                                        <time class="blog-preview-date">{formatDate(post.created_at)}</time>
                                        <h4 class="blog-preview-title">{extractPlainText(post.title)}</h4>
                                    </div>
                                    {#if post.excerpt}
                                        <div class="blog-preview-excerpt">{extractPlainText(post.excerpt)}</div>
                                    {/if}
                                </a>
                            {/each}
                            <a href="/blog" class="widget-blog-link">View all {postCount} posts →</a>
                        </div>
                    {/if}
                </div>
            </section>

            <!-- Projects Widget -->
            <section id="projects" class="widget widget-projects">
                <div class="widget-header">
                    <h2>Selected Work</h2>
                </div>
                <div class="widget-content">
                    {#if projects.length === 0}
                        <div class="widget-teaser">
                            <p class="widget-teaser-text">No projects yet. Check back soon!</p>
                        </div>
                    {:else}
                        <div class="widget-projects-preview">
                            {#each projects.slice(0, 2) as project (project.id)}
                                <a href="/projects/{project.id}" class="project-preview-item project-preview-link">
                                    <div class="project-preview-header">
                                        {#if project.logotype}
                                            <img
                                                src={project.logotype}
                                                alt="{extractPlainText(project.title)} logo"
                                                class="project-preview-logotype"
                                            />
                                        {:else}
                                            <span class="project-preview-emoji">{getProjectEmoji(project)}</span>
                                        {/if}
                                        <h4 class="project-preview-title">{extractPlainText(project.title)}</h4>
                                    </div>
                                    {#if project.subtitle}
                                        <div class="project-preview-description">{project.subtitle}</div>
                                    {:else if project.description}
                                        <div class="project-preview-description">{extractPlainText(project.description)}</div>
                                    {/if}
                                    {#if project.tags}
                                        <div class="project-preview-tags">
                                            {#each project.tags.split(',').slice(0, 5) as tag}
                                                <span class="project-preview-tag">{tag.trim()}</span>
                                            {/each}
                                        </div>
                                    {/if}
                                </a>
                            {/each}
                            <a href="/projects" class="widget-projects-link">View all {projectCount} projects →</a>
                        </div>
                    {/if}
                </div>
            </section>

            <!-- About Widget -->
            <section id="about" class="widget widget-about">
                <div class="widget-header">
                    <h2>About Me</h2>
                </div>
                <div class="widget-content">
                    <div class="about-content">
                        <div class="about-image">
                            <img src={profile.photo_url || '/images/bobby.png'} alt={profile.name || 'Profile photo'} />
                        </div>
                        <div class="about-text-content">
                            <h3 class="about-greeting">
                                Hi, I'm {profile.name || 'Bobby'} <span class="waving-hand">👋</span>
                            </h3>
                            <div class="about-bio">{@html profile.bio || ''}</div>
                        </div>
                        {#if socialLinks.length > 0}
                            <div class="about-social-links">
                                {#each socialLinks as link}
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="social-link"
                                        title={link.label}
                                        aria-label="Visit {link.label} profile"
                                    >{@html link.icon}</a>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </section>

            <!-- CV Widget -->
            <section id="cv" class="widget widget-cv">
                <div class="widget-header">
                    <h2>CV</h2>
                    <a href="/cv.pdf" target="_blank" rel="noopener noreferrer" class="widget-cv-open">Open PDF ↗</a>
                </div>
                <div class="widget-content widget-cv-content">
                    <a href="/cv.pdf" target="_blank" rel="noopener noreferrer" class="cv-preview-link" aria-label="Open CV as PDF">
                        <img src="/images/cv-thumbnail.png" alt="CV preview" class="cv-preview-img" />
                        <div class="cv-preview-overlay">
                            <span>View full CV →</span>
                        </div>
                    </a>
                </div>
            </section>

            <!-- Transcriber Widget -->
            <section id="transcriber" class="widget widget-transcriber">
                <div class="widget-header">
                    <h2>Apps</h2>
                </div>
                <div class="widget-content">
                    <div class="app-card" id="transcriberApp">
                        <div class="app-card-icon">🎙️</div>
                        <div class="app-card-info">
                            <h3 class="app-card-title">Meeting Transcriber</h3>
                            <p class="app-card-description">Record and transcribe meetings with AI-powered speech recognition</p>
                        </div>
                        <button class="btn-launch" onclick={launchTranscriber}>Launch</button>
                    </div>
                </div>
            </section>

        </div>
    </main>
{/if}

<style>
    .app-frame {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 1000;
    }
</style>
