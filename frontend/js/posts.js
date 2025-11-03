async function loadPosts(page = 1) {
    const postList = document.getElementById('postList');
    const pagination = document.getElementById('pagination');
    try {
        postList.innerHTML = '<p>Loading posts...</p>';
        const response = await authFetch(`/posts/?page=${page}`);
        if (!response.ok) {
            if (response.status === 401) {
                // not authenticated
                postList.innerHTML = '<p>Please log in to see posts.</p>';
                return;
            }
            throw new Error('Failed to load posts');
        }
        const data = await response.json();

        postList.innerHTML = '';

        // Create a create-post button for authenticated users
        const token = getToken();
        if (token) {
            const createBtn = document.createElement('a');
            createBtn.href = 'editor.html';
            createBtn.className = 'btn';
            createBtn.innerText = 'Create Post';
            postList.appendChild(createBtn);
        }

        data.results.forEach(post => {
            const postElement = document.createElement('article');
            const excerpt = post.content.length > 200 ? post.content.slice(0,200) + '...' : post.content;
            postElement.className = 'post-item';
            postElement.innerHTML = `
                <h2><a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a></h2>
                <p class="meta">Author: ${post.author} • ${post.created_at || ''}</p>
                <p>${escapeHtml(excerpt)}</p>
            `;
            postList.appendChild(postElement);
        });

        pagination.innerHTML = '';
        const prevBtn = document.createElement('button');
        prevBtn.innerText = 'Previous';
        if (!data.previous) prevBtn.disabled = true;
        else prevBtn.onclick = () => loadPosts(page - 1);

        const nextBtn = document.createElement('button');
        nextBtn.innerText = 'Next';
        if (!data.next) nextBtn.disabled = true;
        else nextBtn.onclick = () => loadPosts(page + 1);

        const pageSpan = document.createElement('span');
        pageSpan.innerText = ` Page ${page} `;

        pagination.appendChild(prevBtn);
        pagination.appendChild(pageSpan);
        pagination.appendChild(nextBtn);

    } catch (err) {
        postList.innerHTML = '<p>Error loading posts.</p>';
        console.error(err);
    }
}

// small helper to escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
});