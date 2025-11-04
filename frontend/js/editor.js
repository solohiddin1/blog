document.getElementById('postForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    // gather selected tags (as names)
    const tagSelect = document.getElementById('postTags');
    const selected = Array.from(tagSelect.selectedOptions).map(o => o.value);

    // detect if we are editing an existing post
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    const payload = { title, content, tag: selected };

    try {
        let res;
        if (postId) {
            res = await authFetch(`/posts/${postId}/`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            res = await authFetch('/posts/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            // go back to feed
            window.location.href = 'index.html';
        } else {
            showMessage('postFormMessage', data.error || data.detail || JSON.stringify(data) || 'Failed to save post', 'error');
        }
    } catch (err) {
        console.error(err);
        showMessage('postFormMessage', 'Network error', 'error');
    }
});

// populate tag list and, if editing, load post data
async function loadTagsAndMaybePost() {
    try {
        const tagsRes = await authFetch('/tags/');
        const tags = await tagsRes.json().catch(()=>([]));
        const select = document.getElementById('postTags');
        select.innerHTML = '';
        tags.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.name || t;
            opt.innerText = t.name || t;
            select.appendChild(opt);
        });

        // if editing, populate fields
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        if (postId) {
            const res = await authFetch(`/posts/${postId}/`);
            if (!res.ok) return;
            const post = await res.json();
            document.getElementById('postTitle').value = post.title || '';
            document.getElementById('postContent').value = post.content || '';
            // select existing tags
            const postTags = post.tag || [];
            Array.from(select.options).forEach(opt => {
                if (postTags.includes(opt.value)) opt.selected = true;
            });
        }
    } catch (err) {
        console.error('Failed to load tags or post', err);
    }
}

document.addEventListener('DOMContentLoaded', loadTagsAndMaybePost);
