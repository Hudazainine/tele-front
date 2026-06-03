"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import api from "../../../../lib/api";
import { darkTableCSS } from "../../../../lib/shared-table-styles";

interface RendezVous {
  id: number;
  patient: number;
  medecin: number;
  patient_name: string;
  medecin_name: string;
  date_heure: string;
  status: string;
}

const ACCENT = "#38bdf8";
const STATUSES = ["en attente", "confirmé", "annulé", "terminé"];

const statusCfg = (s: string) => {
  if (s === "confirmé")
    return {
      bg: "rgba(34,211,165,.12)",
      color: "#22d3a5",
      border: "rgba(34,211,165,.25)",
    };
  if (s === "annulé")
    return {
      bg: "rgba(248,113,113,.12)",
      color: "#f87171",
      border: "rgba(248,113,113,.25)",
    };
  if (s === "terminé")
    return {
      bg: "rgba(167,139,250,.12)",
      color: "#a78bfa",
      border: "rgba(167,139,250,.25)",
    };
  return {
    bg: "rgba(56,189,248,.12)",
    color: "#38bdf8",
    border: "rgba(56,189,248,.25)",
  };
};

const css = `
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes toastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
  .mo { position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);z-index:999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease }
  .mb { background:linear-gradient(145deg,#131f2e,#1a2a3f);border:1px solid #2a3f5a;border-radius:24px;padding:2rem;width:480px;max-width:95vw;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .28s cubic-bezier(.34,1.56,.64,1) }
  .ia { width:34px;height:34px;border-radius:9px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .18s }
  .ia:hover{transform:scale(1.1)}
  .bs { padding:11px 20px;background:transparent;border:1px solid #1e3050;border-radius:11px;color:#8ba0c0;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s }
  .bs:hover{border-color:#2a4060;color:#c8d8f0}
  .status-btn { padding:8px 14px;border-radius:10px;border:1px solid;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s }
  .status-btn:hover{transform:translateY(-1px)}
`;

export default function AdminRendezVous() {
  const { token, isLoading } = useAuth();
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
    <>
      <style>{darkTableCSS + css}</style>

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: 12,
            background: toast.ok
              ? "rgba(34,211,165,.15)"
              : "rgba(248,113,113,.15)",
            border: `1px solid ${toast.ok ? "rgba(34,211,165,.3)" : "rgba(248,113,113,.3)"}`,
            color: toast.ok ? "#22d3a5" : "#f87171",
            fontSize: 13.5,
            fontWeight: 600,
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: "0 8px 24px rgba(0,0,0,.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "toastIn .3s ease",
          }}
        >
          {toast.ok ? "✓" : "✕"} {toast.msg}
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
                    color: ACCENT,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    marginBottom: 4,
                  }}
                >
                  📅 Détail
                </div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#f0f4ff",
                    fontFamily: "'Syne',sans-serif",
                    margin: 0,
                  }}
                >
                  Rendez-vous #{viewing.id}
                </h2>
              </div>
              <button
                onClick={() => setViewing(null)}
                style={{
                  background: "rgba(255,255,255,.06)",
                  border: "1px solid #1e3050",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  color: "#8ba0c0",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {/* Info grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: "1.25rem",
              }}
            >
              {[
                { label: "Patient", value: viewing.patient_name, icon: "🧑" },
                { label: "Médecin", value: viewing.medecin_name, icon: "⚕️" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "12px 14px",
                    background: "#0d1520",
                    borderRadius: 12,
                    border: "1px solid #1e3050",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: "#4a6080",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                      marginBottom: 6,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span
                      style={{
                        fontSize: 13.5,
                        color: "#c8d8f0",
                        fontWeight: 500,
                      }}
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
                background: "#0d1520",
                borderRadius: 12,
                border: "1px solid #1e3050",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#4a6080",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  marginBottom: 6,
                }}
              >
                Date & Heure
              </div>
              <div style={{ fontSize: 14, color: "#c8d8f0" }}>
                {viewing.date_heure
                  ? new Date(viewing.date_heure).toLocaleString("fr-FR", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })
                  : "—"}
              </div>
            </div>

            {/* Status change */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "#4a6080",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  marginBottom: 10,
                }}
              >
                Changer le statut
              </div>
              <div
                style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}
              >
                {STATUSES.map((s) => {
                  const cfg = statusCfg(s);
                  const active = viewing.status === s;
                  return (
                    <button
                      key={s}
                      className="status-btn"
                      onClick={() => !active && changeStatus(viewing, s)}
                      style={{
                        background: active ? cfg.bg : "transparent",
                        color: active ? cfg.color : "#4a6080",
                        borderColor: active ? cfg.border : "#1e3050",
                        opacity: active ? 1 : 0.7,
                        cursor: active ? "default" : "pointer",
                      }}
                    >
                      {active ? "● " : ""}
                      {s}
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
          background: "#0d1520",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        <Sidebar />
        <main style={{ marginLeft: 260, flex: 1, padding: "2rem 2.5rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontSize: 11,
                color: ACCENT,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              📅 Gestion
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#f0f4ff",
                fontFamily: "'Syne',sans-serif",
                letterSpacing: "-0.5px",
                margin: 0,
              }}
            >
              Rendez-vous
            </h1>
            <p style={{ color: "#4a6080", fontSize: 13, marginTop: 5 }}>
              {loading ? "Chargement…" : `${data.length} rendez-vous au total`}
            </p>
          </div>

          {/* Status filter chips */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: "1.5rem",
              flexWrap: "wrap" as const,
            }}
          >
            <input
              className="dt-search"
              placeholder="🔍  Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 180 }}
            />
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "9px 16px",
                borderRadius: 10,
                border: `1px solid ${filter === "all" ? ACCENT + "55" : "#1e3050"}`,
                background: filter === "all" ? `${ACCENT}18` : "transparent",
                color: filter === "all" ? ACCENT : "#4a6080",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans',sans-serif",
                cursor: "pointer",
              }}
            >
              Tous ({data.length})
            </button>
            {STATUSES.map((s) => {
              const cfg = statusCfg(s);
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 10,
                    border: `1px solid ${filter === s ? cfg.border : "#1e3050"}`,
                    background: filter === s ? cfg.bg : "transparent",
                    color: filter === s ? cfg.color : "#4a6080",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'DM Sans',sans-serif",
                    cursor: "pointer",
                    textTransform: "capitalize" as const,
                  }}
                >
                  {s} ({counts[s] || 0})
                </button>
              );
            })}
          </div>

          <div className="dt-table-wrap">
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
                  filtered.map((r, i) => {
                    const sc = statusCfg(r.status);
                    return (
                      <tr
                        key={r.id}
                        className="dt-row"
                        style={{
                          background:
                            i % 2 === 0 ? "transparent" : "rgba(0,0,0,.1)",
                        }}
                      >
                        <td className="dt-td">
                          <span
                            style={{
                              padding: "3px 10px",
                              background: `${ACCENT}18`,
                              border: `1px solid ${ACCENT}30`,
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              color: ACCENT,
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
                                background: "rgba(34,211,165,.12)",
                                border: "1px solid rgba(34,211,165,.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                              }}
                            >
                              🧑
                            </div>
                            <span
                              style={{
                                fontWeight: 500,
                                color: "#e8f0ff",
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
                                background: "rgba(167,139,250,.12)",
                                border: "1px solid rgba(167,139,250,.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 14,
                              }}
                            >
                              ⚕️
                            </div>
                            <span style={{ color: "#8ba0c0", fontSize: 13 }}>
                              {r.medecin_name || "—"}
                            </span>
                          </div>
                        </td>
                        <td
                          className="dt-td"
                          style={{ color: "#8ba0c0", fontSize: 13 }}
                        >
                          {r.date_heure
                            ? new Date(r.date_heure).toLocaleString(
                                "fr-FR",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "—"}
                        </td>
                        <td className="dt-td">
                          <span
                            style={{
                              padding: "4px 12px",
                              background: sc.bg,
                              color: sc.color,
                              border: `1px solid ${sc.border}`,
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                              textTransform: "capitalize" as const,
                            }}
                          >
                            {r.status || "en attente"}
                          </span>
                        </td>
                        <td className="dt-td">
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="ia"
                              title="Voir détails"
                              onClick={() => setViewing(r)}
                              style={{
                                background: "rgba(56,189,248,.1)",
                                color: "#38bdf8",
                              }}
                            >
                              👁️
                            </button>
                            <button
                              className="ia"
                              title="Confirmer"
                              onClick={() => changeStatus(r, "confirmé")}
                              style={{
                                background: "rgba(34,211,165,.1)",
                                color: "#22d3a5",
                                opacity: r.status === "confirmé" ? 0.3 : 1,
                              }}
                            >
                              ✓
                            </button>
                            <button
                              className="ia"
                              title="Annuler"
                              onClick={() => changeStatus(r, "annulé")}
                              style={{
                                background: "rgba(248,113,113,.1)",
                                color: "#f87171",
                                opacity: r.status === "annulé" ? 0.3 : 1,
                              }}
                            >
                              ✕
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

          {!loading && data.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 16,
                padding: "1rem 1.25rem",
                background: "linear-gradient(145deg,#131f2e,#1a2a3f)",
                borderRadius: 14,
                border: "1px solid #1e3050",
                flexWrap: "wrap" as const,
              }}
            >
              {[
                { label: "Total", value: data.length, color: ACCENT },
                ...STATUSES.map((s) => ({
                  label: s.charAt(0).toUpperCase() + s.slice(1),
                  value: counts[s] || 0,
                  color: statusCfg(s).color,
                })),
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    paddingRight: 16,
                    borderRight: "1px solid #1e3050",
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: s.color,
                      fontFamily: "'Syne',sans-serif",
                    }}
                  >
                    {s.value}
                  </span>
                  <span style={{ fontSize: 12, color: "#4a6080" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
