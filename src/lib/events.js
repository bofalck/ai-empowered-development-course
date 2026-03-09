// Event tracking utilities
// Centralized event tracking to use throughout the app

import { supabase } from '$lib/supabase-client.js';
import { eventsApi } from '$lib/api.js';
import { getGuestId } from '$lib/utils.js';
import { CONTENT_TYPES, EVENT_TYPES, USER_TYPES, APP_IDS } from '$lib/types.js';

/**
 * Track an engagement event
 * @param {string} contentType - Type of content (CONTENT_TYPES.BLOG_POST or CONTENT_TYPES.PROJECT)
 * @param {string} contentId - ID of the content
 * @param {string} eventType - Type of event (EVENT_TYPES.DETAIL_VIEW, etc.)
 * @param {object} additionalData - Extra data like share_platform
 */
export async function trackEvent(contentType, contentId, eventType, additionalData = {}) {
    try {
        const user = (await supabase.auth.getUser()).data.user;
        const isAuthenticated = !!user;
        const userIdentifier = isAuthenticated ? user.id : getGuestId();

        const eventData = {
            content_type: contentType,
            content_id: contentId,
            event_type: eventType,
            user_identifier: userIdentifier,
            user_type: isAuthenticated ? USER_TYPES.AUTHENTICATED : USER_TYPES.GUEST,
            ...additionalData
        };

        await eventsApi.track(eventData);
    } catch (error) {
        // Silent fail - don't impact UX
        console.debug('Event tracking error:', error);
    }
}

/**
 * Track blog post detail view
 */
export function trackBlogDetailView(blogPostId) {
    return trackEvent(CONTENT_TYPES.BLOG_POST, blogPostId, EVENT_TYPES.DETAIL_VIEW);
}

/**
 * Track project detail view
 */
export function trackProjectDetailView(projectId) {
    return trackEvent(CONTENT_TYPES.PROJECT, projectId, EVENT_TYPES.DETAIL_VIEW);
}

/**
 * Track blog reaction
 */
export function trackBlogReaction(blogPostId) {
    return trackEvent(CONTENT_TYPES.BLOG_POST, blogPostId, EVENT_TYPES.REACTION);
}

/**
 * Track share event
 * @param {string} contentType - BLOG_POST or PROJECT
 * @param {string} contentId - ID of content
 * @param {string} platform - Which platform (twitter, bluesky, linkedin, native)
 */
export function trackShare(contentType, contentId, platform) {
    return trackEvent(contentType, contentId, EVENT_TYPES.SHARE, {
        share_platform: platform
    });
}

/**
 * Track app launch
 * @param {string} appId - APP_IDS.TRANSCRIBER or APP_IDS.MAGICAL_UNICORNS
 */
export function trackAppLaunch(appId) {
    return trackEvent(CONTENT_TYPES.APP, appId, EVENT_TYPES.APP_LAUNCH);
}
