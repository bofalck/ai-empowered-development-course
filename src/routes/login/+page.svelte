<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { supabase } from '$lib/supabase-client.js';

    let email = $state('');
    let password = $state('');
    let error = $state('');
    let loading = $state(false);

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) goto('/admin/cms');
    });

    async function handleLogin(e) {
        e.preventDefault();
        loading = true;
        error = '';
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
            error = err.message;
            loading = false;
        } else {
            goto('/admin/cms');
        }
    }
</script>

<svelte:head>
    <title>Sign In - After The Noise</title>
</svelte:head>

<main class="portfolio-main">
    <div class="login-page">
        <div class="login-container">
            <h1 class="login-title">Sign In</h1>
            <form onsubmit={handleLogin} class="login-form">
                {#if error}
                    <div class="login-error">{error}</div>
                {/if}
                <div class="form-group">
                    <label for="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        bind:value={email}
                        required
                        autocomplete="email"
                        placeholder="your@email.com"
                    />
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        bind:value={password}
                        required
                        autocomplete="current-password"
                        placeholder="••••••••"
                    />
                </div>
                <button type="submit" class="btn-save" disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In'}
                </button>
            </form>
            <a href="/" class="back-link" style="display:block; margin-top:1.5rem; text-align:center;">← Back to Portfolio</a>
        </div>
    </div>
</main>
