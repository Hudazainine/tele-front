"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";

// ── Imports statiques (Next.js 15 ne supporte pas bien l'import() dynamique
//    pour ces librairies — on les importe en haut de fichier)
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Stats {
  rendezvous: number;
  consultations: number;
  ordonnances: number;
}

// Champs attendus par le frontend (normalisés)
interface Certificat {
  id: number;
  patient_name: string;
  patient_dob: string | null;
  type: string; // arret | reprise | consultation | aptitude | inaptitude | grossesse | deces | custom
  body: string;
  start_date: string | null;
  duration: number | null;
  status: string; // brouillon | signe
  medecin: number;
  created_at: string;
  medecin_name?: string;
}

const TYPE_INFO: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  arret: {
    label: "Arrêt de travail",
    color: "#B45309",
    bg: "#FEF3C7",
    icon: "🛌",
  },
  reprise: {
    label: "Reprise de travail",
    color: "#1D4ED8",
    bg: "#DBEAFE",
    icon: "💼",
  },
  consultation: {
    label: "Consultation",
    color: "#6D28D9",
    bg: "#EDE9FE",
    icon: "🩺",
  },
  aptitude: { label: "Aptitude", color: "#065F46", bg: "#D1FAE5", icon: "✅" },
  inaptitude: {
    label: "Inaptitude",
    color: "#991B1B",
    bg: "#FEE2E2",
    icon: "⛔",
  },
  grossesse: {
    label: "Grossesse",
    color: "#9D174D",
    bg: "#FCE7F3",
    icon: "🤰",
  },
  deces: { label: "Décès", color: "#374151", bg: "#F3F4F6", icon: "🕊️" },
  custom: {
    label: "Attestation médicale",
    color: "#5B21B6",
    bg: "#EDE9FE",
    icon: "📋",
  },
};

// ── Fonctions utilitaires ──────────────────────────────────────

/** Mappe les noms de champs Django vers les noms attendus par le frontend */
const normalizeCertificat = (raw: any): Certificat => ({
  id: raw.id,
  patient_name: raw.patient_name ?? raw.nom_patient ?? "",
  patient_dob: raw.patient_dob ?? raw.date_naissance ?? null,
  type: raw.type_certificat || raw.type || "custom", // ✅ type_certificat en premier
  body: raw.notes ?? raw.body ?? raw.contenu ?? "", // ✅ notes en premier
  start_date: raw.date_debut_arret ?? raw.start_date ?? null, // ✅ nom Django exact
  duration: raw.nb_jours_arret ?? raw.duration ?? null, // ✅ nom Django exact
  status: raw.status || raw.statut || "brouillon",
  medecin: raw.medecin ?? raw.medecin_id ?? 0,
  created_at: raw.date_emission ?? raw.created_at ?? "", // ✅ date_emission = champ Django
  medecin_name: raw.medecin_name ?? raw.nom_medecin ?? undefined,
});

/** Formatage de date robuste */
const formatDate = (d: string | null | undefined): string => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  } catch {
    return "—";
  }
};

export default function PatientCertificats() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });
  const [certificats, setCertificats] = useState<Certificat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Certificat | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);

  const paperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    Promise.all([
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("ordonnances/"),
      api.get("certificats/"),
    ])
      .then(([r, c, o, cert]) => {
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
        });

        // Debug : vérifier les données brutes de l'API
        console.log("🔍 RAW certificat[0]:", cert.data[0]);

        // Normalisation des champs pour faire le pont entre Django et le Frontend
        const normalized = cert.data.map(normalizeCertificat);

        // Debug : vérifier les données après normalisation
        console.log("✅ NORMALIZED certificat[0]:", normalized[0]);

        // Tri par date décroissante
        const sorted = [...normalized].sort(
          (a: Certificat, b: Certificat) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setCertificats(sorted);
      })
      .catch((err) => console.error("Erreur API:", err))
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  if (isLoading) return null;

  // ── Helpers ─────────────────────────────────────────────────
  const getFilename = (ext: string) => {
    if (!selected) return `certificat.${ext}`;
    const type = TYPE_INFO[selected.type]?.label || selected.type;
    const date = selected.created_at
      ? new Date(selected.created_at)
          .toLocaleDateString("fr-FR")
          .replace(/\//g, "-")
      : "date";
    return `certificat_${type}_${date}.${ext}`;
  };

  const handlePrint = () => {
    if (!paperRef.current) return;
    const content = paperRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Certificat médical</title>
          <style>
            * { box-sizing:border-box; margin:0; padding:0; }
            body { font-family:'Times New Roman',Georgia,serif; padding:40px; background:white; }
            .paper-inner { max-width:600px; margin:0 auto; }
            .paper-head  { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:14px; border-bottom:1.5px solid #0F172A; margin-bottom:18px; }
            .paper-dr    { font-size:17px; font-weight:700; color:#0F172A; }
            .paper-sub   { font-size:11px; color:#666; margin-top:3px; line-height:1.7; font-family:sans-serif; }
            .paper-seal  { width:34px; height:34px; border-radius:50%; border:2px solid #378ADD; display:flex; align-items:center; justify-content:center; font-size:16px; color:#378ADD; }
            .paper-ttl   { text-align:center; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#0F172A; padding:10px 0 14px; border-bottom:.5px solid #E2E8F0; margin-bottom:16px; font-family:sans-serif; }
            .paper-badge { display:inline-block; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; margin-bottom:14px; font-family:sans-serif; }
            .paper-body  { font-size:13px; color:#0F172A; line-height:2; white-space:pre-wrap; }
            .paper-foot  { display:flex; justify-content:space-between; align-items:flex-end; margin-top:32px; padding-top:14px; border-top:.5px solid #E2E8F0; }
            .paper-date  { font-size:11px; color:#999; font-family:sans-serif; }
            .sig-area    { text-align:center; }
            .sig-line    { width:80px; border-top:1px solid #999; margin:0 auto 4px; }
            .sig-name    { font-size:11px; color:#666; font-family:sans-serif; font-weight:600; }
            @media print { body { padding:20px; } }
          </style>
        </head>
        <body><div class="paper-inner">${content}</div></body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  // ── Export PDF (import statique) ────────────────────────────
  const handleExportPDF = async () => {
    if (!paperRef.current || !selected) return;
    setExporting("pdf");
    try {
      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      const imgW = pageW - 20;
      const imgH = imgW * ratio;
      const y = imgH < pageH ? (pageH - imgH) / 2 : 10;
      pdf.addImage(imgData, "PNG", 10, y, imgW, imgH);
      pdf.save(getFilename("pdf"));
    } catch {
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setExporting(null);
    }
  };

  // ── Export Image ─────────────────────────────────────────────
  const handleExportImage = async () => {
    if (!paperRef.current || !selected) return;
    setExporting("image");
    try {
      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = getFilename("png");
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Erreur lors de l'export image.");
    } finally {
      setExporting(null);
    }
  };

  const filtered = certificats.filter(
    (c) =>
      (c.patient_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.medecin_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (TYPE_INFO[c.type]?.label ?? c.type ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }

        .page-root { min-height:100vh; background:#F8FAFC; background-image:radial-gradient(at 0% 0%,rgba(139,92,246,.07) 0,transparent 50%),radial-gradient(at 100% 100%,rgba(16,185,129,.07) 0,transparent 50%); font-family:'DM Sans',sans-serif; display:flex; }
        .page-main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }

        .header-row { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:28px; animation:fadeUp .4s ease; }
        .page-title { font-family:'Syne',sans-serif; font-size:26px; font-weight:800; color:#0F172A; }
        .page-sub   { font-size:13px; color:#94A3B8; margin-top:3px; }

        .toolbar { display:flex; gap:12px; align-items:center; }
        .search-bar { background:#fff; border:1.5px solid #E2E8F0; border-radius:14px; padding:10px 16px; display:flex; align-items:center; gap:10px; width:280px; box-shadow:0 1px 4px rgba(0,0,0,.04); transition:border-color .2s; }
        .search-bar:focus-within { border-color:rgba(139,92,246,.35); }
        .search-bar input { border:none; background:transparent; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; color:#334155; width:100%; }
        .search-bar input::placeholder { color:#CBD5E1; }

        /* Stats strip */
        .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:24px; animation:fadeUp .4s ease .05s backwards; }
        .stat-card { background:rgba(255,255,255,.85); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.9); border-radius:16px; padding:14px 18px; display:flex; align-items:center; gap:12px; box-shadow:0 2px 8px rgba(0,0,0,.03); }
        .stat-icon { width:38px; height:38px; border-radius:11px; background:linear-gradient(135deg,#378ADD,#10B981); display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0; }
        .stat-val  { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:#0F172A; line-height:1; }
        .stat-lbl  { font-size:11px; color:#94A3B8; margin-top:2px; }

        /* Grid cartes */
        .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:18px; animation:fadeUp .45s ease .1s backwards; }

        .cert-card { background:#fff; border-radius:20px; border:1.5px solid #F1F5F9; padding:22px; cursor:pointer; transition:all .25s; box-shadow:0 2px 8px rgba(0,0,0,.04); }
        .cert-card:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,.08); border-color:#E2E8F0; }

        .card-top    { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
        .type-badge  { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:700; }
        .status-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .card-dr     { font-size:15px; font-weight:700; color:#0F172A; margin-bottom:3px; }
        .card-date   { font-size:12px; color:#94A3B8; }
        .card-body   { font-size:12px; color:#64748B; margin-top:10px; line-height:1.6; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .card-footer { display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:12px; border-top:1px solid #F1F5F9; }
        .card-days   { font-size:11px; font-weight:600; color:#378ADD; background:#F5F3FF; padding:3px 10px; border-radius:8px; }

        /* Empty */
        .empty-state { text-align:center; padding:80px 20px; color:#94A3B8; }

        /* Skeleton */
        .skeleton { background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:10px; }

        /* Modal */
        .modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,.5); backdrop-filter:blur(5px); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeUp .2s ease; }
        .modal-box     { background:#fff; border-radius:24px; width:100%; max-width:640px; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,.2); }
        .modal-header  { padding:24px 28px 18px; border-bottom:1px solid #F1F5F9; display:flex; justify-content:space-between; align-items:flex-start; position:sticky; top:0; background:#fff; z-index:2; border-radius:24px 24px 0 0; }
        .modal-close   { width:32px; height:32px; border-radius:50%; border:1.5px solid #E2E8F0; background:#fff; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:.2s; flex-shrink:0; }
        .modal-close:hover { background:#F1F5F9; }

        /* Actions */
        .actions-row { display:flex; gap:10px; padding:14px 28px; border-bottom:1px solid #F1F5F9; flex-wrap:wrap; }
        .action-btn  { display:flex; align-items:center; gap:7px; padding:9px 16px; border-radius:12px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:all .2s; white-space:nowrap; }
        .action-btn:disabled { opacity:.55; cursor:not-allowed !important; }
        .btn-print { background:#F1F5F9; color:#334155; }
        .btn-print:hover:not(:disabled) { background:#E2E8F0; transform:translateY(-1px); }
        .btn-pdf   { background:#378ADD; color:#fff; box-shadow:0 4px 12px rgba(139,92,246,.3); }
        .btn-pdf:hover:not(:disabled)   { background:#7C3AED; transform:translateY(-1px); }
        .btn-image { background:#0EA5E9; color:#fff; box-shadow:0 4px 12px rgba(14,165,233,.3); }
        .btn-image:hover:not(:disabled) { background:#0284C7; transform:translateY(-1px); }
        .spinner { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }

        /* Papier */
        .modal-body     { padding:24px 28px 28px; }
        .paper-preview  { border:1px solid #E2E8F0; border-radius:16px; padding:32px 28px; font-family:'Times New Roman',Georgia,serif; background:#fff; border-top:3px solid #378ADD; }
        .paper-head     { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:14px; border-bottom:1.5px solid #0F172A; margin-bottom:18px; }
        .paper-dr       { font-size:16px; font-weight:700; color:#0F172A; }
        .paper-sub      { font-size:11px; color:#666; margin-top:3px; line-height:1.7; font-family:sans-serif; }
        .paper-seal     { width:36px; height:36px; border-radius:50%; border:2px solid #378ADD; display:flex; align-items:center; justify-content:center; font-size:18px; color:#378ADD; }
        .paper-ttl      { text-align:center; font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#0F172A; padding:10px 0 14px; border-bottom:.5px solid #E2E8F0; margin-bottom:16px; font-family:sans-serif; }
        .paper-badge    { display:inline-block; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; margin-bottom:14px; font-family:sans-serif; }
        .paper-body     { font-size:13px; color:#0F172A; line-height:2; white-space:pre-wrap; min-height:80px; }
        .paper-foot     { display:flex; justify-content:space-between; align-items:flex-end; margin-top:28px; padding-top:14px; border-top:.5px solid #E2E8F0; }
        .paper-date     { font-size:11px; color:#999; font-family:sans-serif; }
        .sig-area       { text-align:center; }
        .sig-line       { width:80px; border-top:1px solid #999; margin:0 auto 4px; }
        .sig-name       { font-size:11px; color:#666; font-family:sans-serif; font-weight:600; }
      `}</style>

      <div className="page-root">
        <Sidebar stats={stats} />
        <Navbar title="Mes Certificats Médicaux" subtitle="Espace patient" />

        <main className="page-main">
          {/* Header */}
          <div className="header-row">
            <div>
              <div className="page-title">📄 Mes Certificats Médicaux</div>
              <div className="page-sub">
                {certificats.length} certificat
                {certificats.length !== 1 ? "s" : ""} disponible
                {certificats.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="toolbar">
              <div className="search-bar">
                <span style={{ fontSize: 15, color: "#CBD5E1" }}>🔍</span>
                <input
                  placeholder="Rechercher par type, médecin..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <span
                    style={{
                      fontSize: 13,
                      color: "#CBD5E1",
                      cursor: "pointer",
                    }}
                    onClick={() => setSearch("")}
                  >
                    ✕
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="stats-row">
            {[
              { icon: "📄", val: certificats.length, lbl: "Total certificats" },
              {
                icon: "✅",
                val: certificats.filter((c) => c.status === "signe").length,
                lbl: "Signés",
              },
              {
                icon: "✏️",
                val: certificats.filter((c) => c.status === "brouillon").length,
                lbl: "Brouillons",
              },
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

          {/* Contenu */}
          {loading ? (
            <div className="grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    padding: 22,
                    border: "1px solid #F1F5F9",
                  }}
                >
                  <div
                    className="skeleton"
                    style={{ height: 24, width: "60%", marginBottom: 14 }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 16, width: "40%", marginBottom: 10 }}
                  />
                  <div
                    className="skeleton"
                    style={{ height: 14, width: "80%" }}
                  />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.4 }}>
                📄
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#64748B" }}>
                Aucun certificat trouvé
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                {search
                  ? "Essayez un autre terme de recherche."
                  : "Vos certificats médicaux apparaîtront ici."}
              </div>
            </div>
          ) : (
            <div className="grid">
              {filtered.map((cert) => {
                const info = TYPE_INFO[cert.type] ?? {
                  label: cert.type,
                  color: "#6D28D9",
                  bg: "#EDE9FE",
                  icon: "📋",
                };
                const isSigne = cert.status === "signe";
                const dateStr = formatDate(cert.created_at); // Utilisation de la fonction robuste

                return (
                  <div
                    key={cert.id}
                    className="cert-card"
                    onClick={() => setSelected(cert)}
                  >
                    <div className="card-top">
                      <span
                        className="type-badge"
                        style={{ color: info.color, background: info.bg }}
                      >
                        {info.icon} {info.label}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 600,
                          color: isSigne ? "#065F46" : "#92400E",
                        }}
                      >
                        <span
                          className="status-dot"
                          style={{
                            background: isSigne ? "#10B981" : "#F59E0B",
                          }}
                        />
                        {isSigne ? "Signé" : "Brouillon"}
                      </span>
                    </div>

                    <div className="card-dr">
                      {cert.medecin_name
                        ? `Dr. ${cert.medecin_name}`
                        : "TéléConsult"}
                    </div>
                    <div className="card-date">{dateStr}</div>

                    {cert.body && <div className="card-body">{cert.body}</div>}

                    <div className="card-footer">
                      {cert.duration ? (
                        <span className="card-days">
                          ⏱ {cert.duration} jour{cert.duration > 1 ? "s" : ""}
                        </span>
                      ) : cert.start_date ? (
                        <span className="card-days">
                          📅 {formatDate(cert.start_date)}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span
                        style={{
                          fontSize: 12,
                          color: "#378ADD",
                          fontWeight: 600,
                        }}
                      >
                        Voir le détail →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── Modal détail + export ── */}
      {selected &&
        (() => {
          const info = TYPE_INFO[selected.type] ?? {
            label: selected.type,
            color: "#6D28D9",
            bg: "#EDE9FE",
            icon: "📋",
          };
          const isSigne = selected.status === "signe";
          const dateStr = formatDate(selected.created_at); // Utilisation de la fonction robuste

          return (
            <div className="modal-overlay" onClick={() => setSelected(null)}>
              <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                {/* Header modal */}
                <div className="modal-header">
                  <div>
                    <div
                      style={{
                        fontFamily: "'Syne',sans-serif",
                        fontWeight: 800,
                        fontSize: 17,
                        color: "#0F172A",
                      }}
                    >
                      Certificat médical
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#94A3B8",
                        marginTop: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        className="status-dot"
                        style={{
                          background: isSigne ? "#10B981" : "#F59E0B",
                          display: "inline-block",
                        }}
                      />
                      {isSigne ? "Signé" : "Brouillon"} · Émis le {dateStr}
                    </div>
                  </div>
                  <button
                    className="modal-close"
                    onClick={() => setSelected(null)}
                  >
                    ✕
                  </button>
                </div>

                {/* Boutons export */}
                <div className="actions-row">
                  <button
                    className="action-btn btn-print"
                    onClick={handlePrint}
                  >
                    🖨️ Imprimer
                  </button>
                  <button
                    className="action-btn btn-pdf"
                    onClick={handleExportPDF}
                    disabled={exporting !== null}
                  >
                    {exporting === "pdf" ? (
                      <>
                        <div className="spinner" /> Génération…
                      </>
                    ) : (
                      <>📄 Télécharger PDF</>
                    )}
                  </button>
                  <button
                    className="action-btn btn-image"
                    onClick={handleExportImage}
                    disabled={exporting !== null}
                  >
                    {exporting === "image" ? (
                      <>
                        <div className="spinner" /> Export…
                      </>
                    ) : (
                      <>🖼️ Exporter image</>
                    )}
                  </button>
                </div>

                {/* Papier (capturé par html2canvas) */}
                <div className="modal-body">
                  <div className="paper-preview" ref={paperRef}>
                    <div className="paper-head">
                      <div>
                        <div className="paper-dr">
                          {selected.medecin_name
                            ? `Dr. ${selected.medecin_name}`
                            : "TéléConsult"}
                        </div>
                        <div className="paper-sub">
                          Médecin · TéléConsult
                          <br />
                          Tunis, Tunisie
                        </div>
                      </div>
                      <div className="paper-seal">⚕</div>
                    </div>

                    <div className="paper-ttl">{info.label}</div>

                    <div>
                      <span
                        className="paper-badge"
                        style={{ background: info.bg, color: info.color }}
                      >
                        {info.icon} {info.label}
                      </span>
                    </div>

                    {/* Infos arrêt/reprise */}
                    {(selected.start_date || selected.duration) && (
                      <div
                        style={{
                          marginBottom: 14,
                          padding: "8px 12px",
                          background: "#F8FAFC",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "#334155",
                          fontFamily: "sans-serif",
                          display: "flex",
                          gap: 16,
                        }}
                      >
                        {selected.start_date && (
                          <span>
                            📅 À compter du :{" "}
                            <strong>{formatDate(selected.start_date)}</strong>
                          </span>
                        )}
                        {selected.duration && (
                          <span>
                            ⏱ Durée :{" "}
                            <strong>
                              {selected.duration} jour
                              {selected.duration > 1 ? "s" : ""}
                            </strong>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="paper-body">
                      {selected.body ? (
                        selected.body
                      ) : (
                        <span style={{ color: "#94A3B8", fontStyle: "italic" }}>
                          Aucun contenu renseigné pour ce certificat.
                        </span>
                      )}
                    </div>

                    <div className="paper-foot">
                      <div className="paper-date">Le {dateStr}</div>
                      <div className="sig-area">
                        <div className="sig-line" />
                        <div className="sig-name">
                          {selected.medecin_name
                            ? `Dr. ${selected.medecin_name}`
                            : "Médecin"}
                        </div>
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
