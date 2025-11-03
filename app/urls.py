from django.urls import path
from .views import CommentView, PostView, UserRegister


urlpatterns = [
    path('comments/', CommentView.as_view(), name='comment-list'),
    path('posts/', PostView.as_view(), name='post-list'),
    path('register/', UserRegister.as_view(), name='user-register'),
]
