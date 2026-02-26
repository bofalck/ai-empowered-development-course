/**
 * Control panel visibility, dragging, and UI state management
 */

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Load control panel visibility preference from localStorage
function loadControlPanelVisibility() {
    const saved = localStorage.getItem('control_panel_visible');
    const isVisible = saved === null ? true : saved === 'true'; // Default to visible
    setControlPanelVisibility(isVisible);

    // Set initial hint text
    const toggleHint = document.getElementById('toggleHint');
    if (toggleHint) {
        toggleHint.textContent = isVisible ? 'Hide Controls' : 'Show Controls';
    }
}

// Set control panel visibility and save preference
function setControlPanelVisibility(isVisible) {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (floatingPanel) {
        if (isVisible) {
            floatingPanel.classList.remove('hidden');
        } else {
            floatingPanel.classList.add('hidden');
        }
    }
    localStorage.setItem('control_panel_visible', isVisible.toString());
}

// Toggle control panel visibility
function toggleControlPanel() {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (floatingPanel) {
        const isCurrentlyHidden = floatingPanel.classList.contains('hidden');
        const willBeVisible = isCurrentlyHidden;

        setControlPanelVisibility(willBeVisible); // Show if hidden, hide if shown

        // Update toggle hint text
        const toggleHint = document.getElementById('toggleHint');
        if (toggleHint) {
            toggleHint.textContent = isCurrentlyHidden ? 'Hide Controls' : 'Show Controls';
        }
    }
}

// Initialize dragging for control panel
function initControlPanelDragging() {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (!floatingPanel) return;

    floatingPanel.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDragging);

    // Double-click to reset position
    floatingPanel.addEventListener('dblclick', resetControlPanelPosition);
}

// Start dragging
function startDragging(e) {
    isDragging = true;
    const floatingPanel = document.querySelector('.floating-control-panel');

    const rect = floatingPanel.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    floatingPanel.classList.add('dragging');
}

// Handle dragging
function handleDrag(e) {
    if (!isDragging) return;

    const floatingPanel = document.querySelector('.floating-control-panel');
    if (!floatingPanel) return;

    const newX = e.clientX - dragOffsetX;
    const newY = e.clientY - dragOffsetY;

    // Keep within viewport
    const minX = 0;
    const maxX = window.innerWidth - floatingPanel.offsetWidth;
    const minY = 0;
    const maxY = window.innerHeight - floatingPanel.offsetHeight;

    const constrainedX = Math.max(minX, Math.min(newX, maxX));
    const constrainedY = Math.max(minY, Math.min(newY, maxY));

    floatingPanel.style.left = constrainedX + 'px';
    floatingPanel.style.top = constrainedY + 'px';
    floatingPanel.style.transform = 'none';
    floatingPanel.style.bottom = 'auto';
    floatingPanel.style.right = 'auto';

    // Save position to sessionStorage
    saveControlPanelPosition(constrainedX, constrainedY);
}

// Stop dragging
function stopDragging() {
    if (!isDragging) return;

    isDragging = false;
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (floatingPanel) {
        floatingPanel.classList.remove('dragging');
    }
}

// Save control panel position to sessionStorage
function saveControlPanelPosition(x, y) {
    sessionStorage.setItem('controlPanelX', x);
    sessionStorage.setItem('controlPanelY', y);
}

// Load control panel position from sessionStorage
function loadControlPanelPosition() {
    const x = sessionStorage.getItem('controlPanelX');
    const y = sessionStorage.getItem('controlPanelY');

    if (x !== null && y !== null) {
        const floatingPanel = document.querySelector('.floating-control-panel');
        if (floatingPanel) {
            floatingPanel.style.left = x + 'px';
            floatingPanel.style.top = y + 'px';
            floatingPanel.style.transform = 'none';
            floatingPanel.style.bottom = 'auto';
            floatingPanel.style.right = 'auto';
        }
    }
}

// Reset control panel position to bottom center
function resetControlPanelPosition() {
    const floatingPanel = document.querySelector('.floating-control-panel');
    if (floatingPanel) {
        floatingPanel.style.left = 'auto';
        floatingPanel.style.right = 'auto';
        floatingPanel.style.bottom = '20px';
        floatingPanel.style.top = 'auto';
        floatingPanel.style.transform = 'translateX(-50%)';
        floatingPanel.style.left = '50%';

        // Clear stored position
        sessionStorage.removeItem('controlPanelX');
        sessionStorage.removeItem('controlPanelY');
    }
}

export {
    loadControlPanelVisibility,
    setControlPanelVisibility,
    toggleControlPanel,
    initControlPanelDragging,
    loadControlPanelPosition,
    resetControlPanelPosition
};
