// D:\teleconsultation\frontend\app\dashboard\medecin\consultations\[id]\modifier\page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PrivateRoute from "@/components/PrivateRoute";
import api from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
}

export default function ModifierConsultation() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });
  const [notes, setNotes] = useState("");
  const [dateHeure, setDateHeure] = useState("");
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("ordonnances/"),
      api.get(`consultations/${id}/`), // Récupération des données de la consultation à modifier
    ])
      .then(([r, c, o, consult]) => {
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
        });
        setNotes(consult.data.notes || "");
        // Formater la date pour l'input datetime-local (format YYYY-MM-DDTHH:mm)
        setDateHeure(consult.data.date_heure?.slice(0, 16) || "");
        setPatientName(consult.data.patient_name || "");
      })
      .catch(() => {
        // Rediriger si la consultation n'existe pas
        router.push("/dashboard/medecin/consultations");
      })
      .finally(() => setLoading(false));
  }, [token, isLoading, id]);

  if (isLoading || loading) return null;

  const handleSave = async () => {
    setErrorMsg(null);
    setSaving(true);
    try {
      await api.patch(`consultations/${id}/`, {
        notes: notes.trim(),
        date_heure: new Date(dateHeure).toISOString(),
      });
      router.push("/dashboard/medecin/consultations");
    } catch (err: any) {
      const d = err?.response?.data;
      setErrorMsg(
        typeof d === "object" && d
          ? Object.entries(d)
              .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : "Erreur serveur.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .root { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
        .main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }
        .card { background:#fff; border-radius:20px; border:1px solid #EAE8F5; overflow:hidden; max-width:640px; animation:fadeUp .4s ease; }
        .card-header { padding:20px 26px; border-bottom:1px solid #F0EEF9; display:flex; align-items:center; gap:10px; }
        .card-icon { width:32px; height:32px; border-radius:10px; background:#F0EEF9; display:flex; align-items:center; justify-content:center; font-size:16px; }
        .card-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:#1C1040; }
        .card-body { padding:24px 26px; display:flex; flex-direction:column; gap:18px; }
        .field { display:flex; flex-direction:column; gap:5px; }
        .field label { font-size:11px; font-weight:600; color:#8A87A0; text-transform:uppercase; letter-spacing:.5px; }
        input, textarea {
          width:100%; padding:10px 13px; font-family:'DM Sans',sans-serif; font-size:13px;
          color:#1C1040; background:#FAFAFE; border:1px solid #E5E2F5; border-radius:12px; outline:none; transition:all .2s;
        }
        input:focus, textarea:focus { border-color:#534AB7; background:#fff; box-shadow:0 0 0 3px rgba(83,74,183,.1); }
        textarea { resize:vertical; line-height:1.6; }
        .err { background:#FEF2F2; border:1px solid #FCA5A5; border-radius:12px; padding:10px 14px; color:#DC2626; font-size:12.5px; font-weight:600; }
        .pt-badge { display:inline-flex; align-items:center; gap:8px; background:#F0EEF9; border-radius:10px; padding:10px 14px; }
        .pt-avatar { width:32px; height:32px; border-radius:50%; background:#534AB7; color:#fff; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; }
        .pt-name { font-size:14px; font-weight:600; color:#3C3489; }
        .actions { display:flex; gap:10px; padding:18px 26px; background:#FAFAFE; border-top:1px solid #F0EEF9; }
        .btn-cancel { flex:1; padding:11px; background:#fff; border:1px solid #E5E2F5; border-radius:13px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#8A87A0; cursor:pointer; transition:all .2s; }
        .btn-cancel:hover { border-color:#C4C0D8; color:#1C1040; }
        .btn-save { flex:2; padding:11px; background:#1C1040; border:none; border-radius:13px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#fff; cursor:pointer; transition:all .2s; }
        .btn-save:hover { background:#2D1A6B; }
        .btn-save:disabled { opacity:.5; cursor:not-allowed; }
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Modifier la consultation" subtitle={`Dr. ${username}`} />

        <main className="main">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <button
              onClick={() => router.back()}
              style={{
                width: 38,
                height: 38,
                background: "#fff",
                border: "1px solid #EAE8F5",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 18,
                color: "#8A87A0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ←
            </button>
            <div>
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#1C1040",
                }}
              >
                Modifier la consultation
              </div>
              <div style={{ fontSize: 13, color: "#8A87A0", marginTop: 3 }}>
                Consultation #{id}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-icon">🩺</div>
              <span className="card-title">
                Informations de la consultation
              </span>
            </div>
            <div className="card-body">
              {errorMsg && <div className="err">⚠️ {errorMsg}</div>}

              {/* Le patient est affiché mais non modifiable */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#8A87A0",
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                    marginBottom: 8,
                  }}
                >
                  Patient
                </div>
                <div className="pt-badge">
                  <div className="pt-avatar">
                    {patientName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <span className="pt-name">{patientName || "—"}</span>
                </div>
              </div>

              <div className="field">
                <label>Date &amp; Heure</label>
                <input
                  type="datetime-local"
                  value={dateHeure}
                  onChange={(e) => setDateHeure(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Notes / Diagnostic</label>
                <textarea
                  rows={5}
                  placeholder="Saisissez le diagnostic ou les notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="actions">
              <button className="btn-cancel" onClick={() => router.back()}>
                Annuler
              </button>
              <button
                className="btn-save"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Sauvegarde…" : "✓ Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
