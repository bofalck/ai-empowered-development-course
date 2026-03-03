import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main:        resolve(__dirname, 'index.html'),
        portfolio:   resolve(__dirname, 'portfolio.html'),
        blog:        resolve(__dirname, 'blog.html'),
        post:        resolve(__dirname, 'post.html'),
        projects:    resolve(__dirname, 'projects.html'),
        project:     resolve(__dirname, 'project.html'),
        cms:         resolve(__dirname, 'cms.html'),
        login:       resolve(__dirname, 'login.html'),
        admin:       resolve(__dirname, 'admin/index.html'),
        transcriber: resolve(__dirname, 'apps/transcriber/index.html'),
      }
    }
  }
})
