// D:\teleconsultation\frontend\app\dashboard\medecin\consultations\nouvelle\page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import PrivateRoute from "../../../../../components/PrivateRoute";
import api from "../../../../../lib/api";
import Sidebar from "../../../../../components/Sidebar";
import Navbar from "../../../../../components/Navbar";

interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
}
interface Patient {
  id: number;
  username: string;
}
interface Drug {
  id: number;
  nom: string;
  dose: string;
  dur: string;
}

let _did = 0;
const newDrug = (): Drug => ({ id: ++_did, nom: "", dose: "", dur: "" });

export default function NouvelleConsultation() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [dateHeure, setDateHeure] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [notes, setNotes] = useState("");
  const [drugs, setDrugs] = useState<Drug[]>([newDrug()]);
  const [newDrugRow, setNewDrugRow] = useState({ nom: "", dose: "", dur: "" });
  const [typeConsult, setTypeConsult] = useState("");
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
      api.get("patients/"),
    ])
      .then(([r, c, o, p]) => {
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
        });
        setPatients(p.data);
      })
      .catch(() => {});
  }, [token, isLoading]);

  if (isLoading) return null;

  const addDrug = () => {
    if (!newDrugRow.nom.trim()) return;
    setDrugs((p) => [
      ...p,
      {
        id: ++_did,
        nom: newDrugRow.nom,
        dose: newDrugRow.dose || "—",
        dur: newDrugRow.dur || "—",
      },
    ]);
    setNewDrugRow({ nom: "", dose: "", dur: "" });
  };
  const removeDrug = (id: number) =>
    setDrugs((p) => p.filter((d) => d.id !== id));

  const selectedPatient = patients.find((p) => String(p.id) === patientId);
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSave = async () => {
    if (!patientId) {
      setErrorMsg("Sélectionnez un patient.");
      return;
    }
    if (!dateHeure) {
      setErrorMsg("Renseignez la date et l'heure.");
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    try {
      await api.post("consultations/", {
        patient: parseInt(patientId),
        date_heure: new Date(dateHeure).toISOString(),
        notes: notes.trim() || "",
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

        .root  { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
        .main  { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }
        .layout { display:grid; grid-template-columns:1fr 400px; gap:28px; align-items:start; animation:fadeUp .4s ease; }

        .topbar       { display:flex; align-items:center; gap:12px; margin-bottom:28px; }
        .btn-back     { width:38px; height:38px; background:#fff; border:1px solid #EAE8F5; border-radius:12px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:18px; color:#8A87A0; transition:all .2s; }
        .btn-back:hover { background:#F0EEF9; color:#1C1040; }
        .topbar-title { font-family:'Syne',sans-serif; font-size:24px; font-weight:800; color:#1C1040; }
        .topbar-sub   { font-size:13px; color:#8A87A0; margin-top:3px; }

        .form-panel   { background:#fff; border-radius:20px; border:1px solid #EAE8F5; overflow:hidden; }
        .form-section { padding:22px 26px; border-bottom:1px solid #F0EEF9; }
        .form-section:last-child { border-bottom:none; }
        .sec-header { display:flex; align-items:center; gap:10px; margin-bottom:18px; }
        .sec-icon   { width:32px; height:32px; border-radius:10px; background:#F0EEF9; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
        .sec-title  { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; color:#1C1040; }

        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .field { display:flex; flex-direction:column; gap:5px; }
        .field label { font-size:11px; font-weight:600; color:#8A87A0; text-transform:uppercase; letter-spacing:.5px; }

        input, select, textarea {
          width:100%; padding:10px 13px; font-family:'DM Sans',sans-serif; font-size:13px;
          color:#1C1040; background:#FAFAFE; border:1px solid #E5E2F5; border-radius:12px;
          outline:none; transition:border-color .2s, box-shadow .2s;
        }
        input:focus, select:focus, textarea:focus {
          border-color:#534AB7; background:#fff; box-shadow:0 0 0 3px rgba(83,74,183,.1);
        }
        input::placeholder, textarea::placeholder { color:#C4C0D8; }
        textarea { resize:vertical; line-height:1.6; }

        .drug-item { display:flex; align-items:center; gap:10px; background:#FAFAFE; border:1px solid #EAE8F5; border-radius:12px; padding:10px 14px; margin-bottom:8px; }
        .drug-name { flex:1; font-size:13px; font-weight:600; color:#1C1040; }
        .drug-pill { font-size:11px; font-weight:600; padding:3px 8px; border-radius:99px; }
        .drug-pill-dose { background:#EEEDFE; color:#3C3489; }
        .drug-pill-dur  { background:#F0EEF9; color:#534AB7; }
        .drug-del { background:none; border:none; cursor:pointer; color:#C4C0D8; font-size:14px; padding:3px; border-radius:6px; transition:all .2s; }
        .drug-del:hover { color:#EF4444; background:#FEF2F2; }

        .drug-add-row { display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:8px; align-items:end; }
        .btn-add-drug { width:38px; height:38px; background:#534AB7; border:none; border-radius:11px; color:#fff; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background .2s; }
        .btn-add-drug:hover { background:#3C3489; }

        .err { background:#FEF2F2; border:1px solid #FCA5A5; border-radius:12px; padding:10px 14px; color:#DC2626; font-size:12.5px; font-weight:600; margin-bottom:16px; }

        .form-actions { display:flex; gap:10px; padding:18px 26px; background:#FAFAFE; border-top:1px solid #F0EEF9; }
        .btn-cancel { flex:1; padding:11px; background:#fff; border:1px solid #E5E2F5; border-radius:13px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#8A87A0; cursor:pointer; }
        .btn-cancel:hover { border-color:#C4C0D8; color:#1C1040; }
        .btn-save { flex:2; padding:11px; background:#1C1040; border:none; border-radius:13px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#fff; cursor:pointer; transition:all .2s; }
        .btn-save:hover { background:#2D1A6B; }
        .btn-save:disabled { opacity:.5; cursor:not-allowed; }

        /* Preview */
        .preview-panel { position:sticky; top:calc(70px + 2.5rem); animation:fadeUp .45s ease .05s backwards; }
        .preview-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
        .preview-lbl { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#1C1040; display:flex; align-items:center; gap:8px; }
        .live-dot { width:7px; height:7px; border-radius:50%; background:#1D9E75; box-shadow:0 0 0 3px rgba(29,158,117,.2); display:inline-block; }

        .doc { background:#fff; border-radius:8px; border-top:3px solid #534AB7; padding:28px 24px; box-shadow:0 4px 24px rgba(0,0,0,.08); font-family:'Times New Roman',Georgia,serif; }
        .doc-head { padding-bottom:14px; border-bottom:1.5px solid #1C1040; margin-bottom:18px; display:flex; justify-content:space-between; align-items:flex-start; }
        .doc-dr   { font-size:16px; font-weight:700; color:#1C1040; }
        .doc-sub  { font-size:11px; color:#666; margin-top:3px; line-height:1.6; font-family:sans-serif; }
        .doc-seal { width:34px; height:34px; border-radius:50%; border:2px solid #534AB7; display:flex; align-items:center; justify-content:center; font-size:16px; color:#534AB7; }
        .doc-ttl  { text-align:center; font-size:10.5px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#1C1040; padding:10px 0 14px; border-bottom:0.5px solid #EAE8F5; margin-bottom:16px; font-family:sans-serif; }
        .doc-badge { display:inline-block; background:#EEEDFE; color:#3C3489; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; margin-bottom:12px; font-family:sans-serif; }
        .doc-patient { background:#F0EEF9; border-radius:10px; padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; gap:12px; font-family:sans-serif; }
        .doc-avatar  { width:38px; height:38px; border-radius:50%; background:#534AB7; color:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; flex-shrink:0; }
        .doc-pt-name { font-size:14px; font-weight:600; color:#3C3489; }
        .doc-pt-sub  { font-size:11px; color:#534AB7; opacity:.7; margin-top:2px; }
        .doc-section-title { font-size:10px; font-weight:700; color:#8A87A0; text-transform:uppercase; letter-spacing:.8px; display:flex; align-items:center; gap:5px; margin-bottom:8px; font-family:sans-serif; }
        .doc-content { font-size:13px; color:#1C1040; line-height:1.8; white-space:pre-wrap; background:#FAFAFE; border:1px solid #EAE8F5; border-radius:10px; padding:10px 14px; font-family:sans-serif; }
        .doc-empty { color:#C4C0D8; font-style:italic; }
        .doc-drug-table { width:100%; border-collapse:collapse; font-size:12.5px; font-family:sans-serif; }
        .doc-drug-th { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:#8A87A0; text-align:left; padding:7px 10px; background:#FAFAFE; border-bottom:1px solid #EAE8F5; }
        .doc-drug-td { padding:8px 10px; border-bottom:0.5px solid #EAE8F5; color:#1C1040; vertical-align:top; }
        .doc-foot { display:flex; justify-content:space-between; align-items:flex-end; margin-top:24px; padding-top:14px; border-top:0.5px solid #EAE8F5; font-family:sans-serif; }
        .sig-line { width:80px; border-top:1px solid #999; margin:0 auto 4px; }
        .sig-name { font-size:11px; color:#666; font-weight:600; text-align:center; }
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Nouvelle Consultation" subtitle={`Dr. ${username}`} />

        <main className="main">
          <div className="topbar">
            <button
              className="btn-back"
              onClick={() => router.push("/dashboard/medecin/consultations")}
            >
              ←
            </button>
            <div>
              <div className="topbar-title">Nouvelle Consultation</div>
              <div className="topbar-sub">
                Dr. {username} · {today}
              </div>
            </div>
          </div>

          <div className="layout">
            {/* ── Formulaire ── */}
            <div className="form-panel">
              {/* Patient + Date */}
              <div className="form-section">
                <div className="sec-header">
                  <div className="sec-icon">👤</div>
                  <span className="sec-title">Patient &amp; Date</span>
                </div>
                {errorMsg && <div className="err">⚠️ {errorMsg}</div>}
                <div className="grid2">
                  <div className="field">
                    <label>Patient</label>
                    <select
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                    >
                      <option value="">— Sélectionner —</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Date &amp; Heure</label>
                    <input
                      type="datetime-local"
                      value={dateHeure}
                      onChange={(e) => setDateHeure(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field" style={{ marginTop: 12 }}>
                  <label>Type de consultation</label>
                  <select
                    value={typeConsult}
                    onChange={(e) => setTypeConsult(e.target.value)}
                  >
                    <option value="">— Sélectionner —</option>
                    <option>Consultation générale</option>
                    <option>Suivi médical</option>
                    <option>Urgence</option>
                    <option>Avis spécialisé</option>
                    <option>Renouvellement d'ordonnance</option>
                  </select>
                </div>
              </div>

              {/* Notes / Diagnostic */}
              <div className="form-section">
                <div className="sec-header">
                  <div className="sec-icon">📋</div>
                  <span className="sec-title">Motif &amp; Diagnostic</span>
                </div>
                <div className="field">
                  <label>Motif de consultation</label>
                  <textarea
                    rows={3}
                    placeholder="Symptômes rapportés par le patient..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Médicaments prescrits */}
              <div className="form-section">
                <div className="sec-header">
                  <div className="sec-icon">💊</div>
                  <span className="sec-title">Médicaments prescrits</span>
                </div>
                {drugs
                  .filter((d) => d.nom !== "")
                  .map((d) => (
                    <div key={d.id} className="drug-item">
                      <span style={{ fontSize: 14, color: "#534AB7" }}>💊</span>
                      <span className="drug-name">{d.nom}</span>
                      <span className={`drug-pill drug-pill-dose`}>
                        {d.dose}
                      </span>
                      <span className={`drug-pill drug-pill-dur`}>{d.dur}</span>
                      <button
                        className="drug-del"
                        onClick={() => removeDrug(d.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                <div className="drug-add-row">
                  <div className="field">
                    <label>Médicament</label>
                    <input
                      placeholder="Amoxicilline 500mg"
                      value={newDrugRow.nom}
                      onChange={(e) =>
                        setNewDrugRow((p) => ({ ...p, nom: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && addDrug()}
                    />
                  </div>
                  <div className="field">
                    <label>Posologie</label>
                    <input
                      placeholder="1cp × 3/j"
                      value={newDrugRow.dose}
                      onChange={(e) =>
                        setNewDrugRow((p) => ({ ...p, dose: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && addDrug()}
                    />
                  </div>
                  <div className="field">
                    <label>Durée</label>
                    <input
                      placeholder="7 jours"
                      value={newDrugRow.dur}
                      onChange={(e) =>
                        setNewDrugRow((p) => ({ ...p, dur: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && addDrug()}
                    />
                  </div>
                  <button
                    className="btn-add-drug"
                    onClick={addDrug}
                    aria-label="Ajouter"
                  >
                    ＋
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "#C4C0D8", marginTop: 8 }}>
                  Appuyez sur Entrée ou ＋ pour ajouter. Une ordonnance sera
                  générée séparément.
                </p>
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button
                  className="btn-cancel"
                  onClick={() =>
                    router.push("/dashboard/medecin/consultations")
                  }
                >
                  Annuler
                </button>
                <button
                  className="btn-save"
                  onClick={handleSave}
                  disabled={saving || !patientId}
                >
                  {saving ? "Enregistrement…" : "✓ Enregistrer la consultation"}
                </button>
              </div>
            </div>

            {/* ── Aperçu ── */}
            <div className="preview-panel">
              <div className="preview-top">
                <span className="preview-lbl">
                  <span className="live-dot" /> Aperçu en direct
                </span>
              </div>

              <div className="doc">
                <div className="doc-head">
                  <div>
                    <div className="doc-dr">Dr. {username}</div>
                    <div className="doc-sub">
                      Médecin Généraliste
                      <br />
                      Tél : +216 71 000 000 · Tunis
                    </div>
                  </div>
                  <div className="doc-seal">⚕</div>
                </div>

                <div className="doc-ttl">Compte rendu de consultation</div>

                {typeConsult && (
                  <div>
                    <span className="doc-badge">{typeConsult}</span>
                  </div>
                )}

                <div className="doc-patient">
                  <div className="doc-avatar">
                    {selectedPatient?.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="doc-pt-name">
                      {selectedPatient?.username || "Patient non sélectionné"}
                    </div>
                    <div className="doc-pt-sub">
                      {dateHeure
                        ? new Date(dateHeure).toLocaleString("fr-FR")
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="doc-section-title">📋 Motif / Diagnostic</div>
                <div className="doc-content" style={{ marginBottom: 16 }}>
                  {notes || (
                    <span className="doc-empty">Le motif apparaîtra ici…</span>
                  )}
                </div>

                {drugs.filter((d) => d.nom).length > 0 && (
                  <>
                    <div
                      className="doc-section-title"
                      style={{ marginTop: 12 }}
                    >
                      💊 Médicaments prescrits
                    </div>
                    <table className="doc-drug-table">
                      <thead>
                        <tr>
                          <th className="doc-drug-th">Médicament</th>
                          <th className="doc-drug-th">Posologie</th>
                          <th className="doc-drug-th">Durée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drugs
                          .filter((d) => d.nom)
                          .map((d) => (
                            <tr key={d.id}>
                              <td
                                className="doc-drug-td"
                                style={{ fontWeight: 600 }}
                              >
                                {d.nom}
                              </td>
                              <td className="doc-drug-td">{d.dose}</td>
                              <td className="doc-drug-td">{d.dur}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </>
                )}

                <div className="doc-foot">
                  <div style={{ fontSize: 11, color: "#999" }}>
                    Tunis, le {today}
                  </div>
                  <div>
                    <div className="sig-line" />
                    <div className="sig-name">Dr. {username}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
