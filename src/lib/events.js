// Event tracking utilities
// Centralized event tracking to use throughout the app

import { supabase } from '$lib/supabase-client.js';
import { eventsApi } from '$lib/api.js';
import { getGuestId } from '$lib/utils.js';
import { CONTENT_TYPES, EVENT_TYPES, USER_TYPES, APP_IDS } from '$lib/types.js';

let _country = null;

async function getCountry() {
    if (_country !== null) return _country;
    try {
        const cached = sessionStorage.getItem('visitor_country');
        if (cached) { _country = cached; return _country; }
        const res = await fetch('https://ipapi.co/country/');
        const text = (await res.text()).trim();
        _country = text.length === 2 ? text : null;
        if (_country) sessionStorage.setItem('visitor_country', _country);
    } catch {
        _country = null;
    }
    return _country;
}

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
        const country = await getCountry();

        const eventData = {
            content_type: contentType,
            content_id: contentId,
            event_type: eventType,
            user_identifier: userIdentifier,
            user_type: isAuthenticated ? USER_TYPES.AUTHENTICATED : USER_TYPES.GUEST,
            country: country || null,
            ...additionalData
        };

        await eventsApi.track(eventData);
    } catch (error) {
        // Silent fail - don't impact UX
        console.error('Event tracking error:', error);
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

/**
 * Track blog post creation (published by admin)
 */
export function trackBlogCreated(blogPostId) {
    return trackEvent(CONTENT_TYPES.BLOG_POST, blogPostId, EVENT_TYPES.POST_CREATED);
}

/**
 * Track project creation (published by admin)
 */
export function trackProjectCreated(projectId) {
    return trackEvent(CONTENT_TYPES.PROJECT, projectId, EVENT_TYPES.POST_CREATED);
}

/**
 * Track outbound link click (social profiles, project external links)
 * @param {string} contentType - CONTENT_TYPES.PROFILE or CONTENT_TYPES.PROJECT
 * @param {string} contentId - platform name or project ID
 * @param {string} destination - the URL being navigated to
 */
export function trackOutboundLink(contentType, contentId, destination) {
    return trackEvent(contentType, contentId, EVENT_TYPES.OUTBOUND_LINK, { destination });
}

/**
 * Track CV PDF open
 */
export function trackCvDownload() {
    return trackEvent(CONTENT_TYPES.PROFILE, 'cv', EVENT_TYPES.CV_DOWNLOAD);
}

export function trackContentUpdated(contentType, contentId) {
    return trackEvent(contentType, contentId, EVENT_TYPES.CONTENT_UPDATED);
}

export function trackContentDeleted(contentType, contentId) {
    return trackEvent(contentType, contentId, EVENT_TYPES.CONTENT_DELETED);
}

export function trackProfileUpdated() {
    return trackEvent(CONTENT_TYPES.PROFILE, 'about', EVENT_TYPES.PROFILE_UPDATED);
}

export function trackReactionRemoved(blogPostId) {
    return trackEvent(CONTENT_TYPES.BLOG_POST, blogPostId, EVENT_TYPES.REACTION_REMOVED);
}

export function trackFeatureToggled(contentType, contentId, starred) {
    return trackEvent(contentType, contentId, EVENT_TYPES.FEATURE_TOGGLED, { starred });
}

export function trackTagFilter(contentType, tag) {
    return trackEvent(contentType, tag || 'all', EVENT_TYPES.TAG_FILTER, { tag: tag || 'all' });
}

export function trackThemeChanged(theme) {
    return trackEvent(CONTENT_TYPES.PROFILE, 'theme', EVENT_TYPES.THEME_CHANGED, { theme });
}

export function trackLogin() {
    return trackEvent(CONTENT_TYPES.PROFILE, 'admin', EVENT_TYPES.LOGIN);
}

export function trackLoginFailed(errorMessage) {
    return trackEvent(CONTENT_TYPES.PROFILE, 'admin', EVENT_TYPES.LOGIN_FAILED, { error: errorMessage });
}

export function trackLogout() {
    return trackEvent(CONTENT_TYPES.PROFILE, 'admin', EVENT_TYPES.LOGOUT);
}
