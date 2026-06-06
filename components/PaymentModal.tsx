// D:\teleconsultation\frontend\components\PaymentModal.tsx
"use client";

import { useState } from "react";
import api from "@/lib/api";

interface PaymentModalProps {
  rdvId: number;
  montantTotal: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({
  rdvId,
  montantTotal,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const acompte = montantTotal * 0.5;

  const handlePaiement = async () => {
    try {
      const res = await api.post(`/api/paiement/avance/${consultationId}/`);

      const paymentUrl = res.data.payment_url;

      if (paymentUrl) {
        window.location.href = paymentUrl; // REDIRECTION PAYMEE
      } else {
        console.error("payment_url missing", res.data);
      }
    } catch (err) {
      console.error("Erreur paiement", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 28,
          padding: 32,
          maxWidth: 440,
          width: "90%",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: "#1e1b4b",
            marginBottom: 8,
          }}
        >
          Confirmer votre rendez-vous
        </h2>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
          Un acompte de 50% est requis pour sécuriser votre créneau.
        </p>

        {/* Détail des montants */}
        <div
          style={{
            background: "#F8FAFC",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            border: "1px solid #E2E8F0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ color: "#64748b" }}>Montant total consultation</span>
            <span style={{ fontWeight: 700, color: "#1e1b4b" }}>
              {montantTotal.toFixed(2)} €
            </span>
          </div>
          <div
            style={{ height: 1, background: "#E2E8F0", margin: "0 -20px 12px" }}
          ></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b", fontWeight: 600 }}>
              Acompte à payer maintenant
            </span>
            <span style={{ fontWeight: 800, color: "#8B5CF6", fontSize: 18 }}>
              {acompte.toFixed(2)} €
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: 12 }}>
              Solde restant (après consultation)
            </span>
            <span style={{ color: "#94a3b8", fontSize: 12 }}>
              {acompte.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Carte bancaire simulée */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e1b4b, #8B5CF6)",
            borderRadius: 16,
            padding: 20,
            color: "white",
            marginBottom: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
            }}
          ></div>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "2px",
              opacity: 0.8,
              marginBottom: 16,
            }}
          >
            CARTE DE PAIEMENT
          </p>
          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "3px",
              marginBottom: 20,
            }}
          >
            •••• •••• •••• 4242
          </p>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12 }}>12/28</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>VISA</span>
          </div>
        </div>

        <button
          onClick={handlePayAcompte}
          disabled={loading}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #8B5CF6, #10B981)",
            color: "white",
            border: "none",
            borderRadius: 14,
            padding: "16px",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 10px 25px -5px rgba(139, 92, 246, 0.4)",
            transition: "all 0.3s",
          }}
        >
          {loading
            ? "Traitement en cours..."
            : `Payer l'acompte de ${acompte.toFixed(2)} €`}
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: "#64748b",
            marginTop: 12,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
const [finishing, setFinishing] = useState(false);

const handleFinishConsultation = async () => {
  setFinishing(true);
  try {
    // Cet appel va déclencher le signal Django qui passera la facture en "paye_entierement"
    // et transférera les fonds au médecin
    await api.patch(`consultations/${consultationId}/`, {
      status: "terminee",
    });

    // Mise à jour locale de l'UI...
    toast.success(
      "Consultation terminée ! Le solde a été crédité sur votre compte.",
    );
    router.push("/dashboard/medecin/facturation"); // Redirige vers la page de facturation
  } catch (error) {
    toast.error("Erreur lors de la finalisation");
  } finally {
    setFinishing(false);
  }
};

// Dans le rendu JSX :
<button
  onClick={handleFinishConsultation}
  disabled={finishing}
  style={{
    background: "linear-gradient(135deg, #10B981, #06B6D4)",
    color: "white",
    border: "none",
    borderRadius: 14,
    padding: "14px 24px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)",
    display: "flex",
    alignItems: "center",
    gap: 8,
  }}
>
  ✅{" "}
  {finishing
    ? "Finalisation en cours..."
    : "Terminer la consultation & Encaisser le solde"}
</button>;
