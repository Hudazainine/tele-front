"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import PrivateRoute from "../../../../components/PrivateRoute";
import Navbar from "../../../../components/Navbar";
import api from "../../../../lib/api";
import {
  Calendar,
  Search,
  X,
  Check,
  User,
  Stethoscope,
  Clock,
  MoreHorizontal,
  Eye,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface RendezVous {
  id: number;
  patient: number;
  medecin: number;
  patient_name: string;
  medecin_name: string;
  date_heure: string;
  status: string;
}

const STATUSES = ["en attente", "confirmé", "annulé", "terminé"];

// ─── Dark Theme Design Tokens ──────────────────────────────────
const C = {
  bg: "#050a10",
  surface: "#131f2e",
  surfaceAlt: "#1e2a3d",
  border: "#2d456e",
  borderStrong: "#4a6080",
  text: "#f1f5f9",
  textSub: "#94a3b8",
  textMuted: "#64748b",

  teal: "#2dd4bf",
  tealLight: "rgba(45, 212, 191, 0.15)",
  tealDark: "#0f766e",

  violet: "#8b5cf6",
  violetLight: "rgba(139, 92, 246, 0.15)",

  sky: "#38bdf8",
  skyLight: "rgba(56, 189, 248, 0.15)",

  amber: "#fbbf24",
  amberLight: "rgba(251, 191, 36, 0.15)",

  red: "#f87171",
  redLight: "rgba(248, 113, 113, 0.15)",

  green: "#4ade80",
  greenLight: "rgba(74, 222, 128, 0.15)",
};

const statusMeta: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  "en attente": {
    label: "En attente",
    color: C.amber,
    bg: C.amberLight,
    icon: Clock,
  },
  confirmé: {
    label: "Confirmé",
    color: C.green,
    bg: C.greenLight,
    icon: CheckCircle,
  },
  annulé: { label: "Annulé", color: C.red, bg: C.redLight, icon: XCircle },
  terminé: { label: "Terminé", color: C.sky, bg: C.skyLight, icon: FileText },
};

export default function AdminRendezVous() {
  const { token, isLoading, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewing, setViewing] = useState<RendezVous | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = () =>
    api
      .get("rendezvous/")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    load();
  }, [token, isLoading]);

  if (isLoading) return null;

  const filtered = data.filter((r) => {
    const q = search.toLowerCase();
    const matchS =
      r.patient_name?.toLowerCase().includes(q) ||
      r.medecin_name?.toLowerCase().includes(q);
    const matchF = filter === "all" || r.status === filter;
    return matchS && matchF;
  });

  const toast_ = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const changeStatus = async (r: RendezVous, newStatus: string) => {
    try {
      await api.patch(`rendezvous/${r.id}/`, { status: newStatus });
      toast_(`Statut mis à jour : ${newStatus}`, true);
      if (viewing?.id === r.id) setViewing({ ...viewing, status: newStatus });
      load();
    } catch {
      toast_("Erreur de mise à jour.", false);
    }
  };

  const counts = STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: data.filter((r) => r.status === s).length }),
    {} as Record<string, number>,
  );

  return (
    <PrivateRoute allowedRoles={["admin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        @keyframes fadeUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(28px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes toastIn { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes shimmer { 0%,100% { opacity:1; } 50% { opacity:0.5; } }

        .panel {
          background: ${C.surface};
          border-radius: 16px;
          border: 1px solid ${C.border};
          box-shadow: 0 4px 6px rgba(0,0,0,0.2);
          padding: 1.4rem 1.6rem;
          animation: fadeUp 0.45s ease both;
        }

        .panel-title {
          font-size: 13px;
          font-weight: 700;
          color: ${C.text};
          letter-spacing: 0.02em;
          text-transform: uppercase;
          margin: 0 0 1.1rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .rdv-row {
          transition: background 0.15s;
          border-radius: 10px;
        }
        .rdv-row:hover { background: ${C.surfaceAlt}; }

        .filter-chip {
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
          font-family: inherit;
        }
        .filter-chip:hover { transform: translateY(-1px); }

        .search-input {
          padding: 11px 16px 11px 40px;
          border-radius: 10px;
          border: 1px solid ${C.border};
          background: ${C.surface};
          color: ${C.text};
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .search-input::placeholder { color: ${C.textMuted}; }
        .search-input:focus { border-color: ${C.sky}; box-shadow: 0 0 0 3px ${C.skyLight}; }

        .ia {
          width: 34px; height: 34px; border-radius: 9px; border: none;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 14px; transition: all .18s ease; background: ${C.surfaceAlt}; color: ${C.textSub};
        }
        .ia:hover { 
          transform: scale(1.08); 
          background: ${C.surface};
          border: 1px solid ${C.border};
          color: ${C.text};
        }

        .status-btn {
          padding: 8px 14px; border-radius: 10px; border: 1px solid;
          font-size: 12px; font-weight: 600; font-family: inherit; cursor: pointer;
          transition: all .2s ease; text-transform: capitalize;
        }
        .status-btn:hover { transform: translateY(-1px); }

        .bs {
          padding: 11px 20px; background: transparent; border: 1px solid ${C.border};
          border-radius: 11px; color: ${C.textSub}; font-size: 14px; font-family: inherit;
          cursor: pointer; transition: all .2s ease;
        }
        .bs:hover { border-color: ${C.borderStrong}; color: ${C.text}; background: ${C.surfaceAlt}; }

        .mo {
          position: fixed; inset: 0; background: rgba(5, 10, 16, 0.75);
          backdrop-filter: blur(6px); z-index: 999;
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn .2s ease;
        }
        .mb {
          background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 20px;
          padding: 2rem; width: 480px; max-width: 95vw;
          box-shadow: 0 32px 80px rgba(0,0,0,0.5);
          animation: slideUp .28s cubic-bezier(.34,1.56,.64,1);
        }

        .dt-skeleton {
          background: ${C.surfaceAlt}; border-radius: 6px; animation: shimmer 1.4s infinite;
        }

        .dt-table-wrap { border-radius: 16px; overflow: hidden; border: 1px solid ${C.border}; background: ${C.surface}; }
        .dt-table { width: 100%; border-collapse: collapse; }
        .dt-thead-tr { background: ${C.surfaceAlt}; }
        .dt-th {
          text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700;
          color: ${C.textMuted}; letter-spacing: 0.08em; text-transform: uppercase;
          border-bottom: 1px solid ${C.border};
        }
        .dt-row { border-bottom: 1px solid ${C.border}; transition: background 0.15s; }
        .dt-row:last-child { border-bottom: none; }
        .dt-row:hover { background: ${C.surfaceAlt}; }
        .dt-td { padding: 12px 16px; font-size: 13px; color: ${C.textSub}; vertical-align: middle; }
        .dt-empty { padding: 2.5rem 0; text-align: center; color: ${C.textMuted}; font-size: 13px; }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 12,
            background: toast.ok ? C.greenLight : C.redLight,
            border: `1px solid ${toast.ok ? C.green : C.red}44`,
            color: toast.ok ? C.green : C.red,
            fontSize: 13.5,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "toastIn .3s ease",
          }}
        >
          {toast.ok ? <Check size={18} /> : <X size={18} />} {toast.msg}
        </div>
      )}

      {/* Detail modal */}
      {viewing && (
        <div
          className="mo"
          onClick={(e) => e.target === e.currentTarget && setViewing(null)}
        >
          <div className="mb">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.sky,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Calendar size={12} /> Détail
                </div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: C.text,
                    fontFamily: "'Inter', sans-serif",
                    margin: 0,
                  }}
                >
                  Rendez-vous #{viewing.id}
                </h2>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="ia"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: "1.25rem",
              }}
            >
              {[
                {
                  label: "Patient",
                  value: viewing.patient_name,
                  icon: User,
                  color: C.teal,
                },
                {
                  label: "Médecin",
                  value: viewing.medecin_name,
                  icon: Stethoscope,
                  color: C.violet,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "12px 14px",
                    background: C.surfaceAlt,
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: C.textMuted,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div style={{ color: item.color }}>
                      <item.icon size={18} />
                    </div>
                    <span
                      style={{ fontSize: 13.5, color: C.text, fontWeight: 500 }}
                    >
                      {item.value || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "12px 14px",
                background: C.surfaceAlt,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.textMuted,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Date & Heure
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: C.text,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Calendar size={16} color={C.sky} />
                {viewing.date_heure
                  ? new Date(viewing.date_heure).toLocaleString("fr-FR", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })
                  : "—"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.textMuted,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Changer le statut
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATUSES.map((s) => {
                  const meta = statusMeta[s];
                  const active = viewing.status === s;
                  return (
                    <button
                      key={s}
                      className="status-btn"
                      onClick={() => !active && changeStatus(viewing, s)}
                      style={{
                        background: active ? meta.bg : "transparent",
                        color: active ? meta.color : C.textSub,
                        borderColor: active ? `${meta.color}44` : C.border,
                        opacity: active ? 1 : 0.8,
                        cursor: active ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <meta.icon size={12} /> {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <button
                className="bs"
                style={{ width: "100%" }}
                onClick={() => setViewing(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: C.bg,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Sidebar />
        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "5rem 2.4rem 3rem",
            overflowX: "hidden",
          }}
        >
          <Navbar
            title="Rendez-vous"
            subtitle={`Bonjour ${user?.username || "Admin"}`}
          />

          {/* Header */}
          <div
            style={{
              marginBottom: "1.6rem",
              animation: "fadeUp 0.35s ease both",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: C.sky,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Calendar size={14} /> Gestion
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: C.text,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Rendez-vous
            </h1>
            <p
              style={{
                color: C.textMuted,
                fontSize: 13,
                marginTop: 4,
                marginBottom: 0,
              }}
            >
              {loading ? "Chargement…" : `${data.length} rendez-vous au total`}
            </p>
          </div>

          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: "1.4rem",
              flexWrap: "wrap",
              animation: "fadeUp 0.4s ease both",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: C.textMuted,
                }}
              >
                <Search size={16} />
              </div>
              <input
                className="search-input"
                placeholder="Rechercher patient ou médecin…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="filter-chip"
              onClick={() => setFilter("all")}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: `1px solid ${filter === "all" ? C.sky + "55" : C.border}`,
                background: filter === "all" ? C.skyLight : C.surface,
                color: filter === "all" ? C.sky : C.textSub,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Tous ({data.length})
            </button>
            {STATUSES.map((s) => {
              const meta = statusMeta[s];
              const active = filter === s;
              return (
                <button
                  key={s}
                  className="filter-chip"
                  onClick={() => setFilter(s)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: `1px solid ${active ? meta.color + "55" : C.border}`,
                    background: active ? meta.bg : C.surface,
                    color: active ? meta.color : C.textSub,
                    fontSize: 13,
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  <meta.icon size={12} style={{ marginRight: 4 }} />{" "}
                  {meta.label} ({counts[s] || 0})
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div
            className="dt-table-wrap"
            style={{ animation: "fadeUp 0.45s ease both" }}
          >
            <table className="dt-table">
              <thead>
                <tr className="dt-thead-tr">
                  {[
                    "ID",
                    "Patient",
                    "Médecin",
                    "Date & Heure",
                    "Statut",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="dt-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="dt-empty">
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {[100, 160, 120].map((w, i) => (
                          <div
                            key={i}
                            className="dt-skeleton"
                            style={{ width: w, height: 14 }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="dt-empty">
                      Aucun rendez-vous trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const meta = statusMeta[r.status] || {
                      label: r.status,
                      color: C.violet,
                      bg: C.violetLight,
                      icon: AlertCircle,
                    };
                    return (
                      <tr key={r.id} className="dt-row">
                        <td className="dt-td">
                          <span
                            style={{
                              padding: "3px 10px",
                              background: C.skyLight,
                              border: `1px solid ${C.sky}33`,
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.sky,
                            }}
                          >
                            #{r.id}
                          </span>
                        </td>
                        <td className="dt-td">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: C.tealLight,
                                border: `1px solid ${C.teal}33`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: C.teal,
                              }}
                            >
                              <User size={16} />
                            </div>
                            <span
                              style={{
                                fontWeight: 500,
                                color: C.text,
                                fontSize: 13.5,
                              }}
                            >
                              {r.patient_name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="dt-td">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: C.violetLight,
                                border: `1px solid ${C.violet}33`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: C.violet,
                              }}
                            >
                              <Stethoscope size={16} />
                            </div>
                            <span style={{ color: C.textSub, fontSize: 13 }}>
                              {r.medecin_name || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="dt-td">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Calendar size={12} color={C.textMuted} />
                            {r.date_heure
                              ? new Date(r.date_heure).toLocaleString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </div>
                        </td>
                        <td className="dt-td">
                          <span
                            style={{
                              padding: "4px 12px",
                              background: meta.bg,
                              color: meta.color,
                              border: `1px solid ${meta.color}33`,
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              textTransform: "capitalize",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <meta.icon size={10} /> {meta.label}
                          </span>
                        </td>
                        <td className="dt-td">
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="ia"
                              title="Voir détails"
                              onClick={() => setViewing(r)}
                              style={{ color: C.sky }}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="ia"
                              title="Confirmer"
                              onClick={() => changeStatus(r, "confirmé")}
                              style={{
                                color: C.green,
                                opacity: r.status === "confirmé" ? 0.3 : 1,
                              }}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="ia"
                              title="Annuler"
                              onClick={() => changeStatus(r, "annulé")}
                              style={{
                                color: C.red,
                                opacity: r.status === "annulé" ? 0.3 : 1,
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary bar */}
          {!loading && data.length > 0 && (
            <div
              className="panel"
              style={{
                display: "flex",
                gap: 16,
                marginTop: 16,
                flexWrap: "wrap",
                animation: "fadeUp 0.5s ease both",
              }}
            >
              {[
                { label: "Total", value: data.length, color: C.sky },
                ...STATUSES.map((s) => ({
                  label: statusMeta[s].label,
                  value: counts[s] || 0,
                  color: statusMeta[s].color,
                })),
              ].map((s, i, arr) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    paddingRight: 16,
                    borderRight:
                      i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: s.color,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {s.value}
                  </span>
                  <span style={{ fontSize: 12, color: C.textMuted }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </PrivateRoute>
  );
}
