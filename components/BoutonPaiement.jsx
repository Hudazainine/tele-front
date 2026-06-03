"use client";

import { useState, useTransition, useCallback } from "react";
import api from "@/lib/api";

export default function BoutonPaiement({
  rdvId,
  type,
  montant,
  disabled = false,
}) {
  const [error, setError] = useState(null);
  // useTransition : marque la mise à jour comme non-urgente
  // → le navigateur peut interrompre pour garder l'UI réactive
  // → évite le "click handler took Xms"
  const [isPending, startTransition] = useTransition();

  const handlePay = useCallback(() => {
    setError(null);

    startTransition(async () => {
      try {
        const endpoint =
          type === "avance"
            ? `paiement/avance/${rdvId}/`
            : `paiement/restant/${rdvId}/`;

        const { data } = await api.post(endpoint);

        if (data.pay_url) {
          // Micro-tâche : libère le thread avant la navigation
          await Promise.resolve();
          window.location.href = data.pay_url;
        } else {
          setError("L'URL de paiement n'a pas été retournée.");
        }
      } catch (err) {
        setError(
          err?.response?.data?.error ||
            "Erreur de connexion au serveur de paiement.",
        );
      }
    });
  }, [rdvId, type]);

  const isLoading = isPending;
  const isAvance = type === "avance";
  const label = isAvance
    ? `Payer l'avance — ${montant} TND`
    : `Payer le solde — ${montant} TND`;

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={handlePay}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={[
          "inline-flex items-center justify-center gap-2",
          "rounded-xl px-5 py-2.5",
          "text-sm font-semibold text-white",
          "border-0 outline-none",
          "transition-all duration-200",
          disabled || isLoading
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:brightness-110 active:scale-95",
          isAvance
            ? "bg-gradient-to-br from-violet-500 to-emerald-500 shadow-[0_4px_14px_rgba(139,92,246,0.35)]"
            : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_4px_14px_rgba(16,185,129,0.35)]",
        ].join(" ")}
      >
        {isLoading ? (
          <>
            <SpinnerIcon />
            Redirection vers Konnect…
          </>
        ) : (
          <>
            <CardIcon />
            {label}
          </>
        )}
      </button>

      {error && (
        <p
          className="flex items-center gap-1 text-xs font-medium text-red-600 m-0"
          role="alert"
        >
          <WarningIcon />
          {error}
        </p>
      )}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="white"
        strokeWidth="3"
        strokeOpacity="0.3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}
