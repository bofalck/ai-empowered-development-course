/**
 * PHASE 3: UX POLISH ENHANCEMENTS
 *
 * This module adds 12 minor polish enhancements to improve user experience:
 * 1. Disabled button clarity with cursor: not-allowed
 * 2. Loading progress indicator with elapsed time
 * 3. First-time onboarding tooltip
 * 4. Error message visibility with icons
 * 5. Async operation feedback (loading/success/error states)
 * 6. Text selection styling (CSS only, see styles.css)
 * 7. Hover state consistency (CSS only, see styles.css)
 * 8. Subtle animations for state changes (CSS only, see styles.css)
 * 9. Keyboard shortcut hints
 * 10. Focus-visible documentation (CSS comments, see styles.css)
 * 11. Empty state styling improvements (CSS only, see styles.css)
 * 12. Button state testing matrix documentation (CSS comments, see styles.css)
 */

// ========================================
// 1. DISABLED BUTTON CLARITY
// Enhanced visual distinction for disabled buttons
// ========================================

/**
 * Apply disabled state styling to buttons
 * - cursor: not-allowed (handled in CSS)
 * - dashed border for visual distinction
 * - reduced opacity for clarity
 */
function applyDisabledButtonStyling() {
    const disabledButtons = document.querySelectorAll('button:disabled');
    disabledButtons.forEach(button => {
        button.setAttribute('aria-disabled', 'true');
        // Prevent any click interaction
        button.addEventListener('click', (e) => {
            if (button.disabled) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    });
}

/**
 * Enable/disable buttons with proper styling
 */
function setButtonDisabledState(buttonElement, isDisabled) {
    if (isDisabled) {
        buttonElement.disabled = true;
        buttonElement.setAttribute('aria-disabled', 'true');
    } else {
        buttonElement.disabled = false;
        buttonElement.removeAttribute('aria-disabled');
    }
}

// ========================================
// 2. LOADING PROGRESS INDICATOR
// Show elapsed time and progress during transcription
// ========================================

class ProgressIndicator {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.startTime = null;
        this.updateInterval = null;
        this.totalDuration = null;
    }

    /**
     * Create and display progress indicator
     * @param {number} estimatedDuration - Estimated duration in milliseconds
     */
    show(estimatedDuration = null) {
        this.totalDuration = estimatedDuration;
        this.startTime = Date.now();

        const progressHTML = `
            <div class="operation-progress" id="progressIndicator">
                <div class="operation-progress-bar">
                    <div class="operation-progress-fill" style="width: 0%"></div>
                </div>
                <div class="operation-progress-info">
                    <span class="operation-progress-time">0s</span>
                    <span class="operation-progress-percentage">0%</span>
                </div>
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', progressHTML);
        this.startUpdating();
    }

    startUpdating() {
        this.updateInterval = setInterval(() => {
            this.update();
        }, 100); // Update every 100ms as specified
    }

    update() {
        const progressElement = document.getElementById('progressIndicator');
        if (!progressElement) {
            this.stop();
            return;
        }

        const elapsed = Date.now() - this.startTime;
        const elapsedSeconds = Math.floor(elapsed / 1000);
        const progressFill = progressElement.querySelector('.operation-progress-fill');
        const timeDisplay = progressElement.querySelector('.operation-progress-time');
        const percentDisplay = progressElement.querySelector('.operation-progress-percentage');

        // Update time display
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        timeDisplay.textContent = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

        // Calculate and update progress percentage
        let percentage = 0;
        if (this.totalDuration) {
            percentage = Math.min(100, Math.round((elapsed / this.totalDuration) * 100));
        } else {
            // Without duration estimate, show indeterminate progress (pulse between 30-90%)
            percentage = 30 + ((elapsed / 1000) % 3) * 20;
        }

        progressFill.style.width = percentage + '%';
        percentDisplay.textContent = Math.round(percentage) + '%';
    }

    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    hide() {
        this.stop();
        const progressElement = document.getElementById('progressIndicator');
        if (progressElement) {
            progressElement.remove();
        }
    }

    clear() {
        this.hide();
        this.startTime = null;
        this.totalDuration = null;
    }
}

// ========================================
// 3. FIRST-TIME ONBOARDING TOOLTIP
// Show guided introduction for new users
// ========================================

class OnboardingTooltip {
    constructor() {
        this.hasShownTooltip = localStorage.getItem('onboarding-shown') === 'true';
        this.clickCount = 0;
        this.showTimeout = null;
        this.dismissTimeout = null;
    }

    /**
     * Show onboarding tooltip on initial app load
     */
    showIfNeeded() {
        if (this.hasShownTooltip) return;

        // Delay tooltip to avoid overwhelming user on load
        this.showTimeout = setTimeout(() => {
            this.show();
        }, 1500);
    }

    /**
     * Display tooltip pointing to Record button
     */
    show() {
        const recordButton = document.getElementById('micButton');
        if (!recordButton) return;

        // Remove existing tooltip if any
        this.remove();

        const tooltip = document.createElement('div');
        tooltip.className = 'onboarding-tooltip';
        tooltip.id = 'onboardingTooltip';
        tooltip.textContent = '👆 Click to start recording';
        tooltip.style.position = 'absolute';

        // Position tooltip above the Record button
        document.body.appendChild(tooltip);
        const buttonRect = recordButton.getBoundingClientRect();
        tooltip.style.left = (buttonRect.left + buttonRect.width / 2 - tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = (buttonRect.top - tooltip.offsetHeight - 12) + 'px';

        // Add interaction tracking
        recordButton.addEventListener('click', () => this.handleClick());

        // Auto-dismiss after 30 seconds
        this.dismissTimeout = setTimeout(() => {
            this.dismiss();
        }, 30000);
    }

    /**
     * Track clicks to auto-dismiss after 3 clicks
     */
    handleClick() {
        this.clickCount++;
        if (this.clickCount >= 3) {
            this.dismiss();
        }
    }

    /**
     * Dismiss tooltip with fade-out animation
     */
    dismiss() {
        const tooltip = document.getElementById('onboardingTooltip');
        if (!tooltip) return;

        tooltip.classList.add('fade-out');

        // Remove after animation completes
        setTimeout(() => {
            this.remove();
            this.markAsShown();
        }, 300);
    }

    /**
     * Remove tooltip from DOM
     */
    remove() {
        const tooltip = document.getElementById('onboardingTooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * Persist tooltip state in localStorage
     */
    markAsShown() {
        localStorage.setItem('onboarding-shown', 'true');
        this.hasShownTooltip = true;
    }

    /**
     * Reset onboarding state (for testing)
     */
    reset() {
        localStorage.removeItem('onboarding-shown');
        this.hasShownTooltip = false;
        this.clickCount = 0;
        if (this.showTimeout) clearTimeout(this.showTimeout);
        if (this.dismissTimeout) clearTimeout(this.dismissTimeout);
        this.remove();
    }
}

// ========================================
// 4. ERROR MESSAGE VISIBILITY
// Toast notifications with icons and theme support
// ========================================

class Toast {
    static show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `${type}-toast`;
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');

        document.body.appendChild(toast);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    static error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    static success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    static info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }
}

// ========================================
// 5. ASYNC OPERATION FEEDBACK
// Visual feedback for loading states
// ========================================

class AsyncButton {
    constructor(buttonElement) {
        this.button = buttonElement;
        this.originalText = buttonElement.textContent;
        this.originalClass = buttonElement.className;
    }

    setLoading() {
        this.button.classList.add('async-button', 'loading');
        this.button.disabled = true;
        this.button.setAttribute('aria-busy', 'true');
        this.button.textContent = '⏳ Processing...';
    }

    setSuccess(message = '✓ Done') {
        this.button.classList.remove('loading');
        this.button.classList.add('success');
        this.button.textContent = message;

        setTimeout(() => {
            this.reset();
        }, 2000);
    }

    setError(message = '✕ Error') {
        this.button.classList.remove('loading');
        this.button.classList.add('error');
        this.button.textContent = message;

        setTimeout(() => {
            this.reset();
        }, 2500);
    }

    reset() {
        this.button.classList.remove('async-button', 'loading', 'success', 'error');
        this.button.disabled = false;
        this.button.removeAttribute('aria-busy');
        this.button.textContent = this.originalText;
    }

    /**
     * Execute async operation with feedback
     */
    async execute(asyncFn, successMessage = '✓ Done', errorMessage = '✕ Error') {
        try {
            this.setLoading();
            const result = await asyncFn();
            this.setSuccess(successMessage);
            return result;
        } catch (error) {
            this.setError(errorMessage);
            throw error;
        }
    }
}

// ========================================
// 9. KEYBOARD SHORTCUT HINTS & SUPPORT
// Display shortcuts and implement keyboard handlers
// ========================================

class KeyboardShortcuts {
    constructor() {
        this.shortcuts = {
            'Space': { action: 'toggleRecord', description: 'Start/stop recording' },
            'Escape': { action: 'closeModals', description: 'Close open modals' },
            'Ctrl+S': { action: 'save', description: 'Save meeting' },
            'Cmd+S': { action: 'save', description: 'Save meeting (Mac)' }
        };
    }

    /**
     * Initialize keyboard event listeners
     */
    init() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyDown(e) {
        const key = e.key;
        const ctrl = e.ctrlKey || e.metaKey;

        // Space to toggle record/pause
        if (key === ' ' && e.target === document.body) {
            e.preventDefault();
            this.executeAction('toggleRecord');
        }

        // Escape to close modals
        if (key === 'Escape') {
            this.executeAction('closeModals');
        }

        // Ctrl/Cmd+S to save
        if ((key === 's' || key === 'S') && ctrl) {
            e.preventDefault();
            this.executeAction('save');
        }
    }

    /**
     * Execute keyboard shortcut action
     */
    executeAction(action) {
        switch (action) {
            case 'toggleRecord':
                const recordBtn = document.getElementById('micButton');
                if (recordBtn && !recordBtn.disabled) {
                    recordBtn.click();
                }
                break;
            case 'closeModals':
                document.querySelectorAll('.modal:not(.hidden), .themed-modal:not(.hidden)').forEach(modal => {
                    modal.classList.add('hidden');
                });
                document.getElementById('modalOverlay')?.classList.add('hidden');
                break;
            case 'save':
                const saveBtn = document.getElementById('saveMeetingBtn');
                if (saveBtn && !saveBtn.disabled) {
                    saveBtn.click();
                }
                break;
        }
    }

    /**
     * Display keyboard shortcuts legend
     */
    showLegend() {
        const legend = document.createElement('div');
        legend.className = 'keyboard-shortcut-legend';
        legend.setAttribute('role', 'region');
        legend.setAttribute('aria-label', 'Keyboard shortcuts');

        let html = '<h3 style="grid-column: 1 / -1; margin-bottom: 0.5rem;">⌨️ Keyboard Shortcuts</h3>';
        for (const [key, { description }] of Object.entries(this.shortcuts)) {
            html += `
                <div class="shortcut-item">
                    <kbd class="shortcut-key">${key}</kbd>
                    <span>${description}</span>
                </div>
            `;
        }

        legend.innerHTML = html;
        return legend;
    }
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initialize all Phase 3 enhancements
 */
export function initPhase3Enhancements() {
    // 1. Apply disabled button styling
    applyDisabledButtonStyling();

    // 2. Initialize progress indicator (will be used when transcription starts)
    window.progressIndicator = new ProgressIndicator('.transcription-display');

    // 3. Show onboarding tooltip on first visit
    const onboarding = new OnboardingTooltip();
    onboarding.showIfNeeded();
    window.onboardingTooltip = onboarding; // Expose for reset in console

    // 4. Toast system ready (no initialization needed)
    window.Toast = Toast;

    // 5. AsyncButton available for buttons that need loading states
    window.AsyncButton = AsyncButton;

    // 9. Initialize keyboard shortcuts
    const shortcuts = new KeyboardShortcuts();
    shortcuts.init();
    window.keyboardShortcuts = shortcuts;

    console.log('Phase 3 Enhancements initialized');
}

/**
 * Integration examples for main.js:
 *
 * // Show loading progress during transcription
 * progressIndicator.show(estimatedDuration);
 * // ... perform transcription ...
 * progressIndicator.clear();
 *
 * // Show toast notifications
 * Toast.success('Meeting saved successfully!');
 * Toast.error('Failed to save meeting');
 *
 * // Use async button for operations
 * const btn = new AsyncButton(saveMeetingBtn);
 * await btn.execute(async () => {
 *     // Your async operation
 * }, '✓ Saved', '✕ Save failed');
 *
 * // Keyboard shortcuts work automatically
 * // Space to record, Escape to close, Ctrl/Cmd+S to save
 */

export {
    applyDisabledButtonStyling,
    setButtonDisabledState,
    ProgressIndicator,
    OnboardingTooltip,
    Toast,
    AsyncButton,
    KeyboardShortcuts
};
