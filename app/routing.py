from django.urls import re_path
from .consumer import CommentConsumer

# WebSocket URL patterns. Frontend should connect to:
# ws://<host>/ws/comments/<post_id>/
websocket_urlpatterns = [
    re_path(r'^ws/comments/(?P<post_id>\d+)/$', CommentConsumer.as_asgi()),
]