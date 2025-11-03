async function loadProfile() {
    const response = await authFetch('/profile/');
    const profile = await response.json();

    document.getElementById('userInfo').innerHTML = `
        <p>Username: ${profile.user.username}</p>
        <p>First Name: ${profile.user.first_name}</p>
        <p>Email: ${profile.user.email}</p>
    `;

    const userPosts = document.getElementById('userPosts');
    userPosts.innerHTML = '';

    profile.posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p>`;
        userPosts.appendChild(postElement);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
});