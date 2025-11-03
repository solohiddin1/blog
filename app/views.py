from django.shortcuts import render
from rest_framework.decorators import APIView
from .models import Post, Comment
from rest_framework.response import Response
from .serializers import CommentSerializer, PostSerializer, UserSerializer
from django.contrib.auth.models import User


# Create your views here.


class CommentView(APIView):
    
    def get(self,request):
        comments = Comment.objects.all()
        serializer = CommentSerializer(comments, many=True)
        return Response({"comments": serializer.data})

    def post(self, request):
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Comment created successfully", "comment": serializer.data}, status=201)
        return Response(serializer.errors, status=400)
        

class UserRegister(APIView):

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered", "user": serializer.data}, status=201)
        return Response(serializer.errors, status=400)

# {"author":""}



class PostView(APIView):
    
    def get(self,request):
        posts = Post.objects.all()
        serializer = PostSerializer(posts, many=True)
        return Response({"posts": serializer.data})

    def post(self, request):
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Post created", "post": serializer.data}, status=201)
        return Response(serializer.errors, status=400)