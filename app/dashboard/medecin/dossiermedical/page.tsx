"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";

/* ═══════════════════ TYPES ═══════════════════ */

interface SavedAttachment {
  id: number;
  name: string;
  type: "image" | "document";
  url: string;
}

interface DMESection {
  id: string;
  title: string;
  icon: string;
  content: string;
  attachments?: SavedAttachment[];
}

interface SharedDMERecord {
  id: number;
  patient_name: string;
  patient_id: number;
  expires_at: string;
  sections: DMESection[];
  created_at: string;
  token: string;
}

interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
  dossiersMedical?: number;
}

/* ═══════════════════ CONSTANTES ═══════════════════ */

const ICON_MAP: Record<string, string> = {
  "[1]": "🩺",
  "[2]": "⚡",
  "[3]": "💊",
  "[4]": "💉",
  "[5]": "🏥",
  "[6]": "📝",
};
function resolveIcon(raw: string) {
  return ICON_MAP[raw] ?? raw;
}

const SECTION_META: Record<string, { gradient: string; color: string }> = {
  antecedents: {
    gradient: "135deg, #8B5CF6 0%, #10B981 100%",
    color: "#8B5CF6",
  },
  allergies: {
    gradient: "135deg, #F093FB 0%, #F5576C 100%",
    color: "#F5576C",
  },
  traitements: {
    gradient: "135deg, #4FACFE 0%, #00F2FE 100%",
    color: "#4FACFE",
  },
  vaccins: {
    gradient: "135deg, #43E97B 0%, #38F9D7 100%",
    color: "#10B981",
  },
  chirurgies: {
    gradient: "135deg, #FA709A 0%, #FEE140 100%",
    color: "#FA709A",
  },
  notes: {
    gradient: "135deg, #A18CD1 0%, #FBC2EB 100%",
    color: "#A18CD1",
  },
};

/* ═══════════════════ COMPOSANTS UTILITAIRES ═══════════════════ */

function TimeBar({
  expiresAt,
  compact = false,
}: {
  expiresAt: string;
  compact?: boolean;
}) {
  const [remaining, setRemaining] = useState("");
  const [percent, setPercent] = useState(100);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const exp = new Date(expiresAt).getTime();
    const created = exp - 86400000;
    const update = () => {
      const now = Date.now();
      const left = Math.max(0, exp - now);
      const total = exp - created;
      const safeTotal = total > 0 ? total : 86400000;
      setPercent(Math.min(100, Math.round((left / safeTotal) * 100)));
      setExpired(left <= 0);
      const h = Math.floor(left / 3600000);
      const m = Math.floor((left % 3600000) / 60000);
      const s = Math.floor((left % 60000) / 1000);
      setRemaining(
        left <= 0
          ? "Expiré"
          : h > 0
            ? `${h}h ${String(m).padStart(2, "0")}m`
            : `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`,
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const color = expired
    ? "#EF4444"
    : percent > 60
      ? "#10B981"
      : percent > 25
        ? "#F59E0B"
        : "#EF4444";

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 4,
            background: "#F1F5F9",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${percent}%`,
              background: expired
                ? "#EF4444"
                : `linear-gradient(90deg, ${color}, ${color}aa)`,
              borderRadius: 2,
              transition: "width 1s linear, background 0.5s",
            }}
          />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color,
            whiteSpace: "nowrap",
          }}
        >
          {remaining}
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!expired && (
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 8px ${color}`,
                animation: "dmeCardPulse 2s ease infinite",
              }}
            />
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: expired ? "#EF4444" : "#64748B",
            }}
          >
            {expired ? "Accès expiré" : "Expiration dans"}
          </span>
        </div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            fontFamily: "'Syne', sans-serif",
            color,
          }}
        >
          {remaining}
        </span>
      </div>
      <div
        style={{
          height: 5,
          background: "#F1F5F9",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: expired
              ? "#EF4444"
              : `linear-gradient(90deg, ${color}, ${color}aa)`,
            borderRadius: 3,
            transition: "width 1s linear, background 0.5s",
          }}
        />
      </div>
    </div>
  );
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const hue = (name.charCodeAt(0) * 37) % 360;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.35,
        flexShrink: 0,
        background: `linear-gradient(135deg, hsl(${hue},70%,45%), hsl(${(hue + 60) % 360},70%,55%))`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        color: "white",
        fontFamily: "'DM Serif Display',serif",
        boxShadow: `0 4px 12px hsla(${hue},70%,45%,0.3)`,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── Lightbox pour agrandir les images ─── */
function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          borderRadius: 12,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      />
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          border: "none",
          color: "white",
          fontSize: 20,
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
}

/* ═══════════════════ PAGE MÉDECIN ═══════════════════ */

export default function MedecinDMEPage() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });
  const [sharedDossiers, setSharedDossiers] = useState<SharedDMERecord[]>([]);
  const [selectedDossier, setSelectedDossier] =
    useState<SharedDMERecord | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [loadingToken, setLoadingToken] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxImg, setLightboxImg] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const [nowTs, setNowTs] = useState<number>(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const isExpired = (d: SharedDMERecord) => {
    return new Date(d.expires_at).getTime() < nowTs;
  };

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
      .then(([r, c, o]) =>
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
        }),
      )
      .catch(() => {});

    api
      .get("dossier-medical/shared/")
      .then((res) => {
        const data = res.data as SharedDMERecord[];
        setSharedDossiers(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  const openDossier = (dossier: SharedDMERecord) => {
    setSelectedDossier(dossier);
    setActiveSection(dossier.sections[0]?.id || "");
  };

  const accessByToken = async () => {
    if (!tokenInput.trim()) return;
    setLoadingToken(true);
    setTokenError("");
    try {
      let clean = tokenInput.trim();
      if (clean.includes("/")) {
        const p = clean.split("/");
        clean = p[p.length - 1];
      }
      const res = await api.get(`dossier-medical/access/${clean}/`);
      const dossier = res.data as SharedDMERecord;
      setSharedDossiers((prev) => {
        const exists = prev.find((d) => d.token === dossier.token);
        return exists ? prev : [dossier, ...prev];
      });
      openDossier(dossier);
      setTokenInput("");
    } catch {
      setTokenError("Lien invalide ou expiré.");
    }
    setLoadingToken(false);
  };

  const removeDossier = (t: string) => {
    setSharedDossiers((prev) => prev.filter((d) => d.token !== t));
    if (selectedDossier?.token === t) {
      setSelectedDossier(null);
      setActiveSection("");
    }
  };

  if (isLoading || loading) return null;

  const currentSection = selectedDossier?.sections.find(
    (s) => s.id === activeSection,
  );
  const filledSections =
    selectedDossier?.sections.filter(
      (s) => s.content.trim().length > 0 || (s.attachments && s.attachments.length > 0),
    ) ?? [];
  const activeDossiers = sharedDossiers.filter((d) => !isExpired(d));
  const filtered = searchQuery
    ? sharedDossiers.filter((d) =>
        d.patient_name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : sharedDossiers;

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        @keyframes dmeCardPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes dmeFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dmeSlideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }

        .dme-bg {
          background: linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 100%);
          min-height: 100vh;
        }

        .dme-card {
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.95);
          border-radius: 24px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        }

        .text-grad {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dossier-row {
          display:flex; align-items:center; gap:12px;
          padding:12px 14px; border-radius:14px;
          cursor:pointer; transition:all 0.2s ease;
          border:1.5px solid transparent;
          background:rgba(255,255,255,0.4);
          margin-bottom:8px;
        }
        .dossier-row:hover:not(.exp-row) {
          border-color:rgba(16,185,129,0.25);
          background:rgba(16,185,129,0.06);
          transform:translateX(3px);
        }
        .dossier-row.sel-row {
          border-color:rgba(16,185,129,0.4);
          background:rgba(16,185,129,0.1);
          box-shadow: 0 4px 12px rgba(16,185,129,0.08);
        }
        .dossier-row.exp-row { opacity:0.5; cursor:not-allowed; filter: grayscale(0.5); }

        .sec-tab-med {
          display:flex; align-items:center; gap:9px;
          padding:10px 13px; border-radius:12px;
          cursor:pointer; transition:all 0.2s;
          font-size:13px; font-weight:500; color:#64748B;
          border:1px solid transparent;
        }
        .sec-tab-med:hover { background:rgba(139,92,246,0.05); color:#334155; border-color:rgba(139,92,246,0.1); }
        .sec-tab-med.active-tab {
          background:linear-gradient(135deg,rgba(139,92,246,0.1),rgba(16,185,129,0.08));
          color:#1E293B; border-color:rgba(139,92,246,0.3);
          box-shadow:0 2px 8px rgba(139,92,246,0.1);
        }
        .sec-tab-med.empty-tab { opacity:0.4; }

        .token-field {
          flex:1; padding:13px 18px;
          border:1.5px solid rgba(0,0,0,0.06);
          border-radius:14px; font-family:'DM Sans',sans-serif;
          font-size:14px; color:#334155; background:rgba(255,255,255,0.6); outline:none;
          transition:all 0.2s;
        }
        .token-field:focus { border-color:rgba(139,92,246,0.4); background:white; box-shadow:0 0 0 4px rgba(139,92,246,0.08); }

        .token-submit {
          padding:13px 24px; border-radius:14px;
          background:linear-gradient(135deg,#8B5CF6,#10B981); color:white;
          border:none; font-family:'DM Sans',sans-serif; font-weight:700; font-size:14px;
          cursor:pointer; white-space:nowrap; transition:all 0.25s;
          box-shadow:0 4px 14px rgba(139,92,246,0.25);
        }
        .token-submit:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 20px rgba(139,92,246,0.35); }

        .stat-card {
          padding:20px 22px; display:flex; align-items:center; gap:14px;
        }
        .stat-icon {
          width:46px; height:46px; border-radius:14px;
          display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;
        }

        .content-area {
          background:white; border:1.5px solid rgba(0,0,0,0.04);
          border-radius:16px; padding:24px; min-height:200px;
          font-size:15px; line-height:1.8; color:#334155; white-space:pre-wrap;
        }

        .read-badge {
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 12px; border-radius:20px;
          background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2);
          color:#059669; font-size:11px; font-weight:700; letter-spacing:0.5px;
        }

        .att-img-card {
          border-radius:12px; overflow:hidden;
          border:1px solid rgba(0,0,0,0.06);
          cursor:pointer; transition:all 0.2s;
        }
        .att-img-card:hover {
          transform:scale(1.03);
          box-shadow:0 6px 20px rgba(0,0,0,0.1);
        }
        .att-img-card img {
          width:100%; height:100px; object-fit:cover; display:block;
        }
        .att-img-card .att-label {
          padding:6px 10px; font-size:11px; color:#334155;
          font-weight:600; background:white;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }

        .att-doc-card {
          display:flex; align-items:center; gap:10px;
          padding:12px 14px; background:#F8FAFC;
          border:1px solid #E2E8F0; border-radius:12px;
          transition:all 0.2s; text-decoration:none;
        }
        .att-doc-card:hover {
          background:#EFF6FF; border-color:#93C5FD;
        }
      `}</style>

      <div
        className="dme-bg"
        style={{ display: "flex", fontFamily: "'DM Sans', sans-serif" }}
      >
        <Sidebar stats={stats} />
        <Navbar
          title="Dossiers Patients"
          subtitle={`Dr. ${username ?? ""} — Lecture seule`}
        />

        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "2rem",
            paddingTop: "calc(70px + 2rem)",
          }}
        >
          {/* Lightbox */}
          {lightboxImg && (
            <ImageLightbox
              src={lightboxImg.src}
              alt={lightboxImg.alt}
              onClose={() => setLightboxImg(null)}
            />
          )}

          {/* Token access */}
          <div
            className="dme-card"
            style={{
              padding: "20px 24px",
              marginBottom: 20,
              animation: "dmeFadeUp 0.35s ease",
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: "#64748B",
                marginBottom: 12,
              }}
            >
              Accéder via lien de partage
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="token-field"
                placeholder="Collez le code ou lien fourni par le patient…"
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value);
                  setTokenError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && accessByToken()}
              />
              <button
                className="token-submit"
                onClick={accessByToken}
                disabled={loadingToken || !tokenInput.trim()}
              >
                {loadingToken ? "…" : "🔓 Accéder"}
              </button>
            </div>
            {tokenError && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: "#DC2626",
                  fontWeight: 600,
                }}
              >
                ⚠️ {tokenError}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div className="dme-card stat-card">
              <div
                className="stat-icon"
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.15)",
                }}
              >
                📂
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#10B981",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {activeDossiers.length}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#64748B",
                    fontWeight: 600,
                    margin: 0,
                    marginTop: 3,
                  }}
                >
                  Dossiers actifs
                </p>
              </div>
            </div>
            <div className="dme-card stat-card">
              <div
                className="stat-icon"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.12)",
                }}
              >
                🔒
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#EF4444",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {sharedDossiers.length - activeDossiers.length}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#64748B",
                    fontWeight: 600,
                    margin: 0,
                    marginTop: 3,
                  }}
                >
                  Expirés
                </p>
              </div>
            </div>
            <div className="dme-card stat-card">
              <div
                className="stat-icon"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.12)",
                }}
              >
                👥
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#6366F1",
                    margin: 0,
                    lineHeight: 1,
                  }}
                >
                  {sharedDossiers.length}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: "#64748B",
                    fontWeight: 600,
                    margin: 0,
                    marginTop: 3,
                  }}
                >
                  Total patients
                </p>
              </div>
            </div>
          </div>

          {/* Main layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "300px 1fr",
              gap: 16,
            }}
          >
            {/* Dossier list */}
            <div
              className="dme-card"
              style={{ padding: 18, alignSelf: "start" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: "#94A3B8",
                    margin: 0,
                  }}
                >
                  Dossiers
                </p>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 8,
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    color: "#059669",
                  }}
                >
                  {activeDossiers.length} actif(s)
                </span>
              </div>

              <input
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "9px 14px",
                  marginBottom: 12,
                  border: "1.5px solid rgba(0,0,0,0.06)",
                  borderRadius: 11,
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 13,
                  color: "#334155",
                  background: "rgba(255,255,255,0.5)",
                  outline: "none",
                }}
                placeholder="🔍 Rechercher…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {filtered.length === 0 ? (
                <div
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "#64748B",
                  }}
                >
                  <p style={{ fontSize: 32, marginBottom: 8 }}>🗂️</p>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>Aucun dossier</p>
                </div>
              ) : (
                filtered.map((d) => {
                  const exp = isExpired(d);
                  const sel = selectedDossier?.token === d.token;
                  return (
                    <div
                      key={d.token}
                      className={`dossier-row ${sel ? "sel-row" : ""} ${exp ? "exp-row" : ""}`}
                      onClick={() => !exp && openDossier(d)}
                    >
                      <Avatar name={d.patient_name} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: exp ? "#94A3B8" : "#1E293B",
                            margin: 0,
                            marginBottom: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {d.patient_name}
                        </p>
                        {!exp && <TimeBar expiresAt={d.expires_at} compact />}
                        {exp && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "#EF4444",
                              fontWeight: 700,
                            }}
                          >
                            ⛔ Expiré
                          </span>
                        )}
                      </div>
                      {exp && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDossier(d.token);
                          }}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 8,
                            background: "rgba(239,68,68,0.05)",
                            border: "1px solid rgba(239,68,68,0.15)",
                            color: "#EF4444",
                            fontSize: 11,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Viewer */}
            {!selectedDossier ? (
              <div
                className="dme-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 40px",
                  textAlign: "center",
                  minHeight: 400,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    background: "rgba(139,92,246,0.05)",
                    border: "1.5px dashed rgba(139,92,246,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                    marginBottom: 20,
                  }}
                >
                  📋
                </div>
                <h3
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#1E293B",
                    marginBottom: 10,
                  }}
                >
                  Aucun dossier sélectionné
                </h3>
                <p
                  style={{
                    color: "#64748B",
                    fontSize: 14,
                    lineHeight: 1.6,
                    maxWidth: 280,
                  }}
                >
                  Sélectionnez un dossier ou utilisez un lien de partage pour
                  commencer.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* Patient header card */}
                <div className="dme-card" style={{ padding: "24px 28px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <Avatar
                        name={selectedDossier.patient_name}
                        size={54}
                      />
                      <div>
                        <h2
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 22,
                            fontWeight: 800,
                            color: "#1E293B",
                            margin: 0,
                            marginBottom: 4,
                          }}
                        >
                          {selectedDossier.patient_name}
                        </h2>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#64748B",
                            margin: 0,
                          }}
                        >
                          Partagé le{" "}
                          {new Date(
                            selectedDossier.created_at,
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="read-badge">🔍 Lecture seule</span>
                  </div>

                  <TimeBar expiresAt={selectedDossier.expires_at} />

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 12,
                      marginTop: 20,
                    }}
                  >
                    {[
                      {
                        val: filledSections.length,
                        label: "Sections remplies",
                        color: "#8B5CF6",
                      },
                      {
                        val: selectedDossier.sections.length,
                        label: "Total sections",
                        color: "#10B981",
                      },
                      {
                        val: `${Math.max(0, Math.round((new Date(selectedDossier.expires_at).getTime() - Date.now()) / 3600000))}h`,
                        label: "Restantes",
                        color: "#F59E0B",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          padding: "14px 16px",
                          background: "rgba(255,255,255,0.5)",
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.8)",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 24,
                            fontWeight: 800,
                            color: item.color,
                            margin: 0,
                          }}
                        >
                          {item.val}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "#64748B",
                            fontWeight: 600,
                            margin: 0,
                            marginTop: 2,
                          }}
                        >
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sections reader */}
                <div className="dme-card" style={{ padding: 24 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "220px 1fr",
                      gap: 20,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#94A3B8",
                          marginBottom: 12,
                        }}
                      >
                        Sections
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {selectedDossier.sections.map((section) => {
                          const filled =
                            section.content.trim().length > 0 ||
                            (section.attachments &&
                              section.attachments.length > 0);
                          const isAct = activeSection === section.id;
                          return (
                            <div
                              key={section.id}
                              className={`sec-tab-med ${isAct ? "active-tab" : ""} ${!filled ? "empty-tab" : ""}`}
                              onClick={() => setActiveSection(section.id)}
                            >
                              <span style={{ fontSize: 15 }}>
                                {resolveIcon(section.icon)}
                              </span>
                              <span style={{ flex: 1 }}>
                                {section.title}
                              </span>
                              {filled ? (
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: isAct
                                      ? "#8B5CF6"
                                      : "#10B981",
                                    flexShrink: 0,
                                    boxShadow: isAct
                                      ? "0 0 8px rgba(139,92,246,0.6)"
                                      : "0 0 6px rgba(16,185,129,0.6)",
                                  }}
                                />
                              ) : (
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: "rgba(0,0,0,0.05)",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      key={activeSection}
                      style={{ animation: "dmeFadeUp 0.25s ease" }}
                    >
                      {currentSection && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 14,
                              marginBottom: 20,
                            }}
                          >
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 16,
                                flexShrink: 0,
                                background: `linear-gradient(${SECTION_META[currentSection.id]?.gradient || "135deg, #8B5CF6, #10B981"})`,
                                border: "1px solid rgba(255,255,255,0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 22,
                                boxShadow:
                                  "0 8px 24px rgba(0,0,0,0.1)",
                              }}
                            >
                              {resolveIcon(currentSection.icon)}
                            </div>
                            <h3
                              style={{
                                fontFamily: "'Syne',sans-serif",
                                fontSize: 20,
                                fontWeight: 800,
                                color: "#1E293B",
                                margin: 0,
                              }}
                            >
                              {currentSection.title}
                            </h3>
                          </div>

                          {/* ═══ Contenu texte ═══ */}
                          <div className="content-area">
                            {currentSection.content.trim() ? (
                              currentSection.content
                            ) : !currentSection.attachments?.length ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "40px",
                                  color: "#94A3B8",
                                  textAlign: "center",
                                  gap: 12,
                                }}
                              >
                                <span style={{ fontSize: 32 }}>📭</span>
                                <p
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    margin: 0,
                                  }}
                                >
                                  Non renseigné par le patient
                                </p>
                              </div>
                            ) : null}
                          </div>

                          {/* ═══ PIÈCES JOINTES ENVOYÉES PAR LE PATIENT ═══ */}
                          {currentSection.attachments &&
                            currentSection.attachments.length > 0 && (
                              <div style={{ marginTop: 20 }}>
                                <p
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: "1px",
                                    textTransform: "uppercase",
                                    color: "#64748B",
                                    marginBottom: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  📎 Pièces jointes (
                                  {currentSection.attachments.length})
                                </p>

                                {/* Images */}
                                {currentSection.attachments.filter(
                                  (a) => a.type === "image",
                                ).length > 0 && (
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        "repeat(auto-fill, minmax(140px, 1fr))",
                                      gap: 12,
                                      marginBottom: 12,
                                    }}
                                  >
                                    {currentSection.attachments
                                      .filter((a) => a.type === "image")
                                      .map((att) => (
                                        <div
                                          key={att.id}
                                          className="att-img-card"
                                          onClick={() =>
                                            setLightboxImg({
                                              src: att.url,
                                              alt: att.name,
                                            })
                                          }
                                        >
                                          <img
                                            src={att.url}
                                            alt={att.name}
                                          />
                                          <div className="att-label">
                                            {att.name}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                )}

                                {/* Documents */}
                                {currentSection.attachments.filter(
                                  (a) => a.type === "document",
                                ).length > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 8,
                                    }}
                                  >
                                    {currentSection.attachments
                                      .filter(
                                        (a) => a.type === "document",
                                      )
                                      .map((att) => (
                                        <a
                                          key={att.id}
                                          href={att.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="att-doc-card"
                                        >
                                          <span style={{ fontSize: 24 }}>
                                            📑
                                          </span>
                                          <div
                                            style={{
                                              flex: 1,
                                              minWidth: 0,
                                            }}
                                          >
                                            <p
                                              style={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "#1E293B",
                                                margin: 0,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {att.name}
                                            </p>
                                            <p
                                              style={{
                                                fontSize: 11,
                                                color: "#94A3B8",
                                                margin: 0,
                                              }}
                                            >
                                              Cliquez pour ouvrir
                                            </p>
                                          </div>
                                          <span
                                            style={{
                                              fontSize: 16,
                                              color: "#6366F1",
                                            }}
                                          >
                                            ↗
                                          </span>
                                        </a>
                                      ))}
                                  </div>
                                )}
                              </div>
                            )}

                          <div
                            style={{
                              marginTop: 16,
                              padding: "12px 16px",
                              background: "rgba(16,185,129,0.05)",
                              border: "1px solid rgba(16,185,129,0.1)",
                              borderRadius: 14,
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              fontSize: 12,
                              color: "#64748B",
                            }}
                          >
                            <span>🔍</span>
                            <span>
                              Accès{" "}
                              <strong style={{ color: "#059669" }}>
                                lecture seule
                              </strong>{" "}
                              — modification non autorisée.
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}