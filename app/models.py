from django.db import models
from django.contrib.auth.models import User


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Tag(BaseModel):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Post(BaseModel):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, related_name='user_posts', on_delete=models.CASCADE)
    tag = models.ManyToManyField(Tag, related_name='tagged_posts', blank=True)


    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']


class Comment(BaseModel):
    post = models.ForeignKey(Post,related_name='post_comments',on_delete=models.CASCADE)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')


    def __str__(self):
        return f"{self.content}"
    
    class Meta:
        ordering = ['created_at']