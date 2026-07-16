"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";

// ─────────────────────────────────────────────────────────────
// IMPORTS LUCIDE ICONS
// ─────────────────────────────────────────────────────────────
import {
  Search,
  X,
  Calendar,
  Stethoscope,
  ClipboardList,
  Plus,
  Eye,
  Edit,
  Activity,
  List,
  Clock,
  FileCheck,
  Award,
  Ban,
  HeartPulse,
  UserX,
  User,
  FileText,
  Save,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface Stats {
  rendezvous?: number;
  consultations?: number;
  ordonnances?: number;
  [key: string]: number | undefined;
}

interface Certificat {
  id: number;
  patient_name: string;
  date_emission: string;
  type_certificat: string;
  notes: string;
  status: string;
}

type FilterType = "tous" | "aujourdhui" | "passe";
type ModalType = "view" | "edit" | "new" | null;

// ─────────────────────────────────────────────────────────────
// CONFIGURATION DES TYPES DE CERTIFICATS
// ─────────────────────────────────────────────────────────────
const typeConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  arret: {
    label: "Arrêt de travail",
    color: "#C2410C",
    bg: "#FFF7ED",
    icon: Calendar,
  },
  reprise: {
    label: "Reprise de travail",
    color: "#0369A1",
    bg: "#F0F9FF",
    icon: Award,
  },
  consultation: {
    label: "Consultation",
    color: "#7C3AED",
    bg: "#F5F3FF",
    icon: Stethoscope,
  },
  aptitude: {
    label: "Aptitude",
    color: "#047857",
    bg: "#ECFDF5",
    icon: FileCheck,
  },
  inaptitude: {
    label: "Inaptitude",
    color: "#B91C1C",
    bg: "#FEF2F2",
    icon: Ban,
  },
  grossesse: {
    label: "Grossesse",
    color: "#9333EA",
    bg: "#FAF5FF",
    icon: HeartPulse,
  },
  deces: {
    label: "Décès",
    color: "#333333",
    bg: "#F3F4F6",
    icon: UserX,
  },
  custom: {
    label: "Attestation libre",
    color: "#5B21B6",
    bg: "#EDE9FE",
    icon: ClipboardList,
  },
};

// ─────────────────────────────────────────────────────────────
// SOUS-COMPOSANT : MODALE NOUVEAU (Intégré pour éviter le blanc)
// ─────────────────────────────────────────────────────────────
function NewCertModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [patientName, setPatientName] = useState("");
  const [dateEmission, setDateEmission] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [typeCert, setTypeCert] = useState("consultation");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    if (!patientName.trim()) {
      setErrorMsg("Le nom du patient est obligatoire.");
      setSaving(false);
      return;
    }

    try {
      await api.post("certificats/", {
        patient_name: patientName.trim(),
        date_emission: dateEmission,
        type_certificat: typeCert,
        notes: notes.trim(),
        status: "brouillon",
      });
      setSuccessMsg(true);
      setTimeout(() => {
        onSave(); // Rafraîchir la liste
        onClose(); // Fermer la modale
      }, 1000);
    } catch (err: any) {
      const d = err?.response?.data;
      setErrorMsg(
        typeof d === "object"
          ? JSON.stringify(d)
          : "Erreur lors de la création.",
      );
      setSaving(false);
    }
  };

  const currentConfig = typeConfig[typeCert] || typeConfig.custom;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {successMsg ? (
          <div className="success-state">
            <div className="success-icon">
              <CheckCircle size={32} />
            </div>
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 20,
                fontWeight: 800,
                color: "#1e293b",
                marginBottom: 8,
              }}
            >
              Certificat créé !
            </h3>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <div>
                <div className="modal-title">Nouveau Certificat</div>
                <div className="modal-sub">Créer un document</div>
              </div>
              <button className="modal-close" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              {errorMsg && (
                <div className="error-box">
                  <X size={16} />
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Patient</label>
                <div style={{ position: "relative" }}>
                  <User
                    size={18}
                    color="#94a3b8"
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    className="form-input"
                    style={{ paddingLeft: "40px" }}
                    placeholder="Nom complet"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={typeCert}
                  onChange={(e) => setTypeCert(e.target.value)}
                >
                  {Object.entries(typeConfig).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <div className="type-preview-card">
                  <FileText size={18} /> <span>{currentConfig.label}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <div style={{ position: "relative" }}>
                  <Calendar
                    size={18}
                    color="#94a3b8"
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="date"
                    className="form-input"
                    style={{ paddingLeft: "40px" }}
                    value={dateEmission}
                    onChange={(e) => setDateEmission(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  placeholder="Détails..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </form>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={onClose}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={saving}
                onClick={(e) => {
                  const form = document.querySelector(
                    "form",
                  ) as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="spin" /> Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={18} /> Créer
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL : VISUALISATION
// ─────────────────────────────────────────────────────────────
function ViewPanel({
  cert,
  onClose,
  onEdit,
  username,
}: {
  cert: Certificat;
  onClose: () => void;
  onEdit: () => void;
  username: string;
}) {
  const config = typeConfig[cert.type_certificat] || typeConfig.custom;
  const IconComponent = config.icon;

  const formattedDate = cert.date_emission
    ? new Date(cert.date_emission).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const initials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <>
      <div className="panel-header">
        <div>
          <div className="panel-title">Détail du certificat</div>
          <div className="panel-sub">Référence #{cert.id}</div>
        </div>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-body">
        <div
          className="pt-badge"
          style={{
            background: config.bg,
            border: `1px solid ${config.bg}`,
          }}
        >
          <div
            className="pt-avatar"
            style={{ background: config.color, color: "#fff" }}
          >
            <IconComponent size={20} />
          </div>
          <div>
            <div className="pt-name">{cert.patient_name || "Inconnu"}</div>
            <div
              className="pt-dr"
              style={{ color: config.color, fontWeight: 600 }}
            >
              {config.label}
            </div>
          </div>
        </div>

        <div className="info-row">
          <span className="info-key">📅 Date d'émission</span>
          <span className="info-val">{formattedDate}</span>
        </div>

        <div>
          <div className="section-label">📋 Notes & Observations</div>
          <div className="notes-content">
            {cert.notes || (
              <span className="empty-notes">Aucune note spécifique.</span>
            )}
          </div>
        </div>

        <div className="sig-area">
          <span style={{ fontSize: 11, color: "#999" }}>
            Document généré le {new Date().toLocaleDateString("fr-FR")}
          </span>
          <div className="sig-block">
            <div className="sig-line" />
            <div style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>
              Dr. {username}
            </div>
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-panel-cancel" onClick={onClose}>
          Fermer
        </button>
        <button className="btn-panel-edit" onClick={onEdit}>
          ✏️ Modifier
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL : MODIFIER
// ─────────────────────────────────────────────────────────────
function EditPanel({
  cert,
  onClose,
  onSave,
}: {
  cert: Certificat;
  onClose: () => void;
  onSave: (updated: Certificat) => void;
}) {
  const [notes, setNotes] = useState(cert.notes || "");
  const [dateEmission, setDateEmission] = useState(
    cert.date_emission?.slice(0, 10) || "",
  );
  const [typeCert, setTypeCert] = useState(cert.type_certificat);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setErrorMsg(null);
    setSaving(true);
    try {
      await api.patch(`certificats/${cert.id}/`, {
        notes: notes.trim(),
        date_emission: dateEmission,
        type_certificat: typeCert,
      });
      onSave({
        ...cert,
        notes: notes.trim(),
        date_emission: dateEmission,
        type_certificat: typeCert,
      });
    } catch (err: any) {
      const d = err?.response?.data;
      setErrorMsg(
        typeof d === "object" && d
          ? Object.entries(d)
              .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : "Erreur serveur.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="panel-header">
        <div>
          <div className="panel-title">Modifier le certificat</div>
          <div className="panel-sub">Référence #{cert.id}</div>
        </div>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-body">
        {errorMsg && <div className="panel-err">⚠️ {errorMsg}</div>}

        <div className="pt-badge">
          <div className="pt-avatar">
            {cert.patient_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <span className="pt-name">{cert.patient_name || "—"}</span>
        </div>

        <div className="panel-field">
          <label>Type de certificat</label>
          <select
            value={typeCert}
            onChange={(e) => setTypeCert(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              color: "#1C1040",
              background: "#FAFAFE",
              border: "1px solid #E5E2F5",
              borderRadius: "10px",
              outline: "none",
            }}
          >
            {Object.entries(typeConfig).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>

        <div className="panel-field">
          <label>Date d'émission</label>
          <input
            type="date"
            value={dateEmission}
            onChange={(e) => setDateEmission(e.target.value)}
          />
        </div>

        <div className="panel-field">
          <label>Notes / Détails</label>
          <textarea
            rows={6}
            placeholder="Saisissez les détails du certificat..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-panel-cancel" onClick={onClose}>
          Annuler
        </button>
        <button
          className="btn-panel-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Sauvegarde…" : "✓ Enregistrer"}
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function Certificats() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });
  const [certificats, setCertificats] = useState<Certificat[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("tous");
  const [loading, setLoading] = useState(true);

  // Gestion de l'état des panels (View, Edit, ou NEW)
  const [panelType, setPanelType] = useState<ModalType>(null);
  const [selectedCert, setSelectedCert] = useState<Certificat | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("ordonnances/"),
    ])
      .then(([r, c, o]) => {
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
        });
        return api.get("certificats/");
      })
      .then((res) => {
        setCertificats(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [token, isLoading, router]);

  const openNew = () => {
    setPanelType("new");
  };

  const openView = (c: Certificat) => {
    setSelectedCert(c);
    setPanelType("view");
  };

  const openEdit = (c: Certificat) => {
    setSelectedCert(c);
    setPanelType("edit");
  };

  const closePanel = () => {
    setPanelType(null);
    setSelectedCert(null);
  };

  if (isLoading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F4F2F9",
          fontFamily: "'DM Sans', sans-serif",
          color: "#8B5CF6",
        }}
      >
        Chargement...
      </div>
    );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = certificats.filter((c) => {
    const searchMatch =
      c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.type_certificat?.toLowerCase().includes(search.toLowerCase()) ||
      c.notes?.toLowerCase().includes(search.toLowerCase());

    if (!searchMatch) return false;

    if (activeFilter === "tous") return true;

    const cDate = new Date(c.date_emission);
    cDate.setHours(0, 0, 0, 0);

    if (activeFilter === "aujourdhui") {
      return cDate.getTime() === today.getTime();
    }

    if (activeFilter === "passe") {
      return cDate.getTime() < today.getTime();
    }

    return true;
  });

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?"
    );
  };

  const filters: { key: FilterType; label: string; icon: any }[] = [
    { key: "tous", label: "Tous", icon: List },
    { key: "aujourdhui", label: "Aujourd'hui", icon: Calendar },
    { key: "passe", label: "Passés", icon: Clock },
  ];

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght:700;800&family=DM+Sans:wght:400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .root  { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
        .main  { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); animation:fadeUp .4s ease; }

        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
        
        .page-title  { 
            font-family:'Syne',sans-serif; 
            font-size:28px; 
            font-weight:800; 
            background: linear-gradient(135deg, #8B5CF6, #10B981); 
            -webkit-background-clip: text; 
            background-clip: text; 
            color: transparent; 
            -webkit-text-fill-color: transparent; 
        }
        .page-sub    { font-size:13px; color:#64748b; margin-top:6px; }

        .btn-new { background:linear-gradient(135deg, #8B5CF6, #7C3AED); border:none; border-radius:14px; 
                   color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; 
                   padding:12px 22px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:8px; 
                   box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); }
        .btn-new:hover { background:linear-gradient(135deg, #7C3AED, #6D28D9); transform:translateY(-2px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.35); }

        .search-container {
            background: white;
            border: 1px solid #EAE8F5;
            border-radius: 14px;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .search-container:focus-within {
            border-color: #8B5CF6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            color: #1e1b4b;
            outline: none;
        }
        .search-input::placeholder {
            color: #94a3b8;
        }
        
        .filter-btn {
            padding: 10px 18px;
            border-radius: 14px;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid rgba(0,0,0,0.06);
            background: rgba(255,255,255,0.6);
            color: #64748b;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .filter-btn:hover {
            background: rgba(139, 92, 246, 0.05);
            color: #334155;
            border-color: rgba(139, 92, 246, 0.2);
            transform: translateY(-1px);
        }
        .filter-btn.active {
            background: linear-gradient(135deg, #8B5CF6, #10B981);
            color: white;
            border-color: transparent;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.35);
        }

        .table-card { background:#fff; border-radius:20px; border:1px solid #EAE8F5; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .table-head { display:grid; grid-template-columns:2fr 1.2fr 1.5fr 2fr 1fr; padding:14px 24px; background:#FAFAFE; border-bottom:1px solid #EAE8F5; }
        .th { font-size:11px; font-weight:700; color:#8B5CF6; text-transform:uppercase; letter-spacing:.6px; }
        .table-row { display:grid; grid-template-columns:2fr 1.2fr 1.5fr 2fr 1fr; padding:16px 24px; border-bottom:1px solid #F4F2F9; 
                     align-items:center; transition:background .15s; }
        .table-row:last-child { border-bottom:none; }
        .table-row:hover { background:#F8FAFC; }

        .td-name { display:flex; align-items:center; gap:12px; font-size:14px; font-weight:600; color:#1e1b4b; }
        .avatar  { width:36px; height:36px; border-radius:12px; background:linear-gradient(135deg, #F3E8FF, #D1FAE5); 
                   display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; 
                   color: #7C3AED; flex-shrink:0; }
        .td-date { font-size:13px; color:#64748b; font-weight: 500; }
        .td-objet { font-size:12px; color:#8A87A0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:12px; }

        .type-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; }
        
        .action-btn { display:inline-flex; align-items:center; gap:6px; background:#F0EEF9; color:#7C3AED; font-size:11px; font-weight:700; 
                      padding:6px 12px; border-radius:20px; cursor:pointer; transition:all .2s; border:none; font-family:'DM Sans',sans-serif; }
        .action-btn:hover { background:#8B5CF6; color: white; transform: translateY(-1px); }

        .empty { text-align:center; padding:60px 20px; color:#8A87A0; }
        .empty-icon { margin-bottom:16px; color: #CBD5E1; }

        .skel { background:linear-gradient(90deg,#F4F2F9 25%,#EAE8F5 50%,#F4F2F9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; height:16px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── STYLE OVERLAY / PANEL (VIEW/EDIT) ── */
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; 
                  align-items:center; justify-content:center; z-index:200; }
        .panel   { width:520px; height:90vh; background:#fff; border-left:1px solid #EAE8F5; 
                  display:flex; flex-direction:column; overflow-y:auto;
                  animation:slideIn .25s ease; border-radius:20px; border:1px solid #EAE8F5; }
        @keyframes slideIn { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }

        .panel-header { padding:18px 22px; border-bottom:1px solid #F0EEF9; display:flex; 
                        align-items:center; justify-content:space-between; 
                        position:sticky; top:0; background:#fff; z-index:1; }
        .panel-title  { font-family:'Syne',sans-serif; font-size:16px; font-weight:800; color:#1C1040; }
        .panel-sub    { font-size:12px; color:#8A87A0; margin-top:2px; }
        .panel-close  { width:32px; height:32px; border:1px solid #EAE8F5; border-radius:8px; 
                        display:flex; align-items:center; justify-content:center; cursor:pointer; 
                        background:#fff; color:#8A87A0; font-size:14px; transition:all .2s; }
        .panel-close:hover { background:#F0EEF9; color:#1C1040; }

        .panel-body   { padding:22px; flex:1; display:flex; flex-direction:column; gap:18px; }
        .pt-badge     { display:flex; align-items:center; gap:10px; border-radius:12px; padding:12px 16px; }
        .pt-avatar    { width:40px; height:40px; border-radius:50%; color:#fff; 
                        display:flex; align-items:center; justify-content:center; 
                        font-size:16px; font-weight:700; flex-shrink:0; }
        .pt-name      { font-size:15px; font-weight:700; color:#3C3489; }
        .pt-dr        { font-size:12px; color:#8A87A0; margin-top:2px; }
        .section-label{ font-size:11px; font-weight:700; color:#8A87A0; text-transform:uppercase; 
                        letter-spacing:.7px; margin-bottom:6px; }
        .notes-content{ background:#FAFAFE; border:1px solid #EAE8F5; border-radius:12px; 
                        padding:14px; font-size:14px; line-height:1.7; color:#1C1040; white-space:pre-wrap; }
        .empty-notes  { color:#C4C0D8; font-style:italic; }
        .info-row     { display:flex; justify-content:space-between; padding:8px 0; 
                        border-bottom:1px solid #F4F2F9; font-size:13px; }
        .info-key     { color:#8A87A0; }
        .info-val     { font-weight:600; color:#1C1040; text-align:right; max-width:60%; }
        .sig-area     { display:flex; justify-content:space-between; align-items:flex-end; 
                        padding:12px 0 0; border-top:1px solid #F0EEF9; }
        .sig-block    { text-align:center; }
        .sig-line     { width:70px; border-top:1px solid #999; margin:0 auto 4px; }

        .panel-field  { display:flex; flex-direction:column; gap:5px; }
        .panel-field label { font-size:11px; font-weight:600; color:#8A87A0; 
                            text-transform:uppercase; letter-spacing:.5px; }
        .panel-field input,
        .panel-field textarea { width:100%; padding:10px 12px; font-family:'DM Sans',sans-serif; 
                                font-size:13px; color:#1C1040; background:#FAFAFE; 
                                border:1px solid #E5E2F5; border-radius:10px; outline:none; 
                                transition:all .2s; }
        .panel-field input:focus,
        .panel-field textarea:focus { border-color:#534AB7; background:#fff; 
                                      box-shadow:0 0 0 3px rgba(83,74,183,.1); }
        .panel-field textarea { resize:vertical; line-height:1.6; }
        .panel-field select { width:100%; padding:10px 12px; font-family:'DM Sans',sans-serif; 
                                font-size:13px; color:#1C1040; background:#FAFAFE; 
                                border:1px solid #E5E2F5; border-radius:10px; outline:none; 
                                transition:all .2s; }
        .panel-err    { background:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; 
                        padding:10px 14px; color:#DC2626; font-size:12px; font-weight:600; }

        .panel-footer    { padding:14px 22px; background:#FAFAFE; border-top:1px solid #F0EEF9; 
                          display:flex; gap:10px; position:sticky; bottom:0; }
        .btn-panel-cancel{ flex:1; padding:10px; background:#fff; border:1px solid #E5E2F5; 
                          border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; 
                          font-weight:600; color:#8A87A0; cursor:pointer; }
        .btn-panel-cancel:hover { border-color:#C4C0D8; color:#1C1040; }
        .btn-panel-edit  { flex:2; padding:10px; background:#F0EEF9; border:none; border-radius:12px; 
                          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; 
                          color:#7C3AED; cursor:pointer; }
        .btn-panel-edit:hover { background:#8B5CF6; color:#fff; }
        .btn-panel-save  { flex:2; padding:10px; background:#1C1040; border:none; border-radius:12px; 
                          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; 
                          color:#fff; cursor:pointer; }
        .btn-panel-save:hover  { background:#2D1A6B; }
        .btn-panel-save:disabled { opacity:.5; cursor:not-allowed; }

        /* ── STYLE MODALE NOUVEAU (CENTREE) ── */
        @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        
        .modal-panel { 
            width: 100%; max-width: 480px; background:#fff; border-radius: 24px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display:flex; flex-direction:column; max-height: 90vh; overflow: hidden; 
            animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
        }
        .modal-header { padding:24px 28px; border-bottom:1px solid #F1F5F9; display:flex; align-items:center; justify-content:space-between; background:#fff; flex-shrink: 0; }
        .modal-title  { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; background: linear-gradient(135deg, #8B5CF6, #6366f1); -webkit-background-clip: text; color: transparent; }
        .modal-sub    { font-size:13px; color:#64748b; margin-top:2px; }
        .modal-close  { width:32px; height:32px; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; background:#F1F5F9; color:#64748b; font-size:14px; transition:all .2s; }
        .modal-close:hover { background:#E2E8F0; color:#EF4444; }
        .modal-body   { padding:24px 28px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:20px; }
        .form-group { display:flex; flex-direction:column; gap:8px; }
        .form-label  { font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-left: 2px; }
        .form-input, .form-select, .form-textarea { width:100%; padding:12px 14px; font-family:'DM Sans',sans-serif; font-size:14px; color:#1e293b; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; outline:none; transition:all .2s; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { background:#fff; border-color:#8B5CF6; box-shadow:0 0 0 3px rgba(139,92,246,0.1); }
        .form-textarea { resize:vertical; line-height:1.6; min-height:100px; }
        .type-preview-card { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 12px; font-weight: 600; font-size: 14px; transition: all 0.2s; }
        .error-box { background:#FEF2F2; color:#DC2626; border:1px solid #FCA5A5; border-radius:10px; padding:12px 14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:8px; }
        .modal-footer { padding:20px 28px; background:#fff; border-top:1px solid #F1F5F9; display:flex; gap:12px; flex-shrink: 0; }
        .btn-cancel { flex:1; padding:12px; background:#fff; border:1px solid #E2E8F0; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; color:#64748b; cursor:pointer; transition: all 0.2s; }
        .btn-cancel:hover { background:#F8FAFC; color:#334155; }
        .btn-save  { flex:2; padding:12px; background:linear-gradient(135deg, #8B5CF6, #6366F1); border:none; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); transition: all 0.2s; }
        .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35); }
        .btn-save:disabled { opacity:0.7; cursor:not-allowed; transform: none; }
        .success-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; }
        .success-icon { width: 64px; height: 64px; background: #ECFDF5; color: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Certificats Médicaux" subtitle={`Dr. ${username}`} />

        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-title">Certificats Médicaux</div>
              <div className="page-sub">
                {filtered.length} certificat
                {filtered.length !== 1 ? "s" : ""} affiché
                {filtered.length !== 1 ? "s" : ""}
                {activeFilter !== "tous"
                  ? ` (${filters.find((f) => f.key === activeFilter)?.label})`
                  : ""}
              </div>
            </div>
            <button
              className="btn-new"
              onClick={openNew} // CHANGE ICI : Appel openNew au lieu de router.push
            >
              <Plus size={18} />
              Nouveau certificat
            </button>
          </div>

          {/* CONTENEUR FLEX HORIZONTAL : Recherche + Filtres */}
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <div
              className="search-container"
              style={{ flex: 1, minWidth: "280px", marginBottom: 0 }}
            >
              <Search size={18} color="#94a3b8" />
              <input
                className="search-input"
                placeholder="Rechercher par patient, type ou notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: 2,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 0,
              }}
            >
              {filters.map((f) => {
                const IconComponent = f.icon;
                return (
                  <button
                    key={f.key}
                    className={`filter-btn ${activeFilter === f.key ? "active" : ""}`}
                    onClick={() => setActiveFilter(f.key)}
                  >
                    <IconComponent size={16} strokeWidth={2.5} />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="table-card">
            <div className="table-head">
              <span className="th">Patient</span>
              <span className="th">Date</span>
              <span className="th">Type</span>
              <span className="th">Notes</span>
              <span className="th">Action</span>
            </div>

            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="table-row">
                  <div className="skel" style={{ width: "60%" }} />
                  <div className="skel" style={{ width: "50%" }} />
                  <div className="skel" style={{ width: "40%" }} />
                  <div className="skel" style={{ width: "80%" }} />
                  <div className="skel" style={{ width: "30%" }} />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">
                  <ClipboardList size={48} strokeWidth={1.5} />
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: 4,
                  }}
                >
                  Aucun certificat trouvé
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  {search
                    ? "Aucun résultat pour cette recherche."
                    : activeFilter !== "tous"
                      ? `Aucun certificat ${filters.find((f) => f.key === activeFilter)?.label.toLowerCase()}.`
                      : "Commencez par créer un nouveau certificat."}
                </div>
              </div>
            ) : (
              filtered.map((cert) => {
                const config =
                  typeConfig[cert.type_certificat] || typeConfig.custom;
                const IconComponent = config.icon;

                return (
                  <div key={cert.id} className="table-row">
                    <div className="td-name">
                      <div className="avatar">
                        {getInitials(cert.patient_name || "")}
                      </div>
                      {cert.patient_name || "—"}
                    </div>
                    <div className="td-date">
                      {cert.date_emission
                        ? new Date(cert.date_emission).toLocaleDateString(
                            "fr-FR",
                          )
                        : "—"}
                    </div>
                    <div>
                      <span
                        className="type-badge"
                        style={{
                          color: config.color,
                          background: config.bg,
                        }}
                      >
                        <IconComponent size={12} strokeWidth={2.5} />
                        {config.label}
                      </span>
                    </div>
                    <div className="td-objet" title={cert.notes}>
                      {cert.notes || "Aucune note"}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="action-btn"
                        onClick={() => openView(cert)}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => openEdit(cert)}
                      >
                        <Edit size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Gestion de l'affichage des Modales / Panels */}
        {panelType === "new" && (
          <NewCertModal onClose={closePanel} onSave={fetchData} />
        )}

        {panelType &&
          selectedCert &&
          (panelType === "view" || panelType === "edit") && (
            <div
              className="overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) closePanel();
              }}
            >
              <div className="panel">
                {panelType === "view" && (
                  <ViewPanel
                    cert={selectedCert}
                    onClose={closePanel}
                    onEdit={() => setPanelType("edit")}
                    username={username}
                  />
                )}
                {panelType === "edit" && (
                  <EditPanel
                    cert={selectedCert}
                    onClose={closePanel}
                    onSave={(updated) => {
                      setCertificats((prev) =>
                        prev.map((c) => (c.id === updated.id ? updated : c)),
                      );
                      closePanel();
                    }}
                  />
                )}
              </div>
            </div>
          )}
      </div>
    </PrivateRoute>
  );
}
