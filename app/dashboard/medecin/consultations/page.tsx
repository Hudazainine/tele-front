// D:\teleconsultation\frontend\app\dashboard\medecin\consultations\page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";

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
  const [loading, setLoading] = useState(true);

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

  const filtered = consultations.filter(
    (c) =>
      c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.notes?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .root  { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
        .main  { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); animation:fadeUp .4s ease; }

        .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
        .page-title  { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; color:#1C1040; }
        .page-sub    { font-size:13px; color:#8A87A0; margin-top:4px; }

        .btn-new { background:#1C1040; border:none; border-radius:14px; color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:12px 22px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:8px; }
        .btn-new:hover { background:#2D1A6B; transform:translateY(-1px); }

        .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
        .stat-card { background:#fff; border-radius:18px; border:1px solid #EAE8F5; padding:18px 22px; display:flex; align-items:center; gap:14px; }
        .stat-icon { width:42px; height:42px; border-radius:13px; background:#F0EEF9; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .stat-val  { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#1C1040; line-height:1; }
        .stat-lbl  { font-size:12px; color:#8A87A0; margin-top:3px; }

        .search-wrap { background:#fff; border:1px solid #EAE8F5; border-radius:14px; padding:11px 16px; display:flex; align-items:center; gap:10px; margin-bottom:20px; }
        .search-input { flex:1; border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:14px; color:#1C1040; outline:none; }
        .search-input::placeholder { color:#C4C0D8; }

        .table-card { background:#fff; border-radius:20px; border:1px solid #EAE8F5; overflow:hidden; }
        .table-head { display:grid; grid-template-columns:2fr 1.2fr 2fr 1fr 1fr; padding:13px 24px; background:#FAFAFE; border-bottom:1px solid #EAE8F5; }
        .th { font-size:11px; font-weight:700; color:#8B5CF6; text-transform:uppercase; letter-spacing:.6px; }
        .table-row { display:grid; grid-template-columns:2fr 1.2fr 2fr 1fr 1fr; padding:16px 24px; border-bottom:1px solid #F4F2F9; align-items:center; transition:background .15s; }
        .table-row:last-child { border-bottom:none; }
        .table-row:hover { background:#FAFAFE; }

        .td-name { display:flex; align-items:center; gap:10px; font-size:14px; font-weight:600; color:#1C1040; }
        .avatar  { width:32px; height:32px; border-radius:10px; background:#F0EEF9; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:#534AB7; flex-shrink:0; }
        .td-date { font-size:13px; color:#64748b; }
        .td-notes { font-size:12px; color:#8A87A0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding-right:12px; }
        .td-dr   { font-size:13px; color:#534AB7; font-weight:500; }

        .action-btn { display:inline-flex; align-items:center; gap:5px; background:#F0EEF9; color:#534AB7; font-size:11px; font-weight:700; padding:5px 10px; border-radius:20px; cursor:pointer; transition:background .2s; border:none; font-family:'DM Sans',sans-serif; }
        .action-btn:hover { background:#EEEDFE; }

        .empty { text-align:center; padding:60px 20px; color:#8A87A0; }
        .empty-icon { font-size:48px; margin-bottom:12px; opacity:.4; }

        .skel { background:linear-gradient(90deg,#F4F2F9 25%,#EAE8F5 50%,#F4F2F9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px; height:16px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Consultations" subtitle={`Dr. ${username}`} />

        <main className="main">
          <div className="page-header">
            <div>
              <div className="page-title">Consultations</div>
              <div className="page-sub">
                {consultations.length} consultation
                {consultations.length !== 1 ? "s" : ""} enregistrée
                {consultations.length !== 1 ? "s" : ""}
              </div>
            </div>
            <button
              className="btn-new"
              onClick={() =>
                router.push("/dashboard/medecin/consultations/nouvelle")
              }
            >
              ＋ Nouvelle consultation
            </button>
          </div>

          <div className="stats-row">
            {[
              { icon: "📅", val: stats.rendezvous, lbl: "Rendez-vous" },
              { icon: "🩺", val: stats.consultations, lbl: "Consultations" },
              { icon: "📋", val: stats.ordonnances, lbl: "Ordonnances" },
            ].map((s) => (
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
            <span style={{ fontSize: 16, color: "#C4C0D8" }}>🔍</span>
            <input
              className="search-input"
              placeholder="Rechercher par patient ou diagnostic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                <div className="empty-icon">🩺</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  Aucune consultation trouvée
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {search
                    ? "Essayez un autre terme."
                    : "Créez votre première consultation."}
                </div>
              </div>
            ) : (
              filtered.map((c) => (
                <div key={c.id} className="table-row">
                  <div className="td-name">
                    <div className="avatar">
                      {c.patient_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    {c.patient_name || "—"}
                  </div>
                  <div className="td-date">
                    {c.date_heure
                      ? new Date(c.date_heure).toLocaleDateString("fr-FR")
                      : "—"}
                  </div>
                  <div className="td-notes">{c.notes || "—"}</div>
                  <div className="td-dr">Dr. {c.medecin_name || username}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="action-btn"
                      onClick={() =>
                        router.push(`/dashboard/medecin/consultations/${c.id}`)
                      }
                    >
                      👁 Voir
                    </button>
                    <button
                      className="action-btn"
                      onClick={() =>
                        router.push(
                          `/dashboard/medecin/consultations/${c.id}/modifier`,
                        )
                      }
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
