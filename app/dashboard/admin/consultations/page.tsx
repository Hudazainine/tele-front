"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import api from "../../../../lib/api";
import { darkTableCSS } from "../../../../lib/shared-table-styles";

interface Consultation {
  id: number;
  patient: number;
  medecin: number;
  patient_name: string;
  medecin_name: string;
  date_heure: string;
  notes: string;
}

const ACCENT = "#fb923c";

const css = `
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes slideUp { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes toastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
  .mo { position:fixed;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);z-index:999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease }
  .mb { background:linear-gradient(145deg,#131f2e,#1a2a3f);border:1px solid #2a3f5a;border-radius:24px;padding:2rem;width:520px;max-width:95vw;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .28s cubic-bezier(.34,1.56,.64,1) }
  .ia { width:34px;height:34px;border-radius:9px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .18s }
  .ia:hover{transform:scale(1.1)}
  .bs { padding:11px 20px;background:transparent;border:1px solid #1e3050;border-radius:11px;color:#8ba0c0;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s }
  .bs:hover{border-color:#2a4060;color:#c8d8f0}
  .bp { padding:11px 24px;background:linear-gradient(135deg,#fb923c,#ea580c);border:none;border-radius:11px;color:#fff;font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;transition:all .2s }
  .bp:hover{transform:translateY(-1px);box-shadow:0 8px 20px #fb923c40}
  .bp:disabled{opacity:.5;cursor:not-allowed;transform:none}
  .mi { width:100%;padding:11px 14px;background:#0d1520;border:1px solid #1e3050;border-radius:11px;font-size:13.5px;color:#c8d8f0;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s;box-sizing:border-box }
  .mi:focus{border-color:#fb923c55;box-shadow:0 0 0 3px #fb923c12}
  .confirm-box { background:linear-gradient(145deg,#131f2e,#1a2a3f);border:1px solid #2a3f5a;border-radius:20px;padding:1.75rem;width:400px;max-width:95vw;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:slideUp .25s ease;text-align:center }
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

      {/* Confirm delete */}
      {confirm && (
        <div
          className="mo"
          onClick={(e) => e.target === e.currentTarget && setConfirm(null)}
        >
          <div className="confirm-box">
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#f0f4ff",
                fontFamily: "'Syne',sans-serif",
                margin: "0 0 8px",
              }}
            >
              Supprimer cette consultation ?
            </h3>
            <p style={{ fontSize: 13, color: "#8ba0c0", margin: "0 0 1.5rem" }}>
              La consultation #{confirm.id} sera définitivement supprimée.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="bs" onClick={() => setConfirm(null)}>
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirm)}
                style={{
                  padding: "11px 20px",
                  background: "rgba(248,113,113,.15)",
                  border: "1px solid rgba(248,113,113,.3)",
                  borderRadius: 11,
                  color: "#f87171",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'DM Sans',sans-serif",
                  cursor: "pointer",
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail + edit notes modal */}
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
                  🩺 Consultation
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
                  #{viewing.id}
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
                    <span style={{ fontSize: 17 }}>{item.icon}</span>
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

            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "#4a6080",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  marginBottom: 8,
                }}
              >
                Notes cliniques
              </div>
              <textarea
                className="mi"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                placeholder="Aucune note…"
                style={{ resize: "vertical", minHeight: 90 }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: "1.25rem" }}>
              <button className="bs" onClick={() => setViewing(null)}>
                Fermer
              </button>
              <button
                className="bp"
                onClick={saveNotes}
                disabled={savingNotes || editNotes === viewing.notes}
              >
                {savingNotes ? "⏳ Sauvegarde…" : "💾 Sauvegarder les notes"}
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
                🩺 Gestion
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
                Consultations
              </h1>
              <p style={{ color: "#4a6080", fontSize: 13, marginTop: 5 }}>
                {loading
                  ? "Chargement…"
                  : `${data.length} consultation${data.length > 1 ? "s" : ""} au total`}
              </p>
            </div>
            <input
              className="dt-search"
              placeholder="🔍  Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="dt-table-wrap">
            <table className="dt-table">
              <thead>
                <tr className="dt-thead-tr">
                  {["ID", "Patient", "Médecin", "Date", "Notes", "Actions"].map(
                    (h) => (
                      <th key={h} className="dt-th">
                        {h}
                      </th>
                    ),
                  )}
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
                      Aucune consultation trouvée
                    </td>
                  </tr>
                ) : (
                  filtered.map((c, i) => (
                    <tr
                      key={c.id}
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
                          #{c.id}
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
                            {c.patient_name || "—"}
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
                            {c.medecin_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td
                        className="dt-td"
                        style={{ color: "#8ba0c0", fontSize: 13 }}
                      >
                        {c.date_heure
                          ? new Date(c.date_heure).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="dt-td" style={{ maxWidth: 180 }}>
                        {c.notes ? (
                          <span
                            style={{
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: "#8ba0c0",
                              fontSize: 13,
                            }}
                          >
                            {c.notes}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#2a3f5a",
                              fontStyle: "italic",
                            }}
                          >
                            Aucune note
                          </span>
                        )}
                      </td>
                      <td className="dt-td">
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="ia"
                            title="Voir / Éditer notes"
                            onClick={() => openView(c)}
                            style={{
                              background: "rgba(251,146,60,.1)",
                              color: "#fb923c",
                            }}
                          >
                            📋
                          </button>
                          <button
                            className="ia"
                            title="Supprimer"
                            onClick={() => setConfirm(c)}
                            style={{
                              background: "rgba(248,113,113,.1)",
                              color: "#f87171",
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
              }}
            >
              {[
                { label: "Total", value: data.length, color: ACCENT },
                {
                  label: "Avec notes",
                  value: data.filter((c) => c.notes).length,
                  color: "#22d3a5",
                },
                {
                  label: "Sans notes",
                  value: data.filter((c) => !c.notes).length,
                  color: "#4a6080",
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
