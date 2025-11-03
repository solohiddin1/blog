async function loadProfile() {
    const container = document.getElementById('userInfo');
    try {
        container.innerText = 'Loading...';
        const response = await authFetch('/profile/');
        if (!response.ok) {
            container.innerText = 'Unable to load profile. Please login.';
            return;
        }
        const profile = await response.json();

        container.innerHTML = `
            <p>Username: ${escapeHtml(profile.user.username)}</p>
            <p>First Name: ${escapeHtml(profile.user.first_name)}</p>
            <p>Email: ${escapeHtml(profile.user.email)}</p>
        `;

        const userPosts = document.getElementById('userPosts');
        userPosts.innerHTML = '';

        profile.posts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.innerHTML = `<h3><a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a></h3><p>${escapeHtml(post.content)}</p>`;
            userPosts.appendChild(postElement);
        });
    } catch (err) {
        container.innerText = 'Error loading profile.';
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});