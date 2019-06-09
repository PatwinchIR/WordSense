from django.contrib import admin

# Register your models here.
from ws_web.models import Tags, Participant


class TagsAdmin(admin.ModelAdmin):
    list_display = ['gloss_with_replacement', 'token', 'sense', 'fixed_pos', 'participant']
    readonly_fields = ['gloss_with_replacement', 'token', 'sense', 'fixed_pos', 'participant']


class ParticipantAdmin(admin.ModelAdmin):
    list_display = ['user', 'user_type', 'browser_display_lang', 'browser_user_agent', 'browser_platform', 'ip']
    readonly_fields = ['user', 'user_type', 'browser_display_lang', 'browser_user_agent', 'browser_platform', 'ip']


admin.site.register(Tags, TagsAdmin)
admin.site.register(Participant, ParticipantAdmin)
