/**
 * Authentication and session management
 */

let currentUser = null;

// Get current session from localStorage
function getSession() {
    const data = localStorage.getItem('transcriber_session');
    return data ? JSON.parse(data) : null;
}

// Clear session from localStorage
function clearSession() {
    localStorage.removeItem('transcriber_session');
    currentUser = null;
}

// Logout user
function logout() {
    clearSession();
    window.location.href = 'login.html';
}

// Check if user is authenticated
function checkAuth() {
    const session = getSession();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    currentUser = session;
    return true;
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Set current user
function setCurrentUser(user) {
    currentUser = user;
}

export {
    currentUser,
    getSession,
    clearSession,
    logout,
    checkAuth,
    getCurrentUser,
    setCurrentUser
};
