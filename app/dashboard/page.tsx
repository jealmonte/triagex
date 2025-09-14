"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronDown, ChevronUp, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { triggerTriageXUpdate } from "../../lib/useTriageXData"

interface LogEntry {
  timestamp: string
  level: string
  message: string
  duration?: string
  category?: string
}

interface VitalSigns {
  bloodPressure: { systolic: number; diastolic: number }
  heartRate: number
  temperature: number
  respiratoryRate: number
}

interface MarchCategory {
  id: string
  name: string
  fullName: string
  color: string
  buttons: { label: string; action: string }[]
}

const marchCategories: MarchCategory[] = [
  {
    id: "M",
    name: "M",
    fullName: "Massive Hemorrhage",
    color: "bg-red-600 hover:bg-red-700",
    buttons: [
      { label: "Direct Pressure", action: "Applied direct pressure to bleeding site" },
      { label: "Tourniquet", action: "Applied tourniquet to control hemorrhage" },
      { label: "Pelvic Binder", action: "Applied pelvic binder for stabilization" },
    ],
  },
  {
    id: "A",
    name: "A",
    fullName: "Airway",
    color: "bg-blue-600 hover:bg-blue-700",
    buttons: [
      { label: "Position", action: "Positioned airway for optimal breathing" },
      { label: "OPA", action: "Inserted oropharyngeal airway (OPA)" },
      { label: "NPA", action: "Inserted nasopharyngeal airway (NPA)" },
    ],
  },
  {
    id: "R",
    name: "R",
    fullName: "Respiration",
    color: "bg-green-600 hover:bg-green-700",
    buttons: [
      { label: "Chest Seal", action: "Applied chest seal for pneumothorax" },
      { label: "Needle Decompression", action: "Performed needle decompression" },
      { label: "Oxygen", action: "Administered supplemental oxygen" },
    ],
  },
  {
    id: "C",
    name: "C",
    fullName: "Circulation/C-spine",
    color: "bg-yellow-600 hover:bg-yellow-700",
    buttons: [
      { label: "IV", action: "Established intravenous access" },
      { label: "IO", action: "Established intraosseous access" },
      { label: "Fluids", action: "Administered IV fluids for circulation support" },
    ],
  },
  {
    id: "H",
    name: "H",
    fullName: "Head, Hypothermia",
    color: "bg-purple-600 hover:bg-purple-700",
    buttons: [
      { label: "GCS", action: "Assessed Glasgow Coma Scale (GCS)" },
      { label: "Pain Score", action: "Documented pain assessment score" },
      { label: "Warming", action: "Applied warming measures for hypothermia" },
    ],
  },
]

export default function Dashboard() {
  const router = useRouter()
  const timelineRef = useRef<HTMLDivElement>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [vitals, setVitals] = useState<VitalSigns>({
    bloodPressure: { systolic: 0, diastolic: 0 },
    heartRate: 0,
    temperature: 0,
    respiratoryRate: 0,
  })
  const [isCollecting, setIsCollecting] = useState(false)
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState("M")
  const [currentPatientId, setCurrentPatientId] = useState<string>("")
  const [currentPatientName, setCurrentPatientName] = useState<string>("Patient")

  // Get current patient info from URL params or localStorage
useEffect(() => {
  // Try to get patient info from URL params first
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('patientId');
  const patientName = urlParams.get('patientName');
  
  if (patientId && patientName) {
    console.log('Got patient from URL:', { patientId, patientName });
    setCurrentPatientId(patientId);
    setCurrentPatientName(patientName);
  } else {
    console.log('No patient info in URL, checking localStorage...');
    
    // Try different localStorage keys that might contain patient data
    const keys = ['traumaPatients', 'patients', 'currentPatient'];
    let found = false;
    
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (Array.isArray(data) && data.length > 0) {
            console.log(`Found patients in localStorage key "${key}":`, data);
            setCurrentPatientId(String(data[0].id));
            setCurrentPatientName(data[0].name);
            found = true;
            break;
          } else if (data.id && data.name) {
            console.log(`Found single patient in localStorage key "${key}":`, data);
            setCurrentPatientId(String(data.id));
            setCurrentPatientName(data.name);
            found = true;
            break;
          }
        } catch (e) {
          console.log(`Error parsing localStorage key "${key}":`, e);
        }
      }
    }
    
    if (!found) {
      console.error('NO PATIENT FOUND - This will cause API errors!');
      console.log('Available localStorage keys:', Object.keys(localStorage));
      // Don't set fallback values - leave them empty to make the problem obvious
      setCurrentPatientId("");
      setCurrentPatientName("NO PATIENT SELECTED");
    }
  }
}, []);

  const addLog = (level: string, message: string, duration?: string, category?: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    setLogs((prev) => [...prev, { timestamp, level, message, duration, category }])
  }

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = timelineRef.current.scrollHeight
    }
  }, [logs])

  // Enhanced M.A.R.C.H action handler that saves to hospital dashboard
  const handleMarchAction = async (action: string, category: string) => {
  // Add to local timeline for immediate UI feedback
  addLog("Action", `[${category}] ${action}`, undefined, category);

  if (!currentPatientId) return;

  // Prepare payload for backend
  const payload = {
    patient: currentPatientId,
    action: `${action}`,
    action_type: category,  // Adjust field if needed (e.g. map category to your backend enums)
    details: `${action} for ${currentPatientName}`,
    source: 'trauma-site',
  };

  try {
    // Send POST request to backend API to save the action
    const response = await fetch('http://127.0.0.1:8000/api/paramedic-actions/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to save paramedic action: ${response.statusText}`);
    }

    // Optionally read response json if needed
    const savedAction = await response.json();
    console.log('Paramedic action saved:', savedAction);

    // Also update localStorage for existing UI sync (optional)
    const existingTimeline = JSON.parse(localStorage.getItem('timeline') || '{}');
    if (!existingTimeline[currentPatientId]) existingTimeline[currentPatientId] = [];
    existingTimeline[currentPatientId].push({
      timestamp: new Date(),
      action: payload.action,
      actionType: payload.action_type,
      details: payload.details,
      source: payload.source,
    });
    localStorage.setItem('timeline', JSON.stringify(existingTimeline));

    // Trigger dashboard update event
    triggerTriageXUpdate();
  } catch (error) {
    console.error('Error saving paramedic action:', error);
  }
};


  // Enhanced vital collection that saves to hospital dashboard
  const simulateVitalCollection = async () => {
  if (!currentPatientId) return;
  
  setIsCollecting(true)

  // DEBUG: Log what patient ID we're trying to use
  console.log('Current patient ID:', currentPatientId);
  console.log('Current patient name:', currentPatientName);

  // Generate realistic vital signs based on patient's current state
  const generateVitals = () => {
    return {
      systolic: 110 + Math.floor(Math.random() * 30), // 110-140
      diastolic: 65 + Math.floor(Math.random() * 20),  // 65-85
      heartRate: 65 + Math.floor(Math.random() * 30),  // 65-95
      temperature: 97.5 + Math.random() * 2.5,         // 97.5-100.0
      respiratoryRate: 14 + Math.floor(Math.random() * 8) // 14-22
    };
  };

  const newVitals = generateVitals();

  // Blood Pressure
  addLog("Vitals", "Starting blood pressure measurement...")
  await new Promise((resolve) => setTimeout(resolve, 2000))
  setVitals((prev) => ({ 
    ...prev, 
    bloodPressure: { systolic: newVitals.systolic, diastolic: newVitals.diastolic } 
  }))
  addLog("Vitals", "Blood pressure measurement complete", "2.1s")

  // Heart Rate
  addLog("Vitals", "Starting heart rate monitoring...")
  await new Promise((resolve) => setTimeout(resolve, 1500))
  setVitals((prev) => ({ ...prev, heartRate: newVitals.heartRate }))
  addLog("Vitals", "Heart rate monitoring complete", "1.5s")

  // Temperature
  addLog("Vitals", "Starting temperature reading...")
  await new Promise((resolve) => setTimeout(resolve, 1000))
  setVitals((prev) => ({ ...prev, temperature: Math.round(newVitals.temperature * 10) / 10 }))
  addLog("Vitals", "Temperature reading complete", "1.0s")

  // Respiratory Rate
  addLog("Vitals", "Starting respiratory rate assessment...")
  await new Promise((resolve) => setTimeout(resolve, 2200))
  setVitals((prev) => ({ ...prev, respiratoryRate: newVitals.respiratoryRate }))
  addLog("Vitals", "Respiratory rate assessment complete", "2.2s")

  // Save complete vital signs to localStorage for hospital dashboard
  const vitalSigns = {
    timestamp: new Date(),
    heartRate: newVitals.heartRate,
    bpSystolic: newVitals.systolic,
    bpDiastolic: newVitals.diastolic,
    respiratoryRate: newVitals.respiratoryRate,
    temperature: Math.round(newVitals.temperature * 10) / 10,
    oxygenSaturation: 95 + Math.floor(Math.random() * 5), // 95-100
    source: 'manual'
  };

  // DEBUG: Log the payload we're sending
  const payload = {
    patient: parseInt(currentPatientId, 10),  // Convert string to integer
    heart_rate: vitalSigns.heartRate,
    bp_systolic: vitalSigns.bpSystolic,
    bp_diastolic: vitalSigns.bpDiastolic,
    respiratory_rate: vitalSigns.respiratoryRate,
    temperature: vitalSigns.temperature,
    oxygen_saturation: vitalSigns.oxygenSaturation,
    source: 'manual'
  };
  
  console.log('Payload being sent to API:', payload);

  try {
    const response = await fetch('http://127.0.0.1:8000/api/vitalsigns/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, response.statusText);
      console.error('Error details:', errorText);
      throw new Error(`Failed to save vital signs: ${response.status} - ${errorText}`);
    }

    const savedVitals = await response.json();
    console.log('Successfully saved vitals:', savedVitals);
    
  } catch (error) {
    console.error('Error saving vitals to backend:', error);
    addLog("Error", "Failed to save vitals to backend");
  }
  
  // Store in localStorage for hospital sync
  const existing = JSON.parse(localStorage.getItem("traumaVitals") || "{}");
  if (!existing[currentPatientId]) existing[currentPatientId] = [];
  existing[currentPatientId].push(vitalSigns);
  localStorage.setItem("traumaVitals", JSON.stringify(existing));

  // Add timeline action for vital signs collection
  const timelineAction = {
    timestamp: new Date(),
    action: 'Vitals Collected',
    actionType: 'assessment',
    details: `Manual vital signs collected for ${currentPatientName}: HR ${vitalSigns.heartRate}, BP ${vitalSigns.bpSystolic}/${vitalSigns.bpDiastolic}, RR ${vitalSigns.respiratoryRate}, Temp ${vitalSigns.temperature}°F, SpO2 ${vitalSigns.oxygenSaturation}%`,
    vitals: vitalSigns,
    source: 'trauma-site'
  };
  
  const existingTimeline = JSON.parse(localStorage.getItem("traumaTimeline") || "{}");
  if (!existingTimeline[currentPatientId]) existingTimeline[currentPatientId] = [];
  existingTimeline[currentPatientId].push(timelineAction);
  localStorage.setItem("traumaTimeline", JSON.stringify(existingTimeline));

  // Trigger hospital dashboard sync
  triggerTriageXUpdate();

  addLog("Success", "All vital signs collected successfully")
  setIsCollecting(false)
  
  console.log(`Vitals collected for ${currentPatientName}:`, vitalSigns);
}


  const getVitalStatus = (vital: string, value: number) => {
    switch (vital) {
      case "bloodPressure":
        if (value > 140 || vitals.bloodPressure.diastolic > 90) return "warning"
        return "normal"
      case "heartRate":
        if (value < 60 || value > 100) return "warning"
        return "normal"
      case "temperature":
        if (value > 100.4 || value < 97) return "warning"
        return "normal"
      case "respiratoryRate":
        if (value < 12 || value > 20) return "warning"
        return "normal"
      default:
        return "normal"
    }
  }

  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return "bg-gray-700 text-gray-300"

    const category = marchCategories.find((cat) => cat.id === categoryId)
    if (!category) return "bg-gray-700 text-gray-300"

    switch (categoryId) {
      case "M":
        return "bg-red-900 text-red-300"
      case "A":
        return "bg-blue-900 text-blue-300"
      case "R":
        return "bg-green-900 text-green-300"
      case "C":
        return "bg-yellow-900 text-yellow-300"
      case "H":
        return "bg-purple-900 text-purple-300"
      default:
        return "bg-gray-700 text-gray-300"
    }
  }

  const selectedCategory = marchCategories.find((cat) => cat.id === selectedCategoryId) || marchCategories[0]

  const handleLogoClick = () => {
    router.push("/")
  }

  const handleBackClick = () => {
    router.push("/trauma-site")
  }

  return (
    <div className="min-h-screen bg-black text-white p-2 sm:p-6">
      <div className="max-w-md sm:max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-2">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
            >
              <ArrowLeft size={16} />
              Back to Trauma Site
            </button>
            <button
              onClick={handleLogoClick}
              className="text-white font-medium italic instrument text-2xl sm:text-3xl hover:text-white/80 transition-colors duration-200 cursor-pointer"
            >
              TriageX
            </button>
          </div>
          <p className="text-gray-400 text-xs sm:text-base">
            Live vital signs monitoring and collection - {currentPatientName}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 h-auto sm:h-[calc(100vh-200px)]">
          {/* Left Side - Quick Actions and Console */}
          <div className="flex flex-col gap-2 sm:gap-4">
            <Card
              className={`bg-gray-900 border-gray-700 p-3 sm:p-6 transition-all duration-300 ${isConsoleCollapsed ? "flex-[2]" : "flex-1"}`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h2
                  className={`font-semibold text-white transition-all duration-300 ${isConsoleCollapsed ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}
                >
                  M.A.R.C.H Actions
                </h2>
              </div>

              <div className="mb-2 sm:mb-4">
                <div className="flex flex-wrap gap-2 mb-2 sm:mb-4">
                  {marchCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategoryId(category.id)}
                      className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm ${
                        selectedCategoryId === category.id
                          ? category.id === "M"
                            ? "bg-red-900 text-white"
                            : category.id === "A"
                              ? "bg-blue-900 text-white"
                              : category.id === "R"
                                ? "bg-green-900 text-white"
                                : category.id === "C"
                                  ? "bg-yellow-900 text-white"
                                  : category.id === "H"
                                    ? "bg-purple-900 text-white"
                                    : "bg-gray-600 text-gray-300"
                          : `${category.color} text-white`
                      }`}
                    >
                      {category.fullName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {selectedCategory.buttons.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => handleMarchAction(button.action, selectedCategory.name)}
                    className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all duration-300 ${selectedCategory.color} ${isConsoleCollapsed ? "py-4 text-base sm:py-6 sm:text-lg" : "py-2 text-xs sm:py-3 sm:text-sm"}`}
                  >
                    {button.label}
                  </button>
                ))}
                <button
                  onClick={simulateVitalCollection}
                  disabled={isCollecting}
                  className={`px-3 py-2 sm:px-4 sm:py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 rounded-lg font-medium transition-all duration-300 border-t border-gray-600 mt-1 sm:mt-2 ${isConsoleCollapsed ? "py-4 text-base sm:py-6 sm:text-lg" : "py-2 text-xs sm:py-3 sm:text-sm"}`}
                >
                  {isCollecting ? "Collecting Vitals..." : "Collect Vitals"}
                </button>
              </div>
            </Card>

            <Card
              className={`bg-gray-900 border-gray-700 p-3 sm:p-6 flex flex-col transition-all duration-300 ${isConsoleCollapsed ? "flex-none h-16 sm:h-20" : "flex-1"}`}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Timeline</h2>
                <button
                  onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
                  className="p-1 sm:p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {isConsoleCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {!isConsoleCollapsed && (
                <div
                  ref={timelineRef}
                  className="flex-1 bg-black rounded-lg p-2 sm:p-4 font-mono text-xs sm:text-sm overflow-y-auto max-h-[150px] sm:max-h-[300px]"
                >
                  {logs.length === 0 ? (
                    <div className="text-gray-500">Ready to start vital signs collection...</div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1 flex items-center gap-1 sm:gap-2">
                        <span className="text-gray-400">{log.timestamp}</span>
                        <span
                          className={`px-1 py-0.5 sm:px-2 rounded text-[10px] sm:text-xs font-medium ${
                            log.level === "Action" && log.category
                              ? getCategoryColor(log.category)
                              : log.level === "Vitals"
                                ? "bg-blue-900 text-blue-300"
                                : log.level === "Success"
                                  ? "bg-green-900 text-green-300"
                                  : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          [{log.level}]
                        </span>
                        <span className="text-gray-200">{log.message}</span>
                        {log.duration && <span className="text-yellow-400 ml-auto">({log.duration})</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Vital Signs Display - Right Side */}
          <Card className="bg-gray-900 border-gray-700 p-3 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Vital Signs</h2>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4">
              {/* Blood Pressure */}
              <Card className="bg-black/40 border-gray-600 p-2 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Blood Pressure</h3>
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400">mmHg</div>
                <div className="mt-1 sm:mt-2">
                  <div
                    className={`w-2 h-8 sm:h-16 rounded-full ${
                      getVitalStatus("bloodPressure", vitals.bloodPressure.systolic) === "warning"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                </div>
              </Card>

              {/* Heart Rate */}
              <Card className="bg-black/40 border-gray-600 p-2 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Heart Rate</h3>
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">{vitals.heartRate}</div>
                <div className="text-[10px] sm:text-xs text-gray-400">bpm</div>
                <Progress value={(vitals.heartRate / 120) * 100} className="mt-1 sm:mt-2 h-1 sm:h-2" />
              </Card>

              {/* Body Temperature */}
              <Card className="bg-black/40 border-gray-600 p-2 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Body Temperature</h3>
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">{vitals.temperature}°F</div>
                <div className="text-[10px] sm:text-xs text-gray-400">Fahrenheit</div>
                <div
                  className={`mt-1 sm:mt-2 w-full h-1 sm:h-2 rounded-full ${
                    getVitalStatus("temperature", vitals.temperature) === "warning" ? "bg-yellow-500" : "bg-green-500"
                  }`}
                />
              </Card>

              {/* Respiratory Rate */}
              <Card className="bg-black/40 border-gray-600 p-2 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">Respiratory Rate</h3>
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">{vitals.respiratoryRate}</div>
                <div className="text-[10px] sm:text-xs text-gray-400">breaths/min</div>
                <Progress value={(vitals.respiratoryRate / 30) * 100} className="mt-1 sm:mt-2 h-1 sm:h-2" />
              </Card>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}