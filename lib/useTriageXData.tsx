import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { TriageLevel, TriageResult } from '@/lib/triageAlgorithm';

// TypeScript interfaces matching your trauma site data structure
interface TraumaSite {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  createdAt: Date;
  patientCount: number;
}

interface TraumaSitePatient {
  id: string;
  name: string;
  triageLevel: "red" | "yellow" | "green" | "black";
  triageStatus: string;
  siteId: string;
  createdAt: Date;
  // Add these missing fields:
  age?: number;
  gender?: string;
  chiefComplaint?: string;
  caseId?: string;
  paramedicUnit?: string;
  eta?: number;
}

interface TraumaSitePatientWithVitals extends TraumaSitePatient {
  vitals?: VitalSigns[];
  timeline?: ParamedicAction[];
  // Add these fields:
  age?: number;
  gender?: string;
  chiefComplaint?: string;
  eta?: number;
}

interface PatientWithTriage extends TraumaSitePatient {
  triageResult?: TriageResult;
  manualTriageOverride?: {
    level: TriageLevel;
    timestamp: Date;
    reason?: string;
    overriddenBy?: string;
  };
}

// Hospital dashboard interfaces
interface HospitalPatientInfo {
  id: string;
  name: string;
  age: number;
  gender: string;
  caseId: string;
  paramedicUnit: string;
  status: 'Critical' | 'Stable' | 'Improving' | 'Deceased';
  initialComplaint: string;
  eta?: number;
  traumaSiteId: string;
  traumaSiteName: string;
  lastUpdate: Date;
}

interface VitalSigns {
  timestamp: Date;
  heartRate: number;
  bpSystolic: number;
  bpDiastolic: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
  source?: 'manual' | 'device' | 'estimated';
}

interface ParamedicAction {
  timestamp: Date;
  action: string;
  actionType: 'assessment' | 'treatment' | 'medication' | 'transport' | 'emergency';
  details: string;
  vitals?: Partial<VitalSigns>;
  paramedicId?: string;
  source?: 'trauma-site' | 'dashboard' | 'device';
}

interface HospitalPatientData {
  patientInfo: HospitalPatientInfo;
  vitalSigns: VitalSigns[];
  timeline: ParamedicAction[];
}

// Custom hook to sync with trauma site data
export const useTriageXData = () => {
  const [sites, setSites] = useState<TraumaSite[]>([]);
  const [patients, setPatients] = useState<TraumaSitePatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to convert trauma site data to hospital dashboard format
// In useTriageXData.tsx
const convertToHospitalFormat = (
  sites: TraumaSite[], 
  patients: TraumaSitePatientWithVitals[]
): HospitalPatientData[] => {
  const getStatusFromTriage = (triageLevel: string): HospitalPatientInfo['status'] => {
    switch (triageLevel.toLowerCase()) {
      case 'red': return 'Critical';
      case 'yellow': return 'Stable';  // Changed from 'Urgent' to match your system
      case 'green': return 'Improving'; // Changed from 'Minor' to match your system
      case 'black': return 'Deceased';
      default: return 'Stable';
    }
  };

  return patients.map((patient) => {
    const site = sites.find(s => s.id === patient.siteId);
    
    const hospitalPatientInfo: HospitalPatientInfo = {
      id: patient.id,
      name: patient.name,
      age: patient.age || 0, // **CHANGE THIS LINE** - use actual age from patient data
      gender: patient.gender || 'Unknown',
      caseId: `Case-${patient.id}`,
      paramedicUnit: `Unit-${patient.siteId}`,
      status: getStatusFromTriage(patient.triageLevel),
      initialComplaint: patient.chiefComplaint || 'Not specified',
      eta: patient.eta,
      traumaSiteId: patient.siteId,
      traumaSiteName: site?.name || 'Unknown Site',
      lastUpdate: patient.createdAt
    };

    return {
      patientInfo: hospitalPatientInfo,
      vitalSigns: patient.vitals ?? [],
      timeline: patient.timeline ?? []
    };
  });
};


const fetchVitals = async (patientId: string): Promise<VitalSigns[]> => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/vitalsigns/?patient_id=${patientId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch vitals for patient ${patientId}: ${response.statusText}`);
    }
    const data = await response.json();
    // Map backend data properties to frontend interface
    return data.map((v: any) => ({
      timestamp: new Date(v.timestamp),
      heartRate: v.heart_rate || 0,
      bpSystolic: v.bp_systolic || 0,
      bpDiastolic: v.bp_diastolic || 0,
      respiratoryRate: v.respiratory_rate || 0,
      temperature: v.temperature || 0,
      oxygenSaturation: v.oxygen_saturation || 0,
      source: v.source || 'device',
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

const fetchParamedicActions = async (patientId: string): Promise<ParamedicAction[]> => {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/paramedic-actions/?patient_id=${patientId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch paramedic actions for patient ${patientId}: ${response.statusText}`);
    }
    const data = await response.json();
    // Map backend data properties to frontend interface
    return data.map((action: any) => ({
      timestamp: new Date(action.timestamp),
      action: action.action,
      actionType: action.action_type as 'assessment' | 'treatment' | 'medication' | 'transport' | 'emergency',
      details: action.details,
      source: action.source as 'trauma-site' | 'dashboard' | 'device',
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
};

const loadData = async () => {
  setIsLoading(true);
  try {
    const rawSites = await api.listSites();
    const rawPatients = await api.listPatients();

    const sites = rawSites.map((site: any) => ({
      id: site.id.toString(),
      name: site.name,
      location: {
        lat: site.latitude || 0,
        lng: site.longitude || 0,
        address: site.address || '',
      },
      createdAt: site.created_at ? new Date(site.created_at) : new Date(),
      patientCount: 0,
    }));

    // For each raw patient, fetch the vitals and paramedic actions asynchronously
    const patients: TraumaSitePatientWithVitals[] = await Promise.all(
      rawPatients.map(async (patient) => {
        console.log('Raw patient data:', patient); // Debug log to see what's coming from API
        
        const vitals = await fetchVitals(patient.id.toString());
        const timeline = await fetchParamedicActions(patient.id.toString());
        
        const mappedPatient = {
          id: patient.id.toString(),
          name: patient.name,
          triageLevel: patient.triage_level,
          triageStatus: patient.triage_status,
          siteId: patient.site.toString(),
          createdAt: patient.created_at ? new Date(patient.created_at) : new Date(),
          // **ADD THESE LINES** - map the age and other fields from backend
          age: patient.age || 0,
          gender: patient.gender || 'Unknown',
          chiefComplaint: patient.chief_complaint || 'Not specified',
          eta: undefined, // You can calculate this or get it from backend
          vitals,
          timeline,
        };
        
        console.log('Mapped patient with age:', mappedPatient.age); // Debug log
        return mappedPatient;
      })
    );

    setSites(sites);
    setPatients(patients);
  } catch (error) {
    console.error('Error loading TriageX data:', error);
  } finally {
    setIsLoading(false);
  }
};



  // Listen for localStorage changes (real-time sync)
  useEffect(() => {
    loadData();

    const handleStorageChange = (e: StorageEvent) => {
      console.log('Storage change detected:', e.key); // Debug log
      if (e.key === 'traumaSites' || e.key === 'traumaPatients' || e.key === 'traumaVitals' || e.key === 'traumaTimeline') {
        console.log('Reloading data due to storage change...'); // Debug log
        loadData();
      }
    };

    // Listen for changes from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for changes from same tab (custom event)
    const handleCustomStorageChange = () => {
      console.log('Custom storage change detected, reloading...'); // Debug log
      loadData();
    };
    
    window.addEventListener('triageXDataUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('triageXDataUpdated', handleCustomStorageChange);
    };
  }, []);

  // Convert to hospital format - this will include real vitals/timeline data
  const hospitalPatients = convertToHospitalFormat(sites, patients);
  console.log('Final hospital patients:', hospitalPatients); // Debug log

  return {
    sites,
    patients,
    hospitalPatients,
    isLoading,
    refresh: loadData
  };
};

// Helper function to trigger storage updates (already used in your trauma site)
export const triggerTriageXUpdate = () => {
  console.log('Triggering TriageX update...'); // Debug log
  window.dispatchEvent(new CustomEvent('triageXDataUpdated'));
};