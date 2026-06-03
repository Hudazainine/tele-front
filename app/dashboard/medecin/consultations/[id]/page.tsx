"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface Stats { rendezvous: number; consultations: number; ordonnances: number; }
interface ConsultationData {
  id: number;
  patient_name: string;
  medecin_name: string;
  date_heure: string;
  notes: string;
}

export default function DetailConsultation() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [stats, setStats] = useState<Stats>({ rendezvous: 0, consultations: 0, ordonnances: 0 });
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    
    Promise.all([
      api.get("rendezvous/"), 
      api.get("consultations/"), 
      api.get("ordonnances/"),
      api.get(`consultations/${id}/`)
    ]).then(([r, c, o, consult]) => {
      setStats({ rendezvous: r.data.length, consultations: c.data.length, ordonnances: o.data.length });
      setConsultation(consult.data);
    }).catch(() => {
      router.push("/dashboard/medecin/consultations");
    }).finally(() => setLoading(false));
  }, [token, isLoading, id]);

  if (isLoading || loading) return null;

  const formattedDate = consultation?.date_heure 
    ? new Date(consultation.date_heure).toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : "—";

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        
        .root { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
        .main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }
        
        .topbar { display:flex; align-items:center; gap:12px; margin-bottom:28px; animation: fadeUp .4s ease; }
        .btn-back { width:38px; height:38px; background:#fff; border:1px solid #EAE8F5; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:18px; color:#8A87A0; transition:all .2s; }
        .btn-back:hover { background:#F0EEF9; color:#1C1040; }
        .topbar-title { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; color:#1C1040; }
        .topbar-sub { font-size:13px; color:#8A87A0; margin-top:3px; }

        .card { background:#fff; border-radius:20px; border:1px solid #EAE8F5; overflow:hidden; max-width:800px; animation:fadeUp .4s ease; }
        .card-header { padding:22px 26px; border-bottom:1px solid #F0EEF9; display:flex; justify-content:space-between; align-items:center; }
        .card-header-left { display:flex; align-items:center; gap:12px; }
        .card-icon { width:40px; height:40px; border-radius:12px; background:#F0EEF9; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .card-title { font-family:'Syne',sans-serif; font-size:17px; font-weight:700; color:#1C1040; }
        .card-date { font-size:12px; color:#8A87A0; margin-top:2px; }
        .btn-edit { background:#1C1040; border:none; border-radius:12px; color:#fff; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; padding:10px 18px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:6px; }
        .btn-edit:hover { background:#2D1A6B; }

        .card-body { padding:26px; display:flex; flex-direction:column; gap:24px; }
        
        .pt-badge { display:inline-flex; align-items:center; gap:10px; background:#F0EEF9; border-radius:14px; padding:14px 18px; }
        .pt-avatar { width:42px; height:42px; border-radius:50%; background:#534AB7; color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; flex-shrink:0; }
        .pt-name { font-size:16px; font-weight:600; color:#3C3489; }
        .pt-dr { font-size:12px; color:#8A87A0; margin-top:2px; }

        .section-title { font-size:11px; font-weight:700; color:#8A87A0; text-transform:uppercase; letter-spacing:.8px; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
        .notes-content { background:#FAFAFE; border:1px solid #EAE8F5; border-radius:14px; padding:18px; font-size:14px; line-height:1.7; color:#1C1040; white-space:pre-wrap; }
        .empty-notes { color:#C4C0D8; font-style:italic; }

        .card-footer { padding:18px 26px; background:#FAFAFE; border-top:1px solid #F0EEF9; display:flex; justify-content:flex-end; }
        .sig-area { text-align:center; }
        .sig-line { width:80px; border-top:1px solid #999; margin:0 auto 4px; }
        .sig-name { font-size:11px; color:#666; font-weight:600; }
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Détail de la consultation" subtitle={`Dr. ${username}`} />

        <main className="main">
          <div className="topbar">
            <button className="btn-back" onClick={() => router.push("/dashboard/medecin/consultations")}>←</button>
            <div>
              <div className="topbar-title">Détail de la consultation</div>
              <div className="topbar-sub">Consultation #{id}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <div className="card-icon">🩺</div>
                <div>
                  <div className="card-title">Compte rendu</div>
                  <div className="card-date">{formattedDate}</div>
                </div>
              </div>
              <button className="btn-edit" onClick={() => router.push(`/dashboard/medecin/consultations/${id}/modifier`)}>
                ✏️ Modifier
              </button>
            </div>

            <div className="card-body">
              <div>
                <div className="pt-badge">
                  <div className="pt-avatar">
                    {consultation?.patient_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="pt-name">{consultation?.patient_name || "Inconnu"}</div>
                    <div className="pt-dr">Médecin : Dr. {consultation?.medecin_name || username}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="section-title">📋 Motif & Diagnostic</div>
                <div className="notes-content">
                  {consultation?.notes || <span className="empty-notes">Aucune note ou diagnostic enregistré.</span>}
                </div>
              </div>
            </div>

            <div className="card-footer">
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ fontSize: 11, color: "#999" }}>Document généré le {new Date().toLocaleDateString("fr-FR")}</div>
                <div className="sig-area">
                  <div className="sig-line" />
                  <div className="sig-name">Dr. {username}</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}