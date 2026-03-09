import { blogApi } from '$lib/api.js';

export async function load() {
    const { data, error } = await blogApi.getAll();
    if (error) console.error('Failed to load blog posts:', error);
    return { posts: data ?? [] };
}
