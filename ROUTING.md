# Routing Protocol - After The Noise Portfolio

## Page Routing

### Public Pages (No Login Required)
- `/` or `/index.html` → Portfolio homepage
- `/portfolio.html` → Portfolio (redirects from home when logged in)
- `/projects.html` → Projects collection page
- `/blog.html` → Blog collection page
- `/admin/` or `/admin/index.html` → Admin login page

### Admin Pages (Login Required)
- `/cms.html` → CMS dashboard (admin only)

## Collection Page Routing

### Projects Collection: `/projects.html`

**Collection View (No Query Param)**
- URL: `/projects.html`
- Shows: Grid of all projects with filter bar
- Filter: Filter by project tags
- Sort: Newest first
- Each project card has "View Project →" button (if project has external link) or just displays project info

**Detail View (With Query Param)**
- URL: `/projects.html?id={projectId}`
- Shows: Full project detail page
- Displays: Project emoji, title, description, tags, and external link
- Navigation: "← Back to Projects" link returns to `/projects.html` (collection)
- No filter bar shown

### Blog Collection: `/blog.html`

**Collection View (No Query Param)**
- URL: `/blog.html`
- Shows: Grid of all blog posts with filter bar
- Filter: Filter by blog post tags
- Sort: Newest first
- Each post card has "Read More →" button (if post has slug) or just displays info

**Detail View (With Query Param)**
- URL: `/blog.html?id={postId}`
- Shows: Full blog post detail page
- Displays: Date, title, excerpt, tags, and full content
- Navigation: "← Back to Blog" link returns to `/blog.html` (collection)
- No filter bar shown

## Widget Navigation

### Portfolio Widget Links

**Projects Widget:**
- Click project preview item → `/projects.html?id={projectId}` (detail view)
- Click "View all X projects" button → `/projects.html` (collection)

**Blog Widget:**
- Click blog preview item → `/blog.html?id={postId}` (detail view)
- Click "View all X posts" button → `/blog.html` (collection)

## Navigation Flow

```
Portfolio Home (/)
├── Projects Widget
│   ├── [Click project] → /projects.html?id=123 (Detail)
│   │   └── [← Back to Projects] → /projects.html (Collection)
│   └── [View all] → /projects.html (Collection)
│       ├── [Filter by tag]
│       └── [Click project card] → /projects.html?id=123 (Detail)
│
├── Blog Widget
│   ├── [Click post] → /blog.html?id=456 (Detail)
│   │   └── [← Back to Blog] → /blog.html (Collection)
│   └── [View all] → /blog.html (Collection)
│       ├── [Filter by tag]
│       └── [Click post card] → /blog.html?id=456 (Detail)
│
└── Header Navigation
    ├── Home → /
    ├── Projects → /projects.html (Collection)
    └── Blog → /blog.html (Collection)
```

## Query Parameters

- `?id={uuid}` - Shows detail view for specific item (projects or blog)
- No other query parameters currently used

## Implementation Details

### URL Generation
- Projects: `href="/projects.html?id=${project.id}"`
- Blog posts: `href="/blog.html?id=${post.id}"`

### Detection Logic
- Collection page checks `window.location.search` for `?id=` parameter
- If found: render detail view
- If not found: render collection grid with filter bar

### Error Handling
- If ID not found: show empty state
- If Supabase error: show error message with details
- If no items in database: show "No X found" message
