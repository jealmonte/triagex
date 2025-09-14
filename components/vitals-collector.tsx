import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Heart, Thermometer, Wind, Zap } from "lucide-react";

// Helper functions to store data in localStorage for hospital sync
const addVitalSigns = (patientId: string, vitals: any) => {
  const existing = JSON.parse(localStorage.getItem("traumaVitals") || "{}");
  if (!existing[patientId]) existing[patientId] = [];
  existing[patientId].push(vitals);
  localStorage.setItem("traumaVitals", JSON.stringify(existing));
  // Trigger sync
  window.dispatchEvent(new CustomEvent('triageXDataUpdated'));
};

const addTimelineAction = (patientId: string, action: any) => {
  const existing = JSON.parse(localStorage.getItem("traumaTimeline") || "{}");
  if (!existing[patientId]) existing[patientId] = [];
  existing[patientId].push(action);
  localStorage.setItem("traumaTimeline", JSON.stringify(existing));
  // Trigger sync
  window.dispatchEvent(new CustomEvent('triageXDataUpdated'));
};

interface VitalsCollectorProps {
  patientId: string;
  patientName: string;
}

export const VitalsCollector: React.FC<VitalsCollectorProps> = ({ 
  patientId, 
  patientName
}) => {
  const [vitals, setVitals] = useState({
    heartRate: '',
    bpSystolic: '',
    bpDiastolic: '',
    respiratoryRate: '',
    temperature: '',
    oxygenSaturation: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const vitalSigns = {
      timestamp: new Date(),
      heartRate: parseInt(vitals.heartRate) || 0,
      bpSystolic: parseInt(vitals.bpSystolic) || 0,
      bpDiastolic: parseInt(vitals.bpDiastolic) || 0,
      respiratoryRate: parseInt(vitals.respiratoryRate) || 0,
      temperature: parseFloat(vitals.temperature) || 0,
      oxygenSaturation: parseInt(vitals.oxygenSaturation) || 0,
      source: 'manual'
    };

    // Store in localStorage for hospital sync
    addVitalSigns(patientId, vitalSigns);

    // Add timeline action
    addTimelineAction(patientId, {
      timestamp: new Date(),
      action: 'Vital signs recorded',
      actionType: 'assessment',
      details: `Manual vital signs recorded for ${patientName}: HR ${vitalSigns.heartRate}, BP ${vitalSigns.bpSystolic}/${vitalSigns.bpDiastolic}, RR ${vitalSigns.respiratoryRate}, Temp ${vitalSigns.temperature}°F, SpO2 ${vitalSigns.oxygenSaturation}%`,
      vitals: vitalSigns,
      source: 'trauma-site'
    });

    // Clear form
    setVitals({
      heartRate: '',
      bpSystolic: '',
      bpDiastolic: '',
      respiratoryRate: '',
      temperature: '',
      oxygenSaturation: ''
    });
    
    setIsSubmitting(false);
    
    // Show success message
    alert(`Vital signs recorded successfully for ${patientName}!`);
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Record Vital Signs - {patientName}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Heart Rate */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Heart className="w-4 h-4 inline mr-1 text-red-400" />
                Heart Rate (BPM)
              </label>
              <input
                type="number"
                value={vitals.heartRate}
                onChange={(e) => setVitals(prev => ({ ...prev, heartRate: e.target.value }))}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="60-100"
                min="30"
                max="200"
              />
            </div>

            {/* Blood Pressure Systolic */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Zap className="w-4 h-4 inline mr-1 text-blue-400" />
                BP Systolic (mmHg)
              </label>
              <input
                type="number"
                value={vitals.bpSystolic}
                onChange={(e) => setVitals(prev => ({ ...prev, bpSystolic: e.target.value }))}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="90-140"
                min="50"
                max="250"
              />
            </div>

            {/* Blood Pressure Diastolic */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Zap className="w-4 h-4 inline mr-1 text-green-400" />
                BP Diastolic (mmHg)
              </label>
              <input
                type="number"
                value={vitals.bpDiastolic}
                onChange={(e) => setVitals(prev => ({ ...prev, bpDiastolic: e.target.value }))}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="60-90"
                min="30"
                max="150"
              />
            </div>

            {/* Respiratory Rate */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Wind className="w-4 h-4 inline mr-1 text-cyan-400" />
                Respiratory Rate (/min)
              </label>
              <input
                type="number"
                value={vitals.respiratoryRate}
                onChange={(e) => setVitals(prev => ({ ...prev, respiratoryRate: e.target.value }))}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="12-20"
                min="5"
                max="50"
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Thermometer className="w-4 h-4 inline mr-1 text-orange-400" />
                Temperature (°F)
              </label>
              <input
                type="number"
                step="0.1"
                value={vitals.temperature}
                onChange={(e) => setVitals(prev => ({ ...prev, temperature: e.target.value }))}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="98.6"
                min="90"
                max="110"
              />
            </div>

            {/* Oxygen Saturation */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Activity className="w-4 h-4 inline mr-1 text-purple-400" />
                SpO2 (%)
              </label>
              <input
                type="number"
                value={vitals.oxygenSaturation}
                onChange={(e) => setVitals(prev => ({ ...prev, oxygenSaturation: e.target.value }))}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="95-100"
                min="60"
                max="100"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
          >
            {isSubmitting ? 'Recording...' : 'Record Vital Signs'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Quick Actions Component for Timeline
interface QuickActionsProps {
  patientId: string;
  patientName: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ patientId, patientName }) => {
  const handleQuickAction = (action: string, actionType: 'assessment' | 'treatment' | 'medication' | 'emergency', details: string) => {
    addTimelineAction(patientId, {
      timestamp: new Date(),
      action,
      actionType,
      details: `${details} for ${patientName}`,
      source: 'trauma-site'
    });
    
    alert(`${action} recorded for ${patientName}`);
  };

  const quickActions = [
    {
      label: 'IV Access',
      action: 'IV Access Established',
      type: 'treatment' as const,
      details: 'Intravenous access established',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      label: 'Oxygen',
      action: 'Oxygen Administered',
      type: 'treatment' as const,
      details: 'Supplemental oxygen therapy initiated',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      label: 'Pain Relief',
      action: 'Pain Management',
      type: 'medication' as const,
      details: 'Pain relief medication administered',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      label: 'Bandaging',
      action: 'Wound Care',
      type: 'treatment' as const,
      details: 'Wound cleaning and bandaging completed',
      color: 'bg-yellow-600 hover:bg-yellow-700'
    },
    {
      label: 'Splinting',
      action: 'Splinting Applied',
      type: 'treatment' as const,
      details: 'Immobilization splint applied to injured limb',
      color: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      label: 'Emergency',
      action: 'Emergency Intervention',
      type: 'emergency' as const,
      details: 'Emergency medical intervention performed',
      color: 'bg-red-600 hover:bg-red-700'
    }
  ];

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions - {patientName}</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((quickAction, index) => (
            <Button
              key={index}
              onClick={() => handleQuickAction(quickAction.action, quickAction.type, quickAction.details)}
              className={`${quickAction.color} text-white font-medium py-2 px-4 transition-all duration-200`}
            >
              {quickAction.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};