from rest_framework.views import APIView
from ..models import Post, Comment
from rest_framework.response import Response
from ..serializers import CommentSerializer, PostSerializer, UserSerializer
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):

        user_request = request.user
        try:
            user = User.objects.get(id=user_request.id)
        except User.DoesNotExist:
            return Response({"error":"user not found"},status=404)
        user_serializer = UserSerializer(user, context={'request': request})

        posts = Post.objects.filter(author=user).order_by('-created_at')
        post_serializer = PostSerializer(posts,many=True)
        comments = Comment.objects.filter(author=user).order_by('-id')
        comments_serializer = CommentSerializer(comments, many=True)

        return Response({
            'user': user_serializer.data,
            'posts': post_serializer.data,
            'comments': comments_serializer.data
        })

    def put(self,request):
        user = request.user
        serializer = UserSerializer(instance=user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated", "user": serializer.data}, status=200)
        return Response(serializer.errors, status=400)


class OtherUserProfileView(APIView):
    """Public endpoint to view another user's profile and posts/comments."""
    def get(self, request, pk):
        try:
            user = User.objects.get(id=pk)
        except User.DoesNotExist:
            return Response({"error": "user not found"}, status=status.HTTP_404_NOT_FOUND)

        user_serializer = UserSerializer(user, context={'request': request})
        posts = Post.objects.filter(author=user).order_by('-created_at')
        post_serializer = PostSerializer(posts, many=True)
        comments = Comment.objects.filter(author=user).order_by('-id')
        comments_serializer = CommentSerializer(comments, many=True)

        return Response({
            'user': user_serializer.data,
            'posts': post_serializer.data,
            'comments': comments_serializer.data
        })