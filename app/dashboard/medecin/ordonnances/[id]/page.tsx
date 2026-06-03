"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import PrivateRoute from "../../../../../components/PrivateRoute";
import api from "../../../../../lib/api";
import Sidebar from "../../../../../components/Sidebar";
import Navbar from "../../../../../components/Navbar";

interface Stats { rendezvous: number; consultations: number; ordonnances: number; }
interface Ordonnance {
  id: number; patient_name: string; medecin_name: string;
  date: string; date_heure: string; medicaments: string; consultation: number;
}

function parseMeds(text: string) {
  if (!text) return [];
  return text.split("\n")
    .filter(l => l.trim() && !l.startsWith("Notes"))
    .map(l => {
      const clean = l.replace(/^[-•]\s*/, "").trim();
      const idx   = clean.indexOf(" — ");
      return idx !== -1
        ? { nom: clean.slice(0, idx), det: clean.slice(idx + 3) }
        : { nom: clean, det: "" };
    });
}

function parseNotes(text: string) {
  const idx = text.indexOf("Notes :\n");
  return idx !== -1 ? text.slice(idx + 8).trim() : "";
}

export default function OrdonnanceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats]       = useState<Stats>({ rendezvous: 0, consultations: 0, ordonnances: 0 });
  const [ordo, setOrdo]         = useState<Ordonnance | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    Promise.all([api.get("rendezvous/"), api.get("consultations/"), api.get("ordonnances/"), api.get(`ordonnances/${id}/`)])
      .then(([r, c, o, detail]) => {
        setStats({ rendezvous: r.data.length, consultations: c.data.length, ordonnances: o.data.length });
        setOrdo(detail.data);
      })
      .catch(err => { if (err?.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [token, isLoading, id]);

  const handleDelete = async () => {
    if (!confirm("Supprimer cette ordonnance définitivement ?")) return;
    try { await api.delete(`ordonnances/${id}/`); router.push("/dashboard/medecin/ordonnances"); }
    catch { alert("Erreur lors de la suppression."); }
  };

  if (isLoading || loading) return null;

  const today   = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const meds    = ordo ? parseMeds(ordo.medicaments) : [];
  const notes   = ordo ? parseNotes(ordo.medicaments) : "";
  const dateStr = ordo
    ? new Date(ordo.date || ordo.date_heure || "").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : today;

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}

        :root{
          --bg:#F4F5F9;--card:#FFFFFF;--ink:#111827;--ink2:#374151;--muted:#9CA3AF;
          --border:#E5E7EB;--border-light:#F3F4F6;
          --accent:#4F6BF6;--accent-soft:#EEF2FF;
          --green:#10B981;--green-soft:#ECFDF5;
          --red:#EF4444;--red-soft:#FEF2F2;
          --amber:#F59E0B;
          --radius:14px;--radius-lg:20px;
          --shadow-sm:0 1px 3px rgba(0,0,0,.04);
          --shadow:0 4px 20px rgba(0,0,0,.06);
          --shadow-lg:0 12px 40px rgba(0,0,0,.08);
        }

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .root{min-height:100vh;background:var(--bg);font-family:'Inter',sans-serif;display:flex}
        .main{margin-left:260px;flex:1;padding:2rem 2.5rem;padding-top:calc(70px + 2rem);animation:fadeUp .4s ease}

        /* ── Breadcrumb ── */
        .bc{display:flex;align-items:center;gap:8px;margin-bottom:28px;font-size:13px;color:var(--muted)}
        .bc-link{cursor:pointer;transition:color .2s;text-decoration:none}
        .bc-link:hover{color:var(--accent)}
        .bc-sep{color:var(--border)}
        .bc-current{color:var(--ink);font-weight:600}

        /* ── Layout ── */
        .layout{display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:start}

        /* ── Paper ── */
        .paper-wrap{background:var(--card);border-radius:var(--radius-lg);border:1px solid var(--border);overflow:hidden;box-shadow:var(--shadow)}
        .paper-toolbar{display:flex;gap:10px;padding:16px 24px;background:var(--bg);border-bottom:1px solid var(--border)}

        .btn-t{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:10px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;border:1.5px solid transparent}
        .btn-back-t{background:#fff;border-color:var(--border);color:var(--muted)}
        .btn-back-t:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
        .btn-print-t{background:var(--accent);color:#fff;border-color:var(--accent);box-shadow:0 4px 16px rgba(79,107,246,.2)}
        .btn-print-t:hover{background:var(--accent-hover);border-color:var(--accent-hover);transform:translateY(-1px);box-shadow:0 6px 24px rgba(79,107,246,.3)}
        .btn-del-t{margin-left:auto;background:#fff;border-color:rgba(239,68,68,.25);color:var(--red)}
        .btn-del-t:hover{background:var(--red-soft);border-color:var(--red)}

        .paper-doc{padding:48px 44px;font-family:'Playfair Display',serif;min-height:600px;position:relative}
        .paper-doc::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--ink),var(--accent),var(--green))}

        .p-head{padding-bottom:18px;border-bottom:2px solid var(--ink);margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start}
        .p-dr{font-size:22px;font-weight:700;color:var(--ink);letter-spacing:-.4px}
        .p-sub{font-size:12px;color:var(--muted);margin-top:6px;line-height:1.8;font-family:'Inter',sans-serif;font-weight:400}
        .p-stamp{width:64px;height:64px;border-radius:50%;border:1.5px dashed var(--border);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--muted);text-align:center;font-family:'Inter',sans-serif;line-height:1.3;flex-shrink:0}

        .p-ttl{text-align:center;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--ink);padding:10px 0 16px;border-bottom:1px solid var(--border);margin-bottom:22px;font-family:'Inter',sans-serif}

        .p-meta{display:flex;justify-content:space-between;gap:24px;margin-bottom:28px;font-family:'Inter',sans-serif}
        .p-meta-item{flex:1}
        .p-meta-lbl{font-size:9.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px}
        .p-meta-val{font-size:14px;font-weight:600;color:var(--ink);border-bottom:1px solid #D1D5DB;padding-bottom:5px;display:block;min-height:22px}

        .rx-section-hd{display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid var(--border);font-family:'Inter',sans-serif}
        .rx-section-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);flex-shrink:0}
        .rx-section-lbl{font-size:9.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
        .rx-section-count{margin-left:auto;font-size:10px;font-weight:700;color:var(--accent);background:var(--accent-soft);padding:3px 10px;border-radius:20px}

        .rx-item{display:flex;align-items:baseline;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-light);transition:all .15s}
        .rx-item:last-child{border-bottom:none}
        .rx-item:hover{background:var(--bg);margin:0 -14px;padding-left:14px;padding-right:14px;border-radius:8px}
        .rx-num{width:22px;height:22px;border-radius:6px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--muted);flex-shrink:0;font-family:'Inter',sans-serif}
        .rx-body{flex:1}
        .rx-name{font-size:14.5px;font-weight:600;color:var(--ink);line-height:1.4}
        .rx-det{font-size:12px;color:var(--muted);margin-top:3px;font-family:'Inter',sans-serif}
        .rx-empty{font-size:13px;color:#D1D5DB;font-style:italic;font-family:'Inter',sans-serif;padding:12px 0}

        .p-notes{font-size:12px;color:var(--ink2);line-height:1.8;margin-top:22px;padding:14px 16px;background:var(--bg);border:1px dashed var(--border);border-radius:10px;white-space:pre-wrap;font-family:'Inter',sans-serif}

        .p-foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:44px;padding-top:20px;border-top:1px solid var(--border)}
        .p-date{font-size:12px;color:var(--muted);font-family:'Inter',sans-serif}
        .sig-area{text-align:center}
        .sig-line{width:100px;border-top:1px solid var(--muted);margin:0 auto 6px}
        .sig-name{font-size:12px;color:var(--ink2);font-family:'Inter',sans-serif;font-weight:600}

        /* ── Info panel ── */
        .info-panel{display:flex;flex-direction:column;gap:16px}
        .info-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:22px 24px;box-shadow:var(--shadow-sm)}
        .info-card-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:600;color:var(--ink);margin-bottom:18px;display:flex;align-items:center;gap:10px}
        .info-card-title::before{content:'';width:3px;height:16px;border-radius:3px;background:var(--accent);flex-shrink:0}
        .info-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-light)}
        .info-row:last-child{border-bottom:none}
        .info-lbl{font-size:12px;color:var(--muted);font-weight:500}
        .info-val{font-size:13px;color:var(--ink);font-weight:600;text-align:right}

        .badge{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700}
        .badge-green{background:var(--green-soft);color:var(--green)}
        .badge-accent{background:var(--accent-soft);color:var(--accent)}

        .med-chip{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-light)}
        .med-chip:last-child{border-bottom:none}
        .med-chip-name{font-size:12.5px;font-weight:600;color:var(--ink)}
        .med-chip-det{font-size:10.5px;font-weight:600;color:var(--accent);background:var(--accent-soft);padding:3px 10px;border-radius:20px}

        /* ── Not found ── */
        .not-found{text-align:center;padding:100px 20px}
        .nf-icon{font-size:56px;opacity:.2;margin-bottom:20px}
        .nf-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:600;color:var(--ink);margin-bottom:8px}
        .nf-sub{font-size:13px;color:var(--muted);line-height:1.6}
        .nf-btn{margin-top:28px;padding:12px 28px;background:var(--accent);border:none;border-radius:12px;color:#fff;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(79,107,246,.25);transition:all .2s}
        .nf-btn:hover{background:var(--accent-hover);transform:translateY(-1px)}

        @media print{
          .paper-toolbar,.info-panel,.bc{display:none!important}
          .root{background:#fff!important}
          .main{margin-left:0!important;padding:0!important}
          .layout{grid-template-columns:1fr!important}
          .paper-wrap{box-shadow:none!important;border-radius:0!important;border:none!important}
          .paper-doc{padding:24px!important}
        }
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Détail ordonnance" subtitle={`Dr. ${username}`} />

        <main className="main">
          <div className="bc">
            <span className="bc-link" onClick={() => router.push("/dashboard/medecin")}>Dashboard</span>
            <span className="bc-sep">›</span>
            <span className="bc-link" onClick={() => router.push("/dashboard/medecin/ordonnances")}>Ordonnances</span>
            <span className="bc-sep">›</span>
            <span className="bc-current">#{id}</span>
          </div>

          {notFound ? (
            <div className="not-found">
              <div className="nf-icon">📋</div>
              <div className="nf-title">Ordonnance introuvable</div>
              <div className="nf-sub">Cette ordonnance n&apos;existe pas ou vous n&apos;y avez pas accès.</div>
              <button className="nf-btn" onClick={() => router.push("/dashboard/medecin/ordonnances")}>← Retour aux ordonnances</button>
            </div>
          ) : ordo ? (
            <div className="layout">
              <div className="paper-wrap">
                <div className="paper-toolbar">
                  <button className="btn-t btn-back-t" onClick={() => router.push("/dashboard/medecin/ordonnances")}>← Retour</button>
                  <button className="btn-t btn-print-t" onClick={() => window.print()}>🖨 Imprimer</button>
                  <button className="btn-t btn-del-t" onClick={handleDelete}>Supprimer</button>
                </div>

                <div className="paper-doc">
                  <div className="p-head">
                    <div>
                      <div className="p-dr">Dr. {ordo.medecin_name || username}</div>
                      <div className="p-sub">Médecin — TéléConsult</div>
                    </div>
                    <div className="p-stamp">CACHET<br />MÉDECIN</div>
                  </div>

                  <div className="p-ttl">Ordonnance médicale</div>

                  <div className="p-meta">
                    <div className="p-meta-item">
                      <div className="p-meta-lbl">Patient</div>
                      <span className="p-meta-val">{ordo.patient_name || "—"}</span>
                    </div>
                    <div className="p-meta-item" style={{textAlign:"right"}}>
                      <div className="p-meta-lbl">Date</div>
                      <span className="p-meta-val">{dateStr}</span>
                    </div>
                  </div>

                  <div className="rx-section-hd">
                    <span className="rx-section-dot" />
                    <span className="rx-section-lbl">Prescription</span>
                    {meds.length > 0 && <span className="rx-section-count">{meds.length} médicament{meds.length > 1 ? "s" : ""}</span>}
                  </div>

                  <div>
                    {meds.length === 0 ? (
                      <div className="rx-empty">Aucun médicament renseigné.</div>
                    ) : meds.map((m, i) => (
                      <div key={i} className="rx-item">
                        <span className="rx-num">{i + 1}</span>
                        <div className="rx-body">
                          <div className="rx-name">{m.nom}</div>
                          {m.det && <div className="rx-det">{m.det}</div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {notes && <div className="p-notes">{notes}</div>}

                  <div className="p-foot">
                    <div className="p-date">Le {dateStr}</div>
                    <div className="sig-area">
                      <div className="sig-line" />
                      <div className="sig-name">Dr. {ordo.medecin_name || username}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-panel">
                <div className="info-card">
                  <div className="info-card-title">Informations</div>
                  <div className="info-row">
                    <span className="info-lbl">Référence</span>
                    <span className="info-val">#ORD-{String(ordo.id).padStart(4, "0")}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-lbl">Patient</span>
                    <span className="info-val">{ordo.patient_name || "—"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-lbl">Médecin</span>
                    <span className="info-val">Dr. {ordo.medecin_name || username}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-lbl">Date</span>
                    <span className="info-val">{dateStr}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-lbl">Consultation</span>
                    <span className="info-val">#{ordo.consultation}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-lbl">Statut</span>
                    <span className="badge badge-green">✓ Émise</span>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-card-title">Médicaments ({meds.length})</div>
                  {meds.length === 0 ? (
                    <p style={{fontSize:13,color:"var(--muted)"}}>Aucun médicament.</p>
                  ) : meds.map((m, i) => (
                    <div key={i} className="med-chip">
                      <span className="med-chip-name">{m.nom}</span>
                      {m.det && <span className="med-chip-det">{m.det}</span>}
                    </div>
                  ))}
                </div>

                {notes && (
                  <div className="info-card">
                    <div className="info-card-title">Notes</div>
                    <p style={{fontSize:13,color:"var(--ink2)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{notes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </PrivateRoute>
  );
}