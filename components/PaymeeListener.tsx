"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import api from "@/lib/api";

interface KonnectListenerProps {
  rdvId?: number;
  onPaiementConfirme?: () => void;
  onEchec?: () => void;
}

// ← composant interne qui utilise useSearchParams
function KonnectListenerInner({
  rdvId,
  onPaiementConfirme,
  onEchec,
}: KonnectListenerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (handled) return;
    const paymentRef = searchParams.get("payment_ref");
    if (!paymentRef) return;

    setHandled(true);

    api
      .get(`paiement/sync/${paymentRef}/`)
      .then(({ data }) => {
        if (data.statut_avance === "paye" || data.statut_restant === "paye") {
          onPaiementConfirme?.();
          router.push(
            `/dashboard/patient/paiement-succes?payment_ref=${paymentRef}${rdvId ? `&rdv_id=${rdvId}` : ""}`,
          );
        } else {
          onEchec?.();
          router.push("/dashboard/patient/paiement-annule");
        }
      })
      .catch(() => {
        onPaiementConfirme?.();
      });
  }, [searchParams, handled]);

  return null;
}

// ← export enveloppé dans Suspense
export default function KonnectListener(props: KonnectListenerProps) {
  return (
    <Suspense fallback={null}>
      <KonnectListenerInner {...props} />
    </Suspense>
  );
}
