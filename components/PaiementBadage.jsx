// D:\teleconsultation\frontend\components\PaiementBadage.jsx
"use client";

const BADGE_CONFIG = {
  complet: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    icon: "✓",
    label: "Payé",
  },
  avance_ok: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: "⏳",
    label: "Avance OK",
  },
  en_attente: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: "⚠",
    label: "Avance requise",
  },
  echoue: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: "✗",
    label: "Échoué",
  },
  rembourse: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: "↩",
    label: "Remboursé",
  },
};

function resolveBadgeKey({ statut_avance, statut_restant, est_complet }) {
  if (est_complet) return "complet";
  if (statut_avance === "paye" && statut_restant !== "paye") return "avance_ok";
  if (statut_avance === "en_attente") return "en_attente";
  if (statut_avance === "echoue") return "echoue";
  if (statut_avance === "rembourse") return "rembourse";
  return null;
}

export default function PaiementBadge({ paiementInfo }) {
  if (!paiementInfo) return null;

  const key = resolveBadgeKey(paiementInfo);
  if (!key) return null;

  const { bg, text, border, icon, label } = BADGE_CONFIG[key];

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5",
        "rounded-full px-2.5 py-0.5",
        "text-xs font-semibold border",
        "whitespace-nowrap",
        bg,
        text,
        border,
      ].join(" ")}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
