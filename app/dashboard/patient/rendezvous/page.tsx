"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import api from "../../../../lib/api";
import PaiementBadge from "@/components/PaiementBadage";
import BoutonPaiement from "@/components/BoutonPaiement";

// ─────────────────────────────────────────────────────────────
// ICONS (SVG Components)
// ─────────────────────────────────────────────────────────────
const LucideIcon = ({
  path,
  size = 20,
  color = "currentColor",
}: {
  path: string;
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: path }}
  />
);

const iconPaths = {
  list: "<line x1='8' y1='6' x2='21' y2='6'></line><line x1='8' y1='12' x2='21' y2='12'></line><line x1='8' y1='18' x2='21' y2='18'></line><line x1='3' y1='6' x2='3.01' y2='6'></line><line x1='3' y1='12' x2='3.01' y2='12'></line><line x1='3' y1='18' x2='3.01' y2='18'></line>",
  calendar:
    "<rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line>",
  clock:
    "<circle cx='12' cy='12' r='10'></circle><polyline points='12 6 12 12 16 14'></polyline>",
  xCircle:
    "<circle cx='12' cy='12' r='10'></circle><line x1='15' y1='9' x2='9' y2='15'></line><line x1='9' y1='9' x2='15' y2='15'></line>",
  check: "<polyline points='20 6 9 17 4 12'></polyline>",
  play: "<polygon points='5 3 19 12 5 21 5 3'></polygon>",
  video:
    "<polygon points='23 7 16 12 23 17 23 7'></polygon><rect x='1' y='5' width='15' height='14' rx='2' ry='2'></rect>",
  stethoscope:
    "<path d='M11 4v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M18 8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M10 12v5a3 3 0 0 0 6 0v-1'></path><path d='M10 12h-1a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0z'></path>",
  fileText:
    "<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path><polyline points='14 2 14 8 20 8'></polyline><line x1='16' y1='13' x2='8' y2='13'></line><line x1='16' y1='17' x2='8' y2='17'></line><polyline points='10 9 9 9 8 9'></polyline>",
  hourglass:
    "<path d='M5 22h14'></path><path d='M5 2h14'></path><path d='M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22'></path><path d='M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2'></path>",
  clockIcon:
    "<circle cx='12' cy='12' r='10'></circle><polyline points='12 6 12 12 16 14'></polyline>",
  plus: "<line x1='12' y1='5' x2='12' y2='19'></line><line x1='5' y1='12' x2='19' y2='12'></line>",
};

// ─────────────────────────────────────────────────────────────
// INTERFACES & CONFIG
// ─────────────────────────────────────────────────────────────

interface PaiementInfo {
  montant_total: number;
  montant_avance: number;
  montant_restant: number;
  statut_avance: string;
  statut_restant: string;
  est_complet: boolean;
}

interface RendezVous {
  id: number;
  medecin_name: string;
  date_heure: string;
  status: string;
  motif?: string;
  type?: string;
  paiement_info?: PaiementInfo | null;
}

type FilterType = "tous" | "avenir" | "passe" | "annule";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; iconKey: string }
> = {
  en_attente: {
    label: "En attente",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    iconKey: "hourglass",
  },
  confirme: {
    label: "Confirmé",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    iconKey: "check",
  },
  annule: {
    label: "Annulé",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    iconKey: "xCircle",
  },
  termine: {
    label: "Terminé",
    color: "#475569",
    bg: "#F8FAFC",
    border: "#E2E8F0",
    iconKey: "check", // Check mark for finished
  },
  en_cours: {
    label: "En cours",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    iconKey: "play", // Play icon for active
  },
};

export default function PatientRendezVous() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("tous");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [stats, setStats] = useState({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = () => {
      api
        .get("rendezvous/")
        .then((r) => {
          const results = r.data.results || r.data;
          setData(results);
          setStats((prev) => ({ ...prev, rendezvous: results.length }));
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      api
        .get("consultations/")
        .then((r) =>
          setStats((prev) => ({
            ...prev,
            consultations: r.data.length ?? r.data.results?.length ?? 0,
          })),
        )
        .catch(() => {});

      api
        .get("ordonnances/")
        .then((r) =>
          setStats((prev) => ({
            ...prev,
            ordonnances: r.data.length ?? r.data.results?.length ?? 0,
          })),
        )
        .catch(() => {});
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [token, isLoading]);

  const handleCancel = async (rdvId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) return;
    setCancellingId(rdvId);
    try {
      await api.patch(`rendezvous/${rdvId}/`, { status: "annule" });
      setData((prev) =>
        prev.map((rdv) =>
          rdv.id === rdvId ? { ...rdv, status: "annule" } : rdv,
        ),
      );
    } catch {
      alert("Impossible d'annuler ce rendez-vous. Veuillez réessayer.");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredData = data
    .filter((rdv) => {
      const rdvDate = new Date(rdv.date_heure);
      rdvDate.setHours(0, 0, 0, 0);
      if (activeFilter === "avenir")
        return (
          rdvDate >= today &&
          rdv.status !== "termine" &&
          rdv.status !== "annule"
        );
      if (activeFilter === "passe")
        return rdvDate < today || rdv.status === "termine";
      if (activeFilter === "annule") return rdv.status === "annule";
      return true;
    })
    .sort((a, b) => {
      const diff =
        new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime();
      return activeFilter === "passe" || activeFilter === "annule"
        ? -diff
        : diff;
    });

  const filters: { key: FilterType; label: string; iconKey: string }[] = [
    { key: "tous", label: "Tous", iconKey: "list" },
    { key: "avenir", label: "À venir", iconKey: "calendar" },
    { key: "passe", label: "Passés", iconKey: "clock" },
    { key: "annule", label: "Annulés", iconKey: "xCircle" },
  ];

  const getStatusStyle = (status: string) =>
    statusConfig[status] ?? statusConfig.en_attente;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        .main-gradient-bg {
          background: linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 100%);
          min-height: 100vh;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .text-gradient {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .btn-gradient {
          background: linear-gradient(135deg, #8B5CF6, #06C98B);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 14px 28px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn-gradient:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(139, 92, 246, 0.45);
        }
        .filter-btn {
          padding: 10px 18px;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(0,0,0,0.06);
          background: rgba(255,255,255,0.6);
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-btn:hover {
          background: rgba(139, 92, 246, 0.05);
          color: #334155;
          border-color: rgba(139, 92, 246, 0.2);
        }
        .filter-btn.active {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.35);
        }
        .rdv-card {
          position: relative;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.04);
          border-radius: 22px;
          padding: 22px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .rdv-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px -10px rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.2);
        }
        .rdv-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 5px;
          background: linear-gradient(180deg, #8B5CF6, #10B981);
          border-radius: 5px 0 0 5px;
        }
        .action-secondary {
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #EF4444;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          padding: 6px 12px;
        }
        .action-secondary:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.4);
        }
        .action-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .type-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 6px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .type-online {
          background: rgba(37, 99, 235, 0.08);
          color: #2563EB;
          border: 1px solid rgba(37, 99, 235, 0.15);
        }
        .type-offline {
          background: rgba(16, 185, 129, 0.08);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.15);
        }
        .btn-join {
          background: linear-gradient(135deg, #2563EB, #7C3AED);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6;
        }
        .btn-join:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
        }
      `}</style>

      <div
        className="main-gradient-bg"
        style={{ display: "flex", fontFamily: "'DM Sans', sans-serif" }}
      >
        <Sidebar stats={stats} />
        <Navbar title="Mes Rendez-vous" subtitle="Suivi et planification" />

        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "2rem",
            paddingTop: "100px",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <h1
                className="text-gradient"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 32,
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                Mes Rendez-vous
              </h1>
              <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                {filteredData.length} rendez-vous trouvé
                {filteredData.length > 1 ? "s" : ""}
              </p>
            </div>
            <button
              className="btn-gradient"
              onClick={() =>
                router.push("/dashboard/patient/rendezvous/nouvelle")
              }
            >
              <LucideIcon path={iconPaths.plus} size={18} />
              Prendre rendez-vous
            </button>
          </div>

          {/* FILTERS */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            {filters.map((f) => (
              <button
                key={f.key}
                className={`filter-btn ${activeFilter === f.key ? "active" : ""}`}
                onClick={() => setActiveFilter(f.key)}
              >
                <LucideIcon path={iconPaths[f.iconKey]} size={14} />
                {f.label}
              </button>
            ))}
          </div>

          {/* CONTENT */}
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: 18,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="glass-card"
                  style={{
                    padding: 24,
                    animation:
                      "skeletonPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                >
                  <div style={{ display: "flex", gap: 16 }}>
                    <div
                      style={{
                        width: 65,
                        height: 70,
                        background: "#e2e8f0",
                        borderRadius: 16,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          height: 14,
                          background: "#e2e8f0",
                          borderRadius: 8,
                          width: "50%",
                          marginBottom: 12,
                        }}
                      />
                      <div
                        style={{
                          height: 12,
                          background: "#f1f5f9",
                          borderRadius: 6,
                          width: "70%",
                          marginBottom: 10,
                        }}
                      />
                      <div
                        style={{
                          height: 24,
                          background: "#f1f5f9",
                          borderRadius: 8,
                          width: "40%",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredData.length === 0 ? (
            <div
              className="glass-card"
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                animation: "fadeInUp 0.6s ease",
              }}
            >
              <div style={{ fontSize: 50, marginBottom: 16, color: "#CBD5E1" }}>
                <LucideIcon
                  path={iconPaths.calendar}
                  size={50}
                  color="#94a3b8"
                />
              </div>
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: 8,
                }}
              >
                Aucun rendez-vous
              </h3>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: 14,
                  maxWidth: 320,
                  margin: "0 auto",
                }}
              >
                {activeFilter === "tous"
                  ? "Vous n'avez pas encore de rendez-vous."
                  : `Aucun rendez-vous ${filters.find((f) => f.key === activeFilter)?.label.toLowerCase()}.`}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: 18,
              }}
            >
              {filteredData.map((rdv, i) => {
                const s = getStatusStyle(rdv.status);
                const rdvDate = new Date(rdv.date_heure);
                const isPast =
                  rdv.status === "termine" ||
                  rdv.status === "annule" ||
                  rdvDate < new Date();

                const isOnline =
                  rdv.type === "En ligne" || rdv.type === "Vidéo";
                const isActive = rdv.status === "en_cours";
                const p = rdv.paiement_info;

                return (
                  <div
                    key={rdv.id}
                    className="rdv-card"
                    style={{
                      animation: "fadeInUp 0.5s ease backwards",
                      animationDelay: `${i * 0.06}s`,
                    }}
                  >
                    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                      {/* Date Block */}
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #8B5CF611, #10B98111)",
                          borderRadius: 16,
                          padding: "12px 14px",
                          textAlign: "center",
                          minWidth: 64,
                          flexShrink: 0,
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'Syne', sans-serif",
                            fontSize: 20,
                            fontWeight: 800,
                            color: "#8B5CF6",
                            lineHeight: 1,
                            margin: 0,
                          }}
                        >
                          {rdvDate.toLocaleDateString("fr-FR", {
                            day: "numeric",
                          })}
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            color: "#64748b",
                            textTransform: "uppercase",
                            fontWeight: 700,
                            marginTop: 2,
                            marginBottom: 0,
                          }}
                        >
                          {rdvDate.toLocaleDateString("fr-FR", {
                            month: "short",
                          })}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#334155",
                            fontWeight: 600,
                            marginTop: 6,
                            paddingTop: 6,
                            borderTop: "1px solid rgba(139, 92, 246, 0.1)",
                            marginBottom: 0,
                          }}
                        >
                          <LucideIcon
                            path={iconPaths.clockIcon}
                            size={11}
                            color="#64748b"
                          />{" "}
                          {rdvDate.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Info Block */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 6,
                            gap: 8,
                          }}
                        >
                          <p
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: "#1e1b4b",
                              lineHeight: 1.3,
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Dr. {rdv.medecin_name || "Médecin"}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                              flexShrink: 0,
                            }}
                          >
                            <span
                              className={`type-badge ${isOnline ? "type-online" : "type-offline"}`}
                            >
                              <LucideIcon
                                path={
                                  isOnline
                                    ? iconPaths.video
                                    : iconPaths.stethoscope
                                }
                                size={10}
                                color="inherit"
                              />
                              {isOnline ? "Vidéo" : "Cabinet"}
                            </span>
                            <PaiementBadge paiementInfo={p} />
                          </div>
                        </div>

                        <p
                          style={{
                            fontSize: 13,
                            color: "#64748b",
                            margin: "0 0 10px 0",
                            lineHeight: 1.4,
                          }}
                        >
                          {rdv.motif || "Consultation générale"}
                        </p>

                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            color: s.color,
                            background: s.bg,
                            border: `1px solid ${s.border}`,
                            padding: "4px 10px",
                            borderRadius: 8,
                          }}
                        >
                          {isActive ? (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: s.color,
                                animation: "pulse 2s infinite",
                                display: "inline-block",
                              }}
                            />
                          ) : (
                            <LucideIcon
                              path={iconPaths[s.iconKey] || iconPaths.check}
                              size={12}
                              color={s.color}
                            />
                          )}
                          {s.label}
                        </div>
                      </div>
                    </div>

                    {/* SECTION PAIEMENT */}
                    {p && !p.est_complet && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: 14,
                          background: "rgba(139, 92, 246, 0.03)",
                          borderRadius: 14,
                          border: "1px dashed rgba(139, 92, 246, 0.15)",
                        }}
                      >
                        {p.statut_avance === "en_attente" && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                color: "#D97706",
                                fontWeight: 600,
                              }}
                            >
                              Avance requise : {p.montant_avance} TND
                            </span>
                            <BoutonPaiement
                              rdvId={rdv.id}
                              type="avance"
                              montant={p.montant_avance}
                            />
                          </div>
                        )}
                        {p.statut_avance === "paye" &&
                          p.statut_restant === "en_attente" &&
                          isPast && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  color: "#D97706",
                                  fontWeight: 600,
                                }}
                              >
                                Solde restant : {p.montant_restant} TND
                              </span>
                              <BoutonPaiement
                                rdvId={rdv.id}
                                type="restant"
                                montant={p.montant_restant}
                              />
                            </div>
                          )}
                        {p.statut_avance === "paye" &&
                          p.statut_restant === "en_attente" &&
                          !isPast && (
                            <p
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                                margin: 0,
                              }}
                            >
                              ✓ Avance payée — Le solde sera à payer après la
                              consultation.
                            </p>
                          )}
                      </div>
                    )}
                    {p && p.est_complet && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "10px 14px",
                          background: "rgba(16, 185, 129, 0.05)",
                          borderRadius: 14,
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 12,
                            color: "#059669",
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          <LucideIcon
                            path={iconPaths.check}
                            size={12}
                            color="#059669"
                            style={{ marginRight: 4 }}
                          />
                          Paiement complet effectué
                        </p>
                      </div>
                    )}

                    {/* FOOTER / ACTIONS */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        borderTop: "1px solid rgba(0,0,0,0.04)",
                        paddingTop: 16,
                        marginTop: 16,
                      }}
                    >
                      {!isPast && rdv.status !== "annule" && (
                        <button
                          className="action-secondary"
                          disabled={cancellingId === rdv.id}
                          onClick={() => handleCancel(rdv.id)}
                        >
                          {cancellingId === rdv.id
                            ? "Annulation..."
                            : "Annuler"}
                        </button>
                      )}

                      {isPast && rdv.status === "termine" && (
                        <button
                          onClick={() =>
                            router.push("/dashboard/patient/ordonnances")
                          }
                          style={{
                            background: "rgba(16, 185, 129, 0.08)",
                            border: "1px solid rgba(16, 185, 129, 0.15)",
                            borderRadius: 10,
                            padding: "8px 14px",
                            color: "#059669",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <LucideIcon
                            path={iconPaths.fileText}
                            size={12}
                            color="#059669"
                            style={{ marginRight: 4 }}
                          />
                          Compte-rendu
                        </button>
                      )}

                      {!isPast && isOnline && (
                        <button
                          className="btn-join"
                          onClick={() =>
                            router.push(
                              `/dashboard/patient/consultations/${rdv.id}`,
                            )
                          }
                        >
                          <LucideIcon path={iconPaths.video} size={14} />{" "}
                          Rejoindre la visio
                        </button>
                      )}

                      {!isPast && !isOnline && (
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/patient/rendezvous/${rdv.id}`,
                            )
                          }
                          style={{
                            background: "rgba(139, 92, 246, 0.08)",
                            border: "none",
                            borderRadius: 10,
                            padding: "8px 14px",
                            color: "#8B5CF6",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          Détails
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
