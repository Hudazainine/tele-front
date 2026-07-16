"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "../../../components/Sidebar";
import PrivateRoute from "../../../components/PrivateRoute";
import api from "../../../lib/api";
import Navbar from "../../../components/Navbar";
import AIAnalyticsPanel, {
  DashboardData,
} from "../../../components/AIAnalyticsPanel";
import {
  ArrowRight,
  BarChart2,
  Calendar,
  CheckCircle,
  CircleCheck,
  ClipboardList,
  Clock,
  HeartPulse,
  RefreshCw,
  Stethoscope,
  Users,
  XCircle,
  PieChart,
} from "lucide-react";

function LucideIcon({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) {
  const iconMap: Record<string, any> = {
    "arrow-right": ArrowRight,
    "bar-chart-2": BarChart2,
    calendar: Calendar,
    "check-circle": CheckCircle,
    "circle-check": CircleCheck,
    "clipboard-list": ClipboardList,
    clock: Clock,
    "heart-pulse": HeartPulse,
    "refresh-cw": RefreshCw,
    stethoscope: Stethoscope,
    users: Users,
    "x-circle": XCircle,
    "pie-chart": PieChart,
  };
  const Icon = iconMap[name] || ArrowRight;
  return <Icon size={size} color={color} />;
}

// ─── Types ────────────────────────────────────────────────────
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
  type: string;
}

// ─── Utilities ────────────────────────────────────────────────
function formatRelative(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return "À l'instant";
  if (diff < 60) return `Il y a ${diff} min`;
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
  return `Il y a ${Math.floor(diff / 1440)}j`;
}
function getMonthLabel(i: number) {
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
  ][i];
}

const C = {
  // Backgrounds (Dark Mode)
  bg: "#050a10",
  surface: "#131f2e",
  surfaceAlt: "#1a283a",
  surfaceBorder: "#2d456e",
  border: "#1e3050",

  // Text
  text: "#f0f4ff",
  textSub: "#8ba0c0",
  textMuted: "#4a6080",

  // Accents
  teal: "#22d3a5",
  tealLight: "rgba(34, 211, 165, 0.15)",

  violet: "#a78bfa",
  violetLight: "rgba(167, 139, 250, 0.15)",

  sky: "#38bdf8",
  skyLight: "rgba(56, 189, 248, 0.15)",

  amber: "#fbbf24",
  amberLight: "rgba(251, 191, 36, 0.15)",

  red: "#f87171",
  redLight: "rgba(248, 113, 113, 0.15)",

  green: "#34d399",
  greenLight: "rgba(52, 211, 153, 0.15)",
};

// ─── Sub-components ───────────────────────────────────────────

function PulseIcon() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 8, height: 8 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: C.teal,
            animation: "pulseRing 1.8s ease-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 1,
            borderRadius: "50%",
            background: C.teal,
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          color: C.teal,
          fontWeight: 700,
          letterSpacing: "0.1em",
        }}
      >
        EN DIRECT
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
    const step = Math.max(1, Math.ceil(value / 40));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else setDisplay(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value, loading]);

  if (loading)
    return (
      <div
        style={{
          width: 80,
          height: 40,
          borderRadius: 8,
          background: C.surfaceAlt,
          animation: "shimmer 1.4s infinite",
        }}
      />
    );
  return <span style={{ color }}>{display.toLocaleString()}</span>;
}

function MiniBar({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 24 }}
    >
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            width: 5,
            borderRadius: "2px 2px 0 0",
            height: `${Math.max(3, (v / max) * 24)}px`,
            background: i === values.length - 1 ? color : `${color}44`,
            transition: "height 0.6s ease",
          }}
        />
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  iconName,
  color,
  colorLight,
  sub,
  trend,
  loading,
  onClick,
  delay,
}: {
  label: string;
  value: number;
  iconName: string;
  color: string;
  colorLight: string;
  sub: string;
  trend: number[];
  loading: boolean;
  onClick: () => void;
  delay: number;
}) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{
        animationDelay: `${delay}s`,
        background: C.surface,
        borderRadius: 12, // Reduced radius slightly
        padding: "1rem 1.2rem", // Minimized padding
        cursor: "pointer",
        border: `1px solid ${C.border}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)", // Minimized shadow
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2, // Thinner top border
          background: color,
          borderRadius: "12px 12px 0 0",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12, // Reduced margin
        }}
      >
        <div
          style={{
            width: 36, // Smaller icon container
            height: 36,
            borderRadius: 10,
            background: colorLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LucideIcon name={iconName} size={18} color={color} />
        </div>
        <MiniBar values={trend} color={color} />
      </div>
      <div
        style={{
          fontSize: 28, // Smaller font size
          fontWeight: 800,
          lineHeight: 1,
          marginBottom: 2,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <AnimatedNumber value={value} loading={loading} color={C.text} />
      </div>
      <div
        style={{
          fontSize: 12, // Smaller label font
          fontWeight: 600,
          color: C.textSub,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 10, color: C.textMuted }}>{sub}</div>
      <div
        style={{
          marginTop: 10, // Reduced margin
          paddingTop: 8, // Reduced padding
          borderTop: `1px solid ${C.surfaceBorder}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 10, // Smaller link font
            color,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          Voir détails <LucideIcon name="arrow-right" size={10} color={color} />
        </span>
        <div
          style={{
            width: 4, // Smaller dot
            height: 4,
            borderRadius: "50%",
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function BarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        height: 90, // Reduced height
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
          <span style={{ fontSize: 9, color: C.textMuted, fontWeight: 600 }}>
            {d.value > 0 ? d.value : ""}
          </span>
          <div
            style={{
              width: "100%",
              height: `${Math.max(4, (d.value / max) * 60)}px`, // Adjusted height
              background: d.color,
              borderRadius: "4px 4px 0 0",
              opacity: 0.9,
              transition: "height 0.8s cubic-bezier(.34,1.56,.64,1)",
            }}
          />
          <span
            style={{ fontSize: 8, color: C.textMuted, textAlign: "center" }}
          >
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
  const r = 32, // Smaller radius
    cx = 40,
    cy = 40,
    strokeW = 7,
    circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={C.surfaceBorder}
          strokeWidth={strokeW}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={C.teal}
          strokeWidth={strokeW}
          strokeDasharray={`${pct * circ} ${circ - pct * circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={C.violet}
          strokeWidth={strokeW}
          strokeDasharray={`${(1 - pct) * circ} ${circ - (1 - pct) * circ}`}
          strokeDashoffset={circ / 4 - pct * circ}
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
        <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
          {total}
        </span>
        <span style={{ fontSize: 8, color: C.textMuted, fontWeight: 500 }}>
          USERS
        </span>
      </div>
    </div>
  );
}

const statusMeta: Record<
  string,
  { label: string; color: string; bg: string; iconName: string }
> = {
  "en attente": {
    label: "En attente",
    color: C.amber,
    bg: C.amberLight,
    iconName: "clock",
  },
  confirmé: {
    label: "Confirmé",
    color: C.green,
    bg: C.greenLight,
    iconName: "check-circle",
  },
  annulé: {
    label: "Annulé",
    color: C.red,
    bg: C.redLight,
    iconName: "x-circle",
  },
  terminé: {
    label: "Terminé",
    color: C.sky,
    bg: C.skyLight,
    iconName: "circle-check",
  },
};

// ─── Main ─────────────────────────────────────────────────────
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
  const [rawData, setRawData] = useState<DashboardData>({
    patients: [],
    medecins: [],
    rdvList: [],
    consList: [],
  });
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
        setRawData({ patients, medecins, rdvList, consList });

        const events: ActivityItem[] = [
          ...rdvList.slice(-8).map((rv) => ({
            text: `RDV · ${rv.patient_name || "Patient"} → Dr. ${rv.medecin_name || ""}`,
            dot: C.sky,
            type: "rdv",
            date: new Date(rv.date_heure),
            time: "",
          })),
          ...consList.slice(-8).map((cn) => ({
            text: `Consultation · ${cn.patient_name || "Patient"}`,
            dot: C.violet,
            type: "consultation",
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
        setRecentRdv(
          [...rdvList]
            .sort(
              (a, b) =>
                new Date(b.date_heure).getTime() -
                new Date(a.date_heure).getTime(),
            )
            .slice(0, 5),
        );

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

        const statusMap: Record<string, number> = {};
        rdvList.forEach((rv) => {
          statusMap[rv.status] = (statusMap[rv.status] || 0) + 1;
        });
        setStatusDist(
          Object.entries(statusMap).map(([label, value]) => ({
            label,
            value,
            color: statusMeta[label]?.color || C.violet,
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
      iconName: "users",
      color: C.teal,
      colorLight: C.tealLight,
      sub: "Inscrits sur la plateforme",
      trend: [4, 7, 5, 9, 8, 11, stats.patients],
      path: "/dashboard/admin/patients",
      delay: 0,
    },
    {
      label: "Médecins",
      value: stats.medecins,
      iconName: "stethoscope",
      color: C.violet,
      colorLight: C.violetLight,
      sub: "Praticiens actifs",
      trend: [2, 3, 2, 4, 3, 5, stats.medecins],
      path: "/dashboard/admin/medecins",
      delay: 0.07,
    },
    {
      label: "Rendez-vous",
      value: stats.rendezvous,
      iconName: "calendar",
      color: C.sky,
      colorLight: C.skyLight,
      sub: "Total programmés",
      trend: [1, 3, 5, 4, 8, 6, stats.rendezvous],
      path: "/dashboard/admin/rendezvous",
      delay: 0.14,
    },
    {
      label: "Consultations",
      value: stats.consultations,
      iconName: "heart-pulse",
      color: C.amber,
      colorLight: C.amberLight,
      sub: "Effectuées à ce jour",
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

  const kpis = [
    {
      label: "Taux d'occupation",
      value: tauxOccup,
      color: C.sky,
      iconName: "bar-chart-2",
    },
    {
      label: "RDV / Médecin",
      value: rdvParMed,
      color: C.amber,
      iconName: "calendar",
    },
    {
      label: "Ratio patient / méd.",
      value:
        stats.medecins > 0 ? (stats.patients / stats.medecins).toFixed(1) : "—",
      color: C.teal,
      iconName: "users",
    },
    {
      label: "Consultations / RDV",
      value:
        stats.rendezvous > 0
          ? `${Math.round((stats.consultations / stats.rendezvous) * 100)}%`
          : "—",
      color: C.violet,
      iconName: "pie-chart",
    },
  ];

  const quickLinks = [
    {
      label: "Patients",
      iconName: "users",
      path: "/dashboard/admin/patients",
      color: C.teal,
    },
    {
      label: "Médecins",
      iconName: "stethoscope",
      path: "/dashboard/admin/medecins",
      color: C.violet,
    },
    {
      label: "Rendez-vous",
      iconName: "calendar",
      path: "/dashboard/admin/rendezvous",
      color: C.sky,
    },
    {
      label: "Consult.",
      iconName: "heart-pulse",
      path: "/dashboard/admin/consultations",
      color: C.amber,
    },
  ];

  return (
    <PrivateRoute allowedRoles={["admin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes pulseRing { 0% { transform:scale(1); opacity:.6; } 100% { transform:scale(2); opacity:0; } }
        
        /* Corrected Minimized Styles */
        .stat-card { 
          animation: fadeUp 0.45s ease both; 
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; 
        }
        
        .stat-card:hover { 
          transform: translateY(-2px); /* Reduced lift */
          box-shadow: 0 8px 20px rgba(0,0,0,0.3) !important; /* Darker, more focused shadow */
          border-color: #2d456e; /* Explicit color or C.surfaceBorder */
        } 

        .panel { background:${C.surface}; border-radius:12px; border:1px solid ${C.border}; box-shadow:0 4px 12px rgba(0,0,0,0.15); padding:1rem 1.2rem; animation:fadeUp 0.45s ease both; }
        .panel-title { font-size:12px; font-weight:700; color:${C.text}; letter-spacing:0.02em; text-transform:uppercase; margin:0 0 1rem; display:flex; align-items:center; gap:8px; }
        .rdv-row { transition:background 0.15s; border-radius:8px; cursor:default; }
        .rdv-row:hover { background:${C.surfaceAlt}; }
        .quick-btn { transition:all 0.2s ease; border:none; cursor:pointer; }
        .quick-btn:hover { transform:translateY(-2px); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:${C.bg}; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:4px; }
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: C.bg,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Sidebar />
        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "4rem 2rem 2rem", // Reduced padding
            overflowX: "hidden",
            marginTop: 26,
          }}
        >
          <Navbar
            title="Tableau de bord"
            subtitle={`Bonjour ${user?.username || "Admin"}`}
          />

          {/* Stat Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: "1.5rem",
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

          {/* Row 2 : KPIs + Distribution + Statuts */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.1fr 1fr",
              gap: 16,
              marginBottom: "1.5rem",
            }}
          >
            {/* KPIs */}
            <div
              className="panel"
              style={{ animationDelay: "0.28s", opacity: 0 }}
            >
              <div className="panel-title">
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: C.tealLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LucideIcon name="bar-chart-2" size={10} color={C.teal} />
                </div>
                Indicateurs clés
              </div>
              {kpis.map((k) => (
                <div
                  key={k.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: `1px solid ${C.surfaceBorder}`,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${k.color}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <LucideIcon name={k.iconName} size={14} color={k.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: C.textMuted,
                        marginBottom: 2,
                      }}
                    >
                      {k.label}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: k.color,
                        lineHeight: 1,
                      }}
                    >
                      {loading ? "—" : k.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Distribution */}
            <div
              className="panel"
              style={{ animationDelay: "0.35s", opacity: 0 }}
            >
              <div className="panel-title">
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: C.violetLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LucideIcon name="users" size={10} color={C.violet} />
                </div>
                Répartition utilisateurs
              </div>
              {[
                {
                  label: "Patients",
                  value: stats.patients,
                  ratio: patientsRatio,
                  color: C.teal,
                  iconName: "users",
                },
                {
                  label: "Médecins",
                  value: stats.medecins,
                  ratio: medecinRatio,
                  color: C.violet,
                  iconName: "stethoscope",
                },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <LucideIcon
                        name={item.iconName}
                        size={12}
                        color={item.color}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          color: C.textSub,
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
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: item.color,
                          background: `${item.color}22`,
                          padding: "2px 6px",
                          borderRadius: 20,
                        }}
                      >
                        {item.ratio}%
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 99,
                      background: C.surfaceAlt,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${item.ratio}%`,
                        borderRadius: 99,
                        background: item.color,
                        transition: "width 1s cubic-bezier(.34,1.56,.64,1)",
                      }}
                    />
                  </div>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 20,
                  marginTop: 8,
                }}
              >
                <DonutChart
                  patients={stats.patients}
                  medecins={stats.medecins}
                />
                <div>
                  {[
                    { label: "Patients", color: C.teal },
                    { label: "Médecins", color: C.violet },
                  ].map((l) => (
                    <div
                      key={l.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 3,
                          background: l.color,
                        }}
                      />
                      <span style={{ fontSize: 11, color: C.textSub }}>
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Statuts */}
            <div
              className="panel"
              style={{ animationDelay: "0.42s", opacity: 0 }}
            >
              <div className="panel-title">
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: C.skyLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LucideIcon name="clipboard-list" size={10} color={C.sky} />
                </div>
                Statuts des rendez-vous
              </div>
              {statusDist.length === 0 ? (
                <div
                  style={{
                    color: C.textMuted,
                    fontSize: 12,
                    textAlign: "center",
                    padding: "2rem 0",
                  }}
                >
                  Aucun rendez-vous
                </div>
              ) : (
                statusDist.map((s) => {
                  const total = statusDist.reduce((a, x) => a + x.value, 0);
                  const pct = Math.round((s.value / total) * 100);
                  const meta = statusMeta[s.label];
                  return (
                    <div key={s.label} style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: s.color,
                            }}
                          />
                          <span style={{ fontSize: 11, color: C.textSub }}>
                            {meta?.label || s.label}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: s.color,
                            }}
                          >
                            {s.value}
                          </span>
                          <span style={{ fontSize: 9, color: C.textMuted }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          height: 4,
                          borderRadius: 99,
                          background: C.surfaceAlt,
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

          {/* Row 3 : Graphiques */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: "1.5rem",
            }}
          >
            {[
              {
                title: "Rendez-vous — 6 derniers mois",
                total: stats.rendezvous,
                data: rdvParMois,
                color: C.sky,
                totalColor: C.sky,
                delay: "0.49s",
              },
              {
                title: "Consultations — 6 derniers mois",
                total: stats.consultations,
                data: consParMois,
                color: C.amber,
                totalColor: C.amber,
                delay: "0.56s",
              },
            ].map((chart) => (
              <div
                key={chart.title}
                className="panel"
                style={{ animationDelay: chart.delay, opacity: 0 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div className="panel-title" style={{ margin: 0 }}>
                    {chart.title}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: chart.totalColor,
                      fontWeight: 700,
                      background: `${chart.totalColor}22`,
                      padding: "2px 8px",
                      borderRadius: 20,
                    }}
                  >
                    Total : {chart.total}
                  </span>
                </div>
                <BarChart
                  data={chart.data.map((d) => ({ ...d, color: chart.color }))}
                />
              </div>
            ))}
          </div>

          {/* Row 4 : RDV récents + Top médecins + Activité */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr",
              gap: 16,
            }}
          >
            {/* RDV récents */}
            <div
              className="panel"
              style={{ animationDelay: "0.63s", opacity: 0 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.8rem",
                }}
              >
                <div className="panel-title" style={{ margin: 0 }}>
                  Rendez-vous récents
                </div>
                <button
                  onClick={() => router.push("/dashboard/admin/rendezvous")}
                  style={{
                    fontSize: 10,
                    color: C.sky,
                    background: C.skyLight,
                    border: "none",
                    borderRadius: 6,
                    padding: "3px 8px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 600,
                  }}
                >
                  Voir tout
                </button>
              </div>
              {recentRdv.length === 0 ? (
                <div
                  style={{
                    color: C.textMuted,
                    fontSize: 12,
                    textAlign: "center",
                    padding: "2rem 0",
                  }}
                >
                  Aucun rendez-vous
                </div>
              ) : (
                recentRdv.map((rv, i) => {
                  const meta = statusMeta[rv.status] || {
                    color: C.violet,
                    bg: C.violetLight,
                    label: rv.status,
                    iconName: "circle",
                  };
                  return (
                    <div
                      key={rv.id}
                      className="rdv-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 4px",
                        borderBottom:
                          i < recentRdv.length - 1
                            ? `1px solid ${C.surfaceBorder}`
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: meta.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <LucideIcon
                          name="calendar"
                          size={14}
                          color={meta.color}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: C.text,
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
                            fontSize: 10,
                            color: C.textMuted,
                            marginTop: 1,
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
                          fontSize: 9,
                          fontWeight: 700,
                          color: meta.color,
                          background: meta.bg,
                          padding: "2px 6px",
                          borderRadius: 20,
                          flexShrink: 0,
                          textTransform: "capitalize",
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Top médecins */}
            <div
              className="panel"
              style={{ animationDelay: "0.70s", opacity: 0 }}
            >
              <div className="panel-title">
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: C.violetLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LucideIcon name="bar-chart-2" size={10} color={C.violet} />
                </div>
                Top médecins
              </div>
              {topMedecins.length === 0 ? (
                <div
                  style={{
                    color: C.textMuted,
                    fontSize: 12,
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
                      gap: 8,
                      padding: "8px 0",
                      borderBottom:
                        i < topMedecins.length - 1
                          ? `1px solid ${C.surfaceBorder}`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: i === 0 ? C.amberLight : C.violetLight,
                        border: `1px solid ${i === 0 ? C.amber : C.violet}40`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        color: i === 0 ? C.amber : C.violet,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: C.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        Dr. {m.name}
                      </div>
                      <div style={{ fontSize: 9, color: C.textMuted }}>
                        {m.spec}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.textSub,
                      }}
                    >
                      {m.count}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Activity */}
            <div
              className="panel"
              style={{ animationDelay: "0.77s", opacity: 0 }}
            >
              <div className="panel-title">
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: C.skyLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LucideIcon name="refresh-cw" size={10} color={C.sky} />
                </div>
                Activité récente
              </div>
              <div style={{ position: "relative", paddingLeft: 10 }}>
                {/* Vertical Line */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 4,
                    bottom: 4,
                    width: 2,
                    background: C.surfaceBorder,
                    borderRadius: 2,
                  }}
                />
                {activity.map((act, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: 16,
                      position: "relative",
                    }}
                  >
                    {/* Dot */}
                    <div
                      style={{
                        position: "absolute",
                        left: -15,
                        top: 1,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: C.bg,
                        border: `2px solid ${act.dot}`,
                        zIndex: 1,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 11,
                        color: C.textSub,
                        fontWeight: 500,
                        lineHeight: 1.4,
                      }}
                    >
                      {act.text}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: C.textMuted,
                        marginTop: 2,
                      }}
                    >
                      {act.time}
                    </div>
                  </div>
                ))}
                {activity.length === 0 && (
                  <div
                    style={{
                      color: C.textMuted,
                      fontSize: 12,
                      textAlign: "center",
                      padding: "2rem 0",
                    }}
                  >
                    Aucune activité
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <AIAnalyticsPanel data={rawData} />
    </PrivateRoute>
  );
}
