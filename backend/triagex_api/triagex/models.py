from django.db import models

# Create your models here.
class TraumaSite(models.Model):
    name = models.CharField(max_length=100)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    address = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name    
    
class Patient(models.Model):
    name = models.CharField(max_length=255)
    triage_level = models.CharField(max_length=10)
    triage_status = models.CharField(max_length=50)
    site = models.ForeignKey(TraumaSite, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    # Add the questionnaire fields
    age = models.IntegerField(blank=True, null=True, default=None)  # Changed to IntegerField
    gender = models.CharField(max_length=20, blank=True, default='')
    chief_complaint = models.CharField(max_length=50, blank=True, default='')
    chief_complaint_other = models.CharField(max_length=200, blank=True, default='')
    consciousness = models.CharField(max_length=50, blank=True, default='')
    mechanism = models.CharField(max_length=50, blank=True, default='')
    mechanism_other = models.CharField(max_length=200, blank=True, default='')
    visible_injuries = models.BooleanField(default=False)
    selected_injuries = models.JSONField(blank=True, default=list)
    medical_alert = models.BooleanField(default=False)
    allergies_history = models.BooleanField(default=False)
    allergies_details = models.TextField(blank=True, default='')

class VitalSign(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='vital_signs')
    timestamp = models.DateTimeField(auto_now_add=True)
    heart_rate = models.FloatField(null=True, blank=True)
    bp_systolic = models.FloatField(null=True, blank=True)
    bp_diastolic = models.FloatField(null=True, blank=True)
    respiratory_rate = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    oxygen_saturation = models.FloatField(null=True, blank=True)
    source = models.CharField(max_length=20, default='device')  # e.g. 'esp32', 'manual'

class ParamedicAction(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='paramedic_actions')
    timestamp = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=255)
    action_type = models.CharField(max_length=50)
    details = models.TextField(blank=True)
    source = models.CharField(max_length=50, default='trauma-site')
