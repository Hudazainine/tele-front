"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import PrivateRoute from "../../../components/PrivateRoute";
import api from "../../../lib/api";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
  notifications: number;
}

interface RendezVousAPI {
  id: number;
  medecin_name: string;
  date_heure: string;
  status: string;
}

interface OrdonnanceAPI {
  id: number;
  medicaments: string;
  date: string;
}

interface NotificationAPI {
  id: number;
  message: string;
  lu: boolean;
}

interface UserMe {
  id: number;
  username: string;
  role: string;
}

// ─── ICONS (SVG Components) ───────────────────────────────────────────────────────
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
  calendar:
    "<rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line>",
  stethoscope:
    "<path d='M11 4v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M18 8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M10 12v5a3 3 0 0 0 6 0v-1'></path><path d='M10 12h-1a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0z'></path>",
  clipboard:
    "<path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'></path><rect x='8' y='2' width='8' height='4' rx='1' ry='1'></rect><path d='M9 14h6'></path><path d='M9 18h6'></path><path d='M9 10h6'></path>",
  user: "<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path><circle cx='12' cy='7' r='4'></circle>",
  pill: "<path d='M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z'></path><path d='M8.5 8.5l.01.01'></path>",
  bell: "<path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'></path><path d='M13.73 21a2 2 0 0 1-3.46 0'></path>",
  clock:
    "<circle cx='12' cy='12' r='10'></circle><polyline points='12 6 12 12 16 14'></polyline>",
  check: "<polyline points='20 6 9 17 4 12'></polyline>",
  calendarCheck:
    "<rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line><path d='M9 16l2 2 4-4'></path>",
  hand: "<path d='M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0'></path><path d='M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2'></path><path d='M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8'></path><path d='M18 8a2 2 0 1 1 4 0v4a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-4.5-2v-2'></path>",
  smile:
    "<circle cx='12' cy='12' r='10'></circle><path d='M8 14s1.5 2 4 2 4-2 4-2'></path><line x1='9' y1='9' x2='9.01' y2='9'></line><line x1='15' y1='9' x2='15.01' y2='9'></line>",
};

// ─── Composant principal ───────────────────────────────────────────────────────
export default function PatientDashboard() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
    notifications: 0,
  });
  const [prochainRdv, setProchainRdv] = useState<RendezVousAPI | null>(null);
  const [ordonnances, setOrdonnances] = useState<OrdonnanceAPI[]>([]);
  const [notifs, setNotifs] = useState<NotificationAPI[]>([]);
  const [username, setUsername] = useState<string>("");

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
      api.get("notifications/"),
      api.get("users/me/"),
    ])
      .then(([r, c, o, n, me]) => {
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
          notifications: n.data.length,
        });
        const rdvTrie = [...r.data].sort(
          (a: RendezVousAPI, b: RendezVousAPI) =>
            new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime(),
        );
        setProchainRdv(rdvTrie[0] || null);
        setOrdonnances(o.data.slice(0, 3));
        setNotifs(n.data.slice(0, 4));
        setUsername((me.data as UserMe).username);
      })
      .catch(() => {});
  }, [token, isLoading]);

  if (isLoading) return null;

  const cards = [
    {
      label: "Rendez-vous",
      value: stats.rendezvous,
      iconKey: "calendar",
      path: "/dashboard/patient/rendezvous",
    },
    {
      label: "Consultations",
      value: stats.consultations,
      iconKey: "stethoscope",
      path: "/dashboard/patient/consultations",
    },
    {
      label: "Ordonnances",
      value: stats.ordonnances,
      iconKey: "clipboard",
      path: "/dashboard/patient/ordonnances",
    },
  ];

  const quickActions = [
    {
      label: "Prendre RDV",
      iconKey: "calendar",
      path: "/dashboard/patient/rendezvous",
      desc: "Planifier une visite",
    },
    {
      label: "Consultations",
      iconKey: "stethoscope",
      path: "/dashboard/patient/consultations",
      desc: "Historique médical",
    },
    {
      label: "Ordonnances",
      iconKey: "clipboard",
      path: "/dashboard/patient/ordonnances",
      desc: "Traitements actifs",
    },
    {
      label: "Mon profil",
      iconKey: "user",
      path: "/dashboard/patient/profil",
      desc: "Paramètres du compte",
    },
  ];

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slowRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .light-premium-bg {
          background-color: #EFF6FF ;
          background-image: 
            radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%);
          min-height: 100vh;
        }

        .pro-card-light {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          box-shadow: 0 4px 20px -4px rgba(139, 92, 246, 0.06);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pro-card-light:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px -8px rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.2);
        }

        .stat-card-anim {
          animation: fadeInUp 0.6s ease backwards;
        }

        .text-gradient-mg {
          background: linear-gradient(135deg, #7C3AED, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .icon-gradient-bg {
          background: linear-gradient(135deg, #378ADD, #34D399);
          box-shadow: 0 6px 15px -3px rgba(139, 92, 246, 0.35);
        }

        .action-btn-light {
          background: white;
          border: 1px solid #F1F5F9;
          border-radius: 20px;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .action-btn-light:hover {
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 8px 20px -5px rgba(139, 92, 246, 0.12);
          transform: scale(1.02);
        }

        .rdv-card-light {
          background: linear-gradient(135deg, #378ADD, #059669);
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          box-shadow: 0 20px 40px -10px rgba(139, 92, 246, 0.3);
        }

        .glass-shape-light {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(4px);
        }

        /* Dégradé tournant subtil pour la carte RDV */
        .rdv-card-light::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.1) 10%, transparent 20%);
          animation: slowRotate 8s linear infinite;
        }
      `}</style>

      <div
        className="light-premium-bg"
        style={{ display: "flex", fontFamily: "'Inter', sans-serif" }}
      >
        <Sidebar
          stats={{
            rendezvous: stats.rendezvous,
            consultations: stats.consultations,
            ordonnances: stats.ordonnances,
            notifications: stats.notifications,
          }}
        />
        <Navbar title="Mon espace santé" subtitle={`Bonjour ${username}`} />

        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "2rem",
            paddingTop: "calc(70px + 2rem)",
          }}
        >
          {/* LIGNE 1 : Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              marginBottom: 28,
            }}
          >
            {cards.map((c, i) => (
              <div
                key={c.label}
                className="pro-card-light stat-card-anim"
                onClick={() => router.push(c.path)}
                style={{
                  padding: "1.75rem",
                  cursor: "pointer",
                  animationDelay: `${i * 0.1}s`,
                }}
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
                        fontSize: 13,
                        color: "#64748B",
                        marginBottom: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {c.label}
                    </p>
                    <p
                      className="text-gradient-mg"
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 42,
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      {c.value}
                    </p>
                  </div>
                  <div
                    className="icon-gradient-bg"
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <LucideIcon
                      path={iconPaths[c.iconKey]}
                      size={24}
                      color="white"
                    />
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 4,
                      borderRadius: 2,
                      background: "linear-gradient(90deg, #378ADD, #10B981)",
                    }}
                  ></div>
                  <p
                    style={{ fontSize: 13, fontWeight: 600, color: "#7C3AED" }}
                  >
                    Voir les détails
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* LIGNE 2 : Prochain RDV + Ordonnances (Structure 60/40) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 24,
              marginBottom: 28,
            }}
          >
            {/* Prochain RDV */}
            <div
              className="rdv-card-light"
              style={{ padding: 32, color: "white" }}
            >
              <div
                className="glass-shape-light"
                style={{
                  position: "absolute",
                  top: -40,
                  right: -40,
                  width: 180,
                  height: 180,
                  borderRadius: "50%",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 28,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    opacity: 0.9,
                  }}
                >
                  Prochain rendez-vous
                </p>
                {prochainRdv && (
                  <span
                    className="glass-shape-light"
                    style={{
                      color: "#fff",
                      fontSize: 12,
                      padding: "6px 16px",
                      borderRadius: 30,
                      fontWeight: 800,
                    }}
                  >
                    {prochainRdv.status === "confirmé"
                      ? "✓ Confirmé"
                      : "En attente"}
                  </span>
                )}
              </div>

              {prochainRdv ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 24 }}
                  >
                    <div
                      className="glass-shape-light"
                      style={{
                        borderRadius: 20,
                        padding: "18px 24px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 40,
                          fontWeight: 800,
                          lineHeight: 1,
                          color: "white",
                        }}
                      >
                        {new Date(prochainRdv.date_heure).getDate()}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          opacity: 1,
                          marginTop: 4,
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.9)",
                          fontWeight: 700,
                        }}
                      >
                        {new Date(prochainRdv.date_heure).toLocaleDateString(
                          "fr-FR",
                          { month: "long" },
                        )}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 22,
                          fontWeight: 800,
                          marginBottom: 8,
                          color: "white",
                        }}
                      >
                        Dr. {prochainRdv.medecin_name}
                      </p>
                      <p
                        style={{
                          fontSize: 15,
                          opacity: 0.9,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: "white",
                          fontWeight: 600,
                        }}
                      >
                        <LucideIcon
                          path={iconPaths.clock}
                          size={15}
                          color="white"
                        />{" "}
                        {new Date(prochainRdv.date_heure).toLocaleTimeString(
                          "fr-FR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/patient/rendezvous")}
                    style={{
                      background: "white",
                      color: "#7C3AED",
                      border: "none",
                      borderRadius: 16,
                      padding: "14px 32px",
                      fontSize: 15,
                      fontWeight: 800,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    Gérer le RDV
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem 0",
                    opacity: 0.95,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>
                    <LucideIcon
                      path={iconPaths.calendarCheck}
                      size={48}
                      color="rgba(255,255,255,0.7)"
                    />
                  </div>
                  <p
                    style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}
                  >
                    Aucun rendez-vous prévu
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/patient/rendezvous")}
                    className="glass-shape-light"
                    style={{
                      color: "white",
                      padding: "12px 28px",
                      fontSize: 14,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontWeight: 700,
                      borderRadius: 14,
                      border: "none",
                      background: "transparent",
                    }}
                  >
                    Prendre un RDV
                  </button>
                </div>
              )}
            </div>

            {/* Ordonnances actives */}
            <div className="pro-card-light" style={{ padding: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#0F172A",
                    margin: 0,
                  }}
                >
                  Ordonnances actives
                </h2>
                <span
                  className="text-gradient-mg"
                  style={{ fontSize: 13, cursor: "pointer", fontWeight: 800 }}
                  onClick={() => router.push("/dashboard/patient/ordonnances")}
                >
                  Voir tout →
                </span>
              </div>
              {ordonnances.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem 0",
                    color: "#94A3B8",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>
                    <LucideIcon
                      path={iconPaths.pill}
                      size={36}
                      color="#CBD5E1"
                    />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>
                    Aucune ordonnance
                  </p>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {ordonnances.map((o) => (
                    <div
                      key={o.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "16px",
                        background: "#F8FAFC",
                        borderRadius: 18,
                        border: "1px solid #F1F5F9",
                        transition: "0.2s",
                      }}
                    >
                      <div
                        className="icon-gradient-bg"
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 14,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                        }}
                      >
                        <LucideIcon
                          path={iconPaths.pill}
                          size={20}
                          color="white"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#0F172A",
                            margin: 0,
                          }}
                        >
                          {o.medicaments}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#64748B",
                            marginTop: 4,
                            margin: 0,
                          }}
                        >
                          {o.date
                            ? new Date(o.date).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LIGNE 3 : Actions rapides + Notifications (Structure 40/60) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "0.8fr 1.2fr",
              gap: 24,
            }}
          >
            {/* Actions rapides */}
            <div className="pro-card-light" style={{ padding: 28 }}>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#0F172A",
                  marginBottom: 24,
                }}
              >
                Actions rapides
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    className="action-btn-light"
                    onClick={() => router.push(a.path)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      padding: "22px 16px",
                      fontFamily: "inherit",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background:
                          "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(16,185,129,0.1))",
                        border: "1px solid rgba(139, 92, 246, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LucideIcon
                        path={iconPaths[a.iconKey]}
                        size={22}
                        color="#378ADD"
                      />
                    </div>
                    <div>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0F172A",
                          display: "block",
                        }}
                      >
                        {a.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: "#94A3B8",
                          display: "block",
                          marginTop: 4,
                        }}
                      >
                        {a.desc}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="pro-card-light" style={{ padding: 28 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#0F172A",
                    margin: 0,
                  }}
                >
                  Notifications
                </h2>
                {stats.notifications > 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontWeight: 800,
                      background:
                        "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(16,185,129,0.1))",
                      border: "1px solid rgba(139, 92, 246, 0.2)",
                      color: "#7C3AED",
                    }}
                  >
                    {stats.notifications} nouvelles
                  </span>
                )}
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {notifs.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "3rem 0",
                      color: "#94A3B8",
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 12 }}>
                      <LucideIcon
                        path={iconPaths.bell}
                        size={36}
                        color="#CBD5E1"
                      />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>
                      Aucune notification
                    </p>
                  </div>
                ) : (
                  notifs.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 16,
                        padding: "16px",
                        background: n.lu
                          ? "#F8FAFC"
                          : "rgba(139, 92, 246, 0.04)",
                        borderRadius: 16,
                        border: n.lu
                          ? "1px solid #F1F5F9"
                          : "1px solid rgba(139, 92, 246, 0.15)",
                        transition: "0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: n.lu
                            ? "#E2E8F0"
                            : "linear-gradient(135deg, #378ADD, #10B981)",
                          marginTop: 4,
                          flexShrink: 0,
                          boxShadow: n.lu
                            ? "none"
                            : "0 0 10px rgba(139, 92, 246, 0.4)",
                        }}
                      />
                      <p
                        style={{
                          fontSize: 14,
                          color: n.lu ? "#64748B" : "#0F172A",
                          lineHeight: 1.5,
                          fontWeight: n.lu ? 400 : 600,
                          margin: 0,
                        }}
                      >
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
