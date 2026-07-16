"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import PrivateRoute from "../../../../../components/PrivateRoute";
import api from "../../../../../lib/api";
import Sidebar from "../../../../../components/Sidebar";
import Navbar from "../../../../../components/Navbar";

interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
}
interface Consultation {
  id: number;
  patient_name: string;
  date_heure: string;
}
interface Med {
  id: number;
  nom: string;
  posologie: string;
  duree: string;
}

const MED_DB = [
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

const CAT_COLORS: Record<string, string> = {
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
const newMed = (): Med => ({ id: ++_id, nom: "", posologie: "", duree: "" });

function MedRow({
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
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function NouvelleOrdonnance() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultationId, setConsultationId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [drSpec, setDrSpec] = useState("Médecin généraliste");
  const [drRpps, setDrRpps] = useState("");
  const [drTel, setDrTel] = useState("");
  const [drVille, setDrVille] = useState("");
  const [ptDob, setPtDob] = useState("");
  const [meds, setMeds] = useState<Med[]>([newMed()]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addMed = useCallback(() => setMeds((p) => [...p, newMed()]), []);
  const removeMed = useCallback(
    (id: number) =>
      setMeds((p) => (p.length > 1 ? p.filter((m) => m.id !== id) : p)),
    [],
  );
  const chgMed = useCallback(
    (id: number, f: keyof Med, v: string) =>
      setMeds((p) => p.map((m) => (m.id === id ? { ...m, [f]: v } : m))),
    [],
  );

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("ordonnances/"),
    ])
      .then(([r, c, o]) => {
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
        });
        setConsultations(c.data);
      })
      .catch(() => {});
  }, [token, isLoading]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (isLoading) return null;

  const activeMeds = meds.filter((m) => m.nom.trim());
  const selectedConsult = consultations.find(
    (c) => String(c.id) === consultationId,
  );
  const patientName = selectedConsult?.patient_name ?? "";
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const filteredConsults = consultations.filter((c) =>
    c.patient_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSave = async () => {
    if (!consultationId) {
      setErrorMsg("Sélectionnez une consultation.");
      return;
    }
    if (activeMeds.length === 0) {
      setErrorMsg("Ajoutez au moins un médicament.");
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    try {
      const consultationIdInt = parseInt(consultationId, 10);
      if (isNaN(consultationIdInt)) {
        setErrorMsg("ID de consultation invalide.");
        setSaving(false);
        return;
      }
      const medText =
        activeMeds
          .map(
            (m) =>
              `- ${m.nom}${m.posologie ? ` — ${m.posologie}` : ""}${m.duree ? `, ${m.duree}` : ""}`,
          )
          .join("\n") + (notes.trim() ? `\n\nNotes :\n${notes.trim()}` : "");
      await api.post("ordonnances/", {
        consultation: consultationIdInt,
        medicaments: medText,
      });
      router.push("/dashboard/medecin/ordonnances");
    } catch (err: any) {
      const d = err?.response?.data;
      if (d && typeof d === "object") {
        const msg = Object.entries(d)
          .map(
            ([k, v]) =>
              `${k} : ${Array.isArray(v) ? (v as string[]).join(", ") : String(v)}`,
          )
          .join(" | ");
        setErrorMsg(msg);
      } else if (typeof d === "string") {
        setErrorMsg(d);
      } else {
        setErrorMsg(
          `Erreur ${err?.response?.status ?? ""} — vérifiez les champs.`,
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');

        @keyframes fadeUp    { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn    { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px) scale(.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes pulse     { 0%, 100% { opacity: 1 } 50% { opacity: .4 } }

        /* ── Reset ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Root layout ── */
        .no-root { min-height: 100vh; background: #F4F5F9; font-family: 'Inter', sans-serif; display: flex; }
        .no-main { margin-left: 260px; flex: 1; padding: 2rem 2.5rem; padding-top: calc(70px + 2rem); }

        /* ── Page header ── */
        .no-page-hd { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; animation: fadeUp .5s ease; }
        .no-btn-back { width: 42px; height: 42px; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #9CA3AF; transition: all .2s; flex-shrink: 0; }
        .no-btn-back:hover { border-color: #4F6BF6; color: #4F6BF6; background: #EEF2FF; }
        .no-hd-text h1 { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 600; color: #111827; letter-spacing: -.3px; }
        .no-hd-text p { font-size: 13px; color: #9CA3AF; margin-top: 2px; }

        /* ── Two-column layout ── */
        .no-layout { display: grid; grid-template-columns: 1fr 420px; gap: 24px; align-items: start; animation: fadeUp .55s ease .05s backwards; }

        /* ── Form panel ── */
        .no-form-panel { background: #FFFFFF; border-radius: 20px; border: 1px solid #E5E7EB; overflow: visible; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
        .no-section { padding: 24px 28px; border-bottom: 1px solid #F3F4F6; }
        .no-section:last-of-type { border-bottom: none; }
        .no-sec-hd { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .no-sec-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .no-sec-icon.dr { background: linear-gradient(135deg, #EEF2FF, #E0E7FF); }
        .no-sec-icon.pt { background: linear-gradient(135deg, #ECFDF5, #D1FAE5); }
        .no-sec-icon.rx { background: linear-gradient(135deg, #EEF2FF, #E0E7FF); }
        .no-sec-icon.nt { background: linear-gradient(135deg, #FEF3C7, #FDE68A); }
        .no-sec-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #111827; }

        /* ── Grid & fields ── */
        .no-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .no-field { display: flex; flex-direction: column; gap: 6px; }
        .no-field label { font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: .6px; }
        .no-req { color: #EF4444; }

        /* ── Inputs ── */
        .no-inp, .no-txt {
          width: 100%;
          padding: 11px 14px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #111827;
          background: #F4F5F9;
          border: 1.5px solid #E5E7EB;
          border-radius: 10px;
          outline: none;
          transition: border-color .2s, background .2s, box-shadow .2s;
        }
        .no-inp:focus, .no-txt:focus {
          border-color: #4F6BF6;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(79, 107, 246, .10);
        }
        .no-inp::placeholder, .no-txt::placeholder { color: #C7C7D0; }
        .no-txt { resize: none; line-height: 1.7; }
        .no-inp-bold { font-weight: 600; }
        .no-inp-sm { font-size: 12.5px; }

        /* ── Patient dropdown ── */
        .no-pt-wrap { position: relative; }
        .no-pt-dropdown {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 30;
          background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 12px;
          max-height: 220px; overflow-y: auto;
          box-shadow: 0 12px 40px rgba(0,0,0,.08);
          animation: slideDown .15s ease;
        }
        .no-pt-item { padding: 12px 16px; cursor: pointer; font-size: 13px; color: #111827; display: flex; justify-content: space-between; align-items: center; transition: background .12s; border-bottom: 1px solid #F3F4F6; }
        .no-pt-item:last-child { border-bottom: none; }
        .no-pt-item:hover { background: #EEF2FF; }
        .no-pt-item-sub { font-size: 11px; color: #9CA3AF; }
        .no-pt-empty { padding: 16px; font-size: 12px; color: #9CA3AF; text-align: center; }
        .no-consult-tag { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; background: #ECFDF5; border: 1px solid rgba(16,185,129,.2); border-radius: 10px; font-size: 12px; font-weight: 600; color: #10B981; margin-top: 10px; }

        /* ── Médicaments ── */
        .no-med-cols { display: grid; grid-template-columns: 2fr 1fr 1fr 36px; gap: 8px; margin-bottom: 8px; padding: 0 2px; }
        .no-med-col-lbl { font-size: 10px; font-weight: 700; color: #C7C7D0; text-transform: uppercase; letter-spacing: .5px; }

        .no-med-row { display: grid; grid-template-columns: 2fr 1fr 1fr 36px; gap: 8px; align-items: center; margin-bottom: 10px; animation: fadeIn .25s ease; }
        .no-med-auto { position: relative; }

        .no-sug-box {
          position: absolute; top: calc(100% + 5px); left: 0; right: 0; z-index: 40;
          background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,.08); max-height: 280px; overflow-y: auto;
          animation: slideDown .15s ease;
        }
        .no-sug-item { padding: 11px 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 10px; border-bottom: 1px solid #F3F4F6; transition: background .12s; }
        .no-sug-item:last-child { border-bottom: none; }
        .no-sug-item:hover { background: #F4F5F9; }
        .no-sug-left { display: flex; align-items: center; gap: 10px; }
        .no-sug-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .no-sug-nom { font-size: 13px; font-weight: 600; color: #111827; }
        .no-sug-cat { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }

        .no-del-btn { width: 36px; height: 40px; border: none; background: none; border-radius: 9px; cursor: pointer; color: #D1D5DB; display: flex; align-items: center; justify-content: center; transition: all .2s; flex-shrink: 0; }
        .no-del-btn:hover { background: #FEF2F2; color: #EF4444; }

        .no-add-med-btn { width: 100%; margin-top: 10px; padding: 12px; background: none; border: 1.5px dashed #E5E7EB; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #4F6BF6; cursor: pointer; transition: all .2s; }
        .no-add-med-btn:hover { border-color: #4F6BF6; background: #EEF2FF; }

        /* ── Error ── */
        .no-err { background: #FEF2F2; border: 1px solid rgba(239,68,68,.2); border-radius: 10px; padding: 12px 16px; color: #EF4444; font-size: 12.5px; font-weight: 600; margin-bottom: 16px; display: flex; gap: 8px; align-items: flex-start; }

        /* ── Actions ── */
        .no-actions { display: flex; gap: 12px; padding: 20px 28px; background: #F4F5F9; border-top: 1px solid #E5E7EB; border-radius: 0 0 20px 20px; }
        .no-btn-cancel { flex: 1; padding: 12px; background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #9CA3AF; cursor: pointer; transition: all .2s; }
        .no-btn-cancel:hover { border-color: #111827; color: #111827; }
        .no-btn-save { flex: 2; padding: 12px; background: #4F6BF6; border: none; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #FFFFFF; cursor: pointer; transition: all .2s; box-shadow: 0 4px 16px rgba(79,107,246,.25); }
        .no-btn-save:hover:not(:disabled) { background: #3B52D9; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(79,107,246,.35); }
        .no-btn-save:disabled { opacity: .4; cursor: not-allowed; transform: none; }

        /* ── Preview panel ── */
        .no-preview { position: sticky; top: calc(70px + 2rem); animation: fadeUp .6s ease .1s backwards; }
        .no-preview-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .no-preview-lbl { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #111827; display: flex; align-items: center; gap: 9px; }
        .no-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #10B981; animation: pulse 2s ease infinite; }
        .no-preview-btn { padding: 8px 14px; background: #FFFFFF; border: 1.5px solid #E5E7EB; border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: #9CA3AF; cursor: pointer; transition: all .2s; }
        .no-preview-btn:hover { border-color: #4F6BF6; color: #4F6BF6; }

        /* ── Paper ── */
        .no-paper { background: #FFFFFF; border-radius: 12px; border: 1px solid #E5E7EB; box-shadow: 0 4px 20px rgba(0,0,0,.06); font-family: 'Playfair Display', serif; overflow: hidden; transition: box-shadow .3s; }
        .no-paper:hover { box-shadow: 0 12px 40px rgba(0,0,0,.08); }
        .no-paper-stripe { height: 4px; background: linear-gradient(90deg, #111827 0%, #4F6BF6 50%, #10B981 100%); }
        .no-paper-body { padding: 28px 24px; }

        .no-p-head { padding-bottom: 14px; border-bottom: 2px solid #111827; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
        .no-p-dr { font-size: 18px; font-weight: 700; color: #111827; letter-spacing: -.3px; }
        .no-p-sub { font-size: 11px; color: #9CA3AF; margin-top: 4px; line-height: 1.7; font-family: 'Inter', sans-serif; font-weight: 400; }
        .no-p-stamp { width: 50px; height: 50px; border-radius: 50%; border: 1.5px dashed #E5E7EB; display: flex; align-items: center; justify-content: center; font-size: 7.5px; color: #9CA3AF; text-align: center; font-family: 'Inter', sans-serif; line-height: 1.3; flex-shrink: 0; }

        .no-p-ttl { text-align: center; font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #111827; padding: 8px 0 12px; border-bottom: 1px solid #E5E7EB; margin-bottom: 16px; font-family: 'Inter', sans-serif; }

        .no-p-meta { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 16px; }
        .no-p-meta-item { flex: 1; }
        .no-p-meta-lbl { font-size: 9px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 4px; font-family: 'Inter', sans-serif; }
        .no-p-meta-val { font-size: 13px; font-weight: 600; color: #111827; border-bottom: 1px solid #D1D5DB; padding-bottom: 3px; display: block; min-height: 18px; }

        .no-rx-hd { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB; font-family: 'Inter', sans-serif; }
        .no-rx-dot { width: 6px; height: 6px; border-radius: 50%; background: #4F6BF6; flex-shrink: 0; }
        .no-rx-lbl { font-size: 9.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #9CA3AF; }
        .no-rx-count { margin-left: auto; font-size: 10px; font-weight: 700; color: #4F6BF6; background: #EEF2FF; padding: 2px 9px; border-radius: 20px; }

        .no-rx-item { display: flex; align-items: baseline; gap: 10px; padding: 8px 0; border-bottom: 1px solid #F3F4F6; }
        .no-rx-item:last-child { border-bottom: none; }
        .no-rx-num { width: 20px; height: 20px; border-radius: 6px; background: #F4F5F9; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #9CA3AF; flex-shrink: 0; font-family: 'Inter', sans-serif; }
        .no-rx-body { flex: 1; }
        .no-rx-name { font-size: 13px; font-weight: 600; color: #111827; line-height: 1.4; }
        .no-rx-det { font-size: 11px; color: #9CA3AF; margin-top: 2px; font-family: 'Inter', sans-serif; }
        .no-rx-empty { font-size: 12px; color: #D1D5DB; font-style: italic; font-family: 'Inter', sans-serif; padding: 10px 0; }

        .no-p-notes { font-size: 11px; color: #374151; line-height: 1.7; margin-top: 14px; padding: 10px 14px; border: 1px dashed #E5E7EB; border-radius: 8px; white-space: pre-wrap; font-family: 'Inter', sans-serif; background: #F9FAFB; }

        .no-p-foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; padding-top: 14px; border-top: 1px solid #E5E7EB; }
        .no-p-date { font-size: 11px; color: #9CA3AF; font-family: 'Inter', sans-serif; }
        .no-sig-area { text-align: center; }
        .no-sig-line { width: 80px; border-top: 1px solid #9CA3AF; margin: 0 auto 5px; }
        .no-sig-name { font-size: 11px; color: #374151; font-family: 'Inter', sans-serif; font-weight: 600; }

        @media print {
          .no-preview, .no-page-hd { display: none !important; }
          .no-main { margin-left: 0 !important; padding: 0 !important; }
          .no-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="no-root">
        <Sidebar stats={stats} />
        <Navbar title="Nouvelle ordonnance" subtitle={`Dr. ${username}`} />

        <main className="no-main">
          {/* Header */}
          <div className="no-page-hd">
            <button
              className="no-btn-back"
              onClick={() => router.push("/dashboard/medecin/ordonnances")}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="no-hd-text">
              <h1>Nouvelle ordonnance</h1>
              <p>
                Dr. {username} · {today}
              </p>
            </div>
          </div>

          <div className="no-layout">
            {/* ── FORMULAIRE ── */}
            <div className="no-form-panel">
              {/* Section médecin */}
              <div className="no-section">
                <div className="no-sec-hd">
                  <div className="no-sec-icon dr">🩺</div>
                  <span className="no-sec-title">Médecin prescripteur</span>
                </div>
                <div className="no-grid2" style={{ marginBottom: 14 }}>
                  <div className="no-field">
                    <label>Spécialité</label>
                    <input
                      className="no-inp"
                      value={drSpec}
                      onChange={(e) => setDrSpec(e.target.value)}
                      placeholder="Médecin généraliste"
                    />
                  </div>
                  <div className="no-field">
                    <label>N° RPPS</label>
                    <input
                      className="no-inp"
                      value={drRpps}
                      onChange={(e) => setDrRpps(e.target.value)}
                      placeholder="Optionnel"
                    />
                  </div>
                </div>
                <div className="no-grid2">
                  <div className="no-field">
                    <label>Téléphone</label>
                    <input
                      className="no-inp"
                      value={drTel}
                      onChange={(e) => setDrTel(e.target.value)}
                      placeholder="+216 xx xxx xxx"
                    />
                  </div>
                  <div className="no-field">
                    <label>Ville</label>
                    <input
                      className="no-inp"
                      value={drVille}
                      onChange={(e) => setDrVille(e.target.value)}
                      placeholder="Tunis"
                    />
                  </div>
                </div>
              </div>

              {/* Section patient */}
              <div className="no-section">
                <div className="no-sec-hd">
                  <div className="no-sec-icon pt">👤</div>
                  <span className="no-sec-title">Patient & consultation</span>
                </div>
                {errorMsg && (
                  <div className="no-err">
                    <span>⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}
                <div className="no-grid2">
                  <div className="no-field">
                    <label>
                      Recherche patient <span className="no-req">*</span>
                    </label>
                    <div ref={wrapperRef} className="no-pt-wrap">
                      <input
                        className="no-inp"
                        placeholder="Tapez le nom du patient…"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setConsultationId("");
                          setShowDropdown(true);
                        }}
                        onFocus={() => searchQuery && setShowDropdown(true)}
                        autoComplete="off"
                      />
                      {showDropdown && searchQuery && !consultationId && (
                        <div className="no-pt-dropdown">
                          {filteredConsults.length === 0 ? (
                            <div className="no-pt-empty">
                              Aucun patient trouvé
                            </div>
                          ) : (
                            filteredConsults.map((c) => (
                              <div
                                key={c.id}
                                className="no-pt-item"
                                onMouseDown={() => {
                                  setConsultationId(String(c.id));
                                  setSearchQuery(c.patient_name);
                                  setShowDropdown(false);
                                }}
                              >
                                <strong>{c.patient_name}</strong>
                                <span className="no-pt-item-sub">
                                  {new Date(c.date_heure).toLocaleDateString(
                                    "fr-FR",
                                  )}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {selectedConsult && (
                      <div className="no-consult-tag">
                        ✓ {selectedConsult.patient_name} —{" "}
                        {new Date(
                          selectedConsult.date_heure,
                        ).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                  <div className="no-field">
                    <label>Date de naissance</label>
                    <input
                      className="no-inp"
                      type="date"
                      value={ptDob}
                      onChange={(e) => setPtDob(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section prescription */}
              <div className="no-section">
                <div className="no-sec-hd">
                  <div className="no-sec-icon rx">💊</div>
                  <span className="no-sec-title">
                    Prescription{" "}
                    <span style={{ color: "#EF4444", fontSize: 13 }}>*</span>
                  </span>
                </div>
                <div className="no-med-cols">
                  <span className="no-med-col-lbl">Médicament</span>
                  <span className="no-med-col-lbl">Posologie</span>
                  <span className="no-med-col-lbl">Durée</span>
                  <span />
                </div>
                {meds.map((m) => (
                  <div key={m.id} className="no-med-row">
                    <div className="no-med-auto" ref={undefined}>
                      <MedRowInner
                        med={m}
                        onRemove={() => removeMed(m.id)}
                        onChange={(f, v) => chgMed(m.id, f, v)}
                      />
                    </div>
                  </div>
                ))}
                <button className="no-add-med-btn" onClick={addMed}>
                  ＋ Ajouter un médicament
                </button>
              </div>

              {/* Section notes */}
              <div className="no-section">
                <div className="no-sec-hd">
                  <div className="no-sec-icon nt">📝</div>
                  <span className="no-sec-title">Notes & conseils</span>
                </div>
                <textarea
                  className="no-txt"
                  rows={3}
                  placeholder="Conseils, régime alimentaire, précautions, suivi…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="no-actions">
                <button
                  className="no-btn-cancel"
                  onClick={() => router.push("/dashboard/medecin/ordonnances")}
                >
                  Annuler
                </button>
                <button
                  className="no-btn-save"
                  onClick={handleSave}
                  disabled={
                    saving || !consultationId || activeMeds.length === 0
                  }
                >
                  {saving ? "Enregistrement…" : "Valider l'ordonnance"}
                </button>
              </div>
            </div>

            {/* ── APERÇU ── */}
            <div className="no-preview">
              <div className="no-preview-top">
                <span className="no-preview-lbl">
                  <span className="no-live-dot" /> Aperçu en direct
                </span>
                <button
                  className="no-preview-btn"
                  onClick={() => window.print()}
                >
                  🖨 Imprimer
                </button>
              </div>
              <div className="no-paper">
                <div className="no-paper-stripe" />
                <div className="no-paper-body">
                  <div className="no-p-head">
                    <div>
                      <div className="no-p-dr">Dr. {username}</div>
                      <div className="no-p-sub">
                        {drSpec}
                        {drRpps && ` · N° RPPS : ${drRpps}`}
                        {(drTel || drVille) && (
                          <>
                            <br />
                            {[drTel, drVille].filter(Boolean).join(" · ")}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="no-p-stamp">
                      CACHET
                      <br />
                      MÉDECIN
                    </div>
                  </div>

                  <div className="no-p-ttl">Ordonnance médicale</div>

                  <div className="no-p-meta">
                    <div className="no-p-meta-item">
                      <div className="no-p-meta-lbl">Patient</div>
                      <span className="no-p-meta-val">
                        {patientName || "_______________"}
                        {ptDob &&
                          ` — né(e) le ${new Date(ptDob).toLocaleDateString("fr-FR")}`}
                      </span>
                    </div>
                    <div
                      className="no-p-meta-item"
                      style={{ textAlign: "right" }}
                    >
                      <div className="no-p-meta-lbl">Date</div>
                      <span className="no-p-meta-val">{today}</span>
                    </div>
                  </div>

                  <div className="no-rx-hd">
                    <span className="no-rx-dot" />
                    <span className="no-rx-lbl">Prescription</span>
                    {activeMeds.length > 0 && (
                      <span className="no-rx-count">
                        {activeMeds.length} méd.
                      </span>
                    )}
                  </div>

                  <div>
                    {activeMeds.length === 0 ? (
                      <div className="no-rx-empty">
                        Les médicaments apparaîtront ici…
                      </div>
                    ) : (
                      activeMeds.map((m, i) => (
                        <div key={m.id} className="no-rx-item">
                          <span className="no-rx-num">{i + 1}</span>
                          <div className="no-rx-body">
                            <div className="no-rx-name">{m.nom}</div>
                            {(m.posologie || m.duree) && (
                              <div className="no-rx-det">
                                {[m.posologie, m.duree]
                                  .filter(Boolean)
                                  .join(" — ")}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {notes.trim() && <div className="no-p-notes">{notes}</div>}

                  <div className="no-p-foot">
                    <div className="no-p-date">
                      Fait à {drVille || "___"}, le {today}
                    </div>
                    <div className="no-sig-area">
                      <div className="no-sig-line" />
                      <div className="no-sig-name">Dr. {username}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}

// Inline MedRow to avoid CSS class conflicts with the parent page
function MedRowInner({
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

  return (
    <>
      <div ref={ref} style={{ position: "relative", gridColumn: "1" }}>
        <input
          className="no-inp no-inp-bold"
          placeholder="Rechercher un médicament…"
          value={med.nom}
          onChange={(e) => handleNomChange(e.target.value)}
          onFocus={() =>
            med.nom.length >= 2 && sugs.length > 0 && setShow(true)
          }
          autoComplete="off"
          style={{ display: "block" }}
        />
        {show && sugs.length > 0 && (
          <div className="no-sug-box">
            {sugs.map((s, i) => (
              <div
                key={i}
                className="no-sug-item"
                onMouseDown={() => {
                  onChange("nom", s.nom);
                  setShow(false);
                  setSugs([]);
                }}
              >
                <div className="no-sug-left">
                  <span
                    className="no-sug-dot"
                    style={{ background: CAT_COLORS[s.cat] }}
                  />
                  <span className="no-sug-nom">{s.nom}</span>
                </div>
                <span
                  className="no-sug-cat"
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
        className="no-inp no-inp-sm"
        placeholder="Ex : 1cp matin et soir"
        value={med.posologie}
        onChange={(e) => onChange("posologie", e.target.value)}
      />
      <input
        className="no-inp no-inp-sm"
        placeholder="Ex : 7 jours"
        value={med.duree}
        onChange={(e) => onChange("duree", e.target.value)}
      />
      <button className="no-del-btn" onClick={onRemove} title="Supprimer">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </>
  );
}
