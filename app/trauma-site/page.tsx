"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Battery, Users, Clock, X, Monitor, Activity, AlertTriangle, Heart, Droplets, Wind, CircuitBoard, Brain, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { api, type TraumaSiteDTO, type PatientDTO } from "@/lib/api"
import { TriageBadge } from '@/components/TriageBadge';
import { triageService } from '@/lib/triageService';
import { TriageLevel, TriageResult } from '@/lib/triageAlgorithm';


// Extract the payload type from createPatient's first parameter
type CreatePatientPayload = Parameters<typeof api.createPatient>[0];
// Similarly for updatePatient's second parameter
type UpdatePatientPayload = Parameters<typeof api.updatePatient>[1];

import { triggerTriageXUpdate } from "../../lib/useTriageXData"

interface TraumaSite {
  id: string | number
  name: string
  location: {
    lat: number
    lng: number
    address: string
  }
  createdAt: Date
  patientCount: number
}

interface Patient {
  id: string |  number
  name: string
  triageLevel: "red" | "yellow" | "green" | "black"
  triageStatus: string
  siteId: string | number
  createdAt: Date
  age?: number
  gender?: string
  chief_complaint?: string
  chief_complaint_other?: string
  consciousness?: string
  mechanism?: string
  mechanism_other?: string
  visible_injuries?: boolean
  selected_injuries?: string[]
  medical_alert?: boolean
  allergies_history?: boolean
  allergies_details?: string
}

interface PatientInfo {
  name: string
  age: number
  gender: string
  chiefComplaint: string
  chiefComplaintOther: string
  consciousness: string
  mechanism: string
  mechanismOther: string
  visibleInjuries: boolean
  selectedInjuries: string[]
  medicalAlert: boolean
  allergiesHistory: boolean
  allergiesDetails: string
}

interface PatientCreateUpdatePayload {
  site: string;
  name: string;
  triage_level: string;
  triage_status: string;
  age: number;
  gender: string;
  chief_complaint: string;
  chief_complaint_other: string;
  consciousness: string;
  mechanism: string;
  mechanism_other: string;
  visible_injuries: boolean;
  selected_injuries: string[];
  medical_alert: boolean;
  allergies_history: boolean;
  allergies_details: string;
}




export default function TraumaSitePage() {
  const router = useRouter()

  const [sites, setSites] = useState<TraumaSite[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [isCreatingNewSite, setIsCreatingNewSite] = useState(false);
  const [batteryLevel] = useState(87);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [showPatientActions, setShowPatientActions] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [triageResults, setTriageResults] = useState<Record<string, TriageResult>>({});
  const [manualOverrides, setManualOverrides] = useState<Record<string, any>>({});
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: "",
    age: 0,
    gender: "",
    chiefComplaint: "",
    chiefComplaintOther: "",
    consciousness: "",
    mechanism: "",
    mechanismOther: "",
    visibleInjuries: false,
    selectedInjuries: [],
    medicalAlert: false,
    allergiesHistory: false,
    allergiesDetails: "",
  });

  // Function to generate random vital signs based on triage level
  const generateRandomVitals = (triageLevel: string) => {
    let baseVitals;
    
    switch (triageLevel) {
      case "red": // Critical
        baseVitals = {
          heartRate: 120 + Math.floor(Math.random() * 40), // 120-160
          bpSystolic: 80 + Math.floor(Math.random() * 30), // 80-110
          bpDiastolic: 45 + Math.floor(Math.random() * 20), // 45-65
          respiratoryRate: 24 + Math.floor(Math.random() * 12), // 24-36
          temperature: 97.0 + Math.random() * 2, // 97-99
          oxygenSaturation: 85 + Math.floor(Math.random() * 10) // 85-95
        };
        break;
      case "yellow": // Delayed
        baseVitals = {
          heartRate: 90 + Math.floor(Math.random() * 25), // 90-115
          bpSystolic: 110 + Math.floor(Math.random() * 25), // 110-135
          bpDiastolic: 65 + Math.floor(Math.random() * 15), // 65-80
          respiratoryRate: 16 + Math.floor(Math.random() * 8), // 16-24
          temperature: 98.0 + Math.random() * 1.5, // 98-99.5
          oxygenSaturation: 94 + Math.floor(Math.random() * 5) // 94-99
        };
        break;
      case "green": // Minor
        baseVitals = {
          heartRate: 70 + Math.floor(Math.random() * 20), // 70-90
          bpSystolic: 115 + Math.floor(Math.random() * 20), // 115-135
          bpDiastolic: 70 + Math.floor(Math.random() * 15), // 70-85
          respiratoryRate: 14 + Math.floor(Math.random() * 6), // 14-20
          temperature: 98.4 + Math.random() * 1, // 98.4-99.4
          oxygenSaturation: 97 + Math.floor(Math.random() * 3) // 97-100
        };
        break;
      case "black": // Deceased
        baseVitals = {
          heartRate: 0,
          bpSystolic: 0,
          bpDiastolic: 0,
          respiratoryRate: 0,
          temperature: 95.0 + Math.random() * 2, // Body cooling
          oxygenSaturation: 0
        };
        break;
      default:
        baseVitals = {
          heartRate: 75 + Math.floor(Math.random() * 20),
          bpSystolic: 120 + Math.floor(Math.random() * 15),
          bpDiastolic: 75 + Math.floor(Math.random() * 10),
          respiratoryRate: 16 + Math.floor(Math.random() * 4),
          temperature: 98.6,
          oxygenSaturation: 98 + Math.floor(Math.random() * 2)
        };
    }

    return {
      timestamp: new Date(),
      heartRate: Math.round(baseVitals.heartRate),
      bpSystolic: Math.round(baseVitals.bpSystolic),
      bpDiastolic: Math.round(baseVitals.bpDiastolic),
      respiratoryRate: Math.round(baseVitals.respiratoryRate),
      temperature: Math.round(baseVitals.temperature * 10) / 10, // Round to 1 decimal
      oxygenSaturation: Math.round(baseVitals.oxygenSaturation),
      source: 'device'
    };
  };

  // Function to collect vitals for a patient
  const handleCollectVitals = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    // Generate random vitals based on triage level
    const vitals = generateRandomVitals(patient.triageLevel);
    
    // Store in localStorage for hospital sync
    const existing = JSON.parse(localStorage.getItem("traumaVitals") || "{}");
    if (!existing[patientId]) existing[patientId] = [];
    existing[patientId].push(vitals);
    localStorage.setItem("traumaVitals", JSON.stringify(existing));

    // Add timeline action
    const timelineAction = {
      timestamp: new Date(),
      action: 'Vitals Collected',
      actionType: 'assessment',
      details: `Automated vital signs collected for ${patient.name}: HR ${vitals.heartRate}, BP ${vitals.bpSystolic}/${vitals.bpDiastolic}, RR ${vitals.respiratoryRate}, Temp ${vitals.temperature}°F, SpO2 ${vitals.oxygenSaturation}%`,
      vitals: vitals,
      source: 'trauma-site'
    };
    
    const existingTimeline = JSON.parse(localStorage.getItem("traumaTimeline") || "{}");
    if (!existingTimeline[patientId]) existingTimeline[patientId] = [];
    existingTimeline[patientId].push(timelineAction);
    localStorage.setItem("traumaTimeline", JSON.stringify(existingTimeline));

    // Trigger sync with hospital dashboard
    triggerTriageXUpdate();
    
    console.log(`Vitals collected for ${patient.name}:`, vitals);
  };

  // Function to handle M.A.R.C.H protocol actions
  const handleMarchAction = async (patientId: string, action: string, actionType: 'assessment' | 'treatment' | 'medication' | 'emergency', details: string, e: React.MouseEvent) => {
  e.stopPropagation();
  
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return;

  // Prepare payload for backend
  const payload = {
    patient: parseInt(patientId, 10),  // Convert string to integer
    action: action,
    action_type: actionType,
    details: `${details} for ${patient.name}`,
    source: 'trauma-site',
  };

  try {
    // Send POST request to backend API to save the action
    const response = await fetch('http://127.0.0.1:8000/api/paramedic-actions/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save paramedic action: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Optionally read response json if needed
    const savedAction = await response.json();
    console.log('Paramedic action saved:', savedAction);

    // Also update localStorage for existing UI sync (optional)
    const existingTimeline = JSON.parse(localStorage.getItem('traumaTimeline') || '{}');
    if (!existingTimeline[patientId]) existingTimeline[patientId] = [];
    existingTimeline[patientId].push({
      timestamp: new Date(),
      action: payload.action,
      actionType: payload.action_type,
      details: payload.details,
      source: payload.source,
    });
    localStorage.setItem('traumaTimeline', JSON.stringify(existingTimeline));

    // Trigger dashboard update event
    triggerTriageXUpdate();
  } catch (error) {
    console.error('Error saving paramedic action:', error);
  }
};


  // Function to show patient actions modal
  const handleShowPatientActions = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPatientId(patientId);
    setShowPatientActions(true);
  };
  const emptyState: PatientInfo = {
  name: "",
  age: 0,
  gender: "",
  chiefComplaint: "",
  chiefComplaintOther: "",
  consciousness: "",
  mechanism: "",
  mechanismOther: "",
  visibleInjuries: false,
  selectedInjuries: [],
  medicalAlert: false,
  allergiesHistory: false,
  allergiesDetails: "",
};


  const getTriageColor = (level: string) => {
    switch (level) {
      case "red":
        return "bg-red-500 text-white"
      case "yellow":
        return "bg-yellow-500 text-black"
      case "green":
        return "bg-green-500 text-white"
      case "black":
        return "bg-gray-800 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const payload: PatientCreateUpdatePayload = {
  site: selectedSite,
  name: patientInfo.name,
  triage_level: "yellow",
  triage_status: "Pending Assessment",
  age: patientInfo.age,
  gender: patientInfo.gender,
  chief_complaint: patientInfo.chiefComplaint,
  chief_complaint_other: patientInfo.chiefComplaintOther,
  consciousness: patientInfo.consciousness,
  mechanism: patientInfo.mechanism,
  mechanism_other: patientInfo.mechanismOther,
  visible_injuries: patientInfo.visibleInjuries,
  selected_injuries: patientInfo.selectedInjuries,
  medical_alert: patientInfo.medicalAlert,
  allergies_history: patientInfo.allergiesHistory,
  allergies_details: patientInfo.allergiesDetails,
};

  function mapPatientDTOtoPatient(dto: PatientDTO): Patient {
  return {
    id: dto.id,
    name: dto.name,
    triageLevel: dto.triage_level,
    triageStatus: dto.triage_status,
    siteId: dto.site,
    createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),

    age: dto.age || 0,
    gender: dto.gender || "",
    chief_complaint: dto.chief_complaint || "",
    chief_complaint_other: dto.chief_complaint_other || "",
    consciousness: dto.consciousness || "",
    mechanism: dto.mechanism || "",
    mechanism_other: dto.mechanism_other || "",
    visible_injuries: dto.visible_injuries || false,
    selected_injuries: dto.selected_injuries || [],
    medical_alert: dto.medical_alert || false,
    allergies_history: dto.allergies_history || false,
    allergies_details: dto.allergies_details || "",
  };
}

  const getCurrentLocation = () => {
    return new Promise<{ lat: number; lng: number; address: string }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"))
        return
      }

      console.log("[v0] Requesting geolocation...")
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log("[v0] Geolocation success:", position.coords)
          const { latitude, longitude } = position.coords

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            )
            const data = await response.json()

            const streetNumber = data.address?.house_number || ""
            const streetName = data.address?.road || data.address?.street || ""
            const city =
              data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || ""
            const state = data.address?.state || ""
            const stateAbbr = state ? getStateAbbreviation(state) : ""

            let address = "Location unavailable"
            if (streetName && city) {
              const baseAddress = streetNumber ? `${streetNumber} ${streetName}, ${city}` : `${streetName}, ${city}`
              address = stateAbbr ? `${baseAddress}, ${stateAbbr}` : baseAddress
            } else if (city) {
              address = stateAbbr ? `${city}, ${stateAbbr}` : city
            } else if (streetName) {
              address = streetName
            }

            console.log("[v0] Reverse geocoding result:", address)

            resolve({
              lat: latitude,
              lng: longitude,
              address: address,
            })
          } catch (error) {
            console.log("[v0] Reverse geocoding failed, using fallback")
            resolve({
              lat: latitude,
              lng: longitude,
              address: "Location unavailable",
            })
          }
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
          reject(error)
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      )
    })
  }

  const getStateAbbreviation = (stateName: string): string => {
    const stateMap: { [key: string]: string } = {
      Alabama: "AL",
      Alaska: "AK",
      Arizona: "AZ",
      Arkansas: "AR",
      California: "CA",
      Colorado: "CO",
      Connecticut: "CT",
      Delaware: "DE",
      Florida: "FL",
      Georgia: "GA",
      Hawaii: "HI",
      Idaho: "ID",
      Illinois: "IL",
      Indiana: "IN",
      Iowa: "IA",
      Kansas: "KS",
      Kentucky: "KY",
      Louisiana: "LA",
      Maine: "ME",
      Maryland: "MD",
      Massachusetts: "MA",
      Michigan: "MI",
      Minnesota: "MN",
      Mississippi: "MS",
      Missouri: "MO",
      Montana: "MT",
      Nebraska: "NE",
      Nevada: "NV",
      "New Hampshire": "NH",
      "New Jersey": "NJ",
      "New Mexico": "NM",
      "New York": "NY",
      "North Carolina": "NC",
      "North Dakota": "ND",
      Ohio: "OH",
      Oklahoma: "OK",
      Oregon: "OR",
      Pennsylvania: "PA",
      "Rhode Island": "RI",
      "South Carolina": "SC",
      "South Dakota": "SD",
      Tennessee: "TN",
      Texas: "TX",
      Utah: "UT",
      Vermont: "VT",
      Virginia: "VA",
      Washington: "WA",
      "West Virginia": "WV",
      Wisconsin: "WI",
      Wyoming: "WY",
      "District of Columbia": "DC",
    }
    return stateMap[stateName] || stateName
  }

const handleCreateNewSite = async () => {
  setIsCreatingNewSite(true)
  try {
    const location = await getCurrentLocation()
    const created = await api.createSite({
      name: `Site ${sites.length + 1}`,
      latitude: location.lat,
      longitude: location.lng,
      address: location.address,
    })
    const mapped: TraumaSite = {
      id: created.id,
      name: created.name,
      location: {
        lat: created.latitude ?? 0,
        lng: created.longitude ?? 0,
        address: created.address || "",
      },
      createdAt: created.created_at ? new Date(created.created_at) : new Date(),
      patientCount: 0,
    }
    setSites((prev) => [mapped, ...prev])
    setSelectedSite(String(created.id))
  } catch (error) {
    console.error("[v0] Failed to create site:", error)
    const created = await api.createSite({
      name: `Site ${sites.length + 1}`,
      address: "Location unavailable - Permission denied",
    })
    const mapped: TraumaSite = {
      id: created.id,
      name: created.name,
      location: {
        lat: created.latitude ?? 0,
        lng: created.longitude ?? 0,
        address: created.address || "",
      },
      createdAt: created.created_at ? new Date(created.created_at) : new Date(),
      patientCount: 0,
    }
    setSites((prev) => [mapped, ...prev])
    setSelectedSite(String(created.id))
  } finally {
    setIsCreatingNewSite(false)
  }
}
  const handleCreateNewPatient = () => {
  setEditingPatientId(null);
  setShowPatientModal(true);
  setPatientInfo({
    name: "",
    age: 0,
    gender: "",
    chiefComplaint: "",
    chiefComplaintOther: "",
    consciousness: "",
    mechanism: "",
    mechanismOther: "",
    visibleInjuries: false,
    selectedInjuries: [],
    medicalAlert: false,
    allergiesHistory: false,
    allergiesDetails: "",
  });
};

  const handlePatientSelect = async (patientId: string) => {
  setEditingPatientId(patientId);
  setSelectedPatientId(patientId);
  setShowPatientModal(true);

  try {
    const fullPatient = await api.getPatient(patientId);
    setPatientInfo({
      name: fullPatient.name || "",
      age: fullPatient.age || 0,
      gender: fullPatient.gender || "",
      chiefComplaint: fullPatient.chief_complaint || "",
      chiefComplaintOther: fullPatient.chief_complaint_other || "",
      consciousness: fullPatient.consciousness || "",
      mechanism: fullPatient.mechanism || "",
      mechanismOther: fullPatient.mechanism_other || "",
      visibleInjuries: fullPatient.visible_injuries ?? false,
      selectedInjuries: fullPatient.selected_injuries || [],
      medicalAlert: fullPatient.medical_alert ?? false,
      allergiesHistory: fullPatient.allergies_history ?? false,
      allergiesDetails: fullPatient.allergies_details || "",
    });
  } catch (error) {
    console.error("Failed to load patient details", error);
    // Fallback: clear form
    setPatientInfo(emptyState);
  }
};

  // ...existing code...
const handlePatientInfoSubmit = async () => {
  const payload: CreatePatientPayload | UpdatePatientPayload = {
    site: selectedSite,
    name: patientInfo.name,
    triage_level: "yellow",
    triage_status: "Pending Assessment",
    age: patientInfo.age,
    gender: patientInfo.gender,
    chief_complaint: patientInfo.chiefComplaint,
    chief_complaint_other: patientInfo.chiefComplaintOther,
    consciousness: patientInfo.consciousness,
    mechanism: patientInfo.mechanism,
    mechanism_other: patientInfo.mechanismOther,
    visible_injuries: patientInfo.visibleInjuries,
    selected_injuries: patientInfo.selectedInjuries,
    medical_alert: patientInfo.medicalAlert,
    allergies_history: patientInfo.allergiesHistory,
    allergies_details: patientInfo.allergiesDetails,
  };

  try {
    let apiResult: PatientDTO;

    if (editingPatientId) {
      apiResult = await api.updatePatient(editingPatientId, payload as UpdatePatientPayload);
      setPatients((prev) =>
        prev.map((p) =>
          String(p.id) === String(editingPatientId) ? { ...p, ...mapPatientDTOtoPatient(apiResult) } : p
        )
      );
    } else {
      apiResult = await api.createPatient(payload as CreatePatientPayload);
      setPatients((prev) => [mapPatientDTOtoPatient(apiResult), ...prev]);
    }

    // After successful save, navigate to dashboard
    router.push(`/dashboard?patientId=${apiResult.id}&patientName=${encodeURIComponent(apiResult.name)}`);

  } catch (e) {
    console.error("Failed to save patient", e);
    alert("Failed to save patient");
  } finally {
    setShowPatientModal(false);
    setEditingPatientId(null);
  }
};



  const injuryOptions = ["Bleeding", "Fracture", "Burn", "Unspecified"]

  const handleInjuryToggle = (injury: string) => {
    setPatientInfo((prev) => ({
      ...prev,
      selectedInjuries: prev.selectedInjuries.includes(injury)
        ? prev.selectedInjuries.filter((i) => i !== injury)
        : [...prev.selectedInjuries, injury],
    }))
  }

  const handleLogoClick = () => {
    router.push("/")
  }

  const handleDeleteSite = async (siteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await api.deleteSite(siteId)
    setSites((prevSites) => prevSites.filter((site) => String(site.id) !== String(siteId)))
    setPatients((prevPatients) => prevPatients.filter((patient) => String(patient.siteId) !== String(siteId)))
    if (selectedSite === siteId) {
      const remainingSites = sites.filter((site) => String(site.id) !== String(siteId))
      if (remainingSites.length > 0) {
        const sortedRemaining = [...remainingSites].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        setSelectedSite(String(sortedRemaining[0].id))
      } else {
        setSelectedSite("")
      }
    }
  }

  const handleDeletePatient = async (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await api.deletePatient(patientId)
    setPatients((prevPatients) => prevPatients.filter((patient) => String(patient.id) !== String(patientId)))
  }
  
  const handleHospitalDashboard = () => {
    router.push("/hospital");
  };

  // Fetch trauma sites from the backend DB on mount
  useEffect(() => {
    async function loadSites() {
      try {
        const siteDTOs = await api.listSites();
        const mappedSites = siteDTOs.map(site => ({
          id: site.id,
          name: site.name,
          location: {
            lat: site.latitude ?? 0,
            lng: site.longitude ?? 0,
            address: site.address || "",
          },
          createdAt: site.created_at ? new Date(site.created_at) : new Date(),
          patientCount: 0, // Will update later if you want to count patients per site
        }));
        setSites(mappedSites);
        // Select most recent site if none currently selected
        if (mappedSites.length > 0 && !selectedSite) {
          const sortedSites = [...mappedSites].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          );
          setSelectedSite(String(sortedSites[0].id));
        }
      } catch (err) {
        console.error("Failed to load trauma sites:", err);
        setSites([]);
      }
    }
    loadSites();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
  // Load manual overrides
  const overrides = JSON.parse(localStorage.getItem('triageOverrides') || '{}');
  setManualOverrides(overrides);

  // Recalculate triage for all patients
  const recalculateAllTriage = async () => {
  const results: Record<string, TriageResult> = {};
  
  for (const patient of patients) {
    try {
      // Convert patient.id to string using String() constructor
      results[String(patient.id)] = await triageService.recalculatePatientTriage(String(patient.id));
    } catch (error) {
      console.error(`Error calculating triage for patient ${patient.id}:`, error);
    }
  }
  
  setTriageResults(results);
};

  recalculateAllTriage();
}, [patients]);

const handleTriageLevelChange = async (patientId: string, newLevel: TriageLevel, isManualOverride: boolean) => {
  if (isManualOverride) {
    try {
      await triageService.applyTriageOverride(patientId, newLevel);
      
      // Update local state
      setManualOverrides(prev => ({
        ...prev,
        [patientId]: {
          level: newLevel,
          timestamp: new Date(),
          reason: 'Manual override by medical personnel'
        }
      }));
    } catch (error) {
      console.error('Failed to apply triage override:', error);
      alert('Failed to update triage level. Please try again.');
    }
  }
};

  // Fetch patients for the selected trauma site from the backend DB
  useEffect(() => {
    async function reloadPatients() {
      if (!selectedSite) {
        setPatients([]);
        return;
      }
      try {
        const pts = await api.listPatients(selectedSite);
        setPatients(
          pts
            .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
            .map((p) => ({
              id: p.id,
              name: p.name,
              triageLevel: p.triage_level,
              triageStatus: p.triage_status,
              siteId: p.site,
              createdAt: p.created_at ? new Date(p.created_at) : new Date(),
              age: p.age,
              gender: p.gender,
              chief_complaint: p.chief_complaint,
              chief_complaint_other: p.chief_complaint_other,
              consciousness: p.consciousness,
              mechanism: p.mechanism,
              mechanism_other: p.mechanism_other,
              visible_injuries: p.visible_injuries,
              selected_injuries: p.selected_injuries,
              medical_alert: p.medical_alert,
              allergies_history: p.allergies_history,
              allergies_details: p.allergies_details,
            }))
        );
      } catch (err) {
        console.error("Failed to load patients for site:", err);
        setPatients([]);
      }
    }
    reloadPatients();
    // eslint-disable-next-line
  }, [selectedSite]);


  const selectedSiteData = sites.find((site) => site.id === selectedSite)
  const sitePatients = patients.filter((patient) => String(patient.siteId) === String(selectedSite))

  const sortedSites = [...sites].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  // Calculate stats for hospital dashboard
  const totalPatients = patients.length
  const criticalPatients = patients.filter((p: Patient) => p.triageLevel === "red").length
  const activeSites = sites.length

  // M.A.R.C.H Protocol Actions - Real paramedic techniques
  const marchActions = [
    {
      label: 'Massive Hemorrhage',
      action: 'Massive Hemorrhage Control',
      type: 'emergency' as const,
      details: 'Applied direct pressure and hemostatic agents to control massive bleeding',
      color: 'bg-red-600 hover:bg-red-700',
      icon: Droplets,
      size: 'large'
    },
    {
      label: 'Airway',
      action: 'Airway Management',
      type: 'emergency' as const,
      details: 'Secured and maintained patient airway patency',
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: Wind,
      size: 'medium'
    },
    {
      label: 'Respiration',
      action: 'Respiratory Support',
      type: 'treatment' as const,
      details: 'Provided respiratory support and ventilation assistance',
      color: 'bg-green-600 hover:bg-green-700',
      icon: Activity,
      size: 'medium'
    },
    {
      label: 'Circulation/C-spine',
      action: 'Circulation Assessment',
      type: 'assessment' as const,
      details: 'Assessed circulation and provided C-spine immobilization',
      color: 'bg-orange-600 hover:bg-orange-700',
      icon: CircuitBoard,
      size: 'medium'
    },
    {
      label: 'Head, Hypothermia',
      action: 'Head Injury/Hypothermia',
      type: 'treatment' as const,
      details: 'Managed head injury and prevented/treated hypothermia',
      color: 'bg-purple-600 hover:bg-purple-700',
      icon: Brain,
      size: 'medium'
    },
    {
      label: 'Direct Pressure',
      action: 'Direct Pressure Applied',
      type: 'treatment' as const,
      details: 'Applied direct pressure to control bleeding at wound site',
      color: 'bg-red-700 hover:bg-red-800',
      icon: Plus,
      size: 'large'
    },
    {
      label: 'Tourniquet',
      action: 'Tourniquet Application',
      type: 'emergency' as const,
      details: 'Applied tourniquet to control life-threatening extremity hemorrhage',
      color: 'bg-red-800 hover:bg-red-900',
      icon: Zap,
      size: 'large'
    },
    {
      label: 'Pelvic Binder',
      action: 'Pelvic Binder Applied',
      type: 'treatment' as const,
      details: 'Applied pelvic binding device to stabilize pelvic fracture',
      color: 'bg-red-700 hover:bg-red-800',
      icon: Activity,
      size: 'large'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="bg-gray-900 border-gray-700 rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLogoClick}
            className="text-white font-medium italic instrument text-2xl hover:text-white/80 transition-colors duration-200 cursor-pointer"
          >
            TriageX
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Battery className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">{batteryLevel}%</span>
        </div>
      </div>

      {/* Hospital Command Center Section */}
      <div className="mb-6">
        <Card className="bg-gradient-to-r from-blue-900/20 via-blue-800/20 to-indigo-900/20 border-blue-700/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-full border border-blue-500/30">
                  <Monitor className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Hospital Command Center</h3>
                  <p className="text-gray-300 text-sm mb-3">Monitor all field operations and incoming patients in real-time</p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">
                        <span className="text-green-400 font-semibold">{activeSites}</span> Active Sites
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">
                        <span className="text-blue-400 font-semibold">{totalPatients}</span> Total Patients
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-gray-300">
                        <span className="text-red-400 font-semibold">{criticalPatients}</span> Critical
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleHospitalDashboard}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Monitor className="w-5 h-5 mr-2" />
                Access Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Sites */}
        <div className="space-y-4">
          <div className="bg-gray-900 border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Trauma Sites</h2>
              <Button
                onClick={handleCreateNewSite}
                disabled={isCreatingNewSite}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {isCreatingNewSite ? "Creating..." : "New Site"}
              </Button>
            </div>

            <div className="space-y-3">
              {sortedSites.map((site) => (
                <Card
                  key={site.id}
                  className={`cursor-pointer transition-all bg-black/40 border-gray-600 ${
                    selectedSite === site.id ? "ring-2 ring-red-500 bg-red-900/20" : "hover:bg-gray-800"
                  }`}
                  onClick={() => setSelectedSite(String(site.id))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{site.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>{site.location.address}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{patients.filter((p) => String(p.siteId) === String(site.id)).length} patients</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {site.createdAt.getTime() > Date.now() - 60 * 60 * 1000
                                ? `${Math.floor((Date.now() - site.createdAt.getTime()) / (1000 * 60))}m ago`
                                : site.createdAt.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedSite === site.id && <div className="w-3 h-3 bg-red-500 rounded-full"></div>}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteSite(String(site.id), e)}
                          className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 p-1 h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Patients */}
        <div className="space-y-4">
          <div className="bg-gray-900 border-gray-700 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Patients - {selectedSiteData?.name}</h2>
              <Button onClick={handleCreateNewPatient} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Patient
              </Button>
            </div>

            <div className="space-y-3">
              {sitePatients.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No patients at this site yet</p>
                  <p className="text-sm">Click "New Patient" to start triage</p>
                </div>
              ) : (
                sitePatients.map((patient) => (
                  <Card
                    key={patient.id}
                    className="cursor-pointer hover:bg-gray-800 transition-all border-2 border-dashed border-gray-600 hover:border-red-400 bg-black/40"
                    onClick={() => handlePatientSelect(String(patient.id))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{patient.name}</h3>
                          <div className="flex items-center gap-2 mt-2">
                          <TriageBadge
                            currentLevel={manualOverrides[patient.id]?.level || triageResults[patient.id]?.level || patient.triageLevel}
                            triageResult={triageResults[patient.id]}
                            patientId={String(patient.id)}
                            patientName={patient.name}
                            onLevelChange={(newLevel, isManualOverride) => 
                              handleTriageLevelChange(String(patient.id), newLevel, isManualOverride)
                            }
                            isManualOverride={!!manualOverrides[patient.id]}
                          />
                          <span className="text-sm text-gray-400">{patient.triageStatus}</span>
                        </div>
                          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{patient.createdAt.toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {/* Collect Vitals Button */}
                          <Button
                            onClick={(e) => handleCollectVitals(String(patient.id), e)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 font-semibold"
                          >
                            <Heart className="w-3 h-3 mr-1" />
                            Collect Vitals
                          </Button>
                          {/* M.A.R.C.H Actions Button */}
                          <Button
                              onClick={(e) => handleShowPatientActions(String(patient.id), e)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 font-semibold"
                            >
                              <Activity className="w-3 h-3 mr-1" />
                              M.A.R.C.H
                            </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeletePatient(String(patient.id), e)}
                            className="text-gray-400 hover:text-red-400 hover:bg-red-900/20 p-1 h-8 w-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Patient Info Modal */}
      {showPatientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Patient Information</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPatientModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter patient name"
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Age</label>
                <input
                  type="number"
                  placeholder="Enter patient age"
                  value={patientInfo.age || 0}
                  onChange={(e) => setPatientInfo((prev) => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                  min="0"
                  max="120"
                />
              </div>

              {/* Sex/Gender */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Sex/Gender</label>
                <div className="flex gap-4">
                  {["male", "female", "unknown"].map((option) => (
                    <label key={option} className="flex items-center gap-2 text-white">
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={patientInfo.gender === option}
                        onChange={(e) => setPatientInfo((prev) => ({ ...prev, gender: e.target.value }))}
                        className="text-red-500"
                      />
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Chief Complaint</label>
                <select
                  value={patientInfo.chiefComplaint}
                  onChange={(e) => setPatientInfo((prev) => ({ ...prev, chiefComplaint: e.target.value }))}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                >
                  <option value="">Select complaint</option>
                  <option value="chest-pain">Chest Pain</option>
                  <option value="trauma">Trauma</option>
                  <option value="breathing-issue">Breathing Issue</option>
                  <option value="unresponsive">Unresponsive</option>
                  <option value="other">Other</option>
                </select>
                {patientInfo.chiefComplaint === "other" && (
                  <input
                    type="text"
                    placeholder="Specify other complaint"
                    value={patientInfo.chiefComplaintOther}
                    onChange={(e) => setPatientInfo((prev) => ({ ...prev, chiefComplaintOther: e.target.value }))}
                    className="w-full p-2 mt-2 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                )}
              </div>

              {/* Level of Consciousness */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Level of Consciousness (AVPU)</label>
                <select
                  value={patientInfo.consciousness}
                  onChange={(e) => setPatientInfo((prev) => ({ ...prev, consciousness: e.target.value }))}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                >
                  <option value="">Select consciousness level</option>
                  <option value="alert">Alert</option>
                  <option value="voice">Responds to Voice</option>
                  <option value="pain">Responds to Pain</option>
                  <option value="unresponsive">Unresponsive</option>
                </select>
              </div>

              {/* Mechanism of Injury */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Mechanism of Injury/Event</label>
                <select
                  value={patientInfo.mechanism}
                  onChange={(e) => setPatientInfo((prev) => ({ ...prev, mechanism: e.target.value }))}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                >
                  <option value="">Select mechanism</option>
                  <option value="fall">Fall</option>
                  <option value="mvc">Motor Vehicle Collision</option>
                  <option value="assault">Assault</option>
                  <option value="unknown">Unknown</option>
                  <option value="other">Other</option>
                </select>
                {patientInfo.mechanism === "other" && (
                  <input
                    type="text"
                    placeholder="Specify other mechanism"
                    value={patientInfo.mechanismOther}
                    onChange={(e) => setPatientInfo((prev) => ({ ...prev, mechanismOther: e.target.value }))}
                    className="w-full p-2 mt-2 bg-gray-800 border border-gray-600 rounded text-white"
                  />
                )}
              </div>

              {/* Visible Injuries */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Visible Injuries or Distress</label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="radio"
                      name="visibleInjuries"
                      checked={patientInfo.visibleInjuries === true}
                      onChange={() => setPatientInfo((prev) => ({ ...prev, visibleInjuries: true }))}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="radio"
                      name="visibleInjuries"
                      checked={patientInfo.visibleInjuries === false}
                      onChange={() =>
                        setPatientInfo((prev) => ({ ...prev, visibleInjuries: false, selectedInjuries: [] }))
                      }
                    />
                    No
                  </label>
                </div>
                {patientInfo.visibleInjuries && (
                  <div className="grid grid-cols-2 gap-2">
                    {injuryOptions.map((injury) => (
                      <label key={injury} className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={patientInfo.selectedInjuries.includes(injury)}
                          onChange={() => handleInjuryToggle(injury)}
                        />
                        {injury}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Medical Alert */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Observed Medical Alert/ID</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="radio"
                      name="medicalAlert"
                      checked={patientInfo.medicalAlert === true}
                      onChange={() => setPatientInfo((prev) => ({ ...prev, medicalAlert: true }))}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="radio"
                      name="medicalAlert"
                      checked={patientInfo.medicalAlert === false}
                      onChange={() => setPatientInfo((prev) => ({ ...prev, medicalAlert: false }))}
                    />
                    No
                  </label>
                </div>
              </div>

              {/* Allergies/Medical History */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Known Allergies or Key Medical History
                </label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="radio"
                      name="allergiesHistory"
                      checked={patientInfo.allergiesHistory === true}
                      onChange={() => setPatientInfo((prev) => ({ ...prev, allergiesHistory: true }))}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="radio"
                      name="allergiesHistory"
                      checked={patientInfo.allergiesHistory === false}
                      onChange={() =>
                        setPatientInfo((prev) => ({ ...prev, allergiesHistory: false, allergiesDetails: "" }))
                      }
                    />
                    No
                  </label>
                </div>
                {patientInfo.allergiesHistory && (
                  <textarea
                    placeholder="Enter allergies or medical history details"
                    value={patientInfo.allergiesDetails}
                    onChange={(e) => setPatientInfo((prev) => ({ ...prev, allergiesDetails: e.target.value }))}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white h-20 resize-none"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowPatientModal(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button onClick={handlePatientInfoSubmit} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                Start Triage
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* M.A.R.C.H Actions Modal */}
      {showPatientActions && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-white">M.A.R.C.H Protocol - {selectedPatient.name}</h2>
                <p className="text-gray-400 text-sm mt-1">Live vital signs monitoring and collection</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPatientActions(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6">
              {/* Patient Info Summary */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-black/40 rounded-lg mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Triage Level</p>
                  <TriageBadge
                    currentLevel={manualOverrides[selectedPatient.id]?.level || triageResults[selectedPatient.id]?.level || selectedPatient.triageLevel}
                    triageResult={triageResults[selectedPatient.id]}
                    patientId={String(selectedPatient.id)}
                    patientName={selectedPatient.name}
                    onLevelChange={(newLevel, isManualOverride) => 
                      handleTriageLevelChange(String(selectedPatient.id), newLevel, isManualOverride)
                    }
                    isManualOverride={!!manualOverrides[selectedPatient.id]}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="text-white font-semibold">{selectedPatient.triageStatus}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Site</p>
                  <p className="text-white font-semibold">{selectedSiteData?.name}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Time</p>
                  <p className="text-white font-semibold">{selectedPatient.createdAt.toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* M.A.R.C.H Actions */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">M.A.R.C.H Actions</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {marchActions.map((marchAction, index) => {
                      const IconComponent = marchAction.icon;
                      const buttonHeight = marchAction.size === 'large' ? 'h-16' : 'h-12';
                      return (
                        <Button
                          key={index}
                          onClick={(e) => handleMarchAction(String(selectedPatient.id), marchAction.action, marchAction.type, marchAction.details, e)}
                          className={`${marchAction.color} text-white font-medium ${buttonHeight} px-6 transition-all duration-200 flex items-center gap-3 justify-start`}
                        >
                          <IconComponent className="w-5 h-5" />
                          <span className="text-sm font-semibold">{marchAction.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Vital Signs */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Vital Signs</h3>
                  
                  {/* Vital Signs Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/40 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Blood Pressure</p>
                      <p className="text-2xl font-bold text-white font-mono">0/0</p>
                      <p className="text-xs text-gray-400">mmHg</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Heart Rate</p>
                      <p className="text-2xl font-bold text-white font-mono">0</p>
                      <p className="text-xs text-gray-400">bpm</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Body Temperature</p>
                      <p className="text-2xl font-bold text-white font-mono">0°F</p>
                      <p className="text-xs text-gray-400">Fahrenheit</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">Respiratory Rate</p>
                      <p className="text-2xl font-bold text-white font-mono">0</p>
                      <p className="text-xs text-gray-400">breaths/min</p>
                    </div>
                  </div>

                  {/* Collect Vitals Button */}
                  <Button
                    onClick={(e) => handleCollectVitals(String(selectedPatient.id), e)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 mb-4"
                  >
                    Collect Vitals
                  </Button>

                  {/* Continuous Vitals Collection Section */}
                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-blue-400" />
                        <h4 className="text-sm font-semibold text-white">Continuous Monitoring</h4>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => handleCollectVitals(String(selectedPatient.id), e)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 text-xs flex-1"
                      >
                        Single Reading
                      </Button>
                      <Button
                        onClick={(e) => {
                          // Collect multiple readings for continuous monitoring
                          for (let i = 0; i < 5; i++) {
                            setTimeout(() => {
                              handleCollectVitals(String(selectedPatient.id), e);
                            }, i * 2000); // 2 second intervals
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 text-xs flex-1"
                      >
                        5 Readings (10s)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access - Fixed bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleHospitalDashboard}
          className="bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-full shadow-2xl transition-all duration-200 border border-blue-500/30"
        >
          <Monitor className="w-5 h-5 mr-2" />
          Hospital
        </Button>
      </div>
    </div>
  )
}