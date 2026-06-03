"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import api from "../../../../lib/api";
import { darkTableCSS } from "../../../../lib/shared-table-styles";
import Navbar from "../../../../components/Navbar";

// --- Types ---
interface Patient {
  id: number;
  username: string;
  email: string;
  date_naissance: string;
  allergies: string;
  historique: string;
  is_active: boolean;
}

interface User {
  username: string;
}

// --- Constants ---
const ACCENT = "#22d3a5";

// --- CSS & Animations ---
const css = `
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes toastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(15px)} to{opacity:1;transform:translateY(0)} }

  .mo  { position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);z-index:999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease }
  .mb  { background:linear-gradient(145deg,#131f2e,#1a2a3f);border:1px solid #2a3f5a;border-radius:24px;padding:2rem;width:520px;max-width:95vw;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .28s cubic-bezier(.34,1.56,.64,1) }
  .ia  { width:34px;height:34px;border-radius:9px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .18s }
  .ia:hover { transform:scale(1.1) }
  .bs  { padding:11px 20px;background:transparent;border:1px solid #1e3050;border-radius:11px;color:#8ba0c0;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s }
  .bs:hover { border-color:#2a4060;color:#c8d8f0 }
  .confirm-box { background:linear-gradient(145deg,#131f2e,#1a2a3f);border:1px solid #2a3f5a;border-radius:20px;padding:1.75rem;width:400px;max-width:95vw;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .25s ease;text-align:center }
`;

export default function AdminPatients() {
  const { token, isLoading, user: authUser } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewing, setViewing] = useState<Patient | null>(null);
  const [confirm, setConfirm] = useState<Patient | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [time, setTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchData = () => {
    load();
    toast_("Données actualisées", true);
  };

  const load = () => {
    setLoading(true);
    api
      .get("patients/")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    if (authUser) {
      setCurrentUser(authUser);
    } else {
      setCurrentUser({ username: "Admin" });
    }

    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [token, isLoading, authUser]);

  if (isLoading) return null;

  const filtered = data.filter((p) => {
    const q = search.toLowerCase();
    const matchS =
      p.username?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q);
    const matchF =
      filter === "all" ||
      (filter === "active" && p.is_active) ||
      (filter === "inactive" && !p.is_active);
    return matchS && matchF;
  });

  const toast_ = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleToggle = async (p: Patient) => {
    try {
      await api.patch(`patients/${p.id}/`, { is_active: !p.is_active });
      toast_(`${p.username} ${!p.is_active ? "activé" : "désactivé"}.`, true);
      load();
    } catch {
      toast_("Erreur de mise à jour.", false);
    }
    setConfirm(null);
  };

  const activeCount = data.filter((p) => p.is_active).length;
  const inactiveCount = data.filter((p) => !p.is_active).length;

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ padding: "10px 0", borderBottom: "1px solid #1a2a3f" }}>
      <div
        style={{
          fontSize: 10,
          color: "#4a6080",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: "#c8d8f0" }}>{value || "—"}</div>
    </div>
  );

  return (
    <>
      <style>{darkTableCSS + css}</style>

      {/* Toast */}
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

      {/* Confirm toggle */}
      {confirm && (
        <div
          className="mo"
          onClick={(e) => e.target === e.currentTarget && setConfirm(null)}
        >
          <div className="confirm-box">
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {confirm.is_active ? "🔴" : "🟢"}
            </div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#f0f4ff",
                fontFamily: "'Syne',sans-serif",
                margin: "0 0 8px",
              }}
            >
              {confirm.is_active
                ? "Désactiver ce patient ?"
                : "Activer ce patient ?"}
            </h3>
            <p style={{ fontSize: 13, color: "#8ba0c0", margin: "0 0 1.5rem" }}>
              {confirm.is_active
                ? `${confirm.username} ne pourra plus se connecter.`
                : `${confirm.username} pourra à nouveau se connecter.`}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="bs" onClick={() => setConfirm(null)}>
                Annuler
              </button>
              <button
                onClick={() => handleToggle(confirm)}
                style={{
                  padding: "11px 24px",
                  background: confirm.is_active
                    ? "rgba(248,113,113,.15)"
                    : "linear-gradient(135deg,#22d3a5,#059669)",
                  border: confirm.is_active
                    ? "1px solid rgba(248,113,113,.3)"
                    : "none",
                  borderRadius: 11,
                  color: confirm.is_active ? "#f87171" : "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'DM Sans',sans-serif",
                  cursor: "pointer",
                }}
              >
                {confirm.is_active ? "Désactiver" : "Activer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
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
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: `${ACCENT}20`,
                    border: `2px solid ${ACCENT}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  🧑
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: ACCENT,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                      marginBottom: 3,
                    }}
                  >
                    Dossier patient
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
                    {viewing.username}
                  </h2>
                </div>
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
            <div
              style={{
                display: "flex",
                flexDirection: "column" as const,
                gap: 0,
              }}
            >
              <InfoRow label="ID" value={`#${viewing.id}`} />
              <InfoRow label="Email" value={viewing.email} />
              <InfoRow
                label="Date de naissance"
                value={
                  viewing.date_naissance
                    ? new Date(viewing.date_naissance).toLocaleDateString(
                        "fr-FR",
                      )
                    : ""
                }
              />
              <InfoRow label="Allergies" value={viewing.allergies} />
              <InfoRow label="Historique" value={viewing.historique} />
              <div style={{ padding: "10px 0" }}>
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
                  Statut
                </div>
                <span
                  style={{
                    padding: "5px 14px",
                    background: viewing.is_active
                      ? "rgba(34,211,165,.12)"
                      : "rgba(248,113,113,.1)",
                    color: viewing.is_active ? "#22d3a5" : "#f87171",
                    border: `1px solid ${viewing.is_active ? "rgba(34,211,165,.25)" : "rgba(248,113,113,.2)"}`,
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {viewing.is_active ? "● Actif" : "○ Inactif"}
                </span>
              </div>
            </div>
            <div style={{ marginTop: "1.25rem", display: "flex", gap: 10 }}>
              <button
                className="bs"
                style={{ flex: 1 }}
                onClick={() => setViewing(null)}
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  setConfirm(viewing);
                  setViewing(null);
                }}
                style={{
                  flex: 1,
                  padding: "11px 20px",
                  background: viewing.is_active
                    ? "rgba(248,113,113,.1)"
                    : "linear-gradient(135deg,#22d3a5,#059669)",
                  border: viewing.is_active
                    ? "1px solid rgba(248,113,113,.25)"
                    : "none",
                  borderRadius: 11,
                  color: viewing.is_active ? "#f87171" : "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'DM Sans',sans-serif",
                  cursor: "pointer",
                }}
              >
                {viewing.is_active ? "🔴 Désactiver" : "🟢 Activer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Layout */}
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#0d1520",
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        <Sidebar />

        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "2rem 2.5rem",
            position: "relative",
          }}
        >
          {/* Navbar */}
          <Navbar
            title="Mon espace santé"
            subtitle={`Bonjour ${currentUser?.username || "Admin"} 👋`}
          />

          {/* ── Header (Clock Only) ───────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end", // Align remaining content to the right
              alignItems: "center",
              marginBottom: "1rem",
              animation: "fadeUp .4s ease both",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#f0f4ff",
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: "-1px",
                }}
              >
                {time.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#4a6080",
                  marginTop: 2,
                  letterSpacing: "0.06em",
                }}
              >
                HEURE LOCALE
              </div>
              <button
                onClick={fetchData}
                style={{
                  marginTop: 8,
                  padding: "5px 14px",
                  background: "rgba(34,211,165,0.1)",
                  border: "1px solid rgba(34,211,165,0.25)",
                  borderRadius: 8,
                  color: "#22d3a5",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ↻ Actualiser
              </button>
            </div>
          </div>

          {/* Section Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <div>
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
                👥 Gestion
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
                Patients
              </h1>
              <p style={{ color: "#4a6080", fontSize: 13, marginTop: 5 }}>
                {loading
                  ? "Chargement…"
                  : `${data.length} patient${data.length > 1 ? "s" : ""} — ${activeCount} actif${activeCount > 1 ? "s" : ""}, ${inactiveCount} inactif${inactiveCount > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Filters */}
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
              placeholder="🔍  Rechercher un patient…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 200 }}
            />
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 10,
                  border: `1px solid ${filter === f ? ACCENT + "55" : "#1e3050"}`,
                  background: filter === f ? `${ACCENT}18` : "transparent",
                  color: filter === f ? ACCENT : "#4a6080",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'DM Sans',sans-serif",
                  cursor: "pointer",
                  transition: "all .2s",
                }}
              >
                {f === "all"
                  ? "Tous"
                  : f === "active"
                    ? "✓ Actifs"
                    : "✕ Inactifs"}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="dt-table-wrap">
            <table className="dt-table">
              <thead>
                <tr className="dt-thead-tr">
                  {[
                    "ID",
                    "Patient",
                    "Email",
                    "Naissance",
                    "Allergies",
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
                    <td colSpan={7} className="dt-empty">
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
                    <td colSpan={7} className="dt-empty">
                      Aucun patient trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <tr
                      key={p.id}
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
                          #{p.id}
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
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: p.is_active
                                ? `${ACCENT}20`
                                : "rgba(255,255,255,.05)",
                              border: `2px solid ${p.is_active ? ACCENT + "40" : "#1e3050"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 15,
                            }}
                          >
                            🧑
                          </div>
                          <span
                            style={{
                              fontWeight: 600,
                              color: p.is_active ? "#e8f0ff" : "#4a6080",
                              fontSize: 13.5,
                            }}
                          >
                            {p.username}
                          </span>
                        </div>
                      </td>
                      <td
                        className="dt-td"
                        style={{ color: "#8ba0c0", fontSize: 13 }}
                      >
                        {p.email}
                      </td>
                      <td
                        className="dt-td"
                        style={{ color: "#8ba0c0", fontSize: 13 }}
                      >
                        {p.date_naissance
                          ? new Date(p.date_naissance).toLocaleDateString(
                              "fr-FR",
                            )
                          : "—"}
                      </td>
                      <td className="dt-td">
                        <span
                          style={{
                            padding: "4px 12px",
                            background: p.allergies
                              ? "rgba(248,113,113,.1)"
                              : "rgba(255,255,255,.05)",
                            color: p.allergies ? "#f87171" : "#4a6080",
                            border: `1px solid ${p.allergies ? "rgba(248,113,113,.2)" : "transparent"}`,
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {p.allergies || "Aucune"}
                        </span>
                      </td>
                      <td className="dt-td">
                        <span
                          style={{
                            padding: "4px 12px",
                            background: p.is_active
                              ? "rgba(34,211,165,.12)"
                              : "rgba(248,113,113,.1)",
                            color: p.is_active ? "#22d3a5" : "#f87171",
                            border: `1px solid ${p.is_active ? "rgba(34,211,165,.25)" : "rgba(248,113,113,.2)"}`,
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {p.is_active ? "● Actif" : "○ Inactif"}
                        </span>
                      </td>
                      <td className="dt-td">
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="ia"
                            title="Voir le dossier"
                            onClick={() => setViewing(p)}
                            style={{
                              background: "rgba(56,189,248,.1)",
                              color: "#38bdf8",
                            }}
                          >
                            👁️
                          </button>
                          <button
                            className="ia"
                            title={p.is_active ? "Désactiver" : "Activer"}
                            onClick={() => setConfirm(p)}
                            style={{
                              background: p.is_active
                                ? "rgba(251,146,60,.1)"
                                : "rgba(34,211,165,.1)",
                              color: p.is_active ? "#fb923c" : "#22d3a5",
                            }}
                          >
                            {p.is_active ? "🔴" : "🟢"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Stats footer */}
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
              }}
            >
              {[
                { label: "Total", value: data.length, color: ACCENT },
                { label: "Actifs", value: activeCount, color: "#22d3a5" },
                { label: "Inactifs", value: inactiveCount, color: "#f87171" },
                {
                  label: "Avec allergies",
                  value: data.filter((p) => p.allergies).length,
                  color: "#fb923c",
                },
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
