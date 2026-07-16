"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ── Base de données médicaments (à enrichir selon vos besoins) ──────────────
const MEDICAMENTS_DB = [
  // Analgésiques / Anti-inflammatoires
  { nom: "Paracétamol 500mg", categorie: "Analgésique", formes: ["cp", "gel", "supp"] },
  { nom: "Paracétamol 1000mg", categorie: "Analgésique", formes: ["cp", "sachet"] },
  { nom: "Ibuprofène 200mg", categorie: "AINS", formes: ["cp", "gel"] },
  { nom: "Ibuprofène 400mg", categorie: "AINS", formes: ["cp"] },
  { nom: "Ibuprofène 600mg", categorie: "AINS", formes: ["cp"] },
  { nom: "Kétoprofène 50mg", categorie: "AINS", formes: ["cp", "gel"] },
  { nom: "Diclofénac 50mg", categorie: "AINS", formes: ["cp", "sup", "gel"] },
  { nom: "Diclofénac 75mg", categorie: "AINS", formes: ["inj"] },
  { nom: "Naproxène 250mg", categorie: "AINS", formes: ["cp"] },
  { nom: "Naproxène 500mg", categorie: "AINS", formes: ["cp"] },
  { nom: "Acide acétylsalicylique 500mg", categorie: "Analgésique", formes: ["cp"] },
  { nom: "Tramadol 50mg", categorie: "Opioïde faible", formes: ["cp", "gél", "sol"] },
  { nom: "Tramadol 100mg LP", categorie: "Opioïde faible", formes: ["cp LP"] },
  { nom: "Codéine 30mg", categorie: "Opioïde faible", formes: ["cp"] },
  { nom: "Morphine 10mg", categorie: "Opioïde fort", formes: ["cp", "sol", "inj"] },
  // Antibiotiques
  { nom: "Amoxicilline 500mg", categorie: "Antibiotique", formes: ["gél", "sachet"] },
  { nom: "Amoxicilline 1g", categorie: "Antibiotique", formes: ["sachet", "cp"] },
  { nom: "Amoxicilline + Acide clavulanique 500mg/125mg", categorie: "Antibiotique", formes: ["cp", "sachet"] },
  { nom: "Amoxicilline + Acide clavulanique 1g/125mg", categorie: "Antibiotique", formes: ["cp"] },
  { nom: "Azithromycine 250mg", categorie: "Antibiotique", formes: ["cp", "sachet"] },
  { nom: "Azithromycine 500mg", categorie: "Antibiotique", formes: ["cp"] },
  { nom: "Clarithromycine 250mg", categorie: "Antibiotique", formes: ["cp"] },
  { nom: "Clarithromycine 500mg", categorie: "Antibiotique", formes: ["cp"] },
  { nom: "Ciprofloxacine 250mg", categorie: "Antibiotique", formes: ["cp"] },
  { nom: "Ciprofloxacine 500mg", categorie: "Antibiotique", formes: ["cp"] },
  { nom: "Doxycycline 100mg", categorie: "Antibiotique", formes: ["cp", "gél"] },
  { nom: "Métronidazole 250mg", categorie: "Antibiotique", formes: ["cp"] },
  { nom: "Métronidazole 500mg", categorie: "Antibiotique", formes: ["cp", "ovule", "perf"] },
  { nom: "Céfixime 200mg", categorie: "Antibiotique", formes: ["cp", "sachet"] },
  { nom: "Céfuroxime 250mg", categorie: "Antibiotique", formes: ["cp"] },
  { nom: "Tétracycline 250mg", categorie: "Antibiotique", formes: ["gél"] },
  // Antihypertenseurs
  { nom: "Amlodipine 5mg", categorie: "Antihypertenseur", formes: ["cp"] },
  { nom: "Amlodipine 10mg", categorie: "Antihypertenseur", formes: ["cp"] },
  { nom: "Losartan 50mg", categorie: "Antihypertenseur", formes: ["cp"] },
  { nom: "Losartan 100mg", categorie: "Antihypertenseur", formes: ["cp"] },
  { nom: "Ramipril 5mg", categorie: "Antihypertenseur", formes: ["cp"] },
  { nom: "Ramipril 10mg", categorie: "Antihypertenseur", formes: ["cp"] },
  { nom: "Perindopril 5mg", categorie: "Antihypertenseur", formes: ["cp"] },
  { nom: "Bisoprolol 5mg", categorie: "Bêtabloquant", formes: ["cp"] },
  { nom: "Bisoprolol 10mg", categorie: "Bêtabloquant", formes: ["cp"] },
  { nom: "Metoprolol 50mg", categorie: "Bêtabloquant", formes: ["cp"] },
  { nom: "Metoprolol 100mg", categorie: "Bêtabloquant", formes: ["cp LP"] },
  { nom: "Furosémide 40mg", categorie: "Diurétique", formes: ["cp"] },
  { nom: "Hydrochlorothiazide 12.5mg", categorie: "Diurétique", formes: ["cp"] },
  { nom: "Hydrochlorothiazide 25mg", categorie: "Diurétique", formes: ["cp"] },
  // Antidiabétiques
  { nom: "Metformine 500mg", categorie: "Antidiabétique", formes: ["cp"] },
  { nom: "Metformine 850mg", categorie: "Antidiabétique", formes: ["cp"] },
  { nom: "Metformine 1000mg", categorie: "Antidiabétique", formes: ["cp"] },
  { nom: "Glibenclamide 5mg", categorie: "Antidiabétique", formes: ["cp"] },
  { nom: "Sitagliptine 100mg", categorie: "Antidiabétique", formes: ["cp"] },
  { nom: "Insulin Glargine 100 UI/mL", categorie: "Insuline", formes: ["stylo"] },
  // Antihistaminiques
  { nom: "Cétirizine 10mg", categorie: "Antihistaminique", formes: ["cp", "sol"] },
  { nom: "Loratadine 10mg", categorie: "Antihistaminique", formes: ["cp"] },
  { nom: "Desloratadine 5mg", categorie: "Antihistaminique", formes: ["cp"] },
  { nom: "Fexofénadine 120mg", categorie: "Antihistaminique", formes: ["cp"] },
  { nom: "Fexofénadine 180mg", categorie: "Antihistaminique", formes: ["cp"] },
  // Gastro-intestinaux
  { nom: "Oméprazole 20mg", categorie: "IPP", formes: ["gél", "cp"] },
  { nom: "Oméprazole 40mg", categorie: "IPP", formes: ["gél"] },
  { nom: "Pantoprazole 20mg", categorie: "IPP", formes: ["cp"] },
  { nom: "Pantoprazole 40mg", categorie: "IPP", formes: ["cp", "inj"] },
  { nom: "Lansoprazole 15mg", categorie: "IPP", formes: ["gél"] },
  { nom: "Lansoprazole 30mg", categorie: "IPP", formes: ["gél"] },
  { nom: "Métoclopramide 10mg", categorie: "Antiémétique", formes: ["cp", "inj"] },
  { nom: "Dompéridone 10mg", categorie: "Antiémétique", formes: ["cp"] },
  { nom: "Ondansétron 4mg", categorie: "Antiémétique", formes: ["cp", "inj"] },
  { nom: "Ondansétron 8mg", categorie: "Antiémétique", formes: ["cp"] },
  // Vitamines / Suppléments
  { nom: "Vitamine D3 1000 UI", categorie: "Vitamine", formes: ["cp", "gouttes"] },
  { nom: "Vitamine D3 100 000 UI", categorie: "Vitamine", formes: ["ampoule"] },
  { nom: "Vitamine C 500mg", categorie: "Vitamine", formes: ["cp", "sachet"] },
  { nom: "Vitamine B12 1000 µg", categorie: "Vitamine", formes: ["cp", "inj"] },
  { nom: "Acide folique 5mg", categorie: "Vitamine", formes: ["cp"] },
  { nom: "Fer 80mg", categorie: "Supplément", formes: ["cp", "sol"] },
  { nom: "Magnésium 300mg", categorie: "Supplément", formes: ["cp", "sachet"] },
  { nom: "Calcium 500mg + Vit D", categorie: "Supplément", formes: ["cp"] },
  // Respiratoires
  { nom: "Salbutamol 100µg/dose", categorie: "Bronchodilatateur", formes: ["inhalateur"] },
  { nom: "Salmétérol 50µg/dose", categorie: "Bronchodilatateur", formes: ["inhalateur"] },
  { nom: "Fluticasone 50µg/dose", categorie: "Corticoïde inhalé", formes: ["inhalateur"] },
  { nom: "Béclométasone 100µg/dose", categorie: "Corticoïde inhalé", formes: ["inhalateur"] },
  { nom: "Prednisolone 20mg", categorie: "Corticoïde", formes: ["cp"] },
  { nom: "Prednisolone 5mg", categorie: "Corticoïde", formes: ["cp"] },
  { nom: "Methylprednisolone 16mg", categorie: "Corticoïde", formes: ["cp"] },
  { nom: "Budesonide 200µg/dose", categorie: "Corticoïde inhalé", formes: ["inhalateur"] },
  // Antidépresseurs / Neurologie
  { nom: "Sertraline 50mg", categorie: "Antidépresseur ISRS", formes: ["cp"] },
  { nom: "Sertraline 100mg", categorie: "Antidépresseur ISRS", formes: ["cp"] },
  { nom: "Escitalopram 10mg", categorie: "Antidépresseur ISRS", formes: ["cp"] },
  { nom: "Escitalopram 20mg", categorie: "Antidépresseur ISRS", formes: ["cp"] },
  { nom: "Fluoxétine 20mg", categorie: "Antidépresseur ISRS", formes: ["gél"] },
  { nom: "Amitriptyline 25mg", categorie: "Antidépresseur tricyclique", formes: ["cp"] },
  { nom: "Alprazolam 0.25mg", categorie: "Anxiolytique", formes: ["cp"] },
  { nom: "Alprazolam 0.5mg", categorie: "Anxiolytique", formes: ["cp"] },
  { nom: "Bromazépam 6mg", categorie: "Anxiolytique", formes: ["cp"] },
  { nom: "Zolpidem 10mg", categorie: "Hypnotique", formes: ["cp"] },
  { nom: "Gabapentine 300mg", categorie: "Antiépileptique", formes: ["gél"] },
  { nom: "Carbamazépine 200mg", categorie: "Antiépileptique", formes: ["cp"] },
  // Cardiovasculaires
  { nom: "Atorvastatine 10mg", categorie: "Statine", formes: ["cp"] },
  { nom: "Atorvastatine 20mg", categorie: "Statine", formes: ["cp"] },
  { nom: "Atorvastatine 40mg", categorie: "Statine", formes: ["cp"] },
  { nom: "Rosuvastatine 10mg", categorie: "Statine", formes: ["cp"] },
  { nom: "Rosuvastatine 20mg", categorie: "Statine", formes: ["cp"] },
  { nom: "Simvastatine 20mg", categorie: "Statine", formes: ["cp"] },
  { nom: "Aspirine 100mg", categorie: "Antiagrégant plaquettaire", formes: ["cp"] },
  { nom: "Clopidogrel 75mg", categorie: "Antiagrégant plaquettaire", formes: ["cp"] },
  { nom: "Warfarine 2mg", categorie: "Anticoagulant", formes: ["cp"] },
  { nom: "Rivaroxaban 10mg", categorie: "Anticoagulant", formes: ["cp"] },
  { nom: "Rivaroxaban 20mg", categorie: "Anticoagulant", formes: ["cp"] },
];

// ── Types ──────────────────────────────────────────────────────────────────
interface Medicament {
  nom: string;
  categorie: string;
  formes: string[];
}

interface MedicamentEntry {
  medicament: Medicament | null;
  posologie: string;
  duree: string;
  instructions: string;
}

interface Props {
  value: MedicamentEntry[];
  onChange: (entries: MedicamentEntry[]) => void;
}

// ── Couleurs par catégorie ─────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Analgésique":              { bg: "#FEF3C7", text: "#92400E" },
  "AINS":                     { bg: "#FEF3C7", text: "#92400E" },
  "Opioïde faible":           { bg: "#FEE2E2", text: "#991B1B" },
  "Opioïde fort":             { bg: "#FEE2E2", text: "#991B1B" },
  "Antibiotique":             { bg: "#DCFCE7", text: "#166534" },
  "Antihypertenseur":         { bg: "#DBEAFE", text: "#1E40AF" },
  "Bêtabloquant":             { bg: "#EDE9FE", text: "#5B21B6" },
  "Diurétique":               { bg: "#DBEAFE", text: "#1E40AF" },
  "Antidiabétique":           { bg: "#F0FDFA", text: "#134E4A" },
  "Insuline":                 { bg: "#F0FDFA", text: "#134E4A" },
  "Antihistaminique":         { bg: "#FCE7F3", text: "#831843" },
  "IPP":                      { bg: "#F3F4F6", text: "#374151" },
  "Antiémétique":             { bg: "#F3F4F6", text: "#374151" },
  "Vitamine":                 { bg: "#FFF7ED", text: "#9A3412" },
  "Supplément":               { bg: "#FFF7ED", text: "#9A3412" },
  "Bronchodilatateur":        { bg: "#EFF6FF", text: "#1D4ED8" },
  "Corticoïde inhalé":        { bg: "#EFF6FF", text: "#1D4ED8" },
  "Corticoïde":               { bg: "#EFF6FF", text: "#1D4ED8" },
  "Antidépresseur ISRS":      { bg: "#FDF4FF", text: "#6B21A8" },
  "Antidépresseur tricyclique":{ bg: "#FDF4FF", text: "#6B21A8" },
  "Anxiolytique":             { bg: "#FDF4FF", text: "#6B21A8" },
  "Hypnotique":               { bg: "#FDF4FF", text: "#6B21A8" },
  "Antiépileptique":          { bg: "#FDF4FF", text: "#6B21A8" },
  "Statine":                  { bg: "#ECFDF5", text: "#064E3B" },
  "Antiagrégant plaquettaire":{ bg: "#ECFDF5", text: "#064E3B" },
  "Anticoagulant":            { bg: "#FEE2E2", text: "#991B1B" },
};

const catColor = (cat: string) => CATEGORY_COLORS[cat] ?? { bg: "#F3F4F6", text: "#374151" };

// ── Highlight matching text ─────────────────────────────────────────────────
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: "rgba(79,107,246,.18)", color: "#3B52D9", borderRadius: 3, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Single-row autocomplete input ──────────────────────────────────────────
function MedRow({
  entry, index, onUpdate, onRemove, showRemove,
}: {
  entry: MedicamentEntry;
  index: number;
  onUpdate: (idx: number, field: keyof MedicamentEntry, value: string | Medicament | null) => void;
  onRemove: (idx: number) => void;
  showRemove: boolean;
}) {
  const [query, setQuery]         = useState(entry.medicament?.nom ?? "");
  const [open, setOpen]           = useState(false);
  const [highlighted, setHigh]    = useState(0);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const dropRef                   = useRef<HTMLDivElement>(null);

  const results: Medicament[] = query.trim().length < 1 ? [] :
    MEDICAMENTS_DB.filter(m =>
      m.nom.toLowerCase().includes(query.toLowerCase()) ||
      m.categorie.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

  const select = useCallback((med: Medicament) => {
    setQuery(med.nom);
    onUpdate(index, "medicament", med);
    setOpen(false);
    setHigh(0);
  }, [index, onUpdate]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHigh(h => Math.min(h + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setHigh(h => Math.max(h - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); select(results[highlighted]); }
    if (e.key === "Escape")    { setOpen(false); }
  };

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const col = entry.medicament ? catColor(entry.medicament.categorie) : null;

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid #F3F4F6", position: "relative" }}>
      {/* Numéro */}
      <div style={{ width: 26, height: 26, borderRadius: 8, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#4F6BF6", flexShrink: 0, marginTop: 9 }}>
        {index + 1}
      </div>

      {/* Autocomplete médicament */}
      <div style={{ flex: "0 0 300px", position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#F9FAFB", border: `1.5px solid ${open ? "#4F6BF6" : entry.medicament ? "#D1FAE5" : "#E5E7EB"}`,
          borderRadius: 10, padding: "0 12px", height: 40, transition: "all .2s",
          boxShadow: open ? "0 0 0 3px rgba(79,107,246,.1)" : "none",
        }}>
          <span style={{ fontSize: 14, opacity: .5 }}>💊</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); setHigh(0); onUpdate(index, "medicament", null); }}
            onFocus={() => { if (query.length >= 1) setOpen(true); }}
            onKeyDown={handleKey}
            placeholder="Nom du médicament…"
            style={{ flex: 1, border: "none", background: "transparent", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#111827", outline: "none" }}
          />
          {entry.medicament && (
            <button onClick={() => { setQuery(""); onUpdate(index, "medicament", null); setOpen(false); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 13, padding: 2, lineHeight: 1 }}>
              ✕
            </button>
          )}
        </div>

        {/* Badge catégorie */}
        {entry.medicament && col && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: col.bg, color: col.text, padding: "2px 8px", borderRadius: 20 }}>
              {entry.medicament.categorie}
            </span>
            {entry.medicament.formes.map(f => (
              <span key={f} style={{ fontSize: 10, color: "#6B7280", background: "#F3F4F6", padding: "2px 6px", borderRadius: 12 }}>{f}</span>
            ))}
          </div>
        )}

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div ref={dropRef} style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999,
            background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12,
            boxShadow: "0 12px 40px rgba(0,0,0,.12)", overflow: "hidden",
            maxHeight: 320, overflowY: "auto",
          }}>
            {results.map((med, i) => {
              const c = catColor(med.categorie);
              return (
                <div key={med.nom}
                  onMouseDown={(e) => { e.preventDefault(); select(med); }}
                  onMouseEnter={() => setHigh(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    cursor: "pointer", transition: "background .1s",
                    background: i === highlighted ? "#EEF2FF" : "#fff",
                    borderBottom: i < results.length - 1 ? "1px solid #F9FAFB" : "none",
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.text, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                      <HighlightMatch text={med.nom} query={query} />
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                      {med.categorie} · {med.formes.join(", ")}
                    </div>
                  </div>
                  {i === highlighted && (
                    <span style={{ fontSize: 10, color: "#4F6BF6", fontWeight: 700 }}>Entrée ↵</span>
                  )}
                </div>
              );
            })}
            {results.length === 10 && (
              <div style={{ padding: "8px 14px", fontSize: 11, color: "#9CA3AF", textAlign: "center", background: "#F9FAFB", borderTop: "1px solid #F3F4F6" }}>
                Affichage des 10 premiers résultats — affinez la recherche
              </div>
            )}
          </div>
        )}

        {/* No results */}
        {open && query.length >= 1 && results.length === 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999,
            background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,.08)", padding: "14px 16px", textAlign: "center",
          }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>🔍</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Aucun médicament trouvé pour « {query} »</div>
            <div style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4 }}>Vous pouvez saisir manuellement le médicament</div>
          </div>
        )}
      </div>

      {/* Posologie */}
      <input
        value={entry.posologie}
        onChange={e => onUpdate(index, "posologie", e.target.value)}
        placeholder="Posologie (ex: 1 cp × 3/j)"
        style={{
          flex: 1, height: 40, border: "1.5px solid #E5E7EB", borderRadius: 10,
          padding: "0 12px", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#111827",
          background: "#F9FAFB", outline: "none", transition: "border-color .2s",
        }}
        onFocus={e => (e.target.style.borderColor = "#4F6BF6")}
        onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
      />

      {/* Durée */}
      <input
        value={entry.duree}
        onChange={e => onUpdate(index, "duree", e.target.value)}
        placeholder="Durée (ex: 7 jours)"
        style={{
          width: 130, height: 40, border: "1.5px solid #E5E7EB", borderRadius: 10,
          padding: "0 12px", fontFamily: "'Inter',sans-serif", fontSize: 13, color: "#111827",
          background: "#F9FAFB", outline: "none", transition: "border-color .2s",
        }}
        onFocus={e => (e.target.style.borderColor = "#4F6BF6")}
        onBlur={e => (e.target.style.borderColor = "#E5E7EB")}
      />

      {/* Supprimer */}
      {showRemove && (
        <button
          onClick={() => onRemove(index)}
          style={{
            width: 36, height: 40, border: "1.5px solid #FEE2E2", borderRadius: 10,
            background: "#FEF2F2", color: "#EF4444", fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            transition: "all .15s",
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = "#FECACA"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = "#FEF2F2"; }}
          title="Supprimer ce médicament"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
export default function MedicamentAutocomplete({ value, onChange }: Props) {
  const addRow = () => {
    onChange([...value, { medicament: null, posologie: "", duree: "", instructions: "" }]);
  };

  const updateRow = (idx: number, field: keyof MedicamentEntry, val: string | Medicament | null) => {
    const next = value.map((e, i) => i === idx ? { ...e, [field]: val } : e);
    onChange(next);
  };

  const removeRow = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  // Serialise vers le format texte attendu par l'API
  // Format : "- NomMedicament — Posologie, Durée\n..."
  const toText = (): string =>
    value
      .filter(e => e.medicament || e.posologie)
      .map(e => {
        const nom = e.medicament?.nom ?? "Médicament non spécifié";
        const details = [e.posologie, e.duree].filter(Boolean).join(", ");
        return `- ${nom}${details ? ` — ${details}` : ""}`;
      })
      .join("\n");

  return (
    <div>
      {/* En-tête colonnes */}
      <div style={{ display: "flex", gap: 10, paddingBottom: 8, borderBottom: "1px solid #F3F4F6", marginBottom: 0 }}>
        <div style={{ width: 26, flexShrink: 0 }} />
        <div style={{ flex: "0 0 300px", fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase" }}>Médicament</div>
        <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase" }}>Posologie</div>
        <div style={{ width: 130, fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase" }}>Durée</div>
        <div style={{ width: 36 }} />
      </div>

      {value.map((entry, i) => (
        <MedRow
          key={i}
          entry={entry}
          index={i}
          onUpdate={updateRow}
          onRemove={removeRow}
          showRemove={value.length > 1}
        />
      ))}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14 }}>
        <button
          onClick={addRow}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#EEF2FF", border: "1.5px dashed #A5B4FC",
            borderRadius: 10, padding: "9px 18px", color: "#4F6BF6",
            fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
            transition: "all .2s",
          }}
          onMouseEnter={e => { const t = e.currentTarget; t.style.background = "#DDE3FD"; t.style.borderColor = "#4F6BF6"; }}
          onMouseLeave={e => { const t = e.currentTarget; t.style.background = "#EEF2FF"; t.style.borderColor = "#A5B4FC"; }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span>
          Ajouter un médicament
        </button>

        {value.some(e => e.medicament) && (
          <div style={{ fontSize: 11, color: "#9CA3AF", fontStyle: "italic" }}>
            {value.filter(e => e.medicament).length} médicament{value.filter(e => e.medicament).length > 1 ? "s" : ""} sélectionné{value.filter(e => e.medicament).length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Champ caché avec la valeur sérialisée pour l'API */}
      <textarea
        readOnly
        hidden
        name="medicaments_serialized"
        value={toText()}
        style={{ display: "none" }}
      />
    </div>
  );
}

// ── Export du sérialiseur pour l'utiliser dans le formulaire parent ──────
export function serializeMedicaments(entries: MedicamentEntry[]): string {
  return entries
    .filter(e => e.medicament || e.posologie)
    .map(e => {
      const nom = e.medicament?.nom ?? "Médicament non spécifié";
      const details = [e.posologie, e.duree].filter(Boolean).join(", ");
      return `- ${nom}${details ? ` — ${details}` : ""}`;
    })
    .join("\n");
}

export type { MedicamentEntry, Medicament };