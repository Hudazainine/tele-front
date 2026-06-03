"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../components/Sidebar";
import PrivateRoute from "../../../components/PrivateRoute";
import api from "../../../lib/api";
import Navbar from "../../../components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RendezVous {
  id: number;
  patient_name: string;
  medecin_name: string;
  date_heure: string;
  status: string;
}
interface Consultation {
  id: number;
  patient_name: string;
  medecin_name: string;
  date_heure: string;
  notes: string;
}
interface Patient {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}
interface Medecin {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  specialite: string;
}
interface ActivityItem {
  text: string;
  time: string;
  dot: string;
  date: Date;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatRelative(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return "À l'instant";
  if (diff < 60) return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  return `Il y a ${Math.floor(diff / 1440)}j`;
}

function getMonthLabel(monthIndex: number): string {
  return [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ][monthIndex];
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function LiveIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div style={{ position: "relative", width: 8, height: 8 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#22d3a5",
            animation: "pulse-ring 1.5s ease-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#22d3a5",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: "#22d3a5",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Live
      </span>
    </div>
  );
}

function AnimatedNumber({
  value,
  loading,
  color,
}: {
  value: number;
  loading: boolean;
  color: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (loading) return;
    let start = 0;
    const end = value;
    const duration = 1000;
    const step = Math.max(1, Math.ceil(end / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, loading]);
  if (loading)
    return (
      <div
        style={{
          width: 64,
          height: 44,
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
          animation: "shimmer 1.4s infinite",
        }}
      />
    );
  return <span style={{ color }}>{display.toLocaleString()}</span>;
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const w = 80,
    h = 32;
  const pts = values
    .map(
      (v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * (h - 4)}`,
    )
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <defs>
        <linearGradient
          id={`spark-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BarChart({
  data,
}: {
  data: { label: string; value: number; color?: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6,
        height: 90,
        padding: "0 4px",
      }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 10, color: "#4a6080", fontWeight: 600 }}>
            {d.value > 0 ? d.value : ""}
          </span>
          <div style={{ width: "100%", position: "relative" }}>
            <div
              style={{
                width: "100%",
                height: `${Math.max(4, (d.value / max) * 64)}px`,
                background: d.color
                  ? `linear-gradient(180deg, ${d.color}cc, ${d.color}55)`
                  : "linear-gradient(180deg, #a78bfa, #7c3aed55)",
                borderRadius: "6px 6px 0 0",
                transition: "height 1s cubic-bezier(.34,1.56,.64,1)",
                boxShadow: `0 0 8px ${d.color || "#a78bfa"}44`,
              }}
            />
          </div>
          <span style={{ fontSize: 9, color: "#4a6080", textAlign: "center" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({
  patients,
  medecins,
}: {
  patients: number;
  medecins: number;
}) {
  const total = patients + medecins || 1;
  const pct = patients / total;
  const r = 36,
    cx = 44,
    cy = 44,
    strokeW = 10;
  const circ = 2 * Math.PI * r;
  const pDash = pct * circ;
  const mDash = (1 - pct) * circ;
  return (
    <div style={{ position: "relative", width: 88, height: 88 }}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#1e3050"
          strokeWidth={strokeW}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#22d3a5"
          strokeWidth={strokeW}
          strokeDasharray={`${pDash} ${circ - pDash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#a78bfa"
          strokeWidth={strokeW}
          strokeDasharray={`${mDash} ${circ - mDash}`}
          strokeDashoffset={circ / 4 - pDash}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, color: "#f0f4ff" }}>
          {total}
        </span>
        <span style={{ fontSize: 9, color: "#4a6080" }}>users</span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
  trend,
  loading,
  onClick,
  delay,
}: {
  label: string;
  value: number;
  icon: string;
  accent: string;
  sub: string;
  trend: number[];
  loading: boolean;
  onClick: () => void;
  delay: number;
}) {
  return (
    <div
      className="dash-card"
      onClick={onClick}
      style={{
        animationDelay: `${delay}s`,
        background: "linear-gradient(145deg, #131f2e, #1a2a3f)",
        borderRadius: 20,
        padding: "1.5rem",
        cursor: "pointer",
        border: `1px solid ${accent}22`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 ${accent}15`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: accent,
          opacity: 0.08,
          filter: "blur(35px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        <MiniSparkline values={trend} color={accent} />
      </div>
      <div
        style={{
          fontSize: 38,
          fontWeight: 800,
          fontFamily: "'Syne', sans-serif",
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        <AnimatedNumber value={value} loading={loading} color={accent} />
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#c8d8f0",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 11, color: "#4a6080" }}>{sub}</div>
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: `1px solid ${accent}18`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, color: accent, fontWeight: 600 }}>
          Voir détails →
        </span>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accent,
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { token, isLoading, user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    patients: 0,
    medecins: 0,
    rendezvous: 0,
    consultations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [rdvParMois, setRdvParMois] = useState<
    { label: string; value: number }[]
  >([]);
  const [consParMois, setConsParMois] = useState<
    { label: string; value: number }[]
  >([]);
  const [recentRdv, setRecentRdv] = useState<RendezVous[]>([]);
  const [topMedecins, setTopMedecins] = useState<
    { name: string; count: number; spec: string }[]
  >([]);
  const [statusDist, setStatusDist] = useState<
    { label: string; value: number; color: string }[]
  >([]);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(() => {
    if (!token) return;
    Promise.all([
      api.get("patients/"),
      api.get("medecins/"),
      api.get("rendezvous/"),
      api.get("consultations/"),
    ])
      .then(([p, m, r, c]) => {
        const patients: Patient[] = p.data;
        const medecins: Medecin[] = m.data;
        const rdvList: RendezVous[] = r.data;
        const consList: Consultation[] = c.data;

        setStats({
          patients: patients.length,
          medecins: medecins.length,
          rendezvous: rdvList.length,
          consultations: consList.length,
        });

        // ── Activité récente ─────────────────────────────────────────────────
        const events: ActivityItem[] = [
          ...rdvList.slice(-8).map((rv) => ({
            text: `RDV — ${rv.patient_name || "Patient"} → Dr. ${rv.medecin_name || ""}`,
            dot: "#38bdf8",
            date: new Date(rv.date_heure),
            time: "",
          })),
          ...consList.slice(-8).map((cn) => ({
            text: `Consultation — ${cn.patient_name || "Patient"}`,
            dot: "#fb923c",
            date: new Date(cn.date_heure),
            time: "",
          })),
        ];
        setActivity(
          events
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 6)
            .map((e) => ({ ...e, time: formatRelative(e.date) })),
        );

        // ── Graphiques par mois (6 derniers) ─────────────────────────────────
        const nowM = new Date().getMonth();
        const rdvCounts = Array(12).fill(0);
        const consCounts = Array(12).fill(0);
        rdvList.forEach(
          (rv) => rdvCounts[new Date(rv.date_heure).getMonth()]++,
        );
        consList.forEach(
          (cn) => consCounts[new Date(cn.date_heure).getMonth()]++,
        );
        const last6 = Array.from({ length: 6 }, (_, i) => {
          const idx = (nowM - 5 + i + 12) % 12;
          return {
            label: getMonthLabel(idx),
            rdv: rdvCounts[idx],
            cons: consCounts[idx],
          };
        });
        setRdvParMois(last6.map((d) => ({ label: d.label, value: d.rdv })));
        setConsParMois(last6.map((d) => ({ label: d.label, value: d.cons })));

        // ── Rendez-vous récents ───────────────────────────────────────────────
        setRecentRdv(
          [...rdvList]
            .sort(
              (a, b) =>
                new Date(b.date_heure).getTime() -
                new Date(a.date_heure).getTime(),
            )
            .slice(0, 5),
        );

        // ── Top médecins par RDV ──────────────────────────────────────────────
        const medecinCount: Record<string, { count: number; spec: string }> =
          {};
        rdvList.forEach((rv) => {
          const key = rv.medecin_name || "Inconnu";
          if (!medecinCount[key]) {
            const med = medecins.find(
              (m) =>
                `${m.first_name} ${m.last_name}` === key || m.username === key,
            );
            medecinCount[key] = { count: 0, spec: med?.specialite || "—" };
          }
          medecinCount[key].count++;
        });
        setTopMedecins(
          Object.entries(medecinCount)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([name, d]) => ({ name, count: d.count, spec: d.spec })),
        );

        // ── Distribution statuts RDV ─────────────────────────────────────────
        const statusMap: Record<string, number> = {};
        rdvList.forEach((rv) => {
          statusMap[rv.status] = (statusMap[rv.status] || 0) + 1;
        });
        const statusColors: Record<string, string> = {
          "en attente": "#f59e0b",
          confirmé: "#22d3a5",
          annulé: "#f87171",
          terminé: "#38bdf8",
        };
        setStatusDist(
          Object.entries(statusMap).map(([label, value]) => ({
            label,
            value,
            color: statusColors[label] || "#a78bfa",
          })),
        );

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [token, isLoading, router, fetchData]);

  if (isLoading) return null;

  const cards = [
    {
      label: "Patients",
      value: stats.patients,
      icon: "👥",
      accent: "#22d3a5",
      sub: "Total inscrits",
      trend: [4, 7, 5, 9, 8, 11, stats.patients],
      path: "/dashboard/admin/patients",
      delay: 0,
    },
    {
      label: "Médecins",
      value: stats.medecins,
      icon: "⚕️",
      accent: "#a78bfa",
      sub: "Praticiens actifs",
      trend: [2, 3, 2, 4, 3, 5, stats.medecins],
      path: "/dashboard/admin/medecins",
      delay: 0.07,
    },
    {
      label: "Rendez-vous",
      value: stats.rendezvous,
      icon: "📅",
      accent: "#38bdf8",
      sub: "Programmés",
      trend: [1, 3, 5, 4, 8, 6, stats.rendezvous],
      path: "/dashboard/admin/rendezvous",
      delay: 0.14,
    },
    {
      label: "Consultations",
      value: stats.consultations,
      icon: "🩺",
      accent: "#fb923c",
      sub: "Effectuées",
      trend: [2, 4, 3, 7, 5, 9, stats.consultations],
      path: "/dashboard/admin/consultations",
      delay: 0.21,
    },
  ];

  const totalUsers = stats.patients + stats.medecins;
  const patientsRatio = totalUsers
    ? Math.round((stats.patients / totalUsers) * 100)
    : 0;
  const medecinRatio = totalUsers
    ? Math.round((stats.medecins / totalUsers) * 100)
    : 0;
  const tauxOccup =
    stats.rendezvous > 0
      ? `${Math.min(100, Math.round((stats.consultations / stats.rendezvous) * 100))}%`
      : "—";
  const rdvParMed =
    stats.medecins > 0 ? (stats.rendezvous / stats.medecins).toFixed(1) : "—";

  const statusLabel: Record<string, string> = {
    "en attente": "En attente",
    confirmé: "Confirmé",
    annulé: "Annulé",
    terminé: "Terminé",
  };

  return (
    <PrivateRoute allowedRoles={["admin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp    { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer   { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
        @keyframes pulse-ring{ 0% { transform:scale(1); opacity:.6; } 100% { transform:scale(1.6); opacity:0; } }
        @keyframes spin      { to { transform:rotate(360deg); } }
        .dash-card { animation: fadeUp .5s ease both; transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease; }
        .dash-card:hover { transform: translateY(-5px) scale(1.015); box-shadow: 0 20px 40px rgba(0,0,0,0.22) !important; }
        .action-btn { transition: all .2s ease; position: relative; overflow: hidden; }
        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .rdv-row { transition: background .15s; border-radius: 10px; }
        .rdv-row:hover { background: rgba(255,255,255,0.03) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d1520; }
        ::-webkit-scrollbar-thumb { background: #1e3050; border-radius: 4px; }
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#0d1520",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Sidebar />
        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "5rem 2.5rem 3rem",
            overflowX: "hidden",
          }}
        >
          <Navbar
            title="Mon espace santé"
            subtitle={`Bonjour ${user?.username || "Admin"} 👋`}
          />

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "2.5rem",
              animation: "fadeUp .4s ease both",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <LiveIndicator />
                <span
                  style={{ fontSize: 12, color: "#4a6080", fontWeight: 500 }}
                >
                  {time.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h1
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#f0f4ff",
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: "-0.5px",
                  margin: 0,
                }}
              >
                Dashboard <span style={{ color: "#22d3a5" }}>Admin</span>
              </h1>
              <p style={{ color: "#4a6080", fontSize: 14, marginTop: 4 }}>
                Vue d'ensemble de la plateforme de téléconsultation
              </p>
            </div>
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

          {/* ── Stat Cards ────────────────────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 18,
              marginBottom: "2rem",
            }}
          >
            {cards.map((c) => (
              <StatCard
                key={c.label}
                {...c}
                loading={loading}
                onClick={() => router.push(c.path)}
              />
            ))}
          </div>

          {/* ── Row 2 : KPIs + Distribution + Donut ─────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 18,
              marginBottom: "2rem",
            }}
          >
            {/* KPIs */}
            <div
              style={{
                background: "linear-gradient(145deg,#131f2e,#1a2a3f)",
                borderRadius: 20,
                padding: "1.5rem",
                border: "1px solid #1e3050",
                animation: "fadeUp .5s .28s ease both",
                opacity: 0,
              }}
            >
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#c8d8f0",
                  fontFamily: "'Syne',sans-serif",
                  margin: "0 0 1.2rem",
                }}
              >
                Indicateurs clés
              </h2>
              {[
                {
                  label: "Taux d'occupation",
                  value: tauxOccup,
                  color: "#38bdf8",
                  icon: "📊",
                },
                {
                  label: "RDV / Médecin",
                  value: rdvParMed,
                  color: "#fb923c",
                  icon: "📅",
                },
                {
                  label: "Ratio patient/méd.",
                  value:
                    stats.medecins > 0
                      ? (stats.patients / stats.medecins).toFixed(1)
                      : "—",
                  color: "#22d3a5",
                  icon: "⚖️",
                },
                {
                  label: "Consultations/RDV",
                  value:
                    stats.rendezvous > 0
                      ? `${Math.round((stats.consultations / stats.rendezvous) * 100)}%`
                      : "—",
                  color: "#a78bfa",
                  icon: "🩺",
                },
              ].map((k) => (
                <div
                  key={k.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid #1a2a3f",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{k.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#4a6080" }}>
                      {k.label}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: k.color,
                        fontFamily: "'Syne',sans-serif",
                      }}
                    >
                      {loading ? "—" : k.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Distribution barres */}
            <div
              style={{
                background: "linear-gradient(145deg,#131f2e,#1a2a3f)",
                borderRadius: 20,
                padding: "1.5rem",
                border: "1px solid #1e3050",
                animation: "fadeUp .5s .35s ease both",
                opacity: 0,
              }}
            >
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#c8d8f0",
                  fontFamily: "'Syne',sans-serif",
                  margin: "0 0 1.2rem",
                }}
              >
                Distribution utilisateurs
              </h2>
              {[
                {
                  label: "Patients",
                  value: stats.patients,
                  ratio: patientsRatio,
                  color: "#22d3a5",
                  icon: "👥",
                },
                {
                  label: "Médecins",
                  value: stats.medecins,
                  ratio: medecinRatio,
                  color: "#a78bfa",
                  icon: "⚕️",
                },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <span style={{ fontSize: 13 }}>{item.icon}</span>
                      <span
                        style={{
                          fontSize: 13,
                          color: "#8ba0c0",
                          fontWeight: 500,
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: item.color,
                        }}
                      >
                        {loading ? "—" : item.value.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, color: "#4a6080" }}>
                        {item.ratio}%
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 99,
                      background: "#0d1520",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${item.ratio}%`,
                        borderRadius: 99,
                        background: `linear-gradient(90deg,${item.color}88,${item.color})`,
                        transition: "width 1s cubic-bezier(.34,1.56,.64,1)",
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Donut */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 20,
                  marginTop: 20,
                }}
              >
                <DonutChart
                  patients={stats.patients}
                  medecins={stats.medecins}
                />
                <div>
                  {[
                    { label: "Patients", color: "#22d3a5" },
                    { label: "Médecins", color: "#a78bfa" },
                  ].map((l) => (
                    <div
                      key={l.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: l.color,
                        }}
                      />
                      <span style={{ fontSize: 12, color: "#8ba0c0" }}>
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Statuts RDV */}
            <div
              style={{
                background: "linear-gradient(145deg,#131f2e,#1a2a3f)",
                borderRadius: 20,
                padding: "1.5rem",
                border: "1px solid #1e3050",
                animation: "fadeUp .5s .42s ease both",
                opacity: 0,
              }}
            >
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#c8d8f0",
                  fontFamily: "'Syne',sans-serif",
                  margin: "0 0 1.2rem",
                }}
              >
                Statuts des rendez-vous
              </h2>
              {statusDist.length === 0 ? (
                <div
                  style={{
                    color: "#4a6080",
                    fontSize: 13,
                    textAlign: "center",
                    padding: "2rem 0",
                  }}
                >
                  Aucun rendez-vous
                </div>
              ) : (
                statusDist.map((s) => {
                  const total = statusDist.reduce((acc, x) => acc + x.value, 0);
                  const pct = Math.round((s.value / total) * 100);
                  return (
                    <div key={s.label} style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 5,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: s.color,
                            }}
                          />
                          <span style={{ fontSize: 12, color: "#8ba0c0" }}>
                            {statusLabel[s.label] || s.label}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: s.color,
                            }}
                          >
                            {s.value}
                          </span>
                          <span style={{ fontSize: 11, color: "#4a6080" }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          height: 5,
                          borderRadius: 99,
                          background: "#0d1520",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            borderRadius: 99,
                            background: s.color,
                            transition: "width 1s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Row 3 : Graphiques RDV + Consultations ────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                background: "linear-gradient(145deg,#131f2e,#1a2a3f)",
                borderRadius: 20,
                padding: "1.5rem",
                border: "1px solid #1e3050",
                animation: "fadeUp .5s .49s ease both",
                opacity: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#c8d8f0",
                    fontFamily: "'Syne',sans-serif",
                    margin: 0,
                  }}
                >
                  Rendez-vous — 6 derniers mois
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    color: "#38bdf8",
                    fontWeight: 600,
                    background: "rgba(56,189,248,0.1)",
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  Total : {stats.rendezvous}
                </span>
              </div>
              <BarChart
                data={rdvParMois.map((d) => ({ ...d, color: "#38bdf8" }))}
              />
            </div>

            <div
              style={{
                background: "linear-gradient(145deg,#131f2e,#1a2a3f)",
                borderRadius: 20,
                padding: "1.5rem",
                border: "1px solid #1e3050",
                animation: "fadeUp .5s .56s ease both",
                opacity: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#c8d8f0",
                    fontFamily: "'Syne',sans-serif",
                    margin: 0,
                  }}
                >
                  Consultations — 6 derniers mois
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    color: "#fb923c",
                    fontWeight: 600,
                    background: "rgba(251,146,60,0.1)",
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  Total : {stats.consultations}
                </span>
              </div>
              <BarChart
                data={consParMois.map((d) => ({ ...d, color: "#fb923c" }))}
              />
            </div>
          </div>

          {/* ── Row 4 : RDV récents + Top médecins + Activité ─────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr",
              gap: 18,
            }}
          >
            {/* RDV récents */}
            <div
              style={{
                background: "linear-gradient(145deg,#131f2e,#1a2a3f)",
                borderRadius: 20,
                padding: "1.5rem",
                border: "1px solid #1e3050",
                animation: "fadeUp .5s .63s ease both",
                opacity: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#c8d8f0",
                    fontFamily: "'Syne',sans-serif",
                    margin: 0,
                  }}
                >
                  Rendez-vous récents
                </h2>
                <button
                  onClick={() => router.push("/dashboard/admin/rendezvous")}
                  style={{
                    fontSize: 11,
                    color: "#38bdf8",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 600,
                  }}
                >
                  Voir tout →
                </button>
              </div>
              {recentRdv.length === 0 ? (
                <div
                  style={{
                    color: "#4a6080",
                    fontSize: 13,
                    textAlign: "center",
                    padding: "2rem 0",
                  }}
                >
                  Aucun rendez-vous
                </div>
              ) : (
                recentRdv.map((rv, i) => {
                  const statusColor: Record<string, string> = {
                    "en attente": "#f59e0b",
                    confirmé: "#22d3a5",
                    annulé: "#f87171",
                    terminé: "#38bdf8",
                  };
                  const sc = statusColor[rv.status] || "#a78bfa";
                  return (
                    <div
                      key={rv.id}
                      className="rdv-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 8px",
                        borderBottom:
                          i < recentRdv.length - 1
                            ? "1px solid #1a2a3f"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: `${sc}18`,
                          border: `1px solid ${sc}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        📅
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#c8d8f0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {rv.patient_name || "—"} → Dr.{" "}
                          {rv.medecin_name || "—"}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#4a6080",
                            marginTop: 2,
                          }}
                        >
                          {new Date(rv.date_heure).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: sc,
                          background: `${sc}18`,
                          padding: "3px 8px",
                          borderRadius: 20,
                          flexShrink: 0,
                          textTransform: "capitalize",
                        }}
                      >
                        {rv.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Top médecins */}
            <div
              style={{
                background: "linear-gradient(145deg,#131f2e,#1a2a3f)",
                borderRadius: 20,
                padding: "1.5rem",
                border: "1px solid #1e3050",
                animation: "fadeUp .5s .7s ease both",
                opacity: 0,
              }}
            >
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#c8d8f0",
                  fontFamily: "'Syne',sans-serif",
                  margin: "0 0 1rem",
                }}
              >
                Top médecins
              </h2>
              {topMedecins.length === 0 ? (
                <div
                  style={{
                    color: "#4a6080",
                    fontSize: 13,
                    textAlign: "center",
                    padding: "2rem 0",
                  }}
                >
                  Pas encore de données
                </div>
              ) : (
                topMedecins.map((m, i) => (
                  <div
                    key={m.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom:
                        i < topMedecins.length - 1
                          ? "1px solid #1a2a3f"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        background: "rgba(167,139,250,0.15)",
                        border: "1px solid rgba(167,139,250,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#a78bfa",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#c8d8f0",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        Dr. {m.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#4a6080" }}>
                        {m.spec}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#a78bfa",
                        background: "rgba(167,139,250,0.1)",
                        padding: "2px 8px",
                        borderRadius: 20,
                        flexShrink: 0,
                      }}
                    >
                      {m.count} RDV
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Activité récente */}
            <div
              style={{
                background: "linear-gradient(145deg,#131f2e,#1a2a3f)",
                borderRadius: 20,
                padding: "1.5rem",
                border: "1px solid #1e3050",
                animation: "fadeUp .5s .77s ease both",
                opacity: 0,
              }}
            >
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#c8d8f0",
                  fontFamily: "'Syne',sans-serif",
                  margin: "0 0 1rem",
                }}
              >
                Activité récente
              </h2>
              {activity.length === 0 ? (
                <div
                  style={{
                    color: "#4a6080",
                    fontSize: 13,
                    textAlign: "center",
                    padding: "2rem 0",
                  }}
                >
                  Aucune activité
                </div>
              ) : (
                activity.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom:
                        i < activity.length - 1 ? "1px solid #1a2a3f" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: item.dot,
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#8ba0c0",
                          lineHeight: 1.4,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.text}
                      </div>
                      <div
                        style={{ fontSize: 10, color: "#4a6080", marginTop: 2 }}
                      >
                        {item.time}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Actions rapides en bas */}
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid #1a2a3f",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "#4a6080",
                    marginBottom: 10,
                  }}
                >
                  Actions rapides
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {[
                    {
                      label: "Patients",
                      icon: "👥",
                      path: "/dashboard/admin/patients",
                      color: "#22d3a5",
                    },
                    {
                      label: "Médecins",
                      icon: "⚕️",
                      path: "/dashboard/admin/medecins",
                      color: "#a78bfa",
                    },
                    {
                      label: "RDV",
                      icon: "📅",
                      path: "/dashboard/admin/rendezvous",
                      color: "#38bdf8",
                    },
                    {
                      label: "Consult.",
                      icon: "🩺",
                      path: "/dashboard/admin/consultations",
                      color: "#fb923c",
                    },
                  ].map((a) => (
                    <button
                      key={a.label}
                      className="action-btn"
                      onClick={() => router.push(a.path)}
                      style={{
                        padding: "8px 10px",
                        background: `${a.color}10`,
                        border: `1px solid ${a.color}25`,
                        borderRadius: 10,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{a.icon}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: a.color,
                        }}
                      >
                        {a.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
