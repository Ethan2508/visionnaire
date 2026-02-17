"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Clock, User, Plus, ChevronLeft, ChevronRight, Loader2, Trash2, Check, X, Mail, Phone, MessageSquare } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  examen_vue: "Examen de vue",
  essayage: "Essayage",
  ajustement: "Ajustement",
  conseil: "Conseil personnalisé",
};

const STATUS_COLORS: Record<string, string> = {
  confirmee: "bg-green-100 text-green-800",
  annulee: "bg-red-100 text-red-800",
  terminee: "bg-stone-100 text-stone-600",
};

const REQUEST_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  contacted: "Contacté",
  confirmed: "Confirmé",
  cancelled: "Annulé",
};

interface Appointment {
  id: string;
  type: string;
  status: string;
  notes: string | null;
  created_at: string;
  slot: { id: string; date: string; start_time: string; end_time: string };
  profile: { id: string; first_name: string; last_name: string; email: string; phone: string | null };
}

interface AppointmentRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reason: string;
  preferred_date: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

interface Slot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function RendezVousAdminPage() {
  const [tab, setTab] = useState<"demandes" | "rdv" | "creneaux">("demandes");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  // Slot creation form
  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("09:30");
  const [generatingSlots, setGeneratingSlots] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: rdvs }, { data: slotData }, { data: requestData }] = await Promise.all([
      supabase.from("appointments").select("*, slot:appointment_slots(*), profile:profiles(id, first_name, last_name, email, phone)").order("created_at", { ascending: false }),
      supabase.from("appointment_slots").select("*").order("date", { ascending: true }).order("start_time", { ascending: true }),
      supabase.from("appointment_requests").select("*").order("created_at", { ascending: false }),
    ]);
    setAppointments((rdvs as unknown as Appointment[]) || []);
    setSlots((slotData as Slot[]) || []);
    setRequests((requestData as AppointmentRequest[]) || []);
    setLoading(false);
  }

  async function updateRequestStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("appointment_requests").update({ status } as never).eq("id", id);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("appointments").update({ status } as never).eq("id", id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    // If cancelled, free the slot
    if (status === "annulee") {
      const appt = appointments.find((a) => a.id === id);
      if (appt) await supabase.from("appointment_slots").update({ is_available: true } as never).eq("id", appt.slot.id);
    }
  }

  async function addSlot() {
    if (!newSlotDate || !newSlotStart || !newSlotEnd) return;
    const supabase = createClient();
    const { error } = await supabase.from("appointment_slots").insert({
      date: newSlotDate,
      start_time: newSlotStart,
      end_time: newSlotEnd,
      is_available: true,
    } as never);
    if (error) { alert("Erreur : " + error.message); return; }
    load();
  }

  async function generateDaySlots() {
    if (!newSlotDate) return;
    setGeneratingSlots(true);
    const supabase = createClient();
    const slotsToCreate = [];
    for (let h = 9; h < 18; h++) {
      if (h === 12) continue; // Skip lunch
      slotsToCreate.push({
        date: newSlotDate,
        start_time: `${String(h).padStart(2, "0")}:00`,
        end_time: `${String(h).padStart(2, "0")}:30`,
        is_available: true,
      });
      slotsToCreate.push({
        date: newSlotDate,
        start_time: `${String(h).padStart(2, "0")}:30`,
        end_time: `${String(h + 1).padStart(2, "0")}:00`,
        is_available: true,
      });
    }
    const { error } = await supabase.from("appointment_slots").upsert(slotsToCreate as never[], { onConflict: "date,start_time" });
    if (error) alert("Erreur : " + error.message);
    setGeneratingSlots(false);
    load();
  }

  async function deleteSlot(id: string) {
    if (!confirm("Supprimer ce créneau ?")) return;
    const supabase = createClient();
    await supabase.from("appointment_slots").delete().eq("id", id);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleSlotAvailability(slot: Slot) {
    const supabase = createClient();
    await supabase.from("appointment_slots").update({ is_available: !slot.is_available } as never).eq("id", slot.id);
    setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, is_available: !s.is_available } : s)));
  }

  // Filtered slots for current week view
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1 + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [weekOffset]);

  const weekSlots = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return slots.filter((s) => {
      const d = new Date(s.date);
      return d >= weekStart && d < end;
    });
  }, [slots, weekStart]);

  const upcomingAppointments = appointments.filter((a) => a.status !== "annulee").sort((a, b) => (a.slot.date + a.slot.start_time).localeCompare(b.slot.date + b.slot.start_time));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-stone-400" size={32} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Rendez-vous</h1>
        <div className="flex bg-stone-100 rounded-lg p-0.5">
          <button onClick={() => setTab("demandes")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "demandes" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}`}>
            Demandes {requests.filter(r => r.status === "pending").length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-xs rounded-full">{requests.filter(r => r.status === "pending").length}</span>}
          </button>
          <button onClick={() => setTab("rdv")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "rdv" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}`}>Rendez-vous</button>
          <button onClick={() => setTab("creneaux")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "creneaux" ? "bg-white shadow-sm text-stone-900" : "text-stone-500 hover:text-stone-700"}`}>Créneaux</button>
        </div>
      </div>

      {tab === "demandes" && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
              <p>Aucune demande de rendez-vous</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} className="text-stone-400" />
                      <span className="text-sm font-semibold text-stone-900">{req.first_name} {req.last_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REQUEST_STATUS_COLORS[req.status] || REQUEST_STATUS_COLORS.pending}`}>
                        {REQUEST_STATUS_LABELS[req.status] || "En attente"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mb-2">
                      <span className="flex items-center gap-1"><Mail size={12} /> {req.email}</span>
                      <span className="flex items-center gap-1"><Phone size={12} /> {req.phone}</span>
                      {req.preferred_date && <span className="flex items-center gap-1"><Calendar size={12} /> {req.preferred_date}</span>}
                    </div>
                    <div className="text-sm text-stone-700 mb-1">
                      <span className="font-medium">Motif :</span> {TYPE_LABELS[req.reason] || req.reason}
                    </div>
                    {req.message && (
                      <p className="text-sm text-stone-600 bg-stone-50 p-2 rounded-lg mt-2">{req.message}</p>
                    )}
                    <p className="text-xs text-stone-400 mt-2">Reçu le {new Date(req.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {req.status === "pending" && (
                      <>
                        <button onClick={() => updateRequestStatus(req.id, "contacted")} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">Contacté</button>
                        <button onClick={() => updateRequestStatus(req.id, "confirmed")} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">Confirmé</button>
                        <button onClick={() => updateRequestStatus(req.id, "cancelled")} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">Annulé</button>
                      </>
                    )}
                    {req.status === "contacted" && (
                      <>
                        <button onClick={() => updateRequestStatus(req.id, "confirmed")} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">Confirmé</button>
                        <button onClick={() => updateRequestStatus(req.id, "cancelled")} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">Annulé</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "rdv" && (
        <div className="space-y-3">
          {/* RDV confirmés depuis les demandes */}
          {requests.filter(r => r.status === "confirmed").length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-stone-700 mb-3">Rendez-vous confirmés (demandes)</h2>
              <div className="space-y-3">
                {requests.filter(r => r.status === "confirmed").map((req) => (
                  <div key={req.id} className="bg-white rounded-xl border border-green-200 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User size={14} className="text-stone-400" />
                          <span className="text-sm font-semibold text-stone-900">{req.first_name} {req.last_name}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Confirmé</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500">
                          <span className="flex items-center gap-1"><Mail size={12} /> {req.email}</span>
                          <span className="flex items-center gap-1"><Phone size={12} /> {req.phone}</span>
                          {req.preferred_date && <span className="flex items-center gap-1"><Calendar size={12} /> {req.preferred_date}</span>}
                          <span className="bg-stone-100 px-2 py-0.5 rounded text-xs">{TYPE_LABELS[req.reason] || req.reason}</span>
                        </div>
                        {req.message && <p className="text-xs text-stone-500 mt-1 italic">{req.message}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => updateRequestStatus(req.id, "completed")} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">Terminé</button>
                        <button onClick={() => updateRequestStatus(req.id, "cancelled")} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">Annuler</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RDV depuis le système de créneaux */}
          {upcomingAppointments.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-stone-700 mb-3">Rendez-vous (créneaux)</h2>
              <div className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={14} className="text-stone-400" />
                        <span className="text-sm font-semibold text-stone-900">{appt.profile.first_name} {appt.profile.last_name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[appt.status]}`}>{appt.status === "confirmee" ? "Confirmé" : appt.status === "annulee" ? "Annulé" : "Terminé"}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(appt.slot.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {appt.slot.start_time.slice(0, 5)} - {appt.slot.end_time.slice(0, 5)}</span>
                        <span className="bg-stone-100 px-2 py-0.5 rounded text-xs">{TYPE_LABELS[appt.type] || appt.type}</span>
                      </div>
                      {appt.notes && <p className="text-xs text-stone-500 mt-1 italic">{appt.notes}</p>}
                      <p className="text-xs text-stone-400 mt-1">{appt.profile.email}{appt.profile.phone ? ` · ${appt.profile.phone}` : ""}</p>
                    </div>
                    {appt.status === "confirmee" && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => updateStatus(appt.id, "terminee")} className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors" title="Marquer terminé"><Check size={16} /></button>
                        <button onClick={() => updateStatus(appt.id, "annulee")} className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors" title="Annuler"><X size={16} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {requests.filter(r => r.status === "confirmed").length === 0 && upcomingAppointments.length === 0 && (
            <div className="text-center py-16 text-stone-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-50" />
              <p>Aucun rendez-vous</p>
            </div>
          )}
        </div>
      )}

      {tab === "creneaux" && (
        <div className="space-y-6">
          {/* Génération de créneaux */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Ajouter des créneaux</h2>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-stone-500 mb-1">Date</label>
                <input type="date" value={newSlotDate} onChange={(e) => setNewSlotDate(e.target.value)} className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Début</label>
                <input type="time" value={newSlotStart} onChange={(e) => setNewSlotStart(e.target.value)} className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">Fin</label>
                <input type="time" value={newSlotEnd} onChange={(e) => setNewSlotEnd(e.target.value)} className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
              </div>
              <button onClick={addSlot} className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors flex items-center gap-1.5"><Plus size={14} /> Créneau</button>
              <button onClick={generateDaySlots} disabled={!newSlotDate || generatingSlots} className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors disabled:opacity-50">
                {generatingSlots ? "Génération…" : "Générer journée (9h-18h)"}
              </button>
            </div>
          </div>

          {/* Calendar week view */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 text-stone-500 hover:text-stone-900 transition-colors"><ChevronLeft size={18} /></button>
              <h2 className="text-sm font-semibold text-stone-900">
                Semaine du {weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </h2>
              <button onClick={() => setWeekOffset((w) => w + 1)} className="p-1.5 text-stone-500 hover:text-stone-900 transition-colors"><ChevronRight size={18} /></button>
            </div>

            {weekSlots.length === 0 ? (
              <p className="text-center py-8 text-sm text-stone-400">Aucun créneau cette semaine</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {weekSlots.map((slot) => (
                  <div key={slot.id} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${slot.is_available ? "border-green-200 bg-green-50" : "border-stone-200 bg-stone-50"}`}>
                    <div>
                      <div className="font-medium text-stone-900">{new Date(slot.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</div>
                      <div className="text-xs text-stone-500">{slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleSlotAvailability(slot)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${slot.is_available ? "bg-green-200 text-green-800 hover:bg-green-300" : "bg-stone-200 text-stone-600 hover:bg-stone-300"}`}>
                        {slot.is_available ? "Dispo" : "Indispo"}
                      </button>
                      <button onClick={() => deleteSlot(slot.id)} className="p-1 text-stone-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
