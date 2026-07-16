"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

// ─────────────────────────────────────────────────────────────
// IMPORTS LUCIDE ICONS
// ─────────────────────────────────────────────────────────────
import {
  Search,
  X,
  Calendar,
  Activity,
  List,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  Save,
  Stethoscope,
  FileText,
  Edit,
  Eye,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Patient {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface Controle {
  id: number;
  patient: number;
  patient_name: string;
  type_controle: string;
  date_controle: string;
  statut_paiement: "paye" | "non_paye";
  notes?: string;
  created_at: string;
}

type FilterType = "tous" | "paye" | "non_paye";
type ModalType = "view" | "edit" | "new" | null;

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const TYPES_CONTROLE = [
  {
    value: "tension_arterielle",
    label: "Tension artérielle",
    icon: Stethoscope,
  },
  { value: "glycemie", label: "Glycémie", icon: Activity },
  { value: "poids_taille", label: "Poids & Taille", icon: Activity }, // Approximation icône
  {
    value: "electrocardiogramme",
    label: "Électrocardiogramme",
    icon: Activity,
  },
  { value: "bilan_sanguin", label: "Bilan sanguin", icon: Activity },
  { value: "radiologie", label: "Radiologie", icon: FileText },
  { value: "echographie", label: "Échographie", icon: FileText },
  { value: "spirometrie", label: "Spirométrie", icon: Activity },
  { value: "fond_oeil", label: "Fond d'œil", icon: Eye },
  { value: "autre", label: "Autre", icon: FileText },
];

const typeConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = TYPES_CONTROLE.reduce(
  (acc, curr) => {
    acc[curr.value] = {
      label: curr.label,
      color: "#64748b",
      bg: "#F1F5F9",
      icon: curr.icon,
    };
    return acc;
  },
  {} as Record<string, any>,
);

// ─────────────────────────────────────────────────────────────
// MODALE NOUVEAU (Style Centré Fichier Certificats)
// ─────────────────────────────────────────────────────────────
function NewControleModal({
  patients,
  onClose,
  onSave,
}: {
  patients: Patient[];
  onClose: () => void;
  onSave: (c: Controle) => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [typeControle, setTypeControle] = useState("");
  const [dateControle, setDateControle] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [statutPaiement, setStatutPaiement] = useState<"paye" | "non_paye">(
    "non_paye",
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!patientId || !typeControle || !dateControle) {
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      setSaving(false);
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("controles/", {
        patient: parseInt(patientId),
        type_controle: typeControle,
        date_controle: dateControle,
        statut_paiement: statutPaiement,
        notes: notes.trim() || undefined,
      });
      onSave(res.data);
      onClose();
    } catch (err: any) {
      const d = err?.response?.data;
      setErrorMsg(
        typeof d === "object" ? JSON.stringify(d) : "Erreur serveur.",
      );
    } finally {
      setSaving(false);
    }
  };

  const getPatientLabel = (p: Patient) =>
    `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Nouveau Contrôle</div>
            <div className="modal-sub">Enregistrer un examen</div>
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
            <select
              className="form-select"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            >
              <option value="">Sélectionner un patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {getPatientLabel(p)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Type de contrôle</label>
            <select
              className="form-select"
              value={typeControle}
              onChange={(e) => setTypeControle(e.target.value)}
            >
              <option value="">Sélectionner le type...</option>
              {TYPES_CONTROLE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
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
                value={dateControle}
                onChange={(e) => setDateControle(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Statut Paiement</label>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setStatutPaiement("non_paye")}
                className={`paye-btn ${statutPaiement === "non_paye" ? "active" : ""}`}
              >
                <XCircle size={16} /> Non payé
              </button>
              <button
                type="button"
                onClick={() => setStatutPaiement("paye")}
                className={`paye-btn ${statutPaiement === "paye" ? "active" : ""}`}
              >
                <CheckCircle size={16} /> Payé
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Observations..."
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
              const form = document.querySelector("form") as HTMLFormElement;
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
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL VISUALISATION (Style Fichier Certificats)
// ─────────────────────────────────────────────────────────────
function ViewPanel({
  controle,
  onClose,
  onEdit,
}: {
  controle: Controle;
  onClose: () => void;
  onEdit: () => void;
}) {
  const config = typeConfig[controle.type_controle] || {
    label: controle.type_controle,
    color: "#64748b",
    bg: "#F1F5F9",
    icon: Activity,
  };
  const IconComponent = config.icon;
  const isPaye = controle.statut_paiement === "paye";

  return (
    <>
      <div className="panel-header">
        <div>
          <div className="panel-title">Détail du Contrôle</div>
          <div className="panel-sub">Référence #{controle.id}</div>
        </div>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="panel-body">
        <div
          className="pt-badge"
          style={{ background: config.bg, border: `1px solid ${config.bg}` }}
        >
          <div
            className="pt-avatar"
            style={{ background: "#8B5CF6", color: "#fff" }}
          >
            <IconComponent size={20} />
          </div>
          <div>
            <div className="pt-name">{controle.patient_name || "Inconnu"}</div>
            <div
              className="pt-dr"
              style={{ color: "#8B5CF6", fontWeight: 600 }}
            >
              {config.label}
            </div>
          </div>
        </div>
        <div className="info-row">
          <span className="info-key">📅 Date</span>
          <span className="info-val">
            {new Date(controle.date_controle).toLocaleDateString("fr-FR")}
          </span>
        </div>
        <div className="info-row">
          <span className="info-key">💰 Paiement</span>
          <span
            className="info-val"
            style={{ color: isPaye ? "#059669" : "#D97706", fontWeight: 700 }}
          >
            {isPaye ? "Payé" : "Non payé"}
          </span>
        </div>
        <div>
          <div className="section-label">📋 Notes</div>
          <div className="notes-content">
            {controle.notes || (
              <span className="empty-notes">Aucune note.</span>
            )}
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
// PANEL MODIFICATION
// ─────────────────────────────────────────────────────────────
function EditPanel({
  controle,
  onClose,
  onSave,
}: {
  controle: Controle;
  onClose: () => void;
  onSave: (updated: Controle) => void;
}) {
  const [notes, setNotes] = useState(controle.notes || "");
  const [dateControle, setDateControle] = useState(
    controle.date_controle?.slice(0, 10) || "",
  );
  const [statutPaiement, setStatutPaiement] = useState<"paye" | "non_paye">(
    controle.statut_paiement,
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setErrorMsg(null);
    setSaving(true);
    try {
      await api.patch(`controles/${controle.id}/`, {
        notes: notes.trim(),
        date_controle: dateControle,
        statut_paiement: statutPaiement,
      });
      onSave({
        ...controle,
        notes: notes.trim(),
        date_controle: dateControle,
        statut_paiement: statutPaiement,
      });
    } catch (err: any) {
      const d = err?.response?.data;
      setErrorMsg(
        typeof d === "object" ? JSON.stringify(d) : "Erreur serveur.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="panel-header">
        <div>
          <div className="panel-title">Modifier le contrôle</div>
          <div className="panel-sub">Référence #{controle.id}</div>
        </div>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="panel-body">
        {errorMsg && <div className="panel-err">⚠️ {errorMsg}</div>}
        <div className="pt-badge">
          <div className="pt-avatar">
            {controle.patient_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <span className="pt-name">{controle.patient_name || "—"}</span>
        </div>

        <div className="panel-field">
          <label>Date du contrôle</label>
          <input
            type="date"
            value={dateControle}
            onChange={(e) => setDateControle(e.target.value)}
          />
        </div>

        <div className="panel-field">
          <label>Statut Paiement</label>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setStatutPaiement("non_paye")}
              className={`paye-btn ${statutPaiement === "non_paye" ? "active" : ""}`}
              style={{ flex: 1, padding: 10 }}
            >
              <XCircle size={16} /> Non payé
            </button>
            <button
              type="button"
              onClick={() => setStatutPaiement("paye")}
              className={`paye-btn ${statutPaiement === "paye" ? "active" : ""}`}
              style={{ flex: 1, padding: 10 }}
            >
              <CheckCircle size={16} /> Payé
            </button>
          </div>
        </div>

        <div className="panel-field">
          <label>Notes</label>
          <textarea
            rows={6}
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
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function MedecinControles() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [controles, setControles] = useState<Controle[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("tous");
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });

  const [panelType, setPanelType] = useState<ModalType>(null);
  const [selectedControle, setSelectedControle] = useState<Controle | null>(
    null,
  );

  const fetchData = () => {
    setLoading(true);
    api
      .get("controles/")
      .then((r) => setControles(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    api
      .get("patients/")
      .then((r) => setPatients(r.data.results || r.data))
      .catch(() => {});

    Promise.all([
      api.get("rendezvous/").catch(() => ({ data: [] })),
      api.get("consultations/").catch(() => ({ data: [] })),
      api.get("ordonnances/").catch(() => ({ data: [] })),
    ]).then(([rv, co, or]) =>
      setStats({
        rendezvous: rv.data.results?.length ?? rv.data.length ?? 0,
        consultations: co.data.results?.length ?? co.data.length ?? 0,
        ordonnances: or.data.results?.length ?? or.data.length ?? 0,
      }),
    );
  };

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [token, isLoading]);

  if (isLoading) return null;

  const filteredControles = controles
    .filter((c) => {
      if (activeFilter === "paye") return c.statut_paiement === "paye";
      if (activeFilter === "non_paye") return c.statut_paiement === "non_paye";
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.date_controle).getTime() -
        new Date(a.date_controle).getTime(),
    );

  const getTypeLabel = (val: string) =>
    TYPES_CONTROLE.find((t) => t.value === val)?.label ?? val;

  const openNew = () => {
    setPanelType("new");
    setShowModal(true);
  };
  const openView = (c: Controle) => {
    setSelectedControle(c);
    setPanelType("view");
  };
  const openEdit = (c: Controle) => {
    setSelectedControle(c);
    setPanelType("edit");
  };
  const closeAll = () => {
    setPanelType(null);
    setSelectedControle(null);
    setShowModal(false);
  };

  const filters: { key: FilterType; label: string; icon: any }[] = [
    { key: "tous", label: "Tous", icon: List },
    { key: "paye", label: "Payés", icon: CheckCircle },
    { key: "non_paye", label: "Non payés", icon: XCircle },
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
        .page-title  { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; background: linear-gradient(135deg, #8B5CF6, #10B981); -webkit-background-clip: text; color: transparent; }
        .page-sub    { font-size:13px; color:#64748b; margin-top:6px; }

        .btn-new { background:linear-gradient(135deg, #8B5CF6, #7C3AED); border:none; border-radius:14px; color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:12px 22px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:8px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); }
        .btn-new:hover { transform:translateY(-2px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.35); }

        /* Search & Filters */
        .search-container { background: white; border: 1px solid #EAE8F5; border-radius: 14px; padding: 8px 16px; display: flex; align-items: center; gap: 12px; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
        .search-container:focus-within { border-color: #8B5CF6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); }
        .search-input { flex: 1; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1e1b4b; outline: none; }
        
        .filter-btn { padding: 10px 18px; border-radius: 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; border: 1px solid rgba(0,0,0,0.06); background: rgba(255,255,255,0.6); color: #64748b; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; }
        .filter-btn:hover { background: rgba(139, 92, 246, 0.05); color: #334155; border-color: rgba(139, 92, 246, 0.2); transform: translateY(-1px); }
        .filter-btn.active { background: linear-gradient(135deg, #8B5CF6, #10B981); color: white; border-color: transparent; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.35); }

        /* Table Style */
        .table-card { background:#fff; border-radius:20px; border:1px solid #EAE8F5; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .table-head { display:grid; grid-template-columns:2fr 1.5fr 1.2fr 2fr 1fr; padding:14px 24px; background:#FAFAFE; border-bottom:1px solid #EAE8F5; }
        .th { font-size:11px; font-weight:700; color:#8B5CF6; text-transform:uppercase; letter-spacing:.6px; }
        .table-row { display:grid; grid-template-columns:2fr 1.5fr 1.2fr 2fr 1fr; padding:16px 24px; border-bottom:1px solid #F4F2F9; align-items:center; transition:background .15s; }
        .table-row:last-child { border-bottom:none; }
        .table-row:hover { background:#F8FAFC; }

        .td-name { display:flex; align-items:center; gap:12px; font-size:14px; font-weight:600; color:#1e1b4b; }
        .avatar  { width:36px; height:36px; border-radius:12px; background:linear-gradient(135deg, #F3E8FF, #D1FAE5); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color: #7C3AED; flex-shrink:0; }
        .td-date { font-size:13px; color:#64748b; font-weight: 500; }
        .td-objet { font-size:12px; color:#8A87A0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:12px; }
        
        .type-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; background:#F1F5F9; color:#64748b; }
        .paye-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; }
        .paye-badge.paye { background:#ECFDF5; color:#047857; }
        .paye-badge.non { background:#FFFBEB; color:#D97706; }

        .action-btn { display:inline-flex; align-items:center; gap:6px; background:#F0EEF9; color:#7C3AED; font-size:11px; font-weight:700; padding:6px 12px; border-radius:20px; cursor:pointer; transition:all .2s; border:none; font-family:'DM Sans',sans-serif; }
        .action-btn:hover { background:#8B5CF6; color: white; transform: translateY(-1px); }

        .empty { text-align:center; padding:60px 20px; color:#8A87A0; }

        /* Panel / Modal Styles (From Certificats) */
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:200; }
        .panel   { width:520px; height:90vh; background:#fff; border:1px solid #EAE8F5; display:flex; flex-direction:column; overflow-y:auto; animation:slideIn .25s ease; border-radius:20px; }
        @keyframes slideIn { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }

        .modal-panel { width: 100%; max-width: 480px; background:#fff; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); display:flex; flex-direction:column; max-height: 90vh; overflow: hidden; animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

        .panel-header, .modal-header { padding:18px 22px; border-bottom:1px solid #F0EEF9; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; background:#fff; z-index:1; }
        .modal-header { padding:24px 28px; }
        .panel-title, .modal-title  { font-family:'Syne',sans-serif; font-size:16px; font-weight:800; color:#1C1040; }
        .modal-title  { font-size:20px; background: linear-gradient(135deg, #8B5CF6, #6366f1); -webkit-background-clip: text; color: transparent; }
        .panel-sub, .modal-sub    { font-size:12px; color:#8A87A0; margin-top:2px; }
        .panel-close, .modal-close  { width:32px; height:32px; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; background:#F1F5F9; color:#64748b; transition:all .2s; }
        .panel-close:hover, .modal-close:hover { background:#E2E8F0; color:#EF4444; }

        .panel-body, .modal-body   { padding:22px; flex:1; display:flex; flex-direction:column; gap:18px; overflow-y:auto; }
        .modal-body { padding:24px 28px; gap:20px; }

        .pt-badge     { display:flex; align-items:center; gap:10px; border-radius:12px; padding:12px 16px; }
        .pt-avatar    { width:40px; height:40px; border-radius:50%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; flex-shrink:0; }
        .pt-name      { font-size:15px; font-weight:700; color:#3C3489; }
        .pt-dr        { font-size:12px; color:#8A87A0; margin-top:2px; }
        
        .section-label{ font-size:11px; font-weight:700; color:#8A87A0; text-transform:uppercase; letter-spacing:.7px; margin-bottom:6px; }
        .notes-content{ background:#FAFAFE; border:1px solid #EAE8F5; border-radius:12px; padding:14px; font-size:14px; line-height:1.7; color:#1C1040; white-space:pre-wrap; }
        .empty-notes  { color:#C4C0D8; font-style:italic; }
        .info-row     { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #F4F2F9; font-size:13px; }
        .info-key     { color:#8A87A0; }
        .info-val     { font-weight:600; color:#1C1040; text-align:right; max-width:60%; }

        .panel-field  { display:flex; flex-direction:column; gap:5px; }
        .form-group { display:flex; flex-direction:column; gap:8px; }
        .form-label  { font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-left: 2px; }
        .form-input, .form-select, .form-textarea, .panel-field input, .panel-field textarea { width:100%; padding:10px 12px; font-family:'DM Sans',sans-serif; font-size:13px; color:#1C1040; background:#FAFAFE; border:1px solid #E5E2F5; border-radius:10px; outline:none; transition:all .2s; }
        .form-input, .form-select, .form-textarea { background:#F8FAFC; border-color: #E2E8F0; font-size: 14px; padding: 12px 14px; }
        
        .form-input:focus, .form-select:focus, .form-textarea:focus, .panel-field input:focus, .panel-field textarea:focus { border-color:#534AB7; background:#fff; box-shadow:0 0 0 3px rgba(83,74,183,.1); }
        .panel-field textarea, .form-textarea { resize:vertical; line-height:1.6; }

        .paye-btn { flex:1; padding:10px; border-radius:12px; border:1px solid #E2E8F0; background: white; color:#64748b; cursor:pointer; font-weight:600; display:flex; align-items:center; justify-content:center; gap:6px; transition:all .2s; font-family:'DM Sans',sans-serif; font-size:13px; }
        .paye-btn.active { border-color: #8B5CF6; background: #F5F3FF; color: #7C3AED; box-shadow: 0 0 0 2px rgba(139,92,246,0.1); }

        .panel-err, .error-box { background:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; padding:10px 14px; color:#DC2626; font-size:12px; font-weight:600; display:flex; align-items:center; gap:8px; }
        .error-box { font-size: 13px; padding: 12px 14px; }

        .panel-footer, .modal-footer { padding:14px 22px; background:#FAFAFE; border-top:1px solid #F0EEF9; display:flex; gap:10px; position:sticky; bottom:0; }
        .modal-footer { padding:20px 28px; }
        
        .btn-panel-cancel, .btn-cancel { flex:1; padding:10px; background:#fff; border:1px solid #E5E2F5; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#8A87A0; cursor:pointer; }
        .btn-cancel { padding:12px; border-color:#E2E8F0; color:#64748b; }
        .btn-panel-cancel:hover, .btn-cancel:hover { border-color:#C4C0D8; color:#1C1040; }
        
        .btn-panel-edit, .btn-save { flex:2; padding:10px; background:#F0EEF9; border:none; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#7C3AED; cursor:pointer; }
        .btn-save { padding:12px; background:linear-gradient(135deg, #8B5CF6, #6366F1); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25); }
        .btn-panel-edit:hover, .btn-save:hover { background:#8B5CF6; color:#fff; }
        .btn-panel-save  { flex:2; padding:10px; background:#1C1040; border:none; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#fff; cursor:pointer; }
        .btn-panel-save:hover  { background:#2D1A6B; }
        .btn-panel-save:disabled, .btn-save:disabled { opacity:.5; cursor:not-allowed; }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Contrôles Médicaux" subtitle="Gestion des examens" />

        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-title">Contrôles Médicaux</div>
              <div className="page-sub">
                {filteredControles.length} contrôle
                {filteredControles.length !== 1 ? "s" : ""} affiché
                {filteredControles.length > 1 ? "s" : ""}
              </div>
            </div>
            <button className="btn-new" onClick={openNew}>
              <Plus size={18} /> Nouveau contrôle
            </button>
          </div>

          {/* Search & Filters */}
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
              style={{ flex: 1, minWidth: "280px" }}
            >
              <Search size={18} color="#94a3b8" />
              <input
                className="search-input"
                placeholder="Rechercher patient, type..."
              />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {filters.map((f) => {
                const IconComponent = f.icon;
                return (
                  <button
                    key={f.key}
                    className={`filter-btn ${activeFilter === f.key ? "active" : ""}`}
                    onClick={() => setActiveFilter(f.key)}
                  >
                    <IconComponent size={16} strokeWidth={2.5} /> {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table Grid */}
          <div className="table-card">
            <div className="table-head">
              <span className="th">Patient</span>
              <span className="th">Type de contrôle</span>
              <span className="th">Statut</span>
              <span className="th">Date</span>
              <span className="th">Action</span>
            </div>

            {loading ? (
              <div
                style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}
              >
                Chargement...
              </div>
            ) : filteredControles.length === 0 ? (
              <div className="empty">Aucun contrôle trouvé.</div>
            ) : (
              filteredControles.map((c) => {
                const config =
                  typeConfig[c.type_controle] || typeConfig["autre"];
                const IconComp = config.icon;

                return (
                  <div key={c.id} className="table-row">
                    <div className="td-name">
                      <div className="avatar">
                        {c.patient_name?.charAt(0) || "?"}
                      </div>
                      {c.patient_name || "—"}
                    </div>
                    <div>
                      <span className="type-badge">
                        <IconComp size={12} strokeWidth={2.5} /> {config.label}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`paye-badge ${c.statut_paiement === "paye" ? "paye" : "non"}`}
                      >
                        {c.statut_paiement === "paye" ? (
                          <CheckCircle size={10} />
                        ) : (
                          <XCircle size={10} />
                        )}
                        {c.statut_paiement === "paye" ? "Payé" : "Non payé"}
                      </span>
                    </div>
                    <div className="td-date">
                      {new Date(c.date_controle).toLocaleDateString("fr-FR")}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="action-btn"
                        onClick={() => openView(c)}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => openEdit(c)}
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

        {/* Modale Nouveau */}
        {showModal && (
          <NewControleModal
            patients={patients}
            onClose={() => {
              setShowModal(false);
              closeAll();
            }}
            onCreated={(newC) => setControles((prev) => [newC, ...prev])}
          />
        )}

        {/* Panels Latéraux */}
        {panelType &&
          selectedControle &&
          (panelType === "view" || panelType === "edit") && (
            <div
              className="overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) closeAll();
              }}
            >
              <div className="panel">
                {panelType === "view" && (
                  <ViewPanel
                    controle={selectedControle}
                    onClose={closeAll}
                    onEdit={() => setPanelType("edit")}
                  />
                )}
                {panelType === "edit" && (
                  <EditPanel
                    controle={selectedControle}
                    onClose={closeAll}
                    onSave={(updated) => {
                      setControles((prev) =>
                        prev.map((c) => (c.id === updated.id ? updated : c)),
                      );
                      closeAll();
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
