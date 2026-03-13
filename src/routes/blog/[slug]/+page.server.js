import { blogApi } from '$lib/api.js';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params }) {
    // Try by slug first
    const { data: post } = await blogApi.getBySlug(params.slug);
    if (post) return { post };

    // Fallback: try by id (handles old /blog/1 style URLs)
    const { data: postById } = await blogApi.getById(params.slug);
    if (postById) {
        // Redirect to canonical slug URL if the post has one
        if (postById.slug) throw redirect(301, `/blog/${postById.slug}`);
        return { post: postById };
    }

    throw error(404, 'Post not found');
}
