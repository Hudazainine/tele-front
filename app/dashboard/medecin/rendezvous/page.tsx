"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import api from "../../../../lib/api";
import dynamic from "next/dynamic";

// ─────────────────────────────────────────────────────────────
// IMPORTS LUCIDE ICONS
// ─────────────────────────────────────────────────────────────
import {
  List,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Video,
  CalendarX,
  CalendarCheck,
  Search,
  X,
} from "lucide-react";

const VideoCall = dynamic(() => import("@/components/VideoCall"), {
  ssr: false,
  loading: () => <p>Chargement de la vidéo...</p>,
});

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
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  en_attente: {
    label: "En attente",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    icon: Clock,
  },
  confirme: {
    label: "Confirmé",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    icon: CheckCircle,
  },
  annule: {
    label: "Annulé",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    icon: CalendarX,
  },
  termine: {
    label: "Terminé",
    color: "#475569",
    bg: "#F8FAFC",
    border: "#E2E8F0",
    icon: CalendarCheck,
  },
};

export default function MedecinRendezVous() {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("tous");
  const [activeVideoRdvId, setActiveVideoRdvId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
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

      let dateMatch = true;
      if (activeFilter === "aujourdhui")
        dateMatch = rdvDate.getTime() === today.getTime();
      else if (activeFilter === "avenir")
        dateMatch = rdvDate >= today && rdv.status !== "termine";
      else if (activeFilter === "passe")
        dateMatch = rdvDate < today || rdv.status === "termine";

      const searchMatch =
        rdv.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        rdv.motif?.toLowerCase().includes(search.toLowerCase());

      return dateMatch && searchMatch;
    })
    .sort(
      (a, b) =>
        new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime(),
    );

  const filters: { key: FilterType; label: string; icon: any }[] = [
    { key: "tous", label: "Tous", icon: List },
    { key: "aujourdhui", label: "Aujourd'hui", icon: MapPin },
    { key: "avenir", label: "À venir", icon: Calendar },
    { key: "passe", label: "Passés", icon: Clock },
  ];

  const getStatusStyle = (status: string) => {
    return statusConfig[status] || statusConfig.en_attente;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght:700;800&family=DM+Sans:wght:300;400;500;600&display=swap');
        
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
          background-clip: text;
          color: transparent;
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
          transform: translateY(-1px);
        }
        .filter-btn.active {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.35);
        }
        
        .search-container {
            background: white;
            border: 1px solid #EAE8F5;
            border-radius: 14px;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .search-container:focus-within {
            border-color: #8B5CF6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            color: #1e1b4b;
            outline: none;
        }
        .search-input::placeholder {
            color: #94a3b8;
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

          {/* CONTENEUR FLEX HORIZONTAL : Recherche + Filtres */}
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <div
              className="search-container"
              style={{ flex: 1, minWidth: "280px", marginBottom: 0 }}
            >
              <Search size={18} color="#94a3b8" />
              <input
                className="search-input"
                placeholder="Rechercher par patient, motif..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: 2,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 0,
              }}
            >
              {filters.map((f) => {
                const IconComponent = f.icon;
                return (
                  <button
                    key={f.key}
                    className={`filter-btn ${activeFilter === f.key ? "active" : ""}`}
                    onClick={() => setActiveFilter(f.key)}
                  >
                    <IconComponent size={16} strokeWidth={2.5} />
                    {f.label}
                  </button>
                );
              })}
            </div>
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
              <div style={{ fontSize: 50, marginBottom: 16, color: "#cbd5e1" }}>
                <CalendarX size={60} strokeWidth={1} />
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
                  maxWidth: 300,
                  margin: "0 auto",
                }}
              >
                {search
                  ? "Aucun résultat pour cette recherche."
                  : activeFilter !== "tous"
                    ? `Aucun rendez-vous ${filters.find((f) => f.key === activeFilter)?.label.toLowerCase()}.`
                    : "Votre planning est vide pour le moment."}
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
                const StatusIcon = s.icon;

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
                            <Clock size={14} color="#64748b" />
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
                        <StatusIcon size={12} />
                        {s.label}
                      </span>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => setActiveVideoRdvId(rdv.id)}
                          style={{
                            background:
                              "linear-gradient(135deg, #2563EB, #7C3AED)",
                            border: "none",
                            borderRadius: 10,
                            padding: "6px 12px",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Video size={14} />
                          Rejoindre
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
        {activeVideoRdvId && (
          <VideoCall
            channelName={`rdv-${activeVideoRdvId}`}
            rdvId={activeVideoRdvId}
            onEnd={() => setActiveVideoRdvId(null)}
            role="medecin"
          />
        )}
      </div>
    </>
  );
}
