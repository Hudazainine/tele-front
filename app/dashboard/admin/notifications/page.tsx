"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import api from "../../../../lib/api";

interface Notification {
  id: number;
  message: string;
  lu: boolean;
  user: number;
}

interface Stats {
  patients: number;
  medecins: number;
  rendezvous: number;
  consultations: number;
}

function getIcon(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("rendez-vous") || m.includes("rdv")) return "📅";
  if (m.includes("consultation")) return "🩺";
  if (m.includes("ordonnance")) return "💊";
  if (m.includes("paiement") || m.includes("avance")) return "💳";
  if (m.includes("certificat")) return "📄";
  if (m.includes("confirmé") || m.includes("confirme")) return "✅";
  if (m.includes("annul")) return "❌";
  if (m.includes("patient")) return "👤";
  if (m.includes("médecin") || m.includes("medecin")) return "⚕️";
  return "🔔";
}

export default function AdminNotifications() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    patients: 0,
    medecins: 0,
    rendezvous: 0,
    consultations: 0,
  });
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const fetchNotifs = () =>
    api
      .get("notifications/")
      .then((r) => {
        const sorted = [...r.data].sort((a: Notification, b: Notification) =>
          a.lu === b.lu ? 0 : a.lu ? 1 : -1,
        );
        setData(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([
      api.get("patients/"),
      api.get("medecins/"),
      api.get("rendezvous/"),
      api.get("consultations/"),
    ])
      .then(([p, m, r, c]) => {
        setStats({
          patients: p.data.length,
          medecins: m.data.length,
          rendezvous: r.data.length,
          consultations: c.data.length,
        });
      })
      .catch(() => {});

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 8000);
    return () => clearInterval(interval);
  }, [token, isLoading]);

  const markRead = async (id: number) => {
    setMarking(id);
    try {
      await api.patch(`notifications/${id}/`, { lu: true });
      setData((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lu: true } : n)),
      );
    } catch {}
    setMarking(null);
  };

  const markAllRead = async () => {
    await Promise.all(
      data
        .filter((n) => !n.lu)
        .map((n) =>
          api.patch(`notifications/${n.id}/`, { lu: true }).catch(() => {}),
        ),
    );
    setData((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  const deleteNotif = async (id: number) => {
    setDeleting(id);
    try {
      await api.delete(`notifications/${id}/`);
      setData((prev) => prev.filter((n) => n.id !== id));
    } catch {}
    setDeleting(null);
  };

  const clearAll = async () => {
    if (!confirm("Supprimer toutes les notifications ?")) return;
    await Promise.all(
      data.map((n) => api.delete(`notifications/${n.id}/`).catch(() => {})),
    );
    setData([]);
  };

  if (isLoading) return null;

  const unreadCount = data.filter((n) => !n.lu).length;
  const filtered = data.filter((n) => {
    if (filter === "unread") return !n.lu;
    if (filter === "read") return n.lu;
    return true;
  });

  return (
    <PrivateRoute allowedRoles={["admin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes fadeInUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes ping     { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 8px rgba(34,211,165,.3)} 50%{box-shadow:0 0 20px rgba(34,211,165,.6)} }

        /* ── Dark admin theme ── */
        .admin-root { min-height:100vh; background:linear-gradient(180deg,#0d1520 0%,#131f2e 100%); font-family:'DM Sans',sans-serif; display:flex; }
        .admin-main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }

        .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; animation:fadeInUp .4s ease; }
        .page-title  { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; color:#f0f4ff; }
        .page-sub    { font-size:13px; color:#4a6080; margin-top:4px; }

        .header-actions { display:flex; gap:10px; }
        .btn-mark-all { display:flex; align-items:center; gap:7px; padding:9px 16px; background:rgba(34,211,165,.08); border:1.5px solid rgba(34,211,165,.2); border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#22d3a5; cursor:pointer; transition:all .2s; }
        .btn-mark-all:hover { background:rgba(34,211,165,.15); border-color:rgba(34,211,165,.4); }
        .btn-clear { display:flex; align-items:center; gap:7px; padding:9px 16px; background:rgba(239,68,68,.07); border:1.5px solid rgba(239,68,68,.2); border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#f87171; cursor:pointer; transition:all .2s; }
        .btn-clear:hover { background:rgba(239,68,68,.14); border-color:rgba(239,68,68,.4); }

        /* Stats */
        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; animation:fadeInUp .4s ease .05s backwards; }
        .stat-card { background:rgba(255,255,255,.04); border:1px solid #1e3050; border-radius:18px; padding:16px 20px; display:flex; align-items:center; gap:14px; transition:all .25s; cursor:default; }
        .stat-card:hover { background:rgba(255,255,255,.07); border-color:#2a4060; }
        .stat-icon { width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#8B5CF6,#22d3a5); display:flex; align-items:center; justify-content:center; font-size:19px; flex-shrink:0; box-shadow:0 4px 12px rgba(139,92,246,.3); }
        .stat-val  { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#f0f4ff; line-height:1; }
        .stat-lbl  { font-size:11px; color:#4a6080; margin-top:2px; }
        .stat-unread { color:#22d3a5 !important; }

        /* Filtres */
        .filters { display:flex; gap:8px; margin-bottom:20px; animation:fadeInUp .4s ease .1s backwards; }
        .filter-btn { padding:8px 18px; border-radius:99px; border:1.5px solid #1e3050; background:transparent; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#4a6080; cursor:pointer; transition:all .2s; }
        .filter-btn:hover  { border-color:rgba(34,211,165,.4); color:#22d3a5; }
        .filter-btn.active { background:linear-gradient(135deg,#8B5CF6,#22d3a5); color:white; border-color:transparent; box-shadow:0 4px 14px rgba(139,92,246,.3); }

        /* Liste */
        .notif-list { display:flex; flex-direction:column; gap:8px; animation:fadeInUp .4s ease .15s backwards; }

        .notif-item { background:rgba(255,255,255,.03); border-radius:16px; padding:16px 20px; display:flex; align-items:center; gap:16px; border:1px solid #1e3050; transition:all .25s; position:relative; overflow:hidden; }
        .notif-item.unread { background:rgba(139,92,246,.05); border-color:rgba(139,92,246,.2); }
        .notif-item:hover  { background:rgba(255,255,255,.06); border-color:#2a4060; }
        .notif-item.unread:hover { background:rgba(139,92,246,.09); border-color:rgba(139,92,246,.35); }

        .notif-item::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:#1e3050; }
        .notif-item.unread::before { background:linear-gradient(180deg,#8B5CF6,#22d3a5); animation:glow 2.5s ease infinite; }

        .notif-icon-wrap { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .notif-icon-wrap.unread { background:rgba(139,92,246,.12); }
        .notif-icon-wrap.read   { background:rgba(255,255,255,.04); }

        .notif-content { flex:1; min-width:0; }
        .notif-msg     { font-size:14px; line-height:1.6; }
        .notif-msg.unread { font-weight:600; color:#c8d8f0; }
        .notif-msg.read   { font-weight:400; color:#4a6080; }

        .notif-status { display:flex; align-items:center; gap:6px; margin-top:5px; font-size:11px; font-weight:600; }
        .notif-status.unread { color:#8B5CF6; }
        .notif-status.read   { color:#2a4060; }

        .ping-dot { position:relative; width:8px; height:8px; flex-shrink:0; }
        .ping-dot span { display:block; width:8px; height:8px; border-radius:50%; background:linear-gradient(135deg,#8B5CF6,#22d3a5); position:absolute; }
        .ping-dot span:first-child { animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite; }

        .item-actions { display:flex; gap:6px; align-items:center; flex-shrink:0; }
        .mark-btn { padding:5px 11px; border:1.5px solid rgba(34,211,165,.2); border-radius:8px; background:rgba(34,211,165,.06); font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; color:#22d3a5; cursor:pointer; transition:all .2s; }
        .mark-btn:hover    { background:rgba(34,211,165,.14); border-color:rgba(34,211,165,.5); }
        .mark-btn:disabled { opacity:.4; cursor:not-allowed; }
        .del-btn  { padding:5px 10px; border:1.5px solid rgba(239,68,68,.15); border-radius:8px; background:rgba(239,68,68,.05); font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; color:#f87171; cursor:pointer; transition:all .2s; }
        .del-btn:hover    { background:rgba(239,68,68,.12); border-color:rgba(239,68,68,.4); }
        .del-btn:disabled { opacity:.4; cursor:not-allowed; }

        /* Empty */
        .empty-state { text-align:center; padding:80px 20px; }

        /* Skeleton */
        .skeleton { background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
      `}</style>

      <div className="admin-root">
        <Sidebar stats={stats} />
        <Navbar title="Notifications" subtitle="Administration" />

        <main className="admin-main">
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="page-title">🔔 Notifications</div>
              <div className="page-sub">
                {data.length} notification{data.length !== 1 ? "s" : ""}
                {unreadCount > 0 &&
                  ` · ${unreadCount} non lue${unreadCount !== 1 ? "s" : ""}`}
              </div>
            </div>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button className="btn-mark-all" onClick={markAllRead}>
                  ✓ Tout marquer lu
                </button>
              )}
              {data.length > 0 && (
                <button className="btn-clear" onClick={clearAll}>
                  🗑 Tout supprimer
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            {[
              { icon: "🔔", val: data.length, lbl: "Total", className: "" },
              {
                icon: "🟣",
                val: unreadCount,
                lbl: "Non lues",
                className: "stat-unread",
              },
              {
                icon: "✅",
                val: data.length - unreadCount,
                lbl: "Lues",
                className: "",
              },
              {
                icon: "👥",
                val: stats.patients,
                lbl: "Patients",
                className: "",
              },
            ].map((s) => (
              <div key={s.lbl} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div>
                  <div className={`stat-val ${s.className}`}>{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div className="filters">
            {(["all", "unread", "read"] as const).map((f) => (
              <button
                key={f}
                className={`filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "Toutes"
                  : f === "unread"
                    ? `Non lues (${unreadCount})`
                    : "Lues"}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="notif-list">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,.03)",
                    borderRadius: 16,
                    padding: "16px 20px",
                    display: "flex",
                    gap: 16,
                    border: "1px solid #1e3050",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      className="skeleton"
                      style={{ height: 14, width: "65%", marginBottom: 8 }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 11, width: "20%" }}
                    />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.2 }}>
                  🔔
                </div>
                <div
                  style={{ fontSize: 16, fontWeight: 600, color: "#2a4060" }}
                >
                  Aucune notification
                </div>
                <div style={{ fontSize: 13, marginTop: 6, color: "#1e3050" }}>
                  {filter !== "all" ? "Changez le filtre." : "Tout est à jour."}
                </div>
              </div>
            ) : (
              filtered.map((n, i) => (
                <div
                  key={n.id}
                  className={`notif-item${n.lu ? " read" : " unread"}`}
                >
                  <div
                    className={`notif-icon-wrap${n.lu ? " read" : " unread"}`}
                  >
                    {getIcon(n.message)}
                  </div>

                  <div className="notif-content">
                    <p className={`notif-msg${n.lu ? " read" : " unread"}`}>
                      {n.message}
                    </p>
                    <div
                      className={`notif-status${n.lu ? " read" : " unread"}`}
                    >
                      {!n.lu && (
                        <div className="ping-dot">
                          <span />
                          <span />
                        </div>
                      )}
                      {n.lu ? "✓ Lu" : "Non lu"}
                    </div>
                  </div>

                  <div className="item-actions">
                    {!n.lu && (
                      <button
                        className="mark-btn"
                        disabled={marking === n.id}
                        onClick={() => markRead(n.id)}
                      >
                        {marking === n.id ? "…" : "Marquer lu"}
                      </button>
                    )}
                    <button
                      className="del-btn"
                      disabled={deleting === n.id}
                      onClick={() => deleteNotif(n.id)}
                    >
                      {deleting === n.id ? "…" : "🗑"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
