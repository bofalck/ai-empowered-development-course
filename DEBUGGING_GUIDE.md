# Portfolio Projects Loading - Complete Debugging Guide

## Quick Status Check

### What Should Happen
1. User logs into portfolio
2. Portfolio page loads and calls `loadProjects()`
3. Supabase client fetches all projects from the `projects` table
4. Projects display in a formatted table on the portfolio page

### What's Currently Happening
If projects aren't showing, one of these is happening:
- Loading indicator briefly appears then disappears
- Error message displays (check error message content)
- Empty state shows "No projects yet..."

## Diagnostic Steps

### Step 1: Open Browser Console
1. Navigate to portfolio: `http://localhost:5173/portfolio.html`
2. Open DevTools: `F12` on Windows/Linux, `Cmd+Option+I` on Mac
3. Click "Console" tab
4. Refresh the page (`F5` or `Cmd+R`)
5. Look for these log messages:

```
Starting to load projects from Supabase...
Supabase client: (object)
Projects query result - Data: ... Error: ...
Successfully loaded N projects
```

Or if there's an error:
```
Supabase error details: {
    message: "...",
    code: "...",
    status: ...,
    details: "...",
    hint: "..."
}
Failed to load projects: Error: ...
```

### Step 2: Run Connection Diagnostic
1. Navigate to: `http://localhost:5173/test-connection.html`
2. Click "Run All Tests"
3. Watch the results update in real-time
4. Check each test:
   - **[PASS] Supabase Client Import** - Module loads correctly
   - **[PASS] Supabase Connection** - Can connect to database
   - **[PASS/FAIL] Fetch Projects** - Shows number of projects or error

### Step 3: Check Network Tab
1. In DevTools, click "Network" tab
2. Look for requests to `xqpqcuvvjgnjtqmhrtku.supabase.co`
3. Click on the failed request (if any)
4. Check:
   - Response Status (should be 200)
   - Response body for error details
   - Headers for CORS issues

## Common Issues and Solutions

### Issue 1: "PGRST116 - The result contains 0 rows" Error

**Cause**: Supabase Row Level Security (RLS) policy is denying access

**Solution**:
```bash
# Via Supabase Dashboard:
1. Go to Database > Tables > projects
2. Click "RLS" (Row Level Security)
3. Either:
   a) Disable RLS if table should be public
   b) Add a policy: "Allow public read"
      - For SELECT
      - With policy: true
```

**Or via SQL**:
```sql
-- Disable RLS on projects table (allows public read)
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Or add a permissive policy
CREATE POLICY "Allow public read access"
    ON projects
    FOR SELECT
    USING (true);
```

### Issue 2: "42P01 - Relation does not exist" Error

**Cause**: The `projects` table doesn't exist in Supabase

**Solution**:
1. Create the table in Supabase with columns:
   - `id` (UUID primary key)
   - `title` (text)
   - `description` (text)
   - `link` (text, nullable)
   - `tags` (text, nullable)
   - `created_at` (timestamp with time zone)

**SQL**:
```sql
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    link TEXT,
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS to allow public read
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
```

### Issue 3: "No projects yet..." (But Projects Exist in CMS)

**Cause**: Projects exist but aren't being fetched (likely RLS issue)

**Solution**: Same as Issue 1 - Fix RLS policies

### Issue 4: CORS Error or Connection Refused

**Cause**: 
- Network connectivity issue
- Supabase instance is down
- CDN import of supabase-js failed

**Solution**:
1. Check internet connection
2. Verify Supabase status: https://status.supabase.com
3. Check console for full error message
4. Try the test connection page to isolate issue

### Issue 5: Module Not Found Error

**Cause**: supabase-client.js import failing

**Solution**:
1. Verify file exists: `/Users/bofa/bobbys-portfolio/supabase-client.js`
2. Check import path in portfolio.js
3. Verify supabase-client.js exports: `export const supabase = ...`

## File Structure and Dependencies

```
portfolio.html
├── Imports: auth.js, portfolio.js
├── portfolio.js
│   ├── Imports: auth.js, supabase-client.js
│   ├── loadProjects() - Fetches and displays projects
│   └── Other portfolio functions
├── auth.js
│   ├── Local authentication system
│   └── Imports: supabase-client.js (but mainly for UI, not data access)
├── supabase-client.js
│   ├── Creates Supabase client instance
│   ├── Uses CDN: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm
│   ├── URL: https://xqpqcuvvjgnjtqmhrtku.supabase.co
│   └── Public Key: sb_publishable_XsrMMvQjHZcj6Cql1xA5Fw_nF9nfubb
└── styles.css
    ├── .projects-table - Main table styles
    ├── .loading-state - Loading indicator styles
    └── Other styles

cms.html
├── cms.js
│   ├── setupProjects() - CMS project management
│   ├── loadProjects() - Display projects in CMS
│   ├── saveProject() - Insert projects to Supabase
│   └── deleteProject() - Remove projects from Supabase
```

## Data Flow

### Writing Projects (CMS)
```
CMS Form Submit
    ↓
saveProject() in cms.js
    ↓
supabase.from('projects').insert([{...}])
    ↓
Supabase Database
```

### Reading Projects (Portfolio)
```
Portfolio Page Load
    ↓
loadProjects() in portfolio.js
    ↓
supabase.from('projects').select('*')
    ↓
Supabase Database (must have read permission!)
    ↓
Display projects table
```

## Key Error Codes Reference

| Code | Meaning | Common Cause |
|------|---------|-------------|
| PGRST116 | Result contains 0 rows | RLS policy denying access |
| 42P01 | Relation does not exist | Table not created in database |
| 401 | Unauthorized | Authentication failed |
| 403 | Forbidden | Permission denied (likely RLS) |
| CORS error | Cross-origin request blocked | Server not allowing requests |
| Module not found | Import path incorrect | Check file exists and path |

## Testing Checklist

- [ ] Test connection page shows all tests PASS
- [ ] Browser console shows: "Successfully loaded X projects"
- [ ] Projects table displays with correct data
- [ ] Project links work (open in new tab)
- [ ] Project tags display correctly
- [ ] Error message displays if projects unavailable
- [ ] Loading state briefly shows during fetch
- [ ] Works in portfolio.html (not cms.html)
- [ ] Works in different browser/incognito mode
- [ ] No CORS errors in Network tab

## Performance Notes

- Projects are fetched on page load
- No caching is currently implemented
- Each page load fetches fresh data from Supabase
- Consider adding caching if performance becomes an issue

## Security Notes

- Public key is used (safe for browser)
- No authentication required for reading projects
- RLS policies control data access
- Write operations require different permissions
- Never expose service role key to browser

## Related Issues/Tasks

- Portfolio projects not displaying on page load
- Need to verify Supabase table structure
- Need to check RLS policies
- Need to test with sample data

## Next Steps if Issues Persist

1. Check Supabase dashboard:
   - Verify projects table exists
   - Check RLS status
   - Verify sample projects exist in table
   - Check API logs for requests

2. Check application logs:
   - Run test connection page
   - Check browser console for all error messages
   - Note exact error codes and messages

3. Contact Supabase support if:
   - Can't access dashboard
   - Database appears corrupted
   - Persistent connection issues

## Useful Links

- Supabase Dashboard: https://app.supabase.com
- Supabase JS Client Docs: https://supabase.com/docs/reference/javascript
- RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
- Project Repository: /Users/bofa/bobbys-portfolio
