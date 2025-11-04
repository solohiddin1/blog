let socket;

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
    const authorName = post.author_username || post.author || 'Unknown';
    const tagsHtml = (post.tag || []).map(t => `<a class="tag-badge" href="#" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</a>`).join(' ');
    container.innerHTML = `<p class="meta">By <a class="author-link" href="profile.html?user_id=${post.author}">${escapeHtml(authorName)}</a> • ${post.created_at || ''}</p><div>${escapeHtml(post.content)}</div><div class="post-tags">${tagsHtml}</div>`;

        // Load comments
        await loadComments(postId);
        // Establish WebSocket connection
        connectWebSocket(postId);
        // make tags clickable (navigate to main page with tag filter)
        document.querySelectorAll('#postContent .tag-badge').forEach(b => {
            b.addEventListener('click', (e) => {
                e.preventDefault();
                const t = e.target.dataset.tag;
                if (!t) return;
                window.location.href = `index.html?tag=${encodeURIComponent(t)}`;
            });
        });
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
            // show edit/delete for own comments
            const currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');
            let controls = '';
            if (currentUser && currentUser.id === comment.author) {
                controls = `<div class="comment-controls"><button class="edit-comment" data-id="${comment.id}">Edit</button> <button class="delete-comment" data-id="${comment.id}">Delete</button></div>`;
            }
            commentElement.innerHTML = `
                <div class="comment-avatar"></div>
                <div class="comment-body">
                    <div><a class="comment-author" href="profile.html?user_id=${comment.author}">${escapeHtml(authorName)}</a> <span class="meta">• ${comment.created_at || ''}</span></div>
                    <div class="comment-text" data-id="content-${comment.id}">${escapeHtml(comment.content)}</div>
                    ${controls}
                </div>
            `;
            commentList.appendChild(commentElement);
        });

        // attach comment controls
        document.querySelectorAll('.delete-comment').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (!confirm('Delete this comment?')) return;
                const res = await authFetch(`/comments/${id}/`, { method: 'DELETE' });
                if (res.ok) {
                    e.target.closest('.comment-item').remove();
                } else {
                    const body = await res.json().catch(()=>({}));
                    showMessage('commentFormMessage', body.error || 'Failed to delete', 'error');
                }
            });
        });

        document.querySelectorAll('.edit-comment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const contentEl = document.querySelector(`[data-id=content-${id}]`);
                const current = contentEl.innerText || '';
                // replace with textarea and save/cancel
                const ta = document.createElement('textarea');
                ta.value = current;
                const save = document.createElement('button');
                save.innerText = 'Save';
                const cancel = document.createElement('button');
                cancel.innerText = 'Cancel';
                const wrapper = document.createElement('div');
                wrapper.appendChild(ta);
                wrapper.appendChild(save);
                wrapper.appendChild(cancel);
                contentEl.parentNode.replaceChild(wrapper, contentEl);

                save.addEventListener('click', async () => {
                    const newContent = ta.value;
                    const res = await authFetch(`/comments/${id}/`, { method: 'PUT', body: JSON.stringify({ content: newContent }) });
                    if (res.ok) {
                        // restore
                        const newDiv = document.createElement('div');
                        newDiv.className = 'comment-text';
                        newDiv.dataset.id = `content-${id}`;
                        newDiv.innerText = newContent;
                        wrapper.parentNode.replaceChild(newDiv, wrapper);
                    } else {
                        const body = await res.json().catch(()=>({}));
                        showMessage('commentFormMessage', body.error || 'Failed to update', 'error');
                    }
                });

                cancel.addEventListener('click', () => {
                    // restore original
                    const oldDiv = document.createElement('div');
                    oldDiv.className = 'comment-text';
                    oldDiv.dataset.id = `content-${id}`;
                    oldDiv.innerText = current;
                    wrapper.parentNode.replaceChild(oldDiv, wrapper);
                });
            });
        });
    } catch (err) {
        commentList.innerHTML = '<p>Error loading comments.</p>';
        console.error(err);
    }
}

function connectWebSocket(postId) {
    socket = new WebSocket(`ws://${window.location.host}/ws/comments/${postId}/`);

    socket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        addCommentToList(data);
    };

    socket.onclose = function() {
        console.error('WebSocket closed unexpectedly');
    };
}

function addCommentToList(comment) {
    const commentList = document.getElementById('commentList');
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';

    const authorName = comment.author_username || 'Unknown';
    commentElement.innerHTML = `
        <div class="comment-avatar"></div>
        <div class="comment-body">
            <div><a class="comment-author" href="profile.html?user_id=${comment.author}">${escapeHtml(authorName)}</a> <span class="meta">• ${comment.created_at || ''}</span></div>
            <div class="comment-text">${escapeHtml(comment.content)}</div>
        </div>
    `;
    commentList.appendChild(commentElement);
}

document.getElementById('commentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (!postId) return;

    const content = document.getElementById('commentContent').value;

    try {
        const response = await authFetch('/comments/', {
            method: 'POST',
            body: JSON.stringify({ post: postId, content })
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            showMessage('commentFormMessage', err.detail || 'Failed to post comment', 'error');
            return;
        }
        const data = await response.json();
        showMessage('commentFormMessage', 'Comment created', 'success');
        document.getElementById('commentForm').reset();
        
        // Optionally load comments again or add directly via WebSocket
        // await loadComments(postId);
    } catch (err) {
        console.error(err);
        showMessage('commentFormMessage', 'Error submitting comment', 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (postId) loadPost(postId);
});

// let socket;

// async function loadPost(postId) {
//     const response = await authFetch(`/posts/${postId}/`);
//     const post = await response.json();

//     document.getElementById('postTitle').innerText = post.title;
//     document.getElementById('postContent').innerText = post.content;

//     // Load existing comments
//     await loadComments(postId);

//     // Establish WebSocket connection
//     connectWebSocket(postId);
// }

// async function loadComments(postId) {
//     const response = await authFetch(`/comments/?post=${postId}`);
//     const comments = await response.json();

//     const commentList = document.getElementById('commentList');
//     commentList.innerHTML = '';

//     comments.results.forEach(comment => {
//         const commentElement = document.createElement('div');
//         commentElement.innerHTML = `<h3>${comment.title}</h3><p>${comment.content}</p>`;
//         commentList.appendChild(commentElement);
//     });
// }

// function connectWebSocket(postId) {
//     socket = new WebSocket(`ws://${window.location.host}/ws/comments/${postId}/`);

//     socket.onmessage = function(e) {
//         const data = JSON.parse(e.data);
//         addCommentToList(data);
//     };

//     socket.onclose = function() {
//         console.error('WebSocket closed unexpectedly');
//     };
// }

// function addCommentToList(comment) {
//     const commentList = document.getElementById('commentList');
//     const commentElement = document.createElement('div');
//     commentElement.innerHTML = `<h3>${comment.title}</h3><p>${comment.content}</p>`;
//     commentList.appendChild(commentElement);
// }

// document.getElementById('commentForm').addEventListener('submit', function(e) {
//     e.preventDefault();
//     const title = document.getElementById('commentTitle').value;
//     const content = document.getElementById('commentContent').value;

//     const commentData = {
//         title: title,
//         content: content,
//         author: getToken() // Pass the author's username or ID if needed
//     };

//     socket.send(JSON.stringify(commentData));

//     // Clear the form
//     document.getElementById('commentTitle').value = '';
//     document.getElementById('commentContent').value = '';
// });

// document.addEventListener('DOMContentLoaded', () => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const postId = urlParams.get('id');
//     if (postId) loadPost(postId);
// });

// async function loadPost(postId) {
//     const container = document.getElementById('postContent');
//     try {
//         container.innerText = 'Loading...';
//         const response = await authFetch(`/posts/${postId}/`);
//         if (!response.ok) {
//             container.innerText = 'Post not found or you do not have access.';
//             return;
//         }
//     const post = await response.json();

//     document.getElementById('postTitle').innerText = post.title;
//     // include author link
//     const authorName = post.author_username || post.author || 'Unknown';
//     container.innerHTML = `<p class="meta">By <a class="author-link" href="profile.html?user_id=${post.author}">${escapeHtml(authorName)}</a> • ${post.created_at || ''}</p><div>${escapeHtml(post.content)}</div>`;

//     // Load comments
//     await loadComments(postId);
//     } catch (err) {
//         container.innerText = 'Error loading post.';
//         console.error(err);
//     }
// }

// async function loadComments(postId) {
//     const commentList = document.getElementById('commentList');
//     try {
//         commentList.innerHTML = '<p>Loading comments...</p>';
//         const response = await authFetch(`/comments/?post=${postId}`);
//         if (!response.ok) {
//             commentList.innerHTML = '<p>No comments or not authorized.</p>';
//             return;
//         }
//         const comments = await response.json();

//         commentList.innerHTML = '';

//         comments.results.forEach(comment => {
//             const commentElement = document.createElement('div');
//             commentElement.className = 'comment-item';
//             const authorName = comment.author_username || comment.author || 'Unknown';
//             commentElement.innerHTML = `
//                 <div class="comment-avatar"></div>
//                 <div class="comment-body">
//                   <div><a class="comment-author" href="profile.html?user_id=${comment.author}">${escapeHtml(authorName)}</a> <span class="meta">• ${comment.created_at || ''}</span></div>
//                   <div class="comment-text">${escapeHtml(comment.content)}</div>
//                 </div>
//             `;
//             commentList.appendChild(commentElement);
//         });
//     } catch (err) {
//         commentList.innerHTML = '<p>Error loading comments.</p>';
//         console.error(err);
//     }
// }

// document.addEventListener('DOMContentLoaded', () => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const postId = urlParams.get('id');
//     if (postId) loadPost(postId);
// });

// // handle comment form submission
// document.getElementById('commentForm')?.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const urlParams = new URLSearchParams(window.location.search);
//     const postId = urlParams.get('id');
//     if (!postId) return;

//     const content = document.getElementById('commentContent').value;

//     try {
//         const response = await authFetch('/comments/', {
//             method: 'POST',
//             body: JSON.stringify({ post: postId, content })
//         });
//         if (!response.ok) {
//             const err = await response.json().catch(()=>({}));
//             showMessage('commentFormMessage', err.detail || 'Failed to post comment', 'error');
//             return;
//         }
//         const data = await response.json();
//         showMessage('commentFormMessage', 'Comment created', 'success');
//         document.getElementById('commentForm').reset();
//         await loadComments(postId);
//     } catch (err) {
//         console.error(err);
//         showMessage('commentFormMessage', 'Error submitting comment', 'error');
//     }
// });