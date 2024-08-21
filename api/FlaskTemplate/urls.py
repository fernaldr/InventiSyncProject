from django.urls import path, include
from FlaskTemplate.Main import home
urlpatterns = [
    path('', home),
    path('', include('FlaskTemplate.Main'))
]
