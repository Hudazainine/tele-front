"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (Identiques à la maquette de référence)
// ─────────────────────────────────────────────────────────────
const T = {
  bg:            "#F0F4F1",
  surface:       "#FFFFFF",
  border:        "#E2EAE5",
  borderMid:     "#9FE1CB",
  accent:        "#1D9E75",
  accentLight:   "#E1F5EE",
  accentDark:    "#085041",
  textPrimary:   "#0F1F18",
  textMuted:     "#4A5C52",
  textLight:     "#8A9A92",
  font:          "'Plus Jakarta Sans', -apple-system, sans-serif",
  radius:        "8px",
  radiusLg:      "12px",
  yellow:        "#D97706",
  yellowLight:   "#FFFBEB",
  yellowBorder:  "#FDE68A",
};

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Controle {
  id: number;
  patient: number;
  patient_name?: string;
  medecin_name?: string;
  type_controle: string;
  date_controle: string;
  statut_paiement: "paye" | "non_paye";
  notes?: string;
  created_at: string;
}

type FilterType = "tous" | "paye" | "non_paye";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const TYPES_CONTROLE = [
  { value: "tension_arterielle", label: "Tension artérielle", icon: "ti-activity" },
  { value: "glycemie",           label: "Glycémie",           icon: "ti-droplet" },
  { value: "poids_taille",       label: "Poids & Taille",     icon: "ti-scale" },
  { value: "electrocardiogramme",label: "Électrocardiogramme",icon: "ti-heartbeat" },
  { value: "bilan_sanguin",      label: "Bilan sanguin",      icon: "ti-test-pipe" },
  { value: "radiologie",         label: "Radiologie",         icon: "ti-x-ray" },
  { value: "echographie",        label: "Échographie",        icon: "ti-scan" },
  { value: "spirometrie",        label: "Spirométrie",        icon: "ti-lungs" },
  { value: "fond_oeil",          label: "Fond d'œil",         icon: "ti-eye" },
  { value: "autre",              label: "Autre",              icon: "ti-list-check" },
];

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function PatientControles() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [controles, setControles]           = useState<Controle[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeFilter, setActiveFilter]     = useState<FilterType>("tous");
  const [previousCount, setPreviousCount]   = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }

    const fetchControles = () => {
      api.get("controles/")
        .then((r) => {
          const newData = r.data.results || r.data;
          if (previousCount > 0 && newData.length > previousCount) {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
          }
          setControles(newData);
          setPreviousCount(newData.length);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    fetchControles();
    const interval = setInterval(fetchControles, 5000);
    return () => clearInterval(interval);
  }, [token, isLoading, previousCount]);

  if (isLoading) return null;

  const filteredControles = controles
    .filter((c) => {
      if (activeFilter === "paye")    return c.statut_paiement === "paye";
      if (activeFilter === "non_paye") return c.statut_paiement === "non_paye";
      return true;
    })
    .sort((a, b) => new Date(b.date_controle).getTime() - new Date(a.date_controle).getTime());

  const getTypeLabel = (val: string) => TYPES_CONTROLE.find((t) => t.value === val)?.label ?? val;
  const getTypeIcon  = (val: string) => TYPES_CONTROLE.find((t) => t.value === val)?.icon  ?? "ti-list-check";

  const totalPaye    = controles.filter((c) => c.statut_paiement === "paye").length;
  const totalNonPaye = controles.filter((c) => c.statut_paiement === "non_paye").length;

  // "Nouveau" = créé il y a moins de 2 heures
  const isNew = (dateStr: string) =>
    Date.now() - new Date(dateStr).getTime() < 2 * 60 * 60 * 1000;

  const filters: { key: FilterType; label: string; count: number; icon: string }[] = [
    { key: "tous",     label: "Tous",      count: controles.length, icon: "ti-list" },
    { key: "paye",     label: "Payés",     count: totalPaye,        icon: "ti-circle-check" },
    { key: "non_paye", label: "Non payés", count: totalNonPaye,     icon: "ti-clock" },
  ];

  // Pourcentages pour les barres de progression
  const pct = (n: number) =>
    controles.length === 0 ? 0 : Math.round((n / controles.length) * 100);

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes grow { from{width:0} to{width:var(--w)} }

        .pg-root { min-height:100vh; background:${T.bg}; font-family:${T.font}; display:flex; }
        .pg-main { margin-left:260px; flex:1; padding:1.5rem; padding-top:calc(52px + 1.5rem); display:flex; flex-direction:column; gap:12px; }

        /* Header */
        .pg-header { display:flex; align-items:center; justify-content:space-between; }
        .pg-title  { font-size:20px; font-weight:800; color:${T.textPrimary}; }
        .pg-sub    { font-size:12px; color:${T.textLight}; margin-top:2px; display:flex; align-items:center; gap:6px; }

        /* Stats */
        .stats-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
        .stat-card {
          background:${T.surface}; border:0.5px solid ${T.border};
          border-radius:${T.radiusLg}; padding:12px 14px;
          display:flex; align-items:center; gap:10px;
        }
        .stat-icon { width:34px; height:34px; border-radius:8px; background:${T.accentLight}; border:0.5px solid ${T.borderMid}; display:flex; align-items:center; justify-content:center; color:${T.accentDark}; font-size:16px; flex-shrink:0; }
        .stat-val  { font-size:20px; font-weight:800; color:${T.textPrimary}; line-height:1; }
        .stat-lbl  { font-size:10px; color:${T.textLight}; margin-top:3px; font-weight:600; text-transform:uppercase; letter-spacing:.6px; }
        
        .progress-track { height:4px; background:${T.bg}; border-radius:99px; overflow:hidden; margin-top:6px; }
        .progress-fill  { height:100%; border-radius:99px; background:${T.accent}; animation:grow .8s ease forwards; }

        /* Badges */
        .li-badge { font-size:10px; font-weight:700; color:${T.accentDark}; background:${T.accentLight}; border:0.5px solid ${T.borderMid}; padding:2px 8px; border-radius:20px; flex-shrink:0; display:inline-flex; align-items:center; gap:4px; }
        .li-badge.yellow { color:${T.yellow}; background:${T.yellowLight}; border-color:${T.yellowBorder}; }
        .li-badge.new { animation: fadeUp .3s ease; }

        /* Filters */
        .filter-btn {
          background:${T.surface}; border:0.5px solid ${T.border};
          border-radius:${T.radius}; padding:8px 12px;
          color:${T.textMuted}; font-size:12px; font-weight:600; font-family:${T.font};
          cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .12s;
        }
        .filter-btn:hover { background:${T.accentLight}; border-color:${T.borderMid}; color:${T.accentDark}; }
        .filter-btn.active { background:${T.accent}; border-color:${T.accent}; color:#fff; }
        .filter-btn.active .filter-count { background:rgba(255,255,255,.2); color:#fff; }
        .filter-count { background:${T.accentLight}; color:${T.accentDark}; border-radius:6px; padding:0px 6px; font-size:10px; font-weight:800; }

        /* Surfaces */
        .card-surface { background:${T.surface}; border:0.5px solid ${T.border}; border-radius:${T.radiusLg}; overflow:hidden; transition:border-color .15s, box-shadow .15s; }
        .card-surface:hover { border-color:${T.borderMid}; box-shadow:0 2px 8px rgba(13,75,55,0.06); }

        /* Notification */
        .notif-banner {
          position:fixed; top:70px; right:24px;
          background:${T.surface}; border:0.5px solid ${T.borderMid}; border-radius:${T.radiusLg};
          padding:12px 16px; display:flex; align-items:center; gap:10px;
          box-shadow:0 4px 12px rgba(13,75,55,0.08); z-index:1000; animation:fadeUp .3s ease; cursor:pointer;
        }

        /* Skeleton */
        .skeleton { background:linear-gradient(90deg,${T.bg} 25%,${T.border} 50%,${T.bg} 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }

        /* Grid */
        .grid-controles { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:10px; }
        
        /* Separator */
        .sep { border:none; border-top:0.5px solid ${T.border}; margin:8px 0; }
      `}</style>

      <div className="pg-root">
        <Sidebar stats={{ rendezvous: 0, consultations: 0, ordonnances: 0 }} />
        <Navbar title="Mes Contrôles" subtitle="Espace de suivi médical" />

        {/* NOTIFICATION */}
        {showNotification && (
          <div className="notif-banner" onClick={() => setShowNotification(false)}>
            <i className="ti ti-bell-ringing" style={{ fontSize: 18, color: T.accent }} aria-hidden="true" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>Nouveau contrôle reçu</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>Votre médecin vous a envoyé un contrôle.</div>
            </div>
            <i className="ti ti-x" style={{ fontSize: 14, color: T.textLight, marginLeft: 8 }} aria-hidden="true" />
          </div>
        )}

        <main className="pg-main">

          {/* HEADER */}
          <div className="pg-header" style={{ animation: "fadeUp .3s ease" }}>
            <div>
              <div className="pg-title">Mes contrôles médicaux</div>
              <div className="pg-sub">
                <span style={{ width:6, height:6, borderRadius:"50%", background:T.accent, display:"inline-block" }} />
                Synchronisation en direct active
              </div>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="stats-row" style={{ animation: "fadeUp .3s .07s ease backwards" }}>
            {[
              { label: "Total contrôles", value: controles.length, icon: "ti-clipboard-list", pct: 100, color: T.accent },
              { label: "Payés", value: totalPaye, icon: "ti-circle-check", pct: pct(totalPaye), color: T.accent },
              { label: "En attente", value: totalNonPaye, icon: "ti-clock", pct: pct(totalNonPaye), color: T.yellow },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon">
                  <i className={`ti ${s.icon}`} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div className="stat-val">{s.value}</div>
                      <div className="stat-lbl">{s.label}</div>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ "--w": `${s.pct}%`, background: s.color } as React.CSSProperties} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FILTRES */}
          <div style={{ display: "flex", gap: 8, animation: "fadeUp .3s .1s ease backwards" }}>
            {filters.map((f) => (
              <button
                key={f.key}
                className={`filter-btn${activeFilter === f.key ? " active" : ""}`}
                onClick={() => setActiveFilter(f.key)}
              >
                <i className={`ti ${f.icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
                {f.label}
                <span className="filter-count">{f.count}</span>
              </button>
            ))}
          </div>

          {/* CONTENU */}
          {loading ? (
            <div className="grid-controles">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-surface" style={{ padding: 14 }}>
                  <div className="skeleton" style={{ height: 14, width: "55%", marginBottom: 10 }} />
                  <div className="skeleton" style={{ height: 10, width: "35%", marginBottom: 14 }} />
                  <div className="skeleton" style={{ height: 24, width: "100%" }} />
                </div>
              ))}
            </div>
          ) : filteredControles.length === 0 ? (
            <div className="card-surface" style={{ animation: "fadeUp .3s ease" }}>
              <div style={{ textAlign: "center", padding: "3rem 1.5rem", color: T.textLight }}>
                <i className="ti ti-clipboard-list" style={{ fontSize: 28, color: T.border }} aria-hidden="true" />
                <p style={{ fontSize: 13, fontWeight: 600, margin: "8px 0 4px", color: T.textMuted }}>Aucun contrôle prévu</p>
                <p style={{ fontSize: 11, maxWidth: 260, margin: "0 auto" }}>
                  Lorsque votre médecin ajoutera un contrôle, il apparaîtra ici.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid-controles" style={{ animation: "fadeUp .3s .14s ease backwards" }}>
              {filteredControles.map((controle) => {
                const isPaye         = controle.statut_paiement === "paye";
                const isNewControl   = isNew(controle.created_at);
                const dateStr        = new Date(controle.date_controle).toLocaleDateString("fr-FR", {
                  weekday: "short", day: "numeric", month: "long", year: "numeric",
                });

                return (
                  <div key={controle.id} className="card-surface" style={{ borderColor: isNewControl ? T.borderMid : T.border }}>
                    <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      
                      {/* Header Row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                          <div className="stat-icon" style={{ width: 30, height: 30, fontSize: 14, borderRadius: 8 }}>
                            <i className={`ti ${getTypeIcon(controle.type_controle)}`} aria-hidden="true" />
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>
                                {getTypeLabel(controle.type_controle)}
                              </span>
                              {isNewControl && <span className="li-badge new">Nouveau</span>}
                            </div>
                            {controle.medecin_name && (
                              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                <i className="ti ti-stethoscope" style={{ fontSize: 11 }} aria-hidden="true" />
                                Dr. {controle.medecin_name}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <span className={`li-badge${isPaye ? "" : " yellow"}`}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: isPaye ? T.accent : T.yellow }}></span>
                          {isPaye ? "Payé" : "Non payé"}
                        </span>
                      </div>

                      <hr className="sep" />

                      {/* Date & Notes */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textMuted }}>
                          <i className="ti ti-calendar-event" style={{ fontSize: 13 }} aria-hidden="true" />
                          <span style={{ fontWeight: 600 }}>{dateStr}</span>
                        </div>

                        {controle.notes && (
                          <div style={{ 
                            fontSize: 11, color: T.textMuted, lineHeight: 1.5, 
                            padding: "8px 10px", background: T.bg, borderRadius: T.radius,
                            borderLeft: `2px solid ${T.accent}` 
                          }}>
                            <span style={{ fontWeight: 700, color: T.textPrimary, marginRight: 4 }}>Note :</span>
                            {controle.notes}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </PrivateRoute>
  );
}