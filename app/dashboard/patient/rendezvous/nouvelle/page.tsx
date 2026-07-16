"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import Sidebar from "../../../../../components/Sidebar";
import Navbar from "../../../../../components/Navbar";
import api from "../../../../../lib/api";
import ResumePaiement from "../../../../../components/ResumePaiement";

// ─── ICONS (SVG Components) ───────────────────────────────────────────────────────
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
  calendar:
    "<rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line>",
  stethoscope:
    "<path d='M11 4v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M18 8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M10 12v5a3 3 0 0 0 6 0v-1'></path><path d='M10 12h-1a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0z'></path>",
  arrowLeft:
    "<line x1='19' y1='12' x2='5' y2='12'></line><polyline points='12 19 5 12 5 12'></polyline>",
  check: "<polyline points='20 6 9 17 4 12'></polyline>",
  info: "<circle cx='12' cy='12' r='10'></circle><line x1='12' y1='16' x2='12' y2='12'></line><line x1='12' y1='8' x2='12.01' y2='8'></line>",
  creditCard:
    "<rect x='1' y='4' width='22' height='16' rx='2' ry='2'></rect><line x1='1' y1='10' x2='23' y2='10'></line>",
};

interface Medecin {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  specialite: string;
  tarif_consultation: number;
  is_active: boolean;
}

export default function NouveauRendezVous() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [selectedMedecin, setSelectedMedecin] = useState("");
  const [motif, setMotif] = useState("Consultation générale");
  const [motifCustom, setMotifCustom] = useState("");
  const [dateRdv, setDateRdv] = useState("");
  const [heureRdv, setHeureRdv] = useState("");

  const [stats, setStats] = useState({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdRdv, setCreatedRdv] = useState<any>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const currentMedecin = medecins.find(
    (m) => m.id === parseInt(selectedMedecin),
  );

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    api
      .get("medecins/")
      .then((r) => {
        const data = r.data.results || r.data;
        setMedecins(data);
      })
      .catch((e) => console.error("Erreur chargement médecins", e));

    const fetchStats = async () => {
      try {
        const [rRdv, rCons, rOrd] = await Promise.all([
          api.get("rendezvous/").catch(() => ({ data: { results: [] } })),
          api.get("consultations/").catch(() => ({ data: { results: [] } })),
          api.get("ordonnances/").catch(() => ({ data: { results: [] } })),
        ]);
        setStats({
          rendezvous: rRdv.data.results?.length || rRdv.data.length || 0,
          consultations: rCons.data.results?.length || rCons.data.length || 0,
          ordonnances: rOrd.data.results?.length || rOrd.data.length || 0,
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, [token, isLoading, router]);

  const getMedecinName = (m: Medecin) => {
    const fullName =
      `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.username;
    const spec = m.specialite ? `— ${m.specialite}` : "";
    return `Dr. ${fullName} ${spec}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!selectedMedecin || !dateRdv || !heureRdv) {
      setError("Veuillez remplir tous les champs obligatoires.");
      setIsSubmitting(false);
      return;
    }

    const motifFinal =
      motif === "Autre" ? motifCustom.trim() || "Autre" : motif;

    try {
      const localDate = new Date(`${dateRdv}T${heureRdv}:00`);
      const pad = (n: number) => String(n).padStart(2, "0");
      const tzOffset = -localDate.getTimezoneOffset();
      const sign = tzOffset >= 0 ? "+" : "-";
      const absOffset = Math.abs(tzOffset);
      const dateHeure = `${dateRdv}T${heureRdv}:00${sign}${pad(
        Math.floor(absOffset / 60),
      )}:${pad(absOffset % 60)}`;

      const payload = {
        medecin: parseInt(selectedMedecin),
        date_heure: dateHeure,
        motif: motifFinal,
        status: "en_attente",
      };

      const response = await api.post("rendezvous/", payload);
      setCreatedRdv(response.data);
    } catch (err: any) {
      if (err.response?.data) {
        const errorData = err.response.data;
        const messages =
          typeof errorData === "object"
            ? Object.entries(errorData)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                .join(" | ")
            : String(errorData);
        setError(messages);
      } else {
        setError(`Erreur: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .light-premium-bg {
          background-color: #EFF6FF ;
          background-image: 
            radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%);
          min-height: 100vh;
        }

        .pro-card-light {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          box-shadow: 0 4px 20px -4px rgba(139, 92, 246, 0.06);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .text-gradient-mg {
          background: linear-gradient(135deg, #7C3AED, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .icon-gradient-bg {
          background: linear-gradient(135deg, #378ADD, #34D399);
          box-shadow: 0 6px 15px -3px rgba(139, 92, 246, 0.35);
        }

        .pro-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 14px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #334155;
          outline: none;
          transition: all 0.3s ease;
          appearance: none;
          box-sizing: border-box;
        }
        .pro-input:focus {
          border-color: #378ADD;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
          background: white;
        }
        
        .btn-gradient {
          background: linear-gradient(135deg, #378ADD, #06C98B);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
          transition: all 0.3s ease;
        }
        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(139, 92, 246, 0.45);
        }
        .btn-gradient:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-ghost {
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          padding: 14px 28px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }
        .btn-ghost:hover {
          background: #f8fafc;
        }
      `}</style>

      <div
        className="light-premium-bg"
        style={{ display: "flex", fontFamily: "'Inter', sans-serif" }}
      >
        <Sidebar stats={stats} />
        <Navbar
          title="Nouveau rendez-vous"
          subtitle="Planifier une consultation"
        />

        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "2rem",
            paddingTop: "calc(70px + 2rem)",
            maxWidth: 880,
          }}
        >
          {/* ── ÉCRAN DE CONFIRMATION / PAIEMENT ── */}
          {createdRdv ? (
            <div
              className="pro-card-light"
              style={{ padding: 32, animation: "fadeInUp 0.6s ease" }}
            >
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: 14,
                  padding: "16px 20px",
                  color: "#059669",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <LucideIcon path={iconPaths.check} size={20} color="#059669" />
                <span>
                  Rendez-vous créé avec succès ! Veuillez régler l'avance pour
                  le confirmer.
                </span>
              </div>

              <ResumePaiement rdv={createdRdv} />

              <div style={{ marginTop: 24, textAlign: "center" }}>
                <button
                  className="btn-ghost"
                  onClick={() => router.push("/dashboard/patient/rendezvous")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  <LucideIcon path={iconPaths.arrowLeft} size={14} />
                  Payer plus tard et voir mes rendez-vous
                </button>
              </div>
            </div>
          ) : (
            /* ── FORMULAIRE DE CRÉATION ── */
            <div
              className="pro-card-light"
              style={{ padding: 32, animation: "fadeInUp 0.6s ease" }}
            >
              <form onSubmit={handleSubmit}>
                {/* SÉLECTION MÉDECIN */}
                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#64748B",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Médecin <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    className="pro-input"
                    value={selectedMedecin}
                    onChange={(e) => setSelectedMedecin(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner un médecin...</option>
                    {medecins.map((m) => (
                      <option key={m.id} value={m.id}>
                        {getMedecinName(m)}
                      </option>
                    ))}
                  </select>

                  {currentMedecin && (
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      {currentMedecin.specialite && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            background: "#f1f5f9",
                            color: "#64748b",
                          }}
                        >
                          <LucideIcon path={iconPaths.stethoscope} size={12} />
                          {currentMedecin.specialite}
                        </span>
                      )}
                      {currentMedecin.tarif_consultation > 0 && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "#059669",
                          }}
                        >
                          <LucideIcon path={iconPaths.creditCard} size={12} />
                          {currentMedecin.tarif_consultation} TND
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* MOTIF */}
                <div style={{ marginBottom: motif === "Autre" ? 12 : 24 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#64748B",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Motif <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    className="pro-input"
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    required
                  >
                    <option value="Consultation générale">
                      Consultation générale
                    </option>
                    <option value="Cardiologie">Cardiologie</option>
                    <option value="Dermatologie">Dermatologie</option>
                    <option value="Pédiatrie">Pédiatrie</option>
                    <option value="Neurologie">Neurologie</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                {motif === "Autre" && (
                  <div style={{ marginBottom: 24 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#64748B",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Précisez le motif{" "}
                      <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="pro-input"
                      placeholder="Décrivez votre motif..."
                      value={motifCustom}
                      onChange={(e) => setMotifCustom(e.target.value)}
                      maxLength={200}
                      required
                    />
                  </div>
                )}

                {/* DATE & HEURE */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#64748B",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Date <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="date"
                      className="pro-input"
                      value={dateRdv}
                      min={todayStr}
                      onChange={(e) => setDateRdv(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#64748B",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Heure <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="time"
                      className="pro-input"
                      value={heureRdv}
                      onChange={(e) => setHeureRdv(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div
                  style={{
                    height: 1,
                    background:
                      "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.2), transparent)",
                    margin: "28px 0",
                  }}
                />

                {/* INFO PAIEMENT */}
                <div
                  style={{
                    background: "rgba(139, 92, 246, 0.05)",
                    border: "1px dashed rgba(139, 92, 246, 0.2)",
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <LucideIcon path={iconPaths.info} size={18} color="#7c3aed" />
                  <p
                    style={{
                      color: "#7c3aed",
                      fontSize: 13,
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Une avance de 50% sera demandée pour valider définitivement
                    ce rendez-vous.
                  </p>
                </div>

                {/* MESSAGE D'ERREUR */}
                {error && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: 14,
                      padding: "12px 18px",
                      color: "#DC2626",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 20,
                      wordBreak: "break-word",
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* ACTIONS */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                    marginTop: 10,
                  }}
                >
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => router.back()}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-gradient"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Enregistrement..."
                      : "Confirmer le rendez-vous"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
