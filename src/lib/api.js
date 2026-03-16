// Centralized API layer for all Supabase calls
// This is the single source of truth for data access
// Easy to mock for testing and to migrate to SvelteKit

import { supabase } from '$lib/supabase-client.js';

/**
 * Blog Posts API
 */
export const blogApi = {
    async getAll() {
        // Try with sort_order first; fall back to created_at if the column doesn't exist yet
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (!error) return { data, error: null };

        // sort_order column missing — fall back gracefully
        const { data: fallback, error: err2 } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (err2) { console.error('Blog API error:', err2); return { data: null, error: err2 }; }
        return { data: fallback, error: null };
    },

    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Blog API error:', error);
            return { data: null, error };
        }
    },

    async getBySlug(slug) {
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Blog API error:', error);
            return { data: null, error };
        }
    },

    async create(post) {
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .insert([post]);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Blog API error:', error);
            return { data: null, error };
        }
    },

    async update(id, post) {
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .update(post)
                .eq('id', id);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Blog API error:', error);
            return { data: null, error };
        }
    },

    async delete(id) {
        try {
            const { data, error } = await supabase
                .from('blog_posts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Blog API error:', error);
            return { data: null, error };
        }
    },

    async reorder(orderedIds) {
        try {
            await Promise.all(
                orderedIds.map((id, index) =>
                    supabase.from('blog_posts').update({ sort_order: index }).eq('id', id)
                )
            );
            return { error: null };
        } catch (error) {
            console.error('Blog API error:', error);
            return { error };
        }
    },
};

/**
 * Projects API
 */
export const projectsApi = {
    async getAll() {
        // Try with sort_order first; fall back to created_at if the column doesn't exist yet
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('sort_order', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (!error) return { data, error: null };

        // sort_order column missing — fall back gracefully
        const { data: fallback, error: err2 } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (err2) { console.error('Projects API error:', err2); return { data: null, error: err2 }; }
        return { data: fallback, error: null };
    },

    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Projects API error:', error);
            return { data: null, error };
        }
    },

    async create(project) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([project]);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Projects API error:', error);
            return { data: null, error };
        }
    },

    async update(id, project) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .update(project)
                .eq('id', id);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Projects API error:', error);
            return { data: null, error };
        }
    },

    async delete(id) {
        try {
            const { data, error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Projects API error:', error);
            return { data: null, error };
        }
    },

    async reorder(orderedIds) {
        try {
            await Promise.all(
                orderedIds.map((id, index) =>
                    supabase.from('projects').update({ sort_order: index }).eq('id', id)
                )
            );
            return { error: null };
        } catch (error) {
            console.error('Projects API error:', error);
            return { error };
        }
    },
};

/**
 * Blog Reactions API
 */
export const reactionsApi = {
    async getByPostId(blogPostId, userIdentifier, isAuthenticated) {
        try {
            const column = isAuthenticated ? 'user_id' : 'guest_id';
            const { data, error } = await supabase
                .from('blog_post_reactions')
                .select('emoji')
                .eq('blog_post_id', blogPostId)
                .eq(column, userIdentifier);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Reactions API error:', error);
            return { data: null, error };
        }
    },

    async getCountByPostId(blogPostId) {
        try {
            const { data, error } = await supabase
                .from('blog_post_reactions')
                .select('emoji')
                .eq('blog_post_id', blogPostId);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Reactions API error:', error);
            return { data: null, error };
        }
    },

    async addReaction(blogPostId, userIdentifier, emoji, isAuthenticated) {
        try {
            const column = isAuthenticated ? 'user_id' : 'guest_id';
            const { data, error } = await supabase
                .from('blog_post_reactions')
                .insert([{
                    blog_post_id: blogPostId,
                    [column]: userIdentifier,
                    emoji
                }]);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Reactions API error:', error);
            return { data: null, error };
        }
    },

    async removeReaction(reactionId) {
        try {
            const { data, error } = await supabase
                .from('blog_post_reactions')
                .delete()
                .eq('id', reactionId);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Reactions API error:', error);
            return { data: null, error };
        }
    },

    async checkExisting(blogPostId, userIdentifier, emoji, isAuthenticated) {
        try {
            const column = isAuthenticated ? 'user_id' : 'guest_id';
            const { data, error } = await supabase
                .from('blog_post_reactions')
                .select('id')
                .eq('blog_post_id', blogPostId)
                .eq(column, userIdentifier)
                .eq('emoji', emoji);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Reactions API error:', error);
            return { data: null, error };
        }
    },
};

/**
 * Content Engagement Events API
 */
export const eventsApi = {
    async track(eventData) {
        try {
            const { data, error } = await supabase
                .from('content_engagement_events')
                .insert([eventData]);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            // Silent fail - don't impact UX
            console.error('Event tracking error:', error);
            return { data: null, error };
        }
    },

    async getByContentId(contentType, contentId) {
        try {
            const { data, error } = await supabase
                .from('content_engagement_events')
                .select('*')
                .eq('content_type', contentType)
                .eq('content_id', contentId);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Events API error:', error);
            return { data: null, error };
        }
    },

    async getAll() {
        try {
            const { data, error } = await supabase
                .from('content_engagement_events')
                .select('*');

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Events API error:', error);
            return { data: null, error };
        }
    },
};

/**
 * About Profile API (single row)
 */
export const aboutApi = {
    async get() {
        try {
            const { data, error } = await supabase
                .from('about_profile')
                .select('*')
                .limit(1)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('About API error:', error);
            return { data: null, error };
        }
    },

    async upsert(profile) {
        try {
            const { data, error } = await supabase
                .from('about_profile')
                .upsert([profile], { onConflict: 'id' });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('About API error:', error);
            return { data: null, error };
        }
    },
};
