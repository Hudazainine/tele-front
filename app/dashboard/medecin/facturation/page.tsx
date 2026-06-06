"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
interface Revenu {
  total_brut: number;
  total_acomptes: number;
  total_soldes: number;
  nb_consultations: number;
}

interface Resume {
  factures: {
    nb_total: number;
    nb_soldes: number;
    nb_acomptes: number;
    total_medecin: number;
    total_plateforme: number;
    total_global: number;
  };
  revenu: Revenu;
}

interface LigneFacture {
  id: number;
  type_ligne: string;
  type_ligne_display: string;
  montant: number;
  date: string;
  description: string;
}

interface Facture {
  id: number;
  patient_name: string;
  montant_total: number;
  acompte_montant: number;
  acompte_medecin: number;
  acompte_plateforme: number;
  solde_montant: number;
  solde_medecin: number;
  total_medecin: number;
  total_plateforme: number;
  statut: string;
  statut_display: string;
  pourcentage_paye: number;
  created_at: string;
  lignes: LigneFacture[];
}

const fmt = (n: number | undefined | null) =>
  n != null ? Number(n).toFixed(2) + " DT" : "— DT";

const pct = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : 0;

const statutColor: Record<string, string> = {
  acompte_verse: "#F59E0B",
  solde_verse:   "#10B981",
  annule:        "#EF4444",
};

const ligneIcon: Record<string, string> = {
  acompte_medecin:    "💰",
  acompte_plateforme: "🏢",
  solde_medecin:      "✅",
};

export default function FacturationPage() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [resume, setResume]     = useState<Resume | null>(null);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [selected, setSelected] = useState<Facture | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }

    Promise.all([
      api.get("factures/resume/"),
      api.get("factures/"),
    ])
      .then(([r, f]) => {
        setResume(r.data);
        setFactures(f.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  if (isLoading || loading) return null;

  const r = resume;

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .main-gradient-bg {
          background: linear-gradient(135deg,#FDF4FF 0%,#ECFDF5 100%);
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
        }

        .glass-card {
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.92);
          border-radius: 22px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);
          animation: fadeUp .5s ease backwards;
        }

        .kpi-card {
          position: relative;
          border-radius: 20px;
          padding: 1.4rem 1.6rem;
          overflow: hidden;
          animation: fadeUp .5s ease backwards;
          cursor: default;
        }

        .kpi-card::before {
          content:'';
          position:absolute;
          top:-30px;right:-30px;
          width:100px;height:100px;
          border-radius:50%;
          background:rgba(255,255,255,0.18);
        }

        .text-grad {
          background: linear-gradient(135deg,#8B5CF6,#10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .fact-row {
          display:grid;
          grid-template-columns: 1fr 1fr 1fr 120px 90px;
          align-items:center;
          gap:12px;
          padding:14px 16px;
          border-radius:14px;
          cursor:pointer;
          transition:background .2s;
          border: 1px solid transparent;
        }
        .fact-row:hover { background:rgba(139,92,246,.06); border-color:rgba(139,92,246,.2); }
        .fact-row.active { background:rgba(16,185,129,.07); border-color:rgba(16,185,129,.3); }

        .progbar-track {
          height:6px; border-radius:3px;
          background:rgba(0,0,0,.08);
          overflow:hidden;
          margin-top:6px;
        }
        .progbar-fill {
          height:100%;
          border-radius:3px;
          background: linear-gradient(90deg,#8B5CF6,#10B981);
          transition: width .6s ease;
        }

        .detail-panel {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(139,92,246,.2);
          border-radius: 22px;
          padding: 1.8rem;
          animation: fadeUp .4s ease;
        }

        .tag {
          display:inline-block;
          font-size:11px;
          font-weight:700;
          padding:3px 10px;
          border-radius:20px;
        }
      `}</style>

      <div className="main-gradient-bg" style={{ display:"flex" }}>
        <Sidebar stats={{}} />
        <Navbar title="Facturation" subtitle={`Tableau de bord financier – ${username}`} />

        <main style={{ flex:1, marginLeft:240, padding:"2rem", paddingTop:"100px" }}>

          {/* ── KPI Cards ─────────────────────────────────────────── */}
<div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>

  {[
    {
      icon: "🪙",
      iconBg: "#EDE9FE",
      iconColor: "#8B5CF6",
      borderColor: "#8B5CF6",
      label: "Revenus totaux",
      value: fmt(r?.revenu?.total_brut),
      sub: "75% de chaque consultation",
      delay: "0s",
    },
    {
      icon: "🧾",
      iconBg: "#FEF3C7",
      iconColor: "#F59E0B",
      borderColor: "#F59E0B",
      label: "Acomptes perçus",
      value: fmt(r?.revenu?.total_acomptes),
      sub: "25% à la réservation",
      delay: ".08s",
    },
    {
      icon: "✅",
      iconBg: "#D1FAE5",
      iconColor: "#10B981",
      borderColor: "#10B981",
      label: "Soldes perçus",
      value: fmt(r?.revenu?.total_soldes),
      sub: "50% après consultation",
      delay: ".16s",
    },
    {
      icon: "💊",
      iconBg: "#FCE7F3",
      iconColor: "#EC4899",
      borderColor: "#EC4899",
      label: "Consultations soldées",
      value: String(r?.revenu?.nb_consultations ?? 0),
      sub: "100% réglées",
      delay: ".24s",
    },
  ].map((card, i) => (
    <div
      key={i}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderTop: `3px solid ${card.borderColor}`,
        borderRadius: 16,
        padding: "1.2rem 1.4rem",
        animation: `fadeUp .5s ease ${card.delay} backwards`,
        cursor: "default",
      }}
    >
      {/* Icône */}
      <div style={{
        width: 38, height: 38,
        borderRadius: 10,
        background: card.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
        marginBottom: 14,
      }}>
        {card.icon}
      </div>

      {/* Label */}
      <p style={{ fontSize: 12, fontWeight: 600, color: "#64748b", margin: "0 0 6px" }}>
        {card.label}
      </p>

      {/* Valeur */}
      <p style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 26,
        fontWeight: 800,
        color: "#0f172a",
        margin: "0 0 6px",
        lineHeight: 1.1,
      }}>
        {card.value}
      </p>

      {/* Sous-texte */}
      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
        {card.sub}
      </p>
    </div>
  ))}
</div>

          {/* ── Répartition visuelle ───────────────────────────────── */}
          <div className="glass-card" style={{ padding:"1.6rem", marginBottom:24, animationDelay:".3s" }}>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:"#1e1b4b", marginBottom:20 }}>
              Répartition des revenus
            </h2>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

              {/* Barre médecin */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#334155" }}>Médecin</span>
                  <span className="text-grad" style={{ fontSize:14, fontWeight:700 }}>
                    {fmt(r?.factures?.total_medecin)} — 75%
                  </span>
                </div>
                <div className="progbar-track">
                  <div className="progbar-fill" style={{ width:"75%" }} />
                </div>
                <p style={{ fontSize:11, color:"#64748b", marginTop:6 }}>
                  25% acompte + 50% solde
                </p>
              </div>

              {/* Barre plateforme */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:"#334155" }}>Plateforme</span>
                  <span style={{ fontSize:14, fontWeight:700, color:"#94a3b8" }}>
                    {fmt(r?.factures?.total_plateforme)} — 25%
                  </span>
                </div>
                <div className="progbar-track">
                  <div style={{ height:"100%", borderRadius:3, background:"#e2e8f0", width:"25%", transition:"width .6s" }} />
                </div>
                <p style={{ fontSize:11, color:"#64748b", marginTop:6 }}>
                  25% à la réservation uniquement
                </p>
              </div>
            </div>

            {/* Schéma de ventilation */}
            <div style={{ marginTop:24, padding:"16px 20px", background:"rgba(139,92,246,.05)", borderRadius:14, border:"1px solid rgba(139,92,246,.15)" }}>
              <p style={{ fontSize:12, fontWeight:700, color:"#6366F1", marginBottom:12, textTransform:"uppercase", letterSpacing:".5px" }}>
                Schéma de ventilation automatique
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:0, flexWrap:"wrap" }}>
                {[
                  { label:"Acompte 50%", sub:"à la réservation", color:"#F59E0B" },
                  { label:"→", color:"transparent", sub:"" },
                  { label:"Plateforme 25%", sub:"immédiat", color:"#8B5CF6" },
                  { label:"+", color:"transparent", sub:"" },
                  { label:"Médecin 25%", sub:"immédiat", color:"#10B981" },
                ].map((item, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center" }}>
                    {item.color === "transparent"
                      ? <span style={{ fontSize:18, color:"#94a3b8", padding:"0 8px" }}>{item.label}</span>
                      : <div style={{ background:item.color+"22", border:`1px solid ${item.color}44`, borderRadius:10, padding:"8px 14px", textAlign:"center" }}>
                          <p style={{ fontSize:12, fontWeight:700, color:item.color, margin:0 }}>{item.label}</p>
                          {item.sub && <p style={{ fontSize:10, color:item.color+"99", margin:0 }}>{item.sub}</p>}
                        </div>
                    }
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:0, flexWrap:"wrap", marginTop:10 }}>
                {[
                  { label:"Solde 50%", sub:"après consultation", color:"#3B82F6" },
                  { label:"→", color:"transparent", sub:"" },
                  { label:"Plateforme 0%", sub:"rien", color:"#94a3b8" },
                  { label:"+", color:"transparent", sub:"" },
                  { label:"Médecin 50%", sub:"intégral", color:"#10B981" },
                ].map((item, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center" }}>
                    {item.color === "transparent"
                      ? <span style={{ fontSize:18, color:"#94a3b8", padding:"0 8px" }}>{item.label}</span>
                      : <div style={{ background:item.color+"22", border:`1px solid ${item.color}44`, borderRadius:10, padding:"8px 14px", textAlign:"center" }}>
                          <p style={{ fontSize:12, fontWeight:700, color:item.color, margin:0 }}>{item.label}</p>
                          {item.sub && <p style={{ fontSize:10, color:item.color+"99", margin:0 }}>{item.sub}</p>}
                        </div>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Liste des factures + détail ───────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns: selected ? "1.1fr 1fr" : "1fr", gap:20 }}>

            {/* Liste */}
            <div className="glass-card" style={{ padding:"1.4rem", animationDelay:".35s" }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:16, color:"#1e1b4b", marginBottom:16 }}>
                Factures ({factures.length})
              </h2>

              {/* En-tête */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 120px 90px", gap:12, padding:"8px 16px", marginBottom:4 }}>
                {["Patient","Montant","Ma part","Statut",""].map(h => (
                  <span key={h} style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".5px" }}>{h}</span>
                ))}
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:480, overflowY:"auto" }}>
                {factures.length === 0
                  ? <p style={{ color:"#94a3b8", textAlign:"center", padding:"2rem", fontSize:13 }}>Aucune facture</p>
                  : factures.map(f => (
                    <div
                      key={f.id}
                      className={`fact-row${selected?.id === f.id ? " active" : ""}`}
                      onClick={() => setSelected(selected?.id === f.id ? null : f)}
                    >
                      <div>
                        <p style={{ fontSize:13, fontWeight:600, color:"#1e293b", margin:0 }}>{f.patient_name || "Patient"}</p>
                        <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{new Date(f.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <p style={{ fontSize:13, fontWeight:600, color:"#334155" }}>{fmt(f.montant_total)}</p>
                      <div>
                        <p className="text-grad" style={{ fontSize:13, fontWeight:700, margin:0 }}>{fmt(f.total_medecin)}</p>
                        <div className="progbar-track">
                          <div className="progbar-fill" style={{ width:`${f.pourcentage_paye * 0.75}%` }} />
                        </div>
                      </div>
                      <span
                        className="tag"
                        style={{
                          background: (statutColor[f.statut] ?? "#94a3b8") + "22",
                          color: statutColor[f.statut] ?? "#94a3b8",
                          border: `1px solid ${(statutColor[f.statut] ?? "#94a3b8")}44`,
                        }}
                      >
                        {f.statut_display}
                      </span>
                      <span style={{ fontSize:12, color:"#94a3b8" }}>Voir →</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Détail */}
            {selected && (
              <div className="detail-panel">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div>
                    <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, color:"#1e1b4b", margin:0 }}>
                      Facture #{selected.id}
                    </h3>
                    <p style={{ fontSize:13, color:"#64748b", margin:"4px 0 0" }}>{selected.patient_name}</p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#94a3b8" }}
                  >✕</button>
                </div>

                {/* Totaux */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                  {[
                    { label:"Montant total", value: fmt(selected.montant_total), color:"#6366F1" },
                    { label:"Ma part totale", value: fmt(selected.total_medecin), color:"#10B981" },
                    { label:"Acompte reçu", value: fmt(selected.acompte_medecin), color:"#F59E0B" },
                    { label:"Solde reçu", value: fmt(selected.solde_medecin), color:"#3B82F6" },
                  ].map(item => (
                    <div key={item.label} style={{ background:item.color+"11", borderRadius:12, padding:"12px 16px", border:`1px solid ${item.color}22` }}>
                      <p style={{ fontSize:11, fontWeight:700, color:item.color, margin:0, textTransform:"uppercase", letterSpacing:".5px" }}>{item.label}</p>
                      <p style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:item.color, margin:"6px 0 0" }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Progression */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:"#334155" }}>Progression du paiement</span>
                    <span className="text-grad" style={{ fontSize:12, fontWeight:700 }}>{selected.pourcentage_paye}%</span>
                  </div>
                  <div className="progbar-track" style={{ height:8 }}>
                    <div className="progbar-fill" style={{ width:`${selected.pourcentage_paye}%` }} />
                  </div>
                </div>

                {/* Lignes */}
                <h4 style={{ fontSize:13, fontWeight:700, color:"#1e1b4b", marginBottom:10 }}>Transactions</h4>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {selected.lignes.map(l => (
                    <div key={l.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"rgba(255,255,255,.8)", borderRadius:12, border:"1px solid rgba(0,0,0,.06)" }}>
                      <span style={{ fontSize:18 }}>{ligneIcon[l.type_ligne] ?? "📄"}</span>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:"#334155", margin:0 }}>{l.type_ligne_display}</p>
                        <p style={{ fontSize:11, color:"#94a3b8", margin:0 }}>{new Date(l.date).toLocaleString("fr-FR")}</p>
                      </div>
                      <span className="text-grad" style={{ fontSize:14, fontWeight:700 }}>{fmt(l.montant)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}