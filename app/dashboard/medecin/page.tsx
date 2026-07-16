"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import PrivateRoute from "../../../components/PrivateRoute";
import api from "../../../lib/api";

// ─────────────────────────────────────────────────────────────
// ICONS (Intégrés directement ici pour éviter les erreurs d'import)
// ─────────────────────────────────────────────────────────────

const Icon = ({
  path,
  size = 16,
  color = "currentColor",
  style,
}: {
  path: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: path }}
    style={{ flexShrink: 0, ...style }}
  />
);

const P: Record<string, string> = {
  users:
    "<path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/>",
  calendar:
    "<rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/>",
  stethoscope:
    "<path d='M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3'/><path d='M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4'/><circle cx='20' cy='10' r='2'/>",
  clipboard:
    "<path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/><rect x='8' y='2' width='8' height='4' rx='1' ry='1'/>",
  activity: "<polyline points='22 12 18 12 15 21 9 3 6 12 2 12'/>",
  clock:
    "<circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/>",
  bell: "<path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'/><path d='M13.73 21a2 2 0 0 1-3.46 0'/>",
  calendarCheck:
    "<rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/><path d='M9 16l2 2 4-4'/>",
  user: "<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/>",
  alertCircle:
    "<circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/>",
  trendingUp:
    "<polyline points='23 6 13.5 15.5 8.5 10.5 1 18'/><polyline points='17 6 23 6 23 12'/>",
  sun: "<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41'/>",
  arrowRight:
    "<line x1='5' y1='12' x2='19' y2='12'/><polyline points='12 5 19 12 12 19'/>",
  zap: "<polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'/>",
};

// ─────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────

const C = {
  violet: "#7C3AED",
  emerald: "#059669",
  violetLight: "#8B5CF6",
  emeraldLight: "#10B981",
  ink: "#0F0A1E",
  slate: "#64748B",
  muted: "#94A3B8",
  surface: "rgba(255,255,255,0.72)",
  border: "rgba(124,58,237,0.10)",
  grad: "linear-gradient(135deg, #7C3AED 0%, #059669 100%)",
  gradSoft: "linear-gradient(135deg, #EDE9FE 0%, #D1FAE5 100%)",
};

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Stats {
  patients: number;
  rendezvous: number;
  consultations: number;
  ordonnances: number;
  controles: number;
}

interface RdvAPI {
  id: number;
  patient_name: string;
  date_heure: string;
  status: string;
}

interface NotifAPI {
  id: number;
  message: string;
  lu: boolean;
}

// ─────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────

const Cell = ({
  children,
  style = {},
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  className?: string;
}) => (
  <div
    onClick={onClick}
    className={className}
    style={{
      background: C.surface,
      backdropFilter: "blur(14px)",
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      padding: "16px 18px",
      overflow: "hidden",
      position: "relative",
      cursor: onClick ? "pointer" : "default",
      transition:
        "transform 0.28s cubic-bezier(.4,0,.2,1), box-shadow 0.28s, border-color 0.28s",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      ...style,
    }}
    onMouseEnter={(e) => {
      if (!onClick) return;
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
      (e.currentTarget as HTMLDivElement).style.boxShadow =
        `0 12px 28px -8px ${C.violet}28`;
      (e.currentTarget as HTMLDivElement).style.borderColor = `${C.violet}33`;
    }}
    onMouseLeave={(e) => {
      if (!onClick) return;
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      (e.currentTarget as HTMLDivElement).style.boxShadow =
        "0 1px 4px rgba(0,0,0,0.04)";
      (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
    }}
  >
    {children}
  </div>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p
    style={{
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "1.2px",
      textTransform: "uppercase",
      color: C.muted,
      margin: "0 0 6px",
    }}
  >
    {children}
  </p>
);

const Chip = ({ iconKey, size = 34 }: { iconKey: string; size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 10,
      flexShrink: 0,
      background: C.grad,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 4px 12px -3px ${C.violet}55`,
    }}
  >
    <Icon path={P[iconKey]} size={size * 0.44} color="white" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function MedecinDashboard() {
  const { token, isLoading: authLoading, username } = useAuth();
  const router = useRouter();

  // États principaux
  const [stats, setStats] = useState<Stats>({
    patients: 0,
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
    controles: 0,
  });
  const [allRdv, setAllRdv] = useState<RdvAPI[]>([]);
  const [allNotifs, setAllNotifs] = useState<NotifAPI[]>([]);

  // États pour l'UX (Chargement / Erreur)
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [time, setTime] = useState(new Date());

  // Horloge
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Récupération des données
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    setDataLoading(true);
    setDataError(null);

    Promise.all([
      api.get("patients/"),
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("ordonnances/"),
      api.get("notifications/"),
      api.get("controles/"),
    ])
      .then(([p, r, c, o, n, ctrl]) => {
        setStats({
          patients: p.data.length,
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
          controles: ctrl.data.results?.length ?? ctrl.data.length ?? 0,
        });

        // Trier les RDV par date
        const sorted = [...r.data].sort(
          (a: RdvAPI, b: RdvAPI) =>
            new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime(),
        );

        setAllRdv(sorted);
        setAllNotifs(n.data);
        setDataLoading(false);
      })
      .catch((err) => {
        console.error("Erreur de chargement dashboard:", err);
        setDataError("Impossible de charger les données. Veuillez réessayer.");
        setDataLoading(false);
      });
  }, [token, authLoading, router]);

  // ── OPTIMISATION: Calculs dérivés memoïsés ─────────────────────
  const derivedData = useMemo(() => {
    const now = time;
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    // 1. RDV du jour
    const todayRdv = allRdv
      .filter((r) => {
        const d = new Date(r.date_heure);
        return d >= startOfDay && d < endOfDay;
      })
      .sort(
        (a, b) =>
          new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime(),
      );

    const nextIndex = todayRdv.findIndex(
      (r) => new Date(r.date_heure).getTime() >= now.getTime(),
    );

    // 2. Données hebdomadaires
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfDay);
      d.setDate(d.getDate() - 6 + i);
      const count = allRdv.filter((r) => {
        const rd = new Date(r.date_heure);
        return (
          rd.getFullYear() === d.getFullYear() &&
          rd.getMonth() === d.getMonth() &&
          rd.getDate() === d.getDate()
        );
      }).length;
      return {
        label: d
          .toLocaleDateString("fr-FR", { weekday: "short" })
          .replace(".", ""),
        count,
        isToday: d.getTime() === startOfDay.getTime(),
      };
    });
    const maxWeekly = Math.max(...weeklyData.map((w) => w.count), 1);

    // 3. Prochain RDV global
    const prochainRdv =
      allRdv.find((rv) => new Date(rv.date_heure).getTime() >= Date.now()) ||
      null;

    // 4. Patients récents (basés sur les RDV)
    const recentPatients = Array.from(
      new Map(
        [...allRdv]
          .sort(
            (a, b) =>
              new Date(b.date_heure).getTime() -
              new Date(a.date_heure).getTime(),
          )
          .map((r) => [r.patient_name, r]),
      ).values(),
    ).slice(0, 5);

    return {
      todayRdv,
      nextIndex,
      weeklyData,
      maxWeekly,
      prochainRdv,
      recentPatients,
    };
  }, [allRdv, time]); // Recalculé seulement si allRdv ou time change

  // ── Données dérivées simples (pas besoin de useMemo)
  const isPending = (s: string) => {
    const v = (s || "").toLowerCase();
    return (
      v.includes("attente") || v.includes("pending") || v.includes("confirm")
    );
  };
  const rdvAConfirmer = allRdv.filter((r) => isPending(r.status)).length;
  const notifsNonLues = allNotifs.filter((n) => !n.lu).length;

  const statCards = [
    {
      label: "Patients",
      iconKey: "users",
      value: stats.patients,
      path: "/dashboard/medecin/patients",
    },
    {
      label: "Rendez-vous",
      iconKey: "calendar",
      value: stats.rendezvous,
      path: "/dashboard/medecin/rendezvous",
    },
    {
      label: "Consultations",
      iconKey: "stethoscope",
      value: stats.consultations,
      path: "/dashboard/medecin/consultations",
    },
    {
      label: "Ordonnances",
      iconKey: "clipboard",
      value: stats.ordonnances,
      path: "/dashboard/medecin/ordonnances",
    },
    {
      label: "Contrôles",
      iconKey: "activity",
      value: stats.controles,
      path: "/dashboard/medecin/controles",
    },
  ];

  const timeStr = time.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const todayLabel = time.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (authLoading) return null;

  // ── RENDU ────────────────────────────────────────────────

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500;600;700&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .dash-root {
          display: flex;
          background: ${C.gradSoft};
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        .dash-main {
          flex: 1;
          margin-left: 0; /* Mobile first */
          padding: calc(66px + 12px) 16px 12px;
          min-height: 100vh;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Desktop Layout */
        @media (min-width: 1024px) {
          .dash-main {
            margin-left: 260px;
          }
        }

        /* Grid System - Responsive */
        .row1 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; flex: 0 0 auto; }
        .row2 { display: grid; grid-template-columns: 1fr; gap: 10px; flex: 1; min-height: 0; }
        .row3 { display: grid; grid-template-columns: 1fr; gap: 10px; flex: 1; min-height: 0; }

        @media (min-width: 768px) {
          .row1 { grid-template-columns: repeat(3, 1fr); }
        }
        
        @media (min-width: 1024px) {
          .row1 { grid-template-columns: repeat(12, 1fr); }
          .row2 { grid-template-columns: 7fr 5fr; }
          .row3 { grid-template-columns: 4fr 3fr 2fr 3fr; }
        }

        /* Typography & Utilities */
        .stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
          background: ${C.grad};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .clock-cell {
          background: ${C.grad} !important;
          border-color: transparent !important;
          box-shadow: 0 8px 24px -6px ${C.violet}55 !important;
          cursor: default;
        }

        /* Components specific styles */
        .tl-scroll { overflow-y: auto; flex: 1; min-height: 0; scrollbar-width: thin; scrollbar-color: ${C.violet}22 transparent; }
        .tl-item { display: flex; gap: 10px; align-items: center; padding: 8px 0; position: relative; }
        .tl-item:not(:last-child) .tl-line { position: absolute; left: 17px; top: 36px; bottom: -8px; width: 2px; background: ${C.violet}14; }
        .tl-pip { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 9px; flex-shrink: 0; z-index: 1; }
        
        .bars { display: flex; align-items: flex-end; gap: 6px; height: 80px; flex: 1; }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; justify-content: flex-end; height: 100%; }
        .bar-fill { width: 100%; border-radius: 6px 6px 2px 2px; min-height: 3px; transition: height 0.6s cubic-bezier(.4,0,.2,1); }
        
        .notif-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; border-radius: 12px; transition: background 0.2s; cursor: pointer; }
        .notif-item:hover { background: ${C.violet}07; }
        
        .pat-chip { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 12px; border: 1px solid ${C.border}; background: rgba(255,255,255,0.6); cursor: pointer; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s; flex-shrink: 0; }
        .pat-chip:hover { transform: translateY(-2px); border-color: ${C.violet}44; box-shadow: 0 6px 16px -4px ${C.violet}22; }
        
        .qa-btn { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 14px; background: rgba(255,255,255,0.7); border: 1px solid ${C.border}; cursor: pointer; transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s, background 0.25s; font-family: inherit; font-size: 12px; font-weight: 600; color: ${C.ink}; } 
        .qa-btn:hover { transform: translateY(-3px); border-color: ${C.violet}44; box-shadow: 0 10px 22px -6px ${C.violet}28; background: rgba(255,255,255,0.9); }
        
        .sec-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; color: ${C.ink}; margin: 0 0 10px; display: flex; align-items: center; gap: 6px; }
        
        .patients-scroll { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; flex: 1; min-height: 0; scrollbar-width: thin; scrollbar-color: ${C.violet}22 transparent; }
        
        .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; borderRadius: 20px; textTransform: capitalize; flex-shrink: 0; }
        
        .spinner {
          width: 40px; height: 40px; border: 4px solid rgba(124, 58, 237, 0.1);
          border-left-color: #7C3AED; border-radius: 50%; animation: spin 1s linear infinite;
        }
      `}</style>

      <div className="dash-root">
        <Sidebar
          stats={{
            rendezvous: stats.rendezvous,
            consultations: stats.consultations,
            ordonnances: stats.ordonnances,
            controles: stats.controles,
          }}
        />
        <Navbar
          title="Dashboard Médecin"
          subtitle={`Bonjour  ${username} 👋`}
        />

        <main className="dash-main">
          {/* ── LOADING STATE ── */}
          {dataLoading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(255,255,255,0.8)",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <div className="spinner"></div>
              <p style={{ color: C.slate, fontWeight: 500, fontSize: 14 }}>
                Chargement des données...
              </p>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {dataError && (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                color: "#ef4444",
                background: "#fef2f2",
                borderRadius: 12,
                border: "1px solid #fee2e2",
              }}
            >
              <Icon
                path={P.alertCircle}
                size={24}
                color="#ef4444"
                style={{ marginBottom: 8 }}
              />
              <p style={{ fontWeight: 600, margin: 0 }}>{dataError}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: 10,
                  padding: "8px 16px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* ── CONTENT ── */}

          {/* ════════════════ ROW 1 : Clock + 5 stat cards ════════════════ */}
          <div className="row1">
            {/* Clock */}
            <div
              style={{ gridColumn: "span 2" }}
              className="clock-cell"
              style={{
                borderRadius: 20,
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon path={P.clock} size={14} color="rgba(255,255,255,0.7)" />
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1,
                  marginTop: 4,
                }}
              >
                {timeStr}
              </div>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "1px",
                  color: "rgba(255,255,255,0.75)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {todayLabel.split(" ").slice(0, 2).join(" ")}
              </div>
            </div>

            {/* Stat cards */}
            {statCards.map((c, i) => (
              <Cell
                key={c.label}
                style={{
                  gridColumn: "span 2",
                  animationDelay: `${i * 0.06}s`,
                  animation: "fadeUp 0.4s ease backwards",
                }}
                onClick={() => router.push(c.path)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <Eyebrow>{c.label}</Eyebrow>
                    <div className="stat-val">{c.value}</div>
                  </div>
                  <Chip iconKey={c.iconKey} size={30} />
                </div>
                <div
                  style={{
                    marginTop: 8,
                    height: 2,
                    borderRadius: 2,
                    background: C.grad,
                    width: "40%",
                  }}
                />
              </Cell>
            ))}
          </div>

          {/* ════════════════ ROW 2 : Timeline + À traiter ════════════════ */}
          <div className="row2">
            {/* Today timeline */}
            <Cell style={{ display: "flex", flexDirection: "column" }}>
              <div className="sec-title">
                <Icon path={P.sun} size={14} color={C.violet} />
                Aujourd'hui —{" "}
                <span
                  style={{
                    textTransform: "capitalize",
                    fontWeight: 600,
                    color: C.slate,
                  }}
                >
                  {todayLabel}
                </span>
              </div>

              <div className="tl-scroll">
                {derivedData.todayRdv.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      gap: 8,
                      color: C.muted,
                    }}
                  >
                    <Icon path={P.calendarCheck} size={28} color="#CBD5E1" />
                    <p style={{ fontSize: 12, fontWeight: 500, margin: 0 }}>
                      Aucun rendez-vous aujourd'hui
                    </p>
                  </div>
                ) : (
                  derivedData.todayRdv.map((r, i) => {
                    const isPast =
                      i < derivedData.nextIndex || derivedData.nextIndex === -1;
                    const isNext = i === derivedData.nextIndex;
                    const d = new Date(r.date_heure);
                    return (
                      <div className="tl-item" key={r.id}>
                        <div className="tl-line" />
                        <div
                          className="tl-pip"
                          style={{
                            background: isPast ? "#F1F5F9" : C.grad,
                            color: isPast ? C.muted : "white",
                            boxShadow: isPast
                              ? "none"
                              : `0 4px 10px -3px ${C.violet}55`,
                          }}
                        >
                          {d.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: 12,
                            background: isNext
                              ? `${C.violet}09`
                              : "transparent",
                            border: `1px solid ${isNext ? `${C.violet}28` : "transparent"}`,
                            opacity: isPast ? 0.5 : 1,
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: C.ink,
                                margin: 0,
                              }}
                            >
                              {r.patient_name || "Patient"}
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: C.muted,
                                margin: "1px 0 0",
                              }}
                            >
                              {isPast
                                ? "Terminé"
                                : isNext
                                  ? "Prochain"
                                  : "À venir"}
                            </p>
                          </div>
                          <span
                            className="badge"
                            style={{
                              background: isPast ? "#F1F5F9" : `${C.violet}14`,
                              color: isPast ? C.muted : C.violet,
                            }}
                          >
                            {r.status || "en attente"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Cell>

            {/* Prochain RDV */}

            <div
              style={{
                background: C.grad,
                borderRadius: 20,
                padding: "16px 18px",
                position: "relative",
                overflow: "hidden",
                boxShadow: `0 16px 32px -8px ${C.violet}55`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -30,
                  left: -10,
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.06)",
                  pointerEvents: "none",
                }}
              />

              <Eyebrow>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>
                  Prochain rendez-vous
                </span>
              </Eyebrow>

              {derivedData.prochainRdv ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: 12,
                        padding: "8px 12px",
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Syne',sans-serif",
                          fontSize: 26,
                          fontWeight: 800,
                          color: "white",
                          lineHeight: 1,
                        }}
                      >
                        {new Date(derivedData.prochainRdv.date_heure).getDate()}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: "rgba(255,255,255,0.8)",
                          textTransform: "uppercase",
                          marginTop: 2,
                        }}
                      >
                        {new Date(
                          derivedData.prochainRdv.date_heure,
                        ).toLocaleDateString("fr-FR", { month: "short" })}
                      </div>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "'Syne',sans-serif",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "white",
                          margin: "0 0 4px",
                        }}
                      >
                        {derivedData.prochainRdv.patient_name || "Patient"}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.85)",
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Icon
                          path={P.clock}
                          size={10}
                          color="rgba(255,255,255,0.85)"
                        />
                        {new Date(
                          derivedData.prochainRdv.date_heure,
                        ).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/dashboard/medecin/rendezvous")}
                    style={{
                      marginTop: 12,
                      background: "white",
                      color: C.violet,
                      border: "none",
                      borderRadius: 10,
                      padding: "8px 16px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      width: "fit-content",
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    Voir détails{" "}
                    <Icon path={P.arrowRight} size={11} color={C.violet} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <Icon
                    path={P.calendarCheck}
                    size={32}
                    color="rgba(255,255,255,0.5)"
                  />
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.8)",
                      margin: 0,
                    }}
                  >
                    Aucun à venir
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ════════════════ ROW 3 : Semaine + Prochain RDV + Notifs + Patients ════════════════ */}
          <div className="row3">
            <Cell style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="sec-title">
                <Icon path={P.zap} size={14} color={C.violet} /> À traiter
              </div>

              {[
                {
                  label: "RDV à confirmer",
                  value: rdvAConfirmer,
                  iconKey: "calendarCheck",
                  path: "/dashboard/medecin/rendezvous",
                },
                {
                  label: "Notifications non lues",
                  value: notifsNonLues,
                  iconKey: "bell",
                  path: "/dashboard/medecin/messages",
                },
                {
                  label: "Contrôles programmés",
                  value: stats.controles,
                  iconKey: "activity",
                  path: "/dashboard/medecin/controles",
                },
              ].map((t) => (
                <div
                  key={t.label}
                  onClick={() => router.push(t.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.6)",
                    border: `1px solid ${C.border}`,
                    cursor: "pointer",
                    transition:
                      "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
                    flex: 1,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      `${C.violet}33`;
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      `0 8px 20px -6px ${C.violet}22`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform =
                      "none";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      C.border;
                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                      "none";
                  }}
                >
                  <Chip iconKey={t.iconKey} size={36} />
                  <div>
                    <div className="stat-val" style={{ fontSize: 22 }}>
                      {t.value}
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        color: C.slate,
                        fontWeight: 600,
                        margin: "2px 0 0",
                      }}
                    >
                      {t.label}
                    </p>
                  </div>
                </div>
              ))}
            </Cell>

            {/* Activité semaine */}
            <Cell style={{ display: "flex", flexDirection: "column" }}>
              <div className="sec-title">
                <Icon path={P.trendingUp} size={14} color={C.violet} />
                Cette semaine
              </div>
              <div className="bars">
                {derivedData.weeklyData.map((w) => (
                  <div className="bar-col" key={w.label}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: w.isToday ? C.violet : C.muted,
                        fontFamily: "'Syne',sans-serif",
                      }}
                    >
                      {w.count}
                    </span>
                    <div
                      className="bar-fill"
                      style={{
                        height: `${(w.count / derivedData.maxWeekly) * 100}%`,
                        background: w.isToday ? C.grad : `${C.violet}20`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: w.isToday ? C.violet : C.muted,
                        textTransform: "capitalize",
                      }}
                    >
                      {w.label}
                    </span>
                  </div>
                ))}
              </div>
            </Cell>

            {/* Notifications */}
            <Cell style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div className="sec-title" style={{ margin: 0 }}>
                  <Icon path={P.bell} size={14} color={C.violet} /> Notifs
                </div>
                {notifsNonLues > 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 20,
                      background: `${C.violet}16`,
                      color: C.violet,
                    }}
                  >
                    {notifsNonLues} non lues
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  overflow: "hidden",
                  flex: 1,
                  overflowY: "auto",
                  scrollbarWidth: "thin",
                  scrollbarColor: `${C.violet}22 transparent`,
                }}
              >
                {allNotifs.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                      gap: 6,
                      color: C.muted,
                    }}
                  >
                    <Icon path={P.bell} size={24} color="#CBD5E1" />
                    <p style={{ fontSize: 11, margin: 0 }}>
                      Aucune notification
                    </p>
                  </div>
                ) : (
                  allNotifs.slice(0, 6).map((n) => (
                    <div key={n.id} className="notif-item">
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          flexShrink: 0,
                          marginTop: 4,
                          background: n.lu ? "#E2E8F0" : C.grad,
                          boxShadow: n.lu ? "none" : `0 0 6px ${C.violet}88`,
                        }}
                      />
                      <p
                        style={{
                          fontSize: 11,
                          color: n.lu ? C.muted : "#334155",
                          fontWeight: n.lu ? 400 : 600,
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Cell>

            {/* Patients récents */}
            <Cell style={{ display: "flex", flexDirection: "column" }}>
              <div className="sec-title">
                <Icon path={P.users} size={14} color={C.violet} /> Patients
                récents
              </div>

              <div className="patients-scroll">
                {derivedData.recentPatients.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                      gap: 6,
                      color: C.muted,
                    }}
                  >
                    <Icon path={P.users} size={24} color="#CBD5E1" />
                    <p style={{ fontSize: 11, margin: 0 }}>
                      Aucun patient récent
                    </p>
                  </div>
                ) : (
                  derivedData.recentPatients.map((r) => {
                    const initials = (r.patient_name || "P")
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <div
                        key={r.id}
                        className="pat-chip"
                        onClick={() =>
                          router.push("/dashboard/medecin/dossiermedical")
                        }
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: C.grad,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontFamily: "'Syne',sans-serif",
                            fontWeight: 800,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {initials}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.ink,
                              margin: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {r.patient_name || "Patient"}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              color: C.muted,
                              margin: "1px 0 0",
                            }}
                          >
                            {new Date(r.date_heure).toLocaleDateString(
                              "fr-FR",
                              { day: "2-digit", month: "short" },
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Cell>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
