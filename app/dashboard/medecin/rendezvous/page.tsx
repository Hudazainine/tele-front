"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import api from "../../../../lib/api";

interface RendezVous {
  id: number;
  patient_name: string;
  date_heure: string;
  status: string;
  motif?: string;
}

type FilterType = "tous" | "aujourdhui" | "avenir" | "passe";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  en_attente: {
    label: "En attente",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  confirme: {
    label: "Confirmé",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  annule: {
    label: "Annulé",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  termine: {
    label: "Terminé",
    color: "#475569",
    bg: "#F8FAFC",
    border: "#E2E8F0",
  },
};

export default function MedecinRendezVous() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("tous");
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
          setData(r.data);
          setStats((prev) => ({ ...prev, rendezvous: r.data.length }));
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      api
        .get("consultations/")
        .then((r) =>
          setStats((prev) => ({ ...prev, consultations: r.data.length })),
        )
        .catch(() => {});
      api
        .get("ordonnances/")
        .then((r) =>
          setStats((prev) => ({ ...prev, ordonnances: r.data.length })),
        )
        .catch(() => {});
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [token, isLoading]);

  if (isLoading) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredData = data
    .filter((rdv) => {
      const rdvDate = new Date(rdv.date_heure);
      rdvDate.setHours(0, 0, 0, 0);

      if (activeFilter === "aujourdhui")
        return rdvDate.getTime() === today.getTime();
      if (activeFilter === "avenir")
        return rdvDate >= today && rdv.status !== "termine";
      if (activeFilter === "passe")
        return rdvDate < today || rdv.status === "termine";
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime(),
    );

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: "tous", label: "Tous", icon: "📋" },
    { key: "aujourdhui", label: "Aujourd'hui", icon: "📌" },
    { key: "avenir", label: "À venir", icon: "📅" },
    { key: "passe", label: "Passés", icon: "⏳" },
  ];

  const getStatusStyle = (status: string) => {
    return statusConfig[status] || statusConfig.en_attente;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
          transition: all 0.3s ease;
        }
        
        .glass-card:hover {
          box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.12);
          border-color: rgba(139, 92, 246, 0.2);
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
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
          background: white;
          border: 1px solid rgba(0,0,0,0.04);
          border-radius: 22px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          cursor: pointer;
        }
        
        .rdv-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px -10px rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.2);
        }
        
        .rdv-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 5px;
          background: linear-gradient(180deg, #8B5CF6, #10B981);
          border-radius: 5px 0 0 5px;
        }
      `}</style>

      <div
        className="main-gradient-bg"
        style={{
          marginLeft: 240,
          display: "flex",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Sidebar stats={stats} />
        <Navbar title="Rendez-vous" subtitle="Planification et suivi" />

        <main style={{ flex: 1, padding: "2rem", paddingTop: "100px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
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
                {filteredData.length} rendez-vous
                {filteredData.length > 1 ? "s" : ""}
                {activeFilter !== "tous"
                  ? ` (${filters.find((f) => f.key === activeFilter)?.label})`
                  : ""}
              </p>
            </div>
          </div>

          {/* Filters */}
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
                <span>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="glass-card"
                  style={{
                    padding: 20,
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                >
                  <div
                    style={{
                      height: 16,
                      background: "#e2e8f0",
                      borderRadius: 8,
                      width: "60%",
                      marginBottom: 12,
                    }}
                  ></div>
                  <div
                    style={{
                      height: 12,
                      background: "#f1f5f9",
                      borderRadius: 6,
                      width: "40%",
                      marginBottom: 20,
                    }}
                  ></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div
                      style={{
                        height: 30,
                        background: "#f1f5f9",
                        borderRadius: 8,
                        width: 60,
                      }}
                    ></div>
                    <div
                      style={{
                        height: 30,
                        background: "#f1f5f9",
                        borderRadius: 8,
                        width: 80,
                      }}
                    ></div>
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
              <div style={{ fontSize: 50, marginBottom: 16 }}>📅</div>
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
                  maxWidth: 300,
                  margin: "0 auto",
                }}
              >
                {activeFilter === "tous"
                  ? "Votre planning est vide pour le moment."
                  : `Aucun rendez-vous ${filters.find((f) => f.key === activeFilter)?.label.toLowerCase()}.`}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 16,
              }}
            >
              {filteredData.map((rdv, i) => {
                const s = getStatusStyle(rdv.status);
                const rdvDate = new Date(rdv.date_heure);
                const isToday = rdvDate.toDateString() === today.toDateString();

                return (
                  <div
                    key={rdv.id}
                    className="rdv-card"
                    style={{
                      animation: `fadeInUp 0.5s ease backwards`,
                      animationDelay: `${i * 0.05}s`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        {/* Date/Time Block */}
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, #8B5CF611, #10B98111)",
                            borderRadius: 14,
                            padding: "10px 14px",
                            textAlign: "center",
                            minWidth: 60,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "'Syne', sans-serif",
                              fontSize: 18,
                              fontWeight: 800,
                              color: "#8B5CF6",
                              lineHeight: 1,
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
                            }}
                          >
                            {rdvDate.toLocaleDateString("fr-FR", {
                              month: "short",
                            })}
                          </p>
                        </div>

                        <div>
                          <p
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#1e1b4b",
                              marginBottom: 2,
                            }}
                          >
                            {rdv.patient_name || "Patient"}
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#64748b",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            🕐{" "}
                            {rdvDate.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {isToday && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "#059669",
                                  background: "#ECFDF5",
                                  padding: "2px 6px",
                                  borderRadius: 6,
                                  marginLeft: 4,
                                }}
                              >
                                Aujourd'hui
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Status + Actions */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: s.color,
                          background: s.bg,
                          border: `1px solid ${s.border}`,
                          padding: "5px 12px",
                          borderRadius: 10,
                          textTransform: "capitalize",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: s.color,
                          }}
                        ></span>
                        {s.label}
                      </span>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() =>
                            router.push("/dashboard/medecin/consultations")
                          }
                          style={{
                            background: "rgba(139, 92, 246, 0.08)",
                            border: "none",
                            borderRadius: 10,
                            padding: "6px 12px",
                            color: "#8B5CF6",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            fontFamily: "inherit",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(139, 92, 246, 0.15)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(139, 92, 246, 0.08)")
                          }
                        >
                          Consulter
                        </button>
                      </div>
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
