// D:\teleconsultation\frontend\components\Pagedetailpaiement.jsx
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import PaiementBadge from "@/components/PaiementBadge";
import BoutonPaiement from "@/components/BoutonPaiement";

export default function PageDetailPaiement({ rdvId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  const charger = async () => {
    setLoading(true);
    setErreur(null);
    try {
      const { data: res } = await api.get(`paiement/detail/${rdvId}/`);
      setData(res);
    } catch (err) {
      setErreur(
        err?.response?.data?.error ??
          "Impossible de charger les informations de paiement.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rdvId) charger();
  }, [rdvId]);

  if (loading) return <SqueletteChargement />;
  if (erreur) return <ErreurChargement message={erreur} onRetry={charger} />;
  if (!data) return null;

  const { rdv, paiement } = data;
  const {
    statut_avance,
    statut_restant,
    est_complet,
    montant_avance = 0,
    montant_restant = 0,
    montant_total = 0,
  } = paiement;

  const showBtnAvance =
    !est_complet &&
    (statut_avance === "en_attente" || statut_avance === "echoue");
  const showBtnRestant =
    !est_complet &&
    statut_avance === "paye" &&
    (statut_restant === "en_attente" || statut_restant === "echoue");

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header RDV */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-gray-900 m-0">
          Paiement du rendez-vous
        </h1>
        {rdv && (
          <p className="text-sm text-gray-500 m-0">
            {rdv.date} à {rdv.heure} — Dr. {rdv.medecin?.nom}
            {rdv.medecin?.specialite ? ` · ${rdv.medecin.specialite}` : ""}
          </p>
        )}
      </div>

      {/* Carte statut global */}
      <div
        className={[
          "rounded-2xl border p-5",
          est_complet
            ? "border-emerald-200 bg-emerald-50"
            : "border-gray-100 bg-white shadow-sm",
        ].join(" ")}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-gray-700">Statut</span>
          <PaiementBadge paiementInfo={paiement} />
        </div>

        {/* Ligne avance */}
        <LignePaiement
          label="Avance"
          montant={montant_avance}
          statut={statut_avance}
        />

        {/* Ligne restant */}
        <LignePaiement
          label="Solde restant"
          montant={montant_restant}
          statut={statut_restant}
        />

        {/* Total */}
        <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-1">
          <span className="text-sm font-bold text-gray-800">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {montant_total} TND
          </span>
        </div>
      </div>

      {/* Progression */}
      <BarreProgression
        montantPaye={
          (statut_avance === "paye" ? montant_avance : 0) +
          (statut_restant === "paye" ? montant_restant : 0)
        }
        montantTotal={montant_total}
      />

      {/* Boutons de paiement */}
      {(showBtnAvance || showBtnRestant) && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-gray-700 m-0">
            Action requise
          </h2>
          {showBtnAvance && (
            <BoutonPaiement
              rdvId={rdvId}
              type="avance"
              montant={montant_avance}
            />
          )}
          {showBtnRestant && (
            <BoutonPaiement
              rdvId={rdvId}
              type="restant"
              montant={montant_restant}
            />
          )}
        </div>
      )}

      {/* Confirmation paiement complet */}
      {est_complet && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium flex items-center gap-2">
          <span aria-hidden="true">✓</span>
          Paiement intégralement reçu. Merci pour votre confiance !
        </div>
      )}

      {/* Aide */}
      <p className="text-xs text-gray-400 text-center m-0">
        Paiements sécurisés via{" "}
        <a
          href="https://konnect.network"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Paymee
        </a>
        . En cas de problème, contactez le support.
      </p>
    </div>
  );
}

// ------------------------------------------------------------------
// Sous-composants
// ------------------------------------------------------------------

const STATUT_CONFIG = {
  paye: { label: "Payé", color: "text-emerald-700", dot: "bg-emerald-500" },
  en_attente: {
    label: "En attente",
    color: "text-amber-600",
    dot: "bg-amber-400",
  },
  echoue: { label: "Échoué", color: "text-red-600", dot: "bg-red-500" },
  rembourse: { label: "Remboursé", color: "text-blue-600", dot: "bg-blue-400" },
};

function LignePaiement({ label, montant, statut }) {
  const cfg = STATUT_CONFIG[statut] ?? {
    label: statut,
    color: "text-gray-500",
    dot: "bg-gray-300",
  };
  return (
    <div className="flex items-center justify-between py-2 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}
        >
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot}`}
            aria-hidden="true"
          />
          {cfg.label}
        </span>
        <span className="font-semibold text-gray-800">{montant} TND</span>
      </div>
    </div>
  );
}

function BarreProgression({ montantPaye, montantTotal }) {
  if (!montantTotal) return null;
  const pct = Math.min(100, Math.round((montantPaye / montantTotal) * 100));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs text-gray-400">
        <span>Progression</span>
        <span>{pct} %</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

function SqueletteChargement() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-5 animate-pulse">
      <div className="h-6 w-48 bg-gray-100 rounded" />
      <div className="h-4 w-64 bg-gray-100 rounded" />
      <div className="rounded-2xl border border-gray-100 p-5 flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 bg-gray-100 rounded" />
        ))}
      </div>
      <div className="h-10 bg-gray-100 rounded-xl" />
    </div>
  );
}

function ErreurChargement({ message, onRetry }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-xl">
        ⚠
      </div>
      <p className="text-sm text-gray-600">{message}</p>
      <button
        onClick={onRetry}
        className="text-sm font-medium text-violet-600 underline cursor-pointer bg-transparent border-0"
      >
        Réessayer
      </button>
    </div>
  );
}
