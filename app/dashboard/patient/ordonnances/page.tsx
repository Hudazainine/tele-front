"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";

// ─── ICONS (SVG Components) ───────────────────────────────────────────────────────
const LucideIcon = ({
  path,
  size = 20,
  color = "currentColor",
}: {
  path: string;
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: path }}
  />
);

const iconPaths = {
  pill: "<path d='M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7z'></path><path d='M8.5 8.5l.01.01'></path>",
  calendar:
    "<rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect><line x1='16' y1='2' x2='16' y2='6'></line><line x1='8' y1='2' x2='8' y2='6'></line><line x1='3' y1='10' x2='21' y2='10'></line>",
  stethoscope:
    "<path d='M11 4v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M18 8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z'></path><path d='M10 12v5a3 3 0 0 0 6 0v-1'></path><path d='M10 12h-1a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0z'></path>",
  clipboard:
    "<path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'></path><rect x='8' y='2' width='8' height='4' rx='1' ry='1'></rect><path d='M9 14h6'></path><path d='M9 18h6'></path><path d='M9 10h6'></path>",
  search:
    "<circle cx='11' cy='11' r='8'></circle><line x1='21' y1='21' x2='16.65' y2='16.65'></line>",
  x: "<line x1='18' y1='6' x2='6' y2='18'></line><line x1='6' y1='6' x2='18' y2='18'></line>",
  fileText:
    "<path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path><polyline points='14 2 14 8 20 8'></polyline><line x1='16' y1='13' x2='8' y2='13'></line><line x1='16' y1='17' x2='8' y2='17'></line><polyline points='10 9 9 9 8 9'></polyline>",
  printer:
    "<polyline points='6 9 6 2 18 2 18 9'></polyline><path d='M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'></path><rect x='6' y='14' width='12' height='8'></rect>",
};

// ─────────────────────────────────────────────────────────────
// INTERFACES & TYPES
// ─────────────────────────────────────────────────────────────
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
      return dashIdx !== -1
        ? { nom: clean.slice(0, dashIdx), det: clean.slice(dashIdx + 3) }
        : { nom: clean, det: "" };
    });
  return { meds, notes };
}
function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d + (d.includes("T") ? "" : "T00:00:00")).toLocaleDateString(
    "fr-FR",
    { day: "numeric", month: "long", year: "numeric" },
  );
}

// ─────────────────────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────────────────────
export default function PatientOrdonnances() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();
  const prescriptionRef = useRef<HTMLDivElement>(null);

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

  if (isLoading) return null;

  const filtered = ordonnances.filter(
    (o) =>
      o.meds.some((m) => m.nom.toLowerCase().includes(search.toLowerCase())) ||
      o.medecin_name?.toLowerCase().includes(search.toLowerCase()),
  );

  // Export handlers
  const handleExportPDF = async () => {
    if (!prescriptionRef.current || !selected) return;
    setIsExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `ordonnance-${selected.id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(prescriptionRef.current)
        .save();
    } catch (err) {
      console.error(err);
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
      link.download = `ordonnance-${selected.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };
  const handlePrint = () => window.print();

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Syne:wght@700;800&display=swap');
        @keyframes fadeInUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .light-premium-bg {
          background-color: #EFF6FF ;
          background-image: 
            radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.08) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.08) 0px, transparent 50%);
          min-height: 100vh;
        }

        .pro-card-light {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          box-shadow: 0 4px 20px -4px rgba(139, 92, 246, 0.06);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .icon-gradient-bg {
          background: linear-gradient(135deg, #378ADD, #34D399);
          box-shadow: 0 6px 15px -3px rgba(139, 92, 246, 0.35);
        }

        .text-gradient-mg {
          background: linear-gradient(135deg, #7C3AED, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .stat-card-anim { animation: fadeInUp 0.6s ease backwards; }
        
        .btn-ghost {
          background: white; border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px; padding: 10px; font-weight: 600; color: #64748b;
          cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn-ghost:hover { background: #f8fafc; border-color: #CBD5E1; color: #0F172A; }

        /* Paper Styling */
        .paper-bg { background: #fff; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border-radius: 0 0 24px 24px; border-top: 1px solid rgba(0,0,0,0.05); }
      `}</style>

      <div
        className="light-premium-bg"
        style={{
          minHeight: "100vh",
          display: "flex",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Sidebar stats={stats} />
        <Navbar title="Mes Ordonnances" subtitle={`Bonjour ${username}`} />

        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "2rem",
            paddingTop: "calc(70px + 2rem)",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
          >
            {[
              { label: "Rendez-vous", val: stats.rendezvous, icon: "calendar" },
              {
                label: "Consultations",
                val: stats.consultations,
                icon: "stethoscope",
              },
              {
                label: "Ordonnances",
                val: stats.ordonnances,
                icon: "clipboard",
              },
            ].map((c, i) => (
              <div
                key={c.label}
                className="pro-card-light stat-card-anim"
                style={{ padding: "1.2rem", animationDelay: `${i * 0.1}s` }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#64748B",
                        marginBottom: 8,
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {c.label}
                    </p>
                    <p
                      className="text-gradient-mg"
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 32,
                        fontWeight: 800,
                        margin: 0,
                      }}
                    >
                      {c.val}
                    </p>
                  </div>
                  <div
                    className="icon-gradient-bg"
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <LucideIcon
                      path={iconPaths[c.icon as keyof typeof iconPaths]}
                      size={22}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Split View */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              gap: 24,
              flex: 1,
            }}
          >
            {/* List Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Search */}
              <div
                className="pro-card-light"
                style={{
                  padding: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid rgba(255,255,255,0.9)",
                }}
              >
                <LucideIcon path={iconPaths.search} size={18} color="#94A3B8" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 14,
                    flex: 1,
                    color: "#0F172A",
                  }}
                />
                {search && (
                  <LucideIcon
                    path={iconPaths.x}
                    size={16}
                    color="#94A3B8"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSearch("")}
                  />
                )}
              </div>

              {/* List Items */}
              <div
                className="pro-card-light"
                style={{
                  padding: 12,
                  overflowY: "auto",
                  maxHeight: "calc(100vh - 350px)",
                  border: "1px solid rgba(255,255,255,0.9)",
                }}
              >
                {filtered.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 0",
                      color: "#94A3B8",
                    }}
                  >
                    <LucideIcon
                      path={iconPaths.clipboard}
                      size={40}
                      color="#E2E8F0"
                    />
                    <p style={{ marginTop: 12, fontSize: 13 }}>
                      Aucune ordonnance
                    </p>
                  </div>
                ) : (
                  filtered.map((o) => (
                    <div
                      key={o.id}
                      onClick={() => setSelected(o)}
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        marginBottom: 8,
                        cursor: "pointer",
                        background:
                          selected?.id === o.id
                            ? "rgba(55, 138, 221, 0.1)"
                            : "transparent",
                        border:
                          selected?.id === o.id
                            ? "1px solid #378ADD"
                            : "1px solid transparent",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "rgba(55, 138, 221, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#378ADD",
                            flexShrink: 0,
                          }}
                        >
                          <LucideIcon path={iconPaths.pill} size={16} />
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0F172A",
                              margin: "0 0 2px",
                            }}
                          >
                            {fmtDate(o.date)}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#64748B",
                              margin: 0,
                            }}
                          >
                            Dr. {o.medecin_name || "—"}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "#94A3B8",
                              margin: "2px 0 0",
                            }}
                          >
                            {o.meds
                              .slice(0, 2)
                              .map((m) => m.nom)
                              .join(", ")}
                            {o.meds.length > 2 ? "..." : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detail Column */}
            <div style={{ position: "sticky", top: "calc(70px + 2rem)" }}>
              {!selected ? (
                <div
                  className="pro-card-light"
                  style={{
                    height: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    color: "#94A3B8",
                  }}
                >
                  <LucideIcon
                    path={iconPaths.fileText}
                    size={48}
                    color="#E2E8F0"
                  />
                  <p style={{ marginTop: 16, fontWeight: 600 }}>
                    Sélectionnez une ordonnance
                  </p>
                </div>
              ) : (
                <>
                  {/* Toolbar */}
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <button
                      className="btn-ghost"
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      title="PDF"
                    >
                      <LucideIcon path={iconPaths.fileText} size={18} />
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={handlePrint}
                      disabled={isExporting}
                      title="Imprimer"
                    >
                      <LucideIcon path={iconPaths.printer} size={18} />
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={handleExportImage}
                      disabled={isExporting}
                      title="Image"
                    >
                      <LucideIcon path={iconPaths.pill} size={18} />
                    </button>
                  </div>

                  {/* Paper Card */}
                  <div
                    className="pro-card-light"
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.9)",
                    }}
                  >
                    <div ref={prescriptionRef}>
                      {/* Header */}
                      <div
                        style={{
                          background:
                            "linear-gradient(135deg, #378ADD, #10B981)",
                          padding: "24px",
                          color: "white",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 16,
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontSize: 22,
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 800,
                                margin: 0,
                              }}
                            >
                              Ordonnance
                            </p>
                            <p
                              style={{
                                fontSize: 13,
                                opacity: 0.9,
                                margin: "4px 0 0",
                              }}
                            >
                              Dr. {selected.medecin_name || "Médecin traitant"}
                            </p>
                          </div>
                          <div
                            style={{
                              background: "rgba(255,255,255,0.2)",
                              padding: "4px 12px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            {fmtDate(selected.date)}
                          </div>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="paper-bg">
                        <div style={{ marginBottom: 24 }}>
                          {selected.meds.length === 0 ? (
                            <p
                              style={{ color: "#94A3B8", fontStyle: "italic" }}
                            >
                              Aucun médicament.
                            </p>
                          ) : (
                            selected.meds.map((m, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  marginBottom: 16,
                                  alignItems: "flex-start",
                                }}
                              >
                                <div
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#378ADD",
                                    marginTop: 6,
                                    flexShrink: 0,
                                  }}
                                />
                                <div>
                                  <p
                                    style={{
                                      fontSize: 16,
                                      fontWeight: 700,
                                      color: "#0F172A",
                                      margin: 0,
                                    }}
                                  >
                                    {m.nom}
                                  </p>
                                  {m.det && (
                                    <p
                                      style={{
                                        fontSize: 13,
                                        color: "#64748B",
                                        marginTop: 4,
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {m.det}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {selected.notes && (
                          <div
                            style={{
                              background: "#F8FAFC",
                              padding: 16,
                              borderRadius: 12,
                              marginBottom: 24,
                            }}
                          >
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#94A3B8",
                                textTransform: "uppercase",
                                marginBottom: 8,
                              }}
                            >
                              Notes
                            </p>
                            <p
                              style={{
                                fontSize: 14,
                                color: "#475569",
                                lineHeight: 1.6,
                                whiteSpace: "pre-wrap",
                                margin: 0,
                              }}
                            >
                              {selected.notes}
                            </p>
                          </div>
                        )}

                        <div
                          style={{
                            borderTop: "1px dashed #E2E8F0",
                            paddingTop: 16,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                          }}
                        >
                          <div>
                            <p style={{ fontSize: 11, color: "#94A3B8" }}>
                              Date de prescription
                            </p>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#0F172A",
                              }}
                            >
                              {fmtDate(selected.date)}
                            </p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 11, color: "#94A3B8" }}>
                              Signature
                            </p>
                            <div
                              style={{
                                width: 100,
                                height: 1,
                                background: "#CBD5E1",
                                margin: "4px auto 0",
                              }}
                            />
                            <p
                              style={{
                                fontSize: 11,
                                color: "#64748B",
                                marginTop: 2,
                              }}
                            >
                              Médecin
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-ghost"
                    onClick={() =>
                      router.push("/dashboard/patient/consultations")
                    }
                    style={{
                      marginTop: 12,
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    Voir la consultation associée
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
