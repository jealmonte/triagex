"use client";

import { useState } from "react";
import { useTriageXData } from "@/lib/useTriageXData";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";

export default function HospitalDashboard() {
  const { hospitalPatients, isLoading } = useTriageXData();
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading Hospital Dashboard...</p>
      </div>
    );
  }

  if (hospitalPatients.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>No patients found.</p>
      </div>
    );
  }

  const patient = hospitalPatients[selectedPatientIndex];
  const timeline = patient.timeline || [];

  // Prepare vitals data points from timeline entries that have vitals info
  const vitalsData = timeline
    .filter((e) => e.vitals)
    .map((e) => ({
      time: new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      BP: e.vitals?.bpSystolic,
      HR: e.vitals?.heartRate,
      RR: e.vitals?.respiratoryRate,
      Temp: e.vitals?.temperature,
    }));

  return (
    <section className="min-h-screen bg-black text-white px-4 py-6">
      <h1 className="text-3xl mb-4">Hospital Dashboard - Patient: {patient.patientInfo.name}</h1>

      <select
        className="mb-4 p-2 rounded bg-gray-800 text-white"
        value={selectedPatientIndex}
        onChange={(e) => setSelectedPatientIndex(parseInt(e.target.value))}
      >
        {hospitalPatients.map((p, i) => (
          <option key={p.patientInfo.id} value={i}>
            {p.patientInfo.name}
          </option>
        ))}
      </select>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Real-Time Vital Trends</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={vitalsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="BP" stroke="#8b5cf6" dot={false} name="Blood Pressure" />
            <Line type="monotone" dataKey="HR" stroke="#ef4444" dot={false} name="Heart Rate" />
            <Line type="monotone" dataKey="RR" stroke="#22d3ee" dot={false} name="Respiratory Rate" />
            <Line type="monotone" dataKey="Temp" stroke="#f59e42" dot={false} name="Temperature" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow max-h-64 overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Paramedic Timeline</h2>
        <ul className="space-y-2 text-sm">
          {timeline.length === 0 && <li className="text-gray-400">No timeline events recorded.</li>}
          {timeline.map((event, idx) => (
            <li key={idx} className="flex flex-col">
              <span className="text-gray-400">
                {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span>
                <span className="font-bold text-violet-400">{event.actionType}</span>:{" "}
                <span className="text-white">{event.action}</span>
                {event.vitals && (
                  <>
                    {" "}
                    | Vitals - BP: {event.vitals.bpSystolic}/{event.vitals.bpDiastolic}, HR: {event.vitals.heartRate}, RR:{" "}
                    {event.vitals.respiratoryRate}, Temp: {event.vitals.temperature}°F
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
