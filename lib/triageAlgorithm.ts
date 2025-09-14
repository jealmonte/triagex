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
  injurySeverityScore?: number;
}

export class TriageClassifier {
  
  // Critical injury patterns that warrant immediate red triage
  private criticalInjuryPatterns = [
    'head injury', 'brain injury', 'skull fracture', 'traumatic brain injury',
    'chest injury', 'pneumothorax', 'hemothorax', 'flail chest',
    'abdominal injury', 'internal bleeding', 'abdominal trauma',
    'spinal injury', 'spinal cord injury', 'neck injury',
    'massive bleeding', 'hemorrhage', 'arterial bleeding',
    'amputation', 'severed limb', 'major amputation',
    'multiple fractures', 'pelvic fracture', 'femur fracture'
  ];

  // High-energy mechanisms that increase injury severity
  private highEnergyMechanisms = [
    'motor vehicle accident', 'car accident', 'motorcycle accident',
    'fall from height', 'high speed collision', 'rollover',
    'gunshot', 'gsw', 'shooting', 'bullet wound',
    'stabbing', 'knife wound', 'penetrating trauma',
    'explosion', 'blast injury', 'crush injury',
    'hit by vehicle', 'pedestrian struck'
  ];

  /**
   * Calculate shock index with injury consideration
   * Traditional: SI = HR/SBP
   * Enhanced: Adjusts for injury patterns
   */
  private calculateEnhancedShockIndex(factors: TriageFactors): number {
    if (!factors.heartRate || !factors.systolicBP || factors.systolicBP === 0) {
      return 0;
    }
    
    let baseShockIndex = factors.heartRate / factors.systolicBP;
    
    // Adjust shock index based on injury patterns
    let injuryMultiplier = 1.0;
    
    if (factors.visibleInjuries && factors.selectedInjuries?.length) {
      const criticalInjuryCount = factors.selectedInjuries.filter(injury => 
        this.criticalInjuryPatterns.some(pattern => 
          injury.toLowerCase().includes(pattern.toLowerCase())
        )
      ).length;
      
      // Each critical injury increases the effective shock index
      injuryMultiplier += (criticalInjuryCount * 0.2);
      
      // Multiple injuries compound the effect
      if (factors.selectedInjuries.length > 3) {
        injuryMultiplier += 0.3;
      }
    }
    
    // High-energy mechanism increases shock index interpretation
    if (factors.mechanism) {
      const isHighEnergy = this.highEnergyMechanisms.some(mech => 
        factors.mechanism?.toLowerCase().includes(mech.toLowerCase())
      );
      if (isHighEnergy) {
        injuryMultiplier += 0.25;
      }
    }
    
    return baseShockIndex * injuryMultiplier;
  }

  /**
   * Calculate injury severity score based on anatomical regions and patterns
   */
  private calculateInjurySeverity(factors: TriageFactors): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    
    if (!factors.visibleInjuries || !factors.selectedInjuries?.length) {
      return { score: 0, reasons: ['No visible injuries reported'] };
    }
    
    // Categorize injuries by severity and body region
    const injuryCategories = {
      critical: { count: 0, regions: new Set() },
      severe: { count: 0, regions: new Set() },
      moderate: { count: 0, regions: new Set() }
    };
    
    factors.selectedInjuries.forEach(injury => {
      const injuryLower = injury.toLowerCase();
      
      // Critical injuries (6-9 points each)
      if (this.criticalInjuryPatterns.some(pattern => injuryLower.includes(pattern))) {
        injuryCategories.critical.count++;
        score += 7;
        
        // Identify body region
        if (injuryLower.includes('head') || injuryLower.includes('brain') || injuryLower.includes('skull')) {
          injuryCategories.critical.regions.add('head');
        } else if (injuryLower.includes('chest') || injuryLower.includes('thorax')) {
          injuryCategories.critical.regions.add('chest');
        } else if (injuryLower.includes('abdom') || injuryLower.includes('pelv')) {
          injuryCategories.critical.regions.add('abdomen');
        } else if (injuryLower.includes('spin') || injuryLower.includes('neck')) {
          injuryCategories.critical.regions.add('spine');
        }
        
        reasons.push(`Critical injury: ${injury}`);
      }
      // Severe injuries (3-5 points each)
      else if (injuryLower.includes('fracture') || injuryLower.includes('dislocation') || 
               injuryLower.includes('severe') || injuryLower.includes('deep laceration')) {
        injuryCategories.severe.count++;
        score += 4;
        reasons.push(`Severe injury: ${injury}`);
      }
      // Moderate injuries (1-2 points each)
      else {
        injuryCategories.moderate.count++;
        score += 1;
        reasons.push(`Moderate injury: ${injury}`);
      }
    });
    
    // Multiple body system involvement increases severity
    const totalRegions = injuryCategories.critical.regions.size + 
                         injuryCategories.severe.regions.size;
    
    if (totalRegions >= 3) {
      score += 5;
      reasons.push('Multiple body systems involved');
    } else if (totalRegions >= 2) {
      score += 3;
      reasons.push('Multiple body regions affected');
    }
    
    // Polytrauma bonus (multiple severe injuries)
    if (injuryCategories.critical.count >= 2) {
      score += 4;
      reasons.push('Multiple critical injuries (polytrauma)');
    } else if (injuryCategories.critical.count + injuryCategories.severe.count >= 3) {
      score += 2;
      reasons.push('Multiple significant injuries');
    }
    
    return { score: Math.min(score, 25), reasons }; // Cap at 25
  }

  /**
   * Enhanced vital signs scoring with injury context
   */
  private scoreVitalSigns(factors: TriageFactors): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Calculate enhanced shock index
    const enhancedSI = this.calculateEnhancedShockIndex(factors);
    
    if (enhancedSI > 0) {
      if (enhancedSI > 1.3) {
        score += 6;
        reasons.push(`Critical enhanced shock index: ${enhancedSI.toFixed(2)}`);
      } else if (enhancedSI > 1.0) {
        score += 4;
        reasons.push(`High enhanced shock index: ${enhancedSI.toFixed(2)}`);
      } else if (enhancedSI > 0.8) {
        score += 2;
        reasons.push(`Elevated enhanced shock index: ${enhancedSI.toFixed(2)}`);
      }
    }

    // Traditional vital signs scoring
    if (factors.heartRate) {
      if (factors.heartRate > 120 || factors.heartRate < 50) {
        score += 3;
        reasons.push(`Critical heart rate: ${factors.heartRate} BPM`);
      } else if (factors.heartRate > 100 || factors.heartRate < 60) {
        score += 1;
        reasons.push(`Abnormal heart rate: ${factors.heartRate} BPM`);
      }
    }

    if (factors.systolicBP) {
      if (factors.systolicBP < 90) {
        score += 4;
        reasons.push(`Hypotension: ${factors.systolicBP} mmHg`);
      } else if (factors.systolicBP < 110) {
        score += 2;
        reasons.push(`Low systolic BP: ${factors.systolicBP} mmHg`);
      } else if (factors.systolicBP > 180) {
        score += 2;
        reasons.push(`Severe hypertension: ${factors.systolicBP} mmHg`);
      }
    }

    if (factors.respiratoryRate) {
      if (factors.respiratoryRate > 30 || factors.respiratoryRate < 8) {
        score += 3;
        reasons.push(`Critical respiratory rate: ${factors.respiratoryRate}/min`);
      } else if (factors.respiratoryRate > 24 || factors.respiratoryRate < 12) {
        score += 1;
        reasons.push(`Abnormal respiratory rate: ${factors.respiratoryRate}/min`);
      }
    }

    if (factors.oxygenSaturation) {
      if (factors.oxygenSaturation < 90) {
        score += 4;
        reasons.push(`Critical oxygen saturation: ${factors.oxygenSaturation}%`);
      } else if (factors.oxygenSaturation < 95) {
        score += 2;
        reasons.push(`Low oxygen saturation: ${factors.oxygenSaturation}%`);
      }
    }

    return { score, reasons };
  }

  /**
   * Score consciousness and mechanism with injury correlation
   */
  private scoreConsciousnessAndMechanism(factors: TriageFactors): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Consciousness scoring
    if (factors.consciousness) {
      const consciousnessLower = factors.consciousness.toLowerCase();
      if (consciousnessLower.includes('unconscious') || 
          consciousnessLower.includes('unresponsive') ||
          consciousnessLower.includes('coma')) {
        score += 8;
        reasons.push('Patient unconscious/unresponsive');
      } else if (consciousnessLower.includes('confused') || 
                 consciousnessLower.includes('disoriented') ||
                 consciousnessLower.includes('altered')) {
        score += 4;
        reasons.push('Altered level of consciousness');
      } else if (consciousnessLower.includes('drowsy') || 
                 consciousnessLower.includes('lethargic')) {
        score += 2;
        reasons.push('Decreased alertness');
      }
    }

    // High-energy mechanism scoring
    if (factors.mechanism) {
      const isHighEnergy = this.highEnergyMechanisms.some(mech => 
        factors.mechanism?.toLowerCase().includes(mech.toLowerCase())
      );
      
      if (isHighEnergy) {
        score += 3;
        reasons.push(`High-energy mechanism: ${factors.mechanism}`);
      }
    }

    return { score, reasons };
  }

  /**
   * Score paramedic actions (indicates complexity/severity)
   */
  private scoreParamedicActions(factors: TriageFactors): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    if (factors.emergencyActionCount && factors.emergencyActionCount > 0) {
      score += factors.emergencyActionCount * 3;
      reasons.push(`${factors.emergencyActionCount} emergency intervention(s) performed`);
    }

    if (factors.medicationCount && factors.medicationCount > 0) {
      score += factors.medicationCount * 2;
      reasons.push(`${factors.medicationCount} medication(s) administered`);
    }

    if (factors.actionCount && factors.actionCount > 5) {
      score += 2;
      reasons.push('Multiple interventions required');
    }

    return { score, reasons };
  }

  /**
   * Main enhanced triage classification
   */
  public classify(factors: TriageFactors): TriageResult {
    const allReasons: string[] = [];
    let totalScore = 0;

    // Calculate injury severity score (most important factor)
    const injuryScore = this.calculateInjurySeverity(factors);
    totalScore += injuryScore.score * 1.5; // Weight injuries heavily
    allReasons.push(...injuryScore.reasons);

    // Calculate vital signs score
    const vitalScore = this.scoreVitalSigns(factors);
    totalScore += vitalScore.score;
    allReasons.push(...vitalScore.reasons);

    // Calculate consciousness and mechanism score
    const consciousnessScore = this.scoreConsciousnessAndMechanism(factors);
    totalScore += consciousnessScore.score;
    allReasons.push(...consciousnessScore.reasons);

    // Calculate paramedic actions score
    const actionScore = this.scoreParamedicActions(factors);
    totalScore += actionScore.score;
    allReasons.push(...actionScore.reasons);

    // Calculate enhanced shock index
    const enhancedShockIndex = this.calculateEnhancedShockIndex(factors);

    // Determine triage level based on total score and critical factors
    let level: TriageLevel = 'green';
    
    // Critical overrides (immediate red triage)
    if (factors.consciousness?.toLowerCase().includes('unconscious') ||
        factors.consciousness?.toLowerCase().includes('unresponsive') ||
        (factors.oxygenSaturation && factors.oxygenSaturation < 85) ||
        (factors.systolicBP && factors.systolicBP < 70) ||
        enhancedShockIndex > 1.4) {
      level = 'red';
      allReasons.unshift('Critical condition detected - immediate intervention required');
    }
    // Score-based triage levels
    else if (totalScore >= 15 || enhancedShockIndex > 1.0) {
      level = 'red';
    } else if (totalScore >= 8 || enhancedShockIndex > 0.8) {
      level = 'yellow';
    } else if (totalScore >= 3) {
      level = 'green';
    }

    // Special case: Multiple critical injuries always red
    if (factors.selectedInjuries && factors.selectedInjuries.length > 0) {
      const criticalInjuryCount = factors.selectedInjuries.filter(injury => 
        this.criticalInjuryPatterns.some(pattern => 
          injury.toLowerCase().includes(pattern.toLowerCase())
        )
      ).length;
      
      if (criticalInjuryCount >= 2) {
        level = 'red';
        if (!allReasons.some(r => r.includes('Critical condition'))) {
          allReasons.unshift('Multiple critical injuries - immediate care required');
        }
      }
    }

    return {
      level,
      score: Math.round(totalScore * 10) / 10,
      reasoning: allReasons.length > 0 ? allReasons : ['Standard assessment - no critical findings'],
      shockIndex: enhancedShockIndex > 0 ? Math.round(enhancedShockIndex * 100) / 100 : undefined,
      injurySeverityScore: injuryScore.score
    };
  }
}
