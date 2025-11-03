async function loadPost(postId) {
    const response = await authFetch(`/posts/${postId}/`);
    const post = await response.json();

    document.getElementById('postTitle').innerText = post.title;
    document.getElementById('postContent').innerText = post.content;

    // Load comments
    await loadComments(postId);
}

async function loadComments(postId) {
    const response = await authFetch(`/comments/?post=${postId}`);
    const comments = await response.json();

    const commentList = document.getElementById('commentList');
    commentList.innerHTML = '';

    comments.results.forEach(comment => {
        const commentElement = document.createElement('div');
        commentElement.innerHTML = `<h3>${comment.title}</h3><p>${comment.content}</p>`;
        commentList.appendChild(commentElement);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (postId) loadPost(postId);
});