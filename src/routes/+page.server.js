import { blogApi, projectsApi, aboutApi } from '$lib/api.js';

export async function load() {
    const [blogResult, projectsResult, aboutResult] = await Promise.all([
        blogApi.getAll(),
        projectsApi.getAll(),
        aboutApi.get(),
    ]);

    const allPosts = blogResult.data ?? [];
    const starredPosts = allPosts.filter(p => p.starred);
    const posts = starredPosts.length ? starredPosts : allPosts.slice(0, 3);

    const allProjects = projectsResult.data ?? [];
    const starredProjects = allProjects.filter(p => p.starred);
    const projects = starredProjects.length ? starredProjects : allProjects.slice(0, 2);

    return {
        posts,
        projects,
        postCount: allPosts.length,
        projectCount: allProjects.length,
        about: aboutResult.data ?? null,
    };
}
