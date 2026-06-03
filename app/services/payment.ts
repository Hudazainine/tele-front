// src/services/payment.ts
import api from "@/lib/api";

export interface KonnectPaymentParams {
  amount: number;
  order_id: string; // ID du rendez-vous
  firstname: string;
  lastname: string;
  email: string;
}

export const initierPaiementKonnect = async (params: KonnectPaymentParams) => {
  try {
    // Appel à ton backend qui génère le token de paiement Konnect
    const response = await api.post("/paiements/konnect/init/", params);

    // Le backend doit renvoyer l'URL de paiement Konnect
    if (response.data.payment_url) {
      // Redirection utilisateur vers la page de paiement
      window.location.href = response.data.payment_url;
    } else {
      throw new Error("URL de paiement non reçue");
    }
  } catch (error) {
    console.error("Erreur init paiement", error);
    throw error;
  }
};

// Dans ton composant RendezVous ou Checkout :
const handlePayer = async () => {
  try {
    await initierPaiementKonnect({
      amount: rdv.medecin.tarif_consultation,
      order_id: `RDV-${rdv.id}`,
      firstname: user.prenom,
      lastname: user.nom,
      email: user.email,
    });
  } catch (e) {
    toast("Erreur lors de l'initialisation du paiement", "error");
  }
};
