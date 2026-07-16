"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import PrivateRoute from "../../../../../components/PrivateRoute";
import api from "../../../../../lib/api";

// ─────────────────────────────────────────────────────────────
// IMPORTS LUCIDE ICONS
// ─────────────────────────────────────────────────────────────
import {
  X,
  Calendar,
  User,
  FileText,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// CONFIGURATION DES TYPES DE CERTIFICATS
// ─────────────────────────────────────────────────────────────
const typeConfig: Record<string, { label: string; color: string; bg: string }> =
  {
    arret: { label: "Arrêt de travail", color: "#C2410C", bg: "#FFF7ED" },
    reprise: { label: "Reprise de travail", color: "#0369A1", bg: "#F0F9FF" },
    consultation: { label: "Consultation", color: "#7C3AED", bg: "#F5F3FF" },
    aptitude: { label: "Aptitude", color: "#047857", bg: "#ECFDF5" },
    inaptitude: { label: "Inaptitude", color: "#B91C1C", bg: "#FEF2F2" },
    grossesse: { label: "Grossesse", color: "#9333EA", bg: "#FAF5FF" },
    deces: { label: "Décès", color: "#333333", bg: "#F3F4F6" },
    custom: { label: "Attestation libre", color: "#5B21B6", bg: "#EDE9FE" },
  };

export default function NouveauCertificat() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  // ─── STATE DU FORMULAIRE ───
  const [patientName, setPatientName] = useState("");
  const [dateEmission, setDateEmission] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [typeCert, setTypeCert] = useState("consultation");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // ─── HANDLERS ───
  const handleClose = () => {
    // On ne ferme pas si on est en train de sauvegarder
    if (!saving) {
      router.back();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    if (!patientName.trim()) {
      setErrorMsg("Le nom du patient est obligatoire.");
      setSaving(false);
      return;
    }

    try {
      await api.post("certificats/", {
        patient_name: patientName.trim(),
        date_emission: dateEmission,
        type_certificat: typeCert,
        notes: notes.trim(),
        status: "brouillon",
      });

      setSuccessMsg(true);
      // Redirection automatique après succès
      setTimeout(() => {
        router.push("/dashboard/medecin/certificats");
      }, 1200);
    } catch (err: any) {
      const d = err?.response?.data;
      setErrorMsg(
        typeof d === "object" && d
          ? Object.entries(d)
              .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : "Erreur lors de la création.",
      );
      setSaving(false);
    }
  };

  if (isLoading) return null;
  if (!token) return null;

  const currentConfig = typeConfig[typeCert] || typeConfig.custom;

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght:700;800&family=DM+Sans:wght:400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        /* Animation d'entrée modale (Pop-in) */
        @keyframes popIn { 
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; } 
        }

        /* Overlay : Fond sombre plein écran, centré */
        .overlay { 
            position:fixed; 
            inset:0; 
            background:rgba(15, 23, 42, 0.6); /* Fond plus sombre pour focus */
            backdrop-filter: blur(5px);
            display:flex; 
            align-items:center; 
            justify-content:center; /* <--- CENTRAGE HORIZONTAL */
            z-index:3000; 
            animation: fadeIn 0.2s ease;
            padding: 20px; /* Espace sur mobile */
        }

        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        /* Modale : Boîte centrée avec coins arrondis */
        .modal-panel { 
            width: 100%;
            max-width: 480px; /* Largeur fixe max */
            background:#fff; 
            border-radius: 24px; /* Coins très arrondis */
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display:flex; 
            flex-direction:column; 
            max-height: 90vh; /* Ne dépasse pas l'écran */
            overflow: hidden; /* Contient les enfants */
            animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
        }

        .modal-header { 
            padding:24px 28px; 
            border-bottom:1px solid #F1F5F9; 
            display:flex; 
            align-items:center; 
            justify-content:space-between; 
            background:#fff; 
            flex-shrink: 0;
        }
        
        .modal-title  { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; background: linear-gradient(135deg, #8B5CF6, #6366f1); -webkit-background-clip: text; color: transparent; }
        .modal-sub    { font-size:13px; color:#64748b; margin-top:2px; }
        
        .modal-close  { 
            width:32px; height:32px; border-radius:50%; border:none; 
            display:flex; align-items:center; justify-content:center; cursor:pointer; 
            background:#F1F5F9; color:#64748b; font-size:14px; transition:all .2s; 
        }
        .modal-close:hover { background:#E2E8F0; color:#EF4444; }

        .modal-body   { 
            padding:24px 28px; 
            overflow-y:auto; /* Scroll interne si besoin */
            flex:1; 
            display:flex; 
            flex-direction:column; 
            gap:20px; 
        }
        
        .form-group { display:flex; flex-direction:column; gap:8px; }
        .form-label  { font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-left: 2px; }
        
        .form-input, .form-select, .form-textarea { 
            width:100%; padding:12px 14px; font-family:'DM Sans',sans-serif; 
            font-size:14px; color:#1e293b; background:#F8FAFC; 
            border:1px solid #E2E8F0; border-radius:12px; outline:none; 
            transition:all .2s; 
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus { 
            background:#fff; border-color:#8B5CF6; box-shadow:0 0 0 3px rgba(139,92,246,0.1); 
        }
        .form-textarea { resize:vertical; line-height:1.6; min-height:100px; }

        .type-preview-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px;
            border-radius: 12px;
            background: ${currentConfig.bg};
            border: 1px solid rgba(0,0,0,0.03);
            color: ${currentConfig.color};
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
        }

        .error-box { 
            background:#FEF2F2; color:#DC2626; border:1px solid #FCA5A5; border-radius:10px; 
            padding:12px 14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:8px;
        }

        .modal-footer    { 
            padding:20px 28px; background:#fff; border-top:1px solid #F1F5F9; 
            display:flex; gap:12px; flex-shrink: 0;
        }
        
        .btn-cancel { 
            flex:1; padding:12px; background:#fff; border:1px solid #E2E8F0; 
            border-radius:12px; font-family:'DM Sans',sans-serif; font-size:14px; 
            font-weight:600; color:#64748b; cursor:pointer; transition: all 0.2s;
        }
        .btn-cancel:hover { background:#F8FAFC; color:#334155; }

        .btn-save  { 
            flex:2; padding:12px; background:linear-gradient(135deg, #8B5CF6, #6366F1); 
            border:none; border-radius:12px; 
            font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; 
            color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
            transition: all 0.2s;
        }
        .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35); }
        .btn-save:disabled { opacity:0.7; cursor:not-allowed; transform: none; }

        .success-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
        }
        .success-icon {
            width: 64px; height: 64px;
            background: #ECFDF5;
            color: #10B981;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 20px;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Overlay */}
      <div className="overlay" onClick={handleClose}>
        {/* Modale Centrée */}
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          {successMsg ? (
            <div className="success-state">
              <div className="success-icon">
                <CheckCircle size={32} />
              </div>
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#1e293b",
                  marginBottom: 8,
                }}
              >
                Certificat créé !
              </h3>
              <p style={{ color: "#64748b", fontSize: 14 }}>
                Redirection vers la liste...
              </p>
            </div>
          ) : (
            <>
              <div className="modal-header">
                <div>
                  <div className="modal-title">Nouveau Certificat</div>
                  <div className="modal-sub">
                    Remplissez les informations ci-dessous
                  </div>
                </div>
                <button className="modal-close" onClick={handleClose}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="modal-body">
                {errorMsg && (
                  <div className="error-box">
                    <X size={16} />
                    {errorMsg}
                  </div>
                )}

                {/* Champ Patient */}
                <div className="form-group">
                  <label className="form-label">Patient</label>
                  <div style={{ position: "relative" }}>
                    <User
                      size={18}
                      color="#94a3b8"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: 12,
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      className="form-input"
                      style={{ paddingLeft: "40px" }}
                      placeholder="Nom complet du patient"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Champ Type */}
                <div className="form-group">
                  <label className="form-label">Type de certificat</label>
                  <select
                    className="form-select"
                    value={typeCert}
                    onChange={(e) => setTypeCert(e.target.value)}
                  >
                    {Object.entries(typeConfig).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                  <div className="type-preview-card">
                    <FileText size={18} />
                    <span>{currentConfig.label}</span>
                  </div>
                </div>

                {/* Champ Date */}
                <div className="form-group">
                  <label className="form-label">Date d'émission</label>
                  <div style={{ position: "relative" }}>
                    <Calendar
                      size={18}
                      color="#94a3b8"
                      style={{
                        position: "absolute",
                        left: 12,
                        top: 12,
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      type="date"
                      className="form-input"
                      style={{ paddingLeft: "40px" }}
                      value={dateEmission}
                      onChange={(e) => setDateEmission(e.target.value)}
                    />
                  </div>
                </div>

                {/* Champ Notes */}
                <div className="form-group">
                  <label className="form-label">Notes / Observations</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Détails cliniques, durée, motif..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </form>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleClose}
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={saving}
                  onClick={(e) => {
                    // On attache l'événement ici car le bouton est hors du form dans ce layout (footer sticky)
                    const form = document.querySelector(
                      "form",
                    ) as HTMLFormElement;
                    if (form) form.requestSubmit();
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Créer
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}
