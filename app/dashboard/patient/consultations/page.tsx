"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";

interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
  notifications: number;
}

interface Consultation {
  id: number;
  medecin_name: string;
  date_heure: string;
  motif: string;
  diagnostic: string;
  type_consultation: string;
  notes: string;
}

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  "Consultation générale":       { color: "#185FA5", bg: "#E6F1FB" },
  "Suivi médical":               { color: "#0F6E56", bg: "#E1F5EE" },
  "Urgence":                     { color: "#993C1D", bg: "#FAECE7" },
  "Avis spécialisé":             { color: "#534AB7", bg: "#EEEDFE" },
  "Renouvellement d'ordonnance": { color: "#3B6D11", bg: "#EAF3DE" },
};

export default function PatientConsultations() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats]               = useState<Stats>({ rendezvous: 0, consultations: 0, ordonnances: 0, notifications: 0 });
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState<Consultation | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    Promise.all([
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("ordonnances/"),
      api.get("notifications/"),
    ]).then(([r, c, o, n]) => {
      setStats({
        rendezvous:    r.data.length,
        consultations: c.data.length,
        ordonnances:   o.data.length,
        notifications: n.data.length,
      });
      // Trier par date décroissante
      const sorted = [...c.data].sort(
        (a: Consultation, b: Consultation) =>
          new Date(b.date_heure).getTime() - new Date(a.date_heure).getTime()
      );
      setConsultations(sorted);
      if (sorted.length > 0) setSelected(sorted[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token, isLoading]);

  if (isLoading) return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🩺</div>
        <div style={{ fontSize: 14, color: "#8B5CF6", fontWeight: 600 }}>Chargement...</div>
      </div>
    </div>
  );

  const filtered = consultations.filter(c =>
    c.medecin_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.motif?.toLowerCase().includes(search.toLowerCase()) ||
    c.diagnostic?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .pg-root { min-height: 100vh; background: linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 100%); font-family: 'DM Sans', sans-serif; display: flex; }
        .pg-main { margin-left: 260px; flex: 1; padding: 2rem; padding-top: calc(70px + 2rem); }

        /* Header */
        .pg-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .pg-title  { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #1e1b4b; }
        .pg-sub    { font-size: 13px; color: #94a3b8; margin-top: 2px; }

        /* Stats */
        .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.9); border-radius: 20px; padding: 18px 22px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 12px rgba(139,92,246,0.04); }
        .stat-icon { width: 42px; height: 42px; border-radius: 13px; background: linear-gradient(135deg, #8B5CF6, #10B981); display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 10px rgba(139,92,246,0.25); flex-shrink: 0; }
        .stat-val  { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #1e1b4b; line-height: 1; }
        .stat-lbl  { font-size: 12px; color: #94a3b8; margin-top: 3px; }

        /* Layout 2 cols */
        .split { display: grid; grid-template-columns: 340px minmax(0,1fr); gap: 16px; align-items: start; }

        /* Left list */
        .list-col { display: flex; flex-direction: column; gap: 12px; }
        .search-wrap { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.9); border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(139,92,246,0.04); }
        .search-input { flex:1; border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:13px; color:#334155; outline:none; }
        .search-input::placeholder { color:#94a3b8; }

        .list-card { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.9); border-radius: 20px; overflow: hidden; box-shadow: 0 2px 12px rgba(139,92,246,0.04); }
        .list-item { padding: 14px 16px; border-bottom: 0.5px solid rgba(0,0,0,0.05); cursor: pointer; transition: background 0.15s; display: flex; gap: 12px; align-items: flex-start; }
        .list-item:last-child { border-bottom: none; }
        .list-item:hover { background: rgba(139,92,246,0.04); }
        .list-item.active { background: rgba(139,92,246,0.07); border-left: 3px solid #8B5CF6; }
        .li-avatar { width: 36px; height: 36px; border-radius: 11px; background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(16,185,129,0.15)); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #8B5CF6; flex-shrink: 0; }
        .li-dr { font-size: 13px; font-weight: 600; color: #1e293b; }
        .li-date { font-size: 11px; color: #94a3b8; margin-top: 2px; }
        .li-motif { font-size: 11px; color: #64748b; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

        /* Right detail */
        .detail-col { position: sticky; top: calc(70px + 2rem); }
        .detail-card { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.9); border-radius: 24px; padding: 0; overflow: hidden; box-shadow: 0 2px 12px rgba(139,92,246,0.04); }

        /* Detail header */
        .det-hd { padding: 22px 24px; background: linear-gradient(135deg, #8B5CF6, #10B981); color: white; }
        .det-hd-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .det-dr { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; }
        .det-date-badge { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 5px 12px; font-size: 12px; font-weight: 600; }
        .det-type-badge { display: inline-block; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 600; }

        /* Detail body */
        .det-body { padding: 22px 24px; display: flex; flex-direction: column; gap: 18px; }
        .det-section-title { font-size: 11px; font-weight: 700; color: #8B5CF6; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .det-content { font-size: 13px; color: #334155; line-height: 1.7; background: rgba(139,92,246,0.04); border: 1px solid rgba(139,92,246,0.08); border-radius: 12px; padding: 12px 14px; white-space: pre-wrap; }
        .det-empty { font-size: 12px; color: #94a3b8; font-style: italic; }
        .det-divider { border: none; border-top: 0.5px solid rgba(0,0,0,0.07); margin: 0; }

        /* Empty state */
        .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
        .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: .4; }

        /* Skeleton */
        .skeleton { background: linear-gradient(90deg,rgba(0,0,0,0.05) 25%,rgba(0,0,0,0.08) 50%,rgba(0,0,0,0.05) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>

      <div className="pg-root">
        <Sidebar stats={stats} />
        <Navbar title="Mes Consultations" subtitle={`Bonjour ${username}`} />

        <main className="pg-main">

          {/* Header */}
          <div className="pg-header">
            <div>
              <div className="pg-title">Mes Consultations</div>
              <div className="pg-sub">
                {consultations.length} consultation{consultations.length !== 1 ? "s" : ""} dans votre historique
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            {[
              { icon: "📅", val: stats.rendezvous,    lbl: "Rendez-vous" },
              { icon: "🩺", val: stats.consultations, lbl: "Consultations" },
              { icon: "💊", val: stats.ordonnances,   lbl: "Ordonnances" },
            ].map(s => (
              <div key={s.lbl} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Split layout */}
          <div className="split">

            {/* ── Liste ── */}
            <div className="list-col">
              <div className="search-wrap">
                <span style={{ fontSize: 15, color: "#94a3b8" }}>🔍</span>
                <input className="search-input"
                  placeholder="Rechercher un médecin, motif..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <div className="list-card">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="list-item">
                      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 13, width: "70%", marginBottom: 6 }} />
                        <div className="skeleton" style={{ height: 11, width: "50%" }} />
                      </div>
                    </div>
                  ))
                ) : filtered.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🩺</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune consultation</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {search ? "Essayez un autre terme." : "Votre historique est vide."}
                    </div>
                  </div>
                ) : (
                  filtered.map(c => (
                    <div key={c.id}
                      className={`list-item${selected?.id === c.id ? " active" : ""}`}
                      onClick={() => setSelected(c)}>
                      <div className="li-avatar">
                        {c.medecin_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="li-dr">Dr. {c.medecin_name || "—"}</div>
                        <div className="li-date">
                          {c.date_heure
                            ? new Date(c.date_heure).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                            : "—"}
                        </div>
                        {c.motif && <div className="li-motif">{c.motif}</div>}
                      </div>
                      {c.type_consultation && (() => {
                        const t = TYPE_COLORS[c.type_consultation] || { color: "#534AB7", bg: "#EEEDFE" };
                        return (
                          <span style={{ fontSize: 10, fontWeight: 700, color: t.color, background: t.bg, padding: "3px 8px", borderRadius: 20, flexShrink: 0, alignSelf: "flex-start" }}>
                            {c.type_consultation.split(" ")[0]}
                          </span>
                        );
                      })()}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Détail ── */}
            <div className="detail-col">
              {!selected ? (
                <div className="detail-card">
                  <div className="empty-state" style={{ padding: "80px 20px" }}>
                    <div className="empty-icon">📋</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>
                      Sélectionnez une consultation
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                      Le détail apparaîtra ici
                    </div>
                  </div>
                </div>
              ) : (
                <div className="detail-card">
                  {/* Header dégradé */}
                  <div className="det-hd">
                    <div className="det-hd-top">
                      <div className="det-dr">Dr. {selected.medecin_name || "—"}</div>
                      <span className="det-date-badge">
                        {selected.date_heure
                          ? new Date(selected.date_heure).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                          : "—"}
                      </span>
                    </div>
                    {selected.type_consultation && (
                      <span className="det-type-badge">{selected.type_consultation}</span>
                    )}
                  </div>

                  <div className="det-body">

                    {/* Motif */}
                    <div>
                      <div className="det-section-title">🔍 Motif de consultation</div>
                      {selected.motif
                        ? <div className="det-content">{selected.motif}</div>
                        : <div className="det-empty">Non renseigné</div>}
                    </div>

                    <hr className="det-divider" />

                    {/* Diagnostic */}
                    <div>
                      <div className="det-section-title">🩺 Diagnostic</div>
                      {selected.diagnostic
                        ? <div className="det-content">{selected.diagnostic}</div>
                        : <div className="det-empty">Non renseigné</div>}
                    </div>

                    <hr className="det-divider" />

                    {/* Recommandations */}
                    <div>
                      <div className="det-section-title">📝 Recommandations</div>
                      {selected.notes
                        ? <div className="det-content">{selected.notes}</div>
                        : <div className="det-empty">Aucune recommandation</div>}
                    </div>

                    {/* Bouton ordonnances liées */}
                    <div style={{ paddingTop: 4 }}>
                      <button
                        onClick={() => router.push("/dashboard/patient/ordonnances")}
                        style={{
                          width: "100%",
                          background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                          border: "none",
                          borderRadius: 14,
                          color: "white",
                          fontSize: 13,
                          fontWeight: 700,
                          padding: "12px",
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-1px)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                      >
                        💊 Voir les ordonnances associées
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}