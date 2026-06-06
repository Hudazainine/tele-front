"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

/* ─── Types ─────────────────────────────────────────────────── */
interface LigneFacture {
  id: number;
  type_ligne: string;
  type_ligne_display: string;
  montant: number;
  date: string;
  description: string;
}

interface Facture {
  id: number;
  medecin_name: string;
  specialite?: string;
  montant_total: number;
  acompte_montant: number;
  solde_montant: number;
  statut: string;
  statut_display: string;
  pourcentage_paye: number;
  created_at: string;
  date_consultation?: string;
  lignes: LigneFacture[];
}

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt = (n: number | undefined | null) =>
  n != null ? Number(n).toFixed(2) + " DT" : "— DT";

const STATUS = {
  acompte_verse: { label: "Acompte payé", color: "#F59E0B", bg: "#FEF3C7", icon: "⏳" },
  solde_verse:   { label: "Paiement complet", color: "#10B981", bg: "#D1FAE5", icon: "✅" },
  annule:        { label: "Annulé", color: "#EF4444", bg: "#FEE2E2", icon: "✕" },
};

/* ─── Receipt Modal ──────────────────────────────────────────── */
function ReceiptModal({ facture, onClose }: { facture: Facture; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? "";
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Reçu #${facture.id}</title>
      <style>
        body { font-family: 'Georgia', serif; max-width: 600px; margin: 40px auto; color: #0f172a; }
        .header { text-align:center; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 24px; }
        .badge { display:inline-block; background:#D1FAE5; color:#10B981; padding:4px 14px; border-radius:20px; font-size:13px; font-weight:700; }
        table { width:100%; border-collapse:collapse; margin:20px 0; }
        td { padding:10px 0; border-bottom:1px solid #e2e8f0; font-size:14px; }
        td:last-child { text-align:right; font-weight:600; }
        .total-row td { font-size:16px; font-weight:700; border-bottom:2px solid #0f172a; padding-top:14px; }
        .footer { text-align:center; color:#94a3b8; font-size:12px; margin-top:32px; }
      </style></head><body>
      ${content}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
      animation: "fadeIn .2s ease",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560,
        boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
        overflow: "hidden",
        animation: "slideUp .3s ease",
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #10B981, #3B82F6)", padding: "1.8rem 2rem", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", opacity: .8, margin: "0 0 6px" }}>
                REÇU DE PAIEMENT
              </p>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: 0 }}>
                Facture #{facture.id}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 20, padding: "4px 14px", display: "inline-block" }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>✅ SOLDÉE</span>
              </div>
              <p style={{ fontSize: 11, opacity: .8, margin: "8px 0 0" }}>
                {new Date(facture.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Printable body */}
        <div ref={printRef} style={{ padding: "1.8rem 2rem" }}>
          <div style={{ display: "none" /* shown in print */ }}>
            <div className="header">
              <h1 style={{ margin: "0 0 8px", fontSize: 22 }}>Reçu de Paiement</h1>
              <span className="badge">PAIEMENT COMPLET</span>
              <p style={{ color: "#64748b", fontSize: 13 }}>Facture #{facture.id} — {new Date(facture.created_at).toLocaleDateString("fr-FR")}</p>
            </div>
          </div>

          {/* Doctor info */}
          <div style={{ background: "#F8FAFC", borderRadius: 14, padding: "14px 18px", marginBottom: 20, border: "1px solid #E2E8F0" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".5px", margin: "0 0 6px" }}>Praticien</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>{facture.medecin_name}</p>
            {facture.specialite && <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>{facture.specialite}</p>}
          </div>

          {/* Amounts table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "10px 0", fontSize: 13, color: "#334155" }}>Montant total de la consultation</td>
                <td style={{ padding: "10px 0", fontSize: 13, fontWeight: 600, color: "#0f172a", textAlign: "right" }}>{fmt(facture.montant_total)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "10px 0", fontSize: 13, color: "#334155" }}>Acompte versé (50%)</td>
                <td style={{ padding: "10px 0", fontSize: 13, fontWeight: 600, color: "#F59E0B", textAlign: "right" }}>{fmt(facture.acompte_montant)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                <td style={{ padding: "10px 0", fontSize: 13, color: "#334155" }}>Solde versé (50%)</td>
                <td style={{ padding: "10px 0", fontSize: 13, fontWeight: 600, color: "#3B82F6", textAlign: "right" }}>{fmt(facture.solde_montant)}</td>
              </tr>
              <tr>
                <td style={{ padding: "14px 0 0", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Total réglé</td>
                <td style={{ padding: "14px 0 0", fontSize: 16, fontWeight: 800, color: "#10B981", textAlign: "right" }}>{fmt(facture.montant_total)}</td>
              </tr>
            </tbody>
          </table>

          {/* Transactions */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".5px", margin: "0 0 10px" }}>Historique des transactions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {facture.lignes.map(l => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#334155", margin: 0 }}>{l.type_ligne_display}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{new Date(l.date).toLocaleString("fr-FR")}</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{fmt(l.montant)}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", paddingTop: 16, borderTop: "1px dashed #E2E8F0" }}>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>Ce document tient lieu de reçu officiel.</p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>Merci de votre confiance.</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "1rem 2rem 1.8rem", display: "flex", gap: 10 }}>
          <button
            onClick={handlePrint}
            style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#10B981,#3B82F6)", color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: ".3px" }}
          >
            🖨️ Imprimer / Télécharger
          </button>
          <button
            onClick={onClose}
            style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #E2E8F0", cursor: "pointer", background: "#fff", color: "#64748b", fontSize: 14, fontWeight: 600 }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Payment Card ───────────────────────────────────────────── */
function PaiementCard({ facture, onShowReceipt }: { facture: Facture; onShowReceipt: (f: Facture) => void }) {
  const st = STATUS[facture.statut as keyof typeof STATUS] ?? { label: facture.statut_display, color: "#94a3b8", bg: "#F1F5F9", icon: "•" };
  const isComplete = facture.statut === "solde_verse";
  const restant = facture.montant_total - facture.acompte_montant - (isComplete ? facture.solde_montant : 0);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 20,
      border: "1px solid #E2E8F0",
      borderLeft: `4px solid ${st.color}`,
      padding: "1.6rem",
      animation: "fadeUp .5s ease backwards",
      transition: "box-shadow .2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>
            Dr. {facture.medecin_name}
          </p>
          {facture.specialite && (
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 4px" }}>{facture.specialite}</p>
          )}
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
            {new Date(facture.created_at).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })}
          </p>
        </div>
        <div style={{ background: st.bg, color: st.color, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <span>{st.icon}</span> {st.label}
        </div>
      </div>

      {/* Amounts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "12px 14px", border: "1px solid #E2E8F0" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".5px", margin: "0 0 6px" }}>Total consultation</p>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>{fmt(facture.montant_total)}</p>
        </div>
        <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "12px 14px", border: "1px solid #FEF08A" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#B45309", textTransform: "uppercase", letterSpacing: ".5px", margin: "0 0 6px" }}>Déjà payé</p>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: "#F59E0B", margin: 0 }}>
            {fmt(facture.acompte_montant + (isComplete ? facture.solde_montant : 0))}
          </p>
        </div>
        <div style={{
          background: isComplete ? "#F0FDF4" : "#FFF7ED",
          borderRadius: 12, padding: "12px 14px",
          border: `1px solid ${isComplete ? "#BBF7D0" : "#FED7AA"}`
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: isComplete ? "#15803D" : "#C2410C", textTransform: "uppercase", letterSpacing: ".5px", margin: "0 0 6px" }}>
            {isComplete ? "Soldé ✓" : "Reste à payer"}
          </p>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: isComplete ? "#10B981" : "#F97316", margin: 0 }}>
            {isComplete ? "0.00 DT" : fmt(restant)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Progression du paiement</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: st.color }}>{facture.pourcentage_paye}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "#E2E8F0", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            background: isComplete
              ? "linear-gradient(90deg, #10B981, #3B82F6)"
              : "linear-gradient(90deg, #F59E0B, #EF4444)",
            width: `${facture.pourcentage_paye}%`,
            transition: "width .8s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
        {/* Step indicators */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {[
            { pct: "0%", label: "Réservation" },
            { pct: "50%", label: "Acompte" },
            { pct: "100%", label: "Solde" },
          ].map(step => (
            <div key={step.pct} style={{ textAlign: "center" }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", margin: "0 auto 4px",
                background: facture.pourcentage_paye >= parseInt(step.pct)
                  ? (isComplete ? "#10B981" : "#F59E0B")
                  : "#E2E8F0",
                border: `2px solid ${facture.pourcentage_paye >= parseInt(step.pct) ? (isComplete ? "#10B981" : "#F59E0B") : "#CBD5E1"}`,
                transition: "background .4s",
              }} />
              <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{step.label}</p>
              <p style={{ fontSize: 9, color: "#CBD5E1", margin: 0 }}>{step.pct}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline transactions */}
      {facture.lignes.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".5px", margin: "0 0 10px" }}>
            Historique
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
            {/* Vertical line */}
            <div style={{ position: "absolute", left: 14, top: 20, bottom: 20, width: 2, background: "#E2E8F0", zIndex: 0 }} />
            {facture.lignes.map((l, i) => (
              <div key={l.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "8px 0", position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: i === facture.lignes.length - 1 ? "#D1FAE5" : "#FEF3C7",
                  border: `2px solid ${i === facture.lignes.length - 1 ? "#10B981" : "#F59E0B"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12,
                }}>
                  {i === facture.lignes.length - 1 ? "✓" : "€"}
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#334155", margin: 0 }}>{l.type_ligne_display}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 0" }}>
                    {new Date(l.date).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", paddingTop: 4 }}>{fmt(l.montant)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification banners */}
      {!isComplete && facture.statut === "acompte_verse" && (
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18 }}>⏳</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#92400E", margin: "0 0 2px" }}>Acompte enregistré</p>
            <p style={{ fontSize: 11, color: "#A16207", margin: 0 }}>
              Votre acompte de {fmt(facture.acompte_montant)} a bien été reçu. Le solde de {fmt(facture.montant_total - facture.acompte_montant)} sera dû après votre consultation.
            </p>
          </div>
        </div>
      )}

      {isComplete && (
        <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 12, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18 }}>🎉</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#15803D", margin: "0 0 2px" }}>Paiement intégralement réglé</p>
            <p style={{ fontSize: 11, color: "#16A34A", margin: 0 }}>
              La totalité de votre consultation ({fmt(facture.montant_total)}) a été réglée avec succès. Votre reçu est disponible ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      {isComplete && (
        <button
          onClick={() => onShowReceipt(facture)}
          style={{
            width: "100%", padding: "13px", borderRadius: 14, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, #10B981, #3B82F6)",
            color: "#fff", fontSize: 14, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          📄 Voir mon reçu de paiement
        </button>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function PatientPaiementPage() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptFacture, setReceiptFacture] = useState<Facture | null>(null);
  const [filter, setFilter] = useState<"all" | "acompte_verse" | "solde_verse">("all");

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }

    api.get("patient/factures/")
      .then(r => setFactures(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  if (isLoading || loading) return null;

  const filtered = filter === "all" ? factures : factures.filter(f => f.statut === filter);
  const totalPaye = factures.reduce((acc, f) => acc + f.acompte_montant + (f.statut === "solde_verse" ? f.solde_montant : 0), 0);
  const totalRestant = factures.reduce((acc, f) => acc + (f.statut !== "solde_verse" ? (f.montant_total - f.acompte_montant) : 0), 0);
  const nbCompletes = factures.filter(f => f.statut === "solde_verse").length;

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .filter-btn { padding:7px 18px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; border:1px solid #E2E8F0; transition:all .15s; }
        .filter-btn:hover { border-color:#10B981; color:#10B981; }
        .filter-btn.active { background:#10B981; color:#fff; border-color:#10B981; }
      `}</style>

      <div style={{ background: "linear-gradient(150deg,#F0FDF9 0%,#EFF6FF 100%)", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", display: "flex" }}>
        <Sidebar stats={{}} />
        <Navbar title="Mes Paiements" subtitle={`Suivi financier – ${username}`} />

        <main style={{ flex: 1, marginLeft: 240, padding: "2rem", paddingTop: "100px", maxWidth: 900 }}>

          {/* ── Summary KPIs ──────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
            {[
              { icon: "💳", bg: "#ECFDF5", border: "#10B981", label: "Total payé", value: fmt(totalPaye), color: "#10B981" },
              { icon: "⏳", bg: "#FFF7ED", border: "#F97316", label: "Reste à régler", value: fmt(totalRestant), color: "#F97316" },
              { icon: "🏆", bg: "#EFF6FF", border: "#3B82F6", label: "Consultations soldées", value: String(nbCompletes), color: "#3B82F6" },
            ].map((c, i) => (
              <div key={i} style={{
                background: "#fff", borderRadius: 16, padding: "1.2rem 1.4rem",
                borderTop: `3px solid ${c.border}`, border: "1px solid #E2E8F0",
                borderTopColor: c.border,
                animation: `fadeUp .5s ease ${i * .08}s backwards`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10 }}>
                  {c.icon}
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: ".5px" }}>{c.label}</p>
                <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: c.color, margin: 0 }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* ── Filters ───────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, animation: "fadeUp .5s ease .25s backwards" }}>
            {[
              { key: "all", label: `Toutes (${factures.length})` },
              { key: "acompte_verse", label: `⏳ Acompte versé` },
              { key: "solde_verse", label: `✅ Soldées` },
            ].map(f => (
              <button
                key={f.key}
                className={`filter-btn${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key as typeof filter)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── Cards list ────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0" }}>
              <p style={{ fontSize: 40, margin: "0 0 12px" }}>🗂️</p>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: "#0f172a", margin: "0 0 6px" }}>Aucune facture</p>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>Vos paiements apparaîtront ici après votre première réservation.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filtered.map((f, i) => (
                <div key={f.id} style={{ animationDelay: `${i * .08}s` }}>
                  <PaiementCard facture={f} onShowReceipt={setReceiptFacture} />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Receipt Modal */}
      {receiptFacture && (
        <ReceiptModal facture={receiptFacture} onClose={() => setReceiptFacture(null)} />
      )}
    </PrivateRoute>
  );
}