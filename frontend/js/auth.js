document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch(API_BASE + 'login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.tokens) {
            setTokens(data.tokens);
            // update nav (in case the page uses it)
            await getCurrentUser(true);
            window.location.href = 'index.html';
        } else {
            showMessage('loginMessage', data.error || data.detail || 'Login failed', 'error');
        }
    } catch (err) {
        console.error(err);
        showMessage('loginMessage', 'Network error', 'error');
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const first_name = document.getElementById('first_name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch(API_BASE + 'register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, first_name, email, password })
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.tokens) {
            setTokens(data.tokens);
            await getCurrentUser(true);
            window.location.href = 'index.html';
        } else {
            showMessage('registerMessage', JSON.stringify(data), 'error');
        }
    } catch (err) {
        console.error(err);
        showMessage('registerMessage', 'Network error', 'error');
    }
});