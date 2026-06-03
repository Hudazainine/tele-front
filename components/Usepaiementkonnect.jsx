"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import api from "@/lib/api";

/**
 * useKonnectPaiement — hook de polling du statut Konnect pour un paiement RDV.
 *
 * Règle d'hydration : useState() ne doit JAMAIS avoir une valeur initiale
 * qui diffère entre SSR et client. Ici, loading démarre toujours à false
 * et passe à true dans le premier useEffect (client uniquement).
 *
 * Utilisation :
 *   const { statut, loading, erreur, stop } = useKonnectPaiement(paymentRef, {
 *     intervalMs: 4000,
 *     maxTentatives: 30,
 *     onSuccess: (data) => { ... },
 *     onEchec:   (data) => { ... },
 *   });
 */
export function useKonnectPaiement(paymentRef, options = {}) {
  const { intervalMs = 4000, maxTentatives = 30, onSuccess, onEchec } = options;

  // Toujours false au 1er rendu (SSR + client identiques).
  // Mis à true dans useEffect → uniquement côté client.
  const [statut, setStatut] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState(null);

  const tentativesRef = useRef(0);
  const timerRef = useRef(null);
  const stoppedRef = useRef(false);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    clearTimeout(timerRef.current);
    setLoading(false);
  }, []);

  const poll = useCallback(async () => {
    if (stoppedRef.current || !paymentRef) return;

    tentativesRef.current += 1;

    try {
      const { data } = await api.get(`paiement/konnect/status/${paymentRef}/`);
      const statutKonnect = data?.payment?.status;
      setStatut(statutKonnect);

      if (statutKonnect === "completed") {
        onSuccess?.(data.payment);
        stop();
        return;
      }

      const transactions = data?.payment?.transactions ?? [];
      const aSucces = transactions.some((t) => t.status === "success");
      if (aSucces) {
        onSuccess?.(data.payment);
        stop();
        return;
      }

      const aEchec = transactions.some(
        (t) =>
          t.status && !["success", "pending", "processing"].includes(t.status),
      );
      if (aEchec) {
        onEchec?.(data.payment);
        stop();
        return;
      }
    } catch (err) {
      setErreur(
        err?.response?.data?.error ??
          "Erreur lors de la vérification du paiement.",
      );
    }

    if (tentativesRef.current >= maxTentatives) {
      setErreur("Délai de vérification dépassé. Veuillez rafraîchir la page.");
      stop();
      return;
    }

    timerRef.current = setTimeout(poll, intervalMs);
  }, [paymentRef, intervalMs, maxTentatives, onSuccess, onEchec, stop]);

  useEffect(() => {
    if (!paymentRef) return;

    stoppedRef.current = false;
    tentativesRef.current = 0;
    // setLoading dans useEffect = uniquement côté client → pas de mismatch SSR
    setLoading(true);
    setErreur(null);
    setStatut(null);

    timerRef.current = setTimeout(poll, 1500);

    return () => {
      stoppedRef.current = true;
      clearTimeout(timerRef.current);
    };
  }, [paymentRef, poll]);

  return { statut, loading, erreur, stop };
}

/**
 * PaiementSuccesRetour — composant affiché sur la page de retour Konnect.
 *
 * CORRECTION hydration #418 / #425 :
 * window.location.search est inaccessible côté serveur.
 * On initialise paymentRef à null (valeur SSR-safe) et on le lit
 * dans un useEffect (client uniquement) → rendu SSR et client identiques.
 *
 * Usage dans app/paiement/retour/page.jsx :
 *   import { PaiementSuccesRetour } from "@/components/usePaiementKonnect";
 *   export default function Page() { return <PaiementSuccesRetour />; }
 */
export function PaiementSuccesRetour({ onSuccess, onEchec }) {
  const [paymentRef, setPaymentRef] = useState(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    // Lecture de l'URL uniquement côté client
    const params = new URLSearchParams(window.location.search);
    setPaymentRef(params.get("payment_ref") ?? null);
    setPret(true);
  }, []);

  const { statut, loading, erreur } = useKonnectPaiement(
    pret ? paymentRef : null,
    {
      intervalMs: 3000,
      maxTentatives: 20,
      onSuccess,
      onEchec,
    },
  );

  // Rendu initial identique SSR/client
  if (!pret) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Spinner />
        <p className="text-sm text-gray-500">Chargement…</p>
      </div>
    );
  }

  if (!paymentRef) {
    return (
      <p className="text-sm text-red-600">
        Référence de paiement introuvable dans l'URL.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Spinner />
        <p className="text-sm text-gray-500">
          Vérification du paiement en cours…
        </p>
      </div>
    );
  }

  if (erreur) {
    return (
      <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
        ⚠ {erreur}
      </p>
    );
  }

  if (statut === "completed") {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
          ✓
        </div>
        <p className="font-semibold text-emerald-700">Paiement confirmé !</p>
        <p className="text-sm text-gray-500">
          Référence : <code className="font-mono text-xs">{paymentRef}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl">
        ✗
      </div>
      <p className="font-semibold text-red-700">Paiement non abouti</p>
      <p className="text-sm text-gray-500">
        Veuillez réessayer ou contacter le support.
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="w-8 h-8 animate-spin text-violet-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
