"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import PrivateRoute from "../../../../../components/PrivateRoute";
import api from "../../../../../lib/api";
import Sidebar from "../../../../../components/Sidebar";
import Navbar from "../../../../../components/Navbar";

interface Stats { rendezvous: number; consultations: number; ordonnances: number; }
interface Patient { id: number; username: string; }
type TypeCert = "arret_travail"|"reprise"|"consultation"|"aptitude"|"inaptitude"|"grossesse"|"deces"|"maladie"|"visite_medicale"|"custom"|"";

const TYPE_LABELS: Record<string, string> = {
  arret_travail:   "Arrêt de travail",
  reprise:         "Reprise de travail",
  consultation:    "Certificat de consultation",
  aptitude:        "Certificat d'aptitude",
  inaptitude:      "Certificat d'inaptitude",
  grossesse:       "Certificat de grossesse",
  deces:           "Certificat de décès",
  maladie:         "Maladie",
  visite_medicale: "Visite médicale",
  custom:          "Attestation médicale",
  "":              "Certificat médical",
};

export default function NouveauCertificat() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats]             = useState<Stats>({ rendezvous: 0, consultations: 0, ordonnances: 0 });
  const [searchTerm, setSearchTerm]   = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [suggestions, setSuggestions] = useState<Patient[]>([]);
  const [showSug, setShowSug]         = useState(false);
  const [loadingSug, setLoadingSug]   = useState(false);

  const [typeCert, setTypeCert]       = useState<TypeCert>("");
  const [startDate, setStartDate]     = useState(new Date().toISOString().split("T")[0]);
  const [duration, setDuration]       = useState("");
  const [notes, setNotes]             = useState("");
  const [saving, setSaving]           = useState(false);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);

  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Chargement des stats uniquement (plus de chargement de tous les patients)
  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    Promise.all([
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("certificats/"),
    ]).then(([r, c, cert]) => {
      setStats({
        rendezvous: r.data.length,
        consultations: c.data.length,
        ordonnances: cert.data.length,
      });
    }).catch(() => {});
  }, [token, isLoading]);

  // Recherche dynamique des patients via API avec debounce 300ms
  useEffect(() => {
    // Si un patient est déjà sélectionné et que le texte correspond, ne pas rechercher
    if (!searchTerm || selectedPatient?.username === searchTerm) {
      setSuggestions([]);
      setShowSug(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSug(true);
      try {
        const res = await api.get(`patients/?search=${encodeURIComponent(searchTerm)}`);
        const results: Patient[] = res.data.map((pat: any) => ({
          id: pat.id,
          username: pat.username,
        }));
        setSuggestions(results);
        setShowSug(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSug(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedPatient]);

  if (isLoading) return null;

  const canSave = !!selectedPatient && !!typeCert;

  const buildPreview = () => {
    const nom = selectedPatient?.username || "_______________";
    let txt = `Je soussigné(e) Dr. ${username}, certifie avoir examiné ce jour :\n\n${nom}.\n\n`;
    if (notes) txt += notes;
    else {
      if (typeCert === "arret_travail")
        txt += `L'état de santé du patient nécessite un arrêt de travail${duration ? ` de ${duration} jour(s)` : ""}${startDate ? ` à compter du ${new Date(startDate).toLocaleDateString("fr-FR")}` : ""}.`;
      else if (typeCert === "reprise")
        txt += `Le patient est apte à reprendre son activité professionnelle${startDate ? ` à compter du ${new Date(startDate).toLocaleDateString("fr-FR")}` : ""}.`;
      else if (typeCert === "aptitude")
        txt += "Le patient est déclaré apte.";
      else if (typeCert === "inaptitude")
        txt += "Le patient est déclaré inapte.";
      else txt += "...";
    }
    txt += "\n\nCertificat établi à la demande de l'intéressé(e) et remis à qui de droit.";
    return txt;
  };

  const handleSave = async (status: "brouillon" | "signe") => {
    if (!selectedPatient) { setErrorMsg("Veuillez sélectionner un patient dans la liste."); return; }
    if (!typeCert)        { setErrorMsg("Veuillez sélectionner un type de certificat."); return; }
    setErrorMsg(null); setSaving(true);
    try {
      const payload: Record<string, any> = {
        patient:         selectedPatient.id,
        type_certificat: typeCert,
        notes:           notes || buildPreview(),
        status,
      };
      if (typeCert === "arret_travail" || typeCert === "reprise") {
        if (startDate) payload.date_debut_arret = startDate;
        const d = parseInt(duration, 10);
        if (!isNaN(d) && d > 0) payload.nb_jours_arret = d;
      }
      await api.post("certificats/", payload);
      router.push("/dashboard/medecin/certificats");
    } catch (err: any) {
      const data = err?.response?.data;
      setErrorMsg(
        typeof data === "object" && data !== null
          ? Object.entries(data).map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
          : "Erreur serveur inattendue."
      );
    } finally { setSaving(false); }
  };

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .root { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
        .main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }
        .layout { display:grid; grid-template-columns:1fr 420px; gap:28px; align-items:start; animation:fadeUp .4s ease; }
        .form-panel { background:#fff; border-radius:20px; border:1px solid #EAE8F5; overflow:hidden; }
        .form-section { padding:22px 26px; border-bottom:1px solid #F0EEF9; }
        .form-section:last-child { border-bottom:none; }
        .sec-header { display:flex; align-items:center; gap:10px; margin-bottom:18px; }
        .sec-icon { width:32px; height:32px; border-radius:10px; background:#F0EEF9; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
        .sec-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; color:#1C1040; }
        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .field { display:flex; flex-direction:column; gap:5px; position:relative; }
        .field label { font-size:11px; font-weight:600; color:#8A87A0; text-transform:uppercase; letter-spacing:.5px; }
        input, select, textarea { width:100%; padding:10px 13px; font-family:'DM Sans',sans-serif; font-size:13px; color:#1C1040; background:#FAFAFE; border:1px solid #E5E2F5; border-radius:12px; outline:none; transition:all .2s; }
        input:focus, select:focus, textarea:focus { border-color:#534AB7; background:#fff; box-shadow:0 0 0 3px rgba(83,74,183,.1); }
        input::placeholder, textarea::placeholder { color:#C4C0D8; }
        textarea { resize:vertical; line-height:1.6; }
        .sug-list { position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #E5E2F5; border-radius:12px; margin-top:4px; max-height:180px; overflow-y:auto; z-index:20; box-shadow:0 8px 16px rgba(0,0,0,.08); }
        .sug-item { padding:10px 13px; cursor:pointer; font-size:13px; color:#1C1040; transition:background .15s; display:flex; align-items:center; gap:8px; }
        .sug-item:hover { background:#EEEDFE; color:#534AB7; }
        .sug-empty { padding:10px 13px; font-size:12px; color:#C4C0D8; font-style:italic; }
        .sug-loading { padding:10px 13px; font-size:12px; color:#8A87A0; display:flex; align-items:center; gap:8px; }
        .sug-avatar { width:24px; height:24px; border-radius:8px; background:#EEEDFE; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#534AB7; flex-shrink:0; }
        .field-hint { font-size:10px; font-weight:600; margin-top:2px; }
        .type-grid { display:flex; flex-wrap:wrap; gap:8px; }
        .type-pill { padding:8px 14px; border-radius:99px; border:1px solid #E5E2F5; background:#FAFAFE; font-size:12.5px; font-weight:600; color:#8A87A0; cursor:pointer; transition:all .2s; }
        .type-pill:hover { border-color:#AFA9EC; color:#3C3489; background:#EEEDFE; }
        .type-pill.active { background:#534AB7; color:#fff; border-color:transparent; box-shadow:0 4px 12px rgba(83,74,183,.28); }
        .err { background:#FEF2F2; border:1px solid #FCA5A5; border-radius:12px; padding:10px 14px; color:#DC2626; font-size:12.5px; font-weight:600; margin-bottom:16px; }
        .form-actions { display:flex; gap:10px; padding:18px 26px; background:#FAFAFE; border-top:1px solid #F0EEF9; }
        .btn-draft { flex:1; padding:11px; background:#fff; border:1px solid #E5E2F5; border-radius:13px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#8A87A0; cursor:pointer; }
        .btn-draft:hover { border-color:#C4C0D8; color:#1C1040; }
        .btn-send { flex:2; padding:11px; background:#534AB7; border:none; border-radius:13px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#fff; cursor:pointer; box-shadow:0 4px 14px rgba(83,74,183,.3); transition:all .2s; }
        .btn-send:hover { background:#3C3489; transform:translateY(-1px); }
        .btn-send:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none; }
        .preview-panel { position:sticky; top:calc(70px + 2.5rem); animation:fadeUp .45s ease .05s backwards; }
        .preview-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
        .preview-lbl { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#1C1040; display:flex; align-items:center; gap:8px; }
        .live-dot { width:7px; height:7px; border-radius:50%; background:#1D9E75; box-shadow:0 0 0 3px rgba(29,158,117,.2); display:inline-block; }
        .paper { background:#fff; border-radius:6px; padding:30px 26px; box-shadow:0 4px 24px rgba(0,0,0,.08); font-family:'Times New Roman',Georgia,serif; min-height:520px; border-top:3px solid #534AB7; }
        .p-head { padding-bottom:14px; border-bottom:1.5px solid #1C1040; margin-bottom:18px; display:flex; justify-content:space-between; align-items:flex-start; }
        .p-dr   { font-size:17px; font-weight:700; color:#1C1040; }
        .p-sub  { font-size:11px; color:#666; margin-top:3px; line-height:1.7; font-family:sans-serif; }
        .p-seal { width:36px; height:36px; border-radius:50%; border:2px solid #534AB7; display:flex; align-items:center; justify-content:center; font-size:17px; color:#534AB7; }
        .p-ttl  { text-align:center; font-size:10.5px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#1C1040; padding:10px 0 14px; border-bottom:0.5px solid #E5E2F5; margin-bottom:16px; font-family:sans-serif; }
        .p-badge { display:inline-block; background:#EEEDFE; color:#3C3489; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; margin-bottom:14px; font-family:sans-serif; }
        .p-body { font-size:13px; color:#1C1040; line-height:2; white-space:pre-wrap; min-height:100px; }
        .p-empty { color:#C4C0D8; font-style:italic; font-size:12px; font-family:sans-serif; }
        .p-foot { display:flex; justify-content:space-between; align-items:flex-end; margin-top:32px; padding-top:14px; border-top:0.5px solid #E5E2F5; }
        .p-date { font-size:11px; color:#999; font-family:sans-serif; }
        .sig-area { text-align:center; }
        .sig-line { width:90px; border-top:1px solid #999; margin:0 auto 5px; }
        .sig-name { font-size:11px; color:#666; font-family:sans-serif; font-weight:600; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width:12px; height:12px; border:2px solid #E5E2F5; border-top-color:#534AB7; border-radius:50%; animation:spin .6s linear infinite; }
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Nouveau Certificat" subtitle={`Dr. ${username}`} />

        <main className="main">
          <div className="layout">

            <div className="form-panel">

              {/* Patient avec autocomplete dynamique */}
              <div className="form-section">
                <div className="sec-header">
                  <div className="sec-icon">👤</div>
                  <span className="sec-title">Patient</span>
                </div>
                {errorMsg && <div className="err">⚠️ {errorMsg}</div>}
                <div className="field">
                  <label>Nom du patient</label>
                  <input
                    type="text"
                    placeholder="Tapez pour rechercher un patient..."
                    value={searchTerm}
                    onChange={e => {
                      setSearchTerm(e.target.value);
                      setSelectedPatient(null);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSug(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSug(false), 200)}
                    autoComplete="off"
                  />
                  {selectedPatient
                    ? <span className="field-hint" style={{ color: "#1D9E75" }}>✓ Patient sélectionné (ID : {selectedPatient.id})</span>
                    : searchTerm && !loadingSug
                      ? <span className="field-hint" style={{ color: "#DC2626" }}>⚠️ Cliquez sur un patient dans la liste</span>
                      : null
                  }
                  {showSug && searchTerm && (
                    <div className="sug-list">
                      {loadingSug
                        ? <div className="sug-loading"><div className="spinner" /> Recherche en cours...</div>
                        : suggestions.length > 0
                          ? suggestions.map(p => (
                            <div
                              key={p.id}
                              className="sug-item"
                              onMouseDown={() => {
                                setSelectedPatient(p);
                                setSearchTerm(p.username);
                                setShowSug(false);
                                setSuggestions([]);
                              }}
                            >
                              <div className="sug-avatar">{p.username.charAt(0).toUpperCase()}</div>
                              {p.username}
                            </div>
                          ))
                          : <div className="sug-empty">Aucun patient trouvé pour "{searchTerm}"</div>
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Type */}
              <div className="form-section">
                <div className="sec-header">
                  <div className="sec-icon">🏷️</div>
                  <span className="sec-title">Type de certificat</span>
                </div>
                <div className="type-grid">
                  {(Object.keys(TYPE_LABELS).filter(k => k !== "") as TypeCert[]).map(t => (
                    <div key={t} className={`type-pill${typeCert === t ? " active" : ""}`}
                      onClick={() => setTypeCert(t)}>
                      {TYPE_LABELS[t]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Période si arrêt/reprise */}
              {(typeCert === "arret_travail" || typeCert === "reprise") && (
                <div className="form-section">
                  <div className="sec-header">
                    <div className="sec-icon">📅</div>
                    <span className="sec-title">Période</span>
                  </div>
                  <div className="grid2">
                    <div className="field">
                      <label>Date de début</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    {typeCert === "arret_travail" && (
                      <div className="field">
                        <label>Durée (jours)</label>
                        <input type="number" placeholder="Ex : 3" value={duration}
                          onChange={e => setDuration(e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="form-section">
                <div className="sec-header">
                  <div className="sec-icon">📝</div>
                  <span className="sec-title">Corps du certificat</span>
                </div>
                <div className="field">
                  <textarea rows={5}
                    placeholder={`Je soussigné(e) Dr. ${username}, certifie avoir examiné...`}
                    value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <p style={{ fontSize: 11, color: "#C4C0D8", marginTop: 8, fontStyle: "italic" }}>
                  Laissez vide pour utiliser le texte généré automatiquement.
                </p>
              </div>

              <div className="form-actions">
                <button className="btn-draft" onClick={() => handleSave("brouillon")} disabled={saving || !canSave}>
                  💾 Brouillon
                </button>
                <button className="btn-send" onClick={() => handleSave("signe")} disabled={saving || !canSave}>
                  {saving ? "Enregistrement…" : "✓ Signer et valider"}
                </button>
              </div>
            </div>

            {/* Aperçu */}
            <div className="preview-panel">
              <div className="preview-top">
                <span className="preview-lbl"><span className="live-dot" /> Aperçu en direct</span>
                
              </div>
              <div className="paper">
                <div className="p-head">
                  <div>
                    <div className="p-dr">Dr. {username}</div>
                    <div className="p-sub">Médecin Généraliste<br />Tél : +216 71 000 000 · Tunis</div>
                  </div>
                  <div className="p-seal">⚕</div>
                </div>
                <div className="p-ttl">{TYPE_LABELS[typeCert] || "Certificat médical"}</div>
                {typeCert && <div><span className="p-badge">{TYPE_LABELS[typeCert]}</span></div>}
                <div className="p-body">
                  {selectedPatient || typeCert
                    ? buildPreview()
                    : <span className="p-empty">Le texte apparaîtra ici au fur et à mesure de la saisie…</span>
                  }
                </div>
                <div className="p-foot">
                  <div className="p-date">Tunis, le {today}</div>
                  <div className="sig-area">
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