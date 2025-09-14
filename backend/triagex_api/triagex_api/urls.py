"""
URL configuration for triagex_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/

Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from triagex.views import TraumaSiteViewSet, PatientViewSet, VitalSignViewSet, ParamedicActionViewSet, ai_summary

router = routers.DefaultRouter()
router.register(r'trauma-sites', TraumaSiteViewSet, basename='traumasite')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'vitalsigns', VitalSignViewSet, basename='vitalsign')
router.register(r'paramedic-actions', ParamedicActionViewSet, basename='paramedicaction')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/ai-summary/', ai_summary, name='ai-summary'),  # <-- Gemini AI summary endpoint
]
