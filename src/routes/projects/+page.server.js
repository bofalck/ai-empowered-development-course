import { projectsApi } from '$lib/api.js';

export async function load() {
    const { data, error } = await projectsApi.getAll();
    if (error) console.error('Failed to load projects:', error);
    return { projects: data ?? [] };
}
