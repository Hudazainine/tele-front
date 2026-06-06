"use client";
import { useState, useEffect, useRef } from "react";
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
  notifications: number;
}

interface Medicament {
  nom: string;
  det: string;
}

interface Ordonnance {
  id: number;
  consultation: number;
  medicaments: string;
  date: string;
  medecin_name?: string;
}

interface ParsedOrdonnance extends Ordonnance {
  meds: Medicament[];
  notes: string;
}

function parseMedicaments(raw: string): { meds: Medicament[]; notes: string } {
  if (!raw) return { meds: [], notes: "" };
  const notesIdx = raw.indexOf("\n\nNotes");
  const medsRaw = notesIdx !== -1 ? raw.slice(0, notesIdx) : raw;
  const notes =
    notesIdx !== -1
      ? raw
          .slice(notesIdx + 2)
          .replace(/^Notes\s*:\s*/i, "")
          .trim()
      : "";
  const meds = medsRaw
    .split("\n")
    .filter((l) => l.trim())
    .map((line) => {
      const clean = line.replace(/^-\s*/, "");
      const dashIdx = clean.indexOf(" — ");
      if (dashIdx !== -1) {
        return { nom: clean.slice(0, dashIdx), det: clean.slice(dashIdx + 3) };
      }
      return { nom: clean, det: "" };
    });
  return { meds, notes };
}

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + (d.includes("T") ? "" : "T00:00:00")).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

export default function PatientOrdonnances() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();
  const prescriptionRef = useRef<HTMLDivElement>(null); // Ref pour cibler l'élément à exporter

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
    notifications: 0,
  });
  const [ordonnances, setOrdonnances] = useState<ParsedOrdonnance[]>([]);
  const [selected, setSelected] = useState<ParsedOrdonnance | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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
      api.get("notifications/"),
    ])
      .then(([r, c, o, n]) => {
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
          notifications: n.data.length,
        });
        const parsed: ParsedOrdonnance[] = [...o.data]
          .sort(
            (a: Ordonnance, b: Ordonnance) =>
              new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
          )
          .map((ordo: Ordonnance) => {
            const { meds, notes } = parseMedicaments(ordo.medicaments);
            return { ...ordo, meds, notes };
          });
        setOrdonnances(parsed);
        if (parsed.length > 0) setSelected(parsed[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  if (isLoading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8F8F6",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💊</div>
          <div style={{ fontSize: 14, color: "#185FA5", fontWeight: 600 }}>
            Chargement...
          </div>
        </div>
      </div>
    );

  const filtered = ordonnances.filter(
    (o) =>
      o.meds.some((m) => m.nom.toLowerCase().includes(search.toLowerCase())) ||
      o.medecin_name?.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Fonctions d'export ──

  const handleExportPDF = async () => {
    if (!prescriptionRef.current || !selected) return;
    setIsExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `ordonnance-${selected.id}-${fmtDate(selected.date)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      await html2pdf().set(opt).from(prescriptionRef.current).save();
    } catch (err) {
      console.error("Erreur export PDF:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (!prescriptionRef.current || !selected) return;
    setIsExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(prescriptionRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `ordonnance-${selected.id}-${fmtDate(selected.date)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Erreur export Image:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        /* ── Base ── */
        .pg-root { min-height:100vh; background:#EFF6FF ; font-family:'DM Sans',sans-serif; display:flex; }
        .pg-main { margin-left:260px; flex:1; padding:2rem; padding-top:calc(70px + 2rem); }

        /* ── Header ── */
        .pg-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
        .pg-title  { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#1e1b4b; }
        .pg-sub    { font-size:13px; color:#94a3b8; margin-top:2px; }

        /* ── Stats ── */
        .stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
        .stat-card { background:#fff; border:0.5px solid rgba(0,0,0,0.09); border-radius:12px; padding:14px 16px; display:flex; align-items:center; gap:12px; }
        .stat-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .stat-val  { font-size:20px; font-weight:600; color:#1e1b4b; line-height:1; }
        .stat-lbl  { font-size:11px; color:#94a3b8; margin-top:3px; }

        /* ── Split layout ── */
        .split { display:grid; grid-template-columns:300px minmax(0,1fr); gap:14px; align-items:start; }

        /* ── Left col ── */
        .left-col  { display:flex; flex-direction:column; gap:10px; }
        .srch-wrap { background:#fff; border:0.5px solid rgba(0,0,0,0.09); border-radius:10px; padding:9px 12px; display:flex; align-items:center; gap:8px; }
        .srch-icon { font-size:15px; color:#aaa; }
        .srch-inp  { flex:1; border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:13px; color:#334155; outline:none; }
        .srch-inp::placeholder { color:#b0b8c4; }

        .list-card { background:#fff; border:0.5px solid rgba(0,0,0,0.09); border-radius:12px; overflow:hidden; }
        .li { padding:12px 14px; border-bottom:0.5px solid rgba(0,0,0,0.06); cursor:pointer; display:flex; gap:10px; align-items:flex-start; transition:background .12s; }
        .li:last-child { border-bottom:none; }
        .li:hover { background:#FAFAFA; }
        .li.active { background:#EEEDFE; border-left:2px solid #185FA5; }
        .li-pill { width:32px; height:32px; border-radius:9px; background:#EEEDFE; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .li-date  { font-size:13px; font-weight:600; color:#1e293b; }
        .li-dr    { font-size:11px; color:#64748b; margin-top:2px; }
        .li-prev  { font-size:11px; color:#94a3b8; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px; }
        .li-badge { font-size:10px; font-weight:600; color:#185FA5; background:#EEEDFE; padding:2px 8px; border-radius:20px; flex-shrink:0; align-self:flex-start; margin-top:2px; }

        /* ── Right col ── */
        .right-col  { position:sticky; top:calc(70px + 2rem); }
        .paper-card { background:#fff; border:0.5px solid rgba(0,0,0,0.09); border-radius:12px; overflow:hidden; }

        /* Paper header */
        .paper-hd { background:#185FA5; padding:18px 20px; color:#fff; }
        .paper-hd-row { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
        .paper-dr  { font-size:15px; font-weight:600; }
        .paper-sub { font-size:11px; opacity:.7; margin-top:2px; }
        .paper-stamp { width:32px; height:32px; border-radius:50%; border:1.5px solid rgba(255,255,255,0.35); display:flex; align-items:center; justify-content:center; font-size:15px; }
        .paper-date-pill { display:inline-flex; align-items:center; gap:5px; background:rgba(255,255,255,0.15); border:0.5px solid rgba(255,255,255,0.25); border-radius:20px; padding:4px 10px; font-size:11px; font-weight:500; }

        /* Paper body */
        .paper-body  { padding:16px 20px; display:flex; flex-direction:column; gap:14px; }
        .paper-title { text-align:center; font-size:10px; font-weight:600; letter-spacing:1.4px; text-transform:uppercase; color:#94a3b8; padding-bottom:12px; border-bottom:0.5px solid rgba(0,0,0,0.07); }
        .rx-row  { display:flex; gap:10px; }
        .rx-sym  { font-size:20px; font-weight:600; color:#185FA5; line-height:1; flex-shrink:0; margin-top:-2px; }
        .med-li  { padding:7px 0; border-bottom:0.5px solid rgba(0,0,0,0.06); }
        .med-li:last-child { border-bottom:none; }
        .med-name { font-size:13px; font-weight:600; color:#1e293b; }
        .med-det  { font-size:11px; color:#94a3b8; margin-top:2px; line-height:1.5; }
        .notes-block { font-size:11px; color:#64748b; line-height:1.6; padding:10px 12px; background:#F8F8F6; border-radius:8px; border:0.5px solid rgba(0,0,0,0.07); white-space:pre-wrap; }
        .paper-ft { display:flex; justify-content:space-between; align-items:flex-end; padding-top:12px; border-top:0.5px solid rgba(0,0,0,0.07); }
        .paper-ft-date { font-size:11px; color:#aaa; }
        .sig-line { width:70px; border-top:0.5px solid #999; margin:0 auto 3px; }
        .sig-name { font-size:10px; color:#888; text-align:center; }

        /* Buttons */
        .btn-sec { width:100%; background:transparent; border:0.5px solid rgba(0,0,0,0.12); border-radius:8px; color:#64748b; font-size:12px; padding:9px; cursor:pointer; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:6px; transition:background .12s,border-color .12s,color .12s; }
        .btn-sec:hover { background:#EEEDFE; border-color:#185FA5; color:#185FA5; }
        
        /* Export Buttons */
        .export-bar { display:flex; gap:8px; margin-bottom:10px; }
        .btn-export { flex:1; background:#fff; border:0.5px solid rgba(0,0,0,0.12); border-radius:8px; color:#334155; font-size:12px; padding:8px 6px; cursor:pointer; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:5px; transition:all .15s; font-weight:500; }
        .btn-export:hover { background:#185FA5; color:#fff; border-color:#185FA5; }
        .btn-export:disabled { opacity:0.5; cursor:not-allowed; background:#f1f1f1; color:#999; border-color:#e1e1e1; }

        /* Empty */
        .empty-state { text-align:center; padding:50px 20px; color:#aaa; }
        .empty-state i { font-size:32px; margin-bottom:10px; display:block; }

        /* Skeleton */
        .skeleton { background:linear-gradient(90deg,rgba(0,0,0,0.05) 25%,rgba(0,0,0,0.08) 50%,rgba(0,0,0,0.05) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        /* ── PRINT STYLES ── */
        @media print {
          body { background: white !important; }
          .pg-root > *:not(.pg-main) { display: none !important; } /* Hide Sidebar/Navbar */
          .pg-main { margin-left: 0 !important; padding: 0 !important; }
          .pg-header, .stats-row, .left-col, .btn-sec, .export-bar { display: none !important; } /* Hide UI elements */
          .split { display: block !important; }
          .right-col { position: static !important; }
          .paper-card { border: none !important; box-shadow: none !important; }
        }
      `}</style>

      <div className="pg-root">
        <Sidebar stats={stats} />
        <Navbar title="Mes Ordonnances" subtitle={`Bonjour ${username}`} />

        <main className="pg-main">
          {/* Header */}
          <div className="pg-header">
            <div>
              <div className="pg-title">Mes Ordonnances</div>
              <div className="pg-sub">
                {ordonnances.length} ordonnance
                {ordonnances.length !== 1 ? "s" : ""} dans votre historique
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            {[
              {
                icon: "📅",
                val: stats.rendezvous,
                lbl: "Rendez-vous",
                bg: "#EEEDFE",
                color: "#185FA5",
              },
              {
                icon: "🩺",
                val: stats.consultations,
                lbl: "Consultations",
                bg: "#E1F5EE",
                color: "#0F6E56",
              },
              {
                icon: "💊",
                val: stats.ordonnances,
                lbl: "Ordonnances",
                bg: "#EEEDFE",
                color: "#185FA5",
              },
            ].map((s) => (
              <div key={s.lbl} className="stat-card">
                <div className="stat-icon" style={{ background: s.bg }}>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                </div>
                <div>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Split */}
          <div className="split">
            {/* ── Liste ── */}
            <div className="left-col">
              <div className="srch-wrap">
                <span className="srch-icon">🔍</span>
                <input
                  className="srch-inp"
                  placeholder="Rechercher un médicament..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="list-card">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="li">
                      <div
                        className="skeleton"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          className="skeleton"
                          style={{ height: 13, width: "65%", marginBottom: 6 }}
                        />
                        <div
                          className="skeleton"
                          style={{ height: 11, width: "80%" }}
                        />
                      </div>
                    </div>
                  ))
                ) : filtered.length === 0 ? (
                  <div className="empty-state">
                    <span
                      style={{
                        fontSize: 32,
                        display: "block",
                        marginBottom: 10,
                        opacity: 0.4,
                      }}
                    >
                      💊
                    </span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      Aucune ordonnance
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      {search
                        ? "Essayez un autre terme."
                        : "Votre historique est vide."}
                    </div>
                  </div>
                ) : (
                  filtered.map((o) => (
                    <div
                      key={o.id}
                      className={`li${selected?.id === o.id ? " active" : ""}`}
                      onClick={() => setSelected(o)}
                    >
                      <div className="li-pill">
                        <span style={{ fontSize: 15 }}>💊</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="li-date">{fmtDate(o.date)}</div>
                        <div className="li-dr">
                          Dr. {o.medecin_name || "Médecin traitant"}
                        </div>
                        <div className="li-prev">
                          {o.meds.map((m) => m.nom).join(", ") || "—"}
                        </div>
                      </div>
                      {o.meds.length > 0 && (
                        <span className="li-badge">{o.meds.length} méd.</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Détail ── */}
            <div className="right-col">
              {/* Barre d'export (visible seulement si une ordonnance est sélectionnée) */}
              {selected && (
                <div className="export-bar no-print">
                  <button
                    className="btn-export"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                  >
                    {isExporting ? "⏳" : "📄"} PDF
                  </button>
                  <button
                    className="btn-export"
                    onClick={handlePrint}
                    disabled={isExporting}
                  >
                    🖨️ Imprimer
                  </button>
                  <button
                    className="btn-export"
                    onClick={handleExportImage}
                    disabled={isExporting}
                  >
                    🖼️ Image
                  </button>
                </div>
              )}

              {!selected ? (
                <div className="paper-card">
                  <div className="empty-state" style={{ padding: "70px 20px" }}>
                    <span
                      style={{
                        fontSize: 32,
                        display: "block",
                        marginBottom: 10,
                        opacity: 0.4,
                      }}
                    >
                      📋
                    </span>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#64748b",
                      }}
                    >
                      Sélectionnez une ordonnance
                    </div>
                    <div style={{ fontSize: 12, marginTop: 6, color: "#aaa" }}>
                      Le détail apparaîtra ici
                    </div>
                  </div>
                </div>
              ) : (
                <div className="paper-card" ref={prescriptionRef}>
                  {/* Header violet */}
                  <div className="paper-hd">
                    <div className="paper-hd-row">
                      <div>
                        <div className="paper-dr">
                          Dr. {selected.medecin_name || "Médecin traitant"}
                        </div>
                        <div className="paper-sub">
                          Médecin Généraliste · N° 12345
                        </div>
                      </div>
                      <div className="paper-stamp">⚕</div>
                    </div>
                    <div className="paper-date-pill">
                      📅 {fmtDate(selected.date)}
                    </div>
                  </div>

                  {/* Corps */}
                  <div className="paper-body">
                    <div className="paper-title">Ordonnance médicale</div>

                    {/* Rx */}
                    <div className="rx-row">
                      <div className="rx-sym">Rx</div>
                      <div style={{ flex: 1 }}>
                        {selected.meds.length === 0 ? (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#ccc",
                              fontStyle: "italic",
                            }}
                          >
                            Aucun médicament renseigné
                          </div>
                        ) : (
                          selected.meds.map((m, i) => (
                            <div key={i} className="med-li">
                              <div className="med-name">{m.nom}</div>
                              {m.det && <div className="med-det">{m.det}</div>}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {selected.notes && (
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#aaa",
                            letterSpacing: ".7px",
                            textTransform: "uppercase",
                            marginBottom: 6,
                          }}
                        >
                          Notes
                        </div>
                        <div className="notes-block">{selected.notes}</div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="paper-ft">
                      <div className="paper-ft-date">
                        Le {fmtDate(selected.date)}
                      </div>
                      <div>
                        <div className="sig-line" />
                        <div className="sig-name">
                          Dr. {selected.medecin_name || "Médecin traitant"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton consultation associée (en dehors du ref pour ne pas l'inclure dans le PDF/Image) */}
              {selected && (
                <div style={{ marginTop: "10px" }} className="no-print">
                  <button
                    className="btn-sec"
                    onClick={() =>
                      router.push("/dashboard/patient/consultations")
                    }
                  >
                    🩺 Voir la consultation associée
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
