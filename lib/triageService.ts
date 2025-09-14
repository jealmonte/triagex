import { TriageClassifier, TriageFactors, TriageResult, TriageLevel } from './triageAlgorithm';
import { api } from './api';

export class TriageService {
  private classifier = new TriageClassifier();

  /**
   * Recalculate triage for a patient based on current data
   */
  async recalculatePatientTriage(patientId: string): Promise<TriageResult> {
    try {
      // Get patient data
      const patient = await api.getPatient(patientId);
      
      // Get latest vitals
      const vitalsResponse = await fetch(`http://127.0.0.1:8000/api/vitalsigns/?patient_id=${patientId}`);
      const vitals = await vitalsResponse.json();
      const latestVitals = vitals[vitals.length - 1];

      // Get paramedic actions
      const actionsResponse = await fetch(`http://127.0.0.1:8000/api/paramedic-actions/?patient_id=${patientId}`);
      const actions = await actionsResponse.json();

      // Build triage factors
      const factors: TriageFactors = {
        heartRate: latestVitals?.heart_rate,
        systolicBP: latestVitals?.bp_systolic,
        diastolicBP: latestVitals?.bp_diastolic,
        respiratoryRate: latestVitals?.respiratory_rate,
        temperature: latestVitals?.temperature,
        oxygenSaturation: latestVitals?.oxygen_saturation,
        consciousness: patient.consciousness,
        mechanism: patient.mechanism,
        visibleInjuries: patient.visible_injuries,
        selectedInjuries: patient.selected_injuries,
        chiefComplaint: patient.chief_complaint,
        actionCount: actions.length,
        emergencyActionCount: actions.filter((a: any) => a.action_type === 'emergency').length,
        medicationCount: actions.filter((a: any) => a.action_type === 'medication').length,
      };

      return this.classifier.classify(factors);
    } catch (error) {
      console.error('Error recalculating triage:', error);
      return {
        level: 'yellow',
        score: 0,
        reasoning: ['Error calculating triage - defaulting to urgent'],
      };
    }
  }

  /**
   * Apply manual triage override
   */
  async applyTriageOverride(patientId: string, newLevel: TriageLevel, reason?: string): Promise<void> {
    try {
      const override = {
        level: newLevel,
        timestamp: new Date(),
        reason: reason || 'Manual override by medical personnel',
        overriddenBy: 'current-user', // Replace with actual user ID
      };

      // Update patient in database
      await api.patchPatient(patientId, {
        triage_level: newLevel,
        triage_status: `Manual Override - ${newLevel.toUpperCase()}`,
      });

      // Store override in localStorage for UI sync
      const overrides = JSON.parse(localStorage.getItem('triageOverrides') || '{}');
      overrides[patientId] = override;
      localStorage.setItem('triageOverrides', JSON.stringify(overrides));

      // Trigger update
      window.dispatchEvent(new CustomEvent('triageXDataUpdated'));
    } catch (error) {
      console.error('Error applying triage override:', error);
      throw error;
    }
  }
}

export const triageService = new TriageService();