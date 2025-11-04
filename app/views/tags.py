from rest_framework.views import APIView
from ..models import Post, Tag
from rest_framework.response import Response
from ..serializers import CommentSerializer, PostSerializer, TagSerializer
from rest_framework.permissions import IsAuthenticated
from ..pagination import CustomPagination


class TagView(APIView):
    def get(self,request):
        tags = Tag.objects.all()
        serializer = TagSerializer(tags,many=True)
        return Response(serializer.data)
