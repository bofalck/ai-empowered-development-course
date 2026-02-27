// Shared utilities for collection pages (projects and blog)

/**
 * Extract unique tags from an array of items with comma-separated tag strings
 * @param {Array} items - Array of items with tags property
 * @returns {Array} - Sorted array of unique tag strings
 */
export function extractUniqueTags(items) {
    const tagSet = new Set();
    items.forEach(item => {
        if (item.tags) {
            item.tags.split(',').forEach(tag => {
                tagSet.add(tag.trim());
            });
        }
    });
    return Array.from(tagSet).sort();
}

/**
 * Filter items by a selected tag
 * @param {Array} items - Array of items to filter
 * @param {String} tag - Tag to filter by (empty string = all items)
 * @returns {Array} - Filtered items
 */
export function filterItemsByTag(items, tag) {
    if (!tag) return items;
    return items.filter(item => {
        if (!item.tags) return false;
        return item.tags.split(',').map(t => t.trim()).includes(tag);
    });
}

/**
 * Sort items chronologically by created_at (newest first)
 * @param {Array} items - Array of items to sort
 * @returns {Array} - Sorted items
 */
export function sortChronological(items) {
    return [...items].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA;
    });
}

/**
 * Get emoji for a project based on its content
 * @param {Object} project - Project object
 * @returns {String} - Emoji character
 */
export function getProjectEmoji(project) {
    const text = (project.title + ' ' + (project.tags || '') + ' ' + (project.description || '')).toLowerCase();

    const emojiMap = {
        'scania': '🚛',
        'truck': '🚛',
        'music': '🎵',
        'audio': '🎧',
        'sound': '🎧',
        'video': '🎬',
        'film': '🎬',
        'web': '🌐',
        'app': '📱',
        'design': '🎨',
        'ai': '🤖',
        'machine': '🤖',
        'data': '📊',
        'analytics': '📊',
        'tools': '🛠️',
        'portfolio': '📂',
    };

    for (const [keyword, emoji] of Object.entries(emojiMap)) {
        if (text.includes(keyword)) {
            return emoji;
        }
    }

    return '✨';
}

/**
 * Format date to readable string
 * @param {String} dateString - ISO date string
 * @returns {String} - Formatted date (e.g., "Mar 15, 2024")
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Extract plain text from HTML
 * @param {String} html - HTML string
 * @returns {String} - Plain text content
 */
export function extractPlainText(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}
