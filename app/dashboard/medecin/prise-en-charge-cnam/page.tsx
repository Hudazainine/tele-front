"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

import {
  ShieldCheck,
  Search,
  Plus,
  X,
  User,
  Loader2,
  Save,
  CheckCircle,
} from "lucide-react";

// ═════════════════════════════════════════════════════════════
// 1. TYPES & INTERFACES
// ═════════════════════════════════════════════════════════════
interface PriseEnChargeFormData {
  patient_nom: string;
  numero_prise_en_charge: string;
  date_prise_en_charge: string;
  type_couverture: string;
  taux_remboursement: string;
  montant_total: string;
  remarques: string;
}

interface PriseEnChargeRecord {
  id: number;
  patient_name: string;
  numero_prise_en_charge: string;
  date_prise_en_charge: string;
  type_couverture: string;
  taux_remboursement: string;
  montant_total: string;
  status: string;
}

// ═════════════════════════════════════════════════════════════
// 2. CONSTANTES & HELPERS
// ═════════════════════════════════════════════════════════════
const TYPES_COUVERTURE = [
  { value: "maladie_ordinaire", label: "Maladie ordinaire" },
  { value: "accident_travail", label: "Accident de travail" },
  { value: "maladie_professionnelle", label: "Maladie professionnelle" },
  { value: "maternite", label: "Maternité" },
  { value: "invalidite", label: "Invalidité" },
  { value: "longue_maladie", label: "Longue maladie (ALD)" },
  { value: "soins_externes", label: "Soins externes" },
];

const TAUX_REMBOURSEMENT = [
  { value: "100", label: "100 %" },
  { value: "80", label: "80 %" },
  { value: "70", label: "70 %" },
  { value: "60", label: "60 %" },
  { value: "50", label: "50 %" },
  { value: "40", label: "40 %" },
];

const STORAGE_KEY = "cnam_prises_en_charge";

const initialForm: PriseEnChargeFormData = {
  patient_nom: "",
  numero_prise_en_charge: "",
  date_prise_en_charge: new Date().toISOString().split("T")[0],
  type_couverture: "maladie_ordinaire",
  taux_remboursement: "100",
  montant_total: "",
  remarques: "",
};

const loadFromStorage = (): PriseEnChargeRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (records: PriseEnChargeRecord[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "validee":
      return {
        bg: "#ECFDF5",
        color: "#059669",
        border: "#A7F3D0",
        label: "Validée",
      };
    case "en_attente":
      return {
        bg: "#FFF7ED",
        color: "#D97706",
        border: "#FED7AA",
        label: "En attente",
      };
    case "rejetee":
      return {
        bg: "#FEF2F2",
        color: "#DC2626",
        border: "#FECACA",
        label: "Rejetée",
      };
    default:
      return {
        bg: "#F1F5F9",
        color: "#64748B",
        border: "#E2E8F0",
        label: status,
      };
  }
};

// ═════════════════════════════════════════════════════════════
// 3. STYLES GLOBAUX
// ═════════════════════════════════════════════════════════════
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght:700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn { 0%{transform:scale(0.98);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes spin { to{transform:rotate(360deg)} }

  .root { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
  .main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(40px + 2.5rem); animation:fadeUp .4s ease; }
  
  .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
  .page-title { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; background:linear-gradient(135deg, #8B5CF6, #10B981); -webkit-background-clip:text; color:transparent; }
  .page-sub { font-size:13px; color:#64748b; margin-top:6px; }

  .card { background:#fff; border-radius:20px; border:1px solid #EAE8F5; box-shadow:0 1px 3px rgba(0,0,0,0.02); overflow:hidden; animation:fadeUp .4s ease backwards; }
  
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .form-group { display:flex; flex-direction:column; gap:8px; }
  .form-group.full { grid-column:1 / -1; }
  .form-label { display:block; font-size:11px; font-weight:700; color:#8B5CF6; text-transform:uppercase; letter-spacing:.6px; }
  .form-input, .form-select { width:100%; padding:12px 16px; border-radius:14px; border:1.5px solid #E2E8F0; background:#FAFAFE; font-family:'DM Sans',sans-serif; font-size:14px; color:#1E293B; transition:all .25s; outline:none; }
  .form-input:focus, .form-select:focus { border-color:#8B5CF6; box-shadow:0 0 0 4px rgba(139,92,246,0.1); background:#fff; }
  .form-input::placeholder { color:#94A3B8; }
  .form-select { cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:40px; }

  .btn-cancel { padding:12px 28px; background:#fff; border:1.5px solid #E2E8F0; border-radius:14px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; color:#64748B; cursor:pointer; transition:all .2s; }
  .btn-cancel:hover { background:#F8FAFC; color:#334155; }
  .btn-save { padding:12px 32px; background:linear-gradient(135deg, #8B5CF6, #10B981); color:white; border:none; border-radius:14px; font-size:14px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .3s; box-shadow:0 6px 20px rgba(139,92,246,0.35); display:inline-flex; align-items:center; gap:10px; }
  .btn-save:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(139,92,246,0.45); }
  .btn-save:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

  .table-head { display:grid; grid-template-columns:2fr 1.2fr 1fr 1.2fr 0.8fr 100px; gap:12px; padding:14px 24px; background:#FAFAFE; border-bottom:2px solid #F1F5F9; }
  .th { font-size:11px; font-weight:700; color:#8B5CF6; text-transform:uppercase; letter-spacing:.6px; }
  .table-row { display:grid; grid-template-columns:2fr 1.2fr 1fr 1.2fr 0.8fr 100px; gap:12px; padding:16px 24px; border-bottom:1px solid #F4F2F9; align-items:center; transition:all .2s; }
  .table-row:last-child { border-bottom:none; }
  .table-row:hover { background:#F8FAFC; transform:translateX(4px); }
  .td-name { display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; color:#1e1b4b; }
  .avatar { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg, #F3E8FF, #D1FAE5); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#7C3AED; flex-shrink:0; }
  .td-code { font-size:13px; font-weight:600; color:#8B5CF6; font-family:monospace; }
  .td-date { font-size:13px; color:#64748b; font-weight:500; }
  .td-couv { font-size:12px; color:#475569; font-weight:500; background:#F1F5F9; padding:4px 8px; border-radius:6px; text-align:center; }
  .td-taux { font-size:13px; color:#1E293B; font-weight:700; }
  .status-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; border:1px solid; }

  .search-container { background:white; border:1px solid #EAE8F5; border-radius:14px; padding:8px 16px; display:flex; align-items:center; gap:12px; transition:all .2s; box-shadow:0 1px 2px rgba(0,0,0,0.02); }
  .search-container:focus-within { border-color:#8B5CF6; box-shadow:0 0 0 3px rgba(139,92,246,0.1); }
  .search-input { flex:1; border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:14px; color:#1e1b4b; outline:none; }
  .empty { text-align:center; padding:60px 20px; color:#8A87A0; }
  
  .modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.6); backdrop-filter:blur(5px); z-index:3000; display:flex; align-items:center; justify-content:center; padding:20px; }
  .modal-panel { width:95vw; max-width:700px; max-height:90vh; background:#fff; border-radius:24px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); display:flex; flex-direction:column; overflow:hidden; animation:popIn .3s cubic-bezier(0.16,1,0.3,1); }
  .modal-header { padding:20px 28px; border-bottom:1px solid #F1F5F9; display:flex; align-items:center; justify-content:space-between; background:#fff; flex-shrink:0; }
  .modal-title { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; background:linear-gradient(135deg,#8B5CF6,#10B981); -webkit-background-clip:text; color:transparent; }
  .modal-close { width:36px; height:36px; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; background:#F1F5F9; color:#64748b; transition:all .2s; }
  .modal-close:hover { background:#E2E8F0; color:#EF4444; }
  .modal-body { padding:28px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:8px; }
  .modal-footer { padding:16px 28px; background:#FAFAFE; border-top:1px solid #F1F5F9; display:flex; gap:14px; flex-shrink:0; justify-content:flex-end; }
  
  .modal-toast { padding:12px 16px; border-radius:12px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:8px; margin-bottom:8px; }
  .modal-toast-ok { background:#ECFDF5; color:#059669; border:1px solid #A7F3D0; }
  .modal-toast-err { background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; }

  .spin { animation:spin 1s linear infinite; }
`;

// ═════════════════════════════════════════════════════════════
// 4. SOUS-COMPOSANTS
// ═════════════════════════════════════════════════════════════

function PageHeader({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div className="page-header">
      <div>
        <div className="page-title">Prise en charge CNAM</div>
        <div className="page-sub">
          Historique et gestion des prises en charge
        </div>
      </div>
      <button type="button" className="btn-save" onClick={onOpenModal}>
        <Plus size={18} /> Nouvelle PEC
      </button>
    </div>
  );
}

function HistoryList({
  records,
  loading,
  searchQuery,
  setSearchQuery,
  onOpenModal,
}: {
  records: PriseEnChargeRecord[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenModal: () => void;
}) {
  const filteredRecords = records.filter(
    (r) =>
      r.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.numero_prise_en_charge
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="card">
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid #F4F2F9",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div className="search-container" style={{ marginBottom: 0, flex: 1 }}>
          <Search size={18} color="#94a3b8" />
          <input
            className="search-input"
            placeholder="Rechercher par patient ou numéro…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty">
          <Loader2
            size={36}
            className="spin"
            style={{
              color: "#8B5CF6",
              margin: "0 auto 16px",
              display: "block",
            }}
          />
          <p style={{ fontWeight: 600 }}>Chargement…</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="empty">
          <div style={{ color: "#CBD5E1", marginBottom: 12 }}>
            <ShieldCheck size={48} />
          </div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#475569",
              marginBottom: 6,
            }}
          >
            Aucune prise en charge trouvée
          </p>
          <p style={{ fontSize: 13, marginBottom: 20 }}>
            {searchQuery
              ? "Modifiez vos critères de recherche"
              : "Créez votre première prise en charge CNAM"}
          </p>
          {!searchQuery && (
            <button
              type="button"
              className="btn-save"
              style={{ fontSize: 13, padding: "12px 24px" }}
              onClick={onOpenModal}
            >
              <Plus size={16} /> Créer une prise en charge
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-head">
            <span className="th">Patient</span>
            <span className="th">N° PEC</span>
            <span className="th">Date</span>
            <span className="th">Couverture</span>
            <span className="th">Taux</span>
            <span className="th">Statut</span>
          </div>
          {filteredRecords.map((rec) => {
            const statusStyle = getStatusStyle(rec.status);
            const typeLabel =
              TYPES_COUVERTURE.find((t) => t.value === rec.type_couverture)
                ?.label || rec.type_couverture;
            return (
              <div key={rec.id} className="table-row">
                <div className="td-name">
                  <div className="avatar">
                    {rec.patient_name?.charAt(0)?.toUpperCase() || "P"}
                  </div>
                  {rec.patient_name || "Patient"}
                </div>
                <div className="td-code">{rec.numero_prise_en_charge}</div>
                <div className="td-date">
                  {rec.date_prise_en_charge
                    ? new Date(rec.date_prise_en_charge).toLocaleDateString(
                        "fr-FR",
                      )
                    : "—"}
                </div>
                <div className="td-couv">{typeLabel}</div>
                <div className="td-taux">{rec.taux_remboursement}%</div>
                <div>
                  <span
                    className="status-badge"
                    style={{
                      color: statusStyle.color,
                      background: statusStyle.bg,
                      borderColor: statusStyle.border,
                    }}
                  >
                    {statusStyle.label}
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 5. MODALE FORMULAIRE (SANS HOOKS CONDITIONNELS)
// ═════════════════════════════════════════════════════════════
function PriseEnChargeModal({
  isOpen,
  onClose,
  form,
  updateField,
  resetForm,
  submitting,
  handleSubmit,
  errorMsg,
  successMsg,
  clearMessages,
}: {
  isOpen: boolean;
  onClose: () => void;
  form: PriseEnChargeFormData;
  updateField: (f: keyof PriseEnChargeFormData, v: string) => void;
  resetForm: () => void;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  errorMsg: string;
  successMsg: string;
  clearMessages: () => void;
}) {
  if (!isOpen) return null;

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Nouvelle Prise en charge</div>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={submitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {successMsg && (
              <div className="modal-toast modal-toast-ok">
                <CheckCircle size={16} /> {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="modal-toast modal-toast-err">
                <X size={16} /> {errorMsg}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nom du patient *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Saisir le nom complet"
                  value={form.patient_nom}
                  onChange={(e) => {
                    updateField("patient_nom", e.target.value);
                    clearMessages();
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">N° de prise en charge *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="PE-2024-XXXX"
                  value={form.numero_prise_en_charge}
                  onChange={(e) => {
                    updateField(
                      "numero_prise_en_charge",
                      e.target.value.toUpperCase(),
                    );
                    clearMessages();
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.date_prise_en_charge}
                  onChange={(e) =>
                    updateField("date_prise_en_charge", e.target.value)
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Montant total (DT) *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.000"
                  min="0"
                  step="0.001"
                  value={form.montant_total}
                  onChange={(e) => updateField("montant_total", e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Type de couverture</label>
                <select
                  className="form-select"
                  value={form.type_couverture}
                  onChange={(e) =>
                    updateField("type_couverture", e.target.value)
                  }
                >
                  {TYPES_COUVERTURE.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Taux de remboursement</label>
                <select
                  className="form-select"
                  value={form.taux_remboursement}
                  onChange={(e) =>
                    updateField("taux_remboursement", e.target.value)
                  }
                >
                  {TAUX_REMBOURSEMENT.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">Remarques</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Observations, informations complémentaires…"
                  value={form.remarques}
                  onChange={(e) => updateField("remarques", e.target.value)}
                  style={{ resize: "vertical", lineHeight: 1.6 }}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={submitting || !!successMsg}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="spin" /> Enregistrement…
                </>
              ) : (
                <>
                  <Save size={18} /> Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// 6. COMPOSANT PRINCIPAL
// ═════════════════════════════════════════════════════════════
export default function PriseEnChargeCNAM() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<PriseEnChargeFormData>(initialForm);
  const [records, setRecords] = useState<PriseEnChargeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get("prise-en-charge-cnam/");
      setRecords(res.data);
      saveToStorage(res.data);
    } catch {
      setRecords(loadFromStorage());
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoading && token) fetchData();
  }, [token, isLoading, fetchData]);

  // LE HOOK EST MAINTENANT DANS LE PARENT (Résout l'erreur React 19)
  useEffect(() => {
    if (successMsg && isModalOpen) {
      const timer = setTimeout(() => {
        setSuccessMsg("");
        setForm(initialForm);
        setIsModalOpen(false);
        fetchData();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [successMsg, isModalOpen, fetchData]);

  const updateField = (field: keyof PriseEnChargeFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.patient_nom.trim()) {
      setErrorMsg("Le nom du patient est requis.");
      setSubmitting(false);
      return;
    }
    if (!form.numero_prise_en_charge.trim()) {
      setErrorMsg("Le numéro de prise en charge est requis.");
      setSubmitting(false);
      return;
    }

    const newRecord: PriseEnChargeRecord = {
      id: Date.now(),
      patient_name: form.patient_nom.trim(),
      numero_prise_en_charge: form.numero_prise_en_charge.trim(),
      date_prise_en_charge: form.date_prise_en_charge,
      type_couverture: form.type_couverture,
      taux_remboursement: form.taux_remboursement,
      montant_total: form.montant_total,
      status: "en_attente",
    };

    try {
      await api.post("prise-en-charge-cnam/", {
        ...newRecord,
        taux_remboursement: parseInt(form.taux_remboursement),
        montant_total: parseFloat(form.montant_total) || 0,
        remarques: form.remarques.trim(),
      });
      setSuccessMsg("Prise en charge enregistrée avec succès !");
    } catch {
      const updated = [newRecord, ...records];
      setRecords(updated);
      saveToStorage(updated);
      setSuccessMsg("Enregistrée localement (serveur indisponible).");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{PAGE_STYLES}</style>
      <div className="root">
        <Sidebar stats={{}} />
        <Navbar
          title="Prise en charge CNAM"
          subtitle="Gestion des prises en charge"
        />

        <main className="main">
          <PageHeader onOpenModal={() => setIsModalOpen(true)} />

          <HistoryList
            records={records}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenModal={() => setIsModalOpen(true)}
          />
        </main>

        <PriseEnChargeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          form={form}
          updateField={updateField}
          resetForm={resetForm}
          submitting={submitting}
          handleSubmit={handleSubmit}
          errorMsg={errorMsg}
          successMsg={successMsg}
          clearMessages={clearMessages}
        />
      </div>
    </PrivateRoute>
  );
}
