// src/types/index.ts

// --- Enums & Status ---
export enum UserRole {
  ADMIN = "admin",
  MEDECIN = "medecin",
  PATIENT = "patient",
}

export enum RendezVousStatus {
  EN_ATTENTE = "en_attente",
  CONFIRME = "confirme",
  ANNULE = "annule",
  TERMINE = "termine",
}

export enum ConsultationStatus {
  PLANIFIEE = "planifiee",
  EN_COURS = "en_cours",
  TERMINEE = "terminee",
  ANNULEE = "annulee",
}

export enum SpecialiteSlug {
  CARDIOLOGIE = "cardiologie",
  DERMATOLOGIE = "dermatologie",
  GENERALISTE = "generaliste",
  PEDIATRIE = "pediatrie",
  GYNECOLOGIE = "gynecologie",
}

// --- Entités Métier (Correspondent à ton diagramme) ---

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  date_naissance?: string;
}

export interface Specialite {
  id: number;
  nom: string;
  slug: SpecialiteSlug;
  icone: string; // Emoji ou chemin SVG
  description: string;
}

export interface Medecin {
  id: number;
  user: User;
  specialite: Specialite;
  tarif_consultation: number;
  note_moyenne: number;
  // Nous ajouterons les disponibilités ici plus tard
}

export interface Patient {
  id: number;
  user: User;
  allergies: string;
  historique_medical: string;
  code_assurance: string; // Utile pour le remboursement
}

export interface Disponibilite {
  id: number;
  medecin_id: number;
  jour_semaine: number; // 0 = Dimanche, 6 = Samedi
  heure_debut: string; // "09:00"
  heure_fin: string; // "17:00"
  est_actif: boolean;
}

export interface RendezVous {
  id: number;
  medecin: Medecin;
  patient: Patient;
  date_heure: string; // ISO String
  status: RendezVousStatus;
  motif: string;
  type: "cabinet" | "video";
  lien_visio?: string; // Pour Agora / Zoom
}

export interface Consultation extends RendezVous {
  compte_rendu?: string;
  ordonnances?: Ordonnance[];
}

export interface Ordonnance {
  id: number;
  consultation: Consultation;
  medicaments: string; // Format JSON ou structuré selon ton API
  notes_medecin: string;
  date_creation: string;
}

export interface DocumentMedical {
  id: number;
  patient: Patient;
  titre: string;
  fichier_url: string;
  type: "analyse" | "imagerie" | "autre";
  date_upload: string;
}

// --- Interfaces Système (Paiement & IA) ---

export interface Paiement {
  id: number;
  rendez_vous: RendezVous;
  montant: number;
  devise: string;
  statut: "pending" | "completed" | "failed";
  methode: "konnect" | "cash" | "carte";
  transaction_id?: string;
  date_paiement: string;
}

export interface AnalyseIA {
  id: number;
  patient: Patient;
  symptomes: string;
  resultats: {
    specialite_recommandee: string;
    niveau_urgence: number; // 1-5
    conseils: string;
  };
  date_analyse: string;
}
