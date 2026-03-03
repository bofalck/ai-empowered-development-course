/**
 * Utility functions for the application
 */

// Escape HTML special characters to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Format time duration in seconds to HH:MM:SS
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return [
        String(hours).padStart(2, '0'),
        String(minutes).padStart(2, '0'),
        String(secs).padStart(2, '0')
    ].join(':');
}

// Format date to readable string
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Create recording unicorn image
function createRecordingUnicornSvg() {
    return `<img src="/images/unicorn-recording.png" alt="Singing unicorn with microphone" style="max-width: 180px; max-height: 200px; display: block; margin: 0 auto;">`;
}

// Create scholarly unicorn image
function createScholarlyUnicornSvg() {
    return `<img src="/images/unicorn-analysis.png" alt="Scholarly unicorn with glasses and books" style="max-width: 180px; max-height: 200px; display: block; margin: 0 auto;">`;
}

// Normalize action items to object format with text, assigned_to, and completed fields
function normalizeActionItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map(item => {
        // Handle both old format (strings) and new format (objects)
        if (typeof item === 'string') {
            return { text: item, assigned_to: null, completed: false };
        }
        return {
            text: item.text || '',
            assigned_to: item.assigned_to || null,
            completed: item.completed || false
        };
    });
}

export {
    escapeHtml,
    formatDuration,
    formatDate,
    createRecordingUnicornSvg,
    createScholarlyUnicornSvg,
    normalizeActionItems
};
