"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

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

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

const TYPES_CONTROLE = [
  { value: "tension_arterielle", label: "Tension artérielle", icon: "🩺" },
  { value: "glycemie", label: "Glycémie", icon: "🩸" },
  { value: "poids_taille", label: "Poids & Taille", icon: "⚖️" },
  { value: "electrocardiogramme", label: "Électrocardiogramme", icon: "💓" },
  { value: "bilan_sanguin", label: "Bilan sanguin", icon: "🔬" },
  { value: "radiologie", label: "Radiologie", icon: "🩻" },
  { value: "echographie", label: "Échographie", icon: "📡" },
  { value: "spirometrie", label: "Spirométrie", icon: "🫁" },
  { value: "fond_oeil", label: "Fond d'œil", icon: "👁️" },
  { value: "autre", label: "Autre", icon: "📋" },
];

// ─────────────────────────────────────────────────────────────
// MODAL CRÉATION
// ─────────────────────────────────────────────────────────────

function ModalCreerControle({
  patients,
  onClose,
  onCreated,
}: {
  patients: Patient[];
  onClose: () => void;
  onCreated: (c: Controle) => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [typeControle, setTypeControle] = useState("");
  const [dateControle, setDateControle] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statutPaiement, setStatutPaiement] = useState<"paye" | "non_paye">(
    "non_paye"
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !typeControle || !dateControle) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const res = await api.post("controles/", {
        patient: parseInt(patientId),
        type_controle: typeControle,
        date_controle: dateControle,
        statut_paiement: statutPaiement,
        notes: notes.trim() || undefined,
      });
      onCreated(res.data);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data
          ? typeof err.response.data === "object"
            ? JSON.stringify(err.response.data)
            : err.response.data
          : "Erreur de connexion au serveur."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPatientLabel = (p: Patient) =>
    `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 10, 40, 0.55)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "white",
          borderRadius: 28,
          padding: 36,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 60px rgba(139, 92, 246, 0.25)",
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* En-tête modal */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: "#1e1b4b",
                margin: 0,
              }}
            >
              Nouveau Contrôle
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
              Créer un contrôle pour un patient
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              cursor: "pointer",
              fontSize: 18,
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Patient */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">
              Patient <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <select
              className="form-select"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            >
              <option value="">Sélectionner un patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {getPatientLabel(p)}
                </option>
              ))}
            </select>
          </div>

          {/* Type de contrôle */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">
              Type de contrôle <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10,
              }}
            >
              {TYPES_CONTROLE.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTypeControle(t.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 12,
                    border:
                      typeControle === t.value
                        ? "2px solid #8B5CF6"
                        : "1px solid rgba(0,0,0,0.07)",
                    background:
                      typeControle === t.value
                        ? "rgba(139, 92, 246, 0.07)"
                        : "rgba(248, 250, 252, 0.8)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: typeControle === t.value ? 700 : 500,
                    color: typeControle === t.value ? "#7c3aed" : "#475569",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <span style={{ lineHeight: 1.3 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">
              Date du contrôle <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={dateControle}
              onChange={(e) => setDateControle(e.target.value)}
              required
            />
          </div>

          {/* Statut Paiement */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Statut du paiement</label>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                {
                  val: "non_paye" as const,
                  label: "Non payé",
                  color: "#D97706",
                  bg: "#FFFBEB",
                  border: "#FDE68A",
                  icon: "⏳",
                },
                {
                  val: "paye" as const,
                  label: "Payé",
                  color: "#059669",
                  bg: "#ECFDF5",
                  border: "#A7F3D0",
                  icon: "✅",
                },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setStatutPaiement(opt.val)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 14,
                    border:
                      statutPaiement === opt.val
                        ? `2px solid ${opt.color}`
                        : `1px solid ${opt.border}`,
                    background:
                      statutPaiement === opt.val ? opt.bg : "transparent",
                    color: opt.color,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow:
                      statutPaiement === opt.val
                        ? `0 4px 12px ${opt.color}22`
                        : "none",
                  }}
                >
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Notes (optionnel)</label>
            <textarea
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, résultats, remarques..."
              rows={3}
              maxLength={500}
              style={{ resize: "vertical", minHeight: 80 }}
            />
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 12,
                padding: "12px 16px",
                color: "#DC2626",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 24px",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "12px 28px",
                borderRadius: 14,
                border: "none",
                background: isSubmitting
                  ? "#c4b5fd"
                  : "linear-gradient(135deg, #8B5CF6, #06C98B)",
                color: "white",
                fontWeight: 700,
                fontSize: 14,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                boxShadow: isSubmitting
                  ? "none"
                  : "0 8px 20px rgba(139, 92, 246, 0.3)",
                transition: "all 0.2s",
              }}
            >
              {isSubmitting ? "Enregistrement..." : "Créer le contrôle"}
            </button>
          </div>
        </form>
      </div>
    </div>
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

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }

    const fetchAll = () => {
      api.get("controles/")
        .then((r) => setControles(r.data.results || r.data))
        .catch(() => {})
        .finally(() => setLoading(false));

      api.get("patients/").then((r) => setPatients(r.data.results || r.data)).catch(() => {});

      Promise.all([
        api.get("rendezvous/").catch(() => ({ data: [] })),
        api.get("consultations/").catch(() => ({ data: [] })),
        api.get("ordonnances/").catch(() => ({ data: [] })),
      ]).then(([rv, co, or]) =>
        setStats({
          rendezvous: rv.data.results?.length ?? rv.data.length ?? 0,
          consultations: co.data.results?.length ?? co.data.length ?? 0,
          ordonnances: or.data.results?.length ?? or.data.length ?? 0,
        })
      );
    };

    fetchAll();
    const interval = setInterval(fetchAll, 15000);
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
        new Date(a.date_controle).getTime()
    );

  const getTypeLabel = (val: string) =>
    TYPES_CONTROLE.find((t) => t.value === val)?.label ?? val;
  const getTypeIcon = (val: string) =>
    TYPES_CONTROLE.find((t) => t.value === val)?.icon ?? "📋";

  const totalPaye = controles.filter((c) => c.statut_paiement === "paye").length;
  const totalNonPaye = controles.filter((c) => c.statut_paiement === "non_paye").length;

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "tous", label: "Tous", count: controles.length },
    { key: "paye", label: "Payés", count: totalPaye },
    { key: "non_paye", label: "Non payés", count: totalNonPaye },
  ];

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        .main-gradient-bg {
          background: linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 100%);
          min-height: 100vh;
        }
        .text-gradient {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .filter-btn {
          padding: 9px 18px;
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
        .filter-btn:hover { background: rgba(139, 92, 246, 0.05); color: #334155; border-color: rgba(139, 92, 246, 0.2); }
        .filter-btn.active { background: linear-gradient(135deg, #8B5CF6, #10B981); color: white; border-color: transparent; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.35); }

        .controle-card {
          position: relative;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0,0,0,0.05);
          border-radius: 22px;
          padding: 22px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .controle-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px -10px rgba(139, 92, 246, 0.18);
          border-color: rgba(139, 92, 246, 0.18);
        }
        .controle-card::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 5px;
          background: linear-gradient(180deg, #8B5CF6, #10B981);
          border-radius: 5px 0 0 5px;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-input, .form-select {
          width: 100%;
          padding: 11px 16px;
          background: rgba(248, 250, 252, 0.9);
          border: 1px solid rgba(0,0,0,0.07);
          border-radius: 12px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #334155;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
          appearance: none;
        }
        .form-input:focus, .form-select:focus {
          border-color: #8B5CF6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.08);
          background: white;
        }

        .stat-mini {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
      `}</style>

      <div className="main-gradient-bg" style={{ display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
        <Sidebar stats={stats} />
        <Navbar title="Contrôles" subtitle="Gestion des contrôles médicaux" />

        <main style={{ marginLeft: 240, flex: 1, padding: "2rem", paddingTop: "100px" }}>

          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 className="text-gradient" style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, margin: 0 }}>
                Contrôles Médicaux
              </h1>
              <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                {filteredControles.length} contrôle{filteredControles.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #06C98B)",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "13px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 8px 20px rgba(139, 92, 246, 0.3)",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(139, 92, 246, 0.45)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(139, 92, 246, 0.3)"; }}
            >
              <span style={{ fontSize: 18 }}>＋</span> Nouveau contrôle
            </button>
          </div>

          {/* STATS RÉSUMÉ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Total contrôles", value: controles.length, icon: "🩺", color: "#8B5CF6", bg: "rgba(139,92,246,0.07)" },
              { label: "Payés", value: totalPaye, icon: "✅", color: "#059669", bg: "rgba(5,150,105,0.07)" },
              { label: "Non payés", value: totalNonPaye, icon: "⏳", color: "#D97706", bg: "rgba(217,119,6,0.07)" },
            ].map((s, i) => (
              <div key={s.label} className="stat-mini" style={{ animation: `fadeInUp 0.5s ease ${i * 0.08}s backwards` }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>{s.label}</p>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: s.color, margin: 0, lineHeight: 1.1 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FILTRES */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {filters.map((f) => (
              <button key={f.key} className={`filter-btn ${activeFilter === f.key ? "active" : ""}`} onClick={() => setActiveFilter(f.key)}>
                {f.label}
                <span style={{
                  background: activeFilter === f.key ? "rgba(255,255,255,0.25)" : "rgba(139,92,246,0.1)",
                  color: activeFilter === f.key ? "white" : "#8B5CF6",
                  borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 800,
                }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* CONTENU */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card" style={{ padding: 22, animation: "pulse 1.8s infinite" }}>
                  <div style={{ height: 14, background: "#e2e8f0", borderRadius: 8, width: "55%", marginBottom: 12 }} />
                  <div style={{ height: 11, background: "#f1f5f9", borderRadius: 6, width: "35%", marginBottom: 18 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ height: 28, background: "#f1f5f9", borderRadius: 8, width: 80 }} />
                    <div style={{ height: 28, background: "#f1f5f9", borderRadius: 8, width: 60 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredControles.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", animation: "fadeInUp 0.6s ease" }}>
              <div style={{ fontSize: 50, marginBottom: 16 }}>🩺</div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#334155", marginBottom: 8 }}>
                Aucun contrôle
              </h3>
              <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 300, margin: "0 auto" }}>
                {activeFilter === "tous"
                  ? "Aucun contrôle enregistré pour le moment."
                  : `Aucun contrôle ${activeFilter === "paye" ? "payé" : "non payé"}.`}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {filteredControles.map((controle, i) => {
                const isPaye = controle.statut_paiement === "paye";
                const dateStr = new Date(controle.date_controle).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                });

                return (
                  <div
                    key={controle.id}
                    className="controle-card"
                    style={{ animation: "fadeInUp 0.5s ease backwards", animationDelay: `${i * 0.06}s` }}
                  >
                    {/* En-tête carte */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: 14,
                          background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(16,185,129,0.1))",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
                        }}>
                          {getTypeIcon(controle.type_controle)}
                        </div>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
                            {getTypeLabel(controle.type_controle)}
                          </p>
                          <p style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                            👤 {controle.patient_name || "Patient"}
                          </p>
                        </div>
                      </div>

                      {/* Badge paiement */}
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, fontWeight: 700,
                        color: isPaye ? "#059669" : "#D97706",
                        background: isPaye ? "#ECFDF5" : "#FFFBEB",
                        border: `1px solid ${isPaye ? "#A7F3D0" : "#FDE68A"}`,
                        padding: "5px 12px", borderRadius: 10,
                        flexShrink: 0,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isPaye ? "#059669" : "#D97706" }} />
                        {isPaye ? "Payé" : "Non payé"}
                      </span>
                    </div>

                    {/* Date */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px",
                      background: "rgba(139, 92, 246, 0.04)",
                      borderRadius: 10,
                      marginBottom: controle.notes ? 12 : 0,
                    }}>
                      <span style={{ fontSize: 13 }}>📅</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{dateStr}</span>
                    </div>

                    {/* Notes */}
                    {controle.notes && (
                      <div style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        background: "rgba(241, 245, 249, 0.8)",
                        borderRadius: 10,
                        fontSize: 13,
                        color: "#64748b",
                        lineHeight: 1.5,
                        borderLeft: "3px solid rgba(139, 92, 246, 0.3)",
                      }}>
                        {controle.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MODAL */}
      {showModal && (
        <ModalCreerControle
          patients={patients}
          onClose={() => setShowModal(false)}
          onCreated={(newC) => setControles((prev) => [newC, ...prev])}
        />
      )}
    </PrivateRoute>
  );
}