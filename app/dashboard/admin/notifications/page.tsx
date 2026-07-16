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

const C = {
  bg: "#F7F8FC",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F2FA",
  border: "#E4E8F0",
  borderStrong: "#CBD2E0",
  text: "#0F1623",
  textSub: "#5A6478",
  textMuted: "#9AA3B5",
  teal: "#00C4A1",
  tealLight: "#E6FAF7",
  tealDark: "#009E82",
  violet: "#7C5CFC",
  violetLight: "#EEE9FF",
  sky: "#2196F3",
  skyLight: "#E3F2FD",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  red: "#EF4444",
  redLight: "#FEE2E2",
  green: "#10B981",
  greenLight: "#D1FAE5",
};

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
  const { token, isLoading, user } = useAuth();
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        @keyframes fadeUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes ping    { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2.2);opacity:0} }

        .panel {
          background: ${C.surface};
          border-radius: 16px;
          border: 1px solid ${C.border};
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          animation: fadeUp 0.45s ease both;
        }

        /* Header actions */
        .btn-mark-all {
          display:flex; align-items:center; gap:7px; padding:9px 16px;
          background:${C.tealLight}; border:1px solid ${C.teal}30; border-radius:10px;
          font-family:inherit; font-size:13px; font-weight:600; color:${C.tealDark};
          cursor:pointer; transition:all .2s ease;
        }
        .btn-mark-all:hover { transform: translateY(-1px); }

        .btn-clear {
          display:flex; align-items:center; gap:7px; padding:9px 16px;
          background:${C.redLight}; border:1px solid ${C.red}30; border-radius:10px;
          font-family:inherit; font-size:13px; font-weight:600; color:${C.red};
          cursor:pointer; transition:all .2s ease;
        }
        .btn-clear:hover { transform: translateY(-1px); }

        /* Stats */
        .stats-row {
          display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px;
        }
        .stat-card-n {
          display:flex; align-items:center; gap:14px; padding:16px 20px;
        }
        .stat-icon-n {
          width:42px; height:42px; border-radius:12px;
          display:flex; align-items:center; justify-content:center; font-size:19px;
          flex-shrink:0;
        }
        .stat-val-n { font-size:22px; font-weight:800; color:${C.text}; line-height:1; }
        .stat-lbl-n { font-size:11px; color:${C.textMuted}; margin-top:2px; }

        /* Filters */
        .filters { display:flex; gap:8px; margin-bottom:20px; }
        .filter-btn {
          padding:9px 18px; border-radius:99px; border:1px solid ${C.border};
          background:${C.surface}; font-family:inherit; font-size:13px; font-weight:600;
          color:${C.textSub}; cursor:pointer; transition:all .2s ease;
        }
        .filter-btn:hover { border-color: ${C.violet}40; color: ${C.violet}; }
        .filter-btn.active {
          background: ${C.violet}; color: white; border-color: transparent;
          box-shadow: 0 4px 12px ${C.violet}40;
        }

        /* List */
        .notif-list { display:flex; flex-direction:column; gap:8px; }

        .notif-item {
          background:${C.surface}; border-radius:14px; padding:16px 20px;
          display:flex; align-items:center; gap:16px; border:1px solid ${C.border};
          transition:all .2s ease; position:relative; overflow:hidden;
        }
        .notif-item.unread { background:${C.violetLight}; border-color:${C.violet}30; }
        .notif-item:hover { box-shadow: 0 4px 12px rgba(15,22,35,.06); }

        .notif-item::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:${C.border}; }
        .notif-item.unread::before { background: ${C.violet}; }

        .notif-icon-wrap {
          width:42px; height:42px; border-radius:12px;
          display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;
        }
        .notif-icon-wrap.unread { background:${C.violetLight}; }
        .notif-icon-wrap.read   { background:${C.surfaceAlt}; }

        .notif-content { flex:1; min-width:0; }
        .notif-msg     { font-size:14px; line-height:1.6; margin:0; }
        .notif-msg.unread { font-weight:600; color:${C.text}; }
        .notif-msg.read   { font-weight:400; color:${C.textMuted}; }

        .notif-status { display:flex; align-items:center; gap:6px; margin-top:5px; font-size:11px; font-weight:600; }
        .notif-status.unread { color:${C.violet}; }
        .notif-status.read   { color:${C.textMuted}; }

        .ping-dot { position:relative; width:8px; height:8px; flex-shrink:0; }
        .ping-dot span { display:block; width:8px; height:8px; border-radius:50%; background:${C.violet}; position:absolute; }
        .ping-dot span:first-child { animation:ping 1.5s cubic-bezier(0,0,.2,1) infinite; }

        .item-actions { display:flex; gap:6px; align-items:center; flex-shrink:0; }
        .mark-btn {
          padding:6px 12px; border:1px solid ${C.teal}30; border-radius:8px;
          background:${C.tealLight}; font-family:inherit; font-size:11px; font-weight:700;
          color:${C.tealDark}; cursor:pointer; transition:all .2s ease;
        }
        .mark-btn:hover    { transform: translateY(-1px); }
        .mark-btn:disabled { opacity:.4; cursor:not-allowed; }
        .del-btn {
          padding:6px 10px; border:1px solid ${C.red}30; border-radius:8px;
          background:${C.redLight}; font-family:inherit; font-size:11px; font-weight:700;
          color:${C.red}; cursor:pointer; transition:all .2s ease;
        }
        .del-btn:hover    { transform: translateY(-1px); }
        .del-btn:disabled { opacity:.4; cursor:not-allowed; }

        /* Empty */
        .empty-state { text-align:center; padding:80px 20px; }

        /* Skeleton */
        .skeleton { background:${C.surfaceAlt}; border-radius:8px; animation:shimmer 1.4s infinite; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.surfaceAlt}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
        <Sidebar />
        <main style={{ marginLeft: 260, flex: 1, padding: "5rem 2.4rem 3rem", overflowX: "hidden" }}>
          <Navbar title="Notifications" subtitle={`Bonjour ${user?.username || "Admin"} 👋`} />

          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: "1.6rem", animation: "fadeUp 0.35s ease both", flexWrap: "wrap", gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 11, color: C.violet, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
                🔔 Administration
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-0.5px" }}>
                Notifications
              </h1>
              <p style={{ color: C.textMuted, fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                {data.length} notification{data.length !== 1 ? "s" : ""}
                {unreadCount > 0 && ` · ${unreadCount} non lue${unreadCount !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
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
              { icon: "🔔", val: data.length, lbl: "Total", color: C.sky, bg: C.skyLight },
              { icon: "🟣", val: unreadCount, lbl: "Non lues", color: C.violet, bg: C.violetLight },
              { icon: "✅", val: data.length - unreadCount, lbl: "Lues", color: C.green, bg: C.greenLight },
              { icon: "👥", val: stats.patients, lbl: "Patients", color: C.teal, bg: C.tealLight },
            ].map((s, i) => (
              <div key={s.lbl} className="panel stat-card-n" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="stat-icon-n" style={{ background: s.bg }}>{s.icon}</div>
                <div>
                  <div className="stat-val-n" style={{ color: s.color }}>{s.val}</div>
                  <div className="stat-lbl-n">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filtres */}
          <div className="filters" style={{ animation: "fadeUp 0.4s ease both" }}>
            {(["all", "unread", "read"] as const).map((f) => (
              <button
                key={f}
                className={`filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Toutes" : f === "unread" ? `Non lues (${unreadCount})` : "Lues"}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="notif-list" style={{ animation: "fadeUp 0.45s ease both" }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="panel" style={{ display: "flex", gap: 16, padding: "16px 20px" }}>
                  <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, width: "65%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 11, width: "20%" }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="panel empty-state">
                <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.25 }}>🔔</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.textSub }}>
                  Aucune notification
                </div>
                <div style={{ fontSize: 13, marginTop: 6, color: C.textMuted }}>
                  {filter !== "all" ? "Changez le filtre." : "Tout est à jour."}
                </div>
              </div>
            ) : (
              filtered.map((n) => (
                <div key={n.id} className={`notif-item${n.lu ? " read" : " unread"}`}>
                  <div className={`notif-icon-wrap${n.lu ? " read" : " unread"}`}>
                    {getIcon(n.message)}
                  </div>

                  <div className="notif-content">
                    <p className={`notif-msg${n.lu ? " read" : " unread"}`}>{n.message}</p>
                    <div className={`notif-status${n.lu ? " read" : " unread"}`}>
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
                      <button className="mark-btn" disabled={marking === n.id} onClick={() => markRead(n.id)}>
                        {marking === n.id ? "…" : "Marquer lu"}
                      </button>
                    )}
                    <button className="del-btn" disabled={deleting === n.id} onClick={() => deleteNotif(n.id)}>
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