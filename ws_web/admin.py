from django.contrib import admin

# Register your models here.
from ws_web.models import Tags, Participant

admin.site.register(Tags)
admin.site.register(Participant)
