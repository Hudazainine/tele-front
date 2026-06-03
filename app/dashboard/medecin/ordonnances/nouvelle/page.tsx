"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import PrivateRoute from "../../../../../components/PrivateRoute";
import api from "../../../../../lib/api";
import Sidebar from "../../../../../components/Sidebar";
import Navbar from "../../../../../components/Navbar";

interface Stats        { rendezvous: number; consultations: number; ordonnances: number; }
interface Consultation { id: number; patient_name: string; date_heure: string; }
interface Med          { id: number; nom: string; posologie: string; duree: string; }

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
  "Antibiotique": "#4F6BF6",
  "Antalgique": "#10B981",
  "Anti-inflammatoire": "#F59E0B",
  "Gastroprotecteur": "#8B5CF6",
  "Antiémétique": "#8B5CF6",
  "Antidiarrhéique": "#8B5CF6",
  "Antihypertenseur": "#EF4444",
  "Hypolipémiant": "#EF4444",
  "Antiagrégant": "#EF4444",
  "Antidiabétique": "#06B6D4",
  "Bronchodilatateur": "#14B8A6",
  "Corticoïde inhalé": "#14B8A6",
  "Antiasthmatique": "#14B8A6",
  "Antihistaminique": "#14B8A6",
  "Décongestionnant": "#14B8A6",
  "Corticoïde topique": "#A78BFA",
  "Antifongique": "#A78BFA",
  "Supplément": "#64748B",
};

let _id = 0;
const newMed = (): Med => ({ id: ++_id, nom: "", posologie: "", duree: "" });

function MedRow({ med, onRemove, onChange }: {
  med: Med;
  onRemove: () => void;
  onChange: (f: keyof Med, v: string) => void;
}) {
  const [sugs, setSugs] = useState<typeof MED_DB>([]);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNomChange = (val: string) => {
    onChange("nom", val);
    if (val.length >= 2) {
      const results = MED_DB.filter(m => m.nom.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
      setSugs(results);
      setShow(results.length > 0);
    } else { setSugs([]); setShow(false); }
  };

  const selectMed = (m: typeof MED_DB[0]) => {
    onChange("nom", m.nom);
    setShow(false); setSugs([]);
  };

  return (
    <div className="med-row">
      <div ref={ref} className="med-autocomplete">
        <input
          className="f-inp f-inp-med"
          placeholder="Rechercher un médicament…"
          value={med.nom}
          onChange={e => handleNomChange(e.target.value)}
          onFocus={() => med.nom.length >= 2 && sugs.length > 0 && setShow(true)}
          autoComplete="off"
        />
        {show && sugs.length > 0 && (
          <div className="sug-box">
            {sugs.map((s, i) => (
              <div key={i} className="sug-item" onMouseDown={() => selectMed(s)}>
                <div className="sug-left">
                  <span className="sug-dot" style={{ background: CAT_COLORS[s.cat] }} />
                  <span className="sug-nom">{s.nom}</span>
                </div>
                <span className="sug-cat" style={{ background: CAT_COLORS[s.cat] + "14", color: CAT_COLORS[s.cat] }}>
                  {s.cat}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <input className="f-inp f-inp-poso" placeholder="Ex : 1cp matin et soir" value={med.posologie} onChange={e => onChange("posologie", e.target.value)} />
      <input className="f-inp f-inp-duree" placeholder="Ex : 7 jours" value={med.duree} onChange={e => onChange("duree", e.target.value)} />
      <button className="del-btn" onClick={onRemove} title="Supprimer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

export default function NouvelleOrdonnance() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats]                   = useState<Stats>({ rendezvous: 0, consultations: 0, ordonnances: 0 });
  const [consultations, setConsultations]   = useState<Consultation[]>([]);
  const [consultationId, setConsultationId] = useState("");
  const [searchQuery, setSearchQuery]       = useState("");
  const [showDropdown, setShowDropdown]     = useState(false);
  const wrapperRef                          = useRef<HTMLDivElement>(null);

  const [drSpec,   setDrSpec]   = useState("Médecin généraliste");
  const [drRpps,   setDrRpps]   = useState("");
  const [drTel,    setDrTel]    = useState("");
  const [drVille,  setDrVille]  = useState("");
  const [ptDob,    setPtDob]    = useState("");
  const [meds,     setMeds]     = useState<Med[]>([newMed()]);
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addMed    = useCallback(() => setMeds(p => [...p, newMed()]), []);
  const removeMed = useCallback((id: number) => setMeds(p => p.length > 1 ? p.filter(m => m.id !== id) : p), []);
  const chgMed    = useCallback((id: number, f: keyof Med, v: string) =>
    setMeds(p => p.map(m => m.id === id ? { ...m, [f]: v } : m)), []);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    Promise.all([api.get("rendezvous/"), api.get("consultations/"), api.get("ordonnances/")])
      .then(([r, c, o]) => {
        setStats({ rendezvous: r.data.length, consultations: c.data.length, ordonnances: o.data.length });
        setConsultations(c.data);
      }).catch(() => {});
  }, [token, isLoading]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (isLoading) return null;

  const activeMeds      = meds.filter(m => m.nom.trim());
  const selectedConsult = consultations.find(c => String(c.id) === consultationId);
  const patientName     = selectedConsult?.patient_name ?? "";
  const today           = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const filteredConsults = consultations.filter(c =>
    c.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    if (!consultationId)         { setErrorMsg("Sélectionnez une consultation."); return; }
    if (activeMeds.length === 0) { setErrorMsg("Ajoutez au moins un médicament."); return; }
    setErrorMsg(null); setSaving(true);
    try {
      const consultationIdInt = parseInt(consultationId, 10);
      if (isNaN(consultationIdInt)) { setErrorMsg("ID de consultation invalide."); setSaving(false); return; }
      const medText = activeMeds
        .map(m => `- ${m.nom}${m.posologie ? ` — ${m.posologie}` : ""}${m.duree ? `, ${m.duree}` : ""}`)
        .join("\n") + (notes.trim() ? `\n\nNotes :\n${notes.trim()}` : "");
      await api.post("ordonnances/", { consultation: consultationIdInt, medicaments: medText });
      router.push("/dashboard/medecin/ordonnances");
    } catch (err: any) {
      const d = err?.response?.data;
      if (d && typeof d === "object") {
        const msg = Object.entries(d)
          .map(([k, v]) => `${k} : ${Array.isArray(v) ? (v as string[]).join(", ") : String(v)}`)
          .join(" | ");
        setErrorMsg(msg);
      } else if (typeof d === "string") {
        setErrorMsg(d);
      } else {
        setErrorMsg(`Erreur ${err?.response?.status ?? ""} — vérifiez les champs.`);
      }
    } finally { setSaving(false); }
  };

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');

        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }

        :root {
          --bg: #F4F5F9;
          --card: #FFFFFF;
          --ink: #111827;
          --ink2: #374151;
          --muted: #9CA3AF;
          --border: #E5E7EB;
          --border-light: #F3F4F6;
          --accent: #4F6BF6;
          --accent-soft: #EEF2FF;
          --accent-hover: #3B52D9;
          --green: #10B981;
          --green-soft: #ECFDF5;
          --red: #EF4444;
          --red-soft: #FEF2F2;
          --amber: #F59E0B;
          --radius: 14px;
          --radius-lg: 20px;
          --shadow-sm: 0 1px 3px rgba(0,0,0,.04);
          --shadow: 0 4px 20px rgba(0,0,0,.06);
          --shadow-lg: 0 12px 40px rgba(0,0,0,.08);
        }

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .root{min-height:100vh;background:var(--bg);font-family:'Inter',sans-serif;display:flex}
        .main{margin-left:260px;flex:1;padding:2rem 2.5rem;padding-top:calc(70px + 2rem)}

        /* ── Header ── */
        .page-hd{display:flex;align-items:center;gap:16px;margin-bottom:32px;animation:fadeUp .5s ease}
        .btn-back{width:42px;height:42px;background:var(--card);border:1px solid var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--muted);transition:all .2s}
        .btn-back:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
        .page-hd-text h1{font-family:'Playfair Display',serif;font-size:28px;font-weight:600;color:var(--ink);letter-spacing:-.3px}
        .page-hd-text p{font-size:13px;color:var(--muted);margin-top:2px}

        /* ── Layout ── */
        .layout{display:grid;grid-template-columns:1fr 420px;gap:24px;align-items:start;animation:fadeUp .55s ease .05s backwards}

        /* ── Form panel ── */
        .form-panel{background:var(--card);border-radius:var(--radius-lg);border:1px solid var(--border);overflow:visible;box-shadow:var(--shadow-sm)}
        .form-section{padding:24px 28px;border-bottom:1px solid var(--border-light)}
        .form-section:last-of-type{border-bottom:none}
        .sec-hd{display:flex;align-items:center;gap:12px;margin-bottom:20px}
        .sec-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
        .sec-icon.dr{background:linear-gradient(135deg,#EEF2FF,#E0E7FF)}
        .sec-icon.pt{background:linear-gradient(135deg,#ECFDF5,#D1FAE5)}
        .sec-icon.rx{background:linear-gradient(135deg,#EEF2FF,#E0E7FF)}
        .sec-icon.nt{background:linear-gradient(135deg,#FEF3C7,#FDE68A)}
        .sec-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:var(--ink)}

        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .field{display:flex;flex-direction:column;gap:6px}
        .field label{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.6px}
        .field label .req{color:var(--red)}

        .f-inp,.f-sel,.f-txt{
          width:100%;padding:11px 14px;font-family:'Inter',sans-serif;font-size:13px;
          color:var(--ink);background:var(--bg);border:1.5px solid var(--border);border-radius:10px;
          outline:none;transition:all .2s ease;
        }
        .f-inp:focus,.f-sel:focus,.f-txt:focus{
          border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px rgba(79,107,246,.1);
        }
        .f-inp::placeholder,.f-txt::placeholder{color:#C7C7D0}
        .f-txt{resize:none;line-height:1.7}

        /* ── Patient dropdown ── */
        .pt-wrap{position:relative}
        .pt-dropdown{
          position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:30;
          background:#fff;border:1.5px solid var(--border);border-radius:12px;
          max-height:220px;overflow-y:auto;
          box-shadow:var(--shadow-lg);
          animation:slideDown .15s ease;
        }
        .pt-item{padding:12px 16px;cursor:pointer;font-size:13px;color:var(--ink);display:flex;justify-content:space-between;align-items:center;transition:background .12s;border-bottom:1px solid var(--border-light)}
        .pt-item:last-child{border-bottom:none}
        .pt-item:hover{background:var(--accent-soft)}
        .pt-item-sub{font-size:11px;color:var(--muted)}
        .pt-empty{padding:16px;font-size:12px;color:var(--muted);text-align:center}
        .consult-tag{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;background:var(--green-soft);border:1px solid rgba(16,185,129,.2);border-radius:10px;font-size:12px;font-weight:600;color:var(--green);margin-top:10px}

        /* ── Médicaments ── */
        .med-cols{display:grid;grid-template-columns:2fr 1fr 1fr 36px;gap:8px;margin-bottom:8px;padding:0 2px}
        .med-col-lbl{font-size:10px;font-weight:700;color:#C7C7D0;text-transform:uppercase;letter-spacing:.5px}

        .med-row{display:grid;grid-template-columns:2fr 1fr 1fr 36px;gap:8px;align-items:center;margin-bottom:10px;animation:fadeIn .25s ease}
        .med-autocomplete{position:relative}
        .f-inp-med{font-weight:600!important}
        .f-inp-poso,.f-inp-duree{font-size:12.5px!important}

        .sug-box{
          position:absolute;top:calc(100% + 5px);left:0;right:0;z-index:40;
          background:#fff;border:1.5px solid var(--border);border-radius:12px;
          box-shadow:var(--shadow-lg);max-height:280px;overflow-y:auto;
          animation:slideDown .15s ease;
        }
        .sug-item{padding:11px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid var(--border-light);transition:background .12s}
        .sug-item:last-child{border-bottom:none}
        .sug-item:hover{background:var(--bg)}
        .sug-left{display:flex;align-items:center;gap:10px}
        .sug-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
        .sug-nom{font-size:13px;font-weight:600;color:var(--ink)}
        .sug-cat{font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;white-space:nowrap}

        .del-btn{width:36px;height:40px;border:none;background:none;border-radius:9px;cursor:pointer;color:#D1D5DB;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
        .del-btn:hover{background:var(--red-soft);color:var(--red)}

        .add-med-btn{width:100%;margin-top:10px;padding:12px;background:none;border:1.5px dashed var(--border);border-radius:10px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:var(--accent);cursor:pointer;transition:all .2s}
        .add-med-btn:hover{border-color:var(--accent);background:var(--accent-soft)}

        /* ── Error ── */
        .err{background:var(--red-soft);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:12px 16px;color:var(--red);font-size:12.5px;font-weight:600;margin-bottom:16px;display:flex;gap:8px;align-items:flex-start}

        /* ── Actions ── */
        .form-actions{display:flex;gap:12px;padding:20px 28px;background:var(--bg);border-top:1px solid var(--border);border-radius:0 0 var(--radius-lg) var(--radius-lg)}
        .btn-cancel{flex:1;padding:12px;background:#fff;border:1.5px solid var(--border);border-radius:10px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:var(--muted);cursor:pointer;transition:all .2s}
        .btn-cancel:hover{border-color:var(--ink);color:var(--ink)}
        .btn-save{flex:2;padding:12px;background:var(--accent);border:none;border-radius:10px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#fff;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(79,107,246,.25)}
        .btn-save:hover:not(:disabled){background:var(--accent-hover);transform:translateY(-1px);box-shadow:0 6px 24px rgba(79,107,246,.35)}
        .btn-save:disabled{opacity:.4;cursor:not-allowed;transform:none}

        /* ── Preview ── */
        .preview-panel{position:sticky;top:calc(70px + 2rem);animation:fadeUp .6s ease .1s backwards}
        .preview-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
        .preview-lbl{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:var(--ink);display:flex;align-items:center;gap:9px}
        .live-dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse 2s ease infinite}
        .preview-btn{padding:8px 14px;background:#fff;border:1.5px solid var(--border);border-radius:10px;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;color:var(--muted);cursor:pointer;transition:all .2s}
        .preview-btn:hover{border-color:var(--accent);color:var(--accent)}

        .paper{background:#fff;border-radius:12px;border:1px solid var(--border);box-shadow:var(--shadow);font-family:'Playfair Display',serif;overflow:hidden;transition:box-shadow .3s}
        .paper:hover{box-shadow:var(--shadow-lg)}
        .paper-stripe{height:4px;background:linear-gradient(90deg,var(--ink) 0%,var(--accent) 50%,var(--green) 100%)}
        .paper-body{padding:28px 24px}

        .p-head{padding-bottom:14px;border-bottom:2px solid var(--ink);margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start}
        .p-dr{font-size:18px;font-weight:700;color:var(--ink);letter-spacing:-.3px}
        .p-sub{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.7;font-family:'Inter',sans-serif;font-weight:400}
        .p-stamp{width:50px;height:50px;border-radius:50%;border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;font-size:7.5px;color:var(--muted);text-align:center;font-family:'Inter',sans-serif;line-height:1.3;flex-shrink:0}

        .p-ttl{text-align:center;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--ink);padding:8px 0 12px;border-bottom:1px solid var(--border);margin-bottom:16px;font-family:'Inter',sans-serif}

        .p-meta{display:flex;justify-content:space-between;margin-bottom:20px;gap:16px}
        .p-meta-item{flex:1}
        .p-meta-lbl{font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:4px;font-family:'Inter',sans-serif}
        .p-meta-val{font-size:13px;font-weight:600;color:var(--ink);border-bottom:1px solid #D1D5DB;padding-bottom:3px;display:block;min-height:18px}

        .rx-section-hd{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid var(--border);font-family:'Inter',sans-serif}
        .rx-section-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);flex-shrink:0}
        .rx-section-lbl{font-size:9.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
        .rx-section-count{margin-left:auto;font-size:10px;font-weight:700;color:var(--accent);background:var(--accent-soft);padding:2px 9px;border-radius:20px}

        .rx-item{display:flex;align-items:baseline;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-light);transition:background .15s}
        .rx-item:last-child{border-bottom:none}
        .rx-num{width:20px;height:20px;border-radius:6px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:var(--muted);flex-shrink:0;font-family:'Inter',sans-serif}
        .rx-body{flex:1}
        .rx-name{font-size:13px;font-weight:600;color:var(--ink);line-height:1.4}
        .rx-det{font-size:11px;color:var(--muted);margin-top:2px;font-family:'Inter',sans-serif}
        .rx-empty{font-size:12px;color:#D1D5DB;font-style:italic;font-family:'Inter',sans-serif;padding:10px 0}

        .p-notes{font-size:11px;color:var(--ink2);line-height:1.7;margin-top:14px;padding:10px 14px;border:1px dashed var(--border);border-radius:8px;white-space:pre-wrap;font-family:'Inter',sans-serif;background:var(--bg)}

        .p-foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px;padding-top:14px;border-top:1px solid var(--border)}
        .p-date{font-size:11px;color:var(--muted);font-family:'Inter',sans-serif}
        .sig-area{text-align:center}
        .sig-line{width:80px;border-top:1px solid var(--muted);margin:0 auto 5px}
        .sig-name{font-size:11px;color:var(--ink2);font-family:'Inter',sans-serif;font-weight:600}

        @media print{.preview-panel,.page-hd,.btn-back{display:none!important}.main{margin-left:0!important;padding:0!important}.layout{grid-template-columns:1fr!important}}
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Nouvelle ordonnance" subtitle={`Dr. ${username}`} />

        <main className="main">
          <div className="page-hd">
            <button className="btn-back" onClick={() => router.push("/dashboard/medecin/ordonnances")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div className="page-hd-text">
              <h1>Nouvelle ordonnance</h1>
              <p>Dr. {username} · {today}</p>
            </div>
          </div>

          <div className="layout">
            {/* FORMULAIRE */}
            <div className="form-panel">
              <div className="form-section">
                <div className="sec-hd">
                  <div className="sec-icon dr">🩺</div>
                  <span className="sec-title">Médecin prescripteur</span>
                </div>
                <div className="grid2" style={{marginBottom:14}}>
                  <div className="field">
                    <label>Spécialité</label>
                    <input className="f-inp" value={drSpec} onChange={e => setDrSpec(e.target.value)} placeholder="Médecin généraliste" />
                  </div>
                  <div className="field">
                    <label>N° RPPS</label>
                    <input className="f-inp" value={drRpps} onChange={e => setDrRpps(e.target.value)} placeholder="Optionnel" />
                  </div>
                </div>
                <div className="grid2">
                  <div className="field">
                    <label>Téléphone</label>
                    <input className="f-inp" value={drTel} onChange={e => setDrTel(e.target.value)} placeholder="+216 xx xxx xxx" />
                  </div>
                  <div className="field">
                    <label>Ville</label>
                    <input className="f-inp" value={drVille} onChange={e => setDrVille(e.target.value)} placeholder="Tunis" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="sec-hd">
                  <div className="sec-icon pt">👤</div>
                  <span className="sec-title">Patient & consultation</span>
                </div>
                {errorMsg && <div className="err"><span>⚠️</span><span>{errorMsg}</span></div>}
                <div className="grid2">
                  <div className="field">
                    <label>Recherche patient <span className="req">*</span></label>
                    <div ref={wrapperRef} className="pt-wrap">
                      <input className="f-inp" placeholder="Tapez le nom du patient…" value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setConsultationId(""); setShowDropdown(true); }}
                        onFocus={() => searchQuery && setShowDropdown(true)} autoComplete="off" />
                      {showDropdown && searchQuery && !consultationId && (
                        <div className="pt-dropdown">
                          {filteredConsults.length === 0 ? (
                            <div className="pt-empty">Aucun patient trouvé</div>
                          ) : filteredConsults.map(c => (
                            <div key={c.id} className="pt-item"
                              onMouseDown={() => { setConsultationId(String(c.id)); setSearchQuery(c.patient_name); setShowDropdown(false); }}>
                              <strong>{c.patient_name}</strong>
                              <span className="pt-item-sub">{new Date(c.date_heure).toLocaleDateString("fr-FR")}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedConsult && (
                      <div className="consult-tag">✓ {selectedConsult.patient_name} — {new Date(selectedConsult.date_heure).toLocaleDateString("fr-FR")}</div>
                    )}
                  </div>
                  <div className="field">
                    <label>Date de naissance</label>
                    <input className="f-inp" type="date" value={ptDob} onChange={e => setPtDob(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="sec-hd">
                  <div className="sec-icon rx">💊</div>
                  <span className="sec-title">Prescription <span style={{color:"var(--red)",fontSize:"13px"}}>*</span></span>
                </div>
                <div className="med-cols">
                  <span className="med-col-lbl">Médicament</span>
                  <span className="med-col-lbl">Posologie</span>
                  <span className="med-col-lbl">Durée</span>
                  <span />
                </div>
                {meds.map(m => (
                  <MedRow key={m.id} med={m} onRemove={() => removeMed(m.id)} onChange={(f, v) => chgMed(m.id, f, v)} />
                ))}
                <button className="add-med-btn" onClick={addMed}>＋ Ajouter un médicament</button>
              </div>

              <div className="form-section">
                <div className="sec-hd">
                  <div className="sec-icon nt">📝</div>
                  <span className="sec-title">Notes & conseils</span>
                </div>
                <textarea className="f-txt" rows={3} placeholder="Conseils, régime alimentaire, précautions, suivi…"
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <div className="form-actions">
                <button className="btn-cancel" onClick={() => router.push("/dashboard/medecin/ordonnances")}>Annuler</button>
                <button className="btn-save" onClick={handleSave}
                  disabled={saving || !consultationId || activeMeds.length === 0}>
                  {saving ? "Enregistrement…" : "Valider l'ordonnance"}
                </button>
              </div>
            </div>

            {/* APERÇU */}
            <div className="preview-panel">
              <div className="preview-top">
                <span className="preview-lbl"><span className="live-dot" /> Aperçu en direct</span>
                <button className="preview-btn" onClick={() => window.print()}>🖨 Imprimer</button>
              </div>
              <div className="paper">
                <div className="paper-stripe" />
                <div className="paper-body">
                  <div className="p-head">
                    <div>
                      <div className="p-dr">Dr. {username}</div>
                      <div className="p-sub">
                        {drSpec}{drRpps && ` · N° RPPS : ${drRpps}`}
                        {(drTel || drVille) && <><br />{[drTel, drVille].filter(Boolean).join(" · ")}</>}
                      </div>
                    </div>
                    <div className="p-stamp">CACHET<br />MÉDECIN</div>
                  </div>
                  <div className="p-ttl">Ordonnance médicale</div>
                  <div className="p-meta">
                    <div className="p-meta-item">
                      <div className="p-meta-lbl">Patient</div>
                      <span className="p-meta-val">
                        {patientName || "_______________"}
                        {ptDob && ` — né(e) le ${new Date(ptDob).toLocaleDateString("fr-FR")}`}
                      </span>
                    </div>
                    <div className="p-meta-item" style={{textAlign:"right"}}>
                      <div className="p-meta-lbl">Date</div>
                      <span className="p-meta-val">{today}</span>
                    </div>
                  </div>
                  <div className="rx-section-hd">
                    <span className="rx-section-dot" />
                    <span className="rx-section-lbl">Prescription</span>
                    {activeMeds.length > 0 && <span className="rx-section-count">{activeMeds.length} méd.</span>}
                  </div>
                  <div>
                    {activeMeds.length === 0
                      ? <div className="rx-empty">Les médicaments apparaîtront ici…</div>
                      : activeMeds.map((m, i) => (
                        <div key={m.id} className="rx-item">
                          <span className="rx-num">{i + 1}</span>
                          <div className="rx-body">
                            <div className="rx-name">{m.nom}</div>
                            {(m.posologie || m.duree) && <div className="rx-det">{[m.posologie, m.duree].filter(Boolean).join(" — ")}</div>}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                  {notes.trim() && <div className="p-notes">{notes}</div>}
                  <div className="p-foot">
                    <div className="p-date">Fait à {drVille || "___"}, le {today}</div>
                    <div className="sig-area">
                      <div className="sig-line" />
                      <div className="sig-name">Dr. {username}</div>
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