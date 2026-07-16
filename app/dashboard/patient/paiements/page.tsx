"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

// ─── Icons ────────────────────────────────────────────────────
const Ico = ({
  d,
  size = 16,
  color = "currentColor",
}: {
  d: string;
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
    dangerouslySetInnerHTML={{ __html: d }}
    style={{ flexShrink: 0 }}
  />
);

const IC = {
  fileText:
    "<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/><line x1='10' y1='9' x2='8' y2='9'/>",
  checkCircle:
    "<path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'/><polyline points='22 4 12 14.01 9 11.01'/>",
  clock:
    "<circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/>",
  creditCard:
    "<rect x='1' y='4' width='22' height='16' rx='2' ry='2'/><line x1='1' y1='10' x2='23' y2='10'/>",
  alertCircle:
    "<circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/>",
  printer:
    "<polyline points='6 9 6 2 18 2 18 9'/><path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'/><rect x='6' y='14' width='12' height='8'/>",
  x: "<line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/>",
  chevron: "<polyline points='9 18 15 12 9 6'/>",
  stethoscope:
    "<path d='M11 4v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'/><path d='M18 8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'/><path d='M10 12v5a3 3 0 0 0 6 0v-1'/>",
  calendar:
    "<rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/>",
  trophy:
    "<path d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6'/><path d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18'/><path d='M4 22h16'/><path d='M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22'/><path d='M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22'/><path d='M18 2H6v7a6 6 0 0 0 12 0V2z'/>",
};

// ─── Theme ────────────────────────────────────────────────────
const C = {
  violet: "#7C3AED",
  emerald: "#059669",
  emeraldLight: "#10B981",
  ink: "#0F172A",
  slate: "#64748B",
  muted: "#94A3B8",
  grad: "linear-gradient(135deg, #7C3AED 0%, #10B981 100%)",
};

// ─── Types ────────────────────────────────────────────────────
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

// ─── Status map ───────────────────────────────────────────────
const STATUS: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  acompte_verse: {
    label: "Acompte payé",
    color: "#F59E0B",
    bg: "#FEF3C7",
    icon: "clock",
  },
  solde_verse: {
    label: "Paiement complet",
    color: "#10B981",
    bg: "#D1FAE5",
    icon: "checkCircle",
  },
  annule: {
    label: "Annulé",
    color: "#EF4444",
    bg: "#FEE2E2",
    icon: "alertCircle",
  },
};
const DEFAULT_STATUS = {
  label: "—",
  color: "#94A3B8",
  bg: "#F1F5F9",
  icon: "fileText",
};

const fmt = (n: number | undefined | null) =>
  n != null
    ? `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`
    : "— DT";

// ─── Atoms ────────────────────────────────────────────────────
const IBox = ({ k, sz = 44 }: { k: string; sz?: number }) => (
  <div
    style={{
      width: sz,
      height: sz,
      borderRadius: Math.round(sz * 0.32),
      flexShrink: 0,
      background: C.grad,
      boxShadow: `0 6px 15px -3px ${C.violet}40`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Ico
      d={IC[k as keyof typeof IC]}
      size={Math.round(sz * 0.44)}
      color="#fff"
    />
  </div>
);

const Num = ({
  children,
  size = 32,
}: {
  children: React.ReactNode;
  size?: number;
}) => (
  <span
    style={{
      fontFamily: "'Syne', sans-serif",
      fontWeight: 800,
      fontSize: size,
      lineHeight: 1,
      background: C.grad,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}
  >
    {children}
  </span>
);

const Empty = () => (
  <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
    <div
      style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}
    >
      <Ico d={IC.fileText} size={42} color="#CBD5E1" />
    </div>
    <p
      style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: 16,
        color: C.ink,
        margin: "0 0 6px",
      }}
    >
      Aucune facture
    </p>
    <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
      Vos paiements apparaîtront ici après votre première réservation.
    </p>
  </div>
);

// ─── Receipt Modal ────────────────────────────────────────────
function ReceiptModal({
  facture,
  onClose,
}: {
  facture: Facture;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const st = STATUS[facture.statut] ?? {
    ...DEFAULT_STATUS,
    label: facture.statut_display,
  };
  const isComplete = facture.statut === "solde_verse";

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? "";
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Reçu #${facture.id}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; max-width: 600px; margin: 40px auto; color: #0f172a; }
            .header { text-align: center; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 24px; }
            .header h1 { font-family: 'Syne', sans-serif; font-size: 22px; margin: 0 0 10px; }
            .badge { display: inline-block; background: #D1FAE5; color: #10B981; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            td { padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            td:last-child { text-align: right; font-weight: 600; }
            .total-row td { font-size: 16px; font-weight: 800; border-bottom: 2px solid #0f172a; padding-top: 14px; }
            .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 24,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 60px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: C.grad,
            padding: "1.8rem 2rem",
            color: "#fff",
            borderRadius: "24px 24px 0 0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  opacity: 0.85,
                  margin: "0 0 6px",
                }}
              >
                Reçu de paiement
              </p>
              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 26,
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                Facture #{facture.id}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: 10,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Ico d={IC.x} size={16} color="#fff" />
            </button>
          </div>
          <div
            style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.18)",
              borderRadius: 20,
              padding: "5px 14px",
            }}
          >
            <Ico d={IC[st.icon as keyof typeof IC]} size={12} color="#fff" />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{st.label}</span>
          </div>
        </div>

        {/* Printable body */}
        <div ref={printRef} style={{ padding: "1.8rem 2rem" }}>
          <div className="header" style={{ display: "none" }}>
            <h1>Reçu de paiement — Facture #{facture.id}</h1>
            <span className="badge">{st.label}</span>
          </div>

          {/* Doctor info */}
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: 14,
              padding: "14px 18px",
              marginBottom: 20,
              border: "1px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <IBox k="stethoscope" sz={42} />
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: ".5px",
                  margin: "0 0 4px",
                }}
              >
                Praticien
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                {facture.medecin_name}
              </p>
              {facture.specialite && (
                <p
                  style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}
                >
                  {facture.specialite}
                </p>
              )}
            </div>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "#94a3b8",
              margin: "0 0 16px",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Ico d={IC.calendar} size={12} color="#94a3b8" />
            {new Date(facture.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>

          {/* Amounts table */}
          <table>
            <tbody>
              <tr>
                <td style={{ color: "#334155" }}>
                  Montant total de la consultation
                </td>
                <td style={{ color: "#0f172a" }}>
                  {fmt(facture.montant_total)}
                </td>
              </tr>
              <tr>
                <td style={{ color: "#334155" }}>Acompte versé (50%)</td>
                <td style={{ color: "#F59E0B" }}>
                  {fmt(facture.acompte_montant)}
                </td>
              </tr>
              <tr>
                <td style={{ color: "#334155" }}>Solde versé (50%)</td>
                <td style={{ color: "#3B82F6" }}>
                  {fmt(facture.solde_montant)}
                </td>
              </tr>
              <tr className="total-row">
                <td>{isComplete ? "Total réglé" : "Reste à payer"}</td>
                <td style={{ color: isComplete ? "#10B981" : "#F59E0B" }}>
                  {isComplete
                    ? fmt(facture.montant_total)
                    : fmt(facture.montant_total - facture.acompte_montant)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Transactions */}
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: ".5px",
              margin: "0 0 10px",
            }}
          >
            Historique des transactions
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {facture.lignes.map((l) => (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#F8FAFC",
                  borderRadius: 10,
                  border: "1px solid #E2E8F0",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#334155",
                      margin: 0,
                    }}
                  >
                    {l.type_ligne_display}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      margin: "1px 0 0",
                    }}
                  >
                    {new Date(l.date).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}
                >
                  {fmt(l.montant)}
                </span>
              </div>
            ))}
          </div>

          <div className="footer" style={{ display: "none" }}>
            <p>Ce document tient lieu de reçu officiel.</p>
            <p>Merci de votre confiance.</p>
          </div>

          <div
            style={{
              textAlign: "center",
              paddingTop: 16,
              borderTop: "1px dashed #E2E8F0",
            }}
          >
            <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
              Ce document tient lieu de reçu officiel. Merci de votre confiance.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "0 2rem 1.8rem", display: "flex", gap: 10 }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              padding: "12px 20px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: C.grad,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontFamily: "inherit",
            }}
          >
            <Ico d={IC.printer} size={16} color="#fff" />
            Imprimer / Télécharger
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              border: "1px solid #E2E8F0",
              cursor: "pointer",
              background: "#fff",
              color: "#64748b",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Card ─────────────────────────────────────────────
function PaiementCard({
  facture,
  onShowReceipt,
  delay,
}: {
  facture: Facture;
  onShowReceipt: (f: Facture) => void;
  delay: number;
}) {
  const st = STATUS[facture.statut] ?? {
    ...DEFAULT_STATUS,
    label: facture.statut_display,
  };
  const isComplete = facture.statut === "solde_verse";
  const isCancelled = facture.statut === "annule";
  const pct = isCancelled
    ? 0
    : Math.min(100, Math.max(0, facture.pourcentage_paye ?? 0));
  const totalPaid =
    facture.acompte_montant + (isComplete ? facture.solde_montant : 0);
  const restant = Math.max(0, facture.montant_total - totalPaid);

  const fillGrad = isCancelled
    ? "#E2E8F0"
    : isComplete
      ? "linear-gradient(90deg, #10B981, #34D399)"
      : "linear-gradient(90deg, #F59E0B, #FBBF24)";

  return (
    <div
      className="pro-card-light invoice-card"
      style={{
        padding: "1.5rem 1.7rem",
        position: "relative",
        overflow: "hidden",
        animation: "fadeInUp 0.5s ease backwards",
        animationDelay: `${delay}s`,
      }}
    >
      {/* Liseré coloré + halo décoratif */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          background: st.color,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -36,
          right: -36,
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: `${st.color}0d`,
          pointerEvents: "none",
        }}
      />

      {/* Top row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <IBox k="stethoscope" sz={46} />
          <div>
            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 3px",
              }}
            >
              Dr. {facture.medecin_name}
            </p>
            <p
              style={{
                fontSize: 11.5,
                color: "#94a3b8",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {facture.specialite && <span>{facture.specialite}</span>}
              {facture.specialite && <span style={{ opacity: 0.5 }}>·</span>}
              <Ico d={IC.calendar} size={11} color="#94a3b8" />
              {new Date(facture.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <Num size={24}>{fmt(facture.montant_total)}</Num>
          <div style={{ marginTop: 6 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: st.bg,
                color: st.color,
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              <Ico
                d={IC[st.icon as keyof typeof IC]}
                size={12}
                color={st.color}
              />
              {st.label}
            </span>
          </div>
        </div>
      </div>

      {/* Amounts grid */}
      {!isCancelled && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            margin: "18px 0",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: 12,
              padding: "12px 14px",
              border: "1px solid #E2E8F0",
            }}
          >
            <p
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                margin: "0 0 5px",
              }}
            >
              Total consultation
            </p>
            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
              }}
            >
              {fmt(facture.montant_total)}
            </p>
          </div>
          <div
            style={{
              background: "#FFFBEB",
              borderRadius: 12,
              padding: "12px 14px",
              border: "1px solid #FEF08A",
            }}
          >
            <p
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: "#B45309",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                margin: "0 0 5px",
              }}
            >
              Déjà payé
            </p>
            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 800,
                color: "#F59E0B",
                margin: 0,
              }}
            >
              {fmt(totalPaid)}
            </p>
          </div>
          <div
            style={{
              background: isComplete ? "#F0FDF4" : "#FFF7ED",
              borderRadius: 12,
              padding: "12px 14px",
              border: `1px solid ${isComplete ? "#BBF7D0" : "#FED7AA"}`,
            }}
          >
            <p
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                color: isComplete ? "#15803D" : "#C2410C",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                margin: "0 0 5px",
              }}
            >
              {isComplete ? "Soldé ✓" : "Reste à payer"}
            </p>
            <p
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 800,
                color: isComplete ? "#10B981" : "#F97316",
                margin: 0,
              }}
            >
              {isComplete ? "0,00 DT" : fmt(restant)}
            </p>
          </div>
        </div>
      )}

      {/* Progress bar + step indicators */}
      {!isCancelled && (
        <div style={{ marginBottom: 18, position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 7,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: C.slate }}>
              Progression du paiement
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: st.color }}>
              {pct}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 6,
              background: "#F1F5F9",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 6,
                width: `${pct}%`,
                background: fillGrad,
                transition: "width .6s ease",
              }}
            />
          </div>
          {/* Step indicators */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            {[
              { pct: 0, label: "Réservation" },
              { pct: 50, label: "Acompte" },
              { pct: 100, label: "Solde" },
            ].map((step) => (
              <div key={step.pct} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    margin: "0 auto 4px",
                    background:
                      pct >= step.pct
                        ? isComplete
                          ? "#10B981"
                          : "#F59E0B"
                        : "#E2E8F0",
                    border: `2px solid ${pct >= step.pct ? (isComplete ? "#10B981" : "#F59E0B") : "#CBD5E1"}`,
                    transition: "background .4s",
                  }}
                />
                <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>
                  {step.label}
                </p>
                <p style={{ fontSize: 9, color: "#CBD5E1", margin: 0 }}>
                  {step.pct}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline transactions */}
      {facture.lignes.length > 0 && (
        <div style={{ marginBottom: 16, position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: ".5px",
              margin: "0 0 10px",
            }}
          >
            Historique
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              position: "relative",
            }}
          >
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                left: 14,
                top: 20,
                bottom: 20,
                width: 2,
                background: "#E2E8F0",
                zIndex: 0,
              }}
            />
            {facture.lignes.map((l, i) => (
              <div
                key={l.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "8px 0",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      i === facture.lignes.length - 1 ? "#D1FAE5" : "#FEF3C7",
                    border: `2px solid ${i === facture.lignes.length - 1 ? "#10B981" : "#F59E0B"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ico
                    d={
                      i === facture.lignes.length - 1
                        ? IC.checkCircle
                        : IC.creditCard
                    }
                    size={13}
                    color={
                      i === facture.lignes.length - 1 ? "#10B981" : "#F59E0B"
                    }
                  />
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#334155",
                      margin: 0,
                    }}
                  >
                    {l.type_ligne_display}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      margin: "1px 0 0",
                    }}
                  >
                    {new Date(l.date).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0f172a",
                    paddingTop: 4,
                  }}
                >
                  {fmt(l.montant)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification banners */}
      {!isComplete && facture.statut === "acompte_verse" && (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 14,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <Ico d={IC.clock} size={16} color="#F59E0B" />
          </div>
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#92400E",
                margin: "0 0 2px",
              }}
            >
              Acompte enregistré
            </p>
            <p style={{ fontSize: 11, color: "#A16207", margin: 0 }}>
              Votre acompte de {fmt(facture.acompte_montant)} a bien été reçu.
              Le solde de {fmt(facture.montant_total - facture.acompte_montant)}{" "}
              sera dû après votre consultation.
            </p>
          </div>
        </div>
      )}

      {isComplete && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 14,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <Ico d={IC.checkCircle} size={16} color="#10B981" />
          </div>
          <div>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#15803D",
                margin: "0 0 2px",
              }}
            >
              Paiement intégralement réglé
            </p>
            <p style={{ fontSize: 11, color: "#16A34A", margin: 0 }}>
              La totalité de votre consultation ({fmt(facture.montant_total)}) a
              été réglée avec succès. Votre reçu est disponible ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* Footer : référence + bouton reçu */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: 11, color: "#B0B8C8", fontWeight: 600 }}>
          Réf. #{facture.id}
        </span>
        {isComplete && (
          <button
            onClick={() => onShowReceipt(facture)}
            className="receipt-btn"
          >
            <Ico d={IC.fileText} size={14} />
            Voir le reçu
            <Ico d={IC.chevron} size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function PatientPaiementPage() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptFacture, setReceiptFacture] = useState<Facture | null>(null);
  const [filter, setFilter] = useState<"all" | "acompte_verse" | "solde_verse">(
    "all",
  );

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    api
      .get("patient/factures/")
      .then((r) => setFactures(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  if (isLoading || loading) return null;

  const filtered =
    filter === "all" ? factures : factures.filter((f) => f.statut === filter);
  const totalPaye = factures.reduce(
    (acc, f) =>
      acc +
      f.acompte_montant +
      (f.statut === "solde_verse" ? f.solde_montant : 0),
    0,
  );
  const totalRestant = factures.reduce(
    (acc, f) =>
      acc +
      (f.statut !== "solde_verse" ? f.montant_total - f.acompte_montant : 0),
    0,
  );
  const nbCompletes = factures.filter((f) => f.statut === "solde_verse").length;

  const kpis = [
    { label: "Total payé", value: fmt(totalPaye), icon: "creditCard" },
    { label: "Reste à régler", value: fmt(totalRestant), icon: "clock" },
    {
      label: "Consultations soldées",
      value: String(nbCompletes),
      icon: "trophy",
    },
  ];

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Syne:wght@700;800&display=swap');

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .light-premium-bg {
          background-color: #EFF6FF;
          background-image:
            radial-gradient(at 0% 0%,   rgba(139, 92, 246, 0.08) 0px, transparent 50%),
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
        .pro-card-light:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px -8px rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.2);
        }

        .spin {
          width: 28px; height: 28px;
          border: 3px solid rgba(124,58,237,0.15);
          border-left-color: #7C3AED;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .invoice-card:hover { border-color: rgba(124,58,237,0.18); }

        .receipt-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 16px;
          border-radius: 12px;
          border: 1px solid rgba(124,58,237,0.15);
          background: linear-gradient(135deg, rgba(124,58,237,0.07), rgba(16,185,129,0.07));
          color: #7C3AED;
          font-size: 12.5px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .receipt-btn:hover {
          background: linear-gradient(135deg, #7C3AED, #10B981);
          color: #fff;
          border-color: transparent;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px -4px rgba(124,58,237,0.4);
        }

        .filter-btn {
          padding: 7px 18px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid #E2E8F0;
          background: #fff;
          color: #64748B;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .filter-btn:hover  { border-color: #7C3AED; color: #7C3AED; }
        .filter-btn.active { background: ${C.grad}; color: #fff; border-color: transparent; box-shadow: 0 4px 12px -3px rgba(124,58,237,0.35); }
      `}</style>

      <div
        className="light-premium-bg"
        style={{ display: "flex", fontFamily: "'Inter', sans-serif" }}
      >
        <Sidebar stats={{}} />
        <Navbar
          title="Mes Paiements"
          subtitle={`Suivi financier – ${username}`}
        />

        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "2rem",
            paddingTop: "calc(70px + 2rem)",
            maxWidth: 960,
          }}
        >
          {/* KPI cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              marginBottom: 28,
            }}
          >
            {kpis.map((k, i) => (
              <div
                key={k.label}
                className="pro-card-light"
                style={{
                  padding: "1.5rem",
                  animation: "fadeInUp 0.5s ease backwards",
                  animationDelay: `${i * 0.08}s`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 14,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      color: C.slate,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      margin: 0,
                    }}
                  >
                    {k.label}
                  </p>
                  <IBox k={k.icon} sz={38} />
                </div>
                <Num size={26}>{k.value}</Num>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 20,
              animation: "fadeInUp 0.5s ease backwards",
              animationDelay: "0.25s",
            }}
          >
            {[
              { key: "all", label: `Toutes (${factures.length})` },
              { key: "acompte_verse", label: "Acompte versé" },
              { key: "solde_verse", label: "Soldées" },
            ].map((f) => (
              <button
                key={f.key}
                className={`filter-btn${filter === f.key ? " active" : ""}`}
                onClick={() => setFilter(f.key as typeof filter)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Cards list */}
          <div className="pro-card-light" style={{ padding: 28 }}>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: C.ink,
                margin: "0 0 20px",
              }}
            >
              Historique des factures
            </h2>

            {filtered.length === 0 ? (
              <Empty />
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {filtered.map((f, i) => (
                  <PaiementCard
                    key={f.id}
                    facture={f}
                    onShowReceipt={setReceiptFacture}
                    delay={i * 0.06}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {receiptFacture && (
        <ReceiptModal
          facture={receiptFacture}
          onClose={() => setReceiptFacture(null)}
        />
      )}
    </PrivateRoute>
  );
}
