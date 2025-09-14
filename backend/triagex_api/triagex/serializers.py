from rest_framework import serializers
from .models import TraumaSite, Patient, VitalSign, ParamedicAction

class PatientSerializer(serializers.ModelSerializer):
    site = serializers.PrimaryKeyRelatedField(queryset=TraumaSite.objects.all(), required=False, allow_null=True)
    name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    triage_level = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    triage_status = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    # **UPDATED AGE FIELD** - Handle blank values properly
    age = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=150)
    gender = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    chief_complaint = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    chief_complaint_other = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    consciousness = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    mechanism = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    mechanism_other = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    visible_injuries = serializers.BooleanField(required=False)
    selected_injuries = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)
    medical_alert = serializers.BooleanField(required=False)
    allergies_history = serializers.BooleanField(required=False)
    allergies_details = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Patient
        fields = [
            'id',
            'site',
            'name',
            'triage_level',
            'triage_status',
            'age',
            'gender',
            'chief_complaint',
            'chief_complaint_other',
            'consciousness',
            'mechanism',
            'mechanism_other',
            'visible_injuries',
            'selected_injuries',
            'medical_alert',
            'allergies_history',
            'allergies_details',
            'created_at'
        ]
    
    def validate_age(self, value):
        """Custom validation for age field - convert empty strings to None"""
        # Handle empty strings and convert to None
        if value == '' or value == 0:
            return None
        if value is not None and (value < 0 or value > 150):
            raise serializers.ValidationError("Age must be between 0 and 150.")
        return value
    
    def to_internal_value(self, data):
        """Override to handle empty age values before validation"""
        # Convert empty string age to None before processing
        if 'age' in data and (data['age'] == '' or data['age'] == '0'):
            data['age'] = None
        return super().to_internal_value(data)

class TraumaSiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TraumaSite
        fields = '__all__'

class VitalSignSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalSign
        fields = '__all__'

class ParamedicActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParamedicAction
        fields = '__all__'
