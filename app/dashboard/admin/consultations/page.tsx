"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import api from "../../../../lib/api";
import Navbar from "../../../../components/Navbar";
import {
  Stethoscope,
  Search,
  FileText,
  X,
  Check,
  Trash2,
  Save,
  Loader2,
  User,
  Calendar,
  ClipboardList,
  PenTool,
} from "lucide-react";

interface Consultation {
  id: number;
  patient: number;
  medecin: number;
  patient_name: string;
  medecin_name: string;
  date_heure: string;
  notes: string;
}

// ─── Dark Theme Design Tokens ──────────────────────────────────
const C = {
  bg: "#050a10",
  surface: "#131f2e",
  surfaceAlt: "#1e2a3d",
  border: "#2d456e",
  borderHover: "#4a6080",

  text: "#f1f5f9",
  textSub: "#94a3b8",
  textMuted: "#64748b",

  amber: "#fbbf24",
  amberLight: "rgba(251, 191, 36, 0.15)",
  amberDark: "#b45309",

  teal: "#2dd4bf",
  tealLight: "rgba(45, 212, 191, 0.15)",
  tealDark: "#0f766e",

  red: "#f87171",
  redLight: "rgba(248, 113, 113, 0.15)",

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
  @keyframes spin { to { transform: rotate(360deg); } }

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
    transition:all .18s;background:${C.surfaceAlt};color:${C.textSub};
  }
  .ia:hover { 
    transform:scale(1.08);
    border-color: ${C.borderHover};
    color: ${C.text};
    background: ${C.surface};
  }

  .btn-sec {
    padding:9px 18px;background:${C.surfaceAlt};border:1px solid ${C.border};
    border-radius:10px;color:${C.textSub};font-size:13px;font-weight:600;
    font-family:'Inter',sans-serif;cursor:pointer;transition:all .2s;
  }
  .btn-sec:hover { 
    background:${C.surface}; 
    border-color: ${C.borderHover};
    color:${C.text}; 
  }

  .btn-pri {
    padding:9px 22px;border:none;border-radius:10px;
    color:#050a10;font-size:13px;font-weight:700;
    font-family:'Inter',sans-serif;cursor:pointer;transition:all .2s;
    display:flex; align-items:center; justify-content:center; gap:8px;
  }
  .btn-pri:hover:not(:disabled) { transform:translateY(-1px);filter:brightness(1.1); }
  .btn-pri:disabled { opacity:.5;cursor:not-allowed; }

  .c-table-wrap {
    background:${C.surface};border:1px solid ${C.border};border-radius:16px;
    overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.2);
  }
  .c-table { width:100%;border-collapse:collapse; }
  .c-thead-tr { background:${C.surfaceAlt};border-bottom:1px solid ${C.border}; }
  .c-th {
    padding:11px 16px;text-align:left;font-size:11px;font-weight:700;
    color:${C.textMuted};letter-spacing:0.08em;text-transform:uppercase;white-space:nowrap;
  }
  .c-row { border-bottom:1px solid ${C.border};transition:background .15s; }
  .c-row:last-child { border-bottom:none; }
  .c-row:hover { background:${C.surfaceAlt}; }
  .c-td { padding:12px 16px;font-size:13px;color:${C.textSub};vertical-align:middle; }
  .c-empty { padding:3rem;text-align:center;color:${C.textMuted};font-size:14px; }
  .c-skeleton { border-radius:6px;background:${C.surfaceAlt};animation:shimmer 1.4s infinite; }

  .search-input {
    flex:1;min-width:200px;padding:9px 14px 9px 38px;
    background:${C.surface};border:1px solid ${C.border};border-radius:10px;
    font-size:13px;color:${C.text};font-family:'Inter',sans-serif;outline:none;
    transition:border-color .2s;
  }
  .search-input:focus { 
    border-color:${C.amber}; 
    box-shadow:0 0 0 3px ${C.amberLight}; 
  }
  .search-input::placeholder { color:${C.textMuted}; }

  .notes-textarea {
    width:100%;padding:11px 14px;
    background:${C.surfaceAlt};border:1px solid ${C.border};border-radius:11px;
    font-size:13px;color:${C.text};font-family:'Inter',sans-serif;outline:none;
    transition:border-color .2s;box-sizing:border-box;resize:vertical;min-height:90px;
  }
  .notes-textarea:focus { 
    border-color:${C.amber}; 
    box-shadow:0 0 0 3px ${C.amberLight}; 
  }

  .info-block {
    padding:12px 14px;background:${C.surfaceAlt};border-radius:12px;
    border:1px solid ${C.border};
  }
  .info-label { font-size:10px;color:${C.textMuted};font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:5px; }

  .spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: black; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }

  ::-webkit-scrollbar { width:6px; }
  ::-webkit-scrollbar-track { background:${C.bg}; }
  ::-webkit-scrollbar-thumb { background:${C.border};border-radius:4px; }
  ::-webkit-scrollbar-thumb:hover { background:${C.borderHover}; }
`;

export default function AdminConsultations() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Consultation | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [confirm, setConfirm] = useState<Consultation | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = () =>
    api
      .get("consultations/")
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

  const filtered = data.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.patient_name?.toLowerCase().includes(q) ||
      c.medecin_name?.toLowerCase().includes(q) ||
      c.notes?.toLowerCase().includes(q)
    );
  });

  const toast_ = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const openView = (c: Consultation) => {
    setViewing(c);
    setEditNotes(c.notes || "");
  };

  const saveNotes = async () => {
    if (!viewing) return;
    setSavingNotes(true);
    try {
      await api.patch(`consultations/${viewing.id}/`, { notes: editNotes });
      toast_("Notes mises à jour.", true);
      setViewing({ ...viewing, notes: editNotes });
      load();
    } catch {
      toast_("Erreur de sauvegarde.", false);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async (c: Consultation) => {
    try {
      await api.delete(`consultations/${c.id}/`);
      toast_(`Consultation #${c.id} supprimée.`, true);
      load();
    } catch {
      toast_("Erreur lors de la suppression.", false);
    }
    setConfirm(null);
  };

  const withNotes = data.filter((c) => c.notes).length;
  const withoutNotes = data.filter((c) => !c.notes).length;

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

      {/* Confirm delete */}
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
                background: C.redLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={28} color={C.red} />
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: C.text,
                margin: "0 0 8px",
              }}
            >
              Supprimer cette consultation ?
            </h3>
            <p style={{ fontSize: 13, color: C.textSub, margin: "0 0 1.5rem" }}>
              La consultation #{confirm.id} sera définitivement supprimée.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="btn-sec" onClick={() => setConfirm(null)}>
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirm)}
                style={{
                  padding: "9px 22px",
                  background: C.red,
                  border: "none",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Inter',sans-serif",
                  cursor: "pointer",
                  boxShadow: `0 4px 12px ${C.red}44`,
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail / Edit notes modal */}
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
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.amber,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                    marginBottom: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Stethoscope size={12} /> Consultation
                </div>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: C.text,
                    margin: 0,
                  }}
                >
                  #{viewing.id}
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
                gap: 10,
                marginBottom: "1rem",
              }}
            >
              {[
                {
                  label: "Patient",
                  value: viewing.patient_name,
                  icon: User,
                  color: C.teal,
                  bg: C.tealLight,
                },
                {
                  label: "Médecin",
                  value: viewing.medecin_name,
                  icon: Stethoscope,
                  color: C.violet,
                  bg: C.violetLight,
                },
              ].map((item) => (
                <div key={item.label} className="info-block">
                  <div className="info-label">{item.label}</div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: item.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: item.color,
                      }}
                    >
                      <item.icon size={14} />
                    </div>
                    <span
                      style={{ fontSize: 13, color: C.text, fontWeight: 600 }}
                    >
                      {item.value || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="info-block" style={{ marginBottom: "1rem" }}>
              <div className="info-label">Date & Heure</div>
              <div
                style={{
                  fontSize: 13.5,
                  color: C.text,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Calendar size={14} color={C.textMuted} />
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
                  textTransform: "uppercase" as const,
                  marginBottom: 8,
                }}
              >
                Notes cliniques
              </div>
              <textarea
                className="notes-textarea"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Aucune note…"
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: "1.2rem" }}>
              <button className="btn-sec" onClick={() => setViewing(null)}>
                Fermer
              </button>
              <button
                className="btn-pri"
                onClick={saveNotes}
                disabled={savingNotes || editNotes === viewing.notes}
                style={{
                  flex: 1,
                  background: C.amber,
                  boxShadow: `0 4px 12px ${C.amber}44`,
                }}
              >
                {savingNotes ? (
                  <>
                    <div className="spinner" /> Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Sauvegarder les notes
                  </>
                )}
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
          fontFamily: "'Inter',sans-serif",
        }}
      >
        <Sidebar />
        <main style={{ marginLeft: 260, flex: 1, padding: "5rem 2.4rem 3rem" }}>
          <Navbar title="Consultations" subtitle="Gestion des consultations" />

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
                  color: C.amber,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Stethoscope size={14} /> Gestion
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
                Consultations
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
                  : `${data.length} consultation${data.length > 1 ? "s" : ""} au total`}
              </p>
            </div>
            <div style={{ position: "relative" }}>
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
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Stats mini */}
          <div style={{ display: "flex", gap: 12, marginBottom: "1.6rem" }}>
            {[
              {
                label: "Total",
                value: data.length,
                color: C.amber,
                bg: C.amberLight,
                icon: FileText,
              },
              {
                label: "Avec notes",
                value: withNotes,
                color: C.teal,
                bg: C.tealLight,
                icon: ClipboardList,
              },
              {
                label: "Sans notes",
                value: withoutNotes,
                color: C.textMuted,
                bg: C.surfaceAlt,
                icon: FileText,
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
                  gap: 10,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
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

          {/* Table */}
          <div className="c-table-wrap">
            <table className="c-table">
              <thead>
                <tr className="c-thead-tr">
                  {["ID", "Patient", "Médecin", "Date", "Notes", "Actions"].map(
                    (h) => (
                      <th key={h} className="c-th">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="c-empty">
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
                            className="c-skeleton"
                            style={{ width: w, height: 12 }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="c-empty">
                      Aucune consultation trouvée
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="c-row">
                      <td className="c-td">
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 8,
                            background: C.amberLight,
                            color: C.amber,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          #{c.id}
                        </span>
                      </td>
                      <td className="c-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 10,
                              background: C.tealLight,
                              border: `1px solid ${C.teal}22`,
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
                              fontWeight: 600,
                              color: C.text,
                              fontSize: 13,
                            }}
                          >
                            {c.patient_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="c-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 10,
                              background: C.violetLight,
                              border: `1px solid ${C.violet}22`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: C.violet,
                            }}
                          >
                            <Stethoscope size={16} />
                          </div>
                          <span style={{ color: C.textSub, fontSize: 13 }}>
                            {c.medecin_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="c-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Calendar size={12} color={C.textMuted} />
                          {c.date_heure
                            ? new Date(c.date_heure).toLocaleDateString(
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
                        </div>
                      </td>
                      <td className="c-td" style={{ maxWidth: 180 }}>
                        {c.notes ? (
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: C.textSub,
                              fontSize: 12,
                            }}
                          >
                            {c.notes}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              color: C.textMuted,
                              fontStyle: "italic",
                            }}
                          >
                            Aucune note
                          </span>
                        )}
                      </td>
                      <td className="c-td">
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="ia"
                            title="Voir / Éditer notes"
                            onClick={() => openView(c)}
                            style={{ color: C.amber }}
                          >
                            <PenTool size={16} />
                          </button>
                          <button
                            className="ia"
                            title="Supprimer"
                            onClick={() => setConfirm(c)}
                            style={{ color: C.red }}
                          >
                            <Trash2 size={16} />
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
