from django.urls import path
from . import views

urlpatterns = [
    path('chess/', views.chess_game, name='chess'),
]