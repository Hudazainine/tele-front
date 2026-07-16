"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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

interface LocalAttachment {
  name: string;
  type: "image" | "document";
  url: string;
  file: File;
}

interface DMESection {
  id: string;
  title: string;
  icon: string;
  content: string;
  attachments?: SavedAttachment[];
}

interface DMERecord {
  id: number;
  token: string;
  expires_at: string | null;
  is_permanent?: boolean;
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

/* ═══════════════════ CONSTANTES ═══════════════════ */

const DURATION_OPTIONS = [
  { label: "1 heure", hours: 1 },
  { label: "6 heures", hours: 6 },
  { label: "12 heures", hours: 12 },
  { label: "24 heures", hours: 24 },
  { label: "48 heures", hours: 48 },
  { label: "72 heures", hours: 72 },
  { label: "Permanent", hours: 0 },
];

const SECTION_META: Record<string, { hint: string }> = {
  antecedents: { hint: "Maladies chroniques, hospitalisations passées, antécédents familiaux…" },
  allergies: { hint: "Médicaments, aliments, substances auxquels vous êtes allergique…" },
  traitements: { hint: "Nom du médicament, dosage, fréquence, médecin prescripteur…" },
  vaccins: { hint: "Type de vaccin, date d'administration, rappels à venir…" },
  chirurgies: { hint: "Type d'intervention, date, établissement, chirurgien…" },
  notes: { hint: "Observations personnelles, questions pour votre médecin…" },
};

const DEFAULT_SECTIONS = [
  { id: "antecedents", title: "Antécédents médicaux", icon: "[1]", content: "" },
  { id: "allergies", title: "Allergies & intolérances", icon: "[2]", content: "" },
  { id: "traitements", title: "Traitements en cours", icon: "[3]", content: "" },
  { id: "vaccins", title: "Vaccinations", icon: "[4]", content: "" },
  { id: "chirurgies", title: "Chirurgies & hospitalisations", icon: "[5]", content: "" },
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

/* ═══════════════════ DESIGN TOKENS ═══════════════════ */
// Palette from mockup: warm off-white bg, white cards, teal/sage green accent, soft mauve secondary
const T = {
  bg: "#F5F3EE",           // warm ivory background
  surface: "#FFFFFF",      // card surfaces
  border: "#E8E4DC",       // subtle warm borders
  borderMid: "#D4CFC6",    // slightly stronger border
  accent: "#4CAF82",       // teal-green (main accent)
  accentLight: "#E8F5EE",  // light tint of accent
  accentDark: "#2E7D55",   // darker green
  secondary: "#8B7ED8",    // mauve/purple secondary
  secondaryLight: "#F0EEF9",
  textPrimary: "#1A1A1A",
  textMuted: "#6B6560",
  textLight: "#9E9890",
  danger: "#E05252",
  dangerLight: "#FEF0F0",
  warning: "#E8A020",
  warningLight: "#FEF7E6",
  radius: "14px",
  radiusLg: "18px",
  radiusSm: "8px",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
  shadowHover: "0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)",
  font: "'DM Sans', -apple-system, sans-serif",
  fontDisplay: "'Syne', sans-serif",
};

/* ═══════════════════ TIME BAR ═══════════════════ */

function TimeBar({ expiresAt, isPermanent }: { expiresAt: string | null; isPermanent?: boolean }) {
  const [remaining, setRemaining] = useState("");
  const [percent, setPercent] = useState(100);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (isPermanent || !expiresAt) return;
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
        left <= 0 ? "Expiré"
          : h > 0 ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
          : `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt, isPermanent]);

  if (isPermanent || !expiresAt) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: T.textMuted }}>
          Conservation permanente
        </span>
        <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: T.accentDark }}>♾️</span>
      </div>
    );
  }

  const barColor = expired ? T.danger : percent > 60 ? T.accent : percent > 25 ? T.warning : T.danger;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!expired && (
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: barColor, flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: expired ? T.danger : T.textMuted }}>
            {expired ? "Accès expiré" : "Expiration dans"}
          </span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: barColor, fontFamily: T.fontDisplay }}>
          {remaining}
        </span>
      </div>
      <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${percent}%`, background: barColor, borderRadius: 2, transition: "width 1s linear" }} />
      </div>
    </div>
  );
}

/* ═══════════════════ DURATION PICKER ═══════════════════ */

function DurationPicker({ selected, onChange }: { selected: number; onChange: (h: number) => void }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: T.textMuted, marginBottom: 10, margin: "0 0 10px" }}>
        Durée de conservation du dossier
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {DURATION_OPTIONS.map((opt) => {
          const active = selected === opt.hours;
          return (
            <button
              key={opt.hours}
              onClick={() => onChange(opt.hours)}
              style={{
                padding: "10px 6px",
                borderRadius: T.radiusSm,
                border: active ? `1.5px solid ${T.accent}` : `1.5px solid ${T.border}`,
                background: active ? T.accentLight : T.surface,
                color: active ? T.accentDark : T.textMuted,
                fontFamily: T.font,
                fontWeight: active ? 700 : 500,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: T.textLight, marginTop: 8 }}>
        {selected === 0 ? "Le dossier sera conservé indéfiniment." : "Supprimé automatiquement après cette période."}
      </p>
    </div>
  );
}

/* ═══════════════════ PAGE PRINCIPALE ═══════════════════ */

export default function PatientDME() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({ rendezvous: 0, consultations: 0, ordonnances: 0, notifications: 0 });
  const [dme, setDme] = useState<DMERecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("antecedents");
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [localAttachments, setLocalAttachments] = useState<Record<string, LocalAttachment[]>>({});
  const imgInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(24);
  const [shareModal, setShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [expired, setExpired] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!dme || dme.is_permanent) return;
    const check = () => {
      if (!dme.expires_at) return;
      const isExp = new Date(dme.expires_at).getTime() < Date.now();
      setExpired(isExp);
      if (isExp) { setDme(null); setEditValues({}); }
    };
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, [dme]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    Promise.all([
      api.get("rendezvous/"), api.get("consultations/"), api.get("ordonnances/"), api.get("notifications/"),
    ]).then(([r, c, o, n]) => setStats({ rendezvous: r.data.length, consultations: c.data.length, ordonnances: o.data.length, notifications: n.data.length })).catch(() => {});

    api.get("dossier-medical/")
      .then((res) => {
        setDme(res.data);
        const vals: Record<string, string> = {};
        (res.data.sections as DMESection[]).forEach((s) => { vals[s.id] = s.content; });
        setEditValues(vals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  const createDossier = async () => {
    setCreating(true);
    try {
      const payload: Record<string, unknown> = { sections: DEFAULT_SECTIONS };
      if (selectedDuration === 0) { payload.is_permanent = true; payload.duration_hours = null; }
      else { payload.is_permanent = false; payload.duration_hours = selectedDuration; }
      const res = await api.post("dossier-medical/", payload, { headers: { "Content-Type": "application/json" } });
      setDme(res.data);
      setExpired(false);
      const vals: Record<string, string> = {};
      (res.data.sections as DMESection[]).forEach((s) => { vals[s.id] = s.content; });
      setEditValues(vals);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) alert(`Erreur ${err.response?.status}: ${JSON.stringify(err.response?.data)}`);
    } finally {
      setCreating(false);
    }
  };

  const saveSection = async (sectionId: string) => {
    if (!dme || expired) return;
    setSaving(sectionId);
    try {
      const pending = localAttachments[sectionId] || [];
      const formData = new FormData();
      const updatedSections = dme.sections.map((s) =>
        s.id === sectionId ? { ...s, content: editValues[sectionId] || "", attachments: s.attachments || [] } : s
      );
      formData.append("sections", JSON.stringify(updatedSections));
      pending.forEach((att) => { formData.append(`files_${sectionId}`, att.file, att.name); });
      const res = await api.patch("dossier-medical/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setDme(res.data);
      setLocalAttachments((prev) => { const u = { ...prev }; delete u[sectionId]; return u; });
      pending.forEach((att) => URL.revokeObjectURL(att.url));
      setSaved(sectionId);
      setTimeout(() => setSaved(null), 2500);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde.");
    }
    setSaving(null);
  };

  const saveAllSections = async () => {
    if (!dme || expired) return;
    setSavingAll(true);
    try {
      const formData = new FormData();
      const allSections = dme.sections.map((s) => ({ ...s, content: editValues[s.id] || "" }));
      formData.append("sections", JSON.stringify(allSections));
      Object.entries(localAttachments).forEach(([sId, files]) => {
        files.forEach((att) => { formData.append(`files_${sId}`, att.file, att.name); });
      });
      const res = await api.patch("dossier-medical/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setDme(res.data);
      Object.values(localAttachments).forEach((atts) => atts.forEach((att) => URL.revokeObjectURL(att.url)));
      setLocalAttachments({});
      setSaved("all");
      setTimeout(() => setSaved(null), 2500);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde globale.");
    }
    setSavingAll(false);
  };

  const deleteSavedAttachment = async (sectionId: string, attachmentId: number) => {
    if (!dme) return;
    try {
      await api.delete(`dossier-medical/attachments/${attachmentId}/`);
      setDme((prev) => {
        if (!prev) return prev;
        return { ...prev, sections: prev.sections.map((s) => s.id === sectionId ? { ...s, attachments: (s.attachments || []).filter((a) => a.id !== attachmentId) } : s) };
      });
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "document") => {
    const files = e.target.files;
    if (!files) return;
    const newAtts: LocalAttachment[] = [];
    Array.from(files).forEach((file) => { newAtts.push({ name: file.name, type, url: URL.createObjectURL(file), file }); });
    setLocalAttachments((prev) => ({ ...prev, [activeSection]: [...(prev[activeSection] || []), ...newAtts] }));
    if (imgInputRef.current) imgInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const removeLocalAttachment = (sectionId: string, index: number) => {
    setLocalAttachments((prev) => {
      const updated = [...(prev[sectionId] || [])];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      return { ...prev, [sectionId]: updated };
    });
  };

  const generateShareLink = async () => {
    if (!dme || expired) return;
    try {
      const res = await api.post("dossier-medical/share/");
      setShareLink(res.data.share_url);
      setCopied(false);
      setShareModal(true);
    } catch (err) { console.error(err); }
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
      setLocalAttachments({});
      setDeleteConfirm(false);
    } catch (err) { console.error(err); }
  };

  if (isLoading || loading) return null;

  const currentSection = dme?.sections.find((s) => s.id === activeSection);
  const completionCount = dme?.sections.filter((s) => s.content.trim().length > 0 || (s.attachments && s.attachments.length > 0)).length ?? 0;
  const totalSections = dme?.sections.length ?? DEFAULT_SECTIONS.length;
  const meta = SECTION_META[activeSection] ?? { hint: "" };
  const savedAttachments: SavedAttachment[] = currentSection?.attachments || [];
  const pendingAttachments: LocalAttachment[] = localAttachments[activeSection] || [];

  /* ─── Styles partagés ─── */
  const cardStyle: React.CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radiusLg,
    boxShadow: T.shadow,
  };

  const btnPrimary: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    borderRadius: T.radiusSm,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.textPrimary,
    fontFamily: T.font,
    fontWeight: 500,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s",
  };

  const btnAccent: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "11px 24px",
    borderRadius: T.radiusSm,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.textPrimary,
    fontFamily: T.font,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.15s",
  };

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }

        .dme-root { background: ${T.bg}; min-height: 100vh; font-family: ${T.font}; }

        .sec-tab {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: ${T.radiusSm}; cursor: pointer;
          transition: all 0.15s; border: 1px solid transparent;
          font-size: 13px; font-weight: 500; color: ${T.textMuted};
        }
        .sec-tab:hover { background: ${T.accentLight}; color: ${T.textPrimary}; }
        .sec-tab.active {
          background: ${T.accentLight};
          color: ${T.accentDark};
          border-color: rgba(76,175,130,0.25);
          font-weight: 600;
        }

        .dme-textarea {
          width: 100%; box-sizing: border-box; min-height: 200px;
          padding: 16px; border: 1px solid ${T.border}; border-radius: ${T.radius};
          font-family: ${T.font}; font-size: 14px; line-height: 1.7;
          color: ${T.textPrimary}; background: ${T.bg};
          resize: vertical; outline: none; transition: border-color 0.15s;
        }
        .dme-textarea:focus { border-color: ${T.accent}; background: ${T.surface}; }
        .dme-textarea:disabled { opacity: 0.5; cursor: not-allowed; }
        .dme-textarea::placeholder { color: ${T.textLight}; }

        .upload-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 14px; border-radius: ${T.radiusSm};
          border: 1px solid ${T.border}; background: ${T.surface};
          color: ${T.textMuted}; font-family: ${T.font}; font-weight: 500; font-size: 13px;
          cursor: pointer; transition: all 0.15s;
        }
        .upload-btn:hover { border-color: ${T.accent}; color: ${T.accentDark}; background: ${T.accentLight}; }
        .upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .save-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: ${T.radiusSm};
          border: 1px solid ${T.border}; background: ${T.surface};
          color: ${T.textPrimary}; font-family: ${T.font}; font-weight: 600; font-size: 13px;
          cursor: pointer; transition: all 0.15s;
        }
        .save-btn:hover:not(:disabled) { border-color: ${T.accent}; background: ${T.accentLight}; color: ${T.accentDark}; }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .save-all-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 28px; border-radius: ${T.radiusSm};
          border: 1px solid ${T.border}; background: ${T.surface};
          color: ${T.textPrimary}; font-family: ${T.font}; font-weight: 600; font-size: 14px;
          cursor: pointer; transition: all 0.15s;
        }
        .save-all-btn:hover:not(:disabled) { border-color: ${T.accent}; background: ${T.accentLight}; color: ${T.accentDark}; }
        .save-all-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: ${T.radiusSm};
          border: 1px solid ${T.border}; background: ${T.surface};
          color: ${T.textMuted}; cursor: pointer; transition: all 0.15s; font-size: 15px;
        }
        .icon-btn:hover { border-color: ${T.borderMid}; background: #F9F7F4; }
        .icon-btn.danger:hover { border-color: rgba(224,82,82,0.3); background: ${T.dangerLight}; color: ${T.danger}; }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.3);
          backdrop-filter: blur(4px); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        .modal-card {
          background: ${T.surface}; border-radius: ${T.radiusLg};
          border: 1px solid ${T.border}; padding: 32px; width: 480px;
          max-width: 92vw; box-shadow: 0 8px 40px rgba(0,0,0,0.12);
          animation: fadeUp 0.25s ease;
        }

        .progress-bar-track {
          height: 4px; background: ${T.border}; border-radius: 2px; overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%; border-radius: 2px; transition: width 0.5s ease;
        }

        .preview-item {
          position: relative; border-radius: ${T.radiusSm}; overflow: hidden;
          border: 1px solid ${T.border};
        }
        .preview-remove {
          position: absolute; top: 4px; right: 4px;
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(0,0,0,0.55); color: white; border: none;
          font-size: 9px; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
        }
      `}</style>

      <div className="dme-root" style={{ display: "flex" }}>
        <Sidebar stats={stats} />
        <Navbar title="Dossier Médical Électronique" subtitle="Vos données de santé sécurisées" />

        <main style={{ marginLeft: 260, flex: 1, padding: "2rem", paddingTop: "calc(70px + 2rem)" }}>

          {/* ── ÉTAT VIDE ── */}
          {!dme ? (
            <div style={{ maxWidth: 520, margin: "48px auto", animation: "fadeUp 0.4s ease" }}>
              <div style={{ ...cardStyle, padding: "40px 36px", textAlign: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px", background: T.accentLight, border: `1px solid rgba(76,175,130,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                  🗂️
                </div>
                <h2 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 800, color: T.textPrimary, margin: "0 0 10px" }}>
                  {expired ? "Dossier expiré" : "Créer mon dossier médical"}
                </h2>
                <p style={{ color: T.textMuted, fontSize: 14, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 28px" }}>
                  {expired
                    ? "Votre dossier a expiré et a été supprimé automatiquement."
                    : "Centralisez vos informations de santé. Choisissez la durée de conservation, puis partagez avec votre médecin."}
                </p>

                <div style={{ marginBottom: 24, textAlign: "left" }}>
                  <DurationPicker selected={selectedDuration} onChange={setSelectedDuration} />
                </div>

                <button
                  onClick={createDossier}
                  disabled={creating}
                  style={{ width: "100%", padding: "14px", borderRadius: T.radius, border: `1px solid ${T.border}`, background: T.surface, color: T.textPrimary, fontFamily: T.font, fontWeight: 600, fontSize: 15, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentLight; e.currentTarget.style.color = T.accentDark; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.textPrimary; }}
                >
                  {creating ? "Création en cours…" : selectedDuration === 0 ? `✦ Créer mon dossier (Permanent)` : `✦ Créer mon dossier (${selectedDuration}h)`}
                </button>

                <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: T.radiusSm, background: "#F9F7F2", border: `1px solid ${T.border}`, display: "flex", alignItems: "flex-start", gap: 8, textAlign: "left" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>🔐</span>
                  <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>
                    Vous seul contrôlez la visibilité de vos données.{" "}
                    {selectedDuration === 0 ? "Le médecin y aura accès en permanence." : "Supprimé automatiquement à l'expiration."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── HEADER CARD ── */}
              <div style={{ ...cardStyle, padding: "20px 24px", marginBottom: 16, animation: "fadeUp 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accentLight, border: `1px solid rgba(76,175,130,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      🗂️
                    </div>
                    <div>
                      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 800, color: T.textPrimary, margin: 0, marginBottom: 2 }}>
                        Mon dossier médical
                      </h1>
                      <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
                        Créé le {new Date(dme.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        {" · "}
                        <span style={{ color: T.accent, fontWeight: 600 }}>{completionCount}/{totalSections} sections</span>
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={generateShareLink}
                      style={btnPrimary}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderMid; e.currentTarget.style.background = "#F9F7F4"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}
                    >
                      🔗 Partager
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => setDeleteConfirm(true)}
                      title="Supprimer le dossier"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <TimeBar expiresAt={dme.expires_at} isPermanent={dme.is_permanent} />

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textLight, whiteSpace: "nowrap" }}>Complétion</span>
                  <div className="progress-bar-track" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: `${(completionCount / totalSections) * 100}%`, background: T.accent }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.accent, whiteSpace: "nowrap" }}>
                    {Math.round((completionCount / totalSections) * 100)}% complété
                  </span>
                </div>
              </div>

              {/* ── CORPS : SIDEBAR + ÉDITEUR ── */}
              <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>

                {/* Nav sections */}
                <div style={{ ...cardStyle, padding: 14, alignSelf: "start" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: T.textLight, margin: "0 0 10px", padding: "0 2px" }}>
                    Sections
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {dme.sections.map((section) => {
                      const isFilled = section.content.trim().length > 0 || (section.attachments && section.attachments.length > 0);
                      const isActive = activeSection === section.id;
                      return (
                        <div
                          key={section.id}
                          className={`sec-tab${isActive ? " active" : ""}`}
                          onClick={() => setActiveSection(section.id)}
                        >
                          <span style={{ fontSize: 15 }}>{resolveIcon(section.icon)}</span>
                          <span style={{ flex: 1, fontSize: 13 }}>{section.title}</span>
                          {isFilled && (
                            <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: isActive ? T.accent : T.accent, opacity: isActive ? 1 : 0.5 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 16, padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radiusSm }}>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
                      🔒 Données sécurisées · {completionCount}/{totalSections} remplies
                    </p>
                  </div>
                </div>

                {/* Éditeur */}
                {currentSection && (
                  <div style={{ ...cardStyle, padding: 24, animation: "fadeUp 0.25s ease" }} key={activeSection}>
                    {/* En-tête section */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
                      <div style={{ fontSize: 28, lineHeight: 1 }}>{resolveIcon(currentSection.icon)}</div>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 800, color: T.textPrimary, margin: "0 0 3px" }}>
                          {currentSection.title}
                        </h2>
                        <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{meta.hint}</p>
                      </div>
                      {(currentSection.content.trim().length > 0 || savedAttachments.length > 0) && (
                        <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600, background: T.accentLight, color: T.accentDark, border: `1px solid rgba(76,175,130,0.2)`, whiteSpace: "nowrap" }}>
                          ✓ Renseigné
                        </span>
                      )}
                    </div>

                    {/* Boutons d'ajout */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                      <button className="upload-btn" onClick={() => imgInputRef.current?.click()} disabled={expired && !dme.is_permanent}>
                        📷 Ajouter une image
                      </button>
                      <button className="upload-btn" onClick={() => docInputRef.current?.click()} disabled={expired && !dme.is_permanent}>
                        📄 Ajouter un document
                      </button>
                      <input type="file" ref={imgInputRef} hidden accept="image/*" multiple onChange={(e) => handleFileUpload(e, "image")} />
                      <input type="file" ref={docInputRef} hidden accept=".pdf,.doc,.docx,.txt" multiple onChange={(e) => handleFileUpload(e, "document")} />
                    </div>

                    {/* Pièces jointes sauvegardées */}
                    {savedAttachments.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                        {savedAttachments.map((att) => (
                          <div key={att.id} className="preview-item">
                            {att.type === "image" ? (
                              <div style={{ position: "relative" }}>
                                <img src={att.url} alt={att.name} style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8 }} />
                                <button className="preview-remove" onClick={() => deleteSavedAttachment(activeSection, att.id)}>✕</button>
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", background: T.bg, borderRadius: 8 }}>
                                <span style={{ fontSize: 16 }}>📑</span>
                                <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: T.textPrimary, fontWeight: 500, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none" }}>{att.name}</a>
                                <button onClick={() => deleteSavedAttachment(activeSection, att.id)} style={{ background: "none", border: "none", color: T.textLight, cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fichiers locaux en attente */}
                    {pendingAttachments.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: T.warning, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 5 }}>
                          ⏳ En attente ({pendingAttachments.length} fichier{pendingAttachments.length > 1 ? "s" : ""})
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {pendingAttachments.map((att, idx) => (
                            <div key={`local-${idx}`} className="preview-item" style={{ borderStyle: "dashed", borderColor: T.warning }}>
                              {att.type === "image" ? (
                                <div style={{ position: "relative" }}>
                                  <img src={att.url} alt={att.name} style={{ width: 90, height: 70, objectFit: "cover", borderRadius: 8, opacity: 0.75 }} />
                                  <button className="preview-remove" onClick={() => removeLocalAttachment(activeSection, idx)}>✕</button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px", background: T.warningLight, borderRadius: 8 }}>
                                  <span style={{ fontSize: 16 }}>📑</span>
                                  <span style={{ fontSize: 12, color: T.textPrimary, fontWeight: 500, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</span>
                                  <button onClick={() => removeLocalAttachment(activeSection, idx)} style={{ background: "none", border: "none", color: T.textLight, cursor: "pointer", fontSize: 13, padding: 0 }}>✕</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Zone de texte */}
                    <textarea
                      className="dme-textarea"
                      placeholder={`${meta.hint}\n\nSaisissez vos informations ici… (champ optionnel)`}
                      value={editValues[currentSection.id] || ""}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, [currentSection.id]: e.target.value }))}
                      disabled={expired && !dme.is_permanent}
                    />

                    {/* Bouton sauvegarder cette section */}
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 14 }}>
                      {saved === currentSection.id && (
                        <span style={{ fontSize: 13, color: T.accentDark, fontWeight: 600 }}>✓ Sauvegardé !</span>
                      )}
                      <button
                        className="save-btn"
                        onClick={() => saveSection(currentSection.id)}
                        disabled={saving === currentSection.id || (expired && !dme.is_permanent)}
                      >
                        🗸 {saving === currentSection.id ? "Sauvegarde…" : "Sauvegarder cette section"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── BARRE DU BAS ── */}
              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: `1px solid ${T.border}` }}>
                <div>
                  {saved === "all" && (
                    <span style={{ fontSize: 13, color: T.accentDark, fontWeight: 600 }}>✓ Toutes vos informations ont été sauvegardées !</span>
                  )}
                  {saved !== "all" && Object.keys(localAttachments).length > 0 && (
                    <span style={{ fontSize: 12, color: T.textMuted }}>
                      ⚡ {Object.keys(localAttachments).reduce((acc, key) => acc + (localAttachments[key]?.length || 0), 0)} fichier(s) en attente
                    </span>
                  )}
                  {saved !== "all" && Object.keys(localAttachments).length === 0 && (
                    <span style={{ fontSize: 12, color: T.textLight }}>Modifiez une section puis sauvegardez</span>
                  )}
                </div>
                <button
                  className="save-all-btn"
                  onClick={saveAllSections}
                  disabled={savingAll || (expired && !dme.is_permanent)}
                >
                  🗸 {savingAll ? "Sauvegarde en cours…" : "Sauvegarder tout le dossier"}
                </button>
              </div>
            </>
          )}

          {/* ── MODAL PARTAGE ── */}
          {shareModal && (
            <div className="modal-overlay" onClick={() => setShareModal(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.accentLight, border: `1px solid rgba(76,175,130,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px" }}>🔗</div>
                  <h2 style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 800, color: T.textPrimary, margin: "0 0 6px" }}>Partage sécurisé</h2>
                  <p style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                    Accès lecture seule · {dme?.is_permanent ? "Permanent" : "Limité dans le temps"}
                  </p>
                </div>

                <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ flex: 1, fontSize: 12, color: T.textPrimary, wordBreak: "break-all" }}>{shareLink || "Génération…"}</span>
                  <button
                    onClick={copyLink}
                    style={{ padding: "7px 14px", borderRadius: T.radiusSm, border: `1px solid ${copied ? T.accent : T.border}`, background: copied ? T.accentLight : T.surface, color: copied ? T.accentDark : T.textPrimary, fontWeight: 600, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0 }}
                  >
                    {copied ? "✓ Copié !" : "📋 Copier"}
                  </button>
                </div>

                <div style={{ padding: "10px 14px", background: T.warningLight, border: `1px solid rgba(232,160,32,0.2)`, borderRadius: T.radiusSm, fontSize: 12, color: "#7A5A0A", marginBottom: 20, display: "flex", gap: 7 }}>
                  <span>⚠️</span>
                  <span>Ne partagez ce lien qu'avec votre médecin. Toute personne possédant ce lien peut consulter votre dossier.</span>
                </div>

                <button onClick={() => setShareModal(false)} style={{ width: "100%", padding: 12, borderRadius: T.radiusSm, background: T.bg, border: `1px solid ${T.border}`, fontFamily: T.font, fontWeight: 600, fontSize: 14, color: T.textMuted, cursor: "pointer" }}>
                  Fermer
                </button>
              </div>
            </div>
          )}

          {/* ── MODAL SUPPRESSION ── */}
          {deleteConfirm && (
            <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <div style={{ textAlign: "center", marginBottom: 22 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: T.dangerLight, border: `1px solid rgba(224,82,82,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 14px" }}>🗑️</div>
                  <h3 style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 800, color: T.danger, margin: "0 0 8px" }}>Supprimer le dossier ?</h3>
                  <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, margin: 0 }}>
                    Action irréversible. Toutes vos informations médicales seront définitivement effacées.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setDeleteConfirm(false)} style={{ flex: 1, padding: 12, borderRadius: T.radiusSm, background: T.bg, border: `1px solid ${T.border}`, color: T.textMuted, fontFamily: T.font, fontWeight: 600, cursor: "pointer" }}>
                    Annuler
                  </button>
                  <button onClick={deleteDossier} style={{ flex: 1, padding: 12, borderRadius: T.radiusSm, background: T.dangerLight, border: `1px solid rgba(224,82,82,0.25)`, color: T.danger, fontFamily: T.font, fontWeight: 700, cursor: "pointer" }}>
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