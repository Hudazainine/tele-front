"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

// ─────────────────────────────────────────────────────────────
// IMPORTS LUCIDE ICONS
// ─────────────────────────────────────────────────────────────
import {
  Pill,
  Search,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
  Printer,
  CreditCard,
  TrendingUp,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Revenu {
  total_brut: number;
  total_acomptes: number;
  total_soldes: number;
  nb_consultations: number;
}

interface Resume {
  factures: {
    nb_total: number;
    nb_soldes: number;
    nb_acomptes: number;
    total_medecin: number;
    total_plateforme: number;
    total_global: number;
  };
  revenu: Revenu;
}

interface LigneFacture {
  id: number;
  type_ligne: string;
  type_ligne_display: string;
  montant: number;
  date: string;
  description: string;
}

interface Facture {
  id: number;
  patient_name: string;
  montant_total: number;
  acompte_montant: number;
  acompte_medecin: number;
  acompte_plateforme: number;
  solde_montant: number;
  solde_medecin: number;
  total_medecin: number;
  total_plateforme: number;
  statut: string;
  statut_display: string;
  pourcentage_paye: number;
  created_at: string;
  lignes: LigneFacture[];
}

interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const fmt = (n: number | undefined | null) =>
  n != null ? Number(n).toFixed(2) + " DT" : "— DT";

const statutConfig: Record<string, { color: string; bg: string; icon: any }> = {
  acompte_verse: { color: "#D97706", bg: "#FFFBEB", icon: AlertCircle },
  solde_verse: { color: "#059669", bg: "#ECFDF5", icon: CheckCircle },
  annule: { color: "#DC2626", bg: "#FEF2F2", icon: X },
};

const ligneIcon: Record<string, any> = {
  acompte_medecin: CreditCard,
  acompte_plateforme: TrendingUp,
  solde_medecin: CheckCircle,
};

// ─────────────────────────────────────────────────────────────
// PANEL VISUALISATION (Détail Facture)
// ─────────────────────────────────────────────────────────────
function ViewPanel({
  facture,
  onClose,
}: {
  facture: Facture;
  onClose: () => void;
}) {
  const initials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  const statutInfo =
    statutConfig[facture.statut] || statutConfig["acompte_verse"];
  const StatutIcon = statutInfo.icon;

  return (
    <>
      <div className="panel-header">
        <div>
          <div className="panel-title">Détail de la Facture</div>
          <div className="panel-sub">Référence #{facture.id}</div>
        </div>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-body">
        {/* En-tête Patient + Statut */}
        <div className="pt-badge">
          <div className="pt-avatar">{initials(facture.patient_name)}</div>
          <div>
            <div className="pt-name">{facture.patient_name || "Inconnu"}</div>
            <div className="pt-dr">
              {new Date(facture.created_at).toLocaleDateString("fr-FR")}
            </div>
          </div>
        </div>

        {/* KPIs Financiers dans le panneau */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div
            style={{
              background: "#F8FAFC",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #E2E8F0",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#64748b",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              TOTAL FACTURE
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1E293B" }}>
              {fmt(facture.montant_total)}
            </div>
          </div>
          <div
            style={{
              background: "#F0FDF4",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #BBF7D0",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#15803D",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              VOTRE PART (75%)
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#166534" }}>
              {fmt(facture.total_medecin)}
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B" }}>
              Progression Paiement
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#8B5CF6" }}>
              {facture.pourcentage_paye}%
            </span>
          </div>
          <div
            style={{
              height: "8px",
              background: "#E2E8F0",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${facture.pourcentage_paye}%`,
                background: "linear-gradient(90deg, #8B5CF6, #10B981)",
                borderRadius: "4px",
                transition: "width 0.5s",
              }}
            />
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: "8px",
                background: "#FFFBEB",
                borderRadius: "8px",
                border: "1px solid #FDE68A",
              }}
            >
              <div style={{ fontSize: 10, color: "#D97706", fontWeight: 700 }}>
                ACOMPTE
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#B45309" }}>
                {fmt(facture.acompte_medecin)}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                padding: "8px",
                background: "#F0FDF4",
                borderRadius: "8px",
                border: "1px solid #BBF7D0",
              }}
            >
              <div style={{ fontSize: 10, color: "#059669", fontWeight: 700 }}>
                SOLDE
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#047857" }}>
                {fmt(facture.solde_medecin)}
              </div>
            </div>
          </div>
        </div>

        {/* Liste des transactions */}
        <div>
          <div className="section-label">Transactions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {facture.lignes.map((l) => {
              const IconComp = ligneIcon[l.type_ligne] || FileText;
              return (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px",
                    background: "#FAFAFE",
                    borderRadius: "10px",
                    border: "1px solid #E5E2F5",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      background: "#F3E8FF",
                      color: "#8B5CF6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconComp size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#334155",
                      }}
                    >
                      {l.type_ligne_display}
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8" }}>
                      {new Date(l.date).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#8B5CF6",
                      background: "linear-gradient(135deg, #F3E8FF, #EDE9FE)",
                      padding: "4px 10px",
                      borderRadius: "8px",
                    }}
                  >
                    {fmt(l.montant)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <button className="btn-panel-cancel" onClick={onClose}>
          Fermer
        </button>
        <button
          className="btn-panel-edit"
          style={{ background: "#F0FDF4", color: "#059669" }}
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function FacturationPage() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [resume, setResume] = useState<Resume | null>(null);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // État du panneau
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([api.get("factures/resume/"), api.get("factures/")])
      .then(([r, f]) => {
        console.log("resume:", r.data);
        console.log("factures:", f.data);
        setResume(r.data);
        setFactures(f.data);
      })
      .catch((err) => {
        console.error(
          "ERREUR FACTURATION:",
          err.response?.status,
          err.response?.data,
        );
      })
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  if (isLoading || loading) return null;

  // Filtrage simple
  const filtered = factures.filter(
    (f) =>
      f.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toString().includes(search),
  );

  const openView = (f: Facture) => {
    setSelectedFacture(f);
  };

  const closePanel = () => {
    setSelectedFacture(null);
  };

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght:700;800&family=DM+Sans:wght:400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .root  { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
        .main  { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); animation:fadeUp .4s ease; }

        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
        .page-title  { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; background: linear-gradient(135deg, #8B5CF6, #10B981); -webkit-background-clip: text; color: transparent; }
        .page-sub    { font-size:13px; color:#64748b; margin-top:6px; }

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
            margin-bottom: 24px;
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

        .table-card { background:#fff; border-radius:20px; border:1px solid #EAE8F5; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .table-head { display:grid; grid-template-columns:2fr 1fr 1.2fr 1fr 1fr; padding:14px 24px; background:#FAFAFE; border-bottom:1px solid #EAE8F5; }
        .th { font-size:11px; font-weight:700; color:#8B5CF6; text-transform:uppercase; letter-spacing:.6px; }
        .table-row { display:grid; grid-template-columns:2fr 1fr 1.2fr 1fr 1fr; padding:16px 24px; border-bottom:1px solid #F4F2F9; align-items:center; transition:background .15s; cursor:pointer; }
        .table-row:last-child { border-bottom:none; }
        .table-row:hover { background:#F8FAFC; }

        .td-name { display:flex; align-items:center; gap:12px; font-size:14px; font-weight:600; color:#1e1b4b; }
        .avatar  { width:36px; height:36px; border-radius:12px; background:linear-gradient(135deg, #F3E8FF, #D1FAE5); display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color: #7C3AED; flex-shrink:0; }
        .td-date { font-size:13px; color:#64748b; font-weight: 500; }

        .type-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:700; }

        .action-btn { display:inline-flex; align-items:center; gap:6px; background:#F0EEF9; color:#7C3AED; font-size:11px; font-weight:700; padding:6px 12px; border-radius:20px; cursor:pointer; transition:all .2s; border:none; font-family:'DM Sans',sans-serif; }
        .action-btn:hover { background:#8B5CF6; color: white; transform: translateY(-1px); }

        .empty { text-align:center; padding:60px 20px; color:#8A87A0; }

        /* Panel Styles */
        .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:200; }
        .panel   { width:520px; height:90vh; background:#fff; border-left:1px solid #EAE8F5; display:flex; flex-direction:column; overflow-y:auto; animation:slideIn .25s ease; border-radius:20px; border:1px solid #EAE8F5; }
        @keyframes slideIn { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }

        .panel-header { padding:18px 22px; border-bottom:1px solid #F0EEF9; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; background:#fff; z-index:1; }
        .panel-title  { font-family:'Syne',sans-serif; font-size:16px; font-weight:800; color:#1C1040; }
        .panel-sub    { font-size:12px; color:#8A87A0; margin-top:2px; }
        .panel-close  { width:32px; height:32px; border:1px solid #EAE8F5; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; background:#fff; color:#8A87A0; font-size:14px; transition:all .2s; }
        .panel-close:hover { background:#F0EEF9; color:#1C1040; }

        .panel-body   { padding:22px; flex:1; display:flex; flex-direction:column; gap:18px; }
        .pt-badge     { display:flex; align-items:center; gap:10px; border-radius:12px; padding:12px 16px; background: #F8FAFC; border: 1px solid #E2E8F0; }
        .pt-avatar    { width:40px; height:40px; border-radius:50%; background: linear-gradient(135deg, #8B5CF6, #10B981); color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; flex-shrink:0; }
        .pt-name      { font-size:15px; font-weight:700; color:#3C3489; }
        .pt-dr        { font-size:12px; color:#8A87A0; margin-top:2px; }
        .section-label{ font-size:11px; font-weight:700; color:#8A87A0; text-transform:uppercase; letter-spacing:.7px; margin-bottom:6px; }
        
        .panel-footer    { padding:14px 22px; background:#FAFAFE; border-top:1px solid #F0EEF9; display:flex; gap:10px; position:sticky; bottom:0; }
        .btn-panel-cancel{ flex:1; padding:10px; background:#fff; border:1px solid #E5E2F5; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#8A87A0; cursor:pointer; }
        .btn-panel-cancel:hover { border-color:#C4C0D8; color:#1C1040; }
        .btn-panel-edit  { flex:2; padding:10px; background:#F0EEF9; border:none; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#7C3AED; cursor:pointer; }
        .btn-panel-edit:hover { background:#8B5CF6; color:#fff; }
      `}</style>

      <div className="root">
        <Sidebar stats={{}} />
        <Navbar
          title="Facturation"
          subtitle={`Tableau de bord – Dr. ${username}`}
        />

        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-title">Facturation</div>
              <div className="page-sub">Suivi financier des consultations</div>
            </div>
          </div>

          {/* Recherche */}
          <div className="search-container">
            <Search size={18} color="#94a3b8" />
            <input
              className="search-input"
              placeholder="Rechercher par patient, numéro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tableau */}
          <div className="table-card">
            <div className="table-head">
              <span className="th">Patient</span>
              <span className="th">Date</span>
              <span className="th">Total</span>
              <span className="th">Statut</span>
              <span className="th">Action</span>
            </div>

            {loading ? (
              <div
                style={{ padding: 20, textAlign: "center", color: "#94a3b8" }}
              >
                Chargement...
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty">Aucune facture trouvée.</div>
            ) : (
              filtered.map((f) => {
                const statutInfo =
                  statutConfig[f.statut] ?? statutConfig["acompte_verse"];
                const StatutIcon = statutInfo.icon;

                return (
                  <div
                    key={f.id}
                    className="table-row"
                    onClick={() => openView(f)}
                  >
                    <div className="td-name">
                      <div className="avatar">
                        {f.patient_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      {f.patient_name || "—"}
                    </div>
                    <div className="td-date">
                      {new Date(f.created_at).toLocaleDateString("fr-FR")}
                    </div>
                    <div>
                      <span
                        className="type-badge"
                        style={{ color: "#1e293b", background: "#F1F5F9" }}
                      >
                        {fmt(f.montant_total)}
                      </span>
                    </div>
                    <div>
                      <span
                        className="type-badge"
                        style={{
                          color: statutInfo.color,
                          background: statutInfo.bg,
                        }}
                      >
                        <StatutIcon size={12} strokeWidth={2.5} />
                        {f.statut_display}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="action-btn">
                        <Eye size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Panneau Détail */}
        {selectedFacture && (
          <div
            className="overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) closePanel();
            }}
          >
            <div className="panel">
              <ViewPanel facture={selectedFacture} onClose={closePanel} />
            </div>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}
