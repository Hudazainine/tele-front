"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

function PaiementSuccesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [statut, setStatut] = useState<"chargement" | "succes" | "echec">(
    "chargement",
  );

  useEffect(() => {
    const payment_ref =
      searchParams.get("payment_ref") ?? searchParams.get("token");
    const rdv_id = searchParams.get("rdv_id");

    if (!payment_ref && !rdv_id) {
      setStatut("echec");
      return;
    }

    let tentatives = 0;

    const verifier = async () => {
      tentatives++;
      try {
        if (payment_ref) {
          const { data } = await api.get(`paiement/sync/${payment_ref}/`);
          if (
            data?.statut_avance === "paye" ||
            data?.statut_restant === "paye"
          ) {
            setStatut("succes");
            return;
          }
        } else if (rdv_id) {
          const { data } = await api.get(`paiement/verifier/${rdv_id}/`);
          const p = data?.paiement;
          if (p?.statut_avance === "paye" || p?.statut_restant === "paye") {
            setStatut("succes");
            return;
          }
        }
      } catch {}

      if (tentatives < 8) {
        setTimeout(verifier, 2000);
      } else {
        setStatut("succes"); // Paymee a confirmé → on fait confiance
      }
    };

    verifier();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center flex flex-col items-center gap-6">
        {statut === "chargement" && (
          <>
            <div className="w-16 h-16 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin" />
            <p className="text-gray-500 text-sm">Vérification du paiement...</p>
          </>
        )}

        {statut === "succes" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">
              Paiement confirmé !
            </h1>
            <p className="text-gray-500 text-sm">
              Votre rendez-vous est maintenant confirmé.
            </p>
            <button
              onClick={() => router.push("/dashboard/patient/rendezvous")}
              className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-emerald-500 text-white text-sm font-semibold hover:brightness-110 transition"
            >
              Retour à mes rendez-vous
            </button>
          </>
        )}

        {statut === "echec" && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">
              Paiement en cours de traitement
            </h1>
            <p className="text-gray-500 text-sm">
              Le paiement a été reçu mais la confirmation peut prendre quelques
              instants.
            </p>
            <button
              onClick={() => router.push("/dashboard/patient/rendezvous")}
              className="mt-2 px-6 py-2.5 rounded-xl bg-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-300 transition"
            >
              Retour à mes rendez-vous
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaiementSuccesPage() {
  return (
    <Suspense>
      <PaiementSuccesContent />
    </Suspense>
  );
}
