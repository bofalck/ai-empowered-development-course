import { blogApi, projectsApi, aboutApi } from '$lib/api.js';

export async function load() {
    const [blogResult, projectsResult, aboutResult] = await Promise.all([
        blogApi.getAll(),
        projectsApi.getAll(),
        aboutApi.get(),
    ]);

    return {
        posts: blogResult.data ?? [],
        projects: projectsResult.data ?? [],
        about: aboutResult.data ?? null,
    };
}
