"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import MessagesBell from "./MessagesBell";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────

const T_PATIENT = {
  bg: "rgba(255,255,255,0.78)",
  dropdownBg: "rgba(255,255,255,0.96)",
  border: "rgba(76,175,130,0.18)",
  textPrimary: "#1A1A1A",
  textMuted: "#6B6560",
  accent: "#4CAF82",
  accentLight: "rgba(76,175,130,0.10)",
  accentDark: "#2E7D55",
  gradientA: "#4CAF82", // Teal/Vert Patient
  gradientB: "#10B981",
  shadow: "0 4px 20px rgba(76,175,130,0.08)",
  dropdownShadow: "0 20px 40px rgba(76,175,130,0.14)",
  iconBtnBg: "rgba(255,255,255,0.7)",
  iconBtnHoverBg: "rgba(255,255,255,0.95)",
  iconBtnHoverBorder: "rgba(76,175,130,0.4)",
  itemHoverBg: "rgba(76,175,130,0.05)",
  avatarBg: "linear-gradient(135deg,#4CAF82,#10B981)",
  menuItemBg: "rgba(76,175,130,0.08)",
  isDark: false,
};

const T_MEDECIN = {
  bg: "rgba(255,255,255,0.78)",
  dropdownBg: "rgba(255,255,255,0.96)",
  border: "rgba(139,92,246,0.18)",
  textPrimary: "#1e1b4b",
  textMuted: "#6B7280",
  accent: "#8B5CF6",
  accentLight: "rgba(139,92,246,0.10)",
  accentDark: "#6D28D9",
  gradientA: "#8B5CF6", // Violet Médecin
  gradientB: "#10B981",
  shadow: "0 4px 20px rgba(139,92,246,0.08)",
  dropdownShadow: "0 20px 40px rgba(139,92,246,0.15)",
  iconBtnBg: "rgba(255,255,255,0.7)",
  iconBtnHoverBg: "rgba(255,255,255,0.95)",
  iconBtnHoverBorder: "rgba(139,92,246,0.4)",
  itemHoverBg: "rgba(139,92,246,0.05)",
  avatarBg: "linear-gradient(135deg,#8B5CF6,#10B981)",
  menuItemBg: "rgba(139,92,246,0.08)",
  isDark: false,
};

const T_ADMIN = {
  bg: "#0d1520",
  dropdownBg: "#0d1520",
  border: "#1e3050",
  textPrimary: "#f0f4ff",
  textMuted: "#8ba0c0",
  accent: "#22d3a5",
  accentLight: "rgba(34,211,165,0.12)",
  accentDark: "#22d3a5",
  gradientA: "#8B5CF6", // Violet Admin (Primary)
  gradientB: "#22d3a5", // Teal Admin (Secondary)
  shadow: "0 1px 0 #1e3050",
  dropdownShadow: "0 20px 40px rgba(0,0,0,0.6)",
  iconBtnBg: "rgba(255,255,255,0.04)",
  iconBtnHoverBg: "rgba(139,92,246,0.12)",
  iconBtnHoverBorder: "rgba(139,92,246,0.4)",
  itemHoverBg: "rgba(255,255,255,0.04)",
  avatarBg: "linear-gradient(135deg,#8B5CF6,#22d3a5)",
  menuItemBg: "rgba(255,255,255,0.05)",
  isDark: true,
};

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

const iconPaths = {
  bell: "<path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'></path><path d='M13.73 21a2 2 0 0 1-3.46 0'></path>",
  user: "<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path><circle cx='12' cy='7' r='4'></circle>",
  logOut:
    "<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'></path><polyline points='16 17 21 12 16 7'></polyline><line x1='21' y1='12' x2='9' y2='12'></line>",
  chevronDown: "<polyline points='6 9 12 15 18 9'></polyline>",
};

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Notification {
  id: number;
  message: string;
  lu: boolean;
}
interface NavbarProps {
  title: string;
  subtitle?: string;
  // Optionnel : Pour forcer l'affichage "Dashboard ROLE" si désiré
  showRoleHeader?: boolean;
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function Navbar({
  title,
  subtitle,
  showRoleHeader = true,
}: NavbarProps) {
  const { username, role, logout } = useAuth();
  const router = useRouter();

  const tk =
    role === "admin" ? T_ADMIN : role === "medecin" ? T_MEDECIN : T_PATIENT;

  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Détermination du label du rôle et des couleurs pour le header
  const roleInfo = {
    admin: { label: "Admin", colorA: "#8B5CF6", colorB: "#22d3a5" },
    medecin: { label: "Médecin", colorA: "#8B5CF6", colorB: "#10B981" },
    patient: { label: "Patient", colorA: "#378ADD", colorB: "#059669" },
  };

  const currentRoleInfo =
    roleInfo[role as keyof typeof roleInfo] || roleInfo.patient;

  // Si on veut utiliser les couleurs du token actuel par défaut ou celles du rôle spécifique
  // Ici on force les couleurs spécifiques au rôle pour la cohérence demandée
  const headerGradient = `linear-gradient(135deg, ${currentRoleInfo.colorA}, ${currentRoleInfo.colorB})`;

  useEffect(() => {
    const fetchNotifs = () =>
      api
        .get("notifications/")
        .then((r) => setNotifs(r.data))
        .catch(() => {});
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter((n) => !n.lu).length;

  const notifPath =
    role === "admin"
      ? "/dashboard/admin/notifications"
      : role === "medecin"
        ? "/dashboard/medecin/notifications"
        : "/dashboard/patient/notifications";

  const profilPath =
    role === "admin"
      ? "/dashboard/admin/profil"
      : role === "medecin"
        ? "/dashboard/medecin/profil"
        : "/dashboard/patient/profil";

  const gradientStyle = `linear-gradient(135deg, ${tk.gradientA}, ${tk.gradientB})`;

  const dropdownCard: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    background: tk.dropdownBg,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${tk.border}`,
    borderRadius: 16,
    boxShadow: tk.dropdownShadow,
    zIndex: 200,
    overflow: "hidden",
    animation: "navDropIn 0.2s cubic-bezier(0.4,0,0.2,1)",
  };

  const iconBtnBase: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 10,
    border: `1px solid ${tk.border}`,
    background: tk.iconBtnBg,
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    transition: "all 0.2s ease",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');

        @keyframes navDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .nav-icon-btn:hover {
          background: ${tk.iconBtnHoverBg} !important;
          border-color: ${tk.iconBtnHoverBorder} !important;
          box-shadow: 0 0 12px ${tk.gradientA}22 !important;
        }
        .nav-dd-item { transition: background 0.15s; }
        .nav-dd-item:hover { background: ${tk.itemHoverBg} !important; }
        .nav-grad-btn {
          background: ${gradientStyle};
          color: white;
          border: none;
          box-shadow: 0 4px 12px ${tk.gradientA}44;
          transition: all 0.25s ease;
        }
        .nav-grad-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px ${tk.gradientA}55;
        }
      `}</style>

      <header
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          left: 260,
          height: 66,
          // Admin : couleur plate identique au top du sidebar (#0d1520)
          // + bordure basse = même séparateur que sidebar (#1e3050)
          background: role === "admin" ? "#0d1520" : tk.bg,
          backdropFilter: role === "admin" ? "none" : "blur(20px)",
          WebkitBackdropFilter: role === "admin" ? "none" : "blur(20px)",
          borderBottom: `1px solid ${tk.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          justifyContent: "space-between",
          zIndex: 99,
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: tk.shadow,
        }}
      >
        {/* ── Titre avec Rôle ──────────────────────────────────────── */}
        <div>
          {showRoleHeader ? (
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: tk.textPrimary,
                margin: 0,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              Dashboard{" "}
              <span
                style={{
                  background: headerGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {currentRoleInfo.label}
              </span>
            </h1>
          ) : (
            // Fallback si on ne veut pas le format Dashboard ROLE
            <h1
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: tk.textPrimary,
                margin: 0,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h1>
          )}

          {subtitle && (
            <p
              style={{
                fontSize: 12,
                color: tk.textMuted,
                margin: 0,
                fontWeight: 400,
                marginTop: 2,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Messages — médecin uniquement */}
          {role === "medecin" && <MessagesBell />}

          {/* ── Notifications ──────────────────────────────── */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              className="nav-icon-btn"
              onClick={() => {
                setShowNotifs(!showNotifs);
                setShowProfile(false);
              }}
              style={iconBtnBase}
            >
              <Icon path={iconPaths.bell} size={17} color={tk.textMuted} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 7,
                    height: 7,
                    background: gradientStyle,
                    borderRadius: "50%",
                    border: `2px solid ${role === "admin" ? "#0d1520" : "white"}`,
                    boxShadow: `0 0 8px ${tk.gradientA}88`,
                  }}
                />
              )}
            </button>

            {showNotifs && (
              <div style={{ ...dropdownCard, width: 350 }}>
                {/* Header */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: `1px solid ${tk.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: tk.textPrimary,
                    }}
                  >
                    Notifications
                  </span>
                  {unread > 0 && (
                    <span
                      className="nav-grad-btn"
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontWeight: 700,
                        cursor: "default",
                      }}
                    >
                      {unread} nouvelles
                    </span>
                  )}
                </div>

                {/* Liste */}
                <div style={{ maxHeight: 290, overflowY: "auto" }}>
                  {notifs.length === 0 ? (
                    <div
                      style={{
                        padding: "36px",
                        textAlign: "center",
                        color: tk.textMuted,
                        fontSize: 13,
                      }}
                    >
                      <div style={{ marginBottom: 10 }}>
                        <Icon
                          path={iconPaths.bell}
                          size={28}
                          color={tk.isDark ? "#1e3050" : "#D4CFC6"}
                        />
                      </div>
                      Aucune notification
                    </div>
                  ) : (
                    notifs.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className="nav-dd-item"
                        style={{
                          padding: "13px 18px",
                          borderBottom: `1px solid ${tk.border}`,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 11,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: n.lu
                              ? tk.isDark
                                ? "#1e3050"
                                : "#D4CFC6"
                              : gradientStyle,
                            marginTop: 5,
                            flexShrink: 0,
                            boxShadow: n.lu
                              ? "none"
                              : `0 0 8px ${tk.gradientA}66`,
                          }}
                        />
                        <p
                          style={{
                            fontSize: 13,
                            color: n.lu ? tk.textMuted : tk.textPrimary,
                            lineHeight: 1.5,
                            fontWeight: n.lu ? 400 : 500,
                            margin: 0,
                          }}
                        >
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div style={{ padding: "12px 14px" }}>
                  <button
                    className="nav-grad-btn"
                    onClick={() => {
                      router.push(notifPath);
                      setShowNotifs(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Voir toutes les notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Profil ─────────────────────────────────────── */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              className="nav-icon-btn"
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifs(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "5px 12px 5px 5px",
                borderRadius: 12,
                border: `1px solid ${tk.border}`,
                background: tk.iconBtnBg,
                backdropFilter: "blur(12px)",
                cursor: "pointer",
                height: 38,
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: tk.avatarBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: "white",
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${tk.gradientA}44`,
                }}
              >
                {username ? username[0].toUpperCase() : "?"}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: tk.textPrimary,
                }}
              >
                {username}
              </span>
              <Icon
                path={iconPaths.chevronDown}
                size={13}
                color={tk.textMuted}
              />
            </button>

            {showProfile && (
              <div style={{ ...dropdownCard, width: 250 }}>
                {/* Carte utilisateur */}
                <div
                  style={{
                    padding: "18px",
                    borderBottom: `1px solid ${tk.border}`,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: tk.avatarBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        color: "white",
                        fontWeight: 700,
                        boxShadow: `0 4px 12px ${tk.gradientA}44`,
                      }}
                    >
                      {username ? username[0].toUpperCase() : "?"}
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: tk.textPrimary,
                          margin: 0,
                        }}
                      >
                        {username}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          margin: "2px 0 0",
                          // Utilisation du gradient spécifique au rôle pour le label dans le menu
                          background: headerGradient,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {currentRoleInfo.label}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Liens menu */}
                <div style={{ padding: "8px" }}>
                  {[
                    {
                      icon: iconPaths.user,
                      label: "Mon profil",
                      path: profilPath,
                    },
                    {
                      icon: iconPaths.bell,
                      label: "Notifications",
                      path: notifPath,
                      badge: unread,
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="nav-dd-item"
                      onClick={() => {
                        router.push(item.path);
                        setShowProfile(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: 9,
                        fontFamily: "'DM Sans', sans-serif",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 7,
                          background: tk.menuItemBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon path={item.icon} size={14} color={tk.textMuted} />
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          color: tk.textPrimary,
                          fontWeight: 500,
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </span>
                      {item.badge && item.badge > 0 ? (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "2px 8px",
                            borderRadius: 8,
                            fontWeight: 700,
                            background: tk.accentLight,
                            color: tk.accentDark,
                          }}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>

                {/* Déconnexion */}
                <div style={{ padding: "8px", paddingTop: 0 }}>
                  <button
                    className="nav-dd-item"
                    onClick={() => {
                      logout();
                      router.push("/login");
                    }}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "rgba(239,68,68,0.04)",
                      border: "1px solid rgba(239,68,68,0.12)",
                      cursor: "pointer",
                      borderRadius: 9,
                      fontFamily: "'DM Sans', sans-serif",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        background: "rgba(239,68,68,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon path={iconPaths.logOut} size={14} color="#ef4444" />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#ef4444",
                        fontWeight: 600,
                      }}
                    >
                      Se déconnecter
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
