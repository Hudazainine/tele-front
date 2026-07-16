"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import PrivateRoute from "@/components/PrivateRoute";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────────
// IMPORTS LUCIDE ICONS
// ─────────────────────────────────────────────────────────────
import {
  Users,
  Search,
  ChevronDown,
  Crown,
  Stethoscope,
  User,
  Home,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface MembreFamille {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  lien_parente: string;
  sexe: "homme" | "femme";
  medecin_nom: string | null;
}

interface ChefFamille {
  id: number;
  prenom: string;
  nom: string;
  date_naissance: string | null;
  medecin_traitant_id: number | null;
  medecin_nom: string | null;
}

interface Famille {
  id: string;
  chef: ChefFamille;
  membres: MembreFamille[];
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────────
const LIEN_LABELS: Record<string, string> = {
  enfant: "Enfant",
  conjoint: "Conjoint(e)",
  pere: "Père",
  mere: "Mère",
  frere_soeur: "Frère / Sœur",
  autre: "Autre",
};

const getAge = (dob: string | null) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
};

// ─────────────────────────────────────────────────────────────
// STYLES UNIFIÉS
// ─────────────────────────────────────────────────────────────
const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght:700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }

  .root { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
  .main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2rem); animation:fadeUp .4s ease; display:flex; flex-direction:column; gap:24px; }

  .page-header { display:flex; align-items:center; gap:18px; }
  .page-icon { width:56px; height:56px; border-radius:18px; background:linear-gradient(135deg, #8B5CF6, #10B981); display:flex; align-items:center; justify-content:center; color:white; box-shadow:0 8px 24px rgba(139,92,246,0.35); flex-shrink:0; }
  .page-title { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; background:linear-gradient(135deg, #8B5CF6, #10B981); -webkit-background-clip:text; color:transparent; }
  .page-sub { font-size:13px; color:#64748b; margin-top:4px; }

  /* Toolbar (Search + Filtres sur la même ligne) */
  .toolbar { display:flex; align-items:center; gap:16px; }
  .search-container { flex:1; position:relative; background:white; border:1px solid #EAE8F5; border-radius:14px; display:flex; align-items:center; transition:all .2s; box-shadow:0 1px 2px rgba(0,0,0,0.02); }
  .search-container:focus-within { border-color:#8B5CF6; box-shadow:0 0 0 3px rgba(139,92,246,0.1); }
  .search-icon { position:absolute; left:14px; color:#94A3B8; pointer-events:none; }
  .search-input { width:100%; padding:12px 16px 12px 44px; border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:14px; color:#1E293B; outline:none; }
  
  .stat-pill { display:inline-flex; align-items:center; gap:8px; background:white; border:1px solid #EAE8F5; border-radius:12px; padding:10px 16px; font-size:13px; font-weight:600; color:#475569; white-space:nowrap; }
  .stat-dot { width:8px; height:8px; border-radius:50%; background:#10B981; box-shadow: 0 0 8px rgba(16,185,129,0.6); }

  /* Cards */
  .card { background:#fff; border-radius:20px; border:1px solid #EAE8F5; box-shadow:0 1px 3px rgba(0,0,0,0.02); overflow:hidden; animation:fadeUp .4s ease backwards; transition:all .25s ease; }
  .card:hover { box-shadow:0 8px 24px rgba(139,92,246,0.08); transform:translateY(-2px); }

  .card-header { padding:20px 24px; display:flex; align-items:center; gap:16px; }
  .chef-avatar { width:48px; height:48px; border-radius:14px; background:linear-gradient(135deg, #8B5CF6, #10B981); display:flex; align-items:center; justify-content:center; color:white; font-size:16px; font-weight:800; font-family:'Syne',sans-serif; flex-shrink:0; }
  .chef-info { flex:1; min-width:0; }
  .chef-name { font-size:16px; font-weight:700; color:#1E293B; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .chef-meta { display:flex; gap:8px; margin-top:6px; flex-wrap:wrap; }
  
  .badge { font-size:11px; padding:3px 10px; border-radius:8px; font-weight:700; display:inline-flex; align-items:center; gap:4px; }
  .badge-purple { background:rgba(139,92,246,0.08); color:#8B5CF6; border:1px solid rgba(139,92,246,0.15); }
  .badge-green { background:rgba(16,185,129,0.08); color:#059669; border:1px solid rgba(16,185,129,0.15); }
  .badge-blue { background:rgba(59,130,246,0.08); color:#3B82F6; border:1px solid rgba(59,130,246,0.15); }
  .badge-chef { background:linear-gradient(135deg, #8B5CF6, #10B981); color:white; border:none; }

  .btn-expand { background:rgba(139,92,246,0.06); border:1.5px solid rgba(139,92,246,0.15); border-radius:12px; padding:8px 16px; font-size:12px; font-weight:700; color:#7C3AED; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:6px; }
  .btn-expand:hover { background:rgba(139,92,246,0.12); border-color:rgba(139,92,246,0.3); }
  .btn-expand svg { transition:transform .25s ease; }

  .members-list { padding:0 24px 20px; border-top:1px solid #F1F5F9; }
  .members-title { font-size:11px; font-weight:700; color:#94A3B8; text-transform:uppercase; letter-spacing:.8px; margin:16px 0 12px; }
  
  .membre-row { display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:14px; background:#FAFAFE; border:1px solid #F1F5F9; margin-bottom:8px; transition:all .2s; }
  .membre-row:last-child { margin-bottom:0; }
  .membre-row:hover { background:#F3E8FF; border-color:#E9D5FF; }
  .membre-avatar { width:36px; height:36px; border-radius:11px; background:linear-gradient(135deg, #F3E8FF, #D1FAE5); display:flex; align-items:center; justify-content:center; color:#7C3AED; font-size:13px; font-weight:700; font-family:'Syne',sans-serif; flex-shrink:0; }
  .membre-info { flex:1; min-width:0; }
  .membre-name { font-size:14px; font-weight:600; color:#1E293B; }
  .membre-meta { display:flex; gap:6px; margin-top:4px; flex-wrap:wrap; }
  .membre-sex { font-size:13px; color:#94A3B8; font-weight:500; }

  .error-box { background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; border-radius:14px; padding:14px 18px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:10px; }
  .empty-state { text-align:center; padding:60px 20px; color:#8A87A0; }

  .spin { animation:spin 0.7s linear infinite; }
`;

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function MedecinFamillesPage() {
  const { token, isLoading, username } = useAuth();

  const [familles, setFamilles] = useState<Famille[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("familles/");
      setFamilles(res.data);
      setErrorMsg("");
    } catch {
      setErrorMsg("Impossible de charger les comptes familles.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoading && token) fetchData();
  }, [token, isLoading, fetchData]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = familles.filter((f) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const chefName = `${f.chef.prenom} ${f.chef.nom}`.toLowerCase();
    return (
      chefName.includes(q) ||
      f.membres.some((m) => `${m.prenom} ${m.nom}`.toLowerCase().includes(q))
    );
  });

  const totalMembres = familles.reduce((acc, f) => acc + f.membres.length, 0);

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{PAGE_STYLES}</style>

      <div className="root">
        <Sidebar stats={{}} />
        <Navbar
          title="Comptes Familles"
          subtitle={`Vue d'ensemble de vos familles, Dr. ${username}`}
        />

        <main className="main">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Comptes Familles</h1>
              <p className="page-sub">
                Familles dont vous êtes le médecin traitant
              </p>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="error-box">
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}

          {/* Toolbar (Filtres sur la même ligne) */}
          <div className="toolbar">
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher une famille ou un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="stat-pill">
              <span className="stat-dot" />
              {familles.length} Famille{familles.length !== 1 ? "s" : ""}
            </div>

            <div className="stat-pill">
              <Users size={16} color="#8B5CF6" />
              {totalMembres} Membres
            </div>
          </div>

          {/* Loading / Empty / List */}
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "4rem 0",
                color: "#94A3B8",
              }}
            >
              <Loader2
                size={40}
                className="spin"
                style={{ color: "#8B5CF6" }}
              />
              <p style={{ fontWeight: 600 }}>Chargement des familles...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div style={{ color: "#E2E8F0", marginBottom: 16 }}>
                  <Users size={56} />
                </div>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: 8,
                  }}
                >
                  {search ? "Aucun résultat trouvé" : "Aucun compte famille"}
                </p>
                <p style={{ fontSize: 14, color: "#94A3B8" }}>
                  {search
                    ? "Essayez un autre terme de recherche."
                    : "Vous apparaîtrez ici dès qu'un patient vous désigne comme médecin traitant."}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {filtered.map((f, i) => {
                const open = expanded.has(f.id);
                const chefAge = getAge(f.chef.date_naissance);
                return (
                  <div
                    key={f.id}
                    className="card"
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    {/* Chef Row */}
                    <div className="card-header">
                      <div className="chef-avatar">
                        {f.chef.prenom?.charAt(0) ?? "?"}
                        {f.chef.nom?.charAt(0) ?? ""}
                      </div>

                      <div className="chef-info">
                        <div className="chef-name">
                          {f.chef.prenom} {f.chef.nom}
                          <span className="badge badge-chef">
                            <Crown size={11} /> Chef
                          </span>
                          {chefAge !== null && (
                            <span className="badge badge-green">
                              {chefAge} ans
                            </span>
                          )}
                        </div>
                        <div className="chef-meta">
                          {f.chef.medecin_nom && (
                            <span className="badge badge-blue">
                              <Stethoscope size={10} /> {f.chef.medecin_nom}
                            </span>
                          )}
                          <span className="badge badge-purple">
                            <Users size={10} /> {f.membres.length} membre
                            {f.membres.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {f.membres.length > 0 && (
                        <button
                          className="btn-expand"
                          onClick={() => toggleExpand(f.id)}
                        >
                          {open ? "Masquer" : "Voir membres"}
                          <ChevronDown
                            size={14}
                            style={{
                              transform: open
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            }}
                          />
                        </button>
                      )}
                    </div>

                    {/* Members List */}
                    {open && f.membres.length > 0 && (
                      <div className="members-list">
                        <div className="members-title">
                          Membres de la famille
                        </div>
                        {f.membres.map((m) => {
                          const age = getAge(m.date_naissance);
                          return (
                            <div key={m.id} className="membre-row">
                              <div className="membre-avatar">
                                {m.prenom.charAt(0)}
                                {m.nom.charAt(0)}
                              </div>
                              <div className="membre-info">
                                <div className="membre-name">
                                  {m.prenom} {m.nom}
                                </div>
                                <div className="membre-meta">
                                  <span className="badge badge-purple">
                                    {LIEN_LABELS[m.lien_parente] ??
                                      m.lien_parente}
                                  </span>
                                  {age !== null && (
                                    <span className="badge badge-green">
                                      {age} ans
                                    </span>
                                  )}
                                  {m.medecin_nom && (
                                    <span className="badge badge-blue">
                                      <Stethoscope size={10} /> {m.medecin_nom}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="membre-sex">
                                {m.sexe === "homme" ? "♂" : "♀"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </PrivateRoute>
  );
}
