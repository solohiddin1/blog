from django.urls import path, include
from .views.comment import CommentView, CommentDetailView
from .views.post import PostView, PostDetailView
from .views.auth import RegisterView, LoginView
from rest_framework.routers import DefaultRouter


urlpatterns = [
    path('comments/', CommentView.as_view(), name='comment-list'),
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),
    
    path('posts/', PostView.as_view(), name='post-list'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),

    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
]