document.getElementById('postForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;

    try {
        const res = await authFetch('/posts/', {
            method: 'POST',
            body: JSON.stringify({ title, content })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            // go back to feed
            window.location.href = 'index.html';
        } else {
            showMessage('postFormMessage', data.error || data.detail || 'Failed to create post', 'error');
        }
    } catch (err) {
        console.error(err);
        showMessage('postFormMessage', 'Network error', 'error');
    }
});
