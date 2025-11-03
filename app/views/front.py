from django.urls import path
from django.shortcuts import render

def home_view(request):
    return render(request, 'index.html')

def login_view(request):
    return render(request, 'login.html')

def register_view(request):
    return render(request, 'register.html')

def profile_view(request):
    return render(request, 'profile.html')

def post_view(request):
    return render(request, 'post.html')
