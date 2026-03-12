<script>
    import { onMount } from 'svelte';
    import '../../styles.css';
    import { supabase } from '$lib/supabase-client.js';

    let { children } = $props();

    const THEMES = [
        { id: 'anime',  emoji: '🖋️', label: 'Anime theme' },
        { id: 'signal', emoji: '📡', label: 'Signal theme' },
        { id: 'dark',   emoji: '🌙', label: 'Dark theme' },
        { id: 'prism',  emoji: '🦄', label: 'Prism theme' },
    ];

    let theme = $state('signal');
    let isLoggedIn = $state(false);
    let mobileMenuOpen = $state(false);

    onMount(async () => {
        // Restore theme from localStorage
        const stored = localStorage.getItem('theme') || 'signal';
        theme = stored;
        document.body.classList.add(`theme-${theme}`);

        // Check Supabase auth session
        const { data: { session } } = await supabase.auth.getSession();
        isLoggedIn = !!session;

        // Keep in sync if session changes
        supabase.auth.onAuthStateChange((_event, session) => {
            isLoggedIn = !!session;
        });
    });

    function setTheme(t) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
        document.body.classList.add(`theme-${t}`);
        theme = t;
        localStorage.setItem('theme', t);
    }

    async function logout() {
        await supabase.auth.signOut();
        isLoggedIn = false;
        window.location.href = '/';
    }

    function toggleMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    function closeMenu() {
        mobileMenuOpen = false;
    }
</script>

<svelte:window onclick={(e) => {
    const btn = document.getElementById('hamburgerBtn');
    const menu = document.getElementById('mobileMenu');
    if (mobileMenuOpen && btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        closeMenu();
    }
}} />

<header class="portfolio-header">
    <div class="header-content">
        <h1 class="site-title">
            <span>After</span>
            <span>The</span>
            <span>Noise</span>
        </h1>
        <nav class="header-nav desktop-only">
            <a href="/" class="nav-link">🏠 Home</a>
            <a href="/projects" class="nav-link">🛠️ Projects</a>
            <a href="/blog" class="nav-link">✍️ Blog</a>
        </nav>
        <div class="header-actions desktop-only">
            <div class="theme-selector" id="themeSelector">
                {#each THEMES as t}
                    <button
                        class="theme-btn"
                        class:active={theme === t.id}
                        data-theme={t.id}
                        title={t.label}
                        onclick={() => setTheme(t.id)}
                    >{t.emoji}</button>
                {/each}
            </div>
            <div id="authActions">
                {#if isLoggedIn}
                    <a href="/admin/cms" class="nav-link nav-link--admin">Admin</a>
                    <button class="btn-logout" onclick={logout}>Sign Out</button>
                {/if}
            </div>
        </div>
        <button
            class="hamburger-btn"
            class:open={mobileMenuOpen}
            id="hamburgerBtn"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onclick={toggleMenu}
        >
            <span></span>
            <span></span>
            <span></span>
        </button>
    </div>

    <div class="mobile-menu" class:open={mobileMenuOpen} id="mobileMenu">
        <div class="mobile-menu-inner">
            <nav class="mobile-nav">
                <a href="/" class="nav-link" onclick={closeMenu}>🏠 Home</a>
                <a href="/projects" class="nav-link" onclick={closeMenu}>🛠️ Projects</a>
                <a href="/blog" class="nav-link" onclick={closeMenu}>✍️ Blog</a>
            </nav>
            <div class="mobile-menu-divider"></div>
            <div class="mobile-theme-section">
                <span class="mobile-menu-label">Theme</span>
                <div class="theme-selector">
                    {#each THEMES as t}
                        <button
                            class="theme-btn"
                            class:active={theme === t.id}
                            data-theme={t.id}
                            title={t.label}
                            onclick={() => { setTheme(t.id); }}
                        >{t.emoji}</button>
                    {/each}
                </div>
            </div>
            <div class="mobile-menu-divider"></div>
            <div class="mobile-auth">
                {#if isLoggedIn}
                    <a href="/admin/cms" class="nav-link nav-link--admin" onclick={closeMenu}>Admin</a>
                    <button class="btn-logout" onclick={() => { logout(); closeMenu(); }}>Sign Out</button>
                {:else}
                    <a href="/login" class="nav-link" onclick={closeMenu}>Sign In</a>
                {/if}
            </div>
        </div>
    </div>
</header>

{@render children()}
