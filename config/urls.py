# config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('maintenance.urls')),    # maintenance 앱의 URLs 포함
]