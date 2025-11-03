from rest_framework.views import APIView
from ..models import Post, Comment
from rest_framework.response import Response
from ..serializers import CommentSerializer
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from ..pagination import CustomPagination

class CommentView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination


    def get(self,request):
        paginator = self.pagination_class()
        # allow filtering comments by post id via query param `post`
        post_id = request.GET.get('post')
        queryset = Comment.objects.all()
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        result = paginator.paginate_queryset(queryset, request)
        serializer = CommentSerializer(result, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        data['author'] = request.user.id
        print(data)
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response({"message": "Comment created", "comment": serializer.data}, status=201)
        return Response(serializer.errors, status=400)



class CommentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self,request, pk):
        try:
            comment = Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
            return Response({"error":"comment not found"},status=404)

        if comment.author != request.user:
            return Response({"error":"you cannot update"},status=403)
        
        serializer = CommentSerializer(instance=comment,data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "comment updated", "comment": serializer.data}, status=200)
        return Response(serializer.errors, status=400)

    def delete(self,request,pk):
        try:
            comment = Comment.objects.get(pk=pk)
        except Comment.DoesNotExist:
                return Response({"error":"comment not found"},status=404)
        if comment.author != request.user:
            return Response({"error":"you cannot delete"},status=403)
        comment.delete()
        return Response({"message":"comment deleted"},status=200)