"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface ServiceLigne {
  id: string;
  designation: string;
  code: string;
  montant: string;
}

interface PriseEnChargeFormData {
  patient_nom: string;
  numero_responsable: string;
  numero_prise_en_charge: string;
  date_prise_en_charge: string;
  type_couverture: string;
  taux_remboursement: string;
  services: ServiceLigne[];
  remarques: string;
}

interface PriseEnChargeRecord {
  id: number;
  patient_name: string;
  numero_responsable: string;
  numero_prise_en_charge: string;
  date_prise_en_charge: string;
  type_couverture: string;
  taux_remboursement: string;
  status: string;
  services: { designation: string; code: string; montant: number }[];
  remarques: string;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

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

const emptyService = (): ServiceLigne => ({
  id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
  designation: "",
  code: "",
  montant: "",
});

const initialForm: PriseEnChargeFormData = {
  patient_nom: "",
  numero_responsable: "",
  numero_prise_en_charge: "",
  date_prise_en_charge: new Date().toISOString().split("T")[0],
  type_couverture: "maladie_ordinaire",
  taux_remboursement: "100",
  services: [emptyService()],
  remarques: "",
};

// ─────────────────────────────────────────────────────────────
// LOCAL STORAGE HELPERS
// ─────────────────────────────────────────────────────────────

function loadFromStorage(): PriseEnChargeRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(records: PriseEnChargeRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function PriseEnChargeCNAM() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<PriseEnChargeFormData>(initialForm);
  const [records, setRecords] = useState<PriseEnChargeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Fetch data (API with localStorage fallback) ──
  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get("prise-en-charge-cnam/");
      setRecords(res.data);
      saveToStorage(res.data);
    } catch {
      // API unavailable (404, etc.) → use localStorage
      const local = loadFromStorage();
      setRecords(local);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoading && token) fetchData();
  }, [token, isLoading, fetchData]);

  // ── Form helpers ──
  const updateField = (field: keyof PriseEnChargeFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  const updateService = (
    serviceId: string,
    field: keyof ServiceLigne,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.map((s) =>
        s.id === serviceId ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const addService = () => {
    setForm((prev) => ({
      ...prev,
      services: [...prev.services, emptyService()],
    }));
  };

  const removeService = (serviceId: string) => {
    if (form.services.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== serviceId),
    }));
  };

  const totalMontant = form.services.reduce(
    (sum, s) => sum + (parseFloat(s.montant) || 0),
    0,
  );

  const resetForm = () => {
    setForm(initialForm);
    setErrorMsg("");
    setSuccessMsg("");
  };

  // ── Submit (API with localStorage fallback) ──
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
    if (!form.date_prise_en_charge) {
      setErrorMsg("La date de prise en charge est requise.");
      setSubmitting(false);
      return;
    }

    const newRecord: PriseEnChargeRecord = {
      id: Date.now(),
      patient_name: form.patient_nom.trim(),
      numero_responsable: form.numero_responsable.trim(),
      numero_prise_en_charge: form.numero_prise_en_charge.trim(),
      date_prise_en_charge: form.date_prise_en_charge,
      type_couverture: form.type_couverture,
      taux_remboursement: form.taux_remboursement,
      status: "en_attente",
      services: form.services
        .filter((s) => s.designation.trim())
        .map((s) => ({
          designation: s.designation.trim(),
          code: s.code.trim(),
          montant: parseFloat(s.montant) || 0,
        })),
      remarques: form.remarques.trim(),
    };

    try {
      const payload = {
        patient_nom: form.patient_nom.trim(),
        numero_responsable: form.numero_responsable.trim(),
        numero_prise_en_charge: form.numero_prise_en_charge.trim(),
        date_prise_en_charge: form.date_prise_en_charge,
        type_couverture: form.type_couverture,
        taux_remboursement: parseInt(form.taux_remboursement),
        services: newRecord.services,
        remarques: form.remarques.trim(),
      };

      const res = await api.post("prise-en-charge-cnam/", payload);
      // API success → refresh from server
      setSuccessMsg("Prise en charge CNAM enregistrée avec succès !");
      resetForm();
      fetchData();
      setActiveTab("list");
    } catch {
      // API unavailable → save to localStorage
      const updated = [newRecord, ...records];
      setRecords(updated);
      saveToStorage(updated);
      setSuccessMsg(
        "Prise en charge enregistrée localement (serveur indisponible).",
      );
      resetForm();
      setActiveTab("list");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered records ──
  const filteredRecords = records.filter(
    (r) =>
      r.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.numero_prise_en_charge
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  // ── Status badge color ──
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "validee":
        return { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" };
      case "en_attente":
        return { bg: "#FFF7ED", color: "#D97706", border: "#FED7AA" };
      case "rejetee":
        return { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" };
      default:
        return { bg: "#F1F5F9", color: "#64748B", border: "#E2E8F0" };
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .cnam-page-bg {
          background: linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 50%, #EFF6FF 100%);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        .cnam-card {
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.92);
          border-radius: 24px;
          box-shadow: 0 4px 24px rgba(139, 92, 246, 0.06);
          animation: fadeInUp 0.5s ease backwards;
        }

        .cnam-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          background: rgba(255,255,255,0.9);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #1E293B;
          transition: all 0.25s ease;
          outline: none;
        }
        .cnam-input:focus {
          border-color: #8B5CF6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
          background: #fff;
        }
        .cnam-input::placeholder {
          color: #94A3B8;
        }

        .cnam-select {
          width: 100%;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          background: rgba(255,255,255,0.9);
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #1E293B;
          transition: all 0.25s ease;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
        }
        .cnam-select:focus {
          border-color: #8B5CF6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
          background-color: #fff;
        }

        .cnam-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .cnam-btn-primary {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 14px 32px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.35);
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .cnam-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(139, 92, 246, 0.45);
        }
        .cnam-btn-primary:active {
          transform: translateY(0);
        }
        .cnam-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .cnam-btn-secondary {
          background: rgba(255,255,255,0.8);
          color: #64748B;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 14px 28px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .cnam-btn-secondary:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #334155;
        }

        .tab-btn {
          padding: 12px 24px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
          border: 1.5px solid transparent;
          background: transparent;
          color: #64748B;
        }
        .tab-btn:hover {
          background: rgba(139, 92, 246, 0.05);
          color: #334155;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
        }

        .service-row {
          animation: fadeIn 0.3s ease;
        }

        .remove-svc-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid #FEE2E2;
          background: #FEF2F2;
          color: #DC2626;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .remove-svc-btn:hover {
          background: #FEE2E2;
          border-color: #DC2626;
        }

        .add-svc-btn {
          background: rgba(139, 92, 246, 0.06);
          border: 1.5px dashed rgba(139, 92, 246, 0.3);
          border-radius: 14px;
          padding: 12px 20px;
          color: #8B5CF6;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .add-svc-btn:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.5);
        }

        .cnam-gradient-text {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .record-row {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .record-row:hover {
          background: rgba(139, 92, 246, 0.04);
          transform: translateX(4px);
        }

        .success-toast {
          animation: slideDown 0.4s ease;
          background: linear-gradient(135deg, #059669, #10B981);
          color: white;
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
          margin-bottom: 20px;
        }

        .error-toast {
          animation: slideDown 0.4s ease;
          background: linear-gradient(135deg, #DC2626, #EF4444);
          color: white;
          padding: 14px 24px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
          margin-bottom: 20px;
        }

        .cnam-pattern {
          position: absolute;
          top: 0;
          right: 0;
          width: 300px;
          height: 300px;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B5CF6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }
      `}</style>

      <div className="cnam-page-bg" style={{ display: "flex" }}>
        <Sidebar
          stats={{
            rendezvous: 0,
            consultations: 0,
            ordonnances: 0,
          }}
        />
        <Navbar
          title="Prise en charge CNAM"
          subtitle="Gestion des prises en charge de la Caisse Nationale d'Assurance Maladie"
        />

        <main
          style={{
            flex: 1,
            marginLeft: 240,
            padding: "2rem 2.5rem",
            paddingTop: "100px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="cnam-pattern" />

          {/* ── Page Header ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 28,
              animation: "fadeInUp 0.4s ease backwards",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(139, 92, 246, 0.35)",
                flexShrink: 0,
              }}
            >
              <svg
                width={28}
                height={28}
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#1E1B4B",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Prise en charge <span className="cnam-gradient-text">CNAM</span>
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748B",
                  margin: 0,
                  marginTop: 2,
                }}
              >
                Enregistrez et consultez les prises en charge de vos patients
              </p>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 28,
              animation: "fadeInUp 0.5s ease backwards",
            }}
          >
            <button
              className={`tab-btn ${activeTab === "form" ? "active" : ""}`}
              onClick={() => setActiveTab("form")}
            >
              <span style={{ marginRight: 8 }}>📝</span>
              Nouvelle prise en charge
            </button>
            <button
              className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
              onClick={() => setActiveTab("list")}
            >
              <span style={{ marginRight: 8 }}>📋</span>
              Historique
              {records.length > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    background:
                      activeTab === "list"
                        ? "rgba(255,255,255,0.25)"
                        : "linear-gradient(135deg, #8B5CF6, #10B981)",
                    color: "white",
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                >
                  {records.length}
                </span>
              )}
            </button>
          </div>

          {/* ── Success / Error Messages ── */}
          {successMsg && (
            <div className="success-toast">
              <span style={{ fontSize: 20 }}>✓</span>
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="error-toast">
              <span style={{ fontSize: 20 }}>✕</span>
              {errorMsg}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB: FORMULAIRE
              ══════════════════════════════════════════════════════ */}
          {activeTab === "form" && (
            <form onSubmit={handleSubmit}>
              {/* ── Section: Informations patient ── */}
              <div
                className="cnam-card"
                style={{
                  padding: 28,
                  marginBottom: 20,
                  animationDelay: "0.1s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      color: "white",
                      boxShadow: "0 4px 10px rgba(139, 92, 246, 0.3)",
                    }}
                  >
                    👤
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#1E1B4B",
                      margin: 0,
                    }}
                  >
                    Informations du patient
                  </h2>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                  }}
                >
                  {/* Nom du patient */}
                  <div>
                    <label className="cnam-label">Nom du patient *</label>
                    <input
                      type="text"
                      className="cnam-input"
                      placeholder="Saisir le nom complet du patient"
                      value={form.patient_nom}
                      onChange={(e) =>
                        updateField("patient_nom", e.target.value)
                      }
                      required
                    />
                  </div>

                  {/* N° Responsable */}
                  <div>
                    <label className="cnam-label">N° Responsable</label>
                    <input
                      type="text"
                      className="cnam-input"
                      placeholder="Numéro du responsable CNAM"
                      value={form.numero_responsable}
                      onChange={(e) =>
                        updateField("numero_responsable", e.target.value)
                      }
                    />
                  </div>

                  {/* N° de prise en charge */}
                  <div>
                    <label className="cnam-label">
                      N° de prise en charge *
                    </label>
                    <input
                      type="text"
                      className="cnam-input"
                      placeholder="PE-2024-XXXX"
                      value={form.numero_prise_en_charge}
                      onChange={(e) =>
                        updateField(
                          "numero_prise_en_charge",
                          e.target.value.toUpperCase(),
                        )
                      }
                      required
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="cnam-label">
                      Date de prise en charge *
                    </label>
                    <input
                      type="date"
                      className="cnam-input"
                      value={form.date_prise_en_charge}
                      onChange={(e) =>
                        updateField("date_prise_en_charge", e.target.value)
                      }
                      required
                    />
                  </div>

                  {/* Type de couverture */}
                  <div>
                    <label className="cnam-label">Type de couverture</label>
                    <select
                      className="cnam-select"
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

                  {/* Taux de remboursement */}
                  <div>
                    <label className="cnam-label">Taux de remboursement</label>
                    <select
                      className="cnam-select"
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
                </div>
              </div>

              {/* ── Section: Services ── */}
              <div
                className="cnam-card"
                style={{
                  padding: 28,
                  marginBottom: 20,
                  animationDelay: "0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 11,
                        background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        color: "white",
                        boxShadow: "0 4px 10px rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      💊
                    </div>
                    <h2
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 17,
                        fontWeight: 700,
                        color: "#1E1B4B",
                        margin: 0,
                      }}
                    >
                      Services / Actes médicaux
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="add-svc-btn"
                    onClick={addService}
                  >
                    <svg
                      width={16}
                      height={16}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Ajouter un service
                  </button>
                </div>

                {/* Services header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 42px",
                    gap: 12,
                    marginBottom: 10,
                    padding: "0 4px",
                  }}
                >
                  <span className="cnam-label" style={{ marginBottom: 0 }}>
                    Désignation
                  </span>
                  <span className="cnam-label" style={{ marginBottom: 0 }}>
                    Code
                  </span>
                  <span className="cnam-label" style={{ marginBottom: 0 }}>
                    Montant (DT)
                  </span>
                  <span />
                </div>

                {/* Service rows */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {form.services.map((svc) => (
                    <div
                      key={svc.id}
                      className="service-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 42px",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        className="cnam-input"
                        placeholder="Consultation, radiologie…"
                        value={svc.designation}
                        onChange={(e) =>
                          updateService(svc.id, "designation", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="cnam-input"
                        placeholder="C-001"
                        value={svc.code}
                        onChange={(e) =>
                          updateService(svc.id, "code", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        className="cnam-input"
                        placeholder="0.000"
                        min="0"
                        step="0.001"
                        value={svc.montant}
                        onChange={(e) =>
                          updateService(svc.id, "montant", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="remove-svc-btn"
                        onClick={() => removeService(svc.id)}
                        disabled={form.services.length <= 1}
                        style={{
                          opacity: form.services.length <= 1 ? 0.3 : 1,
                          cursor:
                            form.services.length <= 1
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <svg
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: "1px solid #F1F5F9",
                  }}
                >
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(16, 185, 129, 0.08))",
                      borderRadius: 14,
                      padding: "12px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#64748B",
                      }}
                    >
                      Total estimé :
                    </span>
                    <span
                      className="cnam-gradient-text"
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 22,
                        fontWeight: 800,
                      }}
                    >
                      {totalMontant.toFixed(3)} DT
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Section: Remarques ── */}
              <div
                className="cnam-card"
                style={{
                  padding: 28,
                  marginBottom: 28,
                  animationDelay: "0.3s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 11,
                      background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      color: "white",
                      boxShadow: "0 4px 10px rgba(139, 92, 246, 0.3)",
                    }}
                  >
                    💬
                  </div>
                  <h2
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#1E1B4B",
                      margin: 0,
                    }}
                  >
                    Remarques
                  </h2>
                </div>

                <textarea
                  className="cnam-input"
                  rows={4}
                  placeholder="Observations, informations complémentaires…"
                  value={form.remarques}
                  onChange={(e) => updateField("remarques", e.target.value)}
                  style={{
                    resize: "vertical",
                    minHeight: 100,
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* ── Actions ── */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 14,
                  animation: "fadeInUp 0.6s ease backwards",
                  animationDelay: "0.35s",
                }}
              >
                <button
                  type="button"
                  className="cnam-btn-secondary"
                  onClick={resetForm}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="cnam-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span
                        style={{
                          width: 18,
                          height: 18,
                          border: "2.5px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "spin 0.7s linear infinite",
                        }}
                      />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════
              TAB: HISTORIQUE
              ══════════════════════════════════════════════════════ */}
          {activeTab === "list" && (
            <div
              className="cnam-card"
              style={{
                padding: 28,
                animationDelay: "0.1s",
              }}
            >
              {/* Search bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  marginBottom: 24,
                }}
              >
                <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="cnam-input"
                    placeholder="Rechercher par patient ou numéro…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: 42 }}
                  />
                </div>
                <button
                  type="button"
                  className="cnam-btn-primary"
                  style={{ padding: "12px 20px", fontSize: 13 }}
                  onClick={() => setActiveTab("form")}
                >
                  <svg
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nouvelle PEC
                </button>
              </div>

              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "4rem 0",
                    color: "#94A3B8",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      border: "3px solid #E2E8F0",
                      borderTopColor: "#8B5CF6",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      margin: "0 auto 16px",
                    }}
                  />
                  <p style={{ fontWeight: 600 }}>Chargement…</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "4rem 0",
                    color: "#94A3B8",
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
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
                      className="cnam-btn-primary"
                      style={{ fontSize: 13, padding: "12px 24px" }}
                      onClick={() => setActiveTab("form")}
                    >
                      Créer une prise en charge
                    </button>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {/* Table header */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1.2fr 1fr 1.2fr 0.8fr 100px",
                      gap: 12,
                      padding: "10px 16px",
                      borderBottom: "2px solid #F1F5F9",
                    }}
                  >
                    {[
                      "Patient",
                      "N° PEC",
                      "Date",
                      "Couverture",
                      "Taux",
                      "Statut",
                    ].map((h) => (
                      <span
                        key={h}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.8px",
                        }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  {filteredRecords.map((rec, i) => {
                    const statusStyle = getStatusStyle(rec.status);
                    const typeLabel =
                      TYPES_COUVERTURE.find(
                        (t) => t.value === rec.type_couverture,
                      )?.label || rec.type_couverture;

                    return (
                      <div
                        key={rec.id}
                        className="record-row"
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "2fr 1.2fr 1fr 1.2fr 0.8fr 100px",
                          gap: 12,
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: "1px solid #F1F5F9",
                          alignItems: "center",
                          animation: `fadeInUp 0.4s ease backwards`,
                          animationDelay: `${i * 0.05}s`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background:
                                "linear-gradient(135deg, #8B5CF6, #10B981)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: 13,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {rec.patient_name?.charAt(0) || "P"}
                          </div>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#1E293B",
                            }}
                          >
                            {rec.patient_name || "Patient"}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#8B5CF6",
                            fontFamily: "monospace",
                          }}
                        >
                          {rec.numero_prise_en_charge}
                        </span>
                        <span style={{ fontSize: 13, color: "#64748B" }}>
                          {rec.date_prise_en_charge
                            ? new Date(
                                rec.date_prise_en_charge,
                              ).toLocaleDateString("fr-FR")
                            : "—"}
                        </span>
                        <span style={{ fontSize: 13, color: "#475569" }}>
                          {typeLabel}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1E293B",
                          }}
                        >
                          {rec.taux_remboursement}%
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "4px 12px",
                            borderRadius: 20,
                            textAlign: "center",
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            textTransform: "capitalize",
                          }}
                        >
                          {rec.status === "en_attente"
                            ? "En attente"
                            : rec.status === "validee"
                              ? "Validée"
                              : rec.status === "rejetee"
                                ? "Rejetée"
                                : rec.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </PrivateRoute>
  );
}
