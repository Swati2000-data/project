from django.shortcuts import render


def chess_game(request):
    return render(request, 'games/chess.html')