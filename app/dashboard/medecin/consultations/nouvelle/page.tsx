"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import PrivateRoute from "../../../../../components/PrivateRoute";
import api from "../../../../../lib/api";
import Sidebar from "../../../../../components/Sidebar";
import Navbar from "../../../../../components/Navbar";

// ─────────────────────────────────────────────────────────────
// ICONS (Lucide)
// ─────────────────────────────────────────────────────────────

import {
  User,
  Calendar,
  FileText,
  Pill,
  X,
  Plus,
  CheckCircle2,
  List,
  Clock,
  Search,
  Eye,
  Edit,
} from "lucide-react";
interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
}
interface Patient {
  id: number;
  username: string;
}
interface Drug {
  id: number;
  nom: string;
  dose: string;
  dur: string;
}

let _did = 0;
const newDrug = (): Drug => ({ id: ++_did, nom: "", dose: "", dur: "" });

export default function Consultations() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  // ── ÉTAT PRINCIPAL (Consultations List) ──
  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });
  const [consultations, setConsults] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("tous");
  const [loading, setLoading] = useState(true);

  // ── ÉTAT MODALE (Formulaire Nouvelle) ──
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Données du formulaire
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState("");
  const [dateHeure, setDateHeure] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [notes, setNotes] = useState("");
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [newDrugRow, setNewDrugRow] = useState({ nom: "", dose: "", dur: "" });
  const [typeConsult, setTypeConsult] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Initial (Patients + Consultations)
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
      api.get("patients/"),
    ])
      .then(([r, c, o, p]) => {
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
        });
        setConsults(c.data);
        setPatients(p.data); // Précharger les patients pour le modal
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  // ── LOGIQUE FORMULAIRE ──

  const openModal = () => {
    setIsModalOpen(true);
    // Reset form
    setPatientId("");
    setDateHeure(new Date().toISOString().slice(0, 16));
    setNotes("");
    setDrugs([]);
    setNewDrugRow({ nom: "", dose: "", dur: "" });
    setTypeConsult("");
    setErrorMsg(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const addDrug = () => {
    if (!newDrugRow.nom.trim()) return;
    setDrugs((p) => [
      ...p,
      {
        id: ++_did,
        nom: newDrugRow.nom,
        dose: newDrugRow.dose || "—",
        dur: newDrugRow.dur || "—",
      },
    ]);
    setNewDrugRow({ nom: "", dose: "", dur: "" });
  };

  const removeDrug = (id: number) =>
    setDrugs((p) => p.filter((d) => d.id !== id));

  const selectedPatient = patients.find((p) => String(p.id) === patientId);
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSave = async () => {
    if (!patientId) {
      setErrorMsg("Sélectionnez un patient.");
      return;
    }
    if (!dateHeure) {
      setErrorMsg("Renseignez la date et l'heure.");
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    try {
      await api.post("consultations/", {
        patient: parseInt(patientId),
        date_heure: new Date(dateHeure).toISOString(),
        notes: notes.trim() || "",
      });
      closeModal();
      // Rafraîchir la liste
      api.get("consultations/").then((c) => setConsults(c.data));
    } catch (err: any) {
      const d = err?.response?.data;
      setErrorMsg(
        typeof d === "object" && d
          ? Object.entries(d)
              .map(([k, v]) => `${k} : ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : "Erreur serveur.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── LOGIQUE LISTE (Filtrage) ──

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "?"
    );
  };

  const filtered = consultations.filter(
    (c) =>
      c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.notes?.toLowerCase().includes(search.toLowerCase()),
  );

  const filters = [
    { key: "tous", label: "Tous", icon: List },
    { key: "aujourdhui", label: "Aujourd'hui", icon: Calendar },
    { key: "passe", label: "Passées", icon: Clock },
  ];

  if (isLoading) return null;

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght:700;800&family=DM+Sans:wght:400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .root  { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
        .main  { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }

        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
        .page-title  { 
            font-family:'Syne',sans-serif; font-size:28px; font-weight:800; 
            background: linear-gradient(135deg, #8B5CF6, #10B981); 
            -webkit-background-clip: text; background-clip: text; color: transparent; 
            -webkit-text-fill-color: transparent; 
        }
        .page-sub    { font-size:13px; color:#64748b; margin-top:6px; }

        .btn-new { background:linear-gradient(135deg, #8B5CF6, #7C3AED); border:none; border-radius:14px; 
                   color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; 
                   padding:12px 22px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:8px; 
                   box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); }
        .btn-new:hover { background:linear-gradient(135deg, #7C3AED, #6D28D9); transform:translateY(-2px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.35); }

        /* Search & Filters */
        .search-container {
            background: white; border: 1px solid #EAE8F5; border-radius: 14px;
            padding: 8px 16px; display: flex; align-items: center; gap: 12px;
            transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.02); margin-bottom: 24px;
        }
        .search-container:focus-within { border-color: #8B5CF6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); }
        .search-input { flex: 1; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1e1b4b; outline: none; }
        
        .filter-btn { padding: 10px 18px; border-radius: 14px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; border: 1px solid rgba(0,0,0,0.06); background: rgba(255,255,255,0.6); color: #64748b; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; }
        .filter-btn:hover { background: rgba(139, 92, 246, 0.05); color: #334155; border-color: rgba(139, 92, 246, 0.2); transform: translateY(-1px); }
        .filter-btn.active { background: linear-gradient(135deg, #8B5CF6, #10B981); color: white; border-color: transparent; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.35); }

        /* Table */
        .table-card { background:#fff; border-radius:20px; border:1px solid #EAE8F5; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .table-head { display:grid; grid-template-columns:2fr 1.2fr 2fr 1fr 1fr; padding:14px 24px; background:#FAFAFE; border-bottom:1px solid #EAE8F5; }
        .th { font-size:11px; font-weight:700; color:#8B5CF6; text-transform:uppercase; letter-spacing:.6px; }
        .table-row { display:grid; grid-template-columns:2fr 1.2fr 2fr 1fr 1fr; padding:16px 24px; border-bottom:1px solid #F4F2F9; align-items:center; transition:background .15s; }
        .table-row:last-child { border-bottom:none; }
        .table-row:hover { background:#F8FAFC; }
        .td-name { display:flex; align-items:center; gap:12px; font-size:14px; font-weight:600; color:#1e1b4b; }
        .avatar  { width:36px; height:36px; border-radius:12px; background:linear-gradient(135deg, #F3E8FF, #D1FAE5); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color: #7C3AED; flex-shrink:0; }
        .td-date { font-size:13px; color:#64748b; font-weight: 500; }
        .td-notes { font-size:12px; color:#8A87A0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:12px; }
        .td-dr   { font-size:13px; color:#7C3AED; font-weight:600; }
        .action-btn { display:inline-flex; align-items:center; gap:6px; background:#F0EEF9; color:#7C3AED; font-size:11px; font-weight:700; padding:6px 12px; border-radius:20px; cursor:pointer; transition:all .2s; border:none; font-family:'DM Sans',sans-serif; }
        .action-btn:hover { background:#8B5CF6; color: white; transform: translateY(-1px); }
        .empty { text-align:center; padding:60px 20px; color:#8A87A0; }

        /* MODAL STYLES */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(5, 10, 16, 0.6); backdrop-filter: blur(8px);
          z-index: 1000; display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        .modal-content {
          background: #fff; width: 1100px; max-width: 98vw; max-height: 95vh;
          border-radius: 24px; display: flex; overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          animation: fadeUp 0.3s ease;
        }
        .modal-right { width: 460px; padding: 24px; background: #FAFAFE; overflow-y: auto; }
        .modal-left { flex: 1; padding: 0; overflow-y: auto; border-right: 1px solid #EAE8F5; }        
        /* FORM STYLES (Copiés et adaptés) */
        .form-section { padding: 24px; border-bottom: 1px solid #F0EEF9; }
        .form-section:last-child { border-bottom: none; }
        .sec-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .sec-icon { width: 32px; height: 32px; border-radius: 10px; background: #F0EEF9; display: flex; align-items: center; justify-content: center; color: #534AB7; flex-shrink: 0; }
        .sec-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #1C1040; }
        
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field label { font-size: 11px; font-weight: 600; color: #8A87A0; text-transform: uppercase; letter-spacing: .5px; }
        
        input, select, textarea {
          width: 100%; padding: 10px 13px; font-family: 'DM Sans', sans-serif; font-size: 13px;
          color: #1C1040; background: #FAFAFE; border: 1px solid #E5E2F5; border-radius: 12px;
          outline: none; transition: border-color .2s, box-shadow .2s;
        }
        input:focus, select:focus, textarea:focus {
          border-color: #534AB7; background: #fff; box-shadow: 0 0 0 3px rgba(83,74,183,.1);
        }
        
        .drug-item { display: flex; align-items: center; gap: 10px; background: #FAFAFE; border: 1px solid #EAE8F5; border-radius: 12px; padding: 10px 14px; margin-bottom: 8px; }
        .drug-name { flex: 1; font-size: 13px; font-weight: 600; color: #1C1040; }
        .drug-pill { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 99px; }
        .drug-pill-dose { background: #EEEDFE; color: #3C3489; }
        .drug-pill-dur { background: #F0EEF9; color: #534AB7; }
        .drug-del { background: none; border: none; cursor: pointer; color: #C4C0D8; font-size: 14px; padding: 3px; border-radius: 6px; transition: all .2s; }
        .drug-del:hover { color: #EF4444; background: #FEF2F2; }
        
        .drug-add-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 8px; align-items: end; }
        .btn-add-drug { width: 38px; height: 38px; background: #534AB7; border: none; border-radius: 11px; color: #fff; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .2s; }
        .btn-add-drug:hover { background: #3C3489; }
        
        .err { background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 12px; padding: 10px 14px; color: #DC2626; font-size: 12.5px; font-weight: 600; margin-bottom: 16px; }
        
        .form-actions { display: flex; gap: 10px; padding: 18px 26px; background: #FAFAFE; border-top: 1px solid #F0EEF9; }
        .btn-cancel { flex: 1; padding: 11px; background: #fff; border: 1px solid #E5E2F5; border-radius: 13px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #8A87A0; cursor: pointer; }
        .btn-cancel:hover { border-color: #C4C0D8; color: #1C1040; }
        .btn-save { flex: 2; padding: 11px; background: #1C1040; border: none; border-radius: 13px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; transition: all .2s; }
        .btn-save:hover { background: #2D1A6B; }
        .btn-save:disabled { opacity: .5; cursor: not-allowed; }

        /* PREVIEW (Adapté pour modal right panel) */
        .doc { background: #fff; border-radius: 8px; border-top: 3px solid #534AB7; padding: 24px; box-shadow: 0 4px 24px rgba(0,0,0,.08); font-family: 'Times New Roman',Georgia,serif; }
        .doc-head { padding-bottom: 12px; border-bottom: 1.5px solid #1C1040; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
        .doc-dr { font-size: 15px; font-weight: 700; color: #1C1040; }
        .doc-sub { font-size: 11px; color: #666; margin-top: 2px; line-height: 1.5; font-family: sans-serif; }
        .doc-seal { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #534AB7; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #534AB7; }
        .doc-ttl { text-align: center; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #1C1040; padding: 8px 0 12px; border-bottom: 0.5px solid #EAE8F5; margin-bottom: 14px; font-family: sans-serif; }
        .doc-badge { display: inline-block; background: #EEEDFE; color: #3C3489; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; margin-bottom: 10px; font-family: sans-serif; }
        .doc-patient { background: #F0EEF9; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; font-family: sans-serif; }
        .doc-avatar { width: 34px; height: 34px; border-radius: 50%; background: #534AB7; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .doc-pt-name { font-size: 13px; font-weight: 600; color: #3C3489; }
        .doc-pt-sub { font-size: 10px; color: #534AB7; opacity: .7; margin-top: 2px; }
        .doc-section-title { font-size: 9px; font-weight: 700; color: #8A87A0; text-transform: uppercase; letter-spacing: .8px; display: flex; align-items: center; gap: 5px; margin-bottom: 6px; font-family: sans-serif; }
        .doc-content { font-size: 12px; color: #1C1040; line-height: 1.7; white-space: pre-wrap; background: #FAFAFE; border: 1px solid #EAE8F5; border-radius: 8px; padding: 8px 12px; font-family: sans-serif; min-height: 40px; }
        .doc-drug-table { width: 100%; border-collapse: collapse; font-size: 11px; font-family: sans-serif; margin-top: 8px; }
        .doc-drug-th { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #8A87A0; text-align: left; padding: 5px 8px; background: #FAFAFE; border-bottom: 1px solid #EAE8F5; }
        .doc-drug-td { padding: 6px 8px; border-bottom: 0.5px solid #EAE8F5; color: #1C1040; vertical-align: top; }
        .doc-foot { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 18px; padding-top: 12px; border-top: 0.5px solid #EAE8F5; font-family: sans-serif; }
        .sig-line { width: 70px; border-top: 1px solid #999; margin: 0 auto 3px; }
        .sig-name { font-size: 10px; color: #666; font-weight: 600; text-align: center; }
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Consultations" subtitle={` ${username}`} />

        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-title">Consultations</div>
              <div className="page-sub">
                {filtered.length} consultation
                {filtered.length !== 1 ? "s" : ""} affichée
                {filtered.length !== 1 ? "s" : ""}
              </div>
            </div>
            <button className="btn-new" onClick={openModal}>
              <Plus size={18} />
              Nouvelle consultation
            </button>
          </div>

          {/* SEARCH & FILTERS */}
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <div
              className="search-container"
              style={{ flex: 1, minWidth: "280px" }}
            >
              <Search size={18} color="#94a3b8" />
              <input
                className="search-input"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {filters.map((f, i) => (
                // Utilisation de composants Lucide factices pour la démo (ou importez-les)
                <button
                  key={f.key}
                  className={`filter-btn ${activeFilter === f.key ? "active" : ""}`}
                  onClick={() => setActiveFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* TABLEAU */}
          <div className="table-card">
            <div className="table-head">
              <span className="th">Patient</span>
              <span className="th">Date</span>
              <span className="th">Notes</span>
              <span className="th">Médecin</span>
              <span className="th">Action</span>
            </div>

            {loading ? (
              <div
                style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}
              >
                Chargement...
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty">Aucune consultation trouvée.</div>
            ) : (
              filtered.map((c) => (
                <div key={c.id} className="table-row">
                  <div className="td-name">
                    <div className="avatar">
                      {getInitials(c.patient_name || "")}
                    </div>
                    {c.patient_name || "—"}
                  </div>
                  <div className="td-date">
                    {c.date_heure
                      ? new Date(c.date_heure).toLocaleDateString("fr-FR")
                      : "—"}
                  </div>
                  <div className="td-notes" title={c.notes}>
                    {c.notes || "Aucune note"}
                  </div>
                  <div className="td-dr"> {c.medecin_name || username}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="action-btn">
                      <Eye size={13} />
                    </button>
                    <button className="action-btn">
                      <Edit size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* ── MODAL OVERLAY ── */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              {/* GAUCHE : FORMULAIRE */}
              <div className="modal-left">
                <div
                  style={{
                    padding: 24,
                    borderBottom: "1px solid #EAE8F5",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 20,
                      color: "#1C1040",
                    }}
                  >
                    Nouvelle Consultation
                  </h2>
                  <button
                    onClick={closeModal}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <X size={24} color="#8A87A0" />
                  </button>
                </div>

                {errorMsg && (
                  <div
                    style={{
                      margin: "0 24px 0",
                      padding: "10px 14px",
                      background: "#FEF2F2",
                      borderRadius: 8,
                      color: "#DC2626",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ⚠️ {errorMsg}
                  </div>
                )}

                {/* Patient & Date */}
                <div className="form-section">
                  <div className="sec-header">
                    <div className="sec-icon">
                      <User size={16} />
                    </div>
                    <span className="sec-title">Patient & Date</span>
                  </div>
                  <div className="grid2">
                    <div className="field">
                      <label>Patient</label>
                      <select
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                      >
                        <option value="">— Sélectionner —</option>
                        {patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.username}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Date & Heure</label>
                      <input
                        type="datetime-local"
                        value={dateHeure}
                        onChange={(e) => setDateHeure(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field" style={{ marginTop: 12 }}>
                    <label>Type de consultation</label>
                    <select
                      value={typeConsult}
                      onChange={(e) => setTypeConsult(e.target.value)}
                    >
                      <option value="">— Sélectionner —</option>
                      <option>Consultation générale</option>
                      <option>Suivi médical</option>
                      <option>Urgence</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-section">
                  <div className="sec-header">
                    <div className="sec-icon">
                      <FileText size={16} />
                    </div>
                    <span className="sec-title">Motif & Diagnostic</span>
                  </div>
                  <div className="field">
                    <label>Motif</label>
                    <textarea
                      rows={4}
                      placeholder="Symptômes rapportés..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Médicaments */}
                <div className="form-section">
                  <div className="sec-header">
                    <div className="sec-icon">
                      <Pill size={16} />
                    </div>
                    <span className="sec-title">Médicaments</span>
                  </div>
                  {drugs
                    .filter((d) => d.nom)
                    .map((d) => (
                      <div key={d.id} className="drug-item">
                        <span className="drug-name">{d.nom}</span>
                        <span className={`drug-pill drug-pill-dose`}>
                          {d.dose}
                        </span>
                        <span className={`drug-pill drug-pill-dur`}>
                          {d.dur}
                        </span>
                        <button
                          className="drug-del"
                          onClick={() => removeDrug(d.id)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  <div className="drug-add-row">
                    <div className="field">
                      <input
                        placeholder="Nom..."
                        value={newDrugRow.nom}
                        onChange={(e) =>
                          setNewDrugRow((p) => ({ ...p, nom: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && addDrug()}
                      />
                    </div>
                    <div className="field">
                      <input
                        placeholder="Posologie..."
                        value={newDrugRow.dose}
                        onChange={(e) =>
                          setNewDrugRow((p) => ({ ...p, dose: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && addDrug()}
                      />
                    </div>
                    <div className="field">
                      <input
                        placeholder="Durée..."
                        value={newDrugRow.dur}
                        onChange={(e) =>
                          setNewDrugRow((p) => ({ ...p, dur: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && addDrug()}
                      />
                    </div>
                    <button className="btn-add-drug" onClick={addDrug}>
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="form-actions">
                  <button className="btn-cancel" onClick={closeModal}>
                    Annuler
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleSave}
                    disabled={saving || !patientId}
                  >
                    {saving ? "..." : "Enregistrer"}
                  </button>
                </div>
              </div>

              {/* DROITE : PREVIEW */}
              <div className="modal-right">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#1C1040",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#10B981",
                        boxShadow: "0 0 0 3px rgba(16,185,129,0.2)",
                      }}
                    ></span>
                    Aperçu
                  </span>
                </div>

                <div className="doc">
                  <div className="doc-head">
                    <div>
                      <div className="doc-dr"> {username}</div>
                      <div className="doc-sub">Médecin Généraliste</div>
                    </div>
                    <div className="doc-seal">⚕</div>
                  </div>

                  <div className="doc-ttl">Compte rendu</div>
                  {typeConsult && (
                    <div>
                      <span className="doc-badge">{typeConsult}</span>
                    </div>
                  )}

                  <div className="doc-patient">
                    <div className="doc-avatar">
                      {selectedPatient?.username?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="doc-pt-name">
                        {selectedPatient?.username || "Patient"}
                      </div>
                      <div className="doc-pt-sub">
                        {dateHeure
                          ? new Date(dateHeure).toLocaleString("fr-FR")
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="doc-section-title">Motif / Diagnostic</div>
                  <div className="doc-content" style={{ marginBottom: 12 }}>
                    {notes || (
                      <span style={{ color: "#ccc", fontStyle: "italic" }}>
                        Le motif apparaîtra ici...
                      </span>
                    )}
                  </div>

                  {drugs.filter((d) => d.nom).length > 0 && (
                    <>
                      <div
                        className="doc-section-title"
                        style={{ marginTop: 10 }}
                      >
                        Médicaments
                      </div>
                      <table className="doc-drug-table">
                        <thead>
                          <tr>
                            <th className="doc-drug-th">Med</th>
                            <th className="doc-drug-th">Posologie</th>
                            <th className="doc-drug-th">Durée</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drugs
                            .filter((d) => d.nom)
                            .map((d) => (
                              <tr key={d.id}>
                                <td
                                  className="doc-drug-td"
                                  style={{ fontWeight: 600 }}
                                >
                                  {d.nom}
                                </td>
                                <td className="doc-drug-td">{d.dose}</td>
                                <td className="doc-drug-td">{d.dur}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  <div className="doc-foot">
                    <div style={{ fontSize: 10, color: "#999" }}>{today}</div>
                    <div>
                      <div className="sig-line" />
                      <div className="sig-name"> {username}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}
