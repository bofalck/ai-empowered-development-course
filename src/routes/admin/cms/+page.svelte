<script>
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';
    import { supabase } from '$lib/supabase-client.js';
    import { blogApi, projectsApi, eventsApi, aboutApi } from '$lib/api.js';
    import { APP_IDS, APP_NAMES } from '$lib/types.js';
    import { extractPlainText } from '$lib/utils.js';

    // --- Auth ---
    let authorized = $state(false);

    // --- Tabs ---
    let activeTab = $state('blog');

    // --- Blog ---
    let blogPosts = $state([]);
    let showBlogForm = $state(false);
    let editingBlogId = $state(null);
    let blogTitle = $state('');
    let blogExcerpt = $state('');
    let blogTags = $state('');

    // --- Projects ---
    let projects = $state([]);
    let showProjectForm = $state(false);
    let editingProjectId = $state(null);
    let projectTitle = $state('');
    let projectSubtitle = $state('');
    let projectLogotype = $state('');
    let projectLink = $state('');
    let projectTags = $state('');

    // --- About ---
    let aboutId = null; // existing row id for upsert
    let aboutName = $state('');
    let aboutPhotoUrl = $state('');
    let aboutLinkedin = $state('');
    let aboutInstagram = $state('');
    let aboutMedium = $state('');
    let aboutBluesky = $state('');

    // --- Analytics ---
    let blogMetrics = $state([]);
    let projectMetrics = $state([]);
    let appMetrics = $state([]);
    let blogReaderStats = $state([]);
    let projectReaderStats = $state([]);
    let allRawEvents = $state([]);
    let countryStats = $state([]);
    let chartPeriod = $state('monthly');
    let chartDateFrom = $state('');
    let chartDateTo = $state('');
    let chartData = $derived(buildChartData(allRawEvents, chartPeriod, chartDateFrom, chartDateTo));
    let maxChartVal = $derived(Math.max(...chartData.map(d => d.total), 1));

    // --- UI state ---
    let modal = $state({ show: false, title: '', message: '', type: 'success' });
    let cropModal = $state(false);

    // --- Manual ordering ---
    let savingOrder = $state(false);

    // --- Quill instances (not reactive) ---
    let blogEditor = null;
    let projectEditor = null;
    let aboutEditor = null;

    // --- Pending content to inject once editor is created ---
    let pendingBlogContent = null;
    let pendingProjectContent = null;

    // --- Cropper state ---
    let cropper = null;
    let currentCropFile = null;
    let currentCropEditor = null;

    // ==================== HELPERS ====================

    function sanitizeQuillOutput(html) {
        if (!html) return '';
        let c = html;
        c = c.replace(/<br\s*\/?>\s*<br\s*\/?>\s*<br\s*\/?>/g, '<br>');
        c = c.replace(/^(<br\s*\/?>\s*)+|(<br\s*\/?>\s*)+$/g, '');
        c = c.replace(/<p>\s*<p>/g, '<p>');
        c = c.replace(/<\/p>\s*<\/p>/g, '</p>');
        c = c.replace(/<p>\s*<\/p>/g, '');
        c = c.replace(/&nbsp;{2,}/g, '&nbsp;');
        c = c.replace(/>(\s+)</g, '><');
        return c.trim();
    }

    function generateSlug(title) {
        const ts = Math.floor(Date.now() / 1000);
        const slug = title.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
        return `${slug}-${ts}`;
    }

    function showModal(title, message, type = 'success') {
        modal = { show: true, title, message, type };
    }

    function closeModal() {
        modal = { ...modal, show: false };
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const s = document.createElement('script');
            s.src = src; s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    function loadLink(href) {
        if (document.querySelector(`link[href="${href}"]`)) return;
        const l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = href;
        document.head.appendChild(l);
    }

    function makeEditor(selector, placeholder, toolbar = 'full') {
        const toolbarFull = [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image', 'video'],
            ['clean']
        ];
        const toolbarSimple = [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            ['link'],
            ['clean']
        ];
        return new window.Quill(selector, {
            theme: 'snow',
            placeholder,
            modules: { toolbar: toolbar === 'full' ? toolbarFull : toolbarSimple }
        });
    }

    function setupImageHandler(editor) {
        const toolbar = editor.getModule('toolbar');
        toolbar.addHandler('image', () => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*'; input.click();
            input.onchange = () => { if (input.files[0]) handleImageUpload(input.files[0], editor); };
        });
        toolbar.addHandler('video', () => handleVideoUrl(editor));
    }

    // ==================== IMAGE / CROP ====================

    function handleImageUpload(file, editor) {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) { showModal('Error', 'Invalid image type.', 'error'); return; }
        if (file.size > 50 * 1024 * 1024) { showModal('Error', 'Image too large (max 50MB).', 'error'); return; }
        currentCropFile = file;
        currentCropEditor = editor;
        const img = document.getElementById('cropImage');
        img.src = URL.createObjectURL(file);
        cropModal = true;
        setTimeout(() => {
            if (cropper) { cropper.destroy(); cropper = null; }
            cropper = new window.Cropper(img, { aspectRatio: NaN, viewMode: 1 });
        }, 100);
    }

    async function performCrop() {
        if (!cropper) return;
        const canvas = cropper.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 });
        canvas.toBlob(async (blob) => {
            const file = new File([blob], currentCropFile.name, { type: currentCropFile.type });
            await uploadImage(file, currentCropEditor);
            closeCropModal();
        }, currentCropFile.type, 0.9);
    }

    function closeCropModal() {
        if (cropper) { cropper.destroy(); cropper = null; }
        cropModal = false; currentCropFile = null; currentCropEditor = null;
    }

    async function uploadImage(file, editor) {
        try {
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('cms-images').upload(fileName, file);
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('cms-images').getPublicUrl(data.path);
            const range = editor.getSelection(true);
            editor.insertEmbed(range.index, 'image', publicUrl);
        } catch (err) {
            showModal('Error', 'Image upload failed: ' + err.message, 'error');
        }
    }

    function handleVideoUrl(editor) {
        const url = prompt('Enter video URL (YouTube, Vimeo, etc):');
        if (!url) return;
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'video', url);
    }

    // ==================== BLOG ====================

    async function loadBlogPosts() {
        const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
        if (error) { showModal('Error loading posts', error.message, 'error'); return; }
        blogPosts = data ?? [];
    }

    function startNewBlog() {
        editingBlogId = null;
        blogTitle = ''; blogExcerpt = ''; blogTags = '';
        pendingBlogContent = '';
        if (blogEditor) blogEditor.setContents([]);
        showBlogForm = true;
    }

    function cancelBlog() {
        showBlogForm = false; editingBlogId = null;
    }

    async function editBlogPost(id) {
        const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single();
        if (error) { showModal('Error', error.message, 'error'); return; }
        editingBlogId = id;
        blogTitle = extractPlainText(data.title);
        blogExcerpt = data.excerpt ?? '';
        blogTags = data.tags ?? '';
        showBlogForm = true;
        if (blogEditor) blogEditor.root.innerHTML = data.content ?? '';
        else pendingBlogContent = data.content ?? '';
    }

    async function saveBlogPost(e) {
        e.preventDefault();
        const content = sanitizeQuillOutput(blogEditor?.root.innerHTML ?? '');
        if (!blogTitle || !content) { showModal('Error', 'Title and Content are required.', 'error'); return; }
        try {
            if (editingBlogId) {
                const { error } = await supabase.from('blog_posts')
                    .update({ title: blogTitle, excerpt: blogExcerpt || null, content, tags: blogTags || null })
                    .eq('id', editingBlogId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('blog_posts').insert([{
                    title: blogTitle, slug: generateSlug(blogTitle),
                    excerpt: blogExcerpt || null, content,
                    tags: blogTags || null, created_at: new Date().toISOString()
                }]);
                if (error) throw error;
            }
            showModal('Success', editingBlogId ? 'Post updated!' : 'Post saved!');
            cancelBlog();
            await loadBlogPosts();
        } catch (err) {
            showModal('Error', 'Failed to save: ' + err.message, 'error');
        }
    }

    async function deleteBlogPost(id) {
        if (!confirm('Delete this blog post?')) return;
        const { error } = await supabase.from('blog_posts').delete().eq('id', id);
        if (error) { showModal('Error', error.message, 'error'); return; }
        await loadBlogPosts();
    }

    async function toggleBlogStar(post) {
        if (!post.starred && blogPosts.filter(p => p.starred).length >= 3) {
            showModal('Limit reached', 'You can feature a maximum of 3 posts on the home page. Unstar one first.', 'error');
            return;
        }
        const { error } = await supabase.from('blog_posts').update({ starred: !post.starred }).eq('id', post.id);
        if (error) { showModal('Error', error.message, 'error'); return; }
        await loadBlogPosts();
    }

    // ==================== PROJECTS ====================

    async function loadProjects() {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) { showModal('Error loading projects', error.message, 'error'); return; }
        projects = data ?? [];
    }

    function startNewProject() {
        editingProjectId = null;
        projectTitle = ''; projectSubtitle = ''; projectLogotype = '';
        projectLink = ''; projectTags = '';
        pendingProjectContent = '';
        if (projectEditor) projectEditor.setContents([]);
        showProjectForm = true;
    }

    function cancelProject() {
        showProjectForm = false; editingProjectId = null;
    }

    async function editProject(id) {
        const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
        if (error) { showModal('Error', error.message, 'error'); return; }
        editingProjectId = id;
        projectTitle = extractPlainText(data.title);
        projectSubtitle = data.subtitle ?? '';
        projectLogotype = data.logotype ?? '';
        projectLink = data.link ?? '';
        projectTags = data.tags ?? '';
        showProjectForm = true;
        if (projectEditor) projectEditor.root.innerHTML = data.description ?? '';
        else pendingProjectContent = data.description ?? '';
    }

    async function saveProject(e) {
        e.preventDefault();
        const description = sanitizeQuillOutput(projectEditor?.root.innerHTML ?? '');
        if (!projectTitle) { showModal('Error', 'Title is required.', 'error'); return; }
        try {
            if (editingProjectId) {
                const { error } = await supabase.from('projects')
                    .update({ title: projectTitle, subtitle: projectSubtitle || null, logotype: projectLogotype || null, description: description || null, link: projectLink || null, tags: projectTags || null })
                    .eq('id', editingProjectId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('projects').insert([{
                    title: projectTitle, subtitle: projectSubtitle || null, logotype: projectLogotype || null,
                    description: description || null, link: projectLink || null,
                    tags: projectTags || null, created_at: new Date().toISOString()
                }]);
                if (error) throw error;
            }
            showModal('Success', editingProjectId ? 'Project updated!' : 'Project saved!');
            cancelProject();
            await loadProjects();
        } catch (err) {
            showModal('Error', 'Failed to save: ' + err.message, 'error');
        }
    }

    async function deleteProject(id) {
        if (!confirm('Delete this project?')) return;
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) { showModal('Error', error.message, 'error'); return; }
        await loadProjects();
    }

    async function toggleProjectStar(project) {
        if (!project.starred && projects.filter(p => p.starred).length >= 3) {
            showModal('Limit reached', 'You can feature a maximum of 3 projects on the home page. Unstar one first.', 'error');
            return;
        }
        const { error } = await supabase.from('projects').update({ starred: !project.starred }).eq('id', project.id);
        if (error) { showModal('Error', error.message, 'error'); return; }
        await loadProjects();
    }

    // ==================== MANUAL ORDERING ====================

    async function moveItem(index, direction, type) {
        const list = type === 'blog' ? blogPosts : projects;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= list.length) return;

        const updated = [...list];
        const [moved] = updated.splice(index, 1);
        updated.splice(newIndex, 0, moved);

        if (type === 'blog') blogPosts = updated;
        else projects = updated;

        savingOrder = true;
        const api = type === 'blog' ? blogApi : projectsApi;
        const { error } = await api.reorder(updated.map(p => p.id));
        savingOrder = false;
        if (error) showModal('Error', 'Could not save order.', 'error');
    }

    // ==================== ABOUT ====================

    async function loadAbout() {
        const { data } = await aboutApi.get();
        if (data) {
            aboutId = data.id;
            aboutName = data.name ?? '';
            aboutPhotoUrl = data.photo_url ?? '';
            aboutLinkedin = data.linkedin_url ?? '';
            aboutInstagram = data.instagram_url ?? '';
            aboutMedium = data.medium_url ?? '';
            aboutBluesky = data.bluesky_url ?? '';
            if (aboutEditor) aboutEditor.root.innerHTML = data.bio ?? '';
        }
    }

    async function saveAbout(e) {
        e.preventDefault();
        if (!aboutName.trim()) { showModal('Error', 'Name is required.', 'error'); return; }
        const bio = sanitizeQuillOutput(aboutEditor?.root.innerHTML ?? '');
        const profile = {
            name: aboutName.trim(),
            photo_url: aboutPhotoUrl || null,
            bio: bio || null,
            linkedin_url: aboutLinkedin || null,
            instagram_url: aboutInstagram || null,
            medium_url: aboutMedium || null,
            bluesky_url: aboutBluesky || null,
        };
        if (aboutId) profile.id = aboutId;
        try {
            const { error } = await aboutApi.upsert(profile);
            if (error) throw error;
            showModal('Success', 'About profile saved!');
        } catch (err) {
            showModal('Error', 'Failed to save: ' + err.message, 'error');
        }
    }

    // ==================== ANALYTICS ====================

    async function loadAnalytics() {
        try {
            const [{ data: blogData }, { data: projectData }, { data: allEvents }] = await Promise.all([
                blogApi.getAll(), projectsApi.getAll(), eventsApi.getAll()
            ]);

            const events = allEvents ?? [];
            allRawEvents = events;

            // Country breakdown
            const countryMap = {};
            events.forEach(e => {
                const c = e.country ?? 'Unknown';
                if (!countryMap[c]) countryMap[c] = { views: 0, total: 0 };
                countryMap[c].total++;
                if (e.event_type === 'detail_view') countryMap[c].views++;
            });
            countryStats = Object.entries(countryMap)
                .map(([country, s]) => ({ country, ...s }))
                .sort((a, b) => b.total - a.total);

            if (blogData?.length) {
                blogMetrics = blogData.map(post => {
                    const ev = events.filter(e => e.content_type === 'blog_post' && e.content_id === String(post.id));
                    const viewEvents = ev.filter(e => e.event_type === 'detail_view');
                    const shareEvents = ev.filter(e => e.event_type === 'share');
                    const reactionEvents = ev.filter(e => e.event_type === 'reaction');
                    return {
                        ...post,
                        views: viewEvents.length,
                        uniqueReaders: new Set(viewEvents.map(e => e.user_identifier)).size,
                        reactions: reactionEvents.length,
                        shares: shareEvents.length,
                        uniqueSharers: new Set(shareEvents.map(e => e.user_identifier)).size,
                    };
                }).sort((a, b) => b.views - a.views);

                // Cross-post reader breakdown
                const readerMap = {};
                events.filter(e => e.content_type === 'blog_post').forEach(e => {
                    const uid = e.user_identifier?.slice(-8) ?? '?';
                    if (!readerMap[uid]) readerMap[uid] = { postsRead: new Set(), reads: 0, shares: 0 };
                    if (e.event_type === 'detail_view') { readerMap[uid].postsRead.add(e.content_id); readerMap[uid].reads++; }
                    if (e.event_type === 'share') readerMap[uid].shares++;
                });
                blogReaderStats = Object.entries(readerMap)
                    .map(([id, s]) => ({ id, postsRead: s.postsRead.size, reads: s.reads, shares: s.shares }))
                    .sort((a, b) => b.reads - a.reads);
            }

            if (projectData?.length) {
                projectMetrics = projectData.map(proj => {
                    const ev = events.filter(e => e.content_type === 'project' && e.content_id === String(proj.id));
                    const viewEvents = ev.filter(e => e.event_type === 'detail_view');
                    const shareEvents = ev.filter(e => e.event_type === 'share');
                    return {
                        ...proj,
                        views: viewEvents.length,
                        uniqueReaders: new Set(viewEvents.map(e => e.user_identifier)).size,
                        shares: shareEvents.length,
                        uniqueSharers: new Set(shareEvents.map(e => e.user_identifier)).size,
                    };
                }).sort((a, b) => b.views - a.views);

                const readerMap = {};
                events.filter(e => e.content_type === 'project').forEach(e => {
                    const uid = e.user_identifier?.slice(-8) ?? '?';
                    if (!readerMap[uid]) readerMap[uid] = { postsRead: new Set(), reads: 0, shares: 0 };
                    if (e.event_type === 'detail_view') { readerMap[uid].postsRead.add(e.content_id); readerMap[uid].reads++; }
                    if (e.event_type === 'share') readerMap[uid].shares++;
                });
                projectReaderStats = Object.entries(readerMap)
                    .map(([id, s]) => ({ id, postsRead: s.postsRead.size, reads: s.reads, shares: s.shares }))
                    .sort((a, b) => b.reads - a.reads);
            }

            appMetrics = Object.entries(APP_IDS).map(([, appId]) => {
                const ev = events.filter(e => e.content_type === 'app' && e.content_id === appId);
                return {
                    name: APP_NAMES[appId] || appId,
                    launches: ev.filter(e => e.event_type === 'app_launch').length,
                    uniqueGuests: new Set(ev.map(e => e.user_identifier)).size,
                };
            });
        } catch (err) {
            console.error('Analytics error:', err);
        }
    }

    // ==================== CHART HELPERS ====================

    function buildChartData(events, period, from, to) {
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to + 'T23:59:59') : null;
        const filtered = events.filter(e => {
            const d = new Date(e.created_at);
            if (fromDate && d < fromDate) return false;
            if (toDate && d > toDate) return false;
            return true;
        });
        const buckets = {};
        filtered.forEach(e => {
            const key = getChartBucketKey(new Date(e.created_at), period);
            if (!buckets[key]) buckets[key] = { views: 0, reactions: 0, shares: 0, launches: 0 };
            if (e.event_type === 'detail_view') buckets[key].views++;
            else if (e.event_type === 'reaction') buckets[key].reactions++;
            else if (e.event_type === 'share') buckets[key].shares++;
            else if (e.event_type === 'app_launch') buckets[key].launches++;
        });
        return Object.entries(buckets)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([label, c]) => ({ label, ...c, total: c.views + c.reactions + c.shares + c.launches }));
    }

    function getChartBucketKey(date, period) {
        if (period === 'yearly') return `${date.getFullYear()}`;
        if (period === 'monthly') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (period === 'daily') return date.toISOString().slice(0, 10);
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
        return d.toISOString().slice(0, 10);
    }

    function formatChartLabel(key, period) {
        if (period === 'yearly') return key;
        const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        if (period === 'monthly') {
            const [y, m] = key.split('-');
            return `${mo[parseInt(m) - 1]} '${y.slice(2)}`;
        }
        const d = new Date(key + 'T12:00:00');
        return `${mo[d.getMonth()]} ${d.getDate()}`;
    }

    // ==================== MOUNT ====================

    let quillReady = $state(false);

    // Lazy-init blog editor when the form becomes visible
    $effect(() => {
        if (showBlogForm && quillReady && !blogEditor) {
            tick().then(() => {
                blogEditor = makeEditor('#blogContentEditor', 'Write your blog post here...');
                setupImageHandler(blogEditor);
                if (pendingBlogContent !== null) {
                    blogEditor.root.innerHTML = pendingBlogContent;
                    pendingBlogContent = null;
                }
            });
        }
    });

    // Lazy-init project editor when the form becomes visible
    $effect(() => {
        if (showProjectForm && quillReady && !projectEditor) {
            tick().then(() => {
                projectEditor = makeEditor('#projectDescriptionEditor', 'Write your project description here...');
                setupImageHandler(projectEditor);
                if (pendingProjectContent !== null) {
                    projectEditor.root.innerHTML = pendingProjectContent;
                    pendingProjectContent = null;
                }
            });
        }
    });

    // Lazy-init about editor when the About tab becomes active
    $effect(() => {
        if (activeTab === 'about' && quillReady && !aboutEditor) {
            tick().then(() => {
                aboutEditor = makeEditor('#aboutBioEditor', 'Write your bio here...', 'simple');
                loadAbout();
            });
        }
    });

    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { goto('/login'); return; }

        authorized = true;
        await tick(); // ensure DOM is updated before loading data or showing modals

        // Apply theme
        const theme = localStorage.getItem('theme') || 'signal';
        document.body.className = document.body.className.replace(/theme-\w+/, '') + ` theme-${theme}`;

        // Load Quill + Cropper scripts
        loadLink('https://cdn.quilljs.com/1.3.6/quill.snow.css');
        await loadScript('https://cdn.quilljs.com/1.3.6/quill.js');
        loadLink('https://cdn.jsdelivr.net/npm/cropperjs@1/dist/cropper.css');
        await loadScript('https://cdn.jsdelivr.net/npm/cropperjs@1/dist/cropper.js');
        quillReady = true;

        // Load data
        await Promise.all([loadBlogPosts(), loadProjects(), loadAnalytics()]);
        // About is loaded by the $effect when the About tab is opened
    });
</script>

<svelte:head>
    <title>CMS - After The Noise</title>
</svelte:head>

{#if authorized}
<header class="cms-header">
    <div class="header-content">
        <h1>Content Management</h1>
    </div>
</header>

<main class="cms-main">
    <!-- Tabs -->
    <div class="cms-tabs">
        {#each ['blog','projects','about','analytics'] as tab}
            <button class="cms-tab" class:active={activeTab === tab} onclick={() => activeTab = tab}>
                {tab === 'blog' ? 'Blog Posts' : tab === 'projects' ? 'Projects' : tab === 'about' ? 'About' : 'Analytics'}
            </button>
        {/each}
    </div>

    <!-- ===== BLOG TAB ===== -->
    {#if activeTab === 'blog'}
    <section class="cms-tab-content active">
        <h2>Blog Posts</h2>

        {#if !showBlogForm}
            <div class="cms-actions">
                <button class="btn-new" onclick={startNewBlog}>+ New Post</button>
            </div>
            <div class="cms-list">
                {#if blogPosts.length === 0}
                    <div class="cms-empty"><p>No blog posts yet. Create your first post!</p></div>
                {:else}
                    {#each blogPosts as post, i (post.id)}
                        <div class="cms-item">
                            <div class="cms-item-header">
                                <div class="cms-order-btns">
                                    <button class="cms-order-btn" onclick={() => moveItem(i, -1, 'blog')} disabled={i === 0 || savingOrder} title="Move up">↑</button>
                                    <button class="cms-order-btn" onclick={() => moveItem(i, 1, 'blog')} disabled={i === blogPosts.length - 1 || savingOrder} title="Move down">↓</button>
                                </div>
                                <h4>{extractPlainText(post.title)}</h4>
                                <span class="cms-item-date">{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                            {#if post.excerpt}<p class="cms-item-excerpt">{post.excerpt}</p>{/if}
                            <div class="cms-item-preview">{@html post.content}</div>
                            <div class="cms-item-actions">
                                <button
                                    class="cms-item-star"
                                    class:starred={post.starred}
                                    onclick={() => toggleBlogStar(post)}
                                    title={post.starred ? 'Remove from home page' : 'Feature on home page'}
                                    disabled={!post.starred && blogPosts.filter(p => p.starred).length >= 3}
                                >{post.starred ? '★' : '☆'}</button>
                                <button class="cms-item-edit" onclick={() => editBlogPost(post.id)}>Edit</button>
                                <button class="cms-item-delete" onclick={() => deleteBlogPost(post.id)}>Delete</button>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        {:else}
            <div class="cms-form">
                <h3>{editingBlogId ? 'Edit Blog Post' : 'New Blog Post'}</h3>
                <form onsubmit={saveBlogPost}>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" bind:value={blogTitle} placeholder="Enter blog post title" required />
                    </div>
                    <div class="form-group">
                        <label>Excerpt</label>
                        <textarea bind:value={blogExcerpt} rows="3" placeholder="Enter blog post excerpt"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Tags (comma-separated)</label>
                        <input type="text" bind:value={blogTags} placeholder="e.g., design, development" />
                    </div>
                    <div class="form-group">
                        <label>Content</label>
                        <div id="blogContentEditor" style="height:400px;"></div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-save">Save</button>
                        <button type="button" class="btn-cancel" onclick={cancelBlog}>Cancel</button>
                    </div>
                </form>
            </div>
        {/if}
    </section>
    {/if}

    <!-- ===== PROJECTS TAB ===== -->
    {#if activeTab === 'projects'}
    <section class="cms-tab-content active">
        <h2>Projects</h2>

        {#if !showProjectForm}
            <div class="cms-actions">
                <button class="btn-new" onclick={startNewProject}>+ New Project</button>
            </div>
            <div class="cms-list">
                {#if projects.length === 0}
                    <div class="cms-empty"><p>No projects yet. Create your first project!</p></div>
                {:else}
                    {#each projects as project, i (project.id)}
                        <div class="cms-item">
                            <div class="cms-item-header">
                                <div class="cms-order-btns">
                                    <button class="cms-order-btn" onclick={() => moveItem(i, -1, 'projects')} disabled={i === 0 || savingOrder} title="Move up">↑</button>
                                    <button class="cms-order-btn" onclick={() => moveItem(i, 1, 'projects')} disabled={i === projects.length - 1 || savingOrder} title="Move down">↓</button>
                                </div>
                                <h4>{extractPlainText(project.title)}</h4>
                                <span class="cms-item-date">{new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                            {#if project.subtitle}<p class="cms-item-excerpt">{project.subtitle}</p>{/if}
                            {#if project.description}
                                <div class="cms-item-preview">{@html project.description}</div>
                            {/if}
                            <div class="cms-item-actions">
                                <button
                                    class="cms-item-star"
                                    class:starred={project.starred}
                                    onclick={() => toggleProjectStar(project)}
                                    title={project.starred ? 'Remove from home page' : 'Feature on home page'}
                                    disabled={!project.starred && projects.filter(p => p.starred).length >= 3}
                                >{project.starred ? '★' : '☆'}</button>
                                <button class="cms-item-edit" onclick={() => editProject(project.id)}>Edit</button>
                                <button class="cms-item-delete" onclick={() => deleteProject(project.id)}>Delete</button>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        {:else}
            <div class="cms-form">
                <h3>{editingProjectId ? 'Edit Project' : 'New Project'}</h3>
                <form onsubmit={saveProject}>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" bind:value={projectTitle} placeholder="Enter project title" required />
                    </div>
                    <div class="form-group">
                        <label>Subtitle</label>
                        <input type="text" bind:value={projectSubtitle} placeholder="e.g., Owning the Concept Behind..." />
                    </div>
                    <div class="form-group">
                        <label>Client Logotype URL</label>
                        <input type="url" bind:value={projectLogotype} placeholder="https://example.com/logo.png" />
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <div id="projectDescriptionEditor" style="height:200px;"></div>
                    </div>
                    <div class="form-group">
                        <label>Project Link</label>
                        <input type="url" bind:value={projectLink} placeholder="https://example.com" />
                    </div>
                    <div class="form-group">
                        <label>Tags (comma-separated)</label>
                        <input type="text" bind:value={projectTags} placeholder="e.g., web, design, react" />
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn-save">Save</button>
                        <button type="button" class="btn-cancel" onclick={cancelProject}>Cancel</button>
                    </div>
                </form>
            </div>
        {/if}
    </section>
    {/if}

    <!-- ===== ABOUT TAB ===== -->
    {#if activeTab === 'about'}
    <section class="cms-tab-content active">
        <h2>About Me</h2>
        <div class="cms-form" style="display:block;">
            <form onsubmit={saveAbout}>
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" bind:value={aboutName} placeholder="Your name" />
                </div>
                <div class="form-group">
                    <label>Photo URL</label>
                    <input type="url" bind:value={aboutPhotoUrl} placeholder="https://... or /images/bobby.png" />
                </div>
                <div class="form-group">
                    <label>Bio</label>
                    <div id="aboutBioEditor" style="height:200px;"></div>
                </div>
                <h4 style="margin:1.5rem 0 1rem;">Social Links</h4>
                <div class="form-group">
                    <label>LinkedIn URL</label>
                    <input type="url" bind:value={aboutLinkedin} placeholder="https://www.linkedin.com/in/..." />
                </div>
                <div class="form-group">
                    <label>Instagram URL</label>
                    <input type="url" bind:value={aboutInstagram} placeholder="https://www.instagram.com/..." />
                </div>
                <div class="form-group">
                    <label>Medium URL</label>
                    <input type="url" bind:value={aboutMedium} placeholder="https://medium.com/@..." />
                </div>
                <div class="form-group">
                    <label>Bluesky URL</label>
                    <input type="url" bind:value={aboutBluesky} placeholder="https://bsky.app/profile/..." />
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-save">Save About</button>
                </div>
            </form>
        </div>
    </section>
    {/if}

    <!-- ===== ANALYTICS TAB ===== -->
    {#if activeTab === 'analytics'}
    <section class="cms-tab-content active">
        <h2>Analytics</h2>

        <!-- App Analytics -->
        <div class="analytics-section">
            <h3>Application Usage</h3>
            {#if appMetrics.length === 0}
                <p class="cms-empty">Loading app analytics…</p>
            {:else}
                <div class="analytics-grid">
                    <div class="metric-card">
                        <div class="metric-value">{appMetrics.reduce((s, a) => s + a.launches, 0)}</div>
                        <div class="metric-label">Total Launches</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{appMetrics.reduce((s, a) => s + a.uniqueGuests, 0)}</div>
                        <div class="metric-label">Unique Guests</div>
                    </div>
                </div>
                <div class="top-posts-section">
                    <h4>Launches per App</h4>
                    <table class="analytics-table">
                        <thead><tr><th>App</th><th>Launches</th><th>Unique Guests</th></tr></thead>
                        <tbody>
                            {#each appMetrics as app}
                                <tr><td>{app.name}</td><td>{app.launches}</td><td>{app.uniqueGuests}</td></tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        </div>

        <!-- Activity Chart -->
        <div class="analytics-section">
            <h3>Activity Over Time</h3>
            <div class="chart-controls">
                <div class="period-selector">
                    <button class="period-btn" class:active={chartPeriod === 'daily'} onclick={() => chartPeriod = 'daily'}>Daily</button>
                    <button class="period-btn" class:active={chartPeriod === 'weekly'} onclick={() => chartPeriod = 'weekly'}>Weekly</button>
                    <button class="period-btn" class:active={chartPeriod === 'monthly'} onclick={() => chartPeriod = 'monthly'}>Monthly</button>
                    <button class="period-btn" class:active={chartPeriod === 'yearly'} onclick={() => chartPeriod = 'yearly'}>Yearly</button>
                </div>
                <div class="date-range">
                    <label>From <input type="date" bind:value={chartDateFrom} /></label>
                    <label>To <input type="date" bind:value={chartDateTo} /></label>
                </div>
            </div>
            {#if chartData.length === 0}
                <p class="cms-empty" style="margin-top:1rem;">No activity data for the selected range.</p>
            {:else}
                <div class="chart-scroll">
                    <div class="chart-bars">
                        {#each chartData as bucket}
                            <div class="chart-bar-group">
                                <div class="bar-total">{bucket.total > 0 ? bucket.total : ''}</div>
                                <div class="bar-stack">
                                    {#if bucket.views > 0}<div class="bar-segment bar-views" style="height:{(bucket.views / maxChartVal * 100)}%"></div>{/if}
                                    {#if bucket.reactions > 0}<div class="bar-segment bar-reactions" style="height:{(bucket.reactions / maxChartVal * 100)}%"></div>{/if}
                                    {#if bucket.shares > 0}<div class="bar-segment bar-shares" style="height:{(bucket.shares / maxChartVal * 100)}%"></div>{/if}
                                    {#if bucket.launches > 0}<div class="bar-segment bar-launches" style="height:{(bucket.launches / maxChartVal * 100)}%"></div>{/if}
                                </div>
                                <div class="bar-label">{formatChartLabel(bucket.label, chartPeriod)}</div>
                            </div>
                        {/each}
                    </div>
                </div>
                <div class="chart-legend">
                    <span class="legend-item"><span class="legend-dot" style="background:#4A90D9"></span>Views</span>
                    <span class="legend-item"><span class="legend-dot" style="background:#E56B4C"></span>Reactions</span>
                    <span class="legend-item"><span class="legend-dot" style="background:#7ABF6A"></span>Shares</span>
                    <span class="legend-item"><span class="legend-dot" style="background:#9B6DD2"></span>Launches</span>
                </div>
            {/if}
            {#if countryStats.length > 0}
            <div class="top-posts-section">
                <h4>Visitors by Country</h4>
                <table class="analytics-table">
                    <thead><tr><th>Country</th><th>Views</th><th>Total Events</th></tr></thead>
                    <tbody>
                        {#each countryStats as row}
                            <tr>
                                <td>{row.country}</td>
                                <td>{row.views}</td>
                                <td>{row.total}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            {/if}
        </div>

        <!-- Blog Analytics -->
        <div class="analytics-section">
            <h3>Blog Post Performance</h3>
            {#if blogMetrics.length === 0}
                <p class="cms-empty">Loading blog analytics…</p>
            {:else}
                <div class="analytics-grid">
                    <div class="metric-card">
                        <div class="metric-value">{blogMetrics.reduce((s, p) => s + p.views, 0)}</div>
                        <div class="metric-label">Total Views</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{blogReaderStats.length}</div>
                        <div class="metric-label">Unique Readers</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{blogMetrics.reduce((s, p) => s + p.reactions, 0)}</div>
                        <div class="metric-label">Total Reactions</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{blogMetrics.reduce((s, p) => s + p.shares, 0)}</div>
                        <div class="metric-label">Total Shares</div>
                    </div>
                </div>
                <div class="top-posts-section">
                    <h4>Posts</h4>
                    <table class="analytics-table">
                        <thead><tr><th>Title</th><th>Views</th><th>Uniq. Readers</th><th>Reactions</th><th>Shares</th></tr></thead>
                        <tbody>
                            {#each blogMetrics as post}
                                <tr>
                                    <td>{extractPlainText(post.title)}</td>
                                    <td>{post.views}</td>
                                    <td>{post.uniqueReaders}</td>
                                    <td>{post.reactions}</td>
                                    <td>{post.shares}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                {#if blogReaderStats.length > 0}
                <div class="top-posts-section">
                    <h4>Reader Breakdown</h4>
                    <table class="analytics-table">
                        <thead><tr><th>User (ID suffix)</th><th>Posts Read</th><th>Total Reads</th><th>Shares</th></tr></thead>
                        <tbody>
                            {#each blogReaderStats.slice(0, 10) as reader}
                                <tr>
                                    <td class="reader-id">…{reader.id}</td>
                                    <td>{reader.postsRead}</td>
                                    <td>{reader.reads}</td>
                                    <td>{reader.shares}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                {/if}
            {/if}
        </div>

        <!-- Project Analytics -->
        <div class="analytics-section">
            <h3>Project Performance</h3>
            {#if projectMetrics.length === 0}
                <p class="cms-empty">Loading project analytics…</p>
            {:else}
                <div class="analytics-grid">
                    <div class="metric-card">
                        <div class="metric-value">{projectMetrics.reduce((s, p) => s + p.views, 0)}</div>
                        <div class="metric-label">Total Views</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{projectReaderStats.length}</div>
                        <div class="metric-label">Unique Visitors</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{projectMetrics.reduce((s, p) => s + p.shares, 0)}</div>
                        <div class="metric-label">Total Shares</div>
                    </div>
                </div>
                <div class="top-posts-section">
                    <h4>Projects</h4>
                    <table class="analytics-table">
                        <thead><tr><th>Title</th><th>Views</th><th>Uniq. Visitors</th><th>Shares</th></tr></thead>
                        <tbody>
                            {#each projectMetrics as proj}
                                <tr>
                                    <td>{extractPlainText(proj.title)}</td>
                                    <td>{proj.views}</td>
                                    <td>{proj.uniqueReaders}</td>
                                    <td>{proj.shares}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                {#if projectReaderStats.length > 0}
                <div class="top-posts-section">
                    <h4>Visitor Breakdown</h4>
                    <table class="analytics-table">
                        <thead><tr><th>User (ID suffix)</th><th>Projects Viewed</th><th>Total Views</th><th>Shares</th></tr></thead>
                        <tbody>
                            {#each projectReaderStats.slice(0, 10) as reader}
                                <tr>
                                    <td class="reader-id">…{reader.id}</td>
                                    <td>{reader.postsRead}</td>
                                    <td>{reader.reads}</td>
                                    <td>{reader.shares}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                {/if}
            {/if}
        </div>
    </section>
    {/if}
</main>

<!-- ===== MODAL ===== -->
{#if modal.show}
    <div class="cms-overlay" onclick={closeModal}></div>
    <div class="cms-modal {modal.type}">
        <h4>{modal.title}</h4>
        <p>{modal.message}</p>
        <div class="cms-modal-actions">
            <button onclick={closeModal}>{modal.type === 'error' ? 'Close' : 'OK'}</button>
        </div>
    </div>
{/if}

<!-- ===== CROP MODAL ===== -->
{#if cropModal}
    <div class="cms-overlay"></div>
    <div class="cms-modal" style="max-width:90vw;max-height:90vh;">
        <h4>Crop Image</h4>
        <div style="position:relative;max-height:60vh;overflow:hidden;margin-bottom:1rem;">
            <img id="cropImage" src="" alt="Crop preview" style="max-width:100%;display:block;" />
        </div>
        <div class="cms-modal-actions" style="display:flex;gap:0.5rem;">
            <button class="btn-save" style="flex:1;" onclick={performCrop}>Crop</button>
            <button class="btn-cancel" style="flex:1;" onclick={closeCropModal}>Cancel</button>
        </div>
    </div>
{/if}
{/if}
