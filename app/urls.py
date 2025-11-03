from django.urls import path, include
from .views.comment import CommentView, CommentDetailView
from .views.post import PostView, PostDetailView
from .views.auth import RegisterView, LoginView
from rest_framework_simplejwt.views import TokenRefreshView
from .views.user import UserProfileView
from .views.front import home_view, login_view, register_view, profile_view, post_view
# from rest_framework_simplejwt.tokens import ac


urlpatterns = [
    path('', home_view, name='home'),
    path('login-page/', login_view, name='login-page'),
    path('register-page/', register_view, name='register-page'),
    path('profile-page/', profile_view, name='profile-page'),
    path('post-page/', post_view, name='post-page'),

    
    path('comments/', CommentView.as_view(), name='comment-list'),
    path('comments/<int:pk>/', CommentDetailView.as_view(), name='comment-detail'),
    
    path('posts/', PostView.as_view(), name='post-list'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),

    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),

    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh')

]