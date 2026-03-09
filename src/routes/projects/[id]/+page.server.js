import { projectsApi } from '$lib/api.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    const { data: project, error: err } = await projectsApi.getById(params.id);
    if (err || !project) throw error(404, 'Project not found');
    return { project };
}
