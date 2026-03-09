import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { copyFileSync } from 'fs';

// Keeps static/styles.css in sync with styles.css (needed by the transcriber iframe)
const syncStyles = {
    name: 'sync-styles',
    buildStart() {
        copyFileSync('styles.css', 'static/styles.css');
    },
    configureServer(server) {
        server.watcher.add('styles.css');
        server.watcher.on('change', (path) => {
            if (path.endsWith('styles.css') && !path.includes('static')) {
                copyFileSync('styles.css', 'static/styles.css');
            }
        });
    }
};

export default defineConfig({
    plugins: [sveltekit(), syncStyles]
});
