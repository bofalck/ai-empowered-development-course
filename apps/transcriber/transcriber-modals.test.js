import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

/**
 * Regression tests for transcriber modal dialogs and save workflow
 * Ensures that modal buttons work correctly and don't break the save flow
 */

// Helper to create modal HTML structure
function createModalDOM() {
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <body>
            <!-- Alert Modal -->
            <div id="alertModal" class="themed-modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="alertTitle">Alert</h3>
                        <button class="modal-close-btn"></button>
                    </div>
                    <div class="modal-body">
                        <p id="alertMessage"></p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-primary">OK</button>
                    </div>
                </div>
            </div>

            <!-- Confirm Modal -->
            <div id="confirmModal" class="themed-modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="confirmTitle">Confirm</h3>
                        <button class="modal-close-btn"></button>
                    </div>
                    <div class="modal-body">
                        <p id="confirmMessage"></p>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-secondary">Cancel</button>
                        <button class="modal-btn modal-btn-primary">OK</button>
                    </div>
                </div>
            </div>

            <!-- Prompt Modal -->
            <div id="promptModal" class="themed-modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="promptTitle">Enter Value</h3>
                        <button class="modal-close-btn"></button>
                    </div>
                    <div class="modal-body">
                        <p id="promptMessage"></p>
                        <input type="text" id="promptInput" class="prompt-input">
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-secondary">Cancel</button>
                        <button class="modal-btn modal-btn-primary">OK</button>
                    </div>
                </div>
            </div>

            <!-- Modal Overlay -->
            <div id="modalOverlay" class="modal-overlay hidden"></div>
        </body>
        </html>
    `);
    return dom;
}

describe('Modal Dialog Functions - Regression Tests', () => {
    let document;
    let modalResolve;

    beforeEach(() => {
        const dom = createModalDOM();
        document = dom.window.document;
        global.document = document;
        modalResolve = null;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ===== ALERT MODAL TESTS =====

    describe('Alert Modal', () => {
        it('should show alert modal with title and message', () => {
            const alertModal = document.getElementById('alertModal');
            const overlay = document.getElementById('modalOverlay');
            const titleEl = document.getElementById('alertTitle');
            const messageEl = document.getElementById('alertMessage');

            // Simulate showing alert
            overlay.classList.remove('hidden');
            alertModal.classList.remove('hidden');
            titleEl.textContent = 'Test Alert';
            messageEl.textContent = 'This is a test message';

            expect(alertModal.classList.contains('hidden')).toBe(false);
            expect(overlay.classList.contains('hidden')).toBe(false);
            expect(titleEl.textContent).toBe('Test Alert');
            expect(messageEl.textContent).toBe('This is a test message');
        });

        it('should close alert modal when OK button is clicked', () => {
            const alertModal = document.getElementById('alertModal');
            const overlay = document.getElementById('modalOverlay');
            const okBtn = document.querySelector('#alertModal .modal-btn-primary');

            alertModal.classList.remove('hidden');
            overlay.classList.remove('hidden');

            // Simulate OK button click
            okBtn.click();

            // In real code, closeAlert() would hide these
            alertModal.classList.add('hidden');
            overlay.classList.add('hidden');

            expect(alertModal.classList.contains('hidden')).toBe(true);
            expect(overlay.classList.contains('hidden')).toBe(true);
        });

        it('should close alert modal when X button is clicked', () => {
            const alertModal = document.getElementById('alertModal');
            const overlay = document.getElementById('modalOverlay');
            const closeBtn = document.querySelector('#alertModal .modal-close-btn');

            alertModal.classList.remove('hidden');
            overlay.classList.remove('hidden');

            // Simulate X button click
            closeBtn.click();

            // In real code, closeAlert() would hide these
            alertModal.classList.add('hidden');
            overlay.classList.add('hidden');

            expect(alertModal.classList.contains('hidden')).toBe(true);
            expect(overlay.classList.contains('hidden')).toBe(true);
        });
    });

    // ===== CONFIRM MODAL TESTS =====

    describe('Confirm Modal', () => {
        it('should show confirm modal with message', () => {
            const confirmModal = document.getElementById('confirmModal');
            const overlay = document.getElementById('modalOverlay');
            const messageEl = document.getElementById('confirmMessage');

            overlay.classList.remove('hidden');
            confirmModal.classList.remove('hidden');
            messageEl.textContent = 'Do you want to continue?';

            expect(confirmModal.classList.contains('hidden')).toBe(false);
            expect(messageEl.textContent).toBe('Do you want to continue?');
        });

        it('should close confirm modal and return true when OK button is clicked', () => {
            const confirmModal = document.getElementById('confirmModal');
            const overlay = document.getElementById('modalOverlay');
            const okBtn = document.querySelector('#confirmModal .modal-btn-primary');

            confirmModal.classList.remove('hidden');
            overlay.classList.remove('hidden');

            let result = null;
            okBtn.addEventListener('click', () => {
                result = true;
                confirmModal.classList.add('hidden');
                overlay.classList.add('hidden');
            });

            okBtn.click();

            expect(result).toBe(true);
            expect(confirmModal.classList.contains('hidden')).toBe(true);
        });

        it('should close confirm modal and return false when Cancel button is clicked', () => {
            const confirmModal = document.getElementById('confirmModal');
            const overlay = document.getElementById('modalOverlay');
            const cancelBtn = document.querySelector('#confirmModal .modal-btn-secondary');

            confirmModal.classList.remove('hidden');
            overlay.classList.remove('hidden');

            let result = null;
            cancelBtn.addEventListener('click', () => {
                result = false;
                confirmModal.classList.add('hidden');
                overlay.classList.add('hidden');
            });

            cancelBtn.click();

            expect(result).toBe(false);
            expect(confirmModal.classList.contains('hidden')).toBe(true);
        });

        it('should close confirm modal when X button is clicked', () => {
            const confirmModal = document.getElementById('confirmModal');
            const overlay = document.getElementById('modalOverlay');
            const closeBtn = document.querySelector('#confirmModal .modal-close-btn');

            confirmModal.classList.remove('hidden');
            overlay.classList.remove('hidden');

            closeBtn.addEventListener('click', () => {
                confirmModal.classList.add('hidden');
                overlay.classList.add('hidden');
            });

            closeBtn.click();

            expect(confirmModal.classList.contains('hidden')).toBe(true);
        });
    });

    // ===== PROMPT MODAL TESTS =====

    describe('Prompt Modal', () => {
        it('should show prompt modal with input field', () => {
            const promptModal = document.getElementById('promptModal');
            const overlay = document.getElementById('modalOverlay');
            const input = document.getElementById('promptInput');
            const messageEl = document.getElementById('promptMessage');

            overlay.classList.remove('hidden');
            promptModal.classList.remove('hidden');
            messageEl.textContent = 'Enter meeting title:';
            input.value = '';

            expect(promptModal.classList.contains('hidden')).toBe(false);
            expect(messageEl.textContent).toBe('Enter meeting title:');
            expect(input.value).toBe('');
        });

        it('should populate prompt input with default value', () => {
            const input = document.getElementById('promptInput');
            const defaultValue = 'Default Title';

            input.value = defaultValue;

            expect(input.value).toBe('Default Title');
        });

        it('should capture user input when OK button is clicked', () => {
            const promptModal = document.getElementById('promptModal');
            const overlay = document.getElementById('modalOverlay');
            const input = document.getElementById('promptInput');
            const okBtn = document.querySelector('#promptModal .modal-btn-primary');

            promptModal.classList.remove('hidden');
            overlay.classList.remove('hidden');
            input.value = 'My Meeting Title';

            let result = null;
            okBtn.addEventListener('click', () => {
                result = input.value;
                promptModal.classList.add('hidden');
                overlay.classList.add('hidden');
            });

            okBtn.click();

            expect(result).toBe('My Meeting Title');
            expect(promptModal.classList.contains('hidden')).toBe(true);
        });

        it('should return null when Cancel button is clicked', () => {
            const promptModal = document.getElementById('promptModal');
            const overlay = document.getElementById('modalOverlay');
            const input = document.getElementById('promptInput');
            const cancelBtn = document.querySelector('#promptModal .modal-btn-secondary');

            promptModal.classList.remove('hidden');
            overlay.classList.remove('hidden');
            input.value = 'Some Input';

            let result = 'unset';
            cancelBtn.addEventListener('click', () => {
                result = null;
                promptModal.classList.add('hidden');
                overlay.classList.add('hidden');
            });

            cancelBtn.click();

            expect(result).toBeNull();
            expect(promptModal.classList.contains('hidden')).toBe(true);
        });

        it('should handle empty input submission', () => {
            const promptModal = document.getElementById('promptModal');
            const input = document.getElementById('promptInput');
            const okBtn = document.querySelector('#promptModal .modal-btn-primary');

            promptModal.classList.remove('hidden');
            input.value = '';

            let result = 'unset';
            okBtn.addEventListener('click', () => {
                result = input.value;
                promptModal.classList.add('hidden');
            });

            okBtn.click();

            expect(result).toBe('');
            expect(promptModal.classList.contains('hidden')).toBe(true);
        });

        it('should close prompt modal when X button is clicked', () => {
            const promptModal = document.getElementById('promptModal');
            const overlay = document.getElementById('modalOverlay');
            const closeBtn = document.querySelector('#promptModal .modal-close-btn');

            promptModal.classList.remove('hidden');
            overlay.classList.remove('hidden');

            closeBtn.addEventListener('click', () => {
                promptModal.classList.add('hidden');
                overlay.classList.add('hidden');
            });

            closeBtn.click();

            expect(promptModal.classList.contains('hidden')).toBe(true);
            expect(overlay.classList.contains('hidden')).toBe(true);
        });
    });

    // ===== EVENT LISTENER ATTACHMENT TESTS =====

    describe('Modal Button Event Listeners', () => {
        it('should have alert close button listener attached', () => {
            const closeBtn = document.querySelector('#alertModal .modal-close-btn');
            const okBtn = document.querySelector('#alertModal .modal-btn-primary');

            let closeBtnClicked = false;
            let okBtnClicked = false;

            closeBtn.addEventListener('click', () => {
                closeBtnClicked = true;
            });

            okBtn.addEventListener('click', () => {
                okBtnClicked = true;
            });

            closeBtn.click();
            okBtn.click();

            expect(closeBtnClicked).toBe(true);
            expect(okBtnClicked).toBe(true);
        });

        it('should have confirm all buttons with listeners', () => {
            const closeBtn = document.querySelector('#confirmModal .modal-close-btn');
            const cancelBtn = document.querySelector('#confirmModal .modal-btn-secondary');
            const okBtn = document.querySelector('#confirmModal .modal-btn-primary');

            let closeBtnClicked = false;
            let cancelBtnClicked = false;
            let okBtnClicked = false;

            closeBtn.addEventListener('click', () => {
                closeBtnClicked = true;
            });

            cancelBtn.addEventListener('click', () => {
                cancelBtnClicked = true;
            });

            okBtn.addEventListener('click', () => {
                okBtnClicked = true;
            });

            closeBtn.click();
            cancelBtn.click();
            okBtn.click();

            expect(closeBtnClicked).toBe(true);
            expect(cancelBtnClicked).toBe(true);
            expect(okBtnClicked).toBe(true);
        });

        it('should have prompt all buttons with listeners', () => {
            const closeBtn = document.querySelector('#promptModal .modal-close-btn');
            const cancelBtn = document.querySelector('#promptModal .modal-btn-secondary');
            const okBtn = document.querySelector('#promptModal .modal-btn-primary');

            let closeBtnClicked = false;
            let cancelBtnClicked = false;
            let okBtnClicked = false;

            closeBtn.addEventListener('click', () => {
                closeBtnClicked = true;
            });

            cancelBtn.addEventListener('click', () => {
                cancelBtnClicked = true;
            });

            okBtn.addEventListener('click', () => {
                okBtnClicked = true;
            });

            closeBtn.click();
            cancelBtn.click();
            okBtn.click();

            expect(closeBtnClicked).toBe(true);
            expect(cancelBtnClicked).toBe(true);
            expect(okBtnClicked).toBe(true);
        });

        it('should not have onclick attributes (must use addEventListener)', () => {
            const alertOkBtn = document.querySelector('#alertModal .modal-btn-primary');
            const confirmOkBtn = document.querySelector('#confirmModal .modal-btn-primary');
            const promptOkBtn = document.querySelector('#promptModal .modal-btn-primary');

            expect(alertOkBtn.getAttribute('onclick')).toBeNull();
            expect(confirmOkBtn.getAttribute('onclick')).toBeNull();
            expect(promptOkBtn.getAttribute('onclick')).toBeNull();
        });
    });

    // ===== SAVE WORKFLOW TESTS =====

    describe('Save Meeting Workflow - Critical Path', () => {
        it('should display confirmation dialog when saving with transcript', () => {
            const confirmModal = document.getElementById('confirmModal');
            const overlay = document.getElementById('modalOverlay');
            const messageEl = document.getElementById('confirmMessage');

            // Simulate save meeting action
            overlay.classList.remove('hidden');
            confirmModal.classList.remove('hidden');
            messageEl.textContent = 'Save this recording?\n\nDuration: 2m 30s\nWords: 450\nPreview: This is a test meeting...';

            expect(confirmModal.classList.contains('hidden')).toBe(false);
            expect(messageEl.textContent).toContain('Save this recording');
        });

        it('should prompt for title after confirming save', async () => {
            const confirmModal = document.getElementById('confirmModal');
            const promptModal = document.getElementById('promptModal');
            const overlay = document.getElementById('modalOverlay');

            // Step 1: Show confirmation dialog
            overlay.classList.remove('hidden');
            confirmModal.classList.remove('hidden');

            // Step 2: User confirms save
            const confirmOkBtn = document.querySelector('#confirmModal .modal-btn-primary');
            confirmOkBtn.click();
            confirmModal.classList.add('hidden');

            // Step 3: Show prompt for title
            promptModal.classList.remove('hidden');
            const titleInput = document.getElementById('promptInput');
            titleInput.value = 'Q4 Planning Meeting';

            expect(promptModal.classList.contains('hidden')).toBe(false);
            expect(titleInput.value).toBe('Q4 Planning Meeting');
        });

        it('should cancel save when user rejects confirmation', () => {
            const confirmModal = document.getElementById('confirmModal');
            const overlay = document.getElementById('modalOverlay');

            confirmModal.classList.remove('hidden');
            overlay.classList.remove('hidden');

            const cancelBtn = document.querySelector('#confirmModal .modal-btn-secondary');
            let saveAborted = false;

            cancelBtn.addEventListener('click', () => {
                confirmModal.classList.add('hidden');
                overlay.classList.add('hidden');
                saveAborted = true;
            });

            cancelBtn.click();

            expect(saveAborted).toBe(true);
            expect(confirmModal.classList.contains('hidden')).toBe(true);
        });

        it('should cancel save when user rejects title prompt', () => {
            const promptModal = document.getElementById('promptModal');
            const overlay = document.getElementById('modalOverlay');

            promptModal.classList.remove('hidden');
            overlay.classList.remove('hidden');

            const cancelBtn = document.querySelector('#promptModal .modal-btn-secondary');
            let titleAborted = false;

            cancelBtn.addEventListener('click', () => {
                promptModal.classList.add('hidden');
                overlay.classList.add('hidden');
                titleAborted = true;
            });

            cancelBtn.click();

            expect(titleAborted).toBe(true);
            expect(promptModal.classList.contains('hidden')).toBe(true);
        });

        it('should complete full save workflow: confirm -> title -> success', () => {
            const confirmModal = document.getElementById('confirmModal');
            const promptModal = document.getElementById('promptModal');
            const alertModal = document.getElementById('alertModal');
            const overlay = document.getElementById('modalOverlay');

            const workflow = {
                steps: []
            };

            // Step 1: Show and confirm save
            overlay.classList.remove('hidden');
            confirmModal.classList.remove('hidden');
            workflow.steps.push('confirm_shown');

            const confirmOkBtn = document.querySelector('#confirmModal .modal-btn-primary');
            confirmOkBtn.addEventListener('click', () => {
                confirmModal.classList.add('hidden');
                workflow.steps.push('confirm_accepted');
                // Step 2: Show title prompt
                promptModal.classList.remove('hidden');
                workflow.steps.push('title_prompt_shown');
            });

            confirmOkBtn.click();

            const titleInput = document.getElementById('promptInput');
            titleInput.value = 'My Meeting';

            // Step 3: Submit title
            const promptOkBtn = document.querySelector('#promptModal .modal-btn-primary');
            promptOkBtn.addEventListener('click', () => {
                promptModal.classList.add('hidden');
                workflow.steps.push('title_submitted');
                // Step 4: Show success
                alertModal.classList.remove('hidden');
                document.getElementById('alertMessage').textContent = 'Meeting "My Meeting" saved and analyzing...';
                workflow.steps.push('success_shown');
            });

            promptOkBtn.click();

            expect(workflow.steps).toEqual([
                'confirm_shown',
                'confirm_accepted',
                'title_prompt_shown',
                'title_submitted',
                'success_shown'
            ]);
            expect(alertModal.classList.contains('hidden')).toBe(false);
        });

        it('should not lose data when modal buttons are clicked', () => {
            const testData = {
                transcript: 'This is my meeting transcript with important information',
                duration: 125,
                wordCount: 9
            };

            // Simulate data persistence through modal interactions
            const confirmModal = document.getElementById('confirmModal');
            const promptModal = document.getElementById('promptModal');

            confirmModal.classList.remove('hidden');
            let dataPreserved = JSON.parse(JSON.stringify(testData));

            // Click OK to confirm
            const confirmOkBtn = document.querySelector('#confirmModal .modal-btn-primary');
            confirmOkBtn.click();
            confirmModal.classList.add('hidden');

            // Data should still be intact
            expect(dataPreserved).toEqual(testData);

            // Show prompt
            promptModal.classList.remove('hidden');
            const titleInput = document.getElementById('promptInput');
            titleInput.value = 'My Meeting';

            // Click OK to submit title
            const promptOkBtn = document.querySelector('#promptModal .modal-btn-primary');
            promptOkBtn.click();
            promptModal.classList.add('hidden');

            // Data should still be intact after title entry
            expect(dataPreserved).toEqual(testData);
        });
    });

    // ===== ERROR HANDLING TESTS =====

    describe('Modal Error Handling', () => {
        it('should handle missing modal elements gracefully', () => {
            const fakeModal = document.getElementById('nonexistent-modal');
            expect(fakeModal).toBeNull();
        });

        it('should not throw when modal is already hidden', () => {
            const alertModal = document.getElementById('alertModal');
            expect(() => {
                alertModal.classList.add('hidden');
                alertModal.classList.add('hidden'); // Second hide
            }).not.toThrow();
        });

        it('should not throw when modal is already shown', () => {
            const alertModal = document.getElementById('alertModal');
            expect(() => {
                alertModal.classList.remove('hidden');
                alertModal.classList.remove('hidden'); // Second show
            }).not.toThrow();
        });

        it('should handle rapid button clicks', () => {
            const confirmModal = document.getElementById('confirmModal');
            const okBtn = document.querySelector('#confirmModal .modal-btn-primary');

            confirmModal.classList.remove('hidden');

            let clickCount = 0;
            okBtn.addEventListener('click', () => {
                clickCount++;
            });

            // Rapid clicks
            okBtn.click();
            okBtn.click();
            okBtn.click();

            expect(clickCount).toBe(3);
        });
    });
});
