from rest_framework.views import APIView
from ..models import Post, Tag
from rest_framework.response import Response
from ..serializers import CommentSerializer, PostSerializer
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
        author = request.user.id
        data = request.data.copy()
        data['author'] = author
        # ensure tags exist (allow creating tags on the fly)
        tags = data.get('tag') or []
        if isinstance(tags, list):
            for t in tags:
                if isinstance(t, str) and t.strip():
                    Tag.objects.get_or_create(name=t.strip())
        serializer = PostSerializer(data=data)
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
        # if tags provided, ensure they exist so serializer can accept them by name
        tags = request.data.get('tag') or []
        if isinstance(tags, list):
            for t in tags:
                if isinstance(t, str) and t.strip():
                    Tag.objects.get_or_create(name=t.strip())
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
    

class PostsByTag(APIView):
    def get(self,requst,tag_name):
        # tag = requst.GET.get('tag')

        tags = Tag.objects.get(name=tag_name)

        # get posts with tag name
        posts = tags.tagged_posts.all()
        serializer = PostSerializer(posts,many=True)
        return Response(serializer.data)