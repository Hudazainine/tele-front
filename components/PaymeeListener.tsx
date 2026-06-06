// D:\teleconsultation\frontend\components\PaymeeListener.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface PaymeeListenerProps {
  rdvId?: number;
  onPaiementConfirme?: () => void;
}

export default function PaymeeListener({
  rdvId,
  onPaiementConfirme,
}: PaymeeListenerProps) {
  const router = useRouter();

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.event_id !== "paymee.complete") return;

      const token = event.data.payment_token;
      console.log("PAYMEE OK:", token);

      // Recharger les données immédiatement
      onPaiementConfirme?.();

      // Rediriger vers la page succès
      router.push(
        `/dashboard/patient/paiement-succes?token=${token}${rdvId ? `&rdv_id=${rdvId}` : ""}`,
      );
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [router, rdvId, onPaiementConfirme]);

  return null;
}
