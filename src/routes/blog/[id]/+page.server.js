import { blogApi } from '$lib/api.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
    const { data: post, error: err } = await blogApi.getById(params.id);
    if (err || !post) throw error(404, 'Post not found');
    return { post };
}
