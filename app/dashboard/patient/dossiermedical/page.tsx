"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";

interface DMESection {
  id: string;
  title: string;
  icon: string;
  content: string;
}

interface DMERecord {
  id: number;
  token: string;
  expires_at: string;
  sections: DMESection[];
  created_at: string;
  updated_at: string;
}

interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
  notifications: number;
}

const DURATION_OPTIONS = [
  { label: "1 heure", hours: 1, color: "#F59E0B" },
  { label: "6 heures", hours: 6, color: "#10B981" },
  { label: "12 heures", hours: 12, color: "#10B981" },
  { label: "24 heures", hours: 24, color: "#8B5CF6" },
  { label: "48 heures", hours: 48, color: "#6366F1" },
  { label: "72 heures", hours: 72, color: "#EC4899" },
];

const SECTION_META: Record<string, { gradient: string; hint: string }> = {
  antecedents: {
    gradient: "135deg, #8B5CF6 0%, #10B981 100%",
    hint: "Maladies chroniques, hospitalisations passées, antécédents familiaux…",
  },
  allergies: {
    gradient: "135deg, #F093FB 0%, #F5576C 100%",
    hint: "Médicaments, aliments, substances auxquels vous êtes allergique…",
  },
  traitements: {
    gradient: "135deg, #4FACFE 0%, #00F2FE 100%",
    hint: "Nom du médicament, dosage, fréquence, médecin prescripteur…",
  },
  vaccins: {
    gradient: "135deg, #43E97B 0%, #38F9D7 100%",
    hint: "Type de vaccin, date d'administration, rappels à venir…",
  },
  chirurgies: {
    gradient: "135deg, #FA709A 0%, #FEE140 100%",
    hint: "Type d'intervention, date, établissement, chirurgien…",
  },
  notes: {
    gradient: "135deg, #A18CD1 0%, #FBC2EB 100%",
    hint: "Observations personnelles, questions pour votre médecin…",
  },
};

const DEFAULT_SECTIONS = [
  {
    id: "antecedents",
    title: "Antécédents médicaux",
    icon: "[1]",
    content: "",
  },
  {
    id: "allergies",
    title: "Allergies & intolérances",
    icon: "[2]",
    content: "",
  },
  {
    id: "traitements",
    title: "Traitements en cours",
    icon: "[3]",
    content: "",
  },
  { id: "vaccins", title: "Vaccinations", icon: "[4]", content: "" },
  {
    id: "chirurgies",
    title: "Chirurgies & hospitalisations",
    icon: "[5]",
    content: "",
  },
  { id: "notes", title: "Notes personnelles", icon: "[6]", content: "" },
];

const ICON_MAP: Record<string, string> = {
  "[1]": "🩺",
  "[2]": "⚠️",
  "[3]": "💊",
  "[4]": "💉",
  "[5]": "🏥",
  "[6]": "📝",
};
function resolveIcon(raw: string) {
  return ICON_MAP[raw] ?? raw;
}

function TimeBar({ expiresAt }: { expiresAt: string }) {
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
      setPercent(Math.min(100, Math.round((left / total) * 100)));
      setExpired(left <= 0);
      const h = Math.floor(left / 3600000);
      const m = Math.floor((left % 3600000) / 60000);
      const s = Math.floor((left % 60000) / 1000);
      setRemaining(
        left <= 0
          ? "Expiré"
          : h > 0
            ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
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

function DurationPicker({
  selected,
  onChange,
}: {
  selected: number;
  onChange: (h: number) => void;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: "#64748B",
          marginBottom: 10,
        }}
      >
        Durée d'accès
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 8,
        }}
      >
        {DURATION_OPTIONS.map((opt) => {
          const active = selected === opt.hours;
          return (
            <button
              key={opt.hours}
              onClick={() => onChange(opt.hours)}
              style={{
                padding: "10px 6px",
                borderRadius: 14,
                border: active ? `2px solid ${opt.color}` : "2px solid #E2E8F0",
                background: active ? `${opt.color}12` : "rgba(255,255,255,0.8)",
                color: active ? opt.color : "#94A3B8",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: active ? `0 4px 14px ${opt.color}30` : "none",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 8 }}>
        Supprimé automatiquement après cette période.
      </p>
    </div>
  );
}

export default function PatientDME() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
    notifications: 0,
  });
  const [dme, setDme] = useState<DMERecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("antecedents");
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(24);
  const [shareModal, setShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!dme) return;
    const check = () => {
      const isExp = new Date(dme.expires_at).getTime() < Date.now();
      setExpired(isExp);
      if (isExp) {
        setDme(null);
        setEditValues({});
      }
    };
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, [dme]);

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
      api.get("notifications/"),
    ])
      .then(([r, c, o, n]) =>
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
          notifications: n.data.length,
        }),
      )
      .catch(() => {});
    api
      .get("dossier-medical/")
      .then((res) => {
        setDme(res.data);
        const vals: Record<string, string> = {};
        (res.data.sections as DMESection[]).forEach((s) => {
          vals[s.id] = s.content;
        });
        setEditValues(vals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  const createDossier = async () => {
    setCreating(true);
    try {
      const res = await api.post("dossier-medical/", {
        sections: DEFAULT_SECTIONS,
        duration_hours: selectedDuration,
      });
      setDme(res.data);
      setExpired(false);
      const vals: Record<string, string> = {};
      (res.data.sections as DMESection[]).forEach((s) => {
        vals[s.id] = s.content;
      });
      setEditValues(vals);
    } catch {}
    setCreating(false);
  };

  const saveSection = async (sectionId: string) => {
    if (!dme || expired) return;
    setSaving(sectionId);
    try {
      const updatedSections = dme.sections.map((s) =>
        s.id === sectionId ? { ...s, content: editValues[sectionId] || "" } : s,
      );
      const res = await api.patch("dossier-medical/", {
        sections: updatedSections,
      });
      setDme(res.data);
      setSaved(sectionId);
      setTimeout(() => setSaved(null), 2500);
    } catch {}
    setSaving(null);
  };

  const generateShareLink = async () => {
    if (!dme || expired) return;
    try {
      const res = await api.post("dossier-medical/share/");
      setShareLink(res.data.share_url);
      setCopied(false);
      setShareModal(true);
    } catch {}
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const deleteDossier = async () => {
    try {
      await api.delete("dossier-medical/");
      setDme(null);
      setEditValues({});
      setDeleteConfirm(false);
    } catch {}
  };

  if (isLoading || loading) return null;

  const currentSection = dme?.sections.find((s) => s.id === activeSection);
  const completionCount =
    dme?.sections.filter((s) => s.content.trim().length > 0).length ?? 0;
  const totalSections = dme?.sections.length ?? DEFAULT_SECTIONS.length;
  const meta = SECTION_META[activeSection] ?? {
    gradient: "135deg, #8B5CF6, #10B981",
    hint: "",
  };

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes dmeCardPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes dmeFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dmeSlideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        @keyframes dmeCheck { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }

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

        .sec-tab {
          display:flex; align-items:center; gap:10px;
          padding:12px 14px; border-radius:14px; cursor:pointer;
          transition:all 0.2s ease; border:1.5px solid transparent;
          font-size:13px; font-weight:500; color:#64748B;
        }
        .sec-tab:hover { background:rgba(139,92,246,0.06); color:#334155; border-color:rgba(139,92,246,0.15); }
        .sec-tab.active {
          background:linear-gradient(135deg,rgba(139,92,246,0.1),rgba(16,185,129,0.08));
          color:#1E293B; border-color:rgba(139,92,246,0.3);
          box-shadow:0 4px 12px rgba(139,92,246,0.1);
        }

        .dme-textarea {
          width:100%; box-sizing:border-box; min-height:220px; padding:20px;
          border:1.5px solid #E2E8F0; border-radius:16px;
          font-family:'DM Sans',sans-serif; font-size:15px; line-height:1.75;
          color:#1E293B; background:rgba(255,255,255,0.8);
          resize:vertical; outline:none; transition:all 0.2s;
        }
        .dme-textarea:focus {
          border-color:rgba(139,92,246,0.5);
          background:white;
          box-shadow:0 0 0 4px rgba(139,92,246,0.08);
        }
        .dme-textarea:disabled { opacity:0.5; cursor:not-allowed; background:#F8FAFC; }
        .dme-textarea::placeholder { color:#CBD5E1; }

        .save-btn {
          padding:12px 28px; border-radius:14px; border:none;
          background:linear-gradient(135deg,#8B5CF6,#10B981); color:white;
          font-family:'DM Sans',sans-serif; font-weight:700; font-size:14px;
          cursor:pointer; transition:all 0.25s;
          box-shadow:0 4px 14px rgba(139,92,246,0.3);
        }
        .save-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 20px rgba(139,92,246,0.4); }
        .save-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none !important; }

        .share-btn-light {
          display:flex; align-items:center; gap:7px;
          padding:10px 18px; border-radius:12px;
          background:rgba(139,92,246,0.08); border:1.5px solid rgba(139,92,246,0.2);
          color:#7C3AED; font-family:'DM Sans',sans-serif; font-weight:600; font-size:13px;
          cursor:pointer; transition:all 0.2s;
        }
        .share-btn-light:hover { background:rgba(139,92,246,0.14); border-color:rgba(139,92,246,0.35); }

        .del-btn-light {
          display:flex; align-items:center; gap:7px;
          padding:10px 18px; border-radius:12px;
          background:rgba(239,68,68,0.06); border:1.5px solid rgba(239,68,68,0.15);
          color:#DC2626; font-family:'DM Sans',sans-serif; font-weight:600; font-size:13px;
          cursor:pointer; transition:all 0.2s;
        }
        .del-btn-light:hover { background:rgba(239,68,68,0.1); }

        .modal-overlay {
          position:fixed; inset:0; background:rgba(15,23,42,0.45);
          backdrop-filter:blur(6px); z-index:1000;
          display:flex; align-items:center; justify-content:center;
          animation:dmeFadeUp 0.2s ease;
        }
        .modal-card {
          background:white; border-radius:28px; padding:36px;
          width:500px; max-width:90vw;
          box-shadow:0 25px 60px rgba(0,0,0,0.15);
          animation:dmeFadeUp 0.3s ease;
        }

        .dur-btn {
          padding:10px 6px; border-radius:14px; cursor:pointer;
          font-family:'Syne',sans-serif; font-weight:700; font-size:12px;
          transition:all 0.2s;
        }
      `}</style>

      <div
        className="dme-bg"
        style={{ display: "flex", fontFamily: "'DM Sans', sans-serif" }}
      >
        <Sidebar stats={stats} />
        <Navbar
          title="Dossier Médical Électronique"
          subtitle="Vos données de santé sécurisées"
        />

        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "2rem",
            paddingTop: "calc(70px + 2rem)",
          }}
        >
          {/* ── ÉTAT VIDE ── */}
          {!dme ? (
            <div
              style={{
                maxWidth: 540,
                margin: "60px auto",
                animation: "dmeFadeUp 0.5s ease",
              }}
            >
              <div
                className="dme-card"
                style={{ padding: "48px 40px", textAlign: "center" }}
              >
                {/* Hero */}
                <div
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: 28,
                    margin: "0 auto 24px",
                    background:
                      "linear-gradient(135deg,rgba(139,92,246,0.12),rgba(16,185,129,0.12))",
                    border: "2px dashed rgba(139,92,246,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 42,
                  }}
                >
                  🗂️
                </div>

                <h2
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#1E293B",
                    marginBottom: 10,
                  }}
                >
                  {expired ? "Dossier expiré" : "Créer mon dossier médical"}
                </h2>
                <p
                  style={{
                    color: "#64748B",
                    fontSize: 15,
                    lineHeight: 1.7,
                    maxWidth: 380,
                    margin: "0 auto 32px",
                  }}
                >
                  {expired
                    ? "Votre dossier a expiré et a été supprimé automatiquement."
                    : "Centralisez vos informations de santé. Choisissez la durée d'accès, puis partagez avec votre médecin."}
                </p>

                <div style={{ marginBottom: 28, textAlign: "left" }}>
                  <DurationPicker
                    selected={selectedDuration}
                    onChange={setSelectedDuration}
                  />
                </div>

                <button
                  onClick={createDossier}
                  disabled={creating}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 18,
                    border: "none",
                    background: "linear-gradient(135deg,#8B5CF6,#10B981)",
                    color: "white",
                    fontFamily: "'Syne',sans-serif",
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: "pointer",
                    boxShadow: "0 8px 28px rgba(139,92,246,0.35)",
                    transition: "all 0.3s",
                    opacity: creating ? 0.6 : 1,
                  }}
                >
                  {creating
                    ? "Création en cours…"
                    : `✦ Créer mon dossier (${selectedDuration}h)`}
                </button>

                <div
                  style={{
                    marginTop: 20,
                    padding: "14px 16px",
                    borderRadius: 14,
                    background: "rgba(139,92,246,0.05)",
                    border: "1px solid rgba(139,92,246,0.12)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                    🔐
                  </span>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#64748B",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    Chiffré et supprimé automatiquement à l'expiration. Vous
                    seul décidez avec qui le partager.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── HEADER CARD ── */}
              <div
                className="dme-card"
                style={{
                  padding: "24px 28px",
                  marginBottom: 20,
                  animation: "dmeFadeUp 0.4s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Orbs décoratifs */}
                <div
                  style={{
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg,rgba(139,92,246,0.08),rgba(16,185,129,0.08))",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -30,
                    left: 60,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(16,185,129,0.06)",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    position: "relative",
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
                      <span style={{ fontSize: 24 }}>🗂️</span>
                      <h1
                        style={{
                          fontFamily: "'Syne',sans-serif",
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#1E293B",
                          margin: 0,
                        }}
                      >
                        Mon Dossier Médical
                      </h1>
                    </div>
                    <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
                      Créé le{" "}
                      {new Date(dme.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      &nbsp;·&nbsp;
                      <span className="text-grad" style={{ fontWeight: 700 }}>
                        {completionCount}/{totalSections} sections
                      </span>
                      &nbsp;·&nbsp; MAJ{" "}
                      {new Date(dme.updated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="share-btn-light"
                      onClick={generateShareLink}
                      disabled={expired}
                    >
                      🔗 Partager
                    </button>
                    <button
                      className="del-btn-light"
                      onClick={() => setDeleteConfirm(true)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 20, position: "relative" }}>
                  <TimeBar expiresAt={dme.expires_at} />
                </div>

                {/* Barre de complétion */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: "#F1F5F9",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(completionCount / totalSections) * 100}%`,
                        background: "linear-gradient(90deg,#8B5CF6,#10B981)",
                        borderRadius: 3,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <span
                    className="text-grad"
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {Math.round((completionCount / totalSections) * 100)}%
                    complété
                  </span>
                </div>
              </div>

              {/* ── CORPS ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "260px 1fr",
                  gap: 16,
                }}
              >
                {/* Nav sections */}
                <div
                  className="dme-card"
                  style={{ padding: 18, alignSelf: "start" }}
                >
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
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {dme.sections.map((section) => {
                      const isFilled = section.content.trim().length > 0;
                      const isActive = activeSection === section.id;
                      return (
                        <div
                          key={section.id}
                          className={`sec-tab ${isActive ? "active" : ""}`}
                          onClick={() => setActiveSection(section.id)}
                          style={{
                            animation: "dmeSlideIn 0.3s ease backwards",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>
                            {resolveIcon(section.icon)}
                          </span>
                          <span style={{ flex: 1 }}>{section.title}</span>
                          {isFilled && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: isActive ? "#8B5CF6" : "#10B981",
                                boxShadow: isActive
                                  ? "0 0 8px rgba(139,92,246,0.6)"
                                  : "0 0 6px rgba(16,185,129,0.6)",
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Résumé */}
                  <div
                    style={{
                      marginTop: 20,
                      padding: "12px 14px",
                      background: "rgba(139,92,246,0.05)",
                      border: "1px solid rgba(139,92,246,0.12)",
                      borderRadius: 14,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        color: "#7C3AED",
                        margin: 0,
                        lineHeight: 1.6,
                        fontWeight: 500,
                      }}
                    >
                      🔒 Données chiffrées · {completionCount}/{totalSections}{" "}
                      remplies
                    </p>
                  </div>
                </div>

                {/* Éditeur */}
                {currentSection && (
                  <div
                    className="dme-card"
                    style={{ padding: 28, animation: "dmeFadeUp 0.3s ease" }}
                    key={activeSection}
                  >
                    {/* En-tête section */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: 24,
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 16,
                          flexShrink: 0,
                          background: `linear-gradient(${meta.gradient})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        }}
                      >
                        {resolveIcon(currentSection.icon)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 20,
                            fontWeight: 800,
                            color: "#1E293B",
                            margin: 0,
                            marginBottom: 4,
                          }}
                        >
                          {currentSection.title}
                        </h2>
                        <p
                          style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}
                        >
                          {expired
                            ? "Modification désactivée — dossier expiré"
                            : meta.hint}
                        </p>
                      </div>
                      {currentSection.content.trim().length > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            padding: "5px 12px",
                            borderRadius: 20,
                            fontWeight: 700,
                            background: "rgba(16,185,129,0.1)",
                            border: "1px solid rgba(16,185,129,0.25)",
                            color: "#059669",
                          }}
                        >
                          ✓ Renseigné
                        </span>
                      )}
                    </div>

                    <textarea
                      className="dme-textarea"
                      placeholder={`${meta.hint}\n\nSaisissez vos informations ici…`}
                      value={editValues[currentSection.id] || ""}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [currentSection.id]: e.target.value,
                        }))
                      }
                      disabled={expired}
                    />

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 16,
                      }}
                    >
                      {saved === currentSection.id && (
                        <span
                          style={{
                            fontSize: 13,
                            color: "#059669",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            animation: "dmeCheck 0.3s ease",
                          }}
                        >
                          ✓ Sauvegardé !
                        </span>
                      )}
                      <button
                        className="save-btn"
                        onClick={() => saveSection(currentSection.id)}
                        disabled={saving === currentSection.id || expired}
                      >
                        {saving === currentSection.id
                          ? "Sauvegarde…"
                          : "💾 Sauvegarder"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── MODAL PARTAGE ── */}
          {shareModal && (
            <div className="modal-overlay" onClick={() => setShareModal(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#8B5CF6,#10B981)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 30,
                      margin: "0 auto 16px",
                    }}
                  >
                    🔗
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#1E293B",
                      marginBottom: 8,
                    }}
                  >
                    Partage sécurisé
                  </h2>
                  <p
                    style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6 }}
                  >
                    Accès{" "}
                    <strong style={{ color: "#7C3AED" }}>lecture seule</strong>{" "}
                    · Valable <strong style={{ color: "#7C3AED" }}>24h</strong>
                  </p>
                </div>

                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1.5px solid #E2E8F0",
                    borderRadius: 14,
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: "#334155",
                      wordBreak: "break-all",
                    }}
                  >
                    {shareLink || "Génération…"}
                  </span>
                  <button
                    onClick={copyLink}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: copied
                        ? "#10B981"
                        : "linear-gradient(135deg,#8B5CF6,#10B981)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    {copied ? "✓ Copié !" : "📋 Copier"}
                  </button>
                </div>

                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#92400E",
                    marginBottom: 20,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <span>⚠️</span>
                  <span>
                    Ne partagez ce lien qu'avec votre médecin. Toute personne
                    possédant ce lien peut consulter votre dossier.
                  </span>
                </div>

                <button
                  onClick={() => setShareModal(false)}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 14,
                    background: "#F1F5F9",
                    border: "none",
                    fontFamily: "'DM Sans',sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* ── MODAL SUPPRESSION ── */}
          {deleteConfirm && (
            <div
              className="modal-overlay"
              onClick={() => setDeleteConfirm(false)}
            >
              <div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: 420 }}
              >
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: "50%",
                      background: "rgba(239,68,68,0.08)",
                      border: "1.5px solid rgba(239,68,68,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      margin: "0 auto 16px",
                    }}
                  >
                    🗑️
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Syne',sans-serif",
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#DC2626",
                      marginBottom: 8,
                    }}
                  >
                    Supprimer le dossier ?
                  </h3>
                  <p
                    style={{ fontSize: 14, color: "#64748B", lineHeight: 1.6 }}
                  >
                    Action irréversible. Toutes vos informations médicales
                    seront définitivement effacées.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 14,
                      background: "#F1F5F9",
                      border: "none",
                      color: "#64748B",
                      fontFamily: "'DM Sans',sans-serif",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={deleteDossier}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 14,
                      background: "rgba(239,68,68,0.1)",
                      border: "1.5px solid rgba(239,68,68,0.25)",
                      color: "#DC2626",
                      fontFamily: "'DM Sans',sans-serif",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </PrivateRoute>
  );
}
