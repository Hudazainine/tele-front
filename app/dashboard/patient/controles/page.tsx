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

interface Controle {
  id: number;
  patient: number;
  patient_name?: string;
  medecin_name?: string;
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
// PAGE PRINCIPALE PATIENT
// ─────────────────────────────────────────────────────────────

export default function PatientControles() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [controles, setControles] = useState<Controle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("tous");
  
  // États pour la notification automatique
  const [previousCount, setPreviousCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }

    const fetchControles = () => {
      api.get("controles/")
        .then((r) => {
          const newData = r.data.results || r.data;
          
          // LOGIQUE DE DÉTECTION AUTOMATIQUE
          // Si on avait déjà des données et que le nombre augmente, c'est qu'il y a un nouveau contrôle
          if (previousCount > 0 && newData.length > previousCount) {
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000); // La notification disparaît après 5s
          }
          
          setControles(newData);
          setPreviousCount(newData.length);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    // Premier chargement
    fetchControles();

    // Rafraîchissement automatique TOUTES LES 5 SECONDES pour une réception quasi-instantanée
    const interval = setInterval(fetchControles, 5000);
    return () => clearInterval(interval);
  }, [token, isLoading, previousCount]);

  if (isLoading) return null;

  const filteredControles = controles
    .filter((c) => {
      if (activeFilter === "paye") return c.statut_paiement === "paye";
      if (activeFilter === "non_paye") return c.statut_paiement === "non_paye";
      return true;
    })
    .sort((a, b) => new Date(b.date_controle).getTime() - new Date(a.date_controle).getTime());

  const getTypeLabel = (val: string) => TYPES_CONTROLE.find((t) => t.value === val)?.label ?? val;
  const getTypeIcon = (val: string) => TYPES_CONTROLE.find((t) => t.value === val)?.icon ?? "📋";

  const totalPaye = controles.filter((c) => c.statut_paiement === "paye").length;
  const totalNonPaye = controles.filter((c) => c.statut_paiement === "non_paye").length;

  // Un contrôle est considéré comme "Nouveau" s'il a été créé il y a moins de 2 heures
  const isNew = (dateStr: string) => {
    const created = new Date(dateStr).getTime();
    const now = new Date().getTime();
    return (now - created) < 2 * 60 * 60 * 1000; 
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "tous", label: "Tous", count: controles.length },
    { key: "paye", label: "Payés", count: totalPaye },
    { key: "non_paye", label: "Non payés", count: totalNonPaye },
  ];

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes bounceIn { 0% { transform: scale(0.9); opacity: 0; } 50% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }

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

        .badge-new {
          background: linear-gradient(135deg, #EF4444, #F97316);
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          animation: bounceIn 0.6s ease;
        }

        .notification-banner {
          position: fixed;
          top: 80px;
          right: 24px;
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          color: white;
          padding: 16px 24px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4);
          z-index: 1000;
          animation: slideDown 0.4s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
      `}</style>

      <div className="main-gradient-bg" style={{ display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
        <Sidebar stats={{ rendezvous: 0, consultations: 0, ordonnances: 0 }} />
        <Navbar title="Mes Contrôles" subtitle="Espace de suivi médical" />

        {/* NOTIFICATION AUTOMATIQUE */}
        {showNotification && (
          <div className="notification-banner" onClick={() => setShowNotification(false)}>
            <span style={{ fontSize: 24 }}>🚨</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Nouveau contrôle reçu !</p>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>Votre médecin vous a envoyé un contrôle.</p>
            </div>
          </div>
        )}

        <main style={{ marginLeft: 240, flex: 1, padding: "2rem", paddingTop: "100px" }}>

          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 className="text-gradient" style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, margin: 0 }}>
                Mes Contrôles Médicaux
              </h1>
              <p style={{ color: "#64748b", fontSize: 14, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, background: "#10B981", borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" }}></span>
                Synchronisation en direct active
              </p>
            </div>
          </div>

          {/* STATS RÉSUMÉ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Total contrôles", value: controles.length, icon: "🩺", color: "#8B5CF6", bg: "rgba(139,92,246,0.07)" },
              { label: "Payés", value: totalPaye, icon: "✅", color: "#059669", bg: "rgba(5,150,105,0.07)" },
              { label: "En attente", value: totalNonPaye, icon: "⏳", color: "#D97706", bg: "rgba(217,119,6,0.07)" },
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
                </div>
              ))}
            </div>
          ) : filteredControles.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem", animation: "fadeInUp 0.6s ease" }}>
              <div style={{ fontSize: 50, marginBottom: 16 }}>🩺</div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#334155", marginBottom: 8 }}>
                Aucun contrôle prévu
              </h3>
              <p style={{ color: "#94a3b8", fontSize: 14, maxWidth: 300, margin: "0 auto" }}>
                Lorsque votre médecin ajoutera un contrôle, il apparaîtra automatiquement ici.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {filteredControles.map((controle, i) => {
                const isPaye = controle.statut_paiement === "paye";
                const isNewControl = isNew(controle.created_at);
                const dateStr = new Date(controle.date_controle).toLocaleDateString("fr-FR", {
                  weekday: "short", day: "numeric", month: "long", year: "numeric",
                });

                return (
                  <div
                    key={controle.id}
                    className="controle-card"
                    style={{ 
                      animation: isNewControl ? "bounceIn 0.6s ease" : `fadeInUp 0.5s ease backwards`, 
                      animationDelay: isNewControl ? "0s" : `${i * 0.06}s`,
                      borderLeft: isNewControl ? "4px solid #8B5CF6" : "none" // Highlight si nouveau
                    }}
                  >
                    {/* En-tête carte */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 46, height: 46, borderRadius: 14,
                          background: isNewControl ? "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(16,185,129,0.2))" : "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(16,185,129,0.1))",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
                        }}>
                          {getTypeIcon(controle.type_controle)}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <p style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b", margin: 0 }}>
                              {getTypeLabel(controle.type_controle)}
                            </p>
                            {isNewControl && <span className="badge-new">Nouveau</span>}
                          </div>
                          {controle.medecin_name && (
                            <p style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: 500 }}>
                              👨‍⚕️ Dr. {controle.medecin_name}
                            </p>
                          )}
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
                        <span style={{ fontWeight: 700, color: "#334155", marginRight: 4 }}>Note :</span> 
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
    </PrivateRoute>
  );
}