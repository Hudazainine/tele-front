"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";

// ─────────────────────────────────────────────────────────────
// IMPORTS LUCIDE ICONS
// ─────────────────────────────────────────────────────────────
import {
  Search,
  X,
  Calendar,
  Stethoscope,
  ClipboardList,
  Plus,
  Eye,
  Edit,
  Activity,
  List,
  Clock,
} from "lucide-react";

interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
}
interface Consultation {
  id: number;
  patient_name: string;
  medecin_name: string;
  date_heure: string;
  notes: string;
}

type FilterType = "tous" | "aujourdhui" | "passe";

function ViewPanel({
  consult,
  onClose,
  onEdit,
  username,
}: {
  consult: Consultation;
  onClose: () => void;
  onEdit: () => void;
  username: string;
}) {
  const formattedDate = consult.date_heure
    ? new Date(consult.date_heure).toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const initials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <>
      <div className="panel-header">
        <div>
          <div className="panel-title">Détail de la consultation</div>
          <div className="panel-sub">Consultation #{consult.id}</div>
        </div>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-body">
        <div className="pt-badge">
          <div className="pt-avatar">{initials(consult.patient_name)}</div>
          <div>
            <div className="pt-name">{consult.patient_name || "Inconnu"}</div>
            <div className="pt-dr">
              Médecin : {consult.medecin_name || username}
            </div>
          </div>
        </div>

        <div className="info-row">
          <span className="info-key">📅 Date</span>
          <span className="info-val">{formattedDate}</span>
        </div>

        <div>
          <div className="section-label">📋 Motif &amp; Diagnostic</div>
          <div className="notes-content">
            {consult.notes || (
              <span className="empty-notes">Aucune note enregistrée.</span>
            )}
          </div>
        </div>

        <div className="sig-area">
          <span style={{ fontSize: 11, color: "#999" }}>
            Document généré le {new Date().toLocaleDateString("fr-FR")}
          </span>
          <div className="sig-block">
            <div className="sig-line" />
            <div style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>
              {username}
            </div>
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-panel-cancel" onClick={onClose}>
          Fermer
        </button>
        <button className="btn-panel-edit" onClick={onEdit}>
          ✏️ Modifier
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PANEL : MODIFIER
// ─────────────────────────────────────────────────────────────
function EditPanel({
  consult,
  onClose,
  onSave,
}: {
  consult: Consultation;
  onClose: () => void;
  onSave: (updated: Consultation) => void;
}) {
  const [notes, setNotes] = useState(consult.notes || "");
  const [dateHeure, setDateHeure] = useState(
    consult.date_heure?.slice(0, 16) || "",
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setErrorMsg(null);
    setSaving(true);
    try {
      await api.patch(`consultations/${consult.id}/`, {
        notes: notes.trim(),
        date_heure: new Date(dateHeure).toISOString(),
      });
      onSave({
        ...consult,
        notes: notes.trim(),
        date_heure: new Date(dateHeure).toISOString(),
      });
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

  return (
    <>
      <div className="panel-header">
        <div>
          <div className="panel-title">Modifier la consultation</div>
          <div className="panel-sub">Consultation #{consult.id}</div>
        </div>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-body">
        {errorMsg && <div className="panel-err">⚠️ {errorMsg}</div>}

        <div className="pt-badge">
          <div className="pt-avatar">
            {consult.patient_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <span className="pt-name">{consult.patient_name || "—"}</span>
        </div>

        <div className="panel-field">
          <label>Date &amp; Heure</label>
          <input
            type="datetime-local"
            value={dateHeure}
            onChange={(e) => setDateHeure(e.target.value)}
          />
        </div>

        <div className="panel-field">
          <label>Notes / Diagnostic</label>
          <textarea
            rows={6}
            placeholder="Saisissez le diagnostic ou les notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-panel-cancel" onClick={onClose}>
          Annuler
        </button>
        <button
          className="btn-panel-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Sauvegarde…" : "✓ Enregistrer"}
        </button>
      </div>
    </>
  );
}

export default function Consultations() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });
  const [consultations, setConsults] = useState<Consultation[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("tous");
  const [loading, setLoading] = useState(true);
  const [panelType, setPanelType] = useState<"view" | "edit" | null>(null);
  const [selectedConsult, setSelectedConsult] = useState<Consultation | null>(
    null,
  );

  const openView = (c: Consultation) => {
    setSelectedConsult(c);
    setPanelType("view");
  };
  const openEdit = (c: Consultation) => {
    setSelectedConsult(c);
    setPanelType("edit");
  };
  const closePanel = () => {
    setPanelType(null);
    setSelectedConsult(null);
  };
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
        setConsults(c.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  if (isLoading) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = consultations.filter((c) => {
    const searchMatch =
      c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.notes?.toLowerCase().includes(search.toLowerCase());

    if (!searchMatch) return false;

    if (activeFilter === "tous") return true;

    const cDate = new Date(c.date_heure);
    cDate.setHours(0, 0, 0, 0);

    if (activeFilter === "aujourdhui") {
      return cDate.getTime() === today.getTime();
    }

    if (activeFilter === "passe") {
      return cDate.getTime() < today.getTime();
    }

    return true;
  });

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

  const filters: { key: FilterType; label: string; icon: any }[] = [
    { key: "tous", label: "Tous", icon: List },
    { key: "aujourdhui", label: "Aujourd'hui", icon: Calendar },
    { key: "passe", label: "Passées", icon: Clock },
  ];

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght:700;800&family=DM+Sans:wght:400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .root  { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
        .main  { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); animation:fadeUp .4s ease; }

        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
        
        .page-title  { 
            font-family:'Syne',sans-serif; 
            font-size:28px; 
            font-weight:800; 
            background: linear-gradient(135deg, #8B5CF6, #10B981); 
            -webkit-background-clip: text; 
            background-clip: text; 
            color: transparent; 
            -webkit-text-fill-color: transparent; 
        }
        .page-sub    { font-size:13px; color:#64748b; margin-top:6px; }

        .btn-new { background:linear-gradient(135deg, #8B5CF6, #7C3AED); border:none; border-radius:14px; 
                   color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; 
                   padding:12px 22px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:8px; 
                   box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25); }
        .btn-new:hover { background:linear-gradient(135deg, #7C3AED, #6D28D9); transform:translateY(-2px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.35); }

        .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
        .stat-card { background:#fff; border-radius:18px; border:1px solid #EAE8F5; padding:18px 22px; 
                     display:flex; align-items:center; gap:14px; transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-2px); border-color: #ddd6fe; }
        
        .stat-icon { 
            width:42px; 
            height:42px; 
            border-radius:13px; 
            display:flex; align-items:center; justify-content:center; 
            flex-shrink:0; 
        }
        .stat-val  { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#1C1040; line-height:1; }
        .stat-lbl  { font-size:12px; color:#8A87A0; margin-top:3px; font-weight: 500; }

        .search-container {
            background: white;
            border: 1px solid #EAE8F5;
            border-radius: 14px;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .search-container:focus-within {
            border-color: #8B5CF6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-family: 'DM Sans', sans-serif;
            font-size: 14px;
            color: #1e1b4b;
            outline: none;
        }
        .search-input::placeholder {
            color: #94a3b8;
        }
        
        .filter-btn {
            padding: 10px 18px;
            border-radius: 14px;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            font-weight: 600;
            border: 1px solid rgba(0,0,0,0.06);
            background: rgba(255,255,255,0.6);
            color: #64748b;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .filter-btn:hover {
            background: rgba(139, 92, 246, 0.05);
            color: #334155;
            border-color: rgba(139, 92, 246, 0.2);
            transform: translateY(-1px);
        }
        .filter-btn.active {
            background: linear-gradient(135deg, #8B5CF6, #10B981);
            color: white;
            border-color: transparent;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.35);
        }

        .table-card { background:#fff; border-radius:20px; border:1px solid #EAE8F5; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .table-head { display:grid; grid-template-columns:2fr 1.2fr 2fr 1fr 1fr; padding:14px 24px; background:#FAFAFE; border-bottom:1px solid #EAE8F5; }
        .th { font-size:11px; font-weight:700; color:#8B5CF6; text-transform:uppercase; letter-spacing:.6px; }
        .table-row { display:grid; grid-template-columns:2fr 1.2fr 2fr 1fr 1fr; padding:16px 24px; border-bottom:1px solid #F4F2F9; 
                     align-items:center; transition:background .15s; }
        .table-row:last-child { border-bottom:none; }
        .table-row:hover { background:#F8FAFC; }

        .td-name { display:flex; align-items:center; gap:12px; font-size:14px; font-weight:600; color:#1e1b4b; }
        .avatar  { width:36px; height:36px; border-radius:12px; background:linear-gradient(135deg, #F3E8FF, #D1FAE5); 
                   display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; 
                   color: #7C3AED; flex-shrink:0; }
        .td-date { font-size:13px; color:#64748b; font-weight: 500; }
        .td-notes { font-size:12px; color:#8A87A0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:12px; }
        .td-dr   { font-size:13px; color:#7C3AED; font-weight:600; }

        .action-btn { display:inline-flex; align-items:center; gap:6px; background:#F0EEF9; color:#7C3AED; font-size:11px; font-weight:700; 
                      padding:6px 12px; border-radius:20px; cursor:pointer; transition:all .2s; border:none; font-family:'DM Sans',sans-serif; }
        .action-btn:hover { background:#8B5CF6; color: white; transform: translateY(-1px); }

        .empty { text-align:center; padding:60px 20px; color:#8A87A0; }
        .empty-icon { margin-bottom:16px; color: #CBD5E1; }

        .skel { background:linear-gradient(90deg,#F4F2F9 25%,#EAE8F5 50%,#F4F2F9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; height:16px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        /* ── OVERLAY & PANEL ── */
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; 
                  align-items:center; justify-content:center; z-index:200; }
        .panel   { width:520px; height:90vh; background:#fff; border-left:1px solid #EAE8F5; 
                  display:flex; flex-direction:column; overflow-y:auto;
                  animation:slideIn .25s ease; border-radius:20px; border:1px solid #EAE8F5; }
        @keyframes slideIn { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }

        .panel-header { padding:18px 22px; border-bottom:1px solid #F0EEF9; display:flex; 
                        align-items:center; justify-content:space-between; 
                        position:sticky; top:0; background:#fff; z-index:1; }
        .panel-title  { font-family:'Syne',sans-serif; font-size:16px; font-weight:800; color:#1C1040; }
        .panel-sub    { font-size:12px; color:#8A87A0; margin-top:2px; }
        .panel-close  { width:32px; height:32px; border:1px solid #EAE8F5; border-radius:8px; 
                        display:flex; align-items:center; justify-content:center; cursor:pointer; 
                        background:#fff; color:#8A87A0; font-size:14px; transition:all .2s; }
        .panel-close:hover { background:#F0EEF9; color:#1C1040; }

        .panel-body   { padding:22px; flex:1; display:flex; flex-direction:column; gap:18px; }
        .pt-badge     { display:flex; align-items:center; gap:10px; background:#F0EEF9; 
                        border-radius:12px; padding:12px 16px; }
        .pt-avatar    { width:40px; height:40px; border-radius:50%; background:#534AB7; color:#fff; 
                        display:flex; align-items:center; justify-content:center; 
                        font-size:16px; font-weight:700; flex-shrink:0; }
        .pt-name      { font-size:15px; font-weight:700; color:#3C3489; }
        .pt-dr        { font-size:12px; color:#8A87A0; margin-top:2px; }
        .section-label{ font-size:11px; font-weight:700; color:#8A87A0; text-transform:uppercase; 
                        letter-spacing:.7px; margin-bottom:6px; }
        .notes-content{ background:#FAFAFE; border:1px solid #EAE8F5; border-radius:12px; 
                        padding:14px; font-size:14px; line-height:1.7; color:#1C1040; white-space:pre-wrap; }
        .empty-notes  { color:#C4C0D8; font-style:italic; }
        .info-row     { display:flex; justify-content:space-between; padding:8px 0; 
                        border-bottom:1px solid #F4F2F9; font-size:13px; }
        .info-key     { color:#8A87A0; }
        .info-val     { font-weight:600; color:#1C1040; text-align:right; max-width:60%; }
        .sig-area     { display:flex; justify-content:space-between; align-items:flex-end; 
                        padding:12px 0 0; border-top:1px solid #F0EEF9; }
        .sig-block    { text-align:center; }
        .sig-line     { width:70px; border-top:1px solid #999; margin:0 auto 4px; }

        .panel-field  { display:flex; flex-direction:column; gap:5px; }
        .panel-field label { font-size:11px; font-weight:600; color:#8A87A0; 
                            text-transform:uppercase; letter-spacing:.5px; }
        .panel-field input,
        .panel-field textarea { width:100%; padding:10px 12px; font-family:'DM Sans',sans-serif; 
                                font-size:13px; color:#1C1040; background:#FAFAFE; 
                                border:1px solid #E5E2F5; border-radius:10px; outline:none; 
                                transition:all .2s; }
        .panel-field input:focus,
        .panel-field textarea:focus { border-color:#534AB7; background:#fff; 
                                      box-shadow:0 0 0 3px rgba(83,74,183,.1); }
        .panel-field textarea { resize:vertical; line-height:1.6; }
        .panel-err    { background:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; 
                        padding:10px 14px; color:#DC2626; font-size:12px; font-weight:600; }

        .panel-footer    { padding:14px 22px; background:#FAFAFE; border-top:1px solid #F0EEF9; 
                          display:flex; gap:10px; position:sticky; bottom:0; }
        .btn-panel-cancel{ flex:1; padding:10px; background:#fff; border:1px solid #E5E2F5; 
                          border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; 
                          font-weight:600; color:#8A87A0; cursor:pointer; }
        .btn-panel-cancel:hover { border-color:#C4C0D8; color:#1C1040; }
        .btn-panel-edit  { flex:2; padding:10px; background:#F0EEF9; border:none; border-radius:12px; 
                          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; 
                          color:#7C3AED; cursor:pointer; }
        .btn-panel-edit:hover { background:#8B5CF6; color:#fff; }
        .btn-panel-save  { flex:2; padding:10px; background:#1C1040; border:none; border-radius:12px; 
                          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; 
                          color:#fff; cursor:pointer; }
        .btn-panel-save:hover  { background:#2D1A6B; }
        .btn-panel-save:disabled { opacity:.5; cursor:not-allowed; }
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
                {activeFilter !== "tous"
                  ? ` (${filters.find((f) => f.key === activeFilter)?.label})`
                  : ""}
              </div>
            </div>
            <button
              className="btn-new"
              onClick={() =>
                router.push("/dashboard/medecin/consultations/nouvelle")
              }
            >
              <Plus size={18} />
              Nouvelle consultation
            </button>
          </div>

          {/* CONTENEUR FLEX HORIZONTAL : Recherche + Filtres */}
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
              style={{ flex: 1, minWidth: "280px", marginBottom: 0 }}
            >
              <Search size={18} color="#94a3b8" />
              <input
                className="search-input"
                placeholder="Rechercher par patient ou diagnostic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: 2,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 0,
              }}
            >
              {filters.map((f) => {
                const IconComponent = f.icon;
                return (
                  <button
                    key={f.key}
                    className={`filter-btn ${activeFilter === f.key ? "active" : ""}`}
                    onClick={() => setActiveFilter(f.key)}
                  >
                    <IconComponent size={16} strokeWidth={2.5} />
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="table-card">
            <div className="table-head">
              <span className="th">Patient</span>
              <span className="th">Date</span>
              <span className="th">Notes / Diagnostic</span>
              <span className="th">Médecin</span>
              <span className="th">Action</span>
            </div>

            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="table-row">
                  <div className="skel" style={{ width: "60%" }} />
                  <div className="skel" style={{ width: "50%" }} />
                  <div className="skel" style={{ width: "80%" }} />
                  <div className="skel" style={{ width: "40%" }} />
                  <div className="skel" style={{ width: "30%" }} />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">
                  <Activity size={48} strokeWidth={1.5} />
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: 4,
                  }}
                >
                  Aucune consultation trouvée
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  {search
                    ? "Aucun résultat pour cette recherche."
                    : activeFilter !== "tous"
                      ? `Aucune consultation ${filters.find((f) => f.key === activeFilter)?.label.toLowerCase()}.`
                      : "Commencez par créer une nouvelle consultation."}
                </div>
              </div>
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
                    <button className="action-btn" onClick={() => openView(c)}>
                      <Eye size={13} />
                    </button>
                    <button className="action-btn" onClick={() => openEdit(c)}>
                      <Edit size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
        {panelType && selectedConsult && (
          <div
            className="overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) closePanel();
            }}
          >
            <div className="panel">
              {panelType === "view" && (
                <ViewPanel
                  consult={selectedConsult}
                  onClose={closePanel}
                  onEdit={() => setPanelType("edit")}
                  username={username}
                />
              )}
              {panelType === "edit" && (
                <EditPanel
                  consult={selectedConsult}
                  onClose={closePanel}
                  onSave={(updated) => {
                    setConsults((prev) =>
                      prev.map((c) => (c.id === updated.id ? updated : c)),
                    );
                    closePanel();
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}
