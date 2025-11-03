const API_BASE = 'http://127.0.0.1:8000/'; // base

function setTokens(tokens) {
    if (tokens.access) localStorage.setItem('access_token', tokens.access);
    if (tokens.refresh) localStorage.setItem('refresh_token', tokens.refresh);
}

function getAccessToken() {
    return localStorage.getItem('access_token');
}

function getRefreshToken() {
    return localStorage.getItem('refresh_token');
}

function getToken() { // alias for backwards compatibility
    return getAccessToken();
}

function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
}

let refreshing = null; // Promise when refresh in progress

async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    // if a refresh already in progress, return that promise
    if (refreshing) return refreshing;
    refreshing = (async () => {
        try {
            const res = await fetch(API_BASE.replace(/\/+$/, '') + '/token/refresh/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh })
            });
            if (!res.ok) {
                // refresh failed
                clearTokens();
                return null;
            }
            const data = await res.json();
            if (data.access) {
                localStorage.setItem('access_token', data.access);
                return data.access;
            }
            return null;
        } catch (err) {
            console.error('refresh error', err);
            clearTokens();
            return null;
        } finally {
            refreshing = null;
        }
    })();
    return refreshing;
}

async function authFetch(url, opts = {}, retry = true) {
    const token = getAccessToken();
    opts.headers = opts.headers || {};
    // default headers
    if (!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) {
        opts.headers['Content-Type'] = 'application/json';
    }
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    // ensure we call the backend API base (allow passing full urls too)
    const fullUrl = url.startsWith('http') ? url : API_BASE.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '');

    let response = await fetch(fullUrl, opts);
    if (response.status === 401 && retry) {
        // try refresh
        const newAccess = await refreshAccessToken();
        if (newAccess) {
            // update header and retry once
            opts.headers['Authorization'] = `Bearer ${newAccess}`;
            response = await fetch(fullUrl, opts);
            return response;
        }
        // refresh failed; ensure tokens cleared and redirect to login page
        clearTokens();
        window.location.href = 'login.html';
    }
    return response;
}

// simple cached current user fetch (uses /profile/)
async function getCurrentUser(force = false) {
    if (!force) {
        const cached = localStorage.getItem('current_user');
        if (cached) return JSON.parse(cached);
    }
    try {
        const res = await authFetch('/profile/');
        if (!res.ok) return null;
        const data = await res.json();
        const user = data.user || null;
        if (user) localStorage.setItem('current_user', JSON.stringify(user));
        return user;
    } catch (err) {
        return null;
    }
}

function logout() {
    clearTokens();
    window.location.href = 'login.html';
}

// show/hide nav elements based on auth state
async function updateNav() {
    const token = getToken();
    const profileLink = document.getElementById('profileLink');
    const logoutButton = document.getElementById('logoutButton');
    if (token) {
        // try to get username
        const user = await getCurrentUser();
        if (profileLink) {
            profileLink.style.display = 'inline';
            if (user && user.username) profileLink.innerText = user.username;
            else profileLink.innerText = 'Profile';
        }
        if (logoutButton) {
            logoutButton.style.display = 'inline';
            logoutButton.onclick = logout;
        }
    } else {
        if (profileLink) profileLink.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'none';
    }
}

// call updateNav on load for pages that include app.js
document.addEventListener('DOMContentLoaded', () => {
    updateNav();
});

// Small helper to show error messages in an element
function showMessage(containerId, message, type = 'error') {
    const el = document.getElementById(containerId);
    if (!el) {
        alert(message);
        return;
    }
    el.innerText = message;
    el.className = type === 'error' ? 'msg-error' : 'msg-success';
    setTimeout(() => { el.innerText = ''; el.className = ''; }, 4000);
}

// small helper to escape HTML (safe for inserting text)
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}
