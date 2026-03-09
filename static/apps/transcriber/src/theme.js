/**
 * Theme management and styling
 */

// Set theme to specified value
function setTheme(themeName) {
    const body = document.body;

    // Remove all theme classes
    body.classList.remove('theme-signal', 'theme-dark', 'theme-prism');

    // Add selected theme class
    if (themeName === 'signal') {
        body.classList.add('theme-signal');
    } else if (themeName === 'dark') {
        body.classList.add('theme-dark');
    } else if (themeName === 'prism') {
        body.classList.add('theme-prism');
    }

    // Save preference
    localStorage.setItem('theme', themeName);

    // Update active state on buttons
    updateThemeButtons();
}

// Update active state on theme buttons
function updateThemeButtons() {
    const buttons = document.querySelectorAll('.theme-btn');
    const currentTheme = localStorage.getItem('theme') || 'default';

    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-theme') === currentTheme) {
            btn.classList.add('active');
        }
    });
}

// Load theme preference from localStorage
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'default';

    if (savedTheme === 'signal') {
        document.body.classList.add('theme-signal');
    } else if (savedTheme === 'dark') {
        document.body.classList.add('theme-dark');
    } else if (savedTheme === 'prism') {
        document.body.classList.add('theme-prism');
    }

    updateThemeButtons();
}

export {
    setTheme,
    updateThemeButtons,
    loadTheme
};
