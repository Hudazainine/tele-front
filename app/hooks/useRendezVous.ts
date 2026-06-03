// src/hooks/useRendezVous.ts
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { RendezVous, adaptRendezVous } from "@/types"; // Assure-to-toi d'exporter adaptRendezVous depuis types

export const useRendezVous = () => {
  const [data, setData] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRendezVous = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("rendezvous/");
      // Ici on transforme la donnée brute en objet "Pro" typé
      const adaptedData = response.data.map(adaptRendezVous);
      setData(adaptedData);
    } catch (err) {
      setError("Impossible de charger les rendez-vous.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Optimistic UI : Annulation instantanée
  const cancelRendezVous = async (id: number) => {
    const previousData = [...data];

    // 1. Update optimiste immédiat
    setData((prev) =>
      prev.map((rdv) =>
        rdv.id === id ? { ...rdv, status: "annule" as any } : rdv,
      ),
    );

    try {
      await api.patch(`rendezvous/${id}/`, { status: "annule" });
      // Succès silencieux, l'UI est déjà à jour
    } catch (err) {
      // 2. Rollback en cas d'erreur
      setData(previousData);
      setError("Échec de l'annulation.");
    }
  };

  useEffect(() => {
    fetchRendezVous();
    // Note : Pro Level = remplacer par React Query avec un intervalle automatique
  }, []);

  return { data, loading, error, refetch: fetchRendezVous, cancelRendezVous };
};
