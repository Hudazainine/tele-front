"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────
const T = {
  bg:            "#F0F4F1",
  surface:       "#FFFFFF",
  border:        "#E2EAE5",
  borderMid:     "#9FE1CB",
  accent:        "#1D9E75",
  accentLight:   "#E1F5EE",
  accentDark:    "#085041",
  textPrimary:   "#0F1F18",
  textMuted:     "#4A5C52",
  textLight:     "#8A9A92",
  warning:       "#BA7517",
  warningLight:  "#FAEEDA",
  warningBorder: "#FAC775",
  font:          "'Plus Jakarta Sans', -apple-system, sans-serif",
  radius:        "8px",
  radiusLg:      "12px",
};

// ─────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────
interface Stats { rendezvous: number; consultations: number; ordonnances: number; }

interface Certificat {
  id: number;
  patient_name: string;
  patient_dob: string | null;
  type: string;
  body: string;
  start_date: string | null;
  duration: number | null;
  status: string;
  medecin: number;
  created_at: string;
  medecin_name?: string;
}

// ─────────────────────────────────────────────────────────────
// TYPE INFO
// ─────────────────────────────────────────────────────────────
const TYPE_INFO: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  arret:       { label: "Arrêt de travail",      icon: "ti-bed",           color: "#633806", bg: "#FAEEDA" },
  reprise:     { label: "Reprise de travail",     icon: "ti-briefcase",     color: "#0C447C", bg: "#E6F1FB" },
  consultation:{ label: "Consultation",           icon: "ti-stethoscope",   color: "#3C3489", bg: "#EEEDFE" },
  aptitude:    { label: "Aptitude",               icon: "ti-circle-check",  color: "#085041", bg: "#E1F5EE" },
  inaptitude:  { label: "Inaptitude",             icon: "ti-circle-x",      color: "#791F1F", bg: "#FCEBEB" },
  grossesse:   { label: "Grossesse",              icon: "ti-heart",         color: "#72243E", bg: "#FBEAF0" },
  deces:       { label: "Décès",                  icon: "ti-leaf",          color: "#444441", bg: "#F1EFE8" },
  custom:      { label: "Attestation médicale",   icon: "ti-file-text",     color: "#3C3489", bg: "#EEEDFE" },
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const normalizeCertificat = (raw: any): Certificat => ({
  id:           raw.id,
  patient_name: raw.patient_name ?? raw.nom_patient ?? "",
  patient_dob:  raw.patient_dob ?? raw.date_naissance ?? null,
  type:         raw.type_certificat || raw.type || "custom",
  body:         raw.notes ?? raw.body ?? raw.contenu ?? "",
  start_date:   raw.date_debut_arret ?? raw.start_date ?? null,
  duration:     raw.nb_jours_arret ?? raw.duration ?? null,
  status:       raw.status || raw.statut || "brouillon",
  medecin:      raw.medecin ?? raw.medecin_id ?? 0,
  created_at:   raw.date_emission ?? raw.created_at ?? "",
  medecin_name: raw.medecin_name ?? raw.nom_medecin ?? undefined,
});

const formatDate = (d: string | null | undefined): string => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch { return "—"; }
};

// ─────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────
export default function PatientCertificats() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({ rendezvous: 0, consultations: 0, ordonnances: 0 });
  const [certificats, setCertificats] = useState<Certificat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Certificat | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);

  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    Promise.all([
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("ordonnances/"),
      api.get("certificats/"),
    ]).then(([r, c, o, cert]) => {
      setStats({ rendezvous: r.data.length, consultations: c.data.length, ordonnances: o.data.length });
      const normalized = cert.data.map(normalizeCertificat);
      const sorted = [...normalized].sort(
        (a: Certificat, b: Certificat) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setCertificats(sorted);
    }).catch((err) => console.error("Erreur API:", err))
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  if (isLoading) return null;

  const getFilename = (ext: string) => {
    if (!selected) return `certificat.${ext}`;
    const type = TYPE_INFO[selected.type]?.label || selected.type;
    const date = selected.created_at
      ? new Date(selected.created_at).toLocaleDateString("fr-FR").replace(/\//g, "-")
      : "date";
    return `certificat_${type}_${date}.${ext}`;
  };

  const handlePrint = () => {
    if (!paperRef.current) return;
    const content = paperRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Certificat médical</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Times New Roman',Georgia,serif;padding:40px;background:white}
        .paper-inner{max-width:600px;margin:0 auto}
        .paper-head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:1.5px solid #0F1F18;margin-bottom:18px}
        .paper-dr{font-size:17px;font-weight:700;color:#0F1F18}
        .paper-sub{font-size:11px;color:#666;margin-top:3px;line-height:1.7;font-family:sans-serif}
        .paper-seal{width:34px;height:34px;border-radius:50%;border:2px solid #1D9E75;display:flex;align-items:center;justify-content:center;font-size:16px;color:#1D9E75}
        .paper-ttl{text-align:center;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#0F1F18;padding:10px 0 14px;border-bottom:.5px solid #E2EAE5;margin-bottom:16px;font-family:sans-serif}
        .paper-badge{display:inline-block;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin-bottom:14px;font-family:sans-serif}
        .paper-body{font-size:13px;color:#0F1F18;line-height:2;white-space:pre-wrap}
        .paper-foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:32px;padding-top:14px;border-top:.5px solid #E2EAE5}
        .paper-date{font-size:11px;color:#999;font-family:sans-serif}
        .sig-area{text-align:center}
        .sig-line{width:80px;border-top:1px solid #999;margin:0 auto 4px}
        .sig-name{font-size:11px;color:#666;font-family:sans-serif;font-weight:600}
        @media print{body{padding:20px}}
      </style></head>
      <body><div class="paper-inner">${content}</div></body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const handleExportPDF = async () => {
    if (!paperRef.current || !selected) return;
    setExporting("pdf");
    try {
      const canvas = await html2canvas(paperRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 20;
      const imgH = imgW * (canvas.height / canvas.width);
      const y = imgH < pageH ? (pageH - imgH) / 2 : 10;
      pdf.addImage(imgData, "PNG", 10, y, imgW, imgH);
      pdf.save(getFilename("pdf"));
    } catch { alert("Erreur lors de la génération du PDF."); }
    finally { setExporting(null); }
  };

  const handleExportImage = async () => {
    if (!paperRef.current || !selected) return;
    setExporting("image");
    try {
      const canvas = await html2canvas(paperRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.download = getFilename("png");
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch { alert("Erreur lors de l'export image."); }
    finally { setExporting(null); }
  };

  const filtered = certificats.filter(
    (c) =>
      (c.patient_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.medecin_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (TYPE_INFO[c.type]?.label ?? c.type ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .pg-root { min-height:100vh; background:${T.bg}; font-family:${T.font}; display:flex; }
        .pg-main { margin-left:260px; flex:1; padding:1.5rem; padding-top:calc(52px + 1.5rem); display:flex; flex-direction:column; gap:12px; }

        /* Header */
        .pg-title { font-size:20px; font-weight:800; color:${T.textPrimary}; }
        .pg-sub   { font-size:12px; color:${T.textLight}; margin-top:2px; }

        /* Stats */
        .stats-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
        .stat-card { background:${T.surface}; border:0.5px solid ${T.border}; border-radius:${T.radiusLg}; padding:12px 14px; display:flex; align-items:center; gap:10px; }
        .stat-icon { width:34px; height:34px; border-radius:8px; background:${T.accentLight}; border:0.5px solid ${T.borderMid}; display:flex; align-items:center; justify-content:center; color:${T.accentDark}; font-size:16px; flex-shrink:0; }
        .stat-val  { font-size:20px; font-weight:800; color:${T.textPrimary}; line-height:1; }
        .stat-lbl  { font-size:10px; color:${T.textLight}; margin-top:3px; font-weight:600; text-transform:uppercase; letter-spacing:.6px; }

        /* Toolbar */
        .toolbar { display:flex; gap:10px; align-items:center; }
        .search-bar {
          background:${T.surface}; border:0.5px solid ${T.border};
          border-radius:${T.radius}; padding:8px 12px;
          display:flex; align-items:center; gap:8px; width:260px;
          transition:border-color .15s;
        }
        .search-bar:focus-within { border-color:${T.borderMid}; }
        .search-bar input { border:none; background:transparent; outline:none; font-family:${T.font}; font-size:13px; color:${T.textPrimary}; width:100%; }
        .search-bar input::placeholder { color:${T.textLight}; }

        /* Grid */
        .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; }

        /* Cert card */
        .cert-card {
          background:${T.surface}; border-radius:${T.radiusLg};
          border:0.5px solid ${T.border};
          padding:18px; cursor:pointer; transition:border-color .2s, transform .2s;
        }
        .cert-card:hover { transform:translateY(-2px); border-color:${T.borderMid}; }
        .card-top  { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; }
        .type-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; }
        .status-row { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:600; }
        .status-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .card-dr   { font-size:14px; font-weight:700; color:${T.textPrimary}; margin-bottom:2px; }
        .card-date { font-size:11px; color:${T.textLight}; }
        .card-body { font-size:12px; color:${T.textMuted}; margin-top:10px; line-height:1.6; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .card-footer { display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:10px; border-top:0.5px solid ${T.border}; }
        .card-days { font-size:11px; font-weight:600; color:${T.accentDark}; background:${T.accentLight}; border:0.5px solid ${T.borderMid}; padding:2px 9px; border-radius:8px; }

        /* Skeleton */
        .skeleton { background:linear-gradient(90deg,${T.bg} 25%,${T.border} 50%,${T.bg} 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }

        /* Empty */
        .empty-state { text-align:center; padding:60px 20px; color:${T.textLight}; }

        /* Modal */
        .modal-overlay { position:fixed; inset:0; background:rgba(15,31,24,.45); backdrop-filter:blur(4px); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
        .modal-box     { background:${T.surface}; border-radius:16px; width:100%; max-width:620px; max-height:90vh; overflow-y:auto; border:0.5px solid ${T.border}; }
        .modal-header  { padding:18px 22px 14px; border-bottom:0.5px solid ${T.border}; display:flex; justify-content:space-between; align-items:flex-start; position:sticky; top:0; background:${T.surface}; z-index:2; border-radius:16px 16px 0 0; }
        .modal-close   { width:30px; height:30px; border-radius:50%; border:0.5px solid ${T.border}; background:${T.surface}; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; transition:.15s; color:${T.textMuted}; }
        .modal-close:hover { background:${T.bg}; }

        /* Actions */
        .actions-row { display:flex; gap:8px; padding:12px 22px; border-bottom:0.5px solid ${T.border}; flex-wrap:wrap; }
        .action-btn {
          display:flex; align-items:center; gap:6px;
          padding:8px 14px; border-radius:${T.radius};
          font-family:${T.font}; font-size:12px; font-weight:700;
          cursor:pointer; border:none; transition:all .15s;
        }
        .action-btn:disabled { opacity:.5; cursor:not-allowed; }
        .btn-print { background:${T.bg}; color:${T.textMuted}; border:0.5px solid ${T.border} !important; }
        .btn-print:hover:not(:disabled) { background:${T.border}; }
        .btn-pdf   { background:${T.accent}; color:#fff; }
        .btn-pdf:hover:not(:disabled) { background:${T.accentDark}; }
        .btn-image { background:#0EA5E9; color:#fff; }
        .btn-image:hover:not(:disabled) { background:#0284C7; }
        .spinner { width:12px; height:12px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* Paper */
        .modal-body    { padding:20px 22px 24px; }
        .paper-preview { border:0.5px solid ${T.border}; border-radius:12px; padding:28px 24px; font-family:'Times New Roman',Georgia,serif; background:#fff; border-top:3px solid ${T.accent}; }
        .paper-head    { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:12px; border-bottom:1.5px solid ${T.textPrimary}; margin-bottom:16px; }
        .paper-dr      { font-size:15px; font-weight:700; color:${T.textPrimary}; }
        .paper-sub     { font-size:11px; color:#666; margin-top:3px; line-height:1.7; font-family:sans-serif; }
        .paper-seal    { width:34px; height:34px; border-radius:50%; border:2px solid ${T.accent}; display:flex; align-items:center; justify-content:center; font-size:16px; color:${T.accent}; }
        .paper-ttl     { text-align:center; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:${T.textPrimary}; padding:10px 0 14px; border-bottom:.5px solid ${T.border}; margin-bottom:16px; font-family:sans-serif; }
        .paper-badge   { display:inline-block; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; margin-bottom:14px; font-family:sans-serif; }
        .paper-body    { font-size:13px; color:${T.textPrimary}; line-height:2; white-space:pre-wrap; min-height:80px; }
        .paper-foot    { display:flex; justify-content:space-between; align-items:flex-end; margin-top:28px; padding-top:12px; border-top:.5px solid ${T.border}; }
        .paper-date    { font-size:11px; color:#999; font-family:sans-serif; }
        .sig-area      { text-align:center; }
        .sig-line      { width:80px; border-top:1px solid #999; margin:0 auto 4px; }
        .sig-name      { font-size:11px; color:#666; font-family:sans-serif; font-weight:600; }
      `}</style>

      <div className="pg-root">
        <Sidebar stats={stats} />
        <Navbar title="Mes Certificats Médicaux" subtitle="Espace patient" />

        <main className="pg-main">

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", animation: "fadeUp .3s ease" }}>
            <div>
              <div className="pg-title">Mes certificats médicaux</div>
              <div className="pg-sub">
                {certificats.length} certificat{certificats.length !== 1 ? "s" : ""} disponible{certificats.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="toolbar">
              <div className="search-bar">
                <i className="ti ti-search" style={{ fontSize: 15, color: T.textLight }} aria-hidden="true" />
                <input
                  placeholder="Rechercher par type, médecin..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <i className="ti ti-x" style={{ fontSize: 13, color: T.textLight, cursor: "pointer" }} onClick={() => setSearch("")} aria-hidden="true" />
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row" style={{ animation: "fadeUp .3s .07s ease backwards" }}>
            {[
              { icon: "ti-file-certificate", val: certificats.length,                                    lbl: "Total certificats" },
              { icon: "ti-circle-check",     val: certificats.filter(c => c.status === "signe").length,  lbl: "Signés" },
              { icon: "ti-pencil",           val: certificats.filter(c => c.status === "brouillon").length, lbl: "Brouillons" },
            ].map((s) => (
              <div key={s.lbl} className="stat-card">
                <div className="stat-icon">
                  <i className={`ti ${s.icon}`} aria-hidden="true" />
                </div>
                <div>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid" style={{ animation: "fadeUp .3s .14s ease backwards" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: T.surface, borderRadius: T.radiusLg, padding: 18, border: `0.5px solid ${T.border}` }}>
                  <div className="skeleton" style={{ height: 22, width: "60%", marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 16, width: "40%", marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 13, width: "80%" }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <i className="ti ti-file-off" style={{ fontSize: 40, color: T.border }} aria-hidden="true" />
              <p style={{ fontSize: 15, fontWeight: 700, color: T.textMuted, margin: "12px 0 6px" }}>Aucun certificat trouvé</p>
              <p style={{ fontSize: 12 }}>
                {search ? "Essayez un autre terme de recherche." : "Vos certificats médicaux apparaîtront ici."}
              </p>
            </div>
          ) : (
            <div className="grid" style={{ animation: "fadeUp .3s .14s ease backwards" }}>
              {filtered.map((cert) => {
                const info = TYPE_INFO[cert.type] ?? { label: cert.type, icon: "ti-file-text", color: T.accentDark, bg: T.accentLight };
                const isSigne = cert.status === "signe";
                return (
                  <div key={cert.id} className="cert-card" onClick={() => setSelected(cert)}>
                    <div className="card-top">
                      <span className="type-badge" style={{ color: info.color, background: info.bg }}>
                        <i className={`ti ${info.icon}`} style={{ fontSize: 13 }} aria-hidden="true" />
                        {info.label}
                      </span>
                      <div className="status-row" style={{ color: isSigne ? T.accentDark : T.warning }}>
                        <span className="status-dot" style={{ background: isSigne ? T.accent : "#FAC775" }} />
                        {isSigne ? "Signé" : "Brouillon"}
                      </div>
                    </div>
                    <div className="card-dr">{cert.medecin_name ? `Dr. ${cert.medecin_name}` : "TéléConsult"}</div>
                    <div className="card-date">{formatDate(cert.created_at)}</div>
                    {cert.body && <div className="card-body">{cert.body}</div>}
                    <div className="card-footer">
                      {cert.duration ? (
                        <span className="card-days">
                          <i className="ti ti-clock" style={{ fontSize: 10, marginRight: 3 }} aria-hidden="true" />
                          {cert.duration} jour{cert.duration > 1 ? "s" : ""}
                        </span>
                      ) : cert.start_date ? (
                        <span className="card-days">
                          <i className="ti ti-calendar-event" style={{ fontSize: 10, marginRight: 3 }} aria-hidden="true" />
                          {formatDate(cert.start_date)}
                        </span>
                      ) : <span />}
                      <span style={{ fontSize: 12, color: T.accent, fontWeight: 700 }}>Voir le détail →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── Modal ── */}
      {selected && (() => {
        const info = TYPE_INFO[selected.type] ?? { label: selected.type, icon: "ti-file-text", color: T.accentDark, bg: T.accentLight };
        const isSigne = selected.status === "signe";
        return (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="modal-header">
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: T.textPrimary, margin: "0 0 4px" }}>
                    Certificat médical
                  </p>
                  <div style={{ fontSize: 12, color: T.textLight, display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="status-dot" style={{ display: "inline-block", background: isSigne ? T.accent : "#FAC775", width: 7, height: 7, borderRadius: "50%" }} />
                    {isSigne ? "Signé" : "Brouillon"} · Émis le {formatDate(selected.created_at)}
                  </div>
                </div>
                <button className="modal-close" onClick={() => setSelected(null)}>
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              </div>

              {/* Actions */}
              <div className="actions-row">
                <button className="action-btn btn-print" onClick={handlePrint}>
                  <i className="ti ti-printer" aria-hidden="true" /> Imprimer
                </button>
                <button className="action-btn btn-pdf" onClick={handleExportPDF} disabled={exporting !== null}>
                  {exporting === "pdf" ? <><div className="spinner" /> Génération…</> : <><i className="ti ti-file-type-pdf" aria-hidden="true" /> PDF</>}
                </button>
                <button className="action-btn btn-image" onClick={handleExportImage} disabled={exporting !== null}>
                  {exporting === "image" ? <><div className="spinner" /> Export…</> : <><i className="ti ti-photo" aria-hidden="true" /> Image</>}
                </button>
              </div>

              {/* Paper */}
              <div className="modal-body">
                <div className="paper-preview" ref={paperRef}>
                  <div className="paper-head">
                    <div>
                      <div className="paper-dr">{selected.medecin_name ? `Dr. ${selected.medecin_name}` : "TéléConsult"}</div>
                      <div className="paper-sub">Médecin · TéléConsult<br />Tunis, Tunisie</div>
                    </div>
                    <div className="paper-seal">⚕</div>
                  </div>
                  <div className="paper-ttl">{info.label}</div>
                  <div>
                    <span className="paper-badge" style={{ background: info.bg, color: info.color }}>
                      {info.label}
                    </span>
                  </div>
                  {(selected.start_date || selected.duration) && (
                    <div style={{ marginBottom: 14, padding: "8px 12px", background: T.bg, borderRadius: T.radius, fontSize: 12, color: T.textPrimary, fontFamily: "sans-serif", display: "flex", gap: 16, border: `0.5px solid ${T.border}` }}>
                      {selected.start_date && (
                        <span>À compter du : <strong>{formatDate(selected.start_date)}</strong></span>
                      )}
                      {selected.duration && (
                        <span>Durée : <strong>{selected.duration} jour{selected.duration > 1 ? "s" : ""}</strong></span>
                      )}
                    </div>
                  )}
                  <div className="paper-body">
                    {selected.body || <span style={{ color: T.textLight, fontStyle: "italic" }}>Aucun contenu renseigné pour ce certificat.</span>}
                  </div>
                  <div className="paper-foot">
                    <div className="paper-date">Le {formatDate(selected.created_at)}</div>
                    <div className="sig-area">
                      <div className="sig-line" />
                      <div className="sig-name">{selected.medecin_name ? `Dr. ${selected.medecin_name}` : "Médecin"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </PrivateRoute>
  );
}