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
  rendezvous: number;
  consultations: number;
  ordonnances: number;
  notifications: number;
}

export default function PatientNotifications() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
    notifications: 0,
  });
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const fetchNotifs = () =>
    api
      .get("notifications/")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

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
    ])
      .then(([r, c, o]) => {
        setStats((s) => ({
          ...s,
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
        }));
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
    const unread = data.filter((n) => !n.lu);
    await Promise.all(
      unread.map((n) =>
        api.patch(`notifications/${n.id}/`, { lu: true }).catch(() => {}),
      ),
    );
    setData((prev) => prev.map((n) => ({ ...n, lu: true })));
  };

  if (isLoading) return null;

  const unreadCount = data.filter((n) => !n.lu).length;
  const filtered = data.filter((n) => {
    if (filter === "unread") return !n.lu;
    if (filter === "read") return n.lu;
    return true;
  });

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes fadeInUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes ping      { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2);opacity:0} }

        .notif-root { min-height:100vh; background:#F8FAFC; background-image:radial-gradient(at 0% 0%,rgba(139,92,246,.07) 0,transparent 50%),radial-gradient(at 100% 100%,rgba(16,185,129,.07) 0,transparent 50%); font-family:'DM Sans',sans-serif; display:flex; }
        .notif-main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }

        /* Header */
        .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; animation:fadeInUp .4s ease; }
        .page-title  { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; color:#0F172A; }
        .page-sub    { font-size:13px; color:#94A3B8; margin-top:4px; }

        .btn-mark-all { display:flex; align-items:center; gap:7px; padding:10px 18px; background:white; border:1.5px solid #E2E8F0; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#64748B; cursor:pointer; transition:all .2s; }
        .btn-mark-all:hover { border-color:rgba(139,92,246,.4); color:#7C3AED; background:rgba(139,92,246,.04); }

        /* Stats */
        .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:24px; animation:fadeInUp .4s ease .05s backwards; }
        .stat-card { background:rgba(255,255,255,.85); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.9); border-radius:18px; padding:16px 20px; display:flex; align-items:center; gap:12px; box-shadow:0 2px 8px rgba(0,0,0,.03); }
        .stat-icon { width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,#378ADD,#10B981); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; box-shadow:0 4px 10px rgba(139,92,246,.25); }
        .stat-val  { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#0F172A; line-height:1; }
        .stat-lbl  { font-size:11px; color:#94A3B8; margin-top:2px; }

        /* Filtres */
        .filters { display:flex; gap:8px; margin-bottom:20px; animation:fadeInUp .4s ease .1s backwards; }
        .filter-btn { padding:8px 18px; border-radius:99px; border:1.5px solid #E2E8F0; background:white; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#64748B; cursor:pointer; transition:all .2s; }
        .filter-btn:hover { border-color:rgba(139,92,246,.3); color:#7C3AED; }
        .filter-btn.active { background:linear-gradient(135deg,#378ADD,#10B981); color:white; border-color:transparent; box-shadow:0 4px 12px rgba(139,92,246,.25); }

        /* Liste */
        .notif-list { display:flex; flex-direction:column; gap:10px; max-width:760px; animation:fadeInUp .4s ease .15s backwards; }

        .notif-item { background:white; border-radius:18px; padding:18px 22px; display:flex; align-items:flex-start; gap:16px; border:1.5px solid #F1F5F9; transition:all .25s; position:relative; overflow:hidden; }
        .notif-item.unread { border-color:rgba(139,92,246,.2); background:rgba(139,92,246,.02); }
        .notif-item:hover { transform:translateX(4px); box-shadow:0 4px 20px rgba(0,0,0,.06); }
        .notif-item.unread:hover { box-shadow:0 4px 20px rgba(139,92,246,.12); }

        /* Barre gauche */
        .notif-item::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:#F1F5F9; border-radius:0 2px 2px 0; transition:background .2s; }
        .notif-item.unread::before { background:linear-gradient(180deg,#378ADD,#10B981); }

        .notif-icon-wrap { width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .notif-icon-wrap.unread { background:linear-gradient(135deg,rgba(139,92,246,.12),rgba(16,185,129,.12)); }
        .notif-icon-wrap.read   { background:#F8FAFC; }

        .notif-content { flex:1; min-width:0; }
        .notif-msg    { font-size:14px; color:#1E293B; line-height:1.6; }
        .notif-msg.read { color:#64748B; font-weight:400; }
        .notif-msg.unread { font-weight:600; }
        .notif-status { display:flex; align-items:center; gap:6px; margin-top:6px; font-size:11px; font-weight:600; }
        .notif-status.unread { color:#378ADD; }
        .notif-status.read   { color:#94A3B8; }

        .ping-dot { position:relative; width:8px; height:8px; flex-shrink:0; }
        .ping-dot span { display:block; width:8px; height:8px; border-radius:50%; background:linear-gradient(135deg,#378ADD,#10B981); position:absolute; }
        .ping-dot span:first-child { animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite; }

        .mark-btn { padding:6px 12px; border:1.5px solid rgba(139,92,246,.2); border-radius:8px; background:rgba(139,92,246,.05); font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; color:#378ADD; cursor:pointer; transition:all .2s; white-space:nowrap; flex-shrink:0; }
        .mark-btn:hover { background:rgba(139,92,246,.12); border-color:rgba(139,92,246,.4); }
        .mark-btn:disabled { opacity:.5; cursor:not-allowed; }

        /* Empty */
        .empty-state { text-align:center; padding:80px 20px; color:#94A3B8; }

        /* Skeleton */
        .skeleton { background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
      `}</style>

      <div className="notif-root">
        <Sidebar stats={stats} />
        <Navbar title="Notifications" subtitle="Espace patient" />

        <main className="notif-main">
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
            {unreadCount > 0 && (
              <button className="btn-mark-all" onClick={markAllRead}>
                ✓ Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="stats-row">
            {[
              { icon: "🔔", val: data.length, lbl: "Total" },
              { icon: "🟣", val: unreadCount, lbl: "Non lues" },
              { icon: "✅", val: data.length - unreadCount, lbl: "Lues" },
            ].map((s) => (
              <div key={s.lbl} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div>
                  <div className="stat-val">{s.val}</div>
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
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "white",
                    borderRadius: 18,
                    padding: "18px 22px",
                    display: "flex",
                    gap: 16,
                    border: "1.5px solid #F1F5F9",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      className="skeleton"
                      style={{ height: 14, width: "75%", marginBottom: 8 }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: 11, width: "30%" }}
                    />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.3 }}>
                  🔔
                </div>
                <div
                  style={{ fontSize: 16, fontWeight: 600, color: "#64748B" }}
                >
                  {filter === "unread"
                    ? "Aucune notification non lue"
                    : "Aucune notification"}
                </div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  {filter !== "all"
                    ? "Changez le filtre pour en voir d'autres."
                    : "Vous êtes à jour !"}
                </div>
              </div>
            ) : (
              filtered.map((n, i) => (
                <div
                  key={n.id}
                  className={`notif-item${n.lu ? " read" : " unread"}`}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div
                    className={`notif-icon-wrap${n.lu ? " read" : " unread"}`}
                  >
                    🔔
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
                  {!n.lu && (
                    <button
                      className="mark-btn"
                      disabled={marking === n.id}
                      onClick={() => markRead(n.id)}
                    >
                      {marking === n.id ? "…" : "Marquer lu"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
