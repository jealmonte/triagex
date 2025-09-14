from django.shortcuts import render
from rest_framework import viewsets
from .models import TraumaSite, Patient, VitalSign, ParamedicAction
from .serializers import TraumaSiteSerializer, PatientSerializer, VitalSignSerializer, ParamedicActionSerializer

# Standard ViewSets
class TraumaSiteViewSet(viewsets.ModelViewSet):
    queryset = TraumaSite.objects.all().order_by("-created_at")
    serializer_class = TraumaSiteSerializer

class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer

    def get_queryset(self):
        qs = Patient.objects.all().order_by("-created_at")
        site = self.request.query_params.get("site")
        if site:
            qs = qs.filter(site_id=site)
        return qs
    
class VitalSignViewSet(viewsets.ModelViewSet):
    serializer_class = VitalSignSerializer

    def get_queryset(self):
        queryset = VitalSign.objects.all()
        patient_id = self.request.query_params.get('patient_id')
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id).order_by('timestamp')
        return queryset

class ParamedicActionViewSet(viewsets.ModelViewSet):
    serializer_class = ParamedicActionSerializer

    def get_queryset(self):
        queryset = ParamedicAction.objects.all()
        patient_id = self.request.query_params.get('patient_id')
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id).order_by('timestamp')
        return queryset
    
    def create(self, request, *args, **kwargs):
        print("Received data:", request.data)  # Debug log
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)  # Debug log
        return super().create(request, *args, **kwargs)

# ----- Gemini AI Summary Endpoint -----
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
import os
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@csrf_exempt
def ai_summary(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        # Parse request data
        data = json.loads(request.body)
        patient_data = data.get("patientData")
        
        if not patient_data:
            return JsonResponse({"error": "Missing patientData"}, status=400)

        # Get API key
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("GEMINI_API_KEY not found in environment variables")
            return JsonResponse({"error": "API key not configured"}, status=500)

        # Import and configure Gemini
        try:
            import google.generativeai as genai
        except ImportError:
            print("google-generativeai package not installed")
            return JsonResponse({"error": "Gemini API package not available"}, status=500)

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        # Extract patient information for the prompt
        patient_info = patient_data.get('patientInfo', {})
        vital_signs = patient_data.get('vitalSigns', [])
        timeline = patient_data.get('timeline', [])

        # Debug logging
        print(f"Patient Info: {patient_info}")
        print(f"Vital Signs Count: {len(vital_signs)}")
        print(f"Timeline Count: {len(timeline)}")

        # Format vital signs data
        vitals_text = ""
        if vital_signs:
            vitals_text = "\n\nVITAL SIGNS DATA:\n"
            for i, vital in enumerate(vital_signs[-5:]):  # Last 5 readings
                vitals_text += f"Reading {i+1} ({vital.get('timestamp', 'Unknown time')}):\n"
                vitals_text += f"  - Heart Rate: {vital.get('heartRate', 'N/A')} BPM\n"
                vitals_text += f"  - Blood Pressure: {vital.get('bpSystolic', 'N/A')}/{vital.get('bpDiastolic', 'N/A')} mmHg\n"
                vitals_text += f"  - SpO2: {vital.get('oxygenSaturation', 'N/A')}%\n"
                vitals_text += f"  - Respiratory Rate: {vital.get('respiratoryRate', 'N/A')}/min\n"
                vitals_text += f"  - Temperature: {vital.get('temperature', 'N/A')}°F\n"
                vitals_text += f"  - Source: {vital.get('source', 'Unknown')}\n\n"

        # Format timeline data
        timeline_text = ""
        if timeline:
            timeline_text = "PARAMEDIC ACTIONS:\n"
            for action in timeline:
                timeline_text += f"- {action.get('timestamp', 'Unknown time')}: {action.get('action', 'Unknown action')}\n"
                timeline_text += f"  Type: {action.get('actionType', 'Unknown')}\n"
                timeline_text += f"  Details: {action.get('details', 'No details')}\n"
                timeline_text += f"  Source: {action.get('source', 'Unknown')}\n\n"

        # Create a comprehensive prompt with actual data
        prompt = f"""
        You are a medical AI assistant helping hospital physicians review trauma patient data.
        
        Generate a concise clinical summary for the following patient:
        
        PATIENT INFORMATION:
        - Name: {patient_info.get('name', 'Unknown')}
        - Age: {patient_info.get('age', 'Unknown')}
        - Gender: {patient_info.get('gender', 'Unknown')}
        - Status: {patient_info.get('status', 'Unknown')}
        - Initial Complaint: {patient_info.get('initialComplaint', 'Not specified')}
        - Trauma Site: {patient_info.get('traumaSiteName', 'Unknown')}
        - ETA: {patient_info.get('eta', 'Unknown')} minutes
        
        {vitals_text}
        
        {timeline_text}
        
        Based on the above data, please provide:
        1. Current patient status assessment
        2. Key vital signs trends and concerns (if available)
        3. Summary of paramedic interventions performed
        4. Critical recommendations for hospital preparation
        5. Any red flags or immediate concerns
        
        Keep the summary concise but comprehensive for emergency physicians.
        Do not use markdown formatting in your response. Keep it plain text.
        """

        # Generate content
        response = model.generate_content(prompt)
        
        # Extract response text
        summary_text = ""
        if hasattr(response, 'text') and response.text:
            summary_text = response.text
        elif hasattr(response, 'candidates') and response.candidates:
            if response.candidates[0].content.parts:
                summary_text = response.candidates[0].content.parts[0].text
        else:
            summary_text = "No summary could be generated at this time."

        return JsonResponse({"summary": summary_text})

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    except Exception as e:
        # Log the full error for debugging
        print("AI Summary Error:", str(e))
        print("Traceback:", traceback.format_exc())
        return JsonResponse({"error": f"Internal server error: {str(e)}"}, status=500)
