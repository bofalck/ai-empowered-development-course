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
            <div class="login-card">
                <h1>After The Noise</h1>
                <p class="subtitle">Admin — portfolio management</p>

                <form onsubmit={handleLogin}>
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
                    <button type="submit" class="btn-login" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <a href="/" class="login-back">← Back to portfolio</a>
            </div>
        </div>
    </div>
</main>
