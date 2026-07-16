"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../lib/api";

// ─────────────────────────────────────────────────────────────
// IMPORTS LUCIDE ICONS
// ─────────────────────────────────────────────────────────────
import {
  Stethoscope,
  FileText,
  X,
  User,
  Plus,
  Minus,
  Loader2,
  Save,
  CheckCircle,
  Activity,
  Calendar,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
import { Consultation, Med, MedRow, newMed } from "./ordonnances-shared";

// ─────────────────────────────────────────────────────────────
// COMPOSANT MODALE
// ─────────────────────────────────────────────────────────────
export default function OrdonnanceModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token, username } = useAuth();

  // États pour les données du médecin
  const [drSpec, setDrSpec] = useState("Médecin généraliste");
  const [drRpps, setDrRpps] = useState("");
  const [drTel, setDrTel] = useState("");
  const [drVille, setDrVille] = useState("");

  // États pour le reste du formulaire
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultationId, setConsultationId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [ptDob, setPtDob] = useState("");
  const [meds, setMeds] = useState<Med[]>([newMed()]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fonction pour charger les infos du médecin
  const fetchDoctorProfile = useCallback(async () => {
    if (token) {
      try {
        const res = await api.get("users/me/");
        const data = res.data;
        // On met à jour les champs avec les données du profil,
        // ou on garde une valeur par défaut si le champ est vide dans la BDD
        setDrSpec(data.specialite || "Médecin généraliste");
        setDrRpps(data.rpps || "");
        setDrTel(data.tel || "");
        setDrVille(data.ville || "");
      } catch (error) {
        console.error("Erreur lors du chargement du profil médecin:", error);
      }
    }
  }, [token]);

  // Chargement initial : Consultations ET Profil Médecin
  useEffect(() => {
    if (isOpen && token) {
      // 1. Charger les consultations
      api
        .get("consultations/")
        .then((c) => setConsultations(c.data))
        .catch(() => {});

      // 2. Charger les infos du médecin pour pré-remplir
      fetchDoctorProfile();
    }
  }, [isOpen, token, fetchDoctorProfile]);

  // Gestion du clic extérieur pour la dropdown
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Gestionnaires de médicaments
  const addMed = useCallback(() => setMeds((p) => [...p, newMed()]), []);
  const removeMed = useCallback(
    (id: number) =>
      setMeds((p) => (p.length > 1 ? p.filter((m) => m.id !== id) : p)),
    [],
  );
  const chgMed = useCallback(
    (id: number, f: keyof Med, v: string) =>
      setMeds((p) => p.map((m) => (m.id === id ? { ...m, [f]: v } : m))),
    [],
  );

  const activeMeds = meds.filter((m) => m.nom.trim());
  const selectedConsult = consultations.find(
    (c) => String(c.id) === consultationId,
  );
  const patientName = selectedConsult?.patient_name ?? "";
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const filteredConsults = consultations.filter((c) =>
    c.patient_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSave = async () => {
    if (!consultationId) {
      setErrorMsg("Sélectionnez une consultation.");
      return;
    }
    if (activeMeds.length === 0) {
      setErrorMsg("Ajoutez au moins un médicament.");
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    try {
      const consultationIdInt = parseInt(consultationId, 10);
      if (isNaN(consultationIdInt)) {
        setErrorMsg("ID de consultation invalide.");
        setSaving(false);
        return;
      }
      const medText =
        activeMeds
          .map(
            (m) =>
              `- ${m.nom}${m.posologie ? ` — ${m.posologie}` : ""}${m.duree ? `, ${m.duree}` : ""}`,
          )
          .join("\n") + (notes.trim() ? `\n\nNotes :\n${notes.trim()}` : "");
      await api.post("ordonnances/", {
        consultation: consultationIdInt,
        medicaments: medText,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      const d = err?.response?.data;
      setErrorMsg(
        d && typeof d === "object"
          ? Object.entries(d)
              .map(
                ([k, v]) =>
                  `${k} : ${Array.isArray(v) ? v.join(", ") : String(v)}`,
              )
              .join(" | ")
          : `Erreur serveur.`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        
        @keyframes popIn { 0% { transform: scale(0.98); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(5px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .modal-panel {
            width: 95vw;
            max-width: 1300px;
            height: 90vh;
            background: #fff;
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-header {
            padding: 20px 32px;
            border-bottom: 1px solid #F1F5F9;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #fff;
            flex-shrink: 0;
        }
        .modal-title {
            font-family: 'Syne', sans-serif;
            font-size: 24px;
            font-weight: 800;
            background: linear-gradient(135deg, #8B5CF6, #6366f1);
            -webkit-background-clip: text;
            color: transparent;
        }
        .modal-close {
            width: 40px; height: 40px; border-radius: 50%; border: none;
            display: flex; align-items: center; justify-content: center; cursor: pointer;
            background: #F1F5F9; color: #64748b; transition: all .2s;
        }
        .modal-close:hover { background: #E2E8F0; color: #EF4444; }

        /* Layout Split View */
        .modal-split {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        /* GAUCHE : FORMULAIRE */
        .form-column {
            flex: 1;
            padding: 32px;
            overflow-y: auto;
            border-right: 1px solid #F1F5F9;
            min-width: 400px;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        /* DROITE : APERÇU PAPIER */
        .preview-column {
            flex: 1;
            background: #F4F2F9;
            padding: 40px;
            overflow-y: auto;
            display: flex;
            justify-content: center;
        }

        .paper {
            width: 100%;
            max-width: 600px;
            background: #fff;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            padding: 40px;
            position: relative;
        }
        /* En-tête Papier */
        .paper-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #EF4444;
        }
        .paper-dr-name {
            font-family: 'Syne', sans-serif;
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
        }
        .paper-dr-info {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
            line-height: 1.5;
        }
        .paper-logo {
            color: #EF4444;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* Contenu Papier */
        .paper-title {
            text-align: center;
            font-family: 'Syne', sans-serif;
            font-size: 22px;
            font-weight: 800;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }
        .paper-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
            font-size: 13px;
            color: #475569;
        }
        .paper-meta strong { color: #1e293b; }
        
        .rx-list { margin-bottom: 30px; }
        .rx-item {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
        }
        .rx-num {
            font-family: 'Syne', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: #8B5CF6;
        }
        .rx-content { flex: 1; }
        .rx-name {
            font-weight: 700;
            color: #0f172a;
            font-size: 15px;
        }
        .rx-details {
            font-size: 13px;
            color: #64748b;
            font-style: italic;
        }
        .paper-notes {
            background: #F8FAFC;
            padding: 16px;
            border-radius: 8px;
            font-size: 13px;
            color: #334155;
            border-left: 3px solid #8B5CF6;
            white-space: pre-wrap;
        }
        .paper-footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        .paper-signature {
            border-top: 1px solid #94a3b8;
            width: 200px;
            padding-top: 8px;
            text-align: center;
            font-size: 13px;
            font-weight: 600;
            color: #334155;
        }


        /* Form Styles (Modern) */
        .form-group { display: flex; flex-direction: column; gap: 8px; position: relative; }
        .form-label {
            font-size: 12px; font-weight: 700; color: #475569;
            text-transform: uppercase; letter-spacing: 0.5px; margin-left: 2px;
        }
        .form-input, .form-select, .form-textarea {
            width: 100%; padding: 12px 14px; font-family: 'DM Sans', sans-serif;
            font-size: 14px; color: #1e293b; background: #F8FAFC;
            border: 1px solid #E2E8F0; border-radius: 12px; outline: none; transition: all .2s;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
            background: #fff; border-color: #8B5CF6; box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }

        .dropdown-list {
            position: absolute; top: 100%; left: 0; right: 0;
            background: white; border: 1px solid #E2E8F0; border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-top: 4px;
            z-index: 10; max-height: 200px; overflow-y: auto;
        }
        .dropdown-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
        .dropdown-item:last-child { border-bottom: none; }
        .dropdown-item:hover { background: #F8FAFC; }
        .consult-tag {
            margin-top: 6px; font-size: 12px; font-weight: 600; color: #059669;
            background: #ECFDF5; padding: 6px 10px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;
        }

        .med-section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; justify-content: space-between; }
        .med-section-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .med-row { display: grid; grid-template-columns: 2fr 1.5fr 1fr 40px; gap: 8px; align-items: start; margin-bottom: 10px; }
        .med-input {
            width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid #E2E8F0; border-radius: 8px;
            background: #fff; outline: none; transition: 0.2s;
        }
        .med-input:focus { border-color: #8B5CF6; }
        .btn-remove-med {
            width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
            border: none; background: #FEF2F2; color: #EF4444; border-radius: 6px; cursor: pointer; transition: 0.2s;
        }
        .btn-remove-med:hover { background: #FEE2E2; }
        .btn-add-med {
            width: 100%; padding: 10px; background: white; border: 1px dashed #CBD5E1;
            border-radius: 8px; color: #64748B; font-weight: 600; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 6px;
            transition: 0.2s; font-family: 'DM Sans', sans-serif;
        }
        .btn-add-med:hover { border-color: #8B5CF6; color: #8B5CF6; background: #F5F3FF; }

        .error-box { background: #FEF2F2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }

        .modal-footer {
            padding: 20px 32px; background: #fff; border-top: 1px solid #F1F5F9;
            display: flex; gap: 16px; flex-shrink: 0;
        }
        .btn-cancel {
            flex: 1; padding: 12px; background: #fff; border: 1px solid #E2E8F0; border-radius: 12px;
            font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer;
        }
        .btn-cancel:hover { background: #F8FAFC; color: #334155; }
        .btn-save {
            flex: 2; padding: 12px; background: linear-gradient(135deg, #8B5CF6, #6366F1);
            border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
            color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); transition: all 0.2s;
        }
        .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35); }
        .btn-save:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <div>
              <div className="modal-title">Nouvelle Ordonnance</div>
              <div style={{ fontSize: 14, color: "#64748b", marginTop: 2 }}>
                {username} — Mode édition en direct
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={22} />
            </button>
          </div>

          {/* Split Body */}
          <div className="modal-split">
            {/* COLONNE GAUCHE : FORMULAIRE */}
            <div className="form-column">
              {errorMsg && (
                <div className="error-box">
                  <X size={16} /> {errorMsg}
                </div>
              )}

              {/* 2. Patient */}
              <div className="form-group" ref={wrapperRef}>
                <label
                  className="form-label"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <User size={14} color="#8B5CF6" /> Patient
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className="form-input"
                    placeholder="Rechercher un patient..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setConsultationId("");
                      setShowDropdown(true);
                    }}
                    onFocus={() => searchQuery && setShowDropdown(true)}
                    autoComplete="off"
                  />
                  {showDropdown && searchQuery && !consultationId && (
                    <div className="dropdown-list">
                      {filteredConsults.length === 0 ? (
                        <div
                          className="dropdown-item"
                          style={{ color: "#94a3b8", cursor: "default" }}
                        >
                          Aucun résultat
                        </div>
                      ) : (
                        filteredConsults.map((c) => (
                          <div
                            key={c.id}
                            className="dropdown-item"
                            onMouseDown={() => {
                              setConsultationId(String(c.id));
                              setSearchQuery(c.patient_name);
                              setShowDropdown(false);
                            }}
                          >
                            <strong>{c.patient_name}</strong>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {new Date(c.date_heure).toLocaleDateString(
                                "fr-FR",
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedConsult && (
                  <div className="consult-tag">
                    <CheckCircle size={14} /> {selectedConsult.patient_name}
                  </div>
                )}
                <input
                  className="form-input"
                  type="date"
                  value={ptDob}
                  onChange={(e) => setPtDob(e.target.value)}
                  placeholder="Date de naissance"
                  style={{ marginTop: 8 }}
                />
              </div>

              {/* 3. Prescription */}
              <div>
                <div className="med-section-header">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Activity size={16} color="#8B5CF6" />
                    <span className="med-section-title">Prescription</span>
                  </div>
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}
                  >
                    {activeMeds.length}
                  </span>
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {meds.map((m) => (
                    <div key={m.id} className="med-row">
                      <input
                        className="med-input"
                        placeholder="Médicament"
                        value={m.nom}
                        onChange={(e) => chgMed(m.id, "nom", e.target.value)}
                      />
                      <input
                        className="med-input"
                        placeholder="Posologie"
                        value={m.posologie}
                        onChange={(e) =>
                          chgMed(m.id, "posologie", e.target.value)
                        }
                      />
                      <input
                        className="med-input"
                        placeholder="Durée"
                        value={m.duree}
                        onChange={(e) => chgMed(m.id, "duree", e.target.value)}
                      />
                      <button
                        className="btn-remove-med"
                        onClick={() => removeMed(m.id)}
                        title="Supprimer"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="btn-add-med" onClick={addMed}>
                  <Plus size={16} /> Ajouter ligne
                </button>
              </div>

              {/* 4. Notes */}
              <div className="form-group">
                <label
                  className="form-label"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <FileText size={14} color="#8B5CF6" /> Notes
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Conseils..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* COLONNE DROITE : APERÇU RÉEL */}
            <div className="preview-column">
              <div className="paper">
                <div className="paper-header">
                  <div>
                    <div className="paper-dr-name">{username}</div>
                    <div className="paper-dr-info">
                      {drSpec}
                      {drRpps && <span> · RPPS: {drRpps}</span>}
                      {(drTel || drVille) && (
                        <>
                          <br />
                          {[drTel, drVille].filter(Boolean).join(" · ")}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="paper-logo">
                    <Activity size={28} strokeWidth={2.5} />
                  </div>
                </div>

                <div className="paper-title">Ordonnance</div>

                <div className="paper-meta">
                  <div className="paper-meta-item">
                    <div>Patient:</div>
                    <strong>{patientName || "___________________"}</strong>
                    {ptDob && (
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        Né(e) le {new Date(ptDob).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                  <div
                    className="paper-meta-item"
                    style={{ textAlign: "right" }}
                  >
                    <div>Date:</div>
                    <strong>{today}</strong>
                  </div>
                </div>

                <div className="rx-list">
                  {activeMeds.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: 20,
                        color: "#cbd5e1",
                        fontStyle: "italic",
                        fontSize: 13,
                      }}
                    >
                      Les médicaments s'afficheront ici...
                    </div>
                  ) : (
                    activeMeds.map((m, i) => (
                      <div key={m.id} className="rx-item">
                        <div className="rx-num">{i + 1}.</div>
                        <div className="rx-content">
                          <div className="rx-name">{m.nom}</div>
                          {(m.posologie || m.duree) && (
                            <div className="rx-details">
                              {m.posologie && <span>{m.posologie}</span>}
                              {m.posologie && m.duree && <span> — </span>}
                              {m.duree && <span>{m.duree}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notes.trim() && (
                  <div className="paper-notes">
                    <strong
                      style={{
                        display: "block",
                        marginBottom: 4,
                        fontSize: 12,
                        color: "#8B5CF6",
                      }}
                    >
                      Notes & Conseils :
                    </strong>
                    {notes}
                  </div>
                )}

                <div className="paper-footer">
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Fait à {drVille || "________"}, le {today}
                  </div>
                  <div className="paper-signature">Signature & Cachet</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button className="btn-cancel" onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={saving || !consultationId || activeMeds.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Save size={18} /> Valider
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
