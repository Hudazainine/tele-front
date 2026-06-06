"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────────────────────────
// ICONS (SVG Components) - Pro Style
// ─────────────────────────────────────────────────────────────

const LucideIcon = ({
  path,
  size = 20,
  color = "currentColor",
}: {
  path: string;
  size?: number;
  color?: string;
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
  />
);

const icons: Record<string, string> = {
  dashboard:
    "<rect x='3' y='3' width='7' height='7'></rect><rect x='14' y='3' width='7' height='7'></rect><rect x='14' y='14' width='7' height='7'></rect><rect x='3' y='14' width='7' height='7'></rect>",
  calendar:
    "<rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line>",
  stethoscope:
    "<path d='M11 4v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M18 8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M10 12v5a3 3 0 0 0 6 0v-1'></path><path d='M10 12h-1a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0z'></path>",
  folder:
    "<path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'></path>",
  clipboard:
    "<path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'></path><rect x='8' y='2' width='8' height='4' rx='1' ry='1'></rect><path d='M9 14h6'></path><path d='M9 18h6'></path><path d='M9 10h6'></path>",
  certificate:
    "<circle cx='12' cy='8' r='6'></circle><path d='M15.477 12.89 17 22l-2-2 1 5-4.5-4.5L7 22l1-5-2 2 1.523-9.11'></path>",
  users:
    "<path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path><circle cx='9' cy='7' r='4'></circle><path d='M23 21v-2a4 4 0 0 0-3-3.87'></path><path d='M16 3.13a4 4 0 0 1 0 7.75'></path>",
  doctor:
    "<path d='M20 21v-2a4 4 0 0 0-3-3.87'></path><path d='M4 21v-2a4 4 0 0 1 3-3.87'></path><circle cx='12' cy='7' r='4'></circle><path d='M12 11v10'></path>",
  robot:
    "<rect x='3' y='11' width='18' height='10' rx='2'></rect><circle cx='12' cy='5' r='2'></circle><path d='M12 7v4'></path><line x1='8' y1='16' x2='8' y2='16'></line><line x1='16' y1='16' x2='16' y2='16'></line>",
<<<<<<< HEAD
  plus: "<line x1='12' y1='5' x2='12' y2='19'></line><line x1='5' y1='12' x2='19' y2='12'></line>",
  creditCard:
    "<rect x='1' y='4' width='22' height='16' rx='2' ry='2'></rect><line x1='1' y1='10' x2='23' y2='10'></line><line x1='6' y1='15' x2='10' y2='15'></line><line x1='14' y1='15' x2='18' y2='15'></line>",
  // ✅ NOUVELLE ICÔNE : Bouclier CNAM / Prise en charge
  shieldCheck:
    "<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'></path><path d='M9 12l2 2 4-4'></path>",
=======
  plus:
    "<line x1='12' y1='5' x2='12' y2='19'></line><line x1='5' y1='12' x2='19' y2='12'></line>",
  creditCard:
    "<rect x='1' y='4' width='22' height='16' rx='2' ry='2'></rect><line x1='1' y1='10' x2='23' y2='10'></line><line x1='6' y1='15' x2='10' y2='15'></line><line x1='14' y1='15' x2='18' y2='15'></line>",
  shieldCheck:
    "<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'></path><path d='M9 12l2 2 4-4'></path>",
  home:
    "<path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path><polyline points='9 22 9 12 15 12 15 22'></polyline>",
  activity:
    "<polyline points='22 12 18 12 15 21 9 3 6 12 2 12'></polyline>",
  messageCircle:
    "<path d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'></path>",
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
};

// ─────────────────────────────────────────────────────────────
// TYPES & DATA
// ─────────────────────────────────────────────────────────────

interface NavItem {
  iconKey: keyof typeof icons;
  label: string;
  path: string;
  badge?: number;
  highlight?: boolean;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

interface SidebarProps {
  stats?: {
    rendezvous?: number;
    consultations?: number;
    ordonnances?: number;
    notifications?: number;
    patients?: number;
    medecins?: number;
    dossiersMedical?: number;
    factures?: number;
    [key: string]: number | undefined;
  } | null;
}
const themes = {
  admin:   { accent1: "#8B5CF6", accent2: "#22d3a5" },
  medecin: { accent1: "#10B981", accent2: "#8B5CF6" },
  patient: { accent1: "#378ADD", accent2: "#10B981" },
};

function getNav(role: string, stats: Record<string, number>): NavGroup[] {
  if (role === "admin")
    return [
      {
        section: "Gestion",
        items: [
<<<<<<< HEAD
          {
            iconKey: "dashboard",
            label: "Dashboard",
            path: "/dashboard/admin",
          },
          {
            iconKey: "users",
            label: "Patients",
            path: "/dashboard/admin/patients",
            badge: stats.patients,
          },
          {
            iconKey: "doctor",
            label: "Médecins",
            path: "/dashboard/admin/medecins",
            badge: stats.medecins,
          },
          {
            iconKey: "calendar",
            label: "Rendez-vous",
            path: "/dashboard/admin/rendezvous",
            badge: stats?.rendezvous ?? 0,
          },
          {
            iconKey: "stethoscope",
            label: "Consultations",
            path: "/dashboard/admin/consultations",
            badge: stats?.consultations ?? 0,
          },
=======
          { iconKey: "dashboard",   label: "Dashboard",     path: "/dashboard/admin" },
          { iconKey: "users",       label: "Patients",      path: "/dashboard/admin/patients",      badge: stats.patients },
          { iconKey: "doctor",      label: "Médecins",      path: "/dashboard/admin/medecins",      badge: stats.medecins },
          { iconKey: "calendar",    label: "Rendez-vous",   path: "/dashboard/admin/rendezvous",    badge: stats.rendezvous },
          { iconKey: "stethoscope", label: "Consultations", path: "/dashboard/admin/consultations", badge: stats.consultations },
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
        ],
      },
    ];

  if (role === "medecin")
    return [
      {
        section: "Navigation",
        items: [
<<<<<<< HEAD
          {
            iconKey: "dashboard",
            label: "Dashboard",
            path: "/dashboard/medecin",
          },
          {
            iconKey: "calendar",
            label: "Rendez-vous",
            path: "/dashboard/medecin/rendezvous",
            badge: stats?.rendezvous ?? 0,
          },
          {
            iconKey: "stethoscope",
            label: "Consultations",
            path: "/dashboard/medecin/consultations",
            badge: stats?.consultations ?? 0,
          },
          {
            iconKey: "folder",
            label: "Dossiers Médicaux",
            path: "/dashboard/medecin/dossiermedical",
            badge: stats.dossiersMedical,
          },
          {
            iconKey: "clipboard",
            label: "Ordonnances",
            path: "/dashboard/medecin/ordonnances",
            badge: stats?.ordonnances ?? 0,
          },
          {
            iconKey: "certificate",
            label: "Mes certificats",
            path: "/dashboard/medecin/certificats",
          },
          {
            iconKey: "creditCard",
            label: "Facturation",
            path: "/dashboard/medecin/facturation",
            badge: stats?.factures ?? 0,
          },
          // ✅ NOUVELLE ENTRÉE : Prise en charge CNAM
          {
            iconKey: "shieldCheck",
            label: "Prise en charge CNAM",
            path: "/dashboard/medecin/prise-en-charge-cnam",
            highlight: true,
          },
=======
          { iconKey: "dashboard",     label: "Dashboard",            path: "/dashboard/medecin" },
          { iconKey: "calendar",      label: "Rendez-vous",          path: "/dashboard/medecin/rendezvous",           badge: stats.rendezvous },
          { iconKey: "stethoscope",   label: "Consultations",        path: "/dashboard/medecin/consultations",        badge: stats.consultations },
          { iconKey: "messageCircle", label: "Messagerie",           path: "/dashboard/medecin/messages",             badge: stats.messagesNonLus },
          { iconKey: "folder",        label: "Dossiers Médicaux",    path: "/dashboard/medecin/dossiermedical",       badge: stats.dossiersMedical },
          { iconKey: "clipboard",     label: "Ordonnances",          path: "/dashboard/medecin/ordonnances",          badge: stats.ordonnances },
          { iconKey: "certificate",   label: "Mes certificats",      path: "/dashboard/medecin/certificats" },
          { iconKey: "activity",      label: "Contrôles",            path: "/dashboard/medecin/controles",            badge: stats.controles },
          { iconKey: "creditCard",    label: "Facturation",          path: "/dashboard/medecin/facturation",          badge: stats.factures },
          { iconKey: "shieldCheck",   label: "Prise en charge CNAM", path: "/dashboard/medecin/prise-en-charge-cnam", highlight: true },
          { iconKey: "home",          label: "Comptes Familles",     path: "/dashboard/medecin/familles",             highlight: true },
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
        ],
      },
    ];

  // ── patient ──────────────────────────────────────────────────
  return [
    {
      section: "Navigation",
      items: [
<<<<<<< HEAD
        {
          iconKey: "dashboard",
          label: "Dashboard",
          path: "/dashboard/patient",
        },
        {
          iconKey: "calendar",
          label: "Rendez-vous",
          path: "/dashboard/patient/rendezvous",
          badge: stats?.rendezvous ?? 0,
        },
        {
          iconKey: "stethoscope",
          label: "Consultations",
          path: "/dashboard/patient/consultations",
          badge: stats?.consultations ?? 0,
        },
        {
          iconKey: "clipboard",
          label: "Ordonnances",
          path: "/dashboard/patient/ordonnances",
        },
        {
          iconKey: "folder",
          label: "Dossier Médical",
          path: "/dashboard/patient/dossiermedical",
          highlight: true,
        },
        {
          iconKey: "certificate",
          label: "Certificats médicaux",
          path: "/dashboard/patient/certificats",
        },
        {
          iconKey: "robot",
          label: "Assistant IA",
          path: "/dashboard/patient/ia",
        },
        {
          iconKey: "creditCard",
          label: "Mes paiements",
          path: "/dashboard/patient/facturation",
          badge: stats?.factures ?? 0,
        },
=======
        { iconKey: "dashboard",   label: "Dashboard",            path: "/dashboard/patient" },
        { iconKey: "calendar",    label: "Rendez-vous",          path: "/dashboard/patient/rendezvous",    badge: stats.rendezvous },
        { iconKey: "stethoscope", label: "Consultations",        path: "/dashboard/patient/consultations", badge: stats.consultations },
        { iconKey: "clipboard",   label: "Ordonnances",          path: "/dashboard/patient/ordonnances" },
        { iconKey: "folder",      label: "Dossier Médical",      path: "/dashboard/patient/dossiermedical", highlight: true },
        { iconKey: "certificate", label: "Certificats médicaux", path: "/dashboard/patient/certificats" },
        { iconKey: "activity",    label: "Mes Contrôles",        path: "/dashboard/patient/controles",     badge: stats.controles },
        // ✅ NOUVEAU : Suivi des paiements patient
        { iconKey: "creditCard",  label: "Mes Paiements",        path: "/dashboard/patient/paiements",     badge: stats.paiementsEnAttente },
        { iconKey: "robot",       label: "Assistant IA",         path: "/dashboard/patient/ia" },
        { iconKey: "home",        label: "Mon Espace Famille",   path: "/dashboard/patient/famille",       highlight: true },
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
      ],
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// ACTIVE PATH DETECTION
// ─────────────────────────────────────────────────────────────

function isActive(pathname: string, itemPath: string, role: string): boolean {
  if (pathname === itemPath) return true;
  const dashboardRoot = `/dashboard/${role}`;
  if (itemPath === dashboardRoot) return false;
  return pathname.startsWith(itemPath + "/") || pathname === itemPath;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function Sidebar({ stats = {} }: SidebarProps) {
  const { role } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const r = (role ?? "patient") as keyof typeof themes;
  const t = themes[r] ?? themes.patient;
  const nav = getNav(role ?? "patient", stats);

  const roleLabel =
    role === "admin"
      ? "Administrateur"
      : role === "medecin"
        ? "Médecin"
        : "Patient";

  const isAdmin = role === "admin";
<<<<<<< HEAD
  const ordonnancesCount = stats?.ordonnances ?? 0;
=======
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504

  const cssVars = isAdmin
    ? {
        "--sidebar-bg":                "linear-gradient(180deg, #0d1520, #131f2e)",
        "--sidebar-border":            "#1e3050",
        "--sidebar-shadow":            "4px 0 20px rgba(0, 0, 0, 0.4)",
        "--sidebar-text":              "#8ba0c0",
        "--sidebar-text-hover":        "#f0f4ff",
        "--sidebar-text-muted":        "#4a6080",
        "--sidebar-hover-bg":          "rgba(34, 211, 165, 0.06)",
        "--sidebar-icon-bg":           "#1a2a3f",
        "--sidebar-icon-border":       "#1e3050",
        "--sidebar-icon-hover-border": "rgba(34, 211, 165, 0.4)",
        "--sidebar-icon-hover-bg":     "rgba(34, 211, 165, 0.1)",
        "--sidebar-divider":           "#1e3050",
      }
    : ({
        "--sidebar-bg":                "rgba(255, 255, 255, 0.85)",
        "--sidebar-border":            "rgba(255,255,255,0.6)",
        "--sidebar-shadow":            "4px 0 20px rgba(139, 92, 246, 0.05)",
        "--sidebar-text":              "#64748b",
        "--sidebar-text-hover":        "#334155",
        "--sidebar-text-muted":        "#94a3b8",
        "--sidebar-hover-bg":          "rgba(139, 92, 246, 0.06)",
        "--sidebar-icon-bg":           "white",
        "--sidebar-icon-border":       "rgba(0,0,0,0.06)",
        "--sidebar-icon-hover-border": `${t.accent1}44`,
<<<<<<< HEAD
        "--sidebar-icon-hover-bg": `${t.accent1}11`,
        "--sidebar-divider":
          "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.15), transparent)",
=======
        "--sidebar-icon-hover-bg":     `${t.accent1}11`,
        "--sidebar-divider":           "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.15), transparent)",
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
      } as React.CSSProperties);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-15px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          50%       { box-shadow: 0 0 0 6px rgba(139, 92, 246, 0); }
        }

        .sidebar-item {
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--sidebar-text);
        }
        .sidebar-item:hover {
          background: var(--sidebar-hover-bg);
          color: var(--sidebar-text-hover);
        }
        .sidebar-item.active {
          background: linear-gradient(135deg, ${t.accent1}, ${t.accent2});
          color: white;
          box-shadow: 0 4px 15px ${t.accent1}55;
        }
        .sidebar-item.active .icon-box {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.3);
          box-shadow: none;
        }
        .sidebar-item.active .gradient-badge {
          background: white;
          color: ${t.accent1};
          box-shadow: none;
        }
        .icon-box {
          background: var(--sidebar-icon-bg);
          border: 1px solid var(--sidebar-icon-border);
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
        }
        .sidebar-item:hover .icon-box {
          border-color: var(--sidebar-icon-hover-border);
          background: var(--sidebar-icon-hover-bg);
        }
        .gradient-text {
          background: linear-gradient(135deg, ${isAdmin ? "#f0f4ff" : t.accent1}, ${isAdmin ? "#22d3a5" : t.accent2});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .gradient-badge {
          background: linear-gradient(135deg, ${t.accent1}, ${t.accent2});
          box-shadow: 0 2px 6px ${t.accent1}44;
        }
        .sidebar-item.cnam-highlight:not(.active) {
          border: 1px dashed ${t.accent1}50;
          background: ${t.accent1}08;
        }
        .sidebar-item.cnam-highlight:not(.active):hover {
          border-color: ${t.accent1}80;
          background: ${t.accent1}15;
        }
        .sidebar-item.cnam-highlight .cnam-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: linear-gradient(135deg, ${t.accent1}, ${t.accent2});
          animation: pulseGlow 2s ease infinite;
          flex-shrink: 0;
        }
        .sidebar-item.cnam-highlight.active .cnam-dot {
          background: rgba(255,255,255,0.8);
          animation: none;
        }

        /* ✅ Badge pulsant pour paiements en attente */
        .paiement-badge-pulse {
          animation: pulseGlow 2s ease infinite;
        }
<<<<<<< HEAD
        .new-ordonnance-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px ${t.accent1}55;
        }
        .new-ordonnance-btn:active { transform: translateY(0); }

        /* ✅ Style spécial pour l'entrée CNAM */
        .sidebar-item.cnam-highlight:not(.active) {
          border: 1px dashed ${t.accent1}50;
          background: ${t.accent1}08;
        }
        .sidebar-item.cnam-highlight:not(.active):hover {
          border-color: ${t.accent1}80;
          background: ${t.accent1}15;
        }
        .sidebar-item.cnam-highlight .cnam-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${t.accent1}, ${t.accent2});
          animation: pulseGlow 2s ease infinite;
          flex-shrink: 0;
        }
        .sidebar-item.cnam-highlight.active .cnam-dot {
          background: rgba(255,255,255,0.8);
          animation: none;
        }

        @keyframes dmePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 0 5px rgba(139, 92, 246, 0); }
        }
        .dme-badge-pulse { animation: dmePulse 2s ease infinite; }
=======
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
      `}</style>

      <aside
        style={{
          width: 260,
          minHeight: "100vh",
          background: isAdmin
            ? "linear-gradient(180deg, #0d1520, #131f2e)"
            : "rgba(255, 255, 255, 0.85)",
          backdropFilter:       isAdmin ? "none" : "blur(20px)",
          WebkitBackdropFilter: isAdmin ? "none" : "blur(20px)",
          display:       "flex",
          flexDirection: "column",
<<<<<<< HEAD
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          borderRight: isAdmin
            ? "1px solid #1e3050"
            : "1px solid rgba(255,255,255,0.6)",
          boxShadow: isAdmin
            ? "4px 0 20px rgba(0, 0, 0, 0.4)"
            : "4px 0 20px rgba(139, 92, 246, 0.05)",
          overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
          zIndex: 100,
=======
          position:      "fixed",
          top: 0, left: 0, bottom: 0,
          borderRight: isAdmin ? "1px solid #1e3050" : "1px solid rgba(255,255,255,0.6)",
          boxShadow:   isAdmin ? "4px 0 20px rgba(0, 0, 0, 0.4)" : "4px 0 20px rgba(139, 92, 246, 0.05)",
          overflow:    "hidden",
          fontFamily:  "'DM Sans', sans-serif",
          zIndex:      100,
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
          ...cssVars,
        }}
      >
        {/* Decorative Ambient Light */}
        <div style={{ position: "absolute", top: "-20%", right: "-20%", width: "60%", height: "50%", background: `radial-gradient(circle, ${isAdmin ? "#8B5CF608" : t.accent1 + "15"} 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-20%", width: "60%", height: "50%", background: `radial-gradient(circle, ${isAdmin ? "#22d3a508" : t.accent2 + "10"} 0%, transparent 70%)`, pointerEvents: "none" }} />

<<<<<<< HEAD
        {/* ── LOGO ── */}
        <div
          style={{ padding: "24px 18px 18px", position: "relative", zIndex: 1 }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Logo simple — sans contour */}
            <img
              src="/LogoT.png"
              alt="TéléConsult"
              style={{
                width: 60,
                height: 60,
                objectFit: "contain",
                display: "block",
              }}
            />

            {/* Rôle sous le logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: isAdmin ? "#22d3a5" : t.accent1,
                  boxShadow: `0 0 5px ${isAdmin ? "#22d3a5" : t.accent1}90`,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: isAdmin ? "#4a6080" : "#94a3b8",
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1,
                }}
              >
=======
        {/* Logo */}
        <div style={{ padding: "28px 24px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: `linear-gradient(135deg, ${t.accent1}, ${t.accent2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 6px 15px ${t.accent1}44`,
              color: "white", fontSize: 20, fontWeight: 800,
            }}>
              T
            </div>
            <div>
              <span className="gradient-text" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-.5px", display: "block" }}>
                TéléConsult
              </span>
              <p style={{ fontSize: 10, color: isAdmin ? "#4a6080" : "#94a3b8", marginTop: 1, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600 }}>
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* Divider */}
        <div style={{ padding: "0 18px" }}>
          <div
            style={{
              height: 1,
              borderRadius: 1,
              background: isAdmin
                ? "linear-gradient(90deg, transparent, #1e3050 40%, #1e3050 60%, transparent)"
                : `linear-gradient(90deg, transparent, ${t.accent1}25 40%, ${t.accent2}20 60%, transparent)`,
            }}
          />
        </div>
        {/* Nav */}
        <nav
          style={{
            flex: 1,
            paddingTop: 16,
            overflowY: "auto",
            position: "relative",
            zIndex: 1,
            padding: "16px 12px",
          }}
        >
          {nav.map((group) => {
            if (group.special === "ordonnances") {
              const allOrdoPath =
                group.items.find((i) => i.label === "Toutes les ordonnances")
                  ?.path ?? "/dashboard/medecin/ordonnances";
              return (
                <div key={group.section} style={{ marginBottom: 12 }}>
                  <div style={{ marginTop: 4 }}>
=======
        <div style={{ height: 1, background: isAdmin ? "#1e3050" : "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.15), transparent)" }} />

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1, padding: "16px 12px" }}>
          {nav.map((group) => (
            <div key={group.section} style={{ marginBottom: 12 }}>
              <p style={{ padding: "8px 12px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--sidebar-text-muted)" }}>
                {group.section}
              </p>

              {group.items.map((item, index) => {
                const active      = isActive(pathname, item.path, role ?? "patient");
                const isBilling   = item.path.includes("/facturation");
                const isCnam      = item.path.includes("/prise-en-charge-cnam");
                const isFamille   = item.path.includes("/famille") || item.path.includes("/familles");
                const isPaiements = item.path.includes("/paiements");

                return (
                  <div
                    key={item.path}
                    className={`sidebar-item${active ? " active" : ""}${isCnam ? " cnam-highlight" : ""}`}
                    onClick={() => router.push(item.path)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", margin: "4px 0", borderRadius: 14,
                      cursor: "pointer", fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      animation: `slideIn 0.4s ease forwards`,
                      animationDelay: `${index * 0.05}s`,
                      opacity: 0,
                      ...(isFamille && !active
                        ? { border: `1px dashed ${t.accent1}40`, background: `${t.accent1}08` }
                        : {}),
                      // ✅ Bordure subtile si paiements en attente
                      ...(isPaiements && !active && stats.paiementsEnAttente
                        ? { border: `1px dashed #F59E0B60`, background: "#FFFBEB" }
                        : {}),
                    }}
                  >
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
                    <div
                      className="icon-box"
                      style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease" }}
                    >
<<<<<<< HEAD
                      <div className="sub-icon-box">
                        <LucideIcon
                          path={icons.clipboard}
                          size={16}
                          color={
                            pathname === allOrdoPath
                              ? "white"
                              : "var(--sidebar-text)"
                          }
                        />
                      </div>
                      <span style={{ flex: 1 }}>Ordonnances</span>
                      {ordonnancesCount > 0 && (
                        <span
                          className="gradient-badge"
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 7,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {ordonnancesCount}
                        </span>
                      )}
=======
                      <LucideIcon
                        path={icons[item.iconKey] || icons.dashboard}
                        size={18}
                        color={active ? "white" : "var(--sidebar-text)"}
                      />
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
                    </div>

                    <span style={{ flex: 1 }}>{item.label}</span>

<<<<<<< HEAD
                  const isBilling = item.path.includes("/facturation");
                  const isCnam = item.path.includes("/prise-en-charge-cnam");

                  return (
                    <div
                      key={item.path}
                      className={`sidebar-item ${active ? "active" : ""} ${isCnam ? "cnam-highlight" : ""}`}
                      onClick={() => router.push(item.path)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 14px",
                        margin: "4px 0",
                        borderRadius: 14,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: active ? 600 : 500,
                        animation: `slideIn 0.4s ease forwards`,
                        animationDelay: `${index * 0.05}s`,
                        opacity: 0,
                        ...(isBilling && !active && !isCnam
                          ? {
                              border: `1px dashed ${t.accent1}40`,
                              background: `${t.accent1}08`,
                            }
                          : {}),
                      }}
                    >
                      <div
                        className="icon-box"
=======
                    {/* Badge / indicateur */}
                    {item.badge && item.badge > 0 ? (
                      <span
                        className={`gradient-badge${isPaiements ? " paiement-badge-pulse" : ""}`}
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
                        style={{
                          fontSize: 11, padding: "3px 9px", borderRadius: 8,
                          fontWeight: 700, color: "#fff",
                          // ✅ Badge orange pour paiements en attente
                          ...(isPaiements && !active
                            ? { background: "linear-gradient(135deg, #F59E0B, #EF4444)", boxShadow: "0 2px 6px #F59E0B55" }
                            : {}),
                        }}
                      >
<<<<<<< HEAD
                        <LucideIcon
                          path={icons[item.iconKey] || icons.dashboard}
                          size={18}
                          color={active ? "white" : "var(--sidebar-text)"}
                        />
                      </div>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge && item.badge > 0 ? (
                        <span
                          className="gradient-badge"
                          style={{
                            fontSize: 11,
                            padding: "3px 9px",
                            borderRadius: 8,
                            fontWeight: 700,
                            color: "#fff",
                          }}
                        >
                          {item.badge}
                        </span>
                      ) : isCnam ? (
                        <span className="cnam-dot" />
                      ) : isBilling && !item.badge ? (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: active
                              ? "rgba(255,255,255,0.8)"
                              : `linear-gradient(135deg, ${t.accent1}, ${t.accent2})`,
                            flexShrink: 0,
                          }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
=======
                        {item.badge}
                      </span>
                    ) : isCnam ? (
                      <span className="cnam-dot" />
                    ) : isFamille ? (
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: active ? "rgba(255,255,255,0.8)" : `linear-gradient(135deg, ${t.accent1}, ${t.accent2})`,
                        flexShrink: 0,
                        animation: !active ? "pulseGlow 2s ease infinite" : "none",
                      }} />
                    ) : isBilling && !item.badge ? (
                      <span style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: active ? "rgba(255,255,255,0.8)" : `linear-gradient(135deg, ${t.accent1}, ${t.accent2})`,
                        flexShrink: 0,
                      }} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
>>>>>>> 796b3dadf14987e05ba52c2df74edd28a6437504
        </nav>
      </aside>
    </>
  );
}
