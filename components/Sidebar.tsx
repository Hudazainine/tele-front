"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ─────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────

const Icon = ({
  path,
  size = 18,
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
    strokeWidth="1.75"
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
    "<path d='M11 4v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M18 8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M10 12v5a3 3 0 0 0 6 0v-1'></path>",
  folder:
    "<path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'></path>",
  clipboard:
    "<path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'></path><rect x='8' y='2' width='8' height='4' rx='1' ry='1'></rect>",
  certificate:
    "<circle cx='12' cy='8' r='6'></circle><path d='M15.477 12.89 17 22l-2-2 1 5-4.5-4.5L7 22l1-5-2 2 1.523-9.11'></path>",
  users:
    "<path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path><circle cx='9' cy='7' r='4'></circle><path d='M23 21v-2a4 4 0 0 0-3-3.87'></path><path d='M16 3.13a4 4 0 0 1 0 7.75'></path>",
  doctor:
    "<path d='M20 21v-2a4 4 0 0 0-3-3.87'></path><path d='M4 21v-2a4 4 0 0 1 3-3.87'></path><circle cx='12' cy='7' r='4'></circle><path d='M12 11v10'></path>",
  robot:
    "<rect x='3' y='11' width='18' height='10' rx='2'></rect><circle cx='12' cy='5' r='2'></circle><path d='M12 7v4'></path>",
  creditCard:
    "<rect x='1' y='4' width='22' height='16' rx='2' ry='2'></rect><line x1='1' y1='10' x2='23' y2='10'></line>",
  shieldCheck:
    "<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'></path><path d='M9 12l2 2 4-4'></path>",
  home: "<path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path><polyline points='9 22 9 12 15 12 15 22'></polyline>",
  activity: "<polyline points='22 12 18 12 15 21 9 3 6 12 2 12'></polyline>",
  messageCircle:
    "<path d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'></path>",
};

// ─────────────────────────────────────────────────────────────
// TYPES
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
    messagesNonLus?: number;
    controles?: number;
    paiementsEnAttente?: number;
    [key: string]: number | undefined;
  } | null;
}

// ─────────────────────────────────────────────────────────────
// THEMES
// ─────────────────────────────────────────────────────────────

const themes = {
  admin: { accent1: "#8B5CF6", accent2: "#22d3a5" },
  medecin: { accent1: "#7C3AED", accent2: "#6D28D9" },
  patient: { accent1: "#378ADD", accent2: "#059669" },
};

// ─────────────────────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────────────────────

function getNav(role: string, stats: Record<string, number>): NavGroup[] {
  if (role === "admin")
    return [
      {
        section: "Gestion",
        items: [
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
            badge: stats.rendezvous,
          },
          {
            iconKey: "stethoscope",
            label: "Consultations",
            path: "/dashboard/admin/consultations",
            badge: stats.consultations,
          },
        ],
      },
    ];

  if (role === "medecin")
    return [
      {
        section: "Navigation",
        items: [
          {
            iconKey: "dashboard",
            label: "Dashboard",
            path: "/dashboard/medecin",
          },
          {
            iconKey: "calendar",
            label: "Rendez-vous",
            path: "/dashboard/medecin/rendezvous",
            badge: stats.rendezvous,
          },
          {
            iconKey: "stethoscope",
            label: "Consultations",
            path: "/dashboard/medecin/consultations",
            badge: stats.consultations,
          },
          {
            iconKey: "messageCircle",
            label: "Messagerie",
            path: "/dashboard/medecin/messages",
            badge: stats.messagesNonLus,
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
            badge: stats.ordonnances,
          },
          {
            iconKey: "certificate",
            label: "Certificats",
            path: "/dashboard/medecin/certificats",
          },
          {
            iconKey: "activity",
            label: "Contrôles",
            path: "/dashboard/medecin/controles",
            badge: stats.controles,
          },
          {
            iconKey: "creditCard",
            label: "Facturation",
            path: "/dashboard/medecin/facturation",
            badge: stats.factures,
          },
          {
            iconKey: "shieldCheck",
            label: "Prise en charge CNAM",
            path: "/dashboard/medecin/prise-en-charge-cnam",
          },
          {
            iconKey: "home",
            label: "Comptes Familles",
            path: "/dashboard/medecin/familles",
          },
        ],
      },
    ];

  return [
    {
      section: "Menu",
      items: [
        {
          iconKey: "dashboard",
          label: "Dashboard",
          path: "/dashboard/patient",
        },
        {
          iconKey: "calendar",
          label: "Rendez-vous",
          path: "/dashboard/patient/rendezvous",
          badge: stats.rendezvous,
        },
        {
          iconKey: "stethoscope",
          label: "Consultations",
          path: "/dashboard/patient/consultations",
          badge: stats.consultations,
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
        },
        {
          iconKey: "certificate",
          label: "Certificats médicaux",
          path: "/dashboard/patient/certificats",
        },
        {
          iconKey: "activity",
          label: "Mes Contrôles",
          path: "/dashboard/patient/controles",
          badge: stats.controles,
        },
        {
          iconKey: "creditCard",
          label: "Mes Paiements",
          path: "/dashboard/patient/paiements",
          badge: stats.paiementsEnAttente,
        },
        {
          iconKey: "robot",
          label: "Assistant IA",
          path: "/dashboard/patient/ia",
        },
        {
          iconKey: "home",
          label: "Mon Espace Famille",
          path: "/dashboard/patient/famille",
        },
      ],
    },
  ];
}

function isActive(pathname: string, itemPath: string, role: string): boolean {
  if (pathname === itemPath) return true;
  if (itemPath === `/dashboard/${role}`) return false;
  return pathname.startsWith(itemPath + "/") || pathname === itemPath;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function Sidebar({ stats = {} }: SidebarProps) {
  const { role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const r = (role ?? "patient") as string;
  const t = themes[r as keyof typeof themes] ?? themes.patient;
  const nav = getNav(r, (stats ?? {}) as Record<string, number>);
  const isAdmin = r === "admin";

  const roleLabel =
    r === "admin" ? "Administrateur" : r === "medecin" ? "Médecin" : "Patient";

  const gradientStyle = `linear-gradient(135deg, ${t.accent1}, ${t.accent2})`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        @keyframes sbSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .sb-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 9px 12px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: ${isAdmin ? "#8ba0c0" : "#64748b"};
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          margin-bottom: 2px;
          position: relative;
          animation: sbSlideIn 0.35s ease both;
        }

        .sb-item:hover {
          background: ${isAdmin ? "rgba(139,92,246,0.07)" : `${t.accent1}0d`};
          color: ${isAdmin ? "#f0f4ff" : "#1e1b4b"};
          transform: translateX(2px);
        }

        .sb-item.active {
          background: ${gradientStyle};
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 14px ${t.accent1}44;
          border-color: transparent;
        }

        .sb-item.active .sb-icon-box {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.3);
        }

        .sb-item.highlight {
          border: 1px dashed ${isAdmin ? "rgba(34,211,165,0.3)" : `${t.accent1}44`};
          background: ${isAdmin ? "rgba(34,211,165,0.04)" : `${t.accent1}08`};
        }

        .sb-item.highlight:hover {
          border-color: ${isAdmin ? "rgba(34,211,165,0.6)" : `${t.accent1}88`};
          background: ${isAdmin ? "rgba(34,211,165,0.1)" : `${t.accent1}15`};
          color: ${t.accent1};
        }

        .sb-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${isAdmin ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"};
          border: 1px solid ${isAdmin ? "#1e3050" : "rgba(0,0,0,0.06)"};
          transition: all 0.25s ease;
          flex-shrink: 0;
        }

        .sb-item:hover .sb-icon-box {
          background: ${isAdmin ? "rgba(139,92,246,0.12)" : `${t.accent1}12`};
          border-color: ${isAdmin ? "rgba(139,92,246,0.4)" : `${t.accent1}44`};
        }

        .sb-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 8px;
          background: ${gradientStyle};
          color: white;
          min-width: 22px;
          text-align: center;
          box-shadow: 0 2px 6px ${t.accent1}44;
          flex-shrink: 0;
        }

        .sb-item.active .sb-badge {
          background: rgba(255,255,255,0.25);
          box-shadow: none;
        }

        .sb-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${gradientStyle};
          flex-shrink: 0;
        }

        .sb-item.active .sb-dot {
          background: rgba(255,255,255,0.7);
        }

        .sb-nav::-webkit-scrollbar { width: 3px; }
        .sb-nav::-webkit-scrollbar-track { background: transparent; }
        .sb-nav::-webkit-scrollbar-thumb {
          background: ${isAdmin ? "#1e3050" : "#e2e8f0"};
          border-radius: 10px;
        }
      `}</style>

      <aside
        style={{
          width: 260,
          minHeight: "100vh",
          background: isAdmin
            ? "linear-gradient(180deg, #0d1520 0%, #131f2e 100%)"
            : "rgba(255,255,255,0.88)",
          backdropFilter: isAdmin ? "none" : "blur(20px)",
          WebkitBackdropFilter: isAdmin ? "none" : "blur(20px)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          borderRight: isAdmin
            ? "1px solid #1e3050"
            : "1px solid rgba(255,255,255,0.6)",
          boxShadow: isAdmin
            ? "4px 0 24px rgba(0,0,0,0.4)"
            : `4px 0 24px ${t.accent1}0a`,
          overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
          zIndex: 100,
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "-15%",
            right: "-15%",
            width: "55%",
            height: "45%",
            pointerEvents: "none",
            background: `radial-gradient(circle, ${t.accent1}12 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            left: "-15%",
            width: "55%",
            height: "45%",
            pointerEvents: "none",
            background: `radial-gradient(circle, ${t.accent2}0d 0%, transparent 70%)`,
          }}
        />

        {/* ── Logo ─────────────────────────────────────── */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: `1px solid ${isAdmin ? "#1e3050" : "rgba(0,0,0,0.05)"}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            position: "relative",
            zIndex: 1,
          }}
        >
          <img
            src="/Logo.png"
            alt="AlloMed"
            style={{ width: 88, height: 88, objectFit: "contain" }}
          />
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: isAdmin ? "#4a6080" : `${t.accent1}99`,
              margin: 0,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
            }}
          >
            {roleLabel}
          </p>
        </div>

        {/* ── Navigation ───────────────────────────────── */}
        <nav
          className="sb-nav"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 12px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {nav.map((group) => (
            <div key={group.section} style={{ marginBottom: 8 }}>
              <p
                style={{
                  padding: "0 12px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "1.3px",
                  textTransform: "uppercase",
                  color: isAdmin ? "#4a6080" : "#94a3b8",
                  margin: 0,
                }}
              >
                {group.section}
              </p>

              {group.items.map((item, index) => {
                const active = isActive(pathname, item.path, r);
                const hasBadge = item.badge && item.badge > 0;

                return (
                  <div
                    key={item.path}
                    className={`sb-item${active ? " active" : ""}${item.highlight && !active ? " highlight" : ""}`}
                    style={{ animationDelay: `${index * 0.04}s` }}
                    onClick={() => router.push(item.path)}
                  >
                    <div className="sb-icon-box">
                      <Icon
                        path={icons[item.iconKey as string] ?? icons.dashboard}
                        size={15}
                        color={
                          active ? "white" : isAdmin ? "#8ba0c0" : "#64748b"
                        }
                      />
                    </div>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {hasBadge ? (
                      <span className="sb-badge">{item.badge}</span>
                    ) : item.highlight ? (
                      <span className="sb-dot" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
