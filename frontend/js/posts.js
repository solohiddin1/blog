async function loadPosts(page = 1, tag = null) {
    const postList = document.getElementById('postList');
    const pagination = document.getElementById('pagination');
    try {
        postList.innerHTML = '<p>Loading posts...</p>';
        let response;
        if (tag) {
            // fetch posts by tag
            response = await authFetch(`/posts_tag/${encodeURIComponent(tag)}/`);
        } else {
            response = await authFetch(`/posts/?page=${page}`);
        }
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
        if (!data || (!(Array.isArray(data) || Array.isArray(data.results)))) {
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

        const results = data.results || data; // posts_tag returns array, posts returns paginated {results:[]}
        results.forEach(post => {
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
                  <div class="post-tags">${(post.tag || []).map(t => `<a class="tag-badge" href="#" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</a>`).join(' ')}</div>
                </div>
            `;
            postList.appendChild(postElement);
        });

        // attach tag badge handlers
        document.querySelectorAll('.tag-badge').forEach(b => {
            b.addEventListener('click', (e) => {
                e.preventDefault();
                const t = e.target.dataset.tag;
                if (!t) return;
                loadPosts(1, t);
            });
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
    const params = new URLSearchParams(window.location.search);
    const tag = params.get('tag');
    if (tag) loadPosts(1, tag);
    else loadPosts();
    loadTagsSidebar();
});

// load tags and render a small sidebar in the corner
async function loadTagsSidebar() {
    try {
        const res = await authFetch('/tags/');
        if (!res.ok) return;
        const tags = await res.json();
        const container = document.getElementById('tagsSidebar');
        if (!container) {
            const el = document.createElement('aside');
            el.id = 'tagsSidebar';
            el.className = 'tags-sidebar';
            el.innerHTML = '<h4>Tags</h4><div class="tags-list"></div>';
            document.body.appendChild(el);
        }
        const list = document.querySelector('#tagsSidebar .tags-list');
        list.innerHTML = '';
        (tags || []).forEach(t => {
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'tag-pill';
            a.innerText = t.name || t;
            a.dataset.tag = t.name || t;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                loadPosts(1, e.target.dataset.tag);
            });
            list.appendChild(a);
        });
    } catch (err) {
        console.error('Failed to load tags', err);
    }
}