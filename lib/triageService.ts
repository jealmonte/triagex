import { TriageClassifier, TriageFactors, TriageResult, TriageLevel } from './triageAlgorithm';
import { api } from './api';

export class TriageService {
  private classifier = new TriageClassifier();

  /**
   * Map triage level to status consistently
   */
  private mapTriageLevelToStatus(level: TriageLevel): string {
    switch (level) {
      case 'red': return 'Critical';
      case 'yellow': return 'Stable';
      case 'green': return 'Improving';
      case 'black': return 'Deceased';
      default: return 'Stable';
    }
  }

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

      // Build triage factors with enhanced injury data
      const factors: TriageFactors = {
        heartRate: latestVitals?.heart_rate,
        systolicBP: latestVitals?.bp_systolic,
        diastolicBP: latestVitals?.bp_diastolic,
        respiratoryRate: latestVitals?.respiratory_rate,
        temperature: latestVitals?.temperature,
        oxygenSaturation: latestVitals?.oxygen_saturation,
        consciousness: patient.consciousness,
        mechanism: patient.mechanism || patient.mechanism_other,
        visibleInjuries: patient.visible_injuries,
        selectedInjuries: patient.selected_injuries || [],
        chiefComplaint: patient.chief_complaint || patient.chief_complaint_other,
        actionCount: actions.length,
        emergencyActionCount: actions.filter((a: any) => 
          a.action_type === 'emergency' || 
          a.action.toLowerCase().includes('emergency') ||
          a.action.toLowerCase().includes('critical')
        ).length,
        medicationCount: actions.filter((a: any) => a.action_type === 'medication').length,
      };

      const triageResult = this.classifier.classify(factors);

      // Update patient with new triage level and status
      await api.patchPatient(patientId, {
        triage_level: triageResult.level,
        triage_status: this.mapTriageLevelToStatus(triageResult.level),
      });

      // Store triage result in localStorage for UI sync
      const triageResults = JSON.parse(localStorage.getItem('triageResults') || '{}');
      triageResults[patientId] = {
        ...triageResult,
        timestamp: new Date(),
        isAutoCalculated: true
      };
      localStorage.setItem('triageResults', JSON.stringify(triageResults));

      // Trigger update
      window.dispatchEvent(new CustomEvent('triageXDataUpdated'));

      return triageResult;
    } catch (error) {
      console.error('Error recalculating triage:', error);
      return {
        level: 'yellow',
        score: 0,
        reasoning: ['Error calculating triage - defaulting to stable'],
      };
    }
  }

  /**
   * Apply manual triage override
   */
  async applyTriageOverride(patientId: string, newLevel: TriageLevel, reason?: string): Promise<void> {
    try {
      const newStatus = this.mapTriageLevelToStatus(newLevel);
      
      const override = {
        level: newLevel,
        status: newStatus,
        timestamp: new Date(),
        reason: reason || 'Manual override by medical personnel',
        overriddenBy: 'current-user', // Replace with actual user ID
        isManualOverride: true
      };

      // Update patient in database
      await api.patchPatient(patientId, {
        triage_level: newLevel,
        triage_status: newStatus,
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

  /**
   * Calculate triage for new patient data
   */
  calculateTriageForPatientData(patientData: any, vitals?: any, actions?: any[]): TriageResult {
    const factors: TriageFactors = {
      heartRate: vitals?.heart_rate || vitals?.heartRate,
      systolicBP: vitals?.bp_systolic || vitals?.bpSystolic,
      diastolicBP: vitals?.bp_diastolic || vitals?.bpDiastolic,
      respiratoryRate: vitals?.respiratory_rate || vitals?.respiratoryRate,
      temperature: vitals?.temperature,
      oxygenSaturation: vitals?.oxygen_saturation || vitals?.oxygenSaturation,
      consciousness: patientData.consciousness,
      mechanism: patientData.mechanism || patientData.mechanism_other,
      visibleInjuries: patientData.visible_injuries || patientData.visibleInjuries,
      selectedInjuries: patientData.selected_injuries || patientData.selectedInjuries || [],
      chiefComplaint: patientData.chief_complaint || patientData.chiefComplaint || patientData.chief_complaint_other,
      actionCount: actions?.length || 0,
      emergencyActionCount: actions?.filter(a => 
        a.action_type === 'emergency' || 
        a.actionType === 'emergency'
      ).length || 0,
      medicationCount: actions?.filter(a => 
        a.action_type === 'medication' || 
        a.actionType === 'medication'
      ).length || 0,
    };

    return this.classifier.classify(factors);
  }
}

export const triageService = new TriageService();
