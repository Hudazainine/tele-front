// src/services/adapter.ts
import { Medecin, RendezVous, Specialite, Disponibilite } from "@/types";
import { z } from "zod";

// 1. Validation des réponses API (Sécurité)
const MedecinSchema = z.object({
  id: z.number(),
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
  }),
  specialite_id: z.number(),
  tarif: z.number(),
});

// 2. Base de données des spécialités (En attendant une vraie API /specialites)
const SPECIALITES_DB: Record<number, Specialite> = {
  1: {
    id: 1,
    nom: "Cardiologie",
    slug: "cardiologie",
    icone: "🫀",
    description: "Maladies cardiovasculaires",
  },
  2: {
    id: 2,
    nom: "Dermatologie",
    slug: "dermatologie",
    icone: "🧴",
    description: "Peau, cheveux et ongles",
  },
  3: {
    id: 3,
    nom: "Généraliste",
    slug: "generaliste",
    icone: "🩺",
    description: "Médecine de famille",
  },
  4: {
    id: 4,
    nom: "Pédiatrie",
    slug: "pediatrie",
    icone: "👶",
    description: "Santé des enfants",
  },
};

// 3. Fonctions d'adaptation (Transformation API -> Frontend Model)
export const adaptMedecin = (data: any): Medecin => {
  // Validation Zod (optionnel mais recommandé pour le Pro Level)
  const validated = MedecinSchema.parse(data);

  return {
    id: validated.id,
    user: validated.user,
    specialite: SPECIALITES_DB[validated.specialite_id] || SPECIALITES_DB[3], // Fallback sur Généraliste
    tarif_consultation: validated.tarif,
    note_moyenne: data.note || 0,
    disponibilites: [], // Sera peuplé par un endpoint séparé
  };
};

export const adaptRendezVous = (data: any): RendezVous => {
  return {
    id: data.id,
    medecin: adaptMedecin(data.medecin), // Adaptation imbriquée
    patient: data.patient, // À adapter aussi si besoin
    date_heure: data.date_heure,
    status: data.status,
    motif: data.motif,
    type: data.type || "cabinet",
    lien_visio: data.lien_visio,
  };
};
