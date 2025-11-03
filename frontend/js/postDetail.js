async function loadPost(postId) {
    const container = document.getElementById('postContent');
    try {
        container.innerText = 'Loading...';
        const response = await authFetch(`/posts/${postId}/`);
        if (!response.ok) {
            container.innerText = 'Post not found or you do not have access.';
            return;
        }
    const post = await response.json();

    document.getElementById('postTitle').innerText = post.title;
    // include author link
    const authorName = post.author_username || post.author || 'Unknown';
    container.innerHTML = `<p class="meta">By <a class="author-link" href="profile.html?user_id=${post.author}">${escapeHtml(authorName)}</a> • ${post.created_at || ''}</p><div>${escapeHtml(post.content)}</div>`;

    // Load comments
    await loadComments(postId);
    } catch (err) {
        container.innerText = 'Error loading post.';
        console.error(err);
    }
}

async function loadComments(postId) {
    const commentList = document.getElementById('commentList');
    try {
        commentList.innerHTML = '<p>Loading comments...</p>';
        const response = await authFetch(`/comments/?post=${postId}`);
        if (!response.ok) {
            commentList.innerHTML = '<p>No comments or not authorized.</p>';
            return;
        }
        const comments = await response.json();

        commentList.innerHTML = '';

        comments.results.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment-item';
            const authorName = comment.author_username || comment.author || 'Unknown';
            commentElement.innerHTML = `
                <div class="comment-avatar"></div>
                <div class="comment-body">
                  <div><a class="comment-author" href="profile.html?user_id=${comment.author}">${escapeHtml(authorName)}</a> <span class="meta">• ${comment.created_at || ''}</span></div>
                  <div class="comment-text">${escapeHtml(comment.content)}</div>
                </div>
            `;
            commentList.appendChild(commentElement);
        });
    } catch (err) {
        commentList.innerHTML = '<p>Error loading comments.</p>';
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (postId) loadPost(postId);
});

// handle comment form submission
document.getElementById('commentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (!postId) return;

    const title = document.getElementById('commentTitle').value;
    const content = document.getElementById('commentContent').value;

    try {
        const response = await authFetch('/comments/', {
            method: 'POST',
            body: JSON.stringify({ post: postId, title, content })
        });
        if (!response.ok) {
            const err = await response.json().catch(()=>({}));
            showMessage('commentFormMessage', err.detail || 'Failed to post comment', 'error');
            return;
        }
        const data = await response.json();
        showMessage('commentFormMessage', 'Comment created', 'success');
        document.getElementById('commentForm').reset();
        await loadComments(postId);
    } catch (err) {
        console.error(err);
        showMessage('commentFormMessage', 'Error submitting comment', 'error');
    }
});