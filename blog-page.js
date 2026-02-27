// Blog page module
import { initializePage } from './collection-page.js';

// Initialize blog page on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializePage('blog');
    });
} else {
    initializePage('blog');
}
