"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS — identiques au module Ordonnances
// ─────────────────────────────────────────────────────────────
const T = {
  bg:          "#F0F4F1",
  surface:     "#FFFFFF",
  border:      "#E2EAE5",
  borderMid:   "#9FE1CB",
  accent:      "#1D9E75",
  accentLight: "#E1F5EE",
  accentDark:  "#085041",
  textPrimary: "#0F1F18",
  textMuted:   "#4A5C52",
  textLight:   "#8A9A92",
  font:        "'Plus Jakarta Sans', -apple-system, sans-serif",
  radius:      "8px",
  radiusLg:    "12px",
  warn:        "#D97706",
  warnBg:      "#FFFBEB",
  warnBorder:  "#FDE68A",
};

function PaiementSuccesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [statut, setStatut] = useState<"chargement" | "succes" | "echec">("chargement");

  useEffect(() => {
    const payment_ref = searchParams.get("payment_ref") ?? searchParams.get("token");
    const rdv_id = searchParams.get("rdv_id");

    if (!payment_ref && !rdv_id) { setStatut("echec"); return; }

    let tentatives = 0;
    const verifier = async () => {
      tentatives++;
      try {
        if (payment_ref) {
          const { data } = await api.get(`paiement/sync/${payment_ref}/`);
          if (data?.statut_avance === "paye" || data?.statut_restant === "paye") { setStatut("succes"); return; }
        } else if (rdv_id) {
          const { data } = await api.get(`paiement/verifier/${rdv_id}/`);
          const p = data?.paiement;
          if (p?.statut_avance === "paye" || p?.statut_restant === "paye") { setStatut("succes"); return; }
        }
      } catch {}
      if (tentatives < 8) setTimeout(verifier, 2000);
      else setStatut("succes");
    };
    verifier();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      <div style={{
        minHeight: "100vh", background: T.bg,
        fontFamily: T.font,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem",
      }}>
        <div style={{
          background: T.surface, borderRadius: T.radiusLg,
          border: `0.5px solid ${T.border}`,
          width: "100%", maxWidth: 420,
          overflow: "hidden",
          animation: "fadeUp .35s ease",
        }}>
          {/* Header bar */}
          <div style={{ background: T.accentDark, padding: "16px 20px", color: "#fff" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.3px", textTransform: "uppercase", opacity: .7, margin: 0 }}>
              Téléconsultation
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 0" }}>
              Confirmation de paiement
            </p>
          </div>

          <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>

            {/* ── Chargement ── */}
            {statut === "chargement" && (
              <>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  border: `3px solid ${T.border}`,
                  borderTopColor: T.accent,
                  animation: "spin 1s linear infinite",
                }} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: "0 0 4px" }}>
                    Vérification en cours
                  </p>
                  <p style={{ fontSize: 12, color: T.textLight, margin: 0 }}>
                    Nous confirmons votre paiement…
                  </p>
                </div>
              </>
            )}

            {/* ── Succès ── */}
            {statut === "succes" && (
              <>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: T.accentLight, border: `0.5px solid ${T.borderMid}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: T.accentDark, fontSize: 24,
                }}>
                  <i className="ti ti-circle-check" />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary, margin: "0 0 6px" }}>
                    Paiement confirmé
                  </p>
                  <p style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>
                    Votre rendez-vous est maintenant validé.
                  </p>
                </div>
                <div style={{
                  width: "100%", padding: "12px 14px",
                  background: T.accentLight, border: `0.5px solid ${T.borderMid}`,
                  borderRadius: T.radius,
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 12, fontWeight: 600, color: T.accentDark,
                }}>
                  <i className="ti ti-shield-check" style={{ fontSize: 14 }} />
                  Transaction sécurisée et enregistrée
                </div>
                <button
                  onClick={() => router.push("/dashboard/patient/rendezvous")}
                  style={{
                    width: "100%", padding: "10px", border: "none",
                    borderRadius: T.radius, background: T.accentDark,
                    color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: T.font,
                  }}
                >
                  Voir mes rendez-vous
                </button>
              </>
            )}

            {/* ── En cours de traitement ── */}
            {statut === "echec" && (
              <>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: T.warnBg, border: `0.5px solid ${T.warnBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: T.warn, fontSize: 24,
                }}>
                  <i className="ti ti-clock" />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary, margin: "0 0 6px" }}>
                    Paiement en cours de traitement
                  </p>
                  <p style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>
                    Le paiement a été reçu. La confirmation peut prendre quelques instants.
                  </p>
                </div>
                <button
                  onClick={() => router.push("/dashboard/patient/rendezvous")}
                  style={{
                    width: "100%", padding: "10px",
                    border: `0.5px solid ${T.border}`,
                    borderRadius: T.radius, background: T.surface,
                    color: T.textMuted, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: T.font,
                  }}
                >
                  Retour à mes rendez-vous
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default function PaiementSuccesPage() {
  return (
    <Suspense>
      <PaiementSuccesContent />
    </Suspense>
  );
}