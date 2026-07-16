// shared.ts / shared.tsx
// Types, données et composants communs utilisés par les modals d'ordonnances.
"use client";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
}

export interface Ordonnance {
  id: number;
  patient_name: string;
  medecin_name: string;
  date: string;
  date_heure: string;
  medicaments: string;
  consultation: number;
}

export interface Consultation {
  id: number;
  patient_name: string;
  date_heure: string;
}

export interface Med {
  id: number;
  nom: string;
  posologie: string;
  duree: string;
}

// ─────────────────────────────────────────────
// MED DB
// ─────────────────────────────────────────────

export const MED_DB = [
  { nom: "Amoxicilline 500mg", cat: "Antibiotique" },
  { nom: "Amoxicilline 1g", cat: "Antibiotique" },
  { nom: "Amoxicilline + Acide clavulanique 1g", cat: "Antibiotique" },
  { nom: "Azithromycine 500mg", cat: "Antibiotique" },
  { nom: "Ciprofloxacine 500mg", cat: "Antibiotique" },
  { nom: "Doxycycline 100mg", cat: "Antibiotique" },
  { nom: "Métronidazole 500mg", cat: "Antibiotique" },
  { nom: "Clarithromycine 500mg", cat: "Antibiotique" },
  { nom: "Cefixime 400mg", cat: "Antibiotique" },
  { nom: "Spiramycine 1.5MUI", cat: "Antibiotique" },
  { nom: "Paracétamol 500mg", cat: "Antalgique" },
  { nom: "Paracétamol 1g", cat: "Antalgique" },
  { nom: "Ibuprofène 400mg", cat: "Anti-inflammatoire" },
  { nom: "Ibuprofène 600mg", cat: "Anti-inflammatoire" },
  { nom: "Diclofénac 50mg", cat: "Anti-inflammatoire" },
  { nom: "Kétoprofène 100mg", cat: "Anti-inflammatoire" },
  { nom: "Célécoxib 200mg", cat: "Anti-inflammatoire" },
  { nom: "Tramadol 50mg", cat: "Antalgique" },
  { nom: "Codéine Paracétamol", cat: "Antalgique" },
  { nom: "Oméprazole 20mg", cat: "Gastroprotecteur" },
  { nom: "Oméprazole 40mg", cat: "Gastroprotecteur" },
  { nom: "Pantoprazole 40mg", cat: "Gastroprotecteur" },
  { nom: "Esoméprazole 20mg", cat: "Gastroprotecteur" },
  { nom: "Métoclopramide 10mg", cat: "Antiémétique" },
  { nom: "Dompéridone 10mg", cat: "Antiémétique" },
  { nom: "Lopéramide 2mg", cat: "Antidiarrhéique" },
  { nom: "Amlodipine 5mg", cat: "Antihypertenseur" },
  { nom: "Amlodipine 10mg", cat: "Antihypertenseur" },
  { nom: "Ramipril 5mg", cat: "Antihypertenseur" },
  { nom: "Bisoprolol 5mg", cat: "Antihypertenseur" },
  { nom: "Losartan 50mg", cat: "Antihypertenseur" },
  { nom: "Atorvastatine 20mg", cat: "Hypolipémiant" },
  { nom: "Atorvastatine 40mg", cat: "Hypolipémiant" },
  { nom: "Aspirine 100mg", cat: "Antiagrégant" },
  { nom: "Metformine 500mg", cat: "Antidiabétique" },
  { nom: "Metformine 850mg", cat: "Antidiabétique" },
  { nom: "Metformine 1000mg", cat: "Antidiabétique" },
  { nom: "Glibenclamide 5mg", cat: "Antidiabétique" },
  { nom: "Salbutamol 100µg inhalateur", cat: "Bronchodilatateur" },
  { nom: "Béclométasone 250µg", cat: "Corticoïde inhalé" },
  { nom: "Montelukast 10mg", cat: "Antiasthmatique" },
  { nom: "Cétirizine 10mg", cat: "Antihistaminique" },
  { nom: "Loratadine 10mg", cat: "Antihistaminique" },
  { nom: "Pseudoéphédrine 60mg", cat: "Décongestionnant" },
  { nom: "Hydrocortisone 1% crème", cat: "Corticoïde topique" },
  { nom: "Betamethasone 0.05% crème", cat: "Corticoïde topique" },
  { nom: "Clotrimazole 1% crème", cat: "Antifongique" },
  { nom: "Vitamine D3 1000UI", cat: "Supplément" },
  { nom: "Vitamine D3 100000UI", cat: "Supplément" },
  { nom: "Fer ferreux 80mg", cat: "Supplément" },
  { nom: "Acide folique 5mg", cat: "Supplément" },
  { nom: "Magnésium 300mg", cat: "Supplément" },
];

export const CAT_COLORS: Record<string, string> = {
  Antibiotique: "#4F6BF6",
  Antalgique: "#10B981",
  "Anti-inflammatoire": "#F59E0B",
  Gastroprotecteur: "#8B5CF6",
  Antiémétique: "#8B5CF6",
  Antidiarrhéique: "#8B5CF6",
  Antihypertenseur: "#EF4444",
  Hypolipémiant: "#EF4444",
  Antiagrégant: "#EF4444",
  Antidiabétique: "#06B6D4",
  Bronchodilatateur: "#14B8A6",
  "Corticoïde inhalé": "#14B8A6",
  Antiasthmatique: "#14B8A6",
  Antihistaminique: "#14B8A6",
  Décongestionnant: "#14B8A6",
  "Corticoïde topique": "#A78BFA",
  Antifongique: "#A78BFA",
  Supplément: "#64748B",
};

let _id = 0;
export const newMed = (): Med => ({
  id: ++_id,
  nom: "",
  posologie: "",
  duree: "",
});

// ─────────────────────────────────────────────
// SHARED MODAL STYLES (à injecter une seule fois dans la page parente)
// ─────────────────────────────────────────────

export const SHARED_MODAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');

  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeInBg { from{opacity:0} to{opacity:1} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(15,23,42,0.55); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeInBg 0.2s ease;
    padding: 20px;
  }
  .modal-content {
    width: 100%; max-width: 1000px;
    max-height: 90vh; overflow-y: auto;
    background: transparent; display: flex; flex-direction: column;
    animation: fadeUp 0.25s ease;
  }

  /* Form panel */
  .form-panel { background:#FFFFFF; border-radius:24px; overflow:visible; box-shadow:0 24px 60px rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.6); }
  .form-section { padding:24px 28px; border-bottom:1px solid #F3F4F6; }
  .form-section:last-of-type { border-bottom:none; }
  .sec-hd { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
  .sec-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .sec-icon.dr { background:linear-gradient(135deg,#EEF2FF,#E0E7FF); color:#4F6BF6; }
  .sec-icon.pt { background:linear-gradient(135deg,#ECFDF5,#D1FAE5); color:#10B981; }
  .sec-icon.rx { background:linear-gradient(135deg,#EEF2FF,#E0E7FF); color:#4F6BF6; }
  .sec-icon.nt { background:linear-gradient(135deg,#FEF3C7,#FDE68A); color:#F59E0B; }
  .sec-title { font-family:'Playfair Display',serif; font-size:16px; font-weight:600; color:#111827; }

  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .field { display:flex; flex-direction:column; gap:6px; }
  .field label { font-size:11px; font-weight:600; color:#9CA3AF; text-transform:uppercase; letter-spacing:.6px; }
  .field label .req { color:#EF4444; }

  .f-inp,.f-sel,.f-txt { width:100%; padding:11px 14px; font-family:'Inter',sans-serif; font-size:13px; color:#111827; background:#F4F5F9; border:1px solid #E5E7EB; border-radius:10px; outline:none; transition:all .2s ease; box-sizing:border-box; }
  .f-inp:focus,.f-sel:focus,.f-txt:focus { border-color:#4F6BF6; background:#fff; box-shadow:0 0 0 3px rgba(79,107,246,.1); }
  .f-inp::placeholder,.f-txt::placeholder { color:#C7C7D0; }
  .f-txt { resize:none; line-height:1.7; }

  .pt-wrap { position:relative; }
  .pt-dropdown { position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:250; background:#fff; border:1px solid #E5E7EB; border-radius:12px; max-height:220px; overflow-y:auto; box-shadow:0 10px 30px rgba(0,0,0,0.1); animation:slideDown .15s ease; }
  .pt-item { padding:12px 16px; cursor:pointer; font-size:13px; color:#111827; display:flex; justify-content:space-between; align-items:center; transition:background .12s; border-bottom:1px solid #F3F4F6; }
  .pt-item:last-child { border-bottom:none; }
  .pt-item:hover { background:#EEF2FF; }
  .pt-item-sub { font-size:11px; color:#9CA3AF; }
  .pt-empty { padding:16px; font-size:12px; color:#9CA3AF; text-align:center; }
  .consult-tag { display:inline-flex; align-items:center; gap:7px; padding:8px 14px; background:#ECFDF5; border:1px solid rgba(16,185,129,.2); border-radius:10px; font-size:12px; font-weight:600; color:#059669; margin-top:10px; }

  .med-cols { display:grid; grid-template-columns:2fr 1fr 1fr 36px; gap:8px; margin-bottom:8px; padding:0 2px; }
  .med-col-lbl { font-size:10px; font-weight:700; color:#C7C7D0; text-transform:uppercase; letter-spacing:.5px; }
  .med-row { display:grid; grid-template-columns:2fr 1fr 1fr 36px; gap:8px; align-items:center; margin-bottom:10px; animation:fadeInBg .25s ease; }
  .med-autocomplete { position:relative; }
  .f-inp-med { font-weight:600 !important; }
  .f-inp-poso,.f-inp-duree { font-size:12.5px !important; }

  .sug-box { position:absolute; top:calc(100% + 5px); left:0; right:0; z-index:260; background:#fff; border:1px solid #E5E7EB; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.1); max-height:280px; overflow-y:auto; animation:slideDown .15s ease; }
  .sug-item { padding:11px 16px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:10px; border-bottom:1px solid #F3F4F6; transition:background .12s; }
  .sug-item:last-child { border-bottom:none; }
  .sug-item:hover { background:#F4F5F9; }
  .sug-left { display:flex; align-items:center; gap:10px; }
  .sug-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
  .sug-nom { font-size:13px; font-weight:600; color:#111827; }
  .sug-cat { font-size:10px; font-weight:700; padding:3px 9px; border-radius:20px; white-space:nowrap; }

  .del-btn { width:36px; height:40px; border:none; background:none; border-radius:9px; cursor:pointer; color:#D1D5DB; display:flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0; }
  .del-btn:hover { background:#FEE2E2; color:#EF4444; }

  .add-med-btn { width:100%; margin-top:10px; padding:12px; background:none; border:1.5px dashed #E5E7EB; border-radius:10px; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; color:#4F6BF6; cursor:pointer; transition:all .2s; }
  .add-med-btn:hover { border-color:#4F6BF6; background:#EEF2FF; }

  .err { background:#FEF2F2; border:1px solid rgba(239,68,68,.2); border-radius:10px; padding:12px 16px; color:#EF4444; font-size:12.5px; font-weight:600; margin-bottom:16px; }

  .form-actions { display:flex; gap:12px; padding:20px 28px; background:#F4F5F9; border-top:1px solid #E5E7EB; border-radius:0 0 24px 24px; }
  .btn-cancel { flex:1; padding:12px; background:#fff; border:1px solid #E5E7EB; border-radius:10px; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; color:#9CA3AF; cursor:pointer; transition:all .2s; }
  .btn-cancel:hover { border-color:#111827; color:#111827; }
  .btn-save { flex:2; padding:12px; background:#4F6BF6; border:none; border-radius:10px; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; color:#fff; cursor:pointer; transition:all .2s; box-shadow:0 4px 16px rgba(79,107,246,.25); }
  .btn-save:hover:not(:disabled) { background:#3B52D9; transform:translateY(-1px); }
  .btn-save:disabled { opacity:.4; cursor:not-allowed; }

  .btn-close-modal { width:40px; height:40px; border-radius:50%; background:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.1); transition:transform 0.2s; color:#64748B; flex-shrink:0; }
  .btn-close-modal:hover { transform:rotate(90deg); color:#EF4444; }

  /* Preview panel */
  .layout { display:grid; grid-template-columns:1fr; gap:24px; align-items:start; }
  @media (min-width:1024px) { .layout { grid-template-columns:1fr 400px; } }
  .preview-panel { background:white; border:1px solid #E5E7EB; border-radius:24px; overflow:hidden; display:none; }
  @media (min-width:1024px) { .preview-panel { display:block; position:sticky; top:0; } }
  .paper { background:#fff; border-radius:12px; border:1px solid #E5E7EB; box-shadow:0 2px 10px rgba(0,0,0,.06); font-family:'Playfair Display',serif; overflow:hidden; }
  .paper-stripe { height:4px; background:linear-gradient(90deg,#111827 0%,#4F6BF6 50%,#10B981 100%); }
  .paper-body { padding:28px 24px; }
  .p-head { padding-bottom:14px; border-bottom:2px solid #111827; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-start; }
  .p-dr { font-size:18px; font-weight:700; color:#111827; letter-spacing:-.3px; }
  .p-sub { font-size:11px; color:#9CA3AF; margin-top:4px; line-height:1.7; font-family:'Inter',sans-serif; }
  .p-stamp { width:50px; height:50px; border-radius:50%; border:1.5px dashed #E5E7EB; display:flex; align-items:center; justify-content:center; font-size:7.5px; color:#9CA3AF; text-align:center; font-family:'Inter',sans-serif; line-height:1.3; flex-shrink:0; }
  .p-ttl { text-align:center; font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#111827; padding:8px 0 12px; border-bottom:1px solid #E5E7EB; margin-bottom:16px; font-family:'Inter',sans-serif; }
  .p-meta { display:flex; justify-content:space-between; margin-bottom:20px; gap:16px; }
  .p-meta-item { flex:1; }
  .p-meta-lbl { font-size:9px; font-weight:700; color:#9CA3AF; text-transform:uppercase; letter-spacing:.7px; margin-bottom:4px; font-family:'Inter',sans-serif; }
  .p-meta-val { font-size:13px; font-weight:600; color:#111827; border-bottom:1px solid #D1D5DB; padding-bottom:3px; display:block; min-height:18px; }
  .rx-section-hd { display:flex; align-items:center; gap:10px; margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid #E5E7EB; font-family:'Inter',sans-serif; }
  .rx-section-dot { width:6px; height:6px; border-radius:50%; background:#4F6BF6; flex-shrink:0; }
  .rx-section-lbl { font-size:9.5px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#9CA3AF; }
  .rx-section-count { margin-left:auto; font-size:10px; font-weight:700; color:#4F6BF6; background:#EEF2FF; padding:2px 9px; border-radius:20px; }
  .rx-item { display:flex; align-items:baseline; gap:10px; padding:8px 0; border-bottom:1px solid #F3F4F6; }
  .rx-item:last-child { border-bottom:none; }
  .rx-num { width:20px; height:20px; border-radius:6px; background:#F4F5F9; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; color:#9CA3AF; flex-shrink:0; font-family:'Inter',sans-serif; }
  .rx-body { flex:1; }
  .rx-name { font-size:13px; font-weight:600; color:#111827; line-height:1.4; }
  .rx-det { font-size:11px; color:#9CA3AF; margin-top:2px; font-family:'Inter',sans-serif; }
  .rx-empty { font-size:12px; color:#D1D5DB; font-style:italic; font-family:'Inter',sans-serif; padding:10px 0; }
  .p-notes { font-size:11px; color:#374151; line-height:1.7; margin-top:14px; padding:10px 14px; border:1px dashed #E5E7EB; border-radius:8px; white-space:pre-wrap; font-family:'Inter',sans-serif; background:#F9FAFB; }
  .p-foot { display:flex; justify-content:space-between; align-items:flex-end; margin-top:28px; padding-top:14px; border-top:1px solid #E5E7EB; }
  .p-date { font-size:11px; color:#9CA3AF; font-family:'Inter',sans-serif; }
  .sig-area { text-align:center; }
  .sig-line { width:80px; border-top:1px solid #9CA3AF; margin:0 auto 5px; }
  .sig-name { font-size:11px; color:#374151; font-family:'Inter',sans-serif; font-weight:600; }
  .live-dot { width:8px; height:8px; border-radius:50%; background:#10B981; animation:pulse 2s ease infinite; }

  .spin { animation:spin 1s linear infinite; }
`;

// ─────────────────────────────────────────────
// MED ROW (champ médicament avec autocomplete)
// ─────────────────────────────────────────────

export function MedRow({
  med,
  onRemove,
  onChange,
}: {
  med: Med;
  onRemove: () => void;
  onChange: (f: keyof Med, v: string) => void;
}) {
  const [sugs, setSugs] = useState<typeof MED_DB>([]);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setShow(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNomChange = (val: string) => {
    onChange("nom", val);
    if (val.length >= 2) {
      const results = MED_DB.filter((m) =>
        m.nom.toLowerCase().includes(val.toLowerCase()),
      ).slice(0, 8);
      setSugs(results);
      setShow(results.length > 0);
    } else {
      setSugs([]);
      setShow(false);
    }
  };

  const selectMed = (m: (typeof MED_DB)[0]) => {
    onChange("nom", m.nom);
    setShow(false);
    setSugs([]);
  };

  return (
    <div className="med-row">
      <div ref={ref} className="med-autocomplete">
        <input
          className="f-inp f-inp-med"
          placeholder="Rechercher un médicament…"
          value={med.nom}
          onChange={(e) => handleNomChange(e.target.value)}
          onFocus={() =>
            med.nom.length >= 2 && sugs.length > 0 && setShow(true)
          }
          autoComplete="off"
        />
        {show && sugs.length > 0 && (
          <div className="sug-box">
            {sugs.map((s, i) => (
              <div
                key={i}
                className="sug-item"
                onMouseDown={() => selectMed(s)}
              >
                <div className="sug-left">
                  <span
                    className="sug-dot"
                    style={{ background: CAT_COLORS[s.cat] }}
                  />
                  <span className="sug-nom">{s.nom}</span>
                </div>
                <span
                  className="sug-cat"
                  style={{
                    background: CAT_COLORS[s.cat] + "14",
                    color: CAT_COLORS[s.cat],
                  }}
                >
                  {s.cat}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <input
        className="f-inp f-inp-poso"
        placeholder="Ex : 1cp matin et soir"
        value={med.posologie}
        onChange={(e) => onChange("posologie", e.target.value)}
      />
      <input
        className="f-inp f-inp-duree"
        placeholder="Ex : 7 jours"
        value={med.duree}
        onChange={(e) => onChange("duree", e.target.value)}
      />
      <button className="del-btn" onClick={onRemove} title="Supprimer">
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
