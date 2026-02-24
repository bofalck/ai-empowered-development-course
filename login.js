// ===== USER MANAGEMENT =====

const STORAGE_KEY = 'transcriber_users';
const SESSION_KEY = 'transcriber_session';

// Initialize with default user if no users exist
function initializeUsers() {
    const existingUsers = localStorage.getItem(STORAGE_KEY);
    if (!existingUsers) {
        const defaultUsers = [
            { username: 'test', password: 'test123', theme: 'default' },
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    }
}

// Get all users
function getUsers() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Add new user
function addUser(username, password, theme) {
    const users = getUsers();

    // Check if username already exists
    if (users.some(u => u.username === username)) {
        return { success: false, message: 'Username taken' };
    }

    users.push({ username, password, theme });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return { success: true, message: 'User created' };
}

// Delete user
function deleteUser(username) {
    const users = getUsers();
    const filtered = users.filter(u => u.username !== username);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Get current session
function getSession() {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
}

// Set session
function setSession(username, theme) {
    const session = { username, theme, timestamp: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

// Clear session
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// ===== THEME MANAGEMENT =====

let selectedTheme = localStorage.getItem('login_selected_theme') || 'default';
let newUserTheme = 'default';

function applyLoginTheme(theme) {
    document.body.classList.remove('theme-signal', 'theme-dark', 'theme-prism');
    if (theme === 'signal') {
        document.body.classList.add('theme-signal');
    } else if (theme === 'dark') {
        document.body.classList.add('theme-dark');
    } else if (theme === 'prism') {
        document.body.classList.add('theme-prism');
    }
    selectedTheme = theme;
    localStorage.setItem('login_selected_theme', theme);
    updateThemeButtonStates();
}

function updateThemeButtonStates() {
    document.querySelectorAll('.theme-btn-login').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-theme') === selectedTheme);
    });
}

function setNewUserTheme(theme) {
    newUserTheme = theme;
    document.querySelectorAll('.theme-btn-admin').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
}

// ===== UI ELEMENTS =====

const loginForm = document.getElementById('loginForm');
const addUserForm = document.getElementById('addUserForm');
const loginPanel = document.getElementById('loginPanel');
const adminPanel = document.getElementById('adminPanel');
const showAdminBtn = document.getElementById('showAdminBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const loginError = document.getElementById('loginError');
const adminMessage = document.getElementById('adminMessage');
const adminError = document.getElementById('adminError');
const usersList = document.getElementById('usersList');
const themeButtonsLogin = document.querySelectorAll('.theme-btn-login');
const themeButtonsAdmin = document.querySelectorAll('.theme-btn-admin');

// ===== EVENT LISTENERS =====

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin();
});

addUserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAddUser();
});

showAdminBtn.addEventListener('click', () => {
    switchPanel('admin');
    renderUsersList();
    addUserForm.reset();
    adminMessage.classList.add('hidden');
    adminError.classList.add('hidden');
    setNewUserTheme('default');
});

backToLoginBtn.addEventListener('click', () => {
    switchPanel('login');
    loginForm.reset();
    loginError.classList.add('hidden');
});

// Theme button listeners
themeButtonsLogin.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = btn.getAttribute('data-theme');
        applyLoginTheme(theme);
    });
});

// Admin theme button listeners
themeButtonsAdmin.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const theme = btn.getAttribute('data-theme');
        setNewUserTheme(theme);
    });
});

// ===== FUNCTIONS =====

function switchPanel(panelName) {
    loginPanel.classList.toggle('active', panelName === 'login');
    adminPanel.classList.toggle('active', panelName === 'admin');
}

function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    loginError.classList.add('hidden');

    if (!username || !password) {
        showError(loginError, 'Username and password required');
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        showError(loginError, 'Username or password incorrect');
        return;
    }

    // Login successful - use selected theme from login page
    setSession(username, selectedTheme);

    // Apply theme and redirect
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 100);
}

function handleAddUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const theme = newUserTheme;

    adminMessage.classList.add('hidden');
    adminError.classList.add('hidden');

    if (!username || !password) {
        showError(adminError, 'Username and password required');
        return;
    }

    if (username.length < 3) {
        showError(adminError, 'Username must be 3 characters or more');
        return;
    }

    if (password.length < 4) {
        showError(adminError, 'Password must be 4 characters or more');
        return;
    }

    const result = addUser(username, password, theme);

    if (!result.success) {
        showError(adminError, result.message);
        return;
    }

    // Success
    showSuccess(adminMessage, `User "${username}" created`);
    addUserForm.reset();
    renderUsersList();

    // Clear message after 3 seconds
    setTimeout(() => {
        adminMessage.classList.add('hidden');
    }, 3000);
}

function renderUsersList() {
    const users = getUsers();
    usersList.innerHTML = '';

    if (users.length === 0) {
        usersList.innerHTML = '<li style="padding: 1rem; text-align: center; color: var(--color-text-secondary);">No users yet</li>';
        return;
    }

    users.forEach(user => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="user-info">
                <div class="user-username">${escapeHtml(user.username)}</div>
                <div class="user-theme">Theme: ${user.theme}</div>
            </div>
            <button class="user-delete" data-username="${user.username}" title="Delete user">Delete</button>
        `;

        const deleteBtn = li.querySelector('.user-delete');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Delete user "${user.username}"?`)) {
                deleteUser(user.username);
                renderUsersList();
            }
        });

        usersList.appendChild(li);
    });
}

function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

function showSuccess(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== INITIALIZATION =====

initializeUsers();
renderUsersList();
applyLoginTheme(selectedTheme);
