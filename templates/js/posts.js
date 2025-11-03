async function loadPosts(page = 1) {
    const response = await authFetch(`/posts/?page=${page}`);
    const data = await response.json();

    const postList = document.getElementById('postList');
    postList.innerHTML = '';

    data.results.forEach(post => {
        const postElement = document.createElement('div');
        postElement.innerHTML = `<h2>${post.title}</h2><p>${post.content}</p>`;
        postList.appendChild(postElement);
    });

    const pagination = document.getElementById('pagination');
    pagination.innerHTML = `
        <button ${!data.previous ? 'disabled' : ''} onclick="loadPosts(${page - 1})">Previous</button>
        <span>Page ${page}</span>
        <button ${!data.next ? 'disabled' : ''} onclick="loadPosts(${page + 1})">Next</button>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
});