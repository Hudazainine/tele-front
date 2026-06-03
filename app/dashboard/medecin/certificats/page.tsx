"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";

interface Stats { rendezvous: number; consultations: number; ordonnances: number; }
interface Certificat {
  id: number;
  patient_name: string;
  date_emission: string;
  type_certificat: string;
  notes: string;
  status: string;
}

export default function Certificats() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats]           = useState<Stats>({ rendezvous: 0, consultations: 0, ordonnances: 0 });
  const [certificats, setCertificats] = useState<Certificat[]>([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    Promise.all([
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("certificats/"),
    ]).then(([r, c, cert]) => {
      setStats({ rendezvous: r.data.length, consultations: c.data.length, ordonnances: cert.data.length });
      setCertificats(cert.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token, isLoading, router]);

  if (isLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
        <div style={{ fontSize: 14, color: "#534AB7", fontWeight: 600 }}>Chargement...</div>
      </div>
    </div>
  );

  const filtered = certificats.filter(c =>
    c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.type_certificat?.toLowerCase().includes(search.toLowerCase()) ||
    c.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const typeLabels: Record<string, { label: string; color: string; bg: string }> = {
    arret:        { label: "Arrêt de travail",      color: "#993C1D", bg: "#FAECE7" },
    reprise:      { label: "Reprise de travail",    color: "#185FA5", bg: "#E6F1FB" },
    consultation: { label: "Consultation",          color: "#534AB7", bg: "#EEEDFE" },
    aptitude:     { label: "Aptitude",              color: "#0F6E56", bg: "#E1F5EE" },
    inaptitude:   { label: "Inaptitude",            color: "#991D1D", bg: "#FAE7E7" },
    grossesse:    { label: "Grossesse",             color: "#8E41A8", bg: "#F5E6FA" },
    deces:        { label: "Décès",                 color: "#333333", bg: "#EAEAEA" },
    custom:       { label: "Attestation libre",     color: "#534AB7", bg: "#EEEDFE" },
  };

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        /* ... LE MEME CSS QUE DANS VOTRE FICHIER ACTUEL ... */
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        .page-root  { min-height: 100vh; background: linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 100%); font-family: 'DM Sans', sans-serif; display: flex; }
        .page-main  { margin-left: 240px; flex: 1; padding: 2rem; padding-top: calc(80px + 2rem); }
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .page-title  { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: #1e1b4b; }
        .page-sub    { font-size: 13px; color: #94a3b8; margin-top: 2px; }
        .btn-new { background: linear-gradient(135deg, #534AB7, #10B981); border: none; border-radius: 14px; color: white; font-size: 14px; font-weight: 700; padding: 12px 22px; cursor: pointer; font-family: 'DM Sans', sans-serif; box-shadow: 0 6px 18px rgba(83,74,183,0.3); transition: all 0.25s; display: flex; align-items: center; gap: 8px; }
        .btn-new:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(83,74,183,0.4); }
        .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.9); border-radius: 20px; padding: 18px 22px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 12px rgba(83,74,183,0.04); }
        .stat-icon { width: 42px; height: 42px; border-radius: 13px; background: linear-gradient(135deg, #534AB7, #10B981); display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 10px rgba(83,74,183,0.25); flex-shrink: 0; }
        .stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #1e1b4b; line-height: 1; }
        .stat-lbl { font-size: 12px; color: #94a3b8; margin-top: 3px; }
        .search-wrap { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.9); border-radius: 16px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(83,74,183,0.04); }
        .search-icon { font-size: 16px; color: #94a3b8; flex-shrink: 0; }
        .search-input { flex: 1; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 14px; color: #334155; outline: none; }
        .search-input::placeholder { color: #94a3b8; }
        .table-card { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.9); border-radius: 24px; overflow: hidden; box-shadow: 0 2px 12px rgba(83,74,183,0.04); }
        .table-head { display: grid; grid-template-columns: 2fr 1.2fr 1.5fr 2fr 1fr; padding: 14px 24px; background: rgba(83,74,183,0.05); border-bottom: 1px solid rgba(83,74,183,0.08); }
        .th { font-size: 11px; font-weight: 700; color: #534AB7; text-transform: uppercase; letter-spacing: .6px; }
        .table-row { display: grid; grid-template-columns: 2fr 1.2fr 1.5fr 2fr 1fr; padding: 15px 24px; border-bottom: 1px solid rgba(0,0,0,0.04); align-items: center; transition: background 0.15s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: rgba(83,74,183,0.025); }
        .td-name { font-size: 14px; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 10px; }
        .avatar { width: 32px; height: 32px; border-radius: 10px; background: linear-gradient(135deg, rgba(83,74,183,0.15), rgba(16,185,129,0.15)); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #534AB7; flex-shrink: 0; }
        .td-date  { font-size: 13px; color: #64748b; }
        .td-objet { font-size: 12px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 12px; }
        .type-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
        .badge-pill { display: inline-flex; align-items: center; gap: 5px; background: rgba(83,74,183,0.08); color: #534AB7; font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 20px; cursor: pointer; transition: background 0.2s; }
        .badge-pill:hover { background: rgba(83,74,183,0.16); }
        .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
        .empty-icon  { font-size: 48px; margin-bottom: 12px; opacity: .4; }
        .empty-text  { font-size: 15px; font-weight: 500; }
        .empty-sub   { font-size: 13px; margin-top: 4px; }
        .skeleton { background: linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.05) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; height: 16px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div className="page-root">
        <Sidebar stats={stats} />
        <Navbar title="Certificats Médicaux" subtitle={`Dr. ${username}`} />

        <main className="page-main">

          <div className="page-header">
            <div>
              <div className="page-title">Certificats Médicaux</div>
              <div className="page-sub">
                {certificats.length} certificat{certificats.length !== 1 ? "s" : ""} enregistré{certificats.length !== 1 ? "s" : ""}
              </div>
            </div>
            <button className="btn-new" onClick={() => router.push("/dashboard/medecin/certificats/nouveau")}>
              <span>＋</span> Nouveau certificat
            </button>
          </div>

          <div className="stats-row">
            {[
              { icon: "📅", val: stats.rendezvous,    lbl: "Rendez-vous" },
              { icon: "🩺", val: stats.consultations, lbl: "Consultations" },
              { icon: "📄", val: stats.ordonnances,   lbl: "Certificats" },
            ].map(s => (
              <div key={s.lbl} className="stat-card">
                <div className="stat-icon">{s.icon}</div>
                <div>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input"
              placeholder="Rechercher par patient, type ou objet..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="table-card">
            <div className="table-head">
              <span className="th">Patient</span>
              <span className="th">Date</span>
              <span className="th">Type</span>
              <span className="th">Objet</span>
              <span className="th">Action</span>
            </div>

            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="table-row">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="skeleton" style={{ width: `${[60,50,70,80,40][j]}%` }} />
                  ))}
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <div className="empty-text">Aucun certificat trouvé</div>
                <div className="empty-sub">
                  {search ? "Essayez un autre terme." : "Créez votre premier certificat médical."}
                </div>
              </div>
            ) : (
              filtered.map(cert => {
                const typeInfo = typeLabels[cert.type_certificat] || { label: cert.type_certificat || "—", color: "#534AB7", bg: "#EEEDFE" };
                return (
                  <div key={cert.id} className="table-row">
                    <div className="td-name">
                      <div className="avatar">{cert.patient_name?.charAt(0)?.toUpperCase() || "?"}</div>
                      {cert.patient_name || "—"}
                    </div>
                    <div className="td-date">
                      {cert.date_emission ? new Date(cert.date_emission).toLocaleDateString("fr-FR") : "—"}
                    </div>
                    <div>
                      <span className="type-badge" style={{ color: typeInfo.color, background: typeInfo.bg }}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <div className="td-objet">{cert.notes || "—"}</div>
                    <div>
                      <span className="badge-pill"
                        onClick={() => router.push(`/dashboard/medecin/certificats/${cert.id}`)}>
                        👁 Voir
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </main>
      </div>
    </PrivateRoute>
  );
}