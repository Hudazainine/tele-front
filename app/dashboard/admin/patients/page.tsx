"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import api from "../../../../lib/api";
import Navbar from "../../../../components/Navbar";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  X,
  Check,
  User,
  Calendar,
  CircleDot,
  Circle,
  Power,
  AlertTriangle,
  FileText,
} from "lucide-react";

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

// --- Design Tokens (Dark Mode) ---
const C = {
  // Fond principal (très sombre)
  bg: "#050a10",
  // Surface des cartes et modales
  surface: "#131f2e",
  // Surface pour hover / input / secondaire
  surfaceAlt: "#1e2a3d",
  // Bordures
  border: "#2d456e",
  borderHover: "#4a6080",

  // Textes
  text: "#f1f5f9",
  textSub: "#94a3b8",
  textMuted: "#64748b",

  // Accents (Transparent pour Dark Mode)
  teal: "#2dd4bf",
  tealLight: "rgba(45, 212, 191, 0.15)",
  tealDark: "#0d9488",

  red: "#f87171",
  redLight: "rgba(248, 113, 113, 0.15)",

  amber: "#fbbf24",
  amberLight: "rgba(251, 191, 36, 0.15)",

  sky: "#38bdf8",
  skyLight: "rgba(56, 189, 248, 0.15)",

  violet: "#8b5cf6",
  violetLight: "rgba(139, 92, 246, 0.15)",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes toastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
  @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .mo {
    position:fixed;inset:0;background:rgba(5, 10, 16, 0.75);
    backdrop-filter:blur(8px);z-index:999;
    display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;
  }
  .mb {
    background:${C.surface};border:1px solid ${C.border};border-radius:20px;
    padding:2rem;width:520px;max-width:95vw;
    box-shadow:0 24px 60px rgba(0,0,0,0.5);animation:slideUp .25s cubic-bezier(.34,1.56,.64,1);
  }
  .confirm-box {
    background:${C.surface};border:1px solid ${C.border};border-radius:20px;
    padding:1.75rem;width:400px;max-width:95vw;
    box-shadow:0 24px 60px rgba(0,0,0,0.5);animation:slideUp .22s ease;text-align:center;
  }

  .ia {
    width:32px;height:32px;border-radius:8px;border:1px solid ${C.border};
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    font-size:14px;transition:all .18s;background:${C.surfaceAlt};color:${C.textSub};
  }
  .ia:hover { 
    transform:scale(1.08); 
    box-shadow:0 4px 10px rgba(0,0,0,0.2); 
    border-color: ${C.borderHover};
    color: ${C.text};
  }

  .btn-sec {
    padding:9px 18px;background:${C.surfaceAlt};border:1px solid ${C.border};
    border-radius:10px;color:${C.textSub};font-size:13px;font-weight:600;
    font-family:'Inter',sans-serif;cursor:pointer;transition:all .2s;
  }
  .btn-sec:hover { 
    background:${C.surface}; 
    color:${C.text};
    border-color: ${C.borderHover};
  }

  .p-table-wrap {
    background:${C.surface};border:1px solid ${C.border};border-radius:16px;
    overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.2);
  }
  .p-table { width:100%;border-collapse:collapse; }
  .p-thead-tr { background:${C.surfaceAlt};border-bottom:1px solid ${C.border}; }
  .p-th {
    padding:11px 16px;text-align:left;font-size:11px;font-weight:700;
    color:${C.textMuted};letter-spacing:0.08em;text-transform:uppercase;white-space:nowrap;
  }
  .p-row { border-bottom:1px solid ${C.border};transition:background .15s; }
  .p-row:last-child { border-bottom:none; }
  .p-row:hover { background:${C.surfaceAlt}; }
  .p-td { padding:12px 16px;font-size:13px;color:${C.textSub};vertical-align:middle; }
  .p-empty { padding:3rem;text-align:center;color:${C.textMuted};font-size:14px; }
  .p-skeleton {
    border-radius:6px;background:${C.surfaceAlt};animation:shimmer 1.4s infinite;
  }

  .filter-btn {
    padding:8px 16px;border-radius:9px;border:1px solid ${C.border};
    background:${C.surface};color:${C.textSub};font-size:12px;font-weight:600;
    font-family:'Inter',sans-serif;cursor:pointer;transition:all .2s;
  }
  .filter-btn.active {
    background:${C.tealLight};border-color:${C.teal}66;color:${C.teal};
  }
  .filter-btn:hover:not(.active) { background:${C.surfaceAlt}; border-color: ${C.borderHover}; }

  .search-input {
    flex:1;min-width:200px;padding:9px 14px 9px 38px;
    background:${C.surface};border:1px solid ${C.border};border-radius:10px;
    font-size:13px;color:${C.text};font-family:'Inter',sans-serif;outline:none;
    transition:border-color .2s;
  }
  .search-input:focus { border-color:${C.teal};box-shadow:0 0 0 3px ${C.tealLight}; }
  .search-input::placeholder { color:${C.textMuted}; }

  .info-row { padding:10px 0;border-bottom:1px solid ${C.border}; }
  .info-label { font-size:10px;color:${C.textMuted};font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:3px; }
  .info-value { font-size:13.5px;color:${C.text}; }

  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:${C.bg}; }
  ::-webkit-scrollbar-thumb { background:${C.border};border-radius:4px; }
  ::-webkit-scrollbar-thumb:hover { background:${C.borderHover}; }
`;

export default function AdminPatients() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewing, setViewing] = useState<Patient | null>(null);
  const [confirm, setConfirm] = useState<Patient | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get("patients/")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchData = () => {
    load();
    toast_("Données actualisées", true);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [token, isLoading, username]);

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
  const allergyCount = data.filter((p) => p.allergies).length;

  const InfoRow = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: string;
    icon?: any;
  }) => (
    <div className="info-row">
      <div
        className="info-label"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        {Icon && <Icon size={12} color={C.textMuted} />}
        {label}
      </div>
      <div className="info-value">{value || "—"}</div>
    </div>
  );

  return (
    <>
      <style>{css}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: "11px 18px",
            borderRadius: 12,
            background: toast.ok ? C.tealLight : C.redLight,
            border: `1px solid ${toast.ok ? C.teal + "44" : C.red + "44"}`,
            color: toast.ok ? C.teal : C.red,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Inter',sans-serif",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            animation: "toastIn .3s ease",
          }}
        >
          {toast.ok ? <Check size={16} /> : <X size={16} />} {toast.msg}
        </div>
      )}

      {/* Confirm modal */}
      {confirm && (
        <div
          className="mo"
          onClick={(e) => e.target === e.currentTarget && setConfirm(null)}
        >
          <div className="confirm-box">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                margin: "0 auto 14px",
                background: confirm.is_active ? C.redLight : C.tealLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {confirm.is_active ? (
                <Power size={28} color={C.red} />
              ) : (
                <Power size={28} color={C.teal} />
              )}
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.text,
                margin: "0 0 8px",
              }}
            >
              {confirm.is_active
                ? "Désactiver ce patient ?"
                : "Activer ce patient ?"}
            </h3>
            <p style={{ fontSize: 13, color: C.textSub, margin: "0 0 1.5rem" }}>
              {confirm.is_active
                ? `${confirm.username} ne pourra plus se connecter.`
                : `${confirm.username} pourra à nouveau se connecter.`}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn-sec" onClick={() => setConfirm(null)}>
                Annuler
              </button>
              <button
                onClick={() => handleToggle(confirm)}
                style={{
                  padding: "9px 22px",
                  background: confirm.is_active ? C.red : C.teal,
                  border: "none",
                  borderRadius: 10,
                  color: "#050a10", // Texte sombre sur fond vif
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Inter',sans-serif",
                  cursor: "pointer",
                  boxShadow: `0 4px 12px ${confirm.is_active ? C.red + "44" : C.teal + "44"}`,
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
                marginBottom: "1.4rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: C.tealLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={24} color={C.teal} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.teal,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                      marginBottom: 2,
                    }}
                  >
                    Dossier patient
                  </div>
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: C.text,
                      margin: 0,
                    }}
                  >
                    {viewing.username}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="ia"
                title="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <InfoRow label="ID" value={`#${viewing.id}`} icon={FileText} />
            <InfoRow label="Email" value={viewing.email} icon={null} />
            <InfoRow
              label="Date de naissance"
              value={
                viewing.date_naissance
                  ? new Date(viewing.date_naissance).toLocaleDateString("fr-FR")
                  : ""
              }
              icon={Calendar}
            />
            <InfoRow
              label="Allergies"
              value={viewing.allergies}
              icon={AlertTriangle}
            />
            <InfoRow
              label="Historique"
              value={viewing.historique}
              icon={null}
            />
            <div className="info-row" style={{ borderBottom: "none" }}>
              <div className="info-label">Statut</div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                  padding: "4px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: viewing.is_active ? C.tealLight : C.redLight,
                  color: viewing.is_active ? C.teal : C.red,
                  border: `1px solid ${viewing.is_active ? C.teal + "33" : C.red + "33"}`,
                }}
              >
                {viewing.is_active ? (
                  <CircleDot size={12} />
                ) : (
                  <Circle size={12} />
                )}{" "}
                {viewing.is_active ? "Actif" : "Inactif"}
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: "1.25rem" }}>
              <button
                className="btn-sec"
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
                  padding: "9px 20px",
                  background: viewing.is_active ? C.red : C.teal,
                  border: "none",
                  borderRadius: 10,
                  color: "#050a10",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Inter',sans-serif",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Power size={14} />
                {viewing.is_active ? "Désactiver" : "Activer"}
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
          background: C.bg,
          fontFamily: "'Inter',sans-serif",
        }}
      >
        <Sidebar />
        <main style={{ marginLeft: 260, flex: 1, padding: "5rem 2.4rem 3rem" }}>
          <Navbar
            title="Patients"
            subtitle={`Bonjour ${username || "Admin"}`}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.8rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: C.teal,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Users size={14} /> Gestion
              </div>
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: C.text,
                  letterSpacing: "-0.5px",
                  margin: 0,
                }}
              >
                Patients
              </h1>
              <p
                style={{
                  color: C.textMuted,
                  fontSize: 13,
                  marginTop: 5,
                  marginBottom: 0,
                }}
              >
                {loading
                  ? "Chargement…"
                  : `${data.length} patient${data.length > 1 ? "s" : ""} — ${activeCount} actif${activeCount > 1 ? "s" : ""}, ${inactiveCount} inactif${inactiveCount > 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={fetchData}
              style={{
                padding: "9px 18px",
                background: C.teal,
                border: "none",
                borderRadius: 10,
                color: "#050a10",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: `0 4px 12px ${C.teal}44`,
                transition: "all .2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} /> Actualiser
            </button>
          </div>

          {/* Stats mini */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: "1.6rem",
              flexWrap: "wrap",
            }}
          >
            {[
              {
                label: "Total",
                value: data.length,
                color: C.violet,
                bg: C.violetLight,
                icon: Users,
              },
              {
                label: "Actifs",
                value: activeCount,
                color: C.teal,
                bg: C.tealLight,
                icon: CircleDot,
              },
              {
                label: "Inactifs",
                value: inactiveCount,
                color: C.red,
                bg: C.redLight,
                icon: Circle,
              },
              {
                label: "Avec allergies",
                value: allergyCount,
                color: C.amber,
                bg: C.amberLight,
                icon: AlertTriangle,
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: "12px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  minWidth: "140px",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: s.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.color,
                  }}
                >
                  {loading ? null : <s.icon size={18} />}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: s.color,
                      lineHeight: 1,
                    }}
                  >
                    {loading ? "—" : s.value}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: C.textMuted,
                      fontWeight: 500,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: "1.4rem",
              flexWrap: "wrap" as const,
              alignItems: "center",
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
                placeholder="Rechercher un patient…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-btn${filter === f ? " active" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {f === "all" ? (
                  <Users size={14} />
                ) : f === "active" ? (
                  <CircleDot size={14} />
                ) : (
                  <Circle size={14} />
                )}
                {f === "all" ? "Tous" : f === "active" ? "Actifs" : "Inactifs"}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="p-table-wrap">
            <table className="p-table">
              <thead>
                <tr className="p-thead-tr">
                  {[
                    "ID",
                    "Patient",
                    "Email",
                    "Naissance",
                    "Allergies",
                    "Statut",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="p-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-empty">
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {[100, 160, 120, 80, 60].map((w, i) => (
                          <div
                            key={i}
                            className="p-skeleton"
                            style={{ width: w, height: 12 }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-empty">
                      Aucun patient trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="p-row">
                      <td className="p-td">
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 8,
                            background: C.violetLight,
                            color: C.violet,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          #{p.id}
                        </span>
                      </td>
                      <td className="p-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: p.is_active
                                ? C.tealLight
                                : C.surfaceAlt,
                              border: `1px solid ${p.is_active ? C.teal + "33" : C.border}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: p.is_active ? C.teal : C.textSub,
                            }}
                          >
                            <User size={16} />
                          </div>
                          <span
                            style={{
                              fontWeight: 600,
                              color: C.text,
                              fontSize: 13,
                            }}
                          >
                            {p.username}
                          </span>
                        </div>
                      </td>
                      <td className="p-td" style={{ color: C.textMuted }}>
                        {p.email}
                      </td>
                      <td className="p-td" style={{ color: C.textMuted }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Calendar size={13} color={C.textMuted} />
                          {p.date_naissance
                            ? new Date(p.date_naissance).toLocaleDateString(
                                "fr-FR",
                              )
                            : "—"}
                        </div>
                      </td>
                      <td className="p-td">
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: p.allergies ? C.redLight : C.surfaceAlt,
                            color: p.allergies ? C.red : C.textMuted,
                            border: `1px solid ${p.allergies ? C.red + "22" : "transparent"}`,
                            fontSize: 11,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {p.allergies ? (
                            <>
                              <AlertTriangle size={10} /> Oui
                            </>
                          ) : (
                            "Aucune"
                          )}
                        </span>
                      </td>
                      <td className="p-td">
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: p.is_active ? C.tealLight : C.redLight,
                            color: p.is_active ? C.teal : C.red,
                            border: `1px solid ${p.is_active ? C.teal + "33" : C.red + "33"}`,
                            fontSize: 11,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {p.is_active ? (
                            <CircleDot size={10} />
                          ) : (
                            <Circle size={10} />
                          )}
                          {p.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="p-td">
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="ia"
                            title="Voir le dossier"
                            onClick={() => setViewing(p)}
                            style={{ color: C.sky }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="ia"
                            title={p.is_active ? "Désactiver" : "Activer"}
                            onClick={() => setConfirm(p)}
                            style={{ color: p.is_active ? C.amber : C.teal }}
                          >
                            <Power size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}
