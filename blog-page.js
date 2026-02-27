// Blog page module
import { initializePage } from './collection-page.js';

// Initialize blog page on load
async function init() {
    try {
        await initializePage('blog');
    } catch (error) {
        console.error('Failed to initialize blog page:', error);
        const grid = document.getElementById('blogGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>Error loading blog: ${error.message}</p>
                </div>
            `;
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
