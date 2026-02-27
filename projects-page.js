// Projects page module
import { initializePage } from './collection-page.js';

// Initialize projects page on load
async function init() {
    try {
        await initializePage('projects');
    } catch (error) {
        console.error('Failed to initialize projects page:', error);
        const grid = document.getElementById('projectsGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>Error loading projects: ${error.message}</p>
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
