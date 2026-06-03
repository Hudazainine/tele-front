"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import PrivateRoute from "../../../components/PrivateRoute";
import api from "../../../lib/api";

interface Stats {
  patients: number;
  rendezvous: number;
  consultations: number;
  ordonnances: number;
}
interface RendezVousAPI {
  id: number;
  patient_name: string;
  date_heure: string;
  status: string;
}
interface NotificationAPI {
  id: number;
  message: string;
  lu: boolean;
}

export default function MedecinDashboard() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    patients: 0,
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });
  const [prochainRdv, setProchainRdv] = useState<RendezVousAPI | null>(null);
  const [notifs, setNotifs] = useState<NotificationAPI[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([
      api.get("patients/"),
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("ordonnances/"),
      api.get("notifications/"),
    ])
      .then(([p, r, c, o, n]) => {
        setStats({
          patients: p.data.length,
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
        });
        const sorted = [...r.data].sort(
          (a: RendezVousAPI, b: RendezVousAPI) =>
            new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime(),
        );
        setProchainRdv(sorted[0] || null);
        setNotifs(n.data.slice(0, 4));
      })
      .catch(() => {});
  }, [token, isLoading]);

  if (isLoading) return null;

  const cards = [
    {
      label: "Mes patients",
      value: stats.patients,
      icon: "👥",
      path: "/dashboard/medecin/rendezvous",
    },
    {
      label: "Rendez-vous",
      value: stats.rendezvous,
      icon: "📅",
      path: "/dashboard/medecin/rendezvous",
    },
    {
      label: "Consultations",
      value: stats.consultations,
      icon: "🩺",
      path: "/dashboard/medecin/consultations",
    },
    {
      label: "Ordonnances",
      value: stats.ordonnances,
      icon: "📋",
      path: "/dashboard/medecin/ordonnances",
    },
  ];

  const quickActions = [
    {
      label: "Mes rendez-vous",
      icon: "📅",
      path: "/dashboard/medecin/rendezvous",
    },
    {
      label: "Consultations",
      icon: "🩺",
      path: "/dashboard/medecin/consultations",
    },
    {
      label: "Ordonnances",
      icon: "📋",
      path: "/dashboard/medecin/ordonnances",
    },
    { label: "Mon profil", icon: "👤", path: "/dashboard/medecin/profil" },
  ];

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .main-gradient-bg {
          background: linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 100%);
          min-height: 100vh;
        }

        .stat-card {
          position: relative;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          padding: 1.5rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          cursor: pointer;
          animation: fadeInUp 0.6s ease backwards;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }

        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px -12px rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.4);
        }

        .text-gradient {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .action-btn {
          position: relative;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 18px;
          padding: 18px;
          transition: all 0.3s ease;
          overflow: hidden;
          cursor: pointer;
          z-index: 1;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .action-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #8B5CF611, #10B98111);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .action-btn:hover {
          border-color: #8B5CF655;
          box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.15);
          transform: translateY(-4px);
        }

        .action-btn:hover::after { opacity: 1; }
      `}</style>

      <div
        className="main-gradient-bg"
        style={{ display: "flex", fontFamily: "'DM Sans', sans-serif" }}
      >
        <Sidebar
          stats={{
            rendezvous: stats.rendezvous,
            consultations: stats.consultations,
            ordonnances: stats.ordonnances,
          }}
        />
        <Navbar
          title="Dashboard Médecin"
          subtitle={`Bonjour  ${username} 👋`}
        />

        <main
          style={{
            flex: 1,
            marginLeft: 240,
            padding: "2rem",
            paddingTop: "100px",
          }}
        >
          {/* Stat Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 20,
              marginBottom: 28,
            }}
          >
            {cards.map((c, i) => (
              <div
                key={c.label}
                className="stat-card"
                onClick={() => router.push(c.path)}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#64748b",
                        marginBottom: 8,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: ".5px",
                      }}
                    >
                      {c.label}
                    </p>
                    <p
                      className="text-gradient"
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 40,
                        fontWeight: 800,
                        lineHeight: 1,
                        marginBottom: 12,
                      }}
                    >
                      {c.value}
                    </p>
                  </div>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      color: "white",
                      boxShadow: "0 8px 16px -4px rgba(139, 92, 246, 0.4)",
                    }}
                  >
                    {c.icon}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 4,
                      borderRadius: 2,
                      background: "linear-gradient(90deg, #8B5CF6, #10B981)",
                    }}
                  ></div>
                  <p
                    className="text-gradient"
                    style={{ fontSize: 12, fontWeight: 700 }}
                  >
                    Voir tout
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Prochain RDV + Notifications */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 20,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #06C98B)",
                borderRadius: 28,
                padding: 28,
                color: "white",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 20px 40px -10px rgba(139, 92, 246, 0.5)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -40,
                  left: -20,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                }}
              />

              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  opacity: 0.9,
                  marginBottom: 20,
                }}
              >
                Prochain rendez-vous
              </p>

              {prochainRdv ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      marginBottom: 24,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.4)",
                        borderRadius: 18,
                        padding: "14px 20px",
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 34,
                          fontWeight: 800,
                          lineHeight: 1,
                          color: "white",
                        }}
                      >
                        {new Date(prochainRdv.date_heure).getDate()}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          opacity: 1,
                          marginTop: 2,
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.9)",
                        }}
                      >
                        {new Date(prochainRdv.date_heure).toLocaleDateString(
                          "fr-FR",
                          { month: "short" },
                        )}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 19,
                          fontWeight: 700,
                          marginBottom: 6,
                          color: "white",
                        }}
                      >
                        {prochainRdv.patient_name || "Patient"}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          opacity: 0.95,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "white",
                        }}
                      >
                        🕐{" "}
                        {new Date(prochainRdv.date_heure).toLocaleTimeString(
                          "fr-FR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </p>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 8,
                          fontSize: 11,
                          padding: "4px 14px",
                          borderRadius: 20,
                          background: "rgba(255,255,255,0.25)",
                          border: "1px solid rgba(255,255,255,0.4)",
                          fontWeight: 700,
                          textTransform: "capitalize",
                          color: "white",
                        }}
                      >
                        {prochainRdv.status || "en attente"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/medecin/rendezvous")}
                    style={{
                      background: "white",
                      color: "#8B5CF6",
                      border: "none",
                      borderRadius: 12,
                      padding: "12px 28px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                      transition: "transform 0.2s",
                      position: "relative",
                      zIndex: 1,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    Voir détails
                  </button>
                </>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem 0",
                    opacity: 0.95,
                  }}
                >
                  <p style={{ fontSize: 40, marginBottom: 10 }}>📅</p>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>
                    Aucun rendez-vous prévu
                  </p>
                </div>
              )}
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.75)",
                backdropFilter: "blur(12px)",
                borderRadius: 28,
                padding: 24,
                border: "1px solid rgba(255,255,255,0.9)",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#1e1b4b",
                    margin: 0,
                  }}
                >
                  Notifications
                </h2>
                <span
                  className="text-gradient"
                  style={{ fontSize: 12, cursor: "pointer", fontWeight: 700 }}
                >
                  Voir tout →
                </span>
              </div>
              {notifs.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem 0",
                    color: "#94a3b8",
                  }}
                >
                  <p style={{ fontSize: 24, marginBottom: 8 }}>🔔</p>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>
                    Aucune notification
                  </p>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {notifs.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "14px",
                        background: n.lu
                          ? "transparent"
                          : "rgba(139, 92, 246, 0.06)",
                        borderRadius: 14,
                        border: n.lu
                          ? "1px solid transparent"
                          : "1px solid rgba(139, 92, 246, 0.15)",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: n.lu
                            ? "#e2e8f0"
                            : "linear-gradient(135deg, #8B5CF6, #10B981)",
                          marginTop: 4,
                          flexShrink: 0,
                          boxShadow: n.lu
                            ? "none"
                            : "0 0 10px rgba(139, 92, 246, 0.6)",
                        }}
                      />
                      <p
                        style={{
                          fontSize: 13,
                          color: n.lu ? "#94a3b8" : "#334155",
                          lineHeight: 1.5,
                          fontWeight: n.lu ? 400 : 600,
                        }}
                      >
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              borderRadius: 28,
              padding: 24,
              border: "1px solid rgba(255,255,255,0.9)",
            }}
          >
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: "#1e1b4b",
                marginBottom: 20,
              }}
            >
              Actions rapides
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
              }}
            >
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  className="action-btn"
                  onClick={() => router.push(a.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                      color: "white",
                      boxShadow: "0 4px 10px rgba(139, 92, 246, 0.3)",
                    }}
                  >
                    {a.icon}
                  </div>
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}
                  >
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
