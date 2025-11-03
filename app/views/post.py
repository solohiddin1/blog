from django.shortcuts import render
from rest_framework.views import APIView
from ..models import Post, Comment
from rest_framework.response import Response
from ..serializers import CommentSerializer, PostSerializer, UserSerializer
from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ..pagination import CustomPagination

class PostView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination


    def get(self,request):
        paginator = self.pagination_class()
        result = paginator.paginate_queryset(Post.objects.all(), request)
        serializer = PostSerializer(result, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response({"message": "Post created", "post": serializer.data}, status=201)
        return Response(serializer.errors, status=400)
    

class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({"error": "post does not exist"}, status=404)

        serializer = PostSerializer(post)
        return Response(serializer.data)

    def put(self,request,pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({"error":"post does not exist"},status=404)
        if post.author != request.user:
            return Response({"error":"you cant update"})
        serializer = PostSerializer(instance=post,data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message":"post updated"},status=200)
        return Response({"error":serializer.errors},status=400)
    
    def delete(self,request,pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({"error":"post does not exist"},status=404)
        if post.author != request.user:
            return Response({"error":"you cant update"})
        post.delete()
        return Response({"message":"post deleted"},status=200)
    