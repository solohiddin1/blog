async function loadProfile() {
    const container = document.getElementById('userInfo');
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user_id');
    try {
        container.innerText = 'Loading...';
        let response;
        if (userId) {
            response = await authFetch(`/users/${userId}/`, { method: 'GET' });
        } else {
            response = await authFetch('/profile/');
        }
        if (!response.ok) {
            container.innerText = 'Unable to load profile. Please login.';
            return;
        }
        const profile = await response.json();

        // If viewing another user's profile, show read-only info and their posts
        if (userId) {
            container.innerHTML = `
                <p>Username: ${escapeHtml(profile.user.username)}</p>
                <p>First Name: ${escapeHtml(profile.user.first_name)}</p>
                <p>Email: ${escapeHtml(profile.user.email)}</p>
            `;
        } else {
            // editable form for current user
            container.innerHTML = `
                <form id="profileUpdateForm">
                    <label>Username (email)</label>
                    <input type="text" id="profile_username" value="${escapeHtml(profile.user.username)}" disabled>
                    <label>First name</label>
                    <input type="text" id="profile_first_name" value="${escapeHtml(profile.user.first_name)}">
                    <label>Email</label>
                    <input type="email" id="profile_email" value="${escapeHtml(profile.user.email)}">
                    <button type="submit">Save</button>
                </form>
                <div id="profileMessage" class="form-message"></div>
            `;
            // attach submit handler
            document.getElementById('profileUpdateForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const first_name = document.getElementById('profile_first_name').value;
                const email = document.getElementById('profile_email').value;
                const res = await authFetch('/profile/', { method: 'PUT', body: JSON.stringify({ first_name, email }) });
                const data = await res.json().catch(()=>({}));
                if (res.ok) {
                    showMessage('profileMessage', 'Profile updated', 'success');
                    // refresh cache
                    await getCurrentUser(true);
                } else {
                    showMessage('profileMessage', JSON.stringify(data), 'error');
                }
            });
        }

        const userPosts = document.getElementById('userPosts');
        userPosts.innerHTML = '';

        profile.posts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.className = 'post-item';
            const authorName = profile.user.username || profile.user.id || 'Unknown';
            // if this is the current user's profile (no userId param), show delete button
            let deleteBtnHtml = '';
            const currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');
            if (!userId && currentUser && currentUser.id === profile.user.id) {
                deleteBtnHtml = `<button class="btn delete-post" data-id="${post.id}">Delete</button>`;
            }
            postElement.innerHTML = `
                <a class="post-avatar-link" href="profile.html?user_id=${profile.user.id}"><div class="post-avatar">${escapeHtml((authorName[0]||'U').toUpperCase())}</div></a>
                <div class="post-content">
                  <div class="post-header"><a class="author-link" href="profile.html?user_id=${profile.user.id}">${escapeHtml(authorName)}</a></div>
                  <div class="post-body"><a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a></div>
                  <div class="post-excerpt">${escapeHtml(post.content || '')}</div>
                </div>
                ${deleteBtnHtml}
            `;
            userPosts.appendChild(postElement);
        });

        // attach delete handlers
        document.querySelectorAll('.delete-post').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (!confirm('Delete this post?')) return;
                const res = await authFetch(`/posts/${id}/`, { method: 'DELETE' });
                if (res.ok) {
                    // remove element
                    e.target.closest('.post-item').remove();
                } else {
                    const body = await res.json().catch(()=>({}));
                    showMessage('profileMessage', body.error || 'Failed to delete', 'error');
                }
            });
        });
    } catch (err) {
        container.innerText = 'Error loading profile.';
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});