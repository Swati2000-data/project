from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('games/', include('games.urls')),
    path('', RedirectView.as_view(
        url='/games/chess/',
        permanent=False
    )),
]