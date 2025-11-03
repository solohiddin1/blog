async function loadPosts(page = 1) {
    const postList = document.getElementById('postList');
    const pagination = document.getElementById('pagination');
    try {
        postList.innerHTML = '<p>Loading posts...</p>';
        const response = await authFetch(`/posts/?page=${page}`);
        if (!response.ok) {
            // log status for debugging
            console.error('Posts load failed', response.status, response.statusText);
            // try to read response body for server message
            let text = '';
            try { text = await response.text(); } catch (e) { /* ignore */ }
            console.error('Posts response body:', text);

            if (response.status === 401) {
                // not authenticated
                postList.innerHTML = '<p>Please log in to see posts.</p>';
                return;
            }
            if (response.status === 403) {
                postList.innerHTML = '<p>Access forbidden. You may not have permission to view posts.</p>';
                return;
            }
            if (response.status === 404) {
                postList.innerHTML = '<p>Posts endpoint not found (404). Check backend routing.</p>';
                return;
            }
            // for other statuses show server message if any
            postList.innerHTML = `<p>Failed to load posts (status ${response.status}). ${text ? escapeHtml(text) : ''}</p>`;
            return;
        }
        const data = await response.json();
        console.log('posts data:', data);
        if (!data || !Array.isArray(data.results)) {
            postList.innerHTML = `<pre>Unexpected response format:\n${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
            return;
        }

        postList.innerHTML = '';

        // Create a small create-post button for authenticated users (left/top)
        const token = getToken();
        if (token) {
            let actions = document.querySelector('.top-actions');
            if (!actions) {
                actions = document.createElement('div');
                actions.className = 'top-actions container';
                // insert before postList's parent
                postList.parentNode.insertBefore(actions, postList);
            }
            const createBtn = document.createElement('a');
            createBtn.href = 'editor.html';
            createBtn.className = 'btn create-left';
            createBtn.innerText = 'New';
            // ensure we don't duplicate
            if (!actions.querySelector('.create-left')) actions.appendChild(createBtn);
        }

        data.results.forEach(post => {
            const postElement = document.createElement('article');
            const contentText = post.content || '';
            const excerpt = contentText.length > 200 ? contentText.slice(0,200) + '...' : contentText;
            postElement.className = 'post-item';
            const authorName = post.author_username || post.author || 'Unknown';
            // tweet-like layout: avatar left, content right, clicking post title goes to detail
            postElement.innerHTML = `
                <a class="post-avatar-link" href="profile.html?user_id=${post.author}"><div class="post-avatar">${escapeHtml((authorName[0]||'U').toUpperCase())}</div></a>
                <div class="post-content">
                  <div class="post-header"><a class="author-link" href="profile.html?user_id=${post.author}">${escapeHtml(authorName)}</a> <span class="meta">• ${post.created_at || ''}</span></div>
                  <div class="post-body"><a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a></div>
                  <div class="post-excerpt">${escapeHtml(excerpt)}</div>
                </div>
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
    if (str === null || str === undefined) return '';
    const s = String(str);
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
});