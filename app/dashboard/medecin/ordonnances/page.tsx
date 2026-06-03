"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";

interface Stats { rendezvous: number; consultations: number; ordonnances: number; }
interface Ordonnance {
  id: number; patient_name: string; medecin_name: string;
  date: string; date_heure: string; medicaments: string; consultation: number;
}

export default function OrdonnancesPage() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats]             = useState<Stats>({ rendezvous: 0, consultations: 0, ordonnances: 0 });
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [deleting, setDeleting]       = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    Promise.all([api.get("rendezvous/"), api.get("consultations/"), api.get("ordonnances/")])
      .then(([r, c, o]) => {
        setStats({ rendezvous: r.data.length, consultations: c.data.length, ordonnances: o.data.length });
        const sorted = [...o.data].sort((a: Ordonnance, b: Ordonnance) =>
          new Date(b.date || b.date_heure || 0).getTime() - new Date(a.date || a.date_heure || 0).getTime()
        );
        setOrdonnances(sorted);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [token, isLoading]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette ordonnance ?")) return;
    setDeleting(id);
    try {
      await api.delete(`ordonnances/${id}/`);
      setOrdonnances(prev => prev.filter(o => o.id !== id));
      setStats(prev => ({ ...prev, ordonnances: prev.ordonnances - 1 }));
    } catch { alert("Erreur lors de la suppression."); }
    finally { setDeleting(null); }
  };

  if (isLoading) return null;

  const filtered = ordonnances.filter(o =>
    (o.patient_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (o.medicaments ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const previewMeds = (text: string) => {
    const lines = text.split("\n").filter(l => l.trim() && !l.startsWith("Notes"));
    if (!lines.length) return "—";
    const first = lines[0].replace(/^[-•]\s*/, "").trim();
    return lines.length > 1 ? `${first} +${lines.length - 1}` : first;
  };

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes countPop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}

        :root{
          --bg:#F4F5F9;--card:#FFFFFF;--ink:#111827;--ink2:#374151;--muted:#9CA3AF;
          --border:#E5E7EB;--border-light:#F3F4F6;
          --accent:#4F6BF6;--accent-soft:#EEF2FF;--accent-hover:#3B52D9;
          --green:#10B981;--green-soft:#ECFDF5;
          --red:#EF4444;--red-soft:#FEF2F2;
          --amber:#F59E0B;--amber-soft:#FFFBEB;
          --radius:14px;--radius-lg:20px;
          --shadow-sm:0 1px 3px rgba(0,0,0,.04);
          --shadow:0 4px 20px rgba(0,0,0,.06);
          --shadow-lg:0 12px 40px rgba(0,0,0,.08);
        }

        .root{min-height:100vh;background:var(--bg);font-family:'Inter',sans-serif;display:flex}
        .main{margin-left:260px;flex:1;padding:2rem 2.5rem;padding-top:calc(70px + 2rem);animation:fadeUp .5s ease}

        /* ── Header ── */
        .page-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:36px}
        .page-eyebrow{font-size:11px;font-weight:700;color:var(--accent);letter-spacing:1.8px;text-transform:uppercase;margin-bottom:8px}
        .page-title{font-family:'Playfair Display',serif;font-size:34px;font-weight:600;color:var(--ink);letter-spacing:-.5px}
        .page-sub{font-size:13px;color:var(--muted);margin-top:6px}

        .btn-new{display:flex;align-items:center;gap:10px;background:var(--accent);color:#fff;border:none;border-radius:12px;padding:12px 24px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .25s;box-shadow:0 4px 16px rgba(79,107,246,.25)}
        .btn-new:hover{background:var(--accent-hover);transform:translateY(-2px);box-shadow:0 8px 28px rgba(79,107,246,.35)}
        .btn-new-icon{width:24px;height:24px;border-radius:7px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:16px}

        /* ── Stats ── */
        .stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px}
        .stat-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:22px 24px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden}
        .stat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:transparent;transition:background .25s}
        .stat-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg);border-color:transparent}
        .stat-card:hover::before{background:var(--accent)}
        .stat-card:nth-child(2):hover::before{background:var(--green)}
        .stat-card:nth-child(3):hover::before{background:var(--amber)}
        .stat-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
        .stat-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px}
        .stat-icon.s1{background:var(--accent-soft)}
        .stat-icon.s2{background:var(--green-soft)}
        .stat-icon.s3{background:var(--amber-soft)}
        .stat-val{font-family:'Playfair Display',serif;font-size:30px;font-weight:600;color:var(--ink);animation:countPop .4s ease}
        .stat-lbl{font-size:12.5px;color:var(--muted);font-weight:500;margin-top:2px}

        /* ── Search ── */
        .toolbar{display:flex;gap:12px;margin-bottom:20px}
        .search-wrap{flex:1;background:var(--card);border:1.5px solid var(--border);border-radius:12px;padding:0 18px;display:flex;align-items:center;gap:12px;height:48px;transition:all .2s}
        .search-wrap:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px rgba(79,107,246,.08)}
        .search-icon{font-size:16px;color:var(--muted);flex-shrink:0}
        .search-input{flex:1;border:none;background:transparent;font-family:'Inter',sans-serif;font-size:13.5px;color:var(--ink);outline:none}
        .search-input::placeholder{color:var(--muted)}
        .clear-btn{background:none;border:none;cursor:pointer;color:var(--muted);font-size:14px;padding:2px;transition:color .2s}
        .clear-btn:hover{color:var(--ink)}

        /* ── Table ── */
        .table-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-sm)}
        .table-head{display:grid;grid-template-columns:2.2fr 1.2fr 2.5fr 1fr;padding:14px 28px;background:var(--bg);border-bottom:1px solid var(--border)}
        .th{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px}

        .table-row{display:grid;grid-template-columns:2.2fr 1.2fr 2.5fr 1fr;padding:16px 28px;border-bottom:1px solid var(--border-light);align-items:center;transition:all .15s}
        .table-row:last-child{border-bottom:none}
        .table-row:hover{background:var(--accent-soft);margin:0 8px;padding-left:36px;padding-right:36px;border-radius:10px;border-color:transparent}

        .td-patient{display:flex;align-items:center;gap:14px}
        .avatar{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,var(--accent-soft),#DDD6FE);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--accent);flex-shrink:0}
        .pt-name{font-size:13.5px;font-weight:600;color:var(--ink)}
        .pt-ref{font-size:11px;color:var(--muted);margin-top:1px;font-weight:500}
        .td-date{font-size:13px;color:var(--ink2);font-weight:500}
        .td-meds{font-size:12.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:16px}

        .actions-cell{display:flex;gap:8px}
        .btn-sm{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;cursor:pointer;border:none;transition:all .15s}
        .btn-view{background:var(--accent-soft);color:var(--accent)}
        .btn-view:hover{background:#DDE3FD;transform:translateY(-1px)}
        .btn-del{background:var(--red-soft);color:var(--red)}
        .btn-del:hover{background:#FECACA}
        .btn-del:disabled{opacity:.35;cursor:not-allowed;transform:none}

        /* ── Empty ── */
        .empty{text-align:center;padding:80px 20px}
        .empty-icon{font-size:52px;margin-bottom:16px;opacity:.25}
        .empty-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:600;color:var(--ink);margin-bottom:8px}
        .empty-sub{font-size:13px;color:var(--muted)}
        .empty-btn{margin-top:24px;padding:12px 28px;background:var(--accent);border:none;border-radius:12px;color:#fff;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(79,107,246,.25);transition:all .2s}
        .empty-btn:hover{background:var(--accent-hover);transform:translateY(-1px)}

        /* ── Skeleton ── */
        .skel{background:linear-gradient(90deg,var(--border-light) 25%,#F0F0F5 50%,var(--border-light) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;height:14px}
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Ordonnances" subtitle={`Dr. ${username}`} />

        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-eyebrow">Prescriptions médicales</div>
              <div className="page-title">Ordonnances</div>
              <div className="page-sub">{stats.ordonnances} ordonnance{stats.ordonnances !== 1 ? "s" : ""} enregistrée{stats.ordonnances !== 1 ? "s" : ""}</div>
            </div>
            <button className="btn-new" onClick={() => router.push("/dashboard/medecin/ordonnances/nouvelle")}>
              <span className="btn-new-icon">＋</span> Nouvelle ordonnance
            </button>
          </div>

          <div className="stats-row">
            {[
              { icon: "📅", cls: "s1", val: stats.rendezvous,    lbl: "Rendez-vous",  path: "/dashboard/medecin/rendezvous" },
              { icon: "🩺", cls: "s2", val: stats.consultations, lbl: "Consultations", path: "/dashboard/medecin/consultations" },
              { icon: "📋", cls: "s3", val: stats.ordonnances,   lbl: "Ordonnances",  path: "/dashboard/medecin/ordonnances" },
            ].map(s => (
              <div key={s.lbl} className="stat-card" onClick={() => router.push(s.path)}>
                <div className="stat-top">
                  <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                </div>
                <div className="stat-val">{s.val}</div>
                <div className="stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Rechercher par patient ou médicament…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="clear-btn" onClick={() => setSearch("")}>✕</button>}
            </div>
          </div>

          <div className="table-card">
            <div className="table-head">
              <span className="th">Patient</span>
              <span className="th">Date</span>
              <span className="th">Médicaments</span>
              <span className="th">Actions</span>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="table-row">
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div className="skel" style={{width:38,height:38,borderRadius:10,flexShrink:0}} />
                    <div className="skel" style={{width:"55%"}} />
                  </div>
                  <div className="skel" style={{width:"55%"}} />
                  <div className="skel" style={{width:"70%"}} />
                  <div className="skel" style={{width:"40%"}} />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">📋</div>
                <div className="empty-title">{search ? `Aucun résultat pour « ${search} »` : "Aucune ordonnance"}</div>
                <div className="empty-sub">{search ? "Essayez un autre terme de recherche." : "Créez votre première ordonnance pour commencer."}</div>
                {!search && <button className="empty-btn" onClick={() => router.push("/dashboard/medecin/ordonnances/nouvelle")}>＋ Nouvelle ordonnance</button>}
              </div>
            ) : filtered.map(o => (
              <div key={o.id} className="table-row">
                <div className="td-patient">
                  <div className="avatar">{(o.patient_name ?? "?").charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="pt-name">{o.patient_name || "—"}</div>
                    <div className="pt-ref">#ORD-{String(o.id).padStart(4,"0")}</div>
                  </div>
                </div>
                <div className="td-date">
                  {(o.date || o.date_heure)
                    ? new Date(o.date || o.date_heure).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" })
                    : "—"}
                </div>
                <div className="td-meds" title={o.medicaments}>{previewMeds(o.medicaments || "")}</div>
                <div className="actions-cell">
                  <button className="btn-sm btn-view" onClick={() => router.push(`/dashboard/medecin/ordonnances/${o.id}`)}>Voir</button>
                  <button className="btn-sm btn-del" disabled={deleting === o.id} onClick={() => handleDelete(o.id)}>
                    {deleting === o.id ? "…" : "Supprimer"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}