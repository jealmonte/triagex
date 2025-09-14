import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Menu, X, Users, AlertCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);


// TypeScript interfaces (same as before)
interface PatientInfo {
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

interface PatientData {
  patientInfo: PatientInfo;
  vitalSigns: VitalSigns[];
  timeline: ParamedicAction[];
}

interface HospitalDashboardProps {
  allPatients: PatientData[];
  selectedPatientId: string;
  onPatientSelect: (patientId: string) => void;
  onDataUpdate: (patientId: string, newData: any) => void;
  onNewPatient: (patientData: PatientData) => void;
  className?: string;
}

const HospitalDashboard: React.FC<HospitalDashboardProps> = ({
  allPatients,
  selectedPatientId,
  onPatientSelect,
  onDataUpdate,
  onNewPatient,
  className = ''
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [collapsedSites, setCollapsedSites] = useState<Set<string>>(new Set());
  const [aiSummary, setAiSummary] = useState('');
  const chartRef = useRef<ChartJS<'line', any, any>>(null);
  const router = useRouter();

  const normalRanges = {
    heartRate: { min: 60, max: 100 },
    bpSystolic: { min: 90, max: 140 },
    bpDiastolic: { min: 60, max: 90 },
    respiratoryRate: { min: 12, max: 20 },
    temperature: { min: 97.0, max: 99.0 },
    oxygenSaturation: { min: 95, max: 100 }
  };

  // Group patients by trauma site
  const traumaSites = allPatients.reduce((sites, patient) => {
    const siteId = patient.patientInfo.traumaSiteId;
    if (!sites[siteId]) {
      sites[siteId] = {
        id: siteId,
        name: patient.patientInfo.traumaSiteName,
        patients: []
      };
    }
    sites[siteId].patients.push(patient);
    return sites;
  }, {} as Record<string, { id: string; name: string; patients: PatientData[] }>);

  // Get currently selected patient
  const selectedPatient = allPatients.find(p => p.patientInfo.id === selectedPatientId);

  const handleLogoClick = () => router.push('/');
  const handleBackClick = () => router.push('/trauma-site');

  const toggleSiteCollapse = (siteId: string) => {
    setCollapsedSites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(siteId)) {
        newSet.delete(siteId);
      } else {
        newSet.add(siteId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'bg-red-900 text-red-300 border-red-700';
      case 'Stable': return 'bg-yellow-900 text-yellow-300 border-yellow-700';  // Changed from green
      case 'Improving': return 'bg-green-900 text-green-300 border-green-700';  // Changed from blue
      case 'Deceased': return 'bg-gray-900 text-gray-300 border-gray-700';
      default: return 'bg-gray-900 text-gray-300 border-gray-700';
    }
  };


  const getVitalStatus = (value: number, range: { min: number; max: number }): string => {
    if (!value || value === 0) return 'unknown';
    if (value < range.min || value > range.max) return 'critical';
    if (value < range.min * 1.1 || value > range.max * 0.9) return 'warning';
    return 'normal';
  };

  const formatVitalValue = (value: number, type: string): string => {
    if (!value || value === 0) return 'N/A';
    switch (type) {
      case 'temperature': return (Math.round(value * 10) / 10).toString();
      default: return Math.round(value).toString();
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeAgo = (date: Date): string => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  // --- Gemini AI Summary Integration ---
  const fetchAISummary = async (patientData: PatientData) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/ai-summary/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientData })
      });
      const result = await response.json();
      setAiSummary(result.summary || 'Summary not available.');
    } catch (err) {
      setAiSummary('Failed to load AI summary.');
    }
  };

  useEffect(() => {
    if (!selectedPatient) {
      setAiSummary('No patient selected for analysis');
      return;
    }
    setAiSummary('Loading AI summary...');
    fetchAISummary(selectedPatient);
  }, [selectedPatient]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!selectedPatient) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Patient Selected</h2>
          <p className="text-gray-400">Please select a patient from the sidebar</p>
        </div>
      </div>
    );
  }

  const { patientInfo, vitalSigns, timeline } = selectedPatient;
  const latestVitals = vitalSigns[vitalSigns.length - 1];

  // Chart data for selected patient - only show if we have real vitals
  const hasRealVitals = vitalSigns.length > 0 && vitalSigns.some(v => v.heartRate > 0);
  const chartData = hasRealVitals ? {
    labels: vitalSigns.filter(vs => vs.heartRate > 0).map(vs => formatTimestamp(vs.timestamp)),
    datasets: [
      {
        label: 'Heart Rate',
        data: vitalSigns.filter(vs => vs.heartRate > 0).map(vs => Math.round(vs.heartRate)),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y-heart',
        tension: 0.4,
      },
      {
        label: 'BP Systolic',
        data: vitalSigns.filter(vs => vs.heartRate > 0).map(vs => Math.round(vs.bpSystolic)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y-bp',
        tension: 0.4,
      },
      {
        label: 'BP Diastolic',
        data: vitalSigns.filter(vs => vs.heartRate > 0).map(vs => Math.round(vs.bpDiastolic)),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y-bp',
        tension: 0.4,
      },
      {
        label: 'SpO2',
        data: vitalSigns.filter(vs => vs.heartRate > 0).map(vs => Math.round(vs.oxygenSaturation)),
        borderColor: 'rgb(6, 182, 212)',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        yAxisID: 'y-spo2',
        tension: 0.4,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Real-Time Vital Signs Monitoring',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
      'y-heart': {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Heart Rate (BPM)',
        },
        min: 30,
        max: 180,
      },
      'y-bp': {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Blood Pressure (mmHg)',
        },
        min: 40,
        max: 200,
      },
      'y-spo2': {
        type: 'linear' as const,
        display: false,
        min: 80,
        max: 100,
      },
    },
  };

  return (
    <div className={`hospital-dashboard ${className} min-h-screen bg-black text-white flex`}>
      {/* Sidebar */}
      <div className={`bg-gray-900 border-r border-gray-700 transition-all duration-300 ${
        isSidebarOpen ? 'w-80' : 'w-16'
      } flex-shrink-0`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className={`font-semibold text-white transition-all ${isSidebarOpen ? 'block' : 'hidden'}`}>
              Active Patients
            </h2>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
          {isSidebarOpen && (
            <p className="text-xs text-gray-400 mt-1">
              {allPatients.length} patients across {Object.keys(traumaSites).length} sites
            </p>
          )}
        </div>

        {isSidebarOpen && (
          <div className="p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
            {Object.values(traumaSites).map(site => (
              <div key={site.id} className="mb-4">
                <button
                  onClick={() => toggleSiteCollapse(site.id)}
                  className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-800 rounded-lg transition-colors mb-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-200">{site.name}</span>
                    <span className="text-xs text-gray-400">({site.patients.length})</span>
                  </div>
                  {collapsedSites.has(site.id) ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>

                {!collapsedSites.has(site.id) && (
                  <div className="space-y-2 ml-4">
                    {site.patients.map(patient => (
                      <button
                        key={patient.patientInfo.id}
                        onClick={() => onPatientSelect(patient.patientInfo.id)}
                        className={`w-full p-3 rounded-lg transition-all text-left ${
                          selectedPatientId === patient.patientInfo.id 
                            ? 'bg-blue-900 border border-blue-700' 
                            : 'bg-gray-800 hover:bg-gray-750 border border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white text-sm">{patient.patientInfo.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(patient.patientInfo.status)}`}>
                            {patient.patientInfo.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mb-1">
                          {patient.patientInfo.age}y {patient.patientInfo.gender} • {patient.patientInfo.caseId}
                        </div>
                        <div className="text-xs text-gray-400">
                          {patient.patientInfo.initialComplaint}
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            ETA: {patient.patientInfo.eta || 'N/A'}m
                          </span>
                          <span className="text-gray-500">
                            {getTimeAgo(patient.patientInfo.lastUpdate)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isSidebarOpen && (
          <div className="p-2 space-y-2">
            {allPatients.map(patient => (
              <button
                key={patient.patientInfo.id}
                onClick={() => onPatientSelect(patient.patientInfo.id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  selectedPatientId === patient.patientInfo.id 
                    ? 'bg-blue-900' 
                    : patient.patientInfo.status === 'Critical'
                    ? 'bg-red-900 hover:bg-red-800'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                title={`${patient.patientInfo.name} - ${patient.patientInfo.status}`}
              >
                {patient.patientInfo.status === 'Critical' ? <AlertCircle size={16} /> : <Users size={16} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Dashboard Content */}
      <div className="flex-1 p-2 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Navigation Header */}
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
              Hospital Command Center - Monitoring {allPatients.length} patients
            </p>
          </div>

          {/* Selected Patient Header */}
          <div className="bg-gray-900 border-gray-700 rounded-lg p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-white">{patientInfo.name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(patientInfo.status)}`}>
                  {patientInfo.status.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-300 text-sm">
                {patientInfo.age} years old • {patientInfo.gender} • Case: {patientInfo.caseId}
              </p>
              <p className="text-gray-300 text-sm">
                Unit: {patientInfo.paramedicUnit} • Site: {patientInfo.traumaSiteName}
                {patientInfo.eta && ` • ETA: ${patientInfo.eta} min`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last Update</p>
              <p className="text-sm text-white">{getTimeAgo(patientInfo.lastUpdate)}</p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* AI Summary */}
            <div className="bg-gray-900 border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">AI Clinical Summary</h3>
                <span className="text-xs text-gray-400">
                  Updated: {formatTimestamp(currentTime)}
                </span>
              </div>
              <div className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                {aiSummary}
              </div>
            </div>

            {/* Current Vitals */}
            <div className="bg-gray-900 border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Current Vital Signs</h3>
              <div className="grid grid-cols-2 gap-4">
                {latestVitals && latestVitals.heartRate > 0 ? (
                  <>
                    <div className="bg-black/40 border-gray-600 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">HEART RATE</p>
                      <p className={`text-2xl font-bold font-mono ${
                        getVitalStatus(latestVitals.heartRate, normalRanges.heartRate) === 'critical' ? 'text-red-400' :
                        getVitalStatus(latestVitals.heartRate, normalRanges.heartRate) === 'warning' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {formatVitalValue(latestVitals.heartRate, 'heartRate')}
                      </p>
                      <p className="text-xs text-gray-400">BPM</p>
                      <p className="text-xs text-gray-500 mt-1">{getTimeAgo(latestVitals.timestamp)}</p>
                    </div>
                    
                    <div className="bg-black/40 border-gray-600 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">BLOOD PRESSURE</p>
                      <p className={`text-2xl font-bold font-mono ${
                        getVitalStatus(latestVitals.bpSystolic, normalRanges.bpSystolic) === 'critical' ? 'text-red-400' :
                        getVitalStatus(latestVitals.bpSystolic, normalRanges.bpSystolic) === 'warning' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {formatVitalValue(latestVitals.bpSystolic, 'bp')}/{formatVitalValue(latestVitals.bpDiastolic, 'bp')}
                      </p>
                      <p className="text-xs text-gray-400">mmHg</p>
                      <p className="text-xs text-gray-500 mt-1">{getTimeAgo(latestVitals.timestamp)}</p>
                    </div>
                    
                    <div className="bg-black/40 border-gray-600 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">SpO2</p>
                      <p className={`text-2xl font-bold font-mono ${
                        getVitalStatus(latestVitals.oxygenSaturation, normalRanges.oxygenSaturation) === 'critical' ? 'text-red-400' :
                        getVitalStatus(latestVitals.oxygenSaturation, normalRanges.oxygenSaturation) === 'warning' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {formatVitalValue(latestVitals.oxygenSaturation, 'spo2')}
                      </p>
                      <p className="text-xs text-gray-400">%</p>
                      <p className="text-xs text-gray-500 mt-1">{getTimeAgo(latestVitals.timestamp)}</p>
                    </div>
                    
                    <div className="bg-black/40 border-gray-600 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-400 mb-1">RESPIRATORY RATE</p>
                      <p className={`text-2xl font-bold font-mono ${
                        getVitalStatus(latestVitals.respiratoryRate, normalRanges.respiratoryRate) === 'critical' ? 'text-red-400' :
                        getVitalStatus(latestVitals.respiratoryRate, normalRanges.respiratoryRate) === 'warning' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {formatVitalValue(latestVitals.respiratoryRate, 'rr')}
                      </p>
                      <p className="text-xs text-gray-400">per min</p>
                      <p className="text-xs text-gray-500 mt-1">{getTimeAgo(latestVitals.timestamp)}</p>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                    <p className="text-gray-400">No vital signs recorded yet</p>
                    <p className="text-sm text-gray-500">Vitals will appear here when taken from the trauma site</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vital Signs Chart */}
          {hasRealVitals && chartData && (
            <div className="bg-gray-900 border-gray-700 rounded-lg p-6 mb-6 h-96">
              <Line ref={chartRef} data={chartData} options={chartOptions} />
            </div>
          )}

          {!hasRealVitals && (
            <div className="bg-gray-900 border-gray-700 rounded-lg p-6 mb-6 h-96 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                <h3 className="text-lg font-semibold text-white mb-2">No Vital Signs Chart Available</h3>
                <p className="text-gray-400 mb-4">Chart will appear when vital signs are recorded from the trauma site</p>
                <button
                  onClick={handleBackClick}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                >
                  Go to Trauma Site to Record Vitals
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gray-900 border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Paramedic Timeline & Actions</h3>
            <div className="max-h-96 overflow-y-auto">
              {timeline.length > 0 ? (
                timeline.map((action, index) => (
                  <div key={index} className="flex gap-4 mb-4 pb-4 border-b border-gray-700 last:border-b-0">
                    <div className="text-xs text-gray-400 min-w-20">
                      {formatTimestamp(action.timestamp)}
                    </div>
                    <div className={`flex-1 border-l-2 pl-4 ${
                      action.actionType === 'emergency' ? 'border-red-500' :
                      action.actionType === 'treatment' ? 'border-green-500' :
                      action.actionType === 'medication' ? 'border-purple-500' :
                      action.actionType === 'transport' ? 'border-orange-500' :
                      'border-blue-500'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white">{action.action}</p>
                        {action.source && (
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">
                            {action.source}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300">{action.details}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No actions recorded yet</p>
                  <p className="text-sm">Timeline will appear when actions are taken from the trauma site</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
