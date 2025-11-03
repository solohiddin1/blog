const API_BASE = ''; // base

function setTokens(tokens) {
    if (tokens.access) localStorage.setItem('access_token', tokens.access);
    if (tokens.refresh) localStorage.setItem('refresh_token', tokens.refresh);
}

function getToken() {
    return localStorage.getItem('access_token');
}

function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

function authFetch(url, opts = {}) {
    const token = getToken();
    opts.headers = opts.headers || {};
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, opts);
}
