'use client';

import React, { useState, useEffect } from 'react';
import HospitalDashboard from '../../components/hospital-dashboard/hospital-dashboard';
import { useTriageXData } from '../../lib/useTriageXData';

export default function HospitalPage() {
  const { hospitalPatients, isLoading } = useTriageXData();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  // Set default selected patient
  useEffect(() => {
    if (!selectedPatientId && hospitalPatients.length > 0) {
      // Prioritize critical patients first
      const criticalPatient = hospitalPatients.find((p) => p.patientInfo.status === 'Critical');
      setSelectedPatientId(criticalPatient?.patientInfo.id || hospitalPatients[0].patientInfo.id);
    }
  }, [selectedPatientId, hospitalPatients]);

  // Function to handle data updates (for future real-time vital signs updates)
  const handleDataUpdate = (patientId: string, newData: any) => {
    console.log(`Received data update for patient ${patientId}:`, newData);
    
    // For now, this is a placeholder for future real-time vital signs integration
    // You could implement WebSocket connections or periodic API calls here
  };

  // Function to add new patient (called when new patient added from trauma site)
  const addNewPatient = (patientData: any) => {
    console.log('New patient added:', patientData);
    // This will be handled automatically by the localStorage sync in the hook
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading Hospital Dashboard...</h2>
          <p className="text-gray-400">Syncing with TriageX field operations</p>
        </div>
      </div>
    );
  }

  if (hospitalPatients.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-2xl">🏥</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Patients Currently</h2>
          <p className="text-gray-400 mb-4">
            No active patients found in trauma sites.<br />
            Add patients from the trauma site to see them here.
          </p>
          <button
            onClick={() => window.location.href = '/trauma-site'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Go to Trauma Site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hospital-page">
      <HospitalDashboard
        allPatients={hospitalPatients}
        selectedPatientId={selectedPatientId}
        onPatientSelect={setSelectedPatientId}
        onDataUpdate={handleDataUpdate}
        onNewPatient={addNewPatient}
      />
    </div>
  );
}