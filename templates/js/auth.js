document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        if (data.tokens) setTokens(data.tokens);
        window.location.href = 'index.html';
    } else {
        alert('Login failed');
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const first_name = document.getElementById('first_name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, first_name, email, password })
    });

    if (response.ok) {
        const data = await response.json();
        if (data.tokens) setTokens(data.tokens);
        window.location.href = 'index.html';
    } else {
        alert('Registration failed');
    }
});