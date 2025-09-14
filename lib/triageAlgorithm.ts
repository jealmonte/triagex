// lib/triageAlgorithm.ts
export interface TriageFactors {
  // Vital signs
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  
  // Questionnaire responses
  consciousness?: string;
  mechanism?: string;
  visibleInjuries?: boolean;
  selectedInjuries?: string[];
  chiefComplaint?: string;
  
  // Actions performed
  actionCount?: number;
  emergencyActionCount?: number;
  medicationCount?: number;
}

export type TriageLevel = 'red' | 'yellow' | 'green' | 'black';

export interface TriageResult {
  level: TriageLevel;
  score: number;
  reasoning: string[];
  shockIndex?: number;
}

export class TriageClassifier {
  
  /**
   * Calculate shock index (Heart Rate / Systolic BP)
   * Normal: 0.5-0.7
   * Concerning: 0.7-1.0  
   * Critical: >1.0
   */
  private calculateShockIndex(heartRate: number, systolicBP: number): number {
    if (!heartRate || !systolicBP || systolicBP === 0) return 0;
    return heartRate / systolicBP;
  }

  /**
   * Score vital signs based on normal ranges
   */
  private scoreVitalSigns(factors: TriageFactors): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Heart Rate scoring
    if (factors.heartRate) {
      if (factors.heartRate > 120 || factors.heartRate < 50) {
        score += 3;
        reasons.push(`Critical heart rate: ${factors.heartRate} BPM`);
      } else if (factors.heartRate > 100 || factors.heartRate < 60) {
        score += 2;
        reasons.push(`Abnormal heart rate: ${factors.heartRate} BPM`);
      }
    }

    // Blood Pressure scoring
    if (factors.systolicBP && factors.diastolicBP) {
      if (factors.systolicBP < 90 || factors.systolicBP > 180) {
        score += 3;
        reasons.push(`Critical systolic BP: ${factors.systolicBP} mmHg`);
      } else if (factors.systolicBP < 110 || factors.systolicBP > 140) {
        score += 1;
        reasons.push(`Concerning systolic BP: ${factors.systolicBP} mmHg`);
      }

      if (factors.diastolicBP > 110 || factors.diastolicBP < 60) {
        score += 2;
        reasons.push(`Abnormal diastolic BP: ${factors.diastolicBP} mmHg`);
      }
    }

    // Respiratory Rate scoring
    if (factors.respiratoryRate) {
      if (factors.respiratoryRate > 30 || factors.respiratoryRate < 8) {
        score += 3;
        reasons.push(`Critical respiratory rate: ${factors.respiratoryRate}/min`);
      } else if (factors.respiratoryRate > 24 || factors.respiratoryRate < 12) {
        score += 2;
        reasons.push(`Abnormal respiratory rate: ${factors.respiratoryRate}/min`);
      }
    }

    // Temperature scoring
    if (factors.temperature) {
      if (factors.temperature > 103 || factors.temperature < 95) {
        score += 3;
        reasons.push(`Critical temperature: ${factors.temperature}°F`);
      } else if (factors.temperature > 100.4 || factors.temperature < 97) {
        score += 1;
        reasons.push(`Abnormal temperature: ${factors.temperature}°F`);
      }
    }

    // Oxygen Saturation scoring
    if (factors.oxygenSaturation) {
      if (factors.oxygenSaturation < 90) {
        score += 3;
        reasons.push(`Critical oxygen saturation: ${factors.oxygenSaturation}%`);
      } else if (factors.oxygenSaturation < 95) {
        score += 2;
        reasons.push(`Low oxygen saturation: ${factors.oxygenSaturation}%`);
      }
    }

    return { score, reasons };
  }

  /**
   * Score questionnaire responses
   */
  private scoreQuestionnaire(factors: TriageFactors): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Consciousness level
    if (factors.consciousness) {
      switch (factors.consciousness.toLowerCase()) {
        case 'unconscious':
        case 'unresponsive':
          score += 4;
          reasons.push('Patient unconscious/unresponsive');
          break;
        case 'confused':
        case 'disoriented':
          score += 2;
          reasons.push('Altered consciousness');
          break;
        case 'drowsy':
          score += 1;
          reasons.push('Decreased alertness');
          break;
      }
    }

    // Mechanism of injury
    if (factors.mechanism) {
      const highEnergyMechanisms = ['motor vehicle accident', 'fall from height', 'gunshot', 'stabbing', 'explosion'];
      if (highEnergyMechanisms.some(mech => factors.mechanism?.toLowerCase().includes(mech))) {
        score += 2;
        reasons.push('High-energy mechanism of injury');
      }
    }

    // Visible injuries
    if (factors.visibleInjuries && factors.selectedInjuries?.length) {
      const criticalInjuries = ['head injury', 'chest injury', 'abdominal injury', 'multiple fractures'];
      const criticalCount = factors.selectedInjuries.filter(injury => 
        criticalInjuries.some(critical => injury.toLowerCase().includes(critical))
      ).length;

      if (criticalCount >= 2) {
        score += 3;
        reasons.push('Multiple critical injuries identified');
      } else if (criticalCount === 1) {
        score += 2;
        reasons.push('Critical injury identified');
      } else if (factors.selectedInjuries.length > 3) {
        score += 1;
        reasons.push('Multiple injuries present');
      }
    }

    // Chief complaint
    if (factors.chiefComplaint) {
      const criticalComplaints = ['chest pain', 'difficulty breathing', 'severe bleeding', 'loss of consciousness'];
      if (criticalComplaints.some(complaint => factors.chiefComplaint?.toLowerCase().includes(complaint))) {
        score += 2;
        reasons.push('Critical chief complaint');
      }
    }

    return { score, reasons };
  }

  /**
   * Score paramedic actions performed
   */
  private scoreActions(factors: TriageFactors): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Emergency actions indicate severity
    if (factors.emergencyActionCount && factors.emergencyActionCount > 0) {
      score += factors.emergencyActionCount * 2;
      reasons.push(`${factors.emergencyActionCount} emergency interventions performed`);
    }

    // Multiple actions suggest complex case
    if (factors.actionCount && factors.actionCount > 5) {
      score += 2;
      reasons.push('Multiple interventions required');
    } else if (factors.actionCount && factors.actionCount > 3) {
      score += 1;
      reasons.push('Several interventions performed');
    }

    // Medications given
    if (factors.medicationCount && factors.medicationCount > 0) {
      score += factors.medicationCount;
      reasons.push(`${factors.medicationCount} medications administered`);
    }

    return { score, reasons };
  }

  /**
   * Main triage classification function
   */
  public classify(factors: TriageFactors): TriageResult {
    const allReasons: string[] = [];
    let totalScore = 0;

    // Calculate shock index
    let shockIndex = 0;
    if (factors.heartRate && factors.systolicBP) {
      shockIndex = this.calculateShockIndex(factors.heartRate, factors.systolicBP);
      
      if (shockIndex > 1.0) {
        totalScore += 4;
        allReasons.push(`Critical shock index: ${shockIndex.toFixed(2)} (>1.0)`);
      } else if (shockIndex > 0.9) {
        totalScore += 3;
        allReasons.push(`High shock index: ${shockIndex.toFixed(2)} (>0.9)`);
      } else if (shockIndex > 0.7) {
        totalScore += 2;
        allReasons.push(`Elevated shock index: ${shockIndex.toFixed(2)} (>0.7)`);
      }
    }

    // Score vital signs
    const vitalScore = this.scoreVitalSigns(factors);
    totalScore += vitalScore.score;
    allReasons.push(...vitalScore.reasons);

    // Score questionnaire
    const questionnaireScore = this.scoreQuestionnaire(factors);
    totalScore += questionnaireScore.score;
    allReasons.push(...questionnaireScore.reasons);

    // Score actions
    const actionScore = this.scoreActions(factors);
    totalScore += actionScore.score;
    allReasons.push(...actionScore.reasons);

    // Determine triage level based on total score
    let level: TriageLevel;
    if (totalScore >= 10) {
      level = 'red';
    } else if (totalScore >= 6) {
      level = 'yellow';
    } else if (totalScore >= 1) {
      level = 'green';
    } else {
      level = 'green'; // Default to green for minimal/no concerns
    }

    // Override logic for critical situations
    if (factors.consciousness === 'unconscious' || 
        (factors.oxygenSaturation && factors.oxygenSaturation < 85) ||
        (factors.systolicBP && factors.systolicBP < 70) ||
        (shockIndex > 1.2)) {
      level = 'red';
      if (!allReasons.includes('Critical condition detected')) {
        allReasons.unshift('Critical condition detected');
      }
    }

    return {
      level,
      score: totalScore,
      reasoning: allReasons.length > 0 ? allReasons : ['Standard triage assessment'],
      shockIndex: shockIndex > 0 ? shockIndex : undefined
    };
  }
}
