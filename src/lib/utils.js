// Shared utility functions

// Get or create guest ID for unauthenticated users
export function getGuestId() {
    let guestId = localStorage.getItem('blog_guest_id');
    if (!guestId) {
        guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('blog_guest_id', guestId);
    }
    return guestId;
}

// Extract plain text from HTML (safe for server-side rendering)
export function extractPlainText(html) {
    if (!html) return '';
    if (typeof document === 'undefined') {
        // Server-side: strip tags with regex
        return html.replace(/<[^>]+>/g, '').trim();
    }
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

// Format date to readable string
export function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Get emoji for project based on title/tags/description
export function getProjectEmoji(project) {
    const text = (project.title + ' ' + project.tags + ' ' + project.description).toLowerCase();

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
