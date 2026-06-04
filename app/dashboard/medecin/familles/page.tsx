"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import PrivateRoute from "@/components/PrivateRoute";
import api from "@/lib/api";

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

const LIEN_LABELS: Record<string, string> = {
  enfant:      "Enfant",
  conjoint:    "Conjoint(e)",
  pere:        "Père",
  mere:        "Mère",
  frere_soeur: "Frère / Sœur",
  autre:       "Autre",
};

const getAge = (dob: string | null) => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
};

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function MedecinFamillesPage() {
  const { token, isLoading, username } = useAuth();

  const [familles, setFamilles]   = useState<Famille[]>([]);
  const [loading, setLoading]     = useState(true);
  const [errorMsg, setErrorMsg]   = useState("");
  const [search, setSearch]       = useState("");
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());

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
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = familles.filter(f => {
    const q = search.toLowerCase();
    if (!q) return true;
    const chefName = `${f.chef.prenom} ${f.chef.nom}`.toLowerCase();
    return chefName.includes(q) || f.membres.some(m =>
      `${m.prenom} ${m.nom}`.toLowerCase().includes(q)
    );
  });

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin     { to{transform:rotate(360deg);} }
        @keyframes pulse    { 0%,100%{opacity:1;}50%{opacity:0.5;} }

        .fam-page-bg { background:linear-gradient(135deg,#F0FDF9 0%,#ECFDF5 50%,#F0F9FF 100%); min-height:100vh; font-family:'DM Sans',sans-serif; }
        .fam-card { background:rgba(255,255,255,0.82); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.9); border-radius:20px; box-shadow:0 4px 20px rgba(16,185,129,0.07); animation:fadeInUp 0.45s ease backwards; transition:all 0.3s ease; }
        .fam-card:hover { box-shadow:0 8px 28px rgba(16,185,129,0.12); transform:translateY(-3px); }
        .fam-input { width:100%; padding:12px 16px 12px 44px; border-radius:14px; border:1.5px solid #E2E8F0; background:rgba(255,255,255,0.9); font-family:'DM Sans',sans-serif; font-size:14px; color:#1E293B; transition:all 0.25s ease; outline:none; }
        .fam-input:focus { border-color:#10B981; box-shadow:0 0 0 4px rgba(16,185,129,0.1); background:#fff; }
        .fam-input::placeholder { color:#94A3B8; }
        .fam-gradient-text { background:linear-gradient(135deg,#10B981,#8B5CF6); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .expand-btn { background:rgba(16,185,129,0.07); border:1.5px solid rgba(16,185,129,0.2); border-radius:10px; padding:8px 16px; font-size:12px; font-weight:700; color:#059669; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.2s ease; display:flex; align-items:center; gap:6px; }
        .expand-btn:hover { background:rgba(16,185,129,0.14); border-color:rgba(16,185,129,0.4); }
        .membre-row { display:flex; align-items:center; gap:14px; padding:12px 16px; border-radius:14px; background:rgba(16,185,129,0.03); border:1px solid rgba(16,185,129,0.08); margin-bottom:8px; transition:all 0.2s ease; }
        .membre-row:last-child { margin-bottom:0; }
        .membre-row:hover { background:rgba(16,185,129,0.07); border-color:rgba(16,185,129,0.18); }
        .badge { font-size:11px; padding:3px 10px; border-radius:8px; font-weight:700; }
        .badge-green { background:rgba(16,185,129,0.08); color:#059669; border:1px solid rgba(16,185,129,0.15); }
        .badge-purple { background:rgba(139,92,246,0.08); color:#8B5CF6; border:1px solid rgba(139,92,246,0.15); }
        .badge-blue { background:rgba(59,130,246,0.08); color:#3B82F6; border:1px solid rgba(59,130,246,0.15); }
        .stat-pill { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.8); border:1px solid rgba(16,185,129,0.15); border-radius:10px; padding:6px 14px; font-size:13px; font-weight:600; color:#374151; }
      `}</style>

      <div className="fam-page-bg" style={{ display:"flex" }}>
        <Sidebar stats={{}} />
        <Navbar title="Comptes Familles" subtitle={`Vue d'ensemble de vos familles, Dr. ${username}`} />

        <main style={{ flex:1, marginLeft:240, padding:"2rem 2.5rem", paddingTop:"100px" }}>

          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:18, marginBottom:28, animation:"fadeInUp 0.4s ease backwards" }}>
            <div style={{ width:56, height:56, borderRadius:18, background:"linear-gradient(135deg,#10B981,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(16,185,129,0.35)", flexShrink:0 }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:"#1E1B4B", margin:0, lineHeight:1.2 }}>
                Comptes <span className="fam-gradient-text">Familles</span>
              </h1>
              <p style={{ fontSize:14, color:"#64748B", margin:0, marginTop:2 }}>
                Familles dont vous êtes le médecin traitant
              </p>
            </div>
            {/* Stats */}
            <div style={{ display:"flex", gap:10 }}>
              <div className="stat-pill">
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#10B981", animation:"pulse 2s ease infinite" }}/>
                {familles.length} famille{familles.length !== 1 ? "s" : ""}
              </div>
              <div className="stat-pill">
                👥 {familles.reduce((acc, f) => acc + f.membres.length, 0)} membres
              </div>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FEE2E2", color:"#DC2626", padding:"12px 20px", borderRadius:14, marginBottom:20, fontWeight:600, fontSize:13 }}>
              {errorMsg}
            </div>
          )}

          {/* Search */}
          <div style={{ position:"relative", marginBottom:24 }}>
            <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="fam-input"
              placeholder="Rechercher une famille ou un membre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Loading */}
          {loading ? (
            <div style={{ textAlign:"center", padding:"4rem 0", color:"#94A3B8" }}>
              <div style={{ width:36, height:36, border:"3px solid #E2E8F0", borderTopColor:"#10B981", borderRadius:"50%", animation:"spin 0.7s linear infinite", margin:"0 auto 16px" }}/>
              <p style={{ fontWeight:600 }}>Chargement des familles...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="fam-card" style={{ padding:"4rem 2rem", textAlign:"center", color:"#94A3B8" }}>
              <div style={{ fontSize:56, marginBottom:16 }}>👨‍👩‍👧‍👦</div>
              <p style={{ fontSize:18, fontWeight:600, color:"#475569", marginBottom:8 }}>
                {search ? "Aucun résultat trouvé" : "Aucun compte famille"}
              </p>
              <p style={{ fontSize:14 }}>
                {search
                  ? "Essayez un autre terme de recherche."
                  : "Vous apparaîtrez ici dès qu'un patient vous désigne comme médecin traitant."}
              </p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {filtered.map((f, i) => {
                const open    = expanded.has(f.id);
                const chefAge = getAge(f.chef.date_naissance);
                return (
                  <div key={f.id} className="fam-card" style={{ padding:0, overflow:"hidden", animationDelay:`${i * 0.07}s` }}>

                    {/* Chef row */}
                    <div style={{ padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
                      {/* Avatar */}
                      <div style={{ width:48, height:48, borderRadius:15, background:"linear-gradient(135deg,#10B981,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:17, fontWeight:700, flexShrink:0 }}>
                        {f.chef.prenom?.charAt(0) ?? "?"}{f.chef.nom?.charAt(0) ?? ""}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                          <p style={{ fontSize:16, fontWeight:700, color:"#1E293B", margin:0 }}>
                            {f.chef.prenom} {f.chef.nom}
                          </p>
                          <span style={{ fontSize:11, padding:"3px 10px", borderRadius:8, background:"linear-gradient(135deg,#10B981,#8B5CF6)", color:"white", fontWeight:700 }}>
                            👑 Chef de famille
                          </span>
                          {chefAge !== null && (
                            <span className="badge badge-green">{chefAge} ans</span>
                          )}
                        </div>
                        <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
                          {f.chef.medecin_nom && (
                            <span className="badge badge-blue">🩺 {f.chef.medecin_nom}</span>
                          )}
                          <span className="badge badge-purple">
                            {f.membres.length} membre{f.membres.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Expand button */}
                      {f.membres.length > 0 && (
                        <button className="expand-btn" onClick={() => toggleExpand(f.id)}>
                          {open ? "Masquer" : "Voir membres"}
                          <svg style={{ transform: open ? "rotate(180deg)" : "none", transition:"transform 0.25s" }} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Members list (expandable) */}
                    {open && f.membres.length > 0 && (
                      <div style={{ padding:"0 24px 20px", borderTop:"1px solid rgba(16,185,129,0.08)" }}>
                        <p style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"1px", margin:"16px 0 12px" }}>
                          Membres de la famille
                        </p>
                        {f.membres.map(m => {
                          const age = getAge(m.date_naissance);
                          return (
                            <div key={m.id} className="membre-row">
                              <div style={{ width:36, height:36, borderRadius:11, background:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#059669", fontSize:13, fontWeight:700, flexShrink:0 }}>
                                {m.prenom.charAt(0)}{m.nom.charAt(0)}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{ fontSize:14, fontWeight:600, color:"#1E293B", margin:0 }}>
                                  {m.prenom} {m.nom}
                                </p>
                                <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                                  <span className="badge badge-purple">
                                    {LIEN_LABELS[m.lien_parente] ?? m.lien_parente}
                                  </span>
                                  {age !== null && (
                                    <span className="badge badge-green">{age} ans</span>
                                  )}
                                  {m.medecin_nom && (
                                    <span className="badge badge-blue">🩺 {m.medecin_nom}</span>
                                  )}
                                </div>
                              </div>
                              <span style={{ fontSize:12, color:"#94A3B8", fontWeight:500 }}>
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