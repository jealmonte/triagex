const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000/api";

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  console.log(`[API HTTP] Calling: ${API_BASE}${path}`, options);
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  console.log(`[API HTTP] Response: ${res.status} for ${path}`);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface TraumaSiteDTO {
  id: number | string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  created_at?: string;
}

export interface PatientDTO {
  id: number | string;
  site: number | string;           // FK: TraumaSite id
  name: string;
  triage_level: "red" | "yellow" | "green" | "black";
  triage_status: string;
  created_at?: string;

  // Extended fields matching your modal
  age?: number;
  gender?: string;
  chief_complaint?: string;
  chief_complaint_other?: string;
  consciousness?: string;
  mechanism?: string;
  mechanism_other?: string;
  visible_injuries?: boolean;
  selected_injuries?: string[];
  medical_alert?: boolean;
  allergies_history?: boolean;
  allergies_details?: string;
}

export const api = {
  // Trauma sites
  listSites: () => http<TraumaSiteDTO[]>("/trauma-sites/"),
  createSite: (payload: Partial<TraumaSiteDTO>) =>
    http<TraumaSiteDTO>("/trauma-sites/", { method: "POST", body: JSON.stringify(payload) }),
  deleteSite: (id: number | string) =>
    http<void>(`/trauma-sites/${id}/`, { method: "DELETE" }),

  // Patients
  listPatients: (siteId?: number | string) =>
    siteId ? http<PatientDTO[]>(`/patients/?site=${siteId}`) : http<PatientDTO[]>("/patients/"),
  getPatient: (id: number | string) => http<PatientDTO>(`/patients/${id}/`),
  createPatient: (payload: Partial<PatientDTO>) =>
    http<PatientDTO>("/patients/", { method: "POST", body: JSON.stringify(payload) }),
  updatePatient: (id: number | string, payload: Partial<PatientDTO>) =>
    http<PatientDTO>(`/patients/${id}/`, { method: "PUT", body: JSON.stringify(payload) }),
  patchPatient: (id: number | string, payload: Partial<PatientDTO>) =>
    http<PatientDTO>(`/patients/${id}/`, { method: "PATCH", body: JSON.stringify(payload) }),
  deletePatient: (id: number | string) =>
    http<void>(`/patients/${id}/`, { method: "DELETE" }),
};
