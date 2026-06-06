"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

// ─────────────────────────────────────────────────────────────
// ICONS (SVG Components)
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

const iconPaths = {
  bell: "<path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'></path><path d='M13.73 21a2 2 0 0 1-3.46 0'></path>",
  user: "<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path><circle cx='12' cy='7' r='4'></circle>",
  logOut:
    "<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'></path><polyline points='16 17 21 12 16 7'></polyline><line x1='21' y1='12' x2='9' y2='12'></line>",
  check: "<polyline points='20 6 9 17 4 12'></polyline>",
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
}

export default function Navbar({ title, subtitle }: NavbarProps) {
  const { username, role, logout } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = () =>
      api
        .get("notifications/")
        .then((r) => setNotifs(r.data))
        .catch(() => {});
    fetch();
    const interval = setInterval(fetch, 5000);
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
  const isDark = role === "admin";

  // Unified gradient colors
  const accent1 = "#8B5CF6"; // Mauve
  const accent2 = "#10B981"; // Green

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

  const roleLabel =
    role === "admin"
      ? "Administrateur"
      : role === "medecin"
        ? "Médecin"
        : "Patient";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .glass-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          border-radius: 20px;
          z-index: 200;
          overflow: hidden;
          animation: dropIn .25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nb-item {
          transition: all 0.2s ease;
        }
        
        .nb-item:hover {
          background: ${isDark ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.05)"} !important;
        }

        .text-gradient {
          background: linear-gradient(135deg, ${accent1}, ${accent2});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .btn-gradient {
          background: linear-gradient(135deg, ${accent1}, ${accent2});
          color: white;
          border: none;
          box-shadow: 0 4px 12px ${accent1}44;
          transition: all 0.3s ease;
        }

        .btn-gradient:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px ${accent1}55;
        }

        .nav-action-btn {
          background: ${isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)"};
          border: 1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(139, 92, 246, 0.15)"};
          transition: all 0.3s ease;
        }

        .nav-action-btn:hover {
          border-color: ${accent1}88;
          background: ${isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(255,255,255,0.9)"};
          box-shadow: 0 0 12px ${accent1}22;
        }
      `}</style>

      <header
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          left: 260, // Updated to match the new Sidebar width
          height: 70,
          background: isDark
            ? "rgba(15, 12, 26, 0.85)"
            : "rgba(255, 255, 255, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 255, 255, 0.6)"}`,
          display: "flex",
          alignItems: "center",
          padding: "0 2rem",
          justifyContent: "space-between",
          zIndex: 99,
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: isDark
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 20px rgba(139, 92, 246, 0.06)",
        }}
      >
        {/* Titre */}
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: isDark ? "#f0f4ff" : "#1e1b4b",
              margin: 0,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 12,
                color: isDark ? "rgba(255,255,255,0.5)" : "#64748b",
                margin: 0,
                fontWeight: 500,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* 🔔 Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              className="nav-action-btn"
              onClick={() => {
                setShowNotifs(!showNotifs);
                setShowProfile(false);
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <LucideIcon
                path={iconPaths.bell}
                size={20}
                color={isDark ? "#f0f4ff" : "#334155"}
              />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 8,
                    height: 8,
                    background: `linear-gradient(135deg, ${accent1}, ${accent2})`,
                    borderRadius: "50%",
                    border: `2px solid ${isDark ? "#0F0C1A" : "white"}`,
                    boxShadow: `0 0 8px ${accent1}88`,
                  }}
                />
              )}
            </button>

            {showNotifs && (
              <div
                className="glass-dropdown"
                style={{
                  width: 360,
                  background: isDark
                    ? "rgba(15, 12, 26, 0.95)"
                    : "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(24px)",
                  border: `1px solid ${isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(255, 255, 255, 0.8)"}`,
                  boxShadow: isDark
                    ? "0 20px 40px rgba(0,0,0,0.5)"
                    : "0 20px 40px rgba(139, 92, 246, 0.15)",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isDark ? "#f0f4ff" : "#1e1b4b",
                      fontFamily: "'Syne', sans-serif",
                    }}
                  >
                    Notifications
                  </span>
                  {unread > 0 && (
                    <span
                      className="btn-gradient"
                      style={{
                        fontSize: 11,
                        padding: "4px 10px",
                        borderRadius: 20,
                        fontWeight: 700,
                      }}
                    >
                      {unread} nouvelles
                    </span>
                  )}
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {notifs.length === 0 ? (
                    <div
                      style={{
                        padding: "2.5rem",
                        textAlign: "center",
                        color: isDark ? "#4a6080" : "#94a3b8",
                        fontSize: 13,
                      }}
                    >
                      <div style={{ marginBottom: 12 }}>
                        <LucideIcon
                          path={iconPaths.bell}
                          size={32}
                          color={isDark ? "#4a6080" : "#cbd5e1"}
                        />
                      </div>
                      Aucune notification
                    </div>
                  ) : (
                    notifs.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className="nb-item"
                        style={{
                          padding: "14px 20px",
                          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}`,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: n.lu
                              ? isDark
                                ? "#2a3f5a"
                                : "#d1d5db"
                              : `linear-gradient(135deg, ${accent1}, ${accent2})`,
                            marginTop: 6,
                            flexShrink: 0,
                            boxShadow: n.lu ? "none" : `0 0 8px ${accent1}66`,
                          }}
                        />
                        <p
                          style={{
                            fontSize: 13,
                            color: isDark
                              ? n.lu
                                ? "#4a6080"
                                : "#c8d8f0"
                              : n.lu
                                ? "#94a3b8"
                                : "#334155",
                            lineHeight: 1.5,
                            fontWeight: n.lu ? 400 : 600,
                            margin: 0,
                          }}
                        >
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div style={{ padding: "12px 16px" }}>
                  <button
                    className="btn-gradient"
                    onClick={() => {
                      router.push(notifPath);
                      setShowNotifs(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Voir toutes les notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 👤 Profil dropdown */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              className="nav-action-btn"
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifs(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 14px 6px 6px",
                borderRadius: 14,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: "white",
                  fontWeight: 800,
                  boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
                }}
              >
                {username ? username[0].toUpperCase() : "?"}
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: isDark ? "#f0f4ff" : "#1e1b4b",
                }}
              >
                {username}
              </span>
              <LucideIcon
                path="M6 9l6 6 6-6"
                size={14}
                color={isDark ? "#4a6080" : "#94a3b8"}
                style={{ marginLeft: 4 }}
              />
            </button>

            {showProfile && (
              <div
                className="glass-dropdown"
                style={{
                  width: 260,
                  background: isDark
                    ? "rgba(15, 12, 26, 0.95)"
                    : "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(24px)",
                  border: `1px solid ${isDark ? "rgba(139, 92, 246, 0.2)" : "rgba(255, 255, 255, 0.8)"}`,
                  boxShadow: isDark
                    ? "0 20px 40px rgba(0,0,0,0.5)"
                    : "0 20px 40px rgba(139, 92, 246, 0.15)",
                }}
              >
                {/* Info utilisateur */}
                <div
                  style={{
                    padding: "20px",
                    borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background:
                          "linear-gradient(135deg, #534AB7 , #10B981)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        color: "white",
                        fontWeight: 800,
                        boxShadow: "0 6px 12px rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      {username ? username[0].toUpperCase() : "?"}
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: isDark ? "#f0f4ff" : "#1e1b4b",
                          margin: 0,
                        }}
                      >
                        {username}
                      </p>
                      <p
                        className="text-gradient"
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          margin: 0,
                          marginTop: 2,
                        }}
                      >
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ padding: "10px" }}>
                  <button
                    className="nb-item"
                    onClick={() => {
                      router.push(profilPath);
                      setShowProfile(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 12,
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(139, 92, 246, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LucideIcon
                        path={iconPaths.user}
                        size={16}
                        color={isDark ? "#c8d8f0" : "#64748b"}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        color: isDark ? "#c8d8f0" : "#334155",
                        fontWeight: 500,
                      }}
                    >
                      Mon profil
                    </span>
                  </button>

                  <button
                    className="nb-item"
                    onClick={() => {
                      router.push(notifPath);
                      setShowProfile(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 12,
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(16, 185, 129, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LucideIcon
                        path={iconPaths.bell}
                        size={16}
                        color={isDark ? "#c8d8f0" : "#64748b"}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 14,
                        color: isDark ? "#c8d8f0" : "#334155",
                        fontWeight: 500,
                      }}
                    >
                      Notifications
                    </span>
                    {unread > 0 && (
                      <span
                        className="btn-gradient"
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 8,
                          fontWeight: 700,
                        }}
                      >
                        {unread}
                      </span>
                    )}
                  </button>
                </div>

                {/* Déconnexion */}
                <div
                  style={{
                    padding: "10px",
                    paddingTop: 0,
                  }}
                >
                  <button
                    className="nb-item"
                    onClick={() => {
                      logout();
                      router.push("/login");
                    }}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: "rgba(239, 68, 68, 0.05)",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 12,
                      fontFamily: "inherit",
                      textAlign: "left",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(239, 68, 68, 0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(239, 68, 68, 0.05)")
                    }
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "rgba(239, 68, 68, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LucideIcon
                        path={iconPaths.logOut}
                        size={16}
                        color="#ef4444"
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 14,
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
