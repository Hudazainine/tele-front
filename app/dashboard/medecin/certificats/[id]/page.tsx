"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../../context/AuthContext";
import PrivateRoute from "../../../../../components/PrivateRoute";
import api from "../../../../../lib/api";
import Sidebar from "../../../../../components/Sidebar";
import Navbar from "../../../../../components/Navbar";

interface Stats { rendezvous: number; consultations: number; ordonnances: number; }
interface Certificat {
  id: number;
  patient: number;
  patient_name: string;
  medecin_name: string;
  type_certificat: string;
  status: string;
  date_emission: string;
  nb_jours_arret: number | null;
  date_debut_arret: string | null;
  date_fin_arret: string | null;
  notes: string;
}

const TYPE_INFO: Record<string, { label: string; color: string; bg: string }> = {
  arret_travail:   { label: "Arrêt de travail",   color: "#993C1D", bg: "#FAECE7" },
  reprise:         { label: "Reprise de travail", color: "#185FA5", bg: "#E6F1FB" },
  consultation:    { label: "Consultation",        color: "#534AB7", bg: "#EEEDFE" },
  aptitude:        { label: "Aptitude",            color: "#0F6E56", bg: "#E1F5EE" },
  inaptitude:      { label: "Inaptitude",          color: "#991D1D", bg: "#FAE7E7" },
  grossesse:       { label: "Grossesse",           color: "#8E41A8", bg: "#F5E6FA" },
  deces:           { label: "Décès",               color: "#333333", bg: "#EAEAEA" },
  maladie:         { label: "Maladie",             color: "#993C1D", bg: "#FAECE7" },
  visite_medicale: { label: "Visite médicale",     color: "#185FA5", bg: "#E6F1FB" },
  custom:          { label: "Attestation libre",   color: "#534AB7", bg: "#EEEDFE" },
};

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  brouillon: { label: "Brouillon", color: "#854F0B", bg: "#FAEEDA" },
  signe:     { label: "Signé",     color: "#0F6E56", bg: "#E1F5EE" },
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + (d.includes("T") ? "" : "T00:00:00"))
    .toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function CertificatDetail() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [stats, setStats]         = useState<Stats>({ rendezvous: 0, consultations: 0, ordonnances: 0 });
  const [cert, setCert]           = useState<Certificat | null>(null);
  const [loading, setLoading]     = useState(true);
  const [signing, setSigning]     = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    Promise.all([
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("certificats/"),
      api.get(`certificats/${id}/`),
    ]).then(([r, c, cert_list, detail]) => {
      setStats({ rendezvous: r.data.length, consultations: c.data.length, ordonnances: cert_list.data.length });
      setCert(detail.data);
    }).catch(() => setErrorMsg("Certificat introuvable."))
      .finally(() => setLoading(false));
  }, [token, isLoading, id]);

  if (isLoading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F4F2F9", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>📄</div>
        <div style={{ fontSize:14, color:"#534AB7", fontWeight:600 }}>Chargement...</div>
      </div>
    </div>
  );

  const handleSign = async () => {
    if (!cert) return;
    setSigning(true);
    try {
      const res = await api.patch(`certificats/${id}/`, { status: "signe" });
      setCert(res.data);
    } catch {
      setErrorMsg("Impossible de signer le certificat.");
    } finally { setSigning(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`certificats/${id}/`);
      router.push("/dashboard/medecin/certificats");
    } catch {
      setErrorMsg("Impossible de supprimer le certificat.");
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const ti = cert ? (TYPE_INFO[cert.type_certificat]   || { label: cert.type_certificat, color: "#534AB7", bg: "#EEEDFE" }) : null;
  const si = cert ? (STATUS_INFO[cert.status]          || { label: cert.status,           color: "#534AB7", bg: "#EEEDFE" }) : null;

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .root { min-height:100vh; background:#F4F2F9; font-family:'DM Sans',sans-serif; display:flex; }
        .main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }

        /* Topbar */
        .topbar     { display:flex; align-items:center; gap:12px; margin-bottom:28px; }
        .btn-back   { width:36px; height:36px; background:#fff; border:0.5px solid #EAE8F5; border-radius:11px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; color:#8A87A0; transition:all .2s; flex-shrink:0; }
        .btn-back:hover { background:#F0EEF9; color:#1C1040; }
        .topbar-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#1C1040; }
        .topbar-sub   { font-size:12px; color:#8A87A0; margin-top:3px; }

        /* Layout */
        .layout { display:grid; grid-template-columns:1fr 360px; gap:24px; align-items:start; animation:fadeUp .4s ease; }

        /* Left: paper */
        .paper-card { background:#fff; border-radius:18px; border:0.5px solid #EAE8F5; overflow:hidden; }
        .paper-actions { display:flex; gap:10px; padding:16px 24px; background:#FAFAFE; border-bottom:0.5px solid #EAE8F5; }
        .btn-sign   { background:#534AB7; border:none; border-radius:10px; color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:9px 18px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:6px; }
        .btn-sign:hover   { background:#3C3489; }
        .btn-sign:disabled { opacity:.45; cursor:not-allowed; }
        .btn-print  { background:#fff; border:0.5px solid #EAE8F5; border-radius:10px; color:#8A87A0; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:9px 16px; cursor:pointer; transition:all .2s; display:flex; align-items:center; gap:6px; }
        .btn-print:hover  { border-color:#C4C0D8; color:#1C1040; }
        .btn-delete { background:rgba(239,68,68,.07); border:0.5px solid rgba(239,68,68,.2); border-radius:10px; color:#DC2626; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; padding:9px 16px; cursor:pointer; transition:all .2s; margin-left:auto; display:flex; align-items:center; gap:6px; }
        .btn-delete:hover { background:rgba(239,68,68,.14); }

        /* Paper document */
        .doc { padding:32px 36px; }
        .doc-head { padding-bottom:16px; border-bottom:1.5px solid #1C1040; margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-start; }
        .doc-dr   { font-family:'Syne',sans-serif; font-size:17px; font-weight:800; color:#1C1040; }
        .doc-sub  { font-size:11px; color:#666; margin-top:3px; line-height:1.6; }
        .doc-seal { width:36px; height:36px; border-radius:50%; border:2px solid #534AB7; display:flex; align-items:center; justify-content:center; font-size:17px; color:#534AB7; }
        .doc-ttl  { text-align:center; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#1C1040; padding:12px 0 16px; border-bottom:0.5px solid #EAE8F5; margin-bottom:18px; }
        .doc-badge-row { display:flex; gap:8px; align-items:center; margin-bottom:14px; }
        .doc-type-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; }
        .doc-status-badge { font-size:10px; font-weight:700; padding:3px 9px; border-radius:20px; }
        .doc-patient { background:#F0EEF9; border-radius:10px; padding:14px 18px; margin-bottom:20px; display:flex; align-items:center; gap:14px; }
        .doc-avatar  { width:40px; height:40px; border-radius:50%; background:#534AB7; color:#fff; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; flex-shrink:0; }
        .doc-pt-name { font-size:15px; font-weight:600; color:#3C3489; }
        .doc-pt-sub  { font-size:12px; color:#534AB7; opacity:.7; margin-top:2px; }
        .doc-body { font-size:13px; color:#1C1040; line-height:2; white-space:pre-wrap; min-height:120px; margin-bottom:20px; }
        .doc-foot { display:flex; justify-content:space-between; align-items:flex-end; padding-top:16px; border-top:0.5px solid #EAE8F5; }
        .doc-date { font-size:11px; color:#999; }
        .sig-line { width:80px; border-top:1px solid #999; margin:0 auto 4px; }
        .sig-name { font-size:11px; color:#666; font-weight:600; text-align:center; }

        /* Right: meta card */
        .meta-card { background:#fff; border-radius:18px; border:0.5px solid #EAE8F5; overflow:hidden; position:sticky; top:calc(70px + 2.5rem); }
        .meta-head { padding:16px 20px; border-bottom:0.5px solid #EAE8F5; }
        .meta-title { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:#1C1040; }
        .meta-body { padding:16px 20px; display:flex; flex-direction:column; gap:14px; }
        .meta-row { display:flex; flex-direction:column; gap:4px; }
        .meta-lbl { font-size:10px; font-weight:700; color:#8A87A0; text-transform:uppercase; letter-spacing:.6px; }
        .meta-val { font-size:13px; font-weight:500; color:#1C1040; }
        .meta-divider { border:none; border-top:0.5px solid #EAE8F5; }

        /* Error / confirm */
        .err-banner { background:#FEF2F2; border:0.5px solid #FCA5A5; border-radius:10px; padding:10px 14px; color:#DC2626; font-size:12px; font-weight:600; margin-bottom:14px; }
        .confirm-overlay { position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:500; }
        .confirm-box { background:#fff; border-radius:16px; padding:28px 32px; max-width:380px; width:90%; box-shadow:0 12px 40px rgba(0,0,0,.15); }
        .confirm-title { font-family:'Syne',sans-serif; font-size:17px; font-weight:700; color:#1C1040; margin-bottom:10px; }
        .confirm-text  { font-size:13px; color:#8A87A0; line-height:1.6; margin-bottom:24px; }
        .confirm-btns  { display:flex; gap:10px; }
        .confirm-cancel { flex:1; padding:10px; background:#fff; border:0.5px solid #EAE8F5; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#8A87A0; cursor:pointer; }
        .confirm-cancel:hover { border-color:#C4C0D8; color:#1C1040; }
        .confirm-delete { flex:1; padding:10px; background:#DC2626; border:none; border-radius:10px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#fff; cursor:pointer; transition:background .2s; }
        .confirm-delete:hover { background:#B91C1C; }
        .confirm-delete:disabled { opacity:.5; cursor:not-allowed; }

        /* Skeleton */
        .skel { background:linear-gradient(90deg,#F4F2F9 25%,#EAE8F5 50%,#F4F2F9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        @media print {
          .root { display:block; }
          .topbar, .paper-actions, .meta-card, aside, header { display:none !important; }
          .main { margin:0; padding:0; }
          .layout { display:block; }
          .paper-card { border:none; border-radius:0; box-shadow:none; }
        }
      `}</style>

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Certificat médical" subtitle={`Dr. ${username}`} />

        <main className="main">

          {/* Topbar */}
          <div className="topbar">
            <button className="btn-back" onClick={() => router.push("/dashboard/medecin/certificats")}>←</button>
            <div>
              <div className="topbar-title">Certificat médical</div>
              <div className="topbar-sub">
                {cert ? `${cert.patient_name} · ${fmtDate(cert.date_emission)}` : "Chargement…"}
              </div>
            </div>
          </div>

          {errorMsg && <div className="err-banner">⚠️ {errorMsg}</div>}

          {loading ? (
            <div className="layout">
              <div className="paper-card">
                <div className="doc" style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {[100, 60, 80, 200, 150, 60].map((h, i) => (
                    <div key={i} className="skel" style={{ height: h, width:"100%", borderRadius:8 }} />
                  ))}
                </div>
              </div>
              <div className="meta-card">
                <div className="meta-body">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="meta-row">
                      <div className="skel" style={{ height:10, width:"40%", marginBottom:4 }} />
                      <div className="skel" style={{ height:14, width:"70%" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : cert ? (
            <div className="layout">

              {/* ── Papier ── */}
              <div className="paper-card">
                {/* Barre d'actions */}
                <div className="paper-actions">
                  {cert.status === "brouillon" && (
                    <button className="btn-sign" onClick={handleSign} disabled={signing}>
                      {signing ? "Signature…" : "✒️ Signer le certificat"}
                    </button>
                  )}
                  <button className="btn-print" onClick={() => window.print()}>
                    🖨️ Imprimer
                  </button>
                  <button className="btn-delete" onClick={() => setShowConfirm(true)}>
                    🗑️ Supprimer
                  </button>
                </div>

                {/* Document */}
                <div className="doc">
                  <div className="doc-head">
                    <div>
                      <div className="doc-dr">Dr. {cert.medecin_name || username}</div>
                      <div className="doc-sub">Médecin Généraliste<br />Tél : +216 71 000 000 · Tunis</div>
                    </div>
                    <div className="doc-seal">⚕</div>
                  </div>

                  <div className="doc-ttl">
                    {ti?.label || cert.type_certificat || "Certificat médical"}
                  </div>

                  {(ti || si) && (
                    <div className="doc-badge-row">
                      {ti && (
                        <span className="doc-type-badge" style={{ color: ti.color, background: ti.bg }}>
                          {ti.label}
                        </span>
                      )}
                      {si && (
                        <span className="doc-status-badge" style={{ color: si.color, background: si.bg }}>
                          {si.label}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="doc-patient">
                    <div className="doc-avatar">
                      {cert.patient_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="doc-pt-name">{cert.patient_name || "—"}</div>
                      <div className="doc-pt-sub">
                        Émis le {fmtDate(cert.date_emission)}
                      </div>
                    </div>
                  </div>

                  <div className="doc-body">{cert.notes || "—"}</div>

                  <div className="doc-foot">
                    <div className="doc-date">Tunis, le {fmtDate(cert.date_emission)}</div>
                    <div>
                      <div className="sig-line" />
                      <div className="sig-name">Dr. {cert.medecin_name || username}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Méta ── */}
              <div className="meta-card">
                <div className="meta-head">
                  <div className="meta-title">Informations</div>
                </div>
                <div className="meta-body">

                  <div className="meta-row">
                    <span className="meta-lbl">Patient</span>
                    <span className="meta-val">{cert.patient_name || "—"}</span>
                  </div>

                  <div className="meta-row">
                    <span className="meta-lbl">Médecin</span>
                    <span className="meta-val">Dr. {cert.medecin_name || username}</span>
                  </div>

                  <hr className="meta-divider" />

                  <div className="meta-row">
                    <span className="meta-lbl">Type</span>
                    {ti ? (
                      <span style={{ display:"inline-block", fontSize:12, fontWeight:700, padding:"3px 9px", borderRadius:20, color:ti.color, background:ti.bg }}>
                        {ti.label}
                      </span>
                    ) : <span className="meta-val">{cert.type_certificat}</span>}
                  </div>

                  <div className="meta-row">
                    <span className="meta-lbl">Statut</span>
                    {si ? (
                      <span style={{ display:"inline-block", fontSize:12, fontWeight:700, padding:"3px 9px", borderRadius:20, color:si.color, background:si.bg }}>
                        {si.label}
                      </span>
                    ) : <span className="meta-val">{cert.status}</span>}
                  </div>

                  <div className="meta-row">
                    <span className="meta-lbl">Date d'émission</span>
                    <span className="meta-val">{fmtDate(cert.date_emission)}</span>
                  </div>

                  {(cert.date_debut_arret || cert.nb_jours_arret) && (
                    <>
                      <hr className="meta-divider" />
                      {cert.date_debut_arret && (
                        <div className="meta-row">
                          <span className="meta-lbl">Début d'arrêt</span>
                          <span className="meta-val">{fmtDate(cert.date_debut_arret)}</span>
                        </div>
                      )}
                      {cert.nb_jours_arret && (
                        <div className="meta-row">
                          <span className="meta-lbl">Durée</span>
                          <span className="meta-val">{cert.nb_jours_arret} jour{cert.nb_jours_arret > 1 ? "s" : ""}</span>
                        </div>
                      )}
                      {cert.date_fin_arret && (
                        <div className="meta-row">
                          <span className="meta-lbl">Fin d'arrêt</span>
                          <span className="meta-val">{fmtDate(cert.date_fin_arret)}</span>
                        </div>
                      )}
                    </>
                  )}

                  <hr className="meta-divider" />

                  {/* Actions rapides */}
                  {cert.status === "brouillon" && (
                    <button
                      onClick={handleSign}
                      disabled={signing}
                      style={{ width:"100%", background:"#534AB7", border:"none", borderRadius:10, color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, padding:"10px", cursor:"pointer", opacity: signing ? .5 : 1 }}>
                      {signing ? "Signature en cours…" : "✒️ Signer maintenant"}
                    </button>
                  )}

                  <button
                    onClick={() => router.push(`/dashboard/medecin/certificats/nouveau`)}
                    style={{ width:"100%", background:"#fff", border:"0.5px solid #EAE8F5", borderRadius:10, color:"#534AB7", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, padding:"10px", cursor:"pointer" }}>
                    ＋ Nouveau certificat
                  </button>

                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign:"center", padding:"80px 20px", color:"#8A87A0" }}>
              <div style={{ fontSize:48, marginBottom:12, opacity:.4 }}>📄</div>
              <div style={{ fontSize:15, fontWeight:600 }}>Certificat introuvable</div>
              <div style={{ fontSize:13, marginTop:6 }}>Ce certificat n'existe pas ou a été supprimé.</div>
              <button
                onClick={() => router.push("/dashboard/medecin/certificats")}
                style={{ marginTop:20, background:"#534AB7", border:"none", borderRadius:10, color:"#fff", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, padding:"10px 22px", cursor:"pointer" }}>
                ← Retour à la liste
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Confirm delete */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-title">Supprimer ce certificat ?</div>
            <div className="confirm-text">
              Cette action est irréversible. Le certificat de <strong>{cert?.patient_name}</strong> sera définitivement supprimé.
            </div>
            <div className="confirm-btns">
              <button className="confirm-cancel" onClick={() => setShowConfirm(false)}>Annuler</button>
              <button className="confirm-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PrivateRoute>
  );
}