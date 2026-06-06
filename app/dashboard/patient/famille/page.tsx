"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import PrivateRoute from "@/components/PrivateRoute";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type LienParente = "conjoint" | "enfant" | "pere" | "mere" | "frere_soeur" | "autre";

interface MembreFamille {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  lien_parente: LienParente;
  sexe: "homme" | "femme";
  medecin_traitant: number | null;
  medecin_nom: string | null;
}

interface MedecinInfo {
  id: number;
  nom_complet: string;
  specialite: string;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const LIENS: { value: LienParente; label: string }[] = [
  { value: "enfant",      label: "Enfant" },
  { value: "conjoint",    label: "Conjoint(e)" },
  { value: "pere",        label: "Père" },
  { value: "mere",        label: "Mère" },
  { value: "frere_soeur", label: "Frère / Sœur" },
  { value: "autre",       label: "Autre" },
];

const emptyMembre = () => ({
  nom: "", prenom: "", date_naissance: "",
  lien_parente: "enfant" as LienParente,
  sexe: "homme" as "homme" | "femme",
});

const getAge = (dob: string) => {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function EspaceFamillePatient() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [membres, setMembres]             = useState<MembreFamille[]>([]);
  const [familyMedecin, setFamilyMedecin] = useState<MedecinInfo | null>(null);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [errorMsg, setErrorMsg]           = useState("");
  const [showForm, setShowForm]           = useState(false);
  const [newMembre, setNewMembre]         = useState(emptyMembre());

  // ── Fetch membres + médecin de famille ──
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [mRes, meRes] = await Promise.all([
        api.get("familles/membres/"),
        api.get("users/me/"),
      ]);
      setMembres(mRes.data);

      const medecinId  = meRes.data.medecin_traitant;
      const medecinNom = meRes.data.medecin_nom;
      if (medecinId) {
        setFamilyMedecin({ id: medecinId, nom_complet: medecinNom || "Médecin traitant", specialite: "" });
      } else if (mRes.data.length > 0 && mRes.data[0].medecin_traitant) {
        setFamilyMedecin({
          id:         mRes.data[0].medecin_traitant,
          nom_complet: mRes.data[0].medecin_nom || "Médecin traitant",
          specialite: "",
        });
      } else {
        setFamilyMedecin(null);
      }
      setErrorMsg("");
    } catch {
      setErrorMsg("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoading && token) fetchData();
  }, [token, isLoading, fetchData]);

  // Polling 15s
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get("familles/membres/");
        setMembres(res.data);
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // ── Handlers ──
  const updateNewMembre = (field: string, value: string) =>
    setNewMembre(prev => ({ ...prev, [field]: value }));

  const handleAddMembre = async () => {
    if (!newMembre.nom.trim() || !newMembre.prenom.trim()) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await api.post("familles/membres/", newMembre);
      setShowForm(false);
      setNewMembre(emptyMembre());
      fetchData();
    } catch (err: any) {
      const d = err?.response?.data;
      setErrorMsg(
        typeof d === "object" && d
          ? Object.entries(d).map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
          : "Erreur lors de l'ajout du membre."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMembre = async (id: number) => {
    try {
      await api.delete(`familles/membres/${id}/`);
      fetchData();
    } catch {
      setErrorMsg("Erreur lors de la suppression.");
    }
  };

  const handleAction = (m: MembreFamille, action: "rdv" | "dossier" | "paiement") => {
    const paths = {
      rdv:      `/dashboard/patient/rendezvous?pour=${m.id}&nom=${encodeURIComponent(m.prenom + " " + m.nom)}`,
      dossier:  `/dashboard/patient/dossiermedical?pour=${m.id}&nom=${encodeURIComponent(m.prenom + " " + m.nom)}`,
      paiement: `/dashboard/patient/facturation?pour=${m.id}&nom=${encodeURIComponent(m.prenom + " " + m.nom)}`,
    };
    router.push(paths[action]);
  };

  return (
    // ✅ allowedRoles=["patient"] — correct for this page
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeInUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn  { from { opacity:0; transform:scale(0.96); }     to { opacity:1; transform:scale(1); } }
        @keyframes spin     { to { transform:rotate(360deg); } }
        @keyframes pulse    { 0%,100%{opacity:1;} 50%{opacity:0.5;} }

        .fam-page-bg { background:linear-gradient(135deg,#FDF4FF 0%,#ECFDF5 50%,#EFF6FF 100%); min-height:100vh; font-family:'DM Sans',sans-serif; }
        .fam-card { background:rgba(255,255,255,0.78); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.92); border-radius:24px; box-shadow:0 4px 24px rgba(139,92,246,0.06); animation:fadeInUp 0.5s ease backwards; transition:all 0.3s ease; }
        .fam-card:hover { box-shadow:0 8px 24px rgba(139,92,246,0.1); transform:translateY(-4px); }
        .fam-input { width:100%; padding:12px 16px; border-radius:14px; border:1.5px solid #E2E8F0; background:rgba(255,255,255,0.9); font-family:'DM Sans',sans-serif; font-size:14px; color:#1E293B; transition:all 0.25s ease; outline:none; }
        .fam-input:focus { border-color:#8B5CF6; box-shadow:0 0 0 4px rgba(139,92,246,0.1); background:#fff; }
        .fam-input::placeholder { color:#94A3B8; }
        .fam-select { width:100%; padding:12px 16px; border-radius:14px; border:1.5px solid #E2E8F0; background:rgba(255,255,255,0.9); font-family:'DM Sans',sans-serif; font-size:14px; color:#1E293B; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:40px; }
        .fam-select:focus { border-color:#8B5CF6; box-shadow:0 0 0 4px rgba(139,92,246,0.1); }
        .fam-label { display:block; font-size:12px; font-weight:700; color:#475569; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.6px; }
        .fam-btn-primary { background:linear-gradient(135deg,#8B5CF6,#10B981); color:white; border:none; border-radius:14px; padding:14px 32px; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.3s ease; box-shadow:0 6px 20px rgba(139,92,246,0.35); display:inline-flex; align-items:center; gap:10px; }
        .fam-btn-primary:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(139,92,246,0.45); }
        .fam-btn-primary:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .fam-btn-secondary { background:rgba(255,255,255,0.8); color:#64748B; border:1.5px solid #E2E8F0; border-radius:14px; padding:12px 20px; font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.25s ease; }
        .fam-btn-secondary:hover { background:#F8FAFC; border-color:#CBD5E1; }
        .fam-btn-action { background:rgba(139,92,246,0.06); color:#8B5CF6; border:1.5px solid rgba(139,92,246,0.2); border-radius:12px; padding:10px 16px; font-size:12px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.25s ease; display:inline-flex; align-items:center; gap:6px; }
        .fam-btn-action:hover { background:rgba(139,92,246,0.12); border-color:rgba(139,92,246,0.4); }
        .fam-btn-danger { background:#FEF2F2; color:#DC2626; border:1.5px solid #FEE2E2; border-radius:10px; padding:8px 12px; font-size:12px; font-weight:600; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s ease; }
        .fam-btn-danger:hover { background:#FEE2E2; border-color:#DC2626; }
        .fam-gradient-text { background:linear-gradient(135deg,#8B5CF6,#10B981); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .medecin-banner { background:linear-gradient(135deg,rgba(83,74,183,0.08),rgba(16,185,129,0.08)); border:1.5px solid rgba(83,74,183,0.15); border-radius:16px; padding:14px 18px; display:flex; align-items:center; gap:14px; margin-bottom:20px; animation:fadeInUp 0.4s ease .05s backwards; }
        .medecin-banner-icon { width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,#534AB7,#10B981); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .medecin-banner-label { font-size:11px; font-weight:700; color:#8A87A0; text-transform:uppercase; letter-spacing:.5px; margin-bottom:2px; }
        .medecin-banner-name { font-size:15px; font-weight:700; color:#1C1040; }
        .medecin-banner-sub { font-size:11px; color:#64748B; margin-top:1px; }
        .medecin-banner-badge { margin-left:auto; background:#EDFAF4; color:#0B6B42; border:1px solid #6EE7B7; border-radius:99px; padding:4px 12px; font-size:11px; font-weight:700; display:flex; align-items:center; gap:5px; flex-shrink:0; }
        .inherited-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; padding:3px 10px; border-radius:8px; background:rgba(83,74,183,0.08); color:#534AB7; border:1px solid rgba(83,74,183,0.2); font-weight:700; }
        .medecin-info-box { background:linear-gradient(135deg,rgba(83,74,183,0.05),rgba(16,185,129,0.05)); border:1.5px dashed rgba(83,74,183,0.25); border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:12px; }
        .no-medecin-box { background:#FFF9EC; border:1.5px dashed #F5A623; border-radius:14px; padding:12px 16px; font-size:12.5px; color:#9B6700; font-weight:600; display:flex; align-items:center; gap:8px; }
      `}</style>

      <div className="fam-page-bg" style={{ display:"flex" }}>
        <Sidebar stats={{}} />
        <Navbar title="Mon Espace Famille" subtitle={`Gérez la santé de vos proches, ${username}`} />

        <main style={{ flex:1, marginLeft:240, padding:"2rem 2.5rem", paddingTop:"100px" }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:24, animation:"fadeInUp 0.4s ease backwards" }}>
            <div style={{ width:56, height:56, borderRadius:18, background:"linear-gradient(135deg,#8B5CF6,#10B981)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(139,92,246,0.35)", flexShrink:0 }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div style={{ flex:1 }}>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:"#1E1B4B", margin:0, lineHeight:1.2 }}>
                Mon Espace <span className="fam-gradient-text">Famille</span>
              </h1>
              <p style={{ fontSize:14, color:"#64748B", margin:0, marginTop:2 }}>
                Tous les membres partagent automatiquement le même médecin traitant
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, color:"#10B981", fontSize:11, fontWeight:600 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:"#10B981", animation:"pulse 2s ease infinite" }}/>
              Sync temps réel
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FEE2E2", color:"#DC2626", padding:"12px 20px", borderRadius:14, marginBottom:20, fontWeight:600, fontSize:13 }}>
              {errorMsg}
            </div>
          )}

          {/* Médecin de famille banner */}
          {familyMedecin ? (
            <div className="medecin-banner">
              <div className="medecin-banner-icon">🩺</div>
              <div>
                <div className="medecin-banner-label">Médecin traitant de la famille</div>
                <div className="medecin-banner-name">{familyMedecin.nom_complet}</div>
                <div className="medecin-banner-sub">Assigné automatiquement à tous les membres</div>
              </div>
              <div className="medecin-banner-badge">
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#1D9E75" }}/>
                Actif
              </div>
            </div>
          ) : (
            <div className="no-medecin-box" style={{ marginBottom:20 }}>
              ⚠️ Aucun médecin traitant assigné à votre compte. Prenez un rendez-vous pour en avoir un.
            </div>
          )}

          {/* Chef banner */}
          <div className="fam-card" style={{ padding:20, marginBottom:24, background:"linear-gradient(135deg,rgba(139,92,246,0.06),rgba(16,185,129,0.06))" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:14, background:"linear-gradient(135deg,#8B5CF6,#10B981)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700, fontSize:16, flexShrink:0 }}>👑</div>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:"#1E293B", margin:0 }}>
                  {username}
                  <span style={{ fontSize:11, padding:"3px 10px", borderRadius:8, background:"linear-gradient(135deg,#8B5CF6,#10B981)", color:"white", fontWeight:700, marginLeft:8 }}>
                    Chef de famille
                  </span>
                </p>
                <p style={{ fontSize:12, color:"#64748B", margin:0, marginTop:2 }}>
                  Le médecin traitant est automatiquement hérité par tous les membres ajoutés
                </p>
              </div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:20 }}>
            <button className="fam-btn-primary" onClick={() => setShowForm(!showForm)}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ajouter un membre
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="fam-card" style={{ padding:28, marginBottom:24, animation:"scaleIn 0.3s ease" }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:"#1E1B4B", margin:0, marginBottom:20 }}>
                Nouveau membre
              </h2>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>
                <div>
                  <label className="fam-label">Prénom *</label>
                  <input type="text" className="fam-input" placeholder="Prénom" value={newMembre.prenom} onChange={e => updateNewMembre("prenom", e.target.value)}/>
                </div>
                <div>
                  <label className="fam-label">Nom *</label>
                  <input type="text" className="fam-input" placeholder="Nom" value={newMembre.nom} onChange={e => updateNewMembre("nom", e.target.value)}/>
                </div>
                <div>
                  <label className="fam-label">Date de naissance</label>
                  <input type="date" className="fam-input" value={newMembre.date_naissance} onChange={e => updateNewMembre("date_naissance", e.target.value)}/>
                </div>
                <div>
                  <label className="fam-label">Lien de parenté</label>
                  <select className="fam-select" value={newMembre.lien_parente} onChange={e => updateNewMembre("lien_parente", e.target.value)}>
                    {LIENS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="fam-label">Sexe</label>
                  <select className="fam-select" value={newMembre.sexe} onChange={e => updateNewMembre("sexe", e.target.value)}>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="fam-label">Médecin traitant</label>
                  {familyMedecin ? (
                    <div className="medecin-info-box">
                      <span style={{ fontSize:22 }}>🩺</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#1C1040" }}>{familyMedecin.nom_complet}</div>
                        <div style={{ fontSize:11.5, color:"#64748B", marginTop:2 }}>Hérité automatiquement</div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-medecin-box" style={{ height:48 }}>⚠️ Aucun médecin assigné</div>
                  )}
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:12 }}>
                <button className="fam-btn-secondary" onClick={() => { setShowForm(false); setNewMembre(emptyMembre()); }}>
                  Annuler
                </button>
                <button
                  className="fam-btn-primary"
                  style={{ padding:"12px 24px", fontSize:13 }}
                  onClick={handleAddMembre}
                  disabled={submitting || !newMembre.nom.trim() || !newMembre.prenom.trim()}
                >
                  {submitting ? "Enregistrement..." : "Confirmer"}
                </button>
              </div>
            </div>
          )}

          {/* Loading / Empty / List */}
          {loading ? (
            <div style={{ textAlign:"center", padding:"4rem 0", color:"#94A3B8" }}>
              <div style={{ width:36, height:36, border:"3px solid #E2E8F0", borderTopColor:"#8B5CF6", borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto 16px" }}/>
              <p style={{ fontWeight:600 }}>Chargement des membres...</p>
            </div>
          ) : membres.length === 0 ? (
            <div className="fam-card" style={{ padding:"4rem 2rem", textAlign:"center", color:"#94A3B8" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>👨‍👩‍👧‍👦</div>
              <p style={{ fontSize:18, fontWeight:600, color:"#475569", marginBottom:8 }}>Aucun membre ajouté</p>
              <p style={{ fontSize:14, marginBottom:20 }}>Les membres ajoutés hériteront automatiquement du médecin traitant familial</p>
              <button className="fam-btn-primary" style={{ margin:"0 auto" }} onClick={() => setShowForm(true)}>
                Ajouter mon premier membre
              </button>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))", gap:20 }}>
              {membres.map((m, i) => (
                <div key={m.id} className="fam-card" style={{ padding:24, animationDelay:`${i * 0.08}s` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{ width:50, height:50, borderRadius:15, background:"linear-gradient(135deg,#8B5CF6,#10B981)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:18, fontWeight:700, flexShrink:0 }}>
                        {m.prenom.charAt(0)}{m.nom.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize:16, fontWeight:700, color:"#1E293B", margin:0 }}>{m.prenom} {m.nom}</p>
                        <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap", alignItems:"center" }}>
                          <span style={{ fontSize:11, padding:"3px 10px", borderRadius:8, background:"rgba(139,92,246,0.08)", color:"#8B5CF6", fontWeight:700, border:"1px solid rgba(139,92,246,0.15)" }}>
                            {LIENS.find(l => l.value === m.lien_parente)?.label}
                          </span>
                          {m.date_naissance && getAge(m.date_naissance) !== "" && (
                            <span style={{ fontSize:11, padding:"3px 10px", borderRadius:8, background:"rgba(16,185,129,0.08)", color:"#059669", fontWeight:700, border:"1px solid rgba(16,185,129,0.15)" }}>
                              {getAge(m.date_naissance)} ans
                            </span>
                          )}
                          {m.medecin_nom && (
                            <span className="inherited-badge">🩺 {m.medecin_nom}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="fam-btn-danger" onClick={() => { if (confirm("Supprimer ce membre ?")) handleRemoveMembre(m.id); }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    <button className="fam-btn-action" onClick={() => handleAction(m, "rdv")}>📅 Prendre RDV</button>
                    <button className="fam-btn-action" onClick={() => handleAction(m, "dossier")}>📂 Dossier</button>
                    <button className="fam-btn-action" onClick={() => handleAction(m, "paiement")}>💳 Paiement</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </PrivateRoute>
  );
}