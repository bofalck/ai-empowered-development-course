import { describe, it, expect } from 'vitest';

// Test escapeHtml function
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
        expect(escapeHtml('<script>alert("xss")</script>'))
            .toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    it('should handle plain text', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it('should escape ampersands', () => {
        expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });
});

// Test tag parsing
describe('Tag functions', () => {
    it('should toggle tag in array', () => {
        const tags = ['Planning', 'Action Items'];
        const tag = 'Planning';
        const index = tags.indexOf(tag);

        if (index > -1) {
            tags.splice(index, 1);
        } else {
            tags.push(tag);
        }

        expect(tags).toEqual(['Action Items']);
    });

    it('should add new tag to array', () => {
        const tags = [];
        const newTag = 'Decision';

        if (!tags.includes(newTag)) {
            tags.push(newTag);
        }

        expect(tags).toEqual(['Decision']);
    });

    it('should not add duplicate tags', () => {
        const tags = ['Planning'];
        const newTag = 'Planning';

        if (!tags.includes(newTag)) {
            tags.push(newTag);
        }

        expect(tags).toEqual(['Planning']);
    });
});

// Test duration calculation
describe('Duration calculations', () => {
    it('should format duration correctly', () => {
        const duration = 125; // 2 min 5 sec
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;

        expect(mins).toBe(2);
        expect(secs).toBe(5);
        expect(`${mins}m ${secs}s`).toBe('2m 5s');
    });

    it('should handle seconds only', () => {
        const duration = 45;
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;

        expect(mins).toBe(0);
        expect(secs).toBe(45);
    });

    it('should handle minutes only', () => {
        const duration = 300;
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;

        expect(mins).toBe(5);
        expect(secs).toBe(0);
    });
});

// Test JSON parsing from API response
describe('JSON parsing', () => {
    it('should extract JSON from mixed text', () => {
        const text = 'Here is the analysis: {"summary": "test", "action_items": [], "sentiment": "Positive"}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        expect(jsonMatch).not.toBeNull();
        expect(jsonMatch[0]).toBe('{"summary": "test", "action_items": [], "sentiment": "Positive"}');
    });

    it('should return null if no JSON found', () => {
        const text = 'No JSON here at all';
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        expect(jsonMatch).toBeNull();
    });

    it('should parse valid JSON', () => {
        const jsonStr = '{"summary": "Meeting summary", "action_items": ["Task 1"], "sentiment": "Neutral"}';
        const parsed = JSON.parse(jsonStr);

        expect(parsed.summary).toBe('Meeting summary');
        expect(parsed.action_items).toEqual(['Task 1']);
        expect(parsed.sentiment).toBe('Neutral');
    });
});

// Test empty state removal
describe('Empty state management', () => {
    it('should remove empty placeholder when analysis body is created', () => {
        // Create a mock column with empty placeholder
        const column = document.createElement('div');
        column.className = 'kanban-column';

        const header = document.createElement('h2');
        header.className = 'column-header';
        header.textContent = 'Key Insights';
        column.appendChild(header);

        const emptyPlaceholder = document.createElement('div');
        emptyPlaceholder.className = 'empty-placeholder';
        emptyPlaceholder.textContent = 'Select a meeting to view AI analysis';
        column.appendChild(emptyPlaceholder);

        // Mock the DOM query to return our test column
        document.body.appendChild(column);

        // Simulate getAnalysisBody logic
        const existingBody = column.querySelector('.analysis-body');
        if (!existingBody) {
            const placeholder = column.querySelector('.empty-placeholder');
            if (placeholder) {
                placeholder.remove();
            }
            const body = document.createElement('div');
            body.className = 'analysis-body';
            column.appendChild(body);
        }

        // Verify empty placeholder is gone
        expect(column.querySelector('.empty-placeholder')).toBeNull();

        // Verify analysis body exists
        expect(column.querySelector('.analysis-body')).not.toBeNull();

        // Cleanup
        document.body.removeChild(column);
    });

    it('should not create duplicate analysis bodies', () => {
        const column = document.createElement('div');
        column.className = 'kanban-column';

        const emptyPlaceholder = document.createElement('div');
        emptyPlaceholder.className = 'empty-placeholder';
        column.appendChild(emptyPlaceholder);

        // First call to getAnalysisBody logic
        let body = column.querySelector('.analysis-body');
        if (!body) {
            const placeholder = column.querySelector('.empty-placeholder');
            if (placeholder) {
                placeholder.remove();
            }
            body = document.createElement('div');
            body.className = 'analysis-body';
            column.appendChild(body);
        }

        const firstBodyCount = column.querySelectorAll('.analysis-body').length;

        // Second call to getAnalysisBody logic (should reuse existing)
        body = column.querySelector('.analysis-body');
        if (!body) {
            const placeholder = column.querySelector('.empty-placeholder');
            if (placeholder) {
                placeholder.remove();
            }
            body = document.createElement('div');
            body.className = 'analysis-body';
            column.appendChild(body);
        }

        const secondBodyCount = column.querySelectorAll('.analysis-body').length;

        expect(firstBodyCount).toBe(1);
        expect(secondBodyCount).toBe(1);
    });
});
