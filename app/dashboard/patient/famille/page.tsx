"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import PrivateRoute from "@/components/PrivateRoute";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (Identiques à la maquette de référence)
// ─────────────────────────────────────────────────────────────
const T = {
  bg: "#F0F4F1",
  surface: "#FFFFFF",
  border: "#E2EAE5",
  borderMid: "#9FE1CB",
  accent: "#1D9E75",
  accentLight: "#E1F5EE",
  accentDark: "#085041",
  textPrimary: "#0F1F18",
  textMuted: "#4A5C52",
  textLight: "#8A9A92",
  font: "'Plus Jakarta Sans', -apple-system, sans-serif",
  radius: "8px",
  radiusLg: "12px",
};

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type LienParente =
  | "conjoint"
  | "enfant"
  | "pere"
  | "mere"
  | "frere_soeur"
  | "autre";

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
  { value: "enfant", label: "Enfant" },
  { value: "conjoint", label: "Conjoint(e)" },
  { value: "pere", label: "Père" },
  { value: "mere", label: "Mère" },
  { value: "frere_soeur", label: "Frère / Sœur" },
  { value: "autre", label: "Autre" },
];

const emptyMembre = () => ({
  nom: "",
  prenom: "",
  date_naissance: "",
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

  const [membres, setMembres] = useState<MembreFamille[]>([]);
  const [familyMedecin, setFamilyMedecin] = useState<MedecinInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newMembre, setNewMembre] = useState(emptyMembre());

  // ── Fetch membres + médecin de famille ──
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [mRes, meRes] = await Promise.all([
        api.get("familles/membres/"),
        api.get("users/me/"),
      ]);
      setMembres(mRes.data);

      const medecinId = meRes.data.medecin_traitant;
      const medecinNom = meRes.data.medecin_nom;
      if (medecinId) {
        setFamilyMedecin({
          id: medecinId,
          nom_complet: medecinNom || "Médecin traitant",
          specialite: "",
        });
      } else if (mRes.data.length > 0 && mRes.data[0].medecin_traitant) {
        setFamilyMedecin({
          id: mRes.data[0].medecin_traitant,
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
    setNewMembre((prev) => ({ ...prev, [field]: value }));

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
          ? Object.entries(d)
              .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : "Erreur lors de l'ajout du membre.",
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

  const handleAction = (
    m: MembreFamille,
    action: "rdv" | "dossier" | "paiement",
  ) => {
    const paths = {
      rdv: `/dashboard/patient/rendezvous?pour=${m.id}&nom=${encodeURIComponent(m.prenom + " " + m.nom)}`,
      dossier: `/dashboard/patient/dossiermedical?pour=${m.id}&nom=${encodeURIComponent(m.prenom + " " + m.nom)}`,
      paiement: `/dashboard/patient/facturation?pour=${m.id}&nom=${encodeURIComponent(m.prenom + " " + m.nom)}`,
    };
    router.push(paths[action]);
  };

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to { transform:rotate(360deg); } }

        .pg-root { min-height:100vh; background:${T.bg}; font-family:${T.font}; display:flex; }
        .pg-main { margin-left:260px; flex:1; padding:1.5rem; padding-top:calc(52px + 1.5rem); display:flex; flex-direction:column; gap:12px; }

        /* Header */
        .pg-header { display:flex; align-items:center; justify-content:space-between; }
        .pg-title  { font-size:20px; font-weight:800; color:${T.textPrimary}; }
        .pg-sub    { font-size:12px; color:${T.textLight}; margin-top:2px; }

        /* Cards & Surfaces */
        .card-surface { background:${T.surface}; border:0.5px solid ${T.border}; border-radius:${T.radiusLg}; overflow:hidden; }
        .card-accent  { background:${T.accentLight}; border:0.5px solid ${T.borderMid}; border-radius:${T.radiusLg}; padding:12px 14px; display:flex; align-items:center; gap:10px; }
        
        /* Stat Icon */
        .stat-icon { width:34px; height:34px; border-radius:8px; background:${T.accentLight}; border:0.5px solid ${T.borderMid}; display:flex; align-items:center; justify-content:center; color:${T.accentDark}; font-size:16px; flex-shrink:0; }
        
        /* Badge */
        .li-badge { font-size:10px; font-weight:700; color:${T.accentDark}; background:${T.accentLight}; border:0.5px solid ${T.borderMid}; padding:2px 8px; border-radius:20px; flex-shrink:0; display:inline-flex; align-items:center; gap:4px; }
        
        /* Pill Avatar */
        .li-pill { width:30px; height:30px; border-radius:8px; background:${T.accentLight}; border:0.5px solid ${T.borderMid}; display:flex; align-items:center; justify-content:center; color:${T.accentDark}; font-size:13px; font-weight:700; flex-shrink:0; }

        /* Inputs & Forms */
        .form-input { width:100%; padding:8px 12px; border-radius:${T.radius}; border:0.5px solid ${T.border}; background:${T.surface}; font-family:${T.font}; font-size:13px; color:${T.textPrimary}; outline:none; transition:border-color .15s; }
        .form-input:focus { border-color:${T.borderMid}; }
        .form-input::placeholder { color:${T.textLight}; }
        
        .form-select { width:100%; padding:8px 12px; border-radius:${T.radius}; border:0.5px solid ${T.border}; background:${T.surface}; font-family:${T.font}; font-size:13px; color:${T.textPrimary}; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A9A92' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; padding-right:32px; transition:border-color .15s; }
        .form-select:focus { border-color:${T.borderMid}; }
        
        .form-label { display:block; font-size:10px; font-weight:700; color:${T.textLight}; margin-bottom:4px; text-transform:uppercase; letter-spacing:.6px; }

        /* Buttons */
        .btn-primary { background:${T.accent}; color:white; border:none; border-radius:${T.radius}; padding:8px 14px; font-size:12px; font-weight:600; font-family:${T.font}; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all .12s; }
        .btn-primary:hover { background:${T.accentDark}; }
        .btn-primary:disabled { opacity:.45; cursor:not-allowed; }
        
        .btn-exp { flex:1; background:${T.surface}; border:0.5px solid ${T.border}; border-radius:${T.radius}; color:${T.textMuted}; font-size:12px; padding:8px 6px; cursor:pointer; font-family:${T.font}; display:flex; align-items:center; justify-content:center; gap:5px; font-weight:600; transition:all .12s; }
        .btn-exp:hover { background:${T.accentLight}; border-color:${T.borderMid}; color:${T.accentDark}; }
        
        .btn-sec { background:transparent; border:0.5px solid ${T.border}; border-radius:${T.radius}; color:${T.textMuted}; font-size:12px; padding:8px 14px; cursor:pointer; font-family:${T.font}; display:inline-flex; align-items:center; gap:6px; transition:all .12s; font-weight:600; }
        .btn-sec:hover { background:${T.accentLight}; border-color:${T.borderMid}; color:${T.accentDark}; }

        .btn-danger-icon { background:transparent; border:0.5px solid ${T.border}; border-radius:${T.radius}; color:${T.textLight}; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; transition:all .12s; padding:0; }
        .btn-danger-icon:hover { background:#FEE2E2; border-color:#FCA5A5; color:#DC2626; }

        /* Error */
        .error-box { font-size:11px; color:#DC2626; background:#FEF2F2; border:0.5px solid #FEE2E2; border-radius:${T.radius}; padding:8px 12px; display:flex; align-items:center; gap:6px; }
        
        /* Warning */
        .warning-box { font-size:11px; color:#9B6700; background:#FFF9EC; border:0.5px solid #F5A623; border-radius:${T.radius}; padding:8px 12px; display:flex; align-items:center; gap:6px; }

        /* Skeleton */
        .skeleton { background:linear-gradient(90deg,${T.bg} 25%,${T.border} 50%,${T.bg} 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }

        /* Empty State */
        .empty-state { text-align:center; padding:40px 20px; color:${T.textLight}; }

        /* Grid */
        .grid-members { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:10px; }
        
        /* Separator */
        .sep { border:none; border-top:0.5px solid ${T.border}; margin:0; }
      `}</style>

      <div className="pg-root">
        <Sidebar
          stats={{
            rendezvous: 0,
            consultations: 0,
            ordonnances: 0,
            notifications: 0,
          }}
        />
        <Navbar
          title="Mon Espace Famille"
          subtitle={`Gérez la santé de vos proches, ${username}`}
        />

        <main className="pg-main">
          {/* Header */}
          <div className="pg-header" style={{ animation: "fadeUp .3s ease" }}>
            <div>
              <div className="pg-title">Mon espace famille</div>
              <div className="pg-sub">
                {membres.length} membre{membres.length !== 1 ? "s" : ""}{" "}
                enregistré{membres.length !== 1 ? "s" : ""}
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              <i
                className="ti ti-plus"
                style={{ fontSize: 14 }}
                aria-hidden="true"
              />
              Ajouter un membre
            </button>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="error-box" style={{ animation: "fadeUp .3s ease" }}>
              <i
                className="ti ti-alert-circle"
                style={{ fontSize: 14 }}
                aria-hidden="true"
              />
              {errorMsg}
            </div>
          )}

          {/* Médecin de famille banner */}
          <div style={{ animation: "fadeUp .3s .07s ease backwards" }}>
            {familyMedecin ? (
              <div className="card-accent">
                <div className="stat-icon">
                  <i className="ti ti-stethoscope" aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.textPrimary,
                    }}
                  >
                    Médecin traitant familial
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>
                    {familyMedecin.nom_complet} · Assigné à tous les membres
                  </div>
                </div>
                <span className="li-badge">
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: T.accent,
                    }}
                  ></span>
                  Actif
                </span>
              </div>
            ) : (
              <div className="warning-box">
                <i
                  className="ti ti-alert-triangle"
                  style={{ fontSize: 14 }}
                  aria-hidden="true"
                />
                Aucun médecin traitant assigné. Prenez un RDV pour en attribuer
                un automatiquement.
              </div>
            )}
          </div>

          {/* Chef banner */}
          <div
            className="card-surface"
            style={{ animation: "fadeUp .3s .1s ease backwards" }}
          >
            <div
              style={{
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 9,
              }}
            >
              <div
                className="li-pill"
                style={{
                  background: T.accent,
                  color: "#fff",
                  borderColor: T.accent,
                }}
              >
                <i
                  className="ti ti-crown"
                  style={{ fontSize: 14 }}
                  aria-hidden="true"
                />
              </div>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.textPrimary,
                  }}
                >
                  {username}
                </span>
                <span className="li-badge" style={{ marginLeft: 6 }}>
                  Chef de famille
                </span>
                <div style={{ fontSize: 10, color: T.textLight, marginTop: 2 }}>
                  Le médecin traitant est automatiquement hérité par tous les
                  membres ajoutés
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div
              className="card-surface"
              style={{ animation: "fadeUp .3s ease" }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <i
                    className="ti ti-user-plus"
                    style={{ fontSize: 14, color: T.accent }}
                    aria-hidden="true"
                  />
                  Nouveau membre
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div>
                    <label className="form-label">Prénom *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Prénom"
                      value={newMembre.prenom}
                      onChange={(e) =>
                        updateNewMembre("prenom", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label">Nom *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nom"
                      value={newMembre.nom}
                      onChange={(e) => updateNewMembre("nom", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Date de naissance</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newMembre.date_naissance}
                      onChange={(e) =>
                        updateNewMembre("date_naissance", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="form-label">Lien de parenté</label>
                    <select
                      className="form-select"
                      value={newMembre.lien_parente}
                      onChange={(e) =>
                        updateNewMembre("lien_parente", e.target.value)
                      }
                    >
                      {LIENS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Sexe</label>
                    <select
                      className="form-select"
                      value={newMembre.sexe}
                      onChange={(e) => updateNewMembre("sexe", e.target.value)}
                    >
                      <option value="homme">Homme</option>
                      <option value="femme">Femme</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Médecin traitant</label>
                    {familyMedecin ? (
                      <div
                        className="card-accent"
                        style={{
                          padding: "0 10px",
                          height: "34px",
                          borderRadius: T.radius,
                          fontSize: 11,
                          fontWeight: 600,
                          color: T.accentDark,
                        }}
                      >
                        <i
                          className="ti ti-stethoscope"
                          style={{ fontSize: 12 }}
                          aria-hidden="true"
                        />
                        {familyMedecin.nom_complet} (Hérité)
                      </div>
                    ) : (
                      <div
                        className="warning-box"
                        style={{
                          height: "34px",
                          borderRadius: T.radius,
                          fontSize: 10,
                        }}
                      >
                        Aucun médecin
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <button
                    className="btn-sec"
                    onClick={() => {
                      setShowForm(false);
                      setNewMembre(emptyMembre());
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleAddMembre}
                    disabled={
                      submitting ||
                      !newMembre.nom.trim() ||
                      !newMembre.prenom.trim()
                    }
                  >
                    {submitting ? "Enregistrement..." : "Confirmer"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading / Empty / List */}
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "2rem 0",
                color: T.textLight,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: `2px solid ${T.border}`,
                  borderTopColor: T.accent,
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              ></div>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Chargement...
              </span>
            </div>
          ) : membres.length === 0 ? (
            <div className="card-surface">
              <div className="empty-state">
                <i
                  className="ti ti-users"
                  style={{ fontSize: 28, color: T.border }}
                  aria-hidden="true"
                />
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    margin: "8px 0 4px",
                    color: T.textMuted,
                  }}
                >
                  Aucun membre ajouté
                </p>
                <p style={{ fontSize: 11, marginBottom: 12 }}>
                  Les membres ajoutés hériteront automatiquement du médecin
                  traitant
                </p>
                <button
                  className="btn-primary"
                  style={{ margin: "0 auto" }}
                  onClick={() => setShowForm(true)}
                >
                  <i
                    className="ti ti-plus"
                    style={{ fontSize: 14 }}
                    aria-hidden="true"
                  />
                  Ajouter mon premier membre
                </button>
              </div>
            </div>
          ) : (
            <div
              className="grid-members"
              style={{ animation: "fadeUp .3s .14s ease backwards" }}
            >
              {membres.map((m) => (
                <div key={m.id} className="card-surface">
                  <div
                    style={{
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {/* Member Info Row */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 9,
                          alignItems: "flex-start",
                        }}
                      >
                        <div className="li-pill">
                          {m.prenom.charAt(0)}
                          {m.nom.charAt(0)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: T.textPrimary,
                            }}
                          >
                            {m.prenom} {m.nom}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              marginTop: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            <span className="li-badge">
                              {
                                LIENS.find((l) => l.value === m.lien_parente)
                                  ?.label
                              }
                            </span>
                            {m.date_naissance &&
                              getAge(m.date_naissance) !== "" && (
                                <span className="li-badge">
                                  {getAge(m.date_naissance)} ans
                                </span>
                              )}
                            {m.medecin_nom && (
                              <span className="li-badge">
                                <i
                                  className="ti ti-stethoscope"
                                  style={{ fontSize: 10 }}
                                  aria-hidden="true"
                                />
                                {m.medecin_nom}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn-danger-icon"
                        onClick={() => {
                          if (confirm("Supprimer ce membre ?"))
                            handleRemoveMembre(m.id);
                        }}
                      >
                        <i
                          className="ti ti-x"
                          style={{ fontSize: 12 }}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    <hr className="sep" />

                    {/* Actions Row */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn-exp"
                        onClick={() => handleAction(m, "rdv")}
                      >
                        <i
                          className="ti ti-calendar-event"
                          style={{ fontSize: 13 }}
                          aria-hidden="true"
                        />{" "}
                        RDV
                      </button>
                      <button
                        className="btn-exp"
                        onClick={() => handleAction(m, "dossier")}
                      >
                        <i
                          className="ti ti-folder"
                          style={{ fontSize: 13 }}
                          aria-hidden="true"
                        />{" "}
                        Dossier
                      </button>
                      <button
                        className="btn-exp"
                        onClick={() => handleAction(m, "paiement")}
                      >
                        <i
                          className="ti ti-credit-card"
                          style={{ fontSize: 13 }}
                          aria-hidden="true"
                        />{" "}
                        Paiement
                      </button>
                    </div>
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
