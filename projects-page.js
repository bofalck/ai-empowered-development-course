// Projects page module
import { initializePage } from './collection-page.js';

// Initialize projects page on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializePage('projects');
    });
} else {
    initializePage('projects');
}
