// Constants and types for the application

export const EVENT_TYPES = {
    DETAIL_VIEW: 'detail_view',
    REACTION: 'reaction',
    SHARE: 'share',
    APP_LAUNCH: 'app_launch',
};

export const CONTENT_TYPES = {
    BLOG_POST: 'blog_post',
    PROJECT: 'project',
    APP: 'app',
};

// Deterministic UUIDs for apps (stable identifiers since apps have no DB rows)
export const APP_IDS = {
    TRANSCRIBER: '00000000-0000-0000-0000-000000000001',
    MAGICAL_UNICORNS: '00000000-0000-0000-0000-000000000002',
};

export const APP_NAMES = {
    [APP_IDS.TRANSCRIBER]: 'Transcriber',
    [APP_IDS.MAGICAL_UNICORNS]: 'Magical Unicorns',
};

export const USER_TYPES = {
    AUTHENTICATED: 'authenticated',
    GUEST: 'guest',
};

export const SHARE_PLATFORMS = {
    NATIVE: 'native',
    BLUESKY: 'bluesky',
    LINKEDIN: 'linkedin',
};
