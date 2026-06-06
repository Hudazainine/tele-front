// D:\teleconsultation\frontend\components\ResumePaiement.jsx
"use client";

import PaiementBadge from "../components/PaiementBadage";
import BoutonPaiement from "../components/BoutonPaiement";

/**
 * ResumePaiement — carte récapitulative complète d'un paiement RDV.
 *
 * Props:
 *  - rdvId        : string  — identifiant du rendez-vous
 *  - paiementInfo : object  — { statut_avance, statut_restant, est_complet,
 *                               montant_avance, montant_restant, montant_total }
 */
export default function ResumePaiement({ rdvId, paiementInfo }) {
  if (!paiementInfo) return null;

  const {
    statut_avance,
    statut_restant,
    est_complet,
    montant_avance = 0,
    montant_restant = 0,
    montant_total = 0,
  } = paiementInfo;

  const showBtnAvance =
    statut_avance === "en_attente" || statut_avance === "echoue";
  const showBtnRestant =
    statut_avance === "paye" &&
    (statut_restant === "en_attente" || statut_restant === "echoue");

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 flex flex-col gap-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 m-0">
          Paiement du rendez-vous
        </h3>
        <PaiementBadge paiementInfo={paiementInfo} />
      </div>

      {/* Lignes de montants */}
      <div className="flex flex-col gap-2 text-sm">
        <LigneMontant
          label="Avance"
          montant={montant_avance}
          statut={statut_avance}
        />
        <LigneMontant
          label="Solde restant"
          montant={montant_restant}
          statut={statut_restant}
        />
        <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-gray-800">
          <span>Total</span>
          <span>{montant_total} TND</span>
        </div>
      </div>

      {/* Boutons de paiement */}
      {!est_complet && (
        <div className="flex flex-col gap-2">
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

      {est_complet && (
        <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 m-0 font-medium">
          ✓ Paiement intégralement reçu. Merci !
        </p>
      )}
    </div>
  );
}

function statutLabel(statut) {
  const map = {
    paye: { text: "Payé", color: "text-emerald-700" },
    en_attente: { text: "En attente", color: "text-amber-600" },
    echoue: { text: "Échoué", color: "text-red-600" },
    rembourse: { text: "Remboursé", color: "text-blue-600" },
  };
  return map[statut] || { text: statut, color: "text-gray-500" };
}

function LigneMontant({ label, montant, statut }) {
  const { text, color } = statutLabel(statut);
  return (
    <div className="flex justify-between items-center text-gray-600">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${color}`}>{text}</span>
        <span className="font-medium text-gray-800">{montant} TND</span>
      </div>
    </div>
  );
}
