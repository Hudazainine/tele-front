// page.tsx (Ordonnances)
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import {
  Calendar,
  Search,
  X,
  Plus,
  Trash2,
  Eye,
  Inbox,
  Loader2,
  Filter,
  Pencil,
  FileText,
} from "lucide-react";

import { Stats, Ordonnance, SHARED_MODAL_CSS } from "./ordonnances-shared";
import OrdonnanceModal from "./OrdonnanceModal";
import ViewOrdonnanceModal from "./ViewOrdonnanceModal";
import EditOrdonnanceModal from "./EditOrdonnanceModal";

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────

export default function OrdonnancesPage() {
  const { token, isLoading, username } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<"all" | "month" | "week">(
    "all",
  );
  const [viewOrd, setViewOrd] = useState<Ordonnance | null>(null);
  const [editOrd, setEditOrd] = useState<Ordonnance | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
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
        const sorted = [...o.data].sort(
          (a: Ordonnance, b: Ordonnance) =>
            new Date(b.date || b.date_heure || 0).getTime() -
            new Date(a.date || a.date_heure || 0).getTime(),
        );
        setOrdonnances(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [token, isLoading, fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette ordonnance ?")) return;
    setDeleting(id);
    try {
      await api.delete(`ordonnances/${id}/`);
      setOrdonnances((prev) => prev.filter((o) => o.id !== id));
      setStats((prev) => ({ ...prev, ordonnances: prev.ordonnances - 1 }));
    } catch {
      alert("Erreur lors de la suppression.");
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) return null;

  const now = new Date();

  const filtered = ordonnances.filter((o) => {
    const matchSearch =
      (o.patient_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (o.medicaments ?? "").toLowerCase().includes(search.toLowerCase());
    const dateStr = o.date || o.date_heure;
    const d = dateStr ? new Date(dateStr) : null;
    if (filterPeriod === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return matchSearch && d !== null && d >= weekAgo;
    }
    if (filterPeriod === "month") {
      return (
        matchSearch &&
        d !== null &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    return matchSearch;
  });

  const countMonth = ordonnances.filter((o) => {
    const d = o.date || o.date_heure ? new Date(o.date || o.date_heure) : null;
    return (
      d &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  const countWeek = ordonnances.filter((o) => {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const d = o.date || o.date_heure ? new Date(o.date || o.date_heure) : null;
    return d && d >= weekAgo;
  }).length;

  const previewMeds = (text: string) => {
    const lines = text
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("Notes"));
    if (!lines.length) return "—";
    const first = lines[0].replace(/^[-•]\s*/, "").trim();
    return lines.length > 1 ? `${first} +${lines.length - 1}` : first;
  };

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      {/* CSS partagé par les 3 modals (à injecter une seule fois ici) */}
      <style>{SHARED_MODAL_CSS}</style>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes fadeUpPage { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        .dme-bg { background:linear-gradient(135deg,#FDF4FF 0%,#ECFDF5 100%); min-height:100vh; }
        .dme-card { background:rgba(255,255,255,0.78); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.95); border-radius:24px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.02); }

        .root { display:flex; font-family:'DM Sans',sans-serif; }
        .main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2rem); animation:fadeUpPage 0.5s ease; }

        .page-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:36px; }
        .page-title { 
            font-family:'Syne',sans-serif; 
            font-size:28px; 
            font-weight:800; 
            background: linear-gradient(135deg, #8B5CF6, #10B981); 
            -webkit-background-clip: text; 
            background-clip: text; 
            color: transparent; 
            -webkit-text-fill-color: transparent; }
        .page-sub { font-size:14px; color:#64748B; margin-top:4px; }

        .btn-new { display:flex; align-items:center; gap:10px; background:linear-gradient(135deg,#8B5CF6,#10B981); color:white; border:none; border-radius:14px; padding:12px 24px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.25s; box-shadow:0 4px 14px rgba(139,92,246,0.25); }
        .btn-new:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(139,92,246,0.35); }

        .toolbar-row { display:flex; gap:16px; align-items:center; margin-bottom:24px; flex-wrap:wrap; }

        .search-container { position:relative; display:flex; align-items:center; background:rgba(255,255,255,0.8); border:1.5px solid rgba(0,0,0,0.06); border-radius:12px; box-shadow:0 1px 2px rgba(0,0,0,0.05); transition:all 0.2s; flex:1; min-width:300px; }
        .search-container:focus-within { border-color:#8B5CF6; background:white; box-shadow:0 0 0 3px rgba(139,92,246,0.1); }
        .search-input { width:100%; padding:12px 40px; border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:14px; color:#334155; outline:none; }
        .search-icon-abs { position:absolute; left:12px; color:#94A3B8; pointer-events:none; }
        .clear-btn-search { position:absolute; right:12px; background:none; border:none; cursor:pointer; color:#94A3B8; padding:4px; border-radius:6px; transition:all 0.2s; display:flex; align-items:center; justify-content:center; }
        .clear-btn-search:hover { background:#F1F5F9; color:#EF4444; }

        .filter-btn { display:flex; align-items:center; gap:8px; padding:8px 14px; border-radius:10px; border:1px solid rgba(0,0,0,0.05); background:rgba(255,255,255,0.7); color:#475569; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .filter-btn:hover { background:rgba(139,92,246,0.05); border-color:rgba(139,92,246,0.2); color:#8B5CF6; }
        .filter-btn.active { background:rgba(139,92,246,0.1); border-color:rgba(139,92,246,0.3); color:#8B5CF6; }

        .table-card { padding:8px 0; overflow:hidden; }
        .table-head { display:grid; grid-template-columns:2fr 1.1fr 2.2fr 1.8fr; padding:12px 28px; font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:1px; }
        .table-row { display:grid; grid-template-columns:2fr 1.1fr 2.2fr 1.8fr; padding:14px 28px; align-items:center; transition:all 0.15s; border-bottom:1px solid rgba(0,0,0,0.03); }
        .table-row:last-child { border-bottom:none; }
        .table-row:hover { background:rgba(139,92,246,0.04); }

        .td-patient { display:flex; align-items:center; gap:12px; }
        .avatar { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,#E0E7FF,#C7D2FE); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:#4F46E5; flex-shrink:0; }
        .pt-name { font-size:14px; font-weight:600; color:#1E293B; }
        .pt-ref { font-size:11px; color:#94A3B8; font-weight:500; }
        .td-date { font-size:13px; color:#475569; font-weight:500; }
        .td-meds { font-size:13px; color:#64748B; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:16px; }

        .actions-cell { display:flex; gap:6px; flex-wrap:nowrap; }
        .btn-sm { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:9px; font-size:12px; font-weight:600; cursor:pointer; border:none; transition:all 0.2s; font-family:'DM Sans',sans-serif; white-space:nowrap; }
        .btn-view { background:rgba(139,92,246,0.1); color:#8B5CF6; }
        .btn-view:hover { background:#8B5CF6; color:white; }
        .btn-edit-row { background:rgba(16,185,129,0.1); color:#10B981; }
        .btn-edit-row:hover { background:#10B981; color:white; }
        .btn-del { background:rgba(239,68,68,0.1); color:#EF4444; }
        .btn-del:hover { background:#EF4444; color:white; }
        .btn-del:disabled { opacity:0.5; cursor:not-allowed; }

        .empty { text-align:center; padding:80px 20px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#94A3B8; }
        .empty-icon { width:64px; height:64px; border-radius:20px; background:rgba(139,92,246,0.05); border:2px dashed rgba(139,92,246,0.15); display:flex; align-items:center; justify-content:center; color:#8B5CF6; margin-bottom:20px; }
        .empty-title { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:#1E293B; margin-bottom:8px; }
        .empty-sub { font-size:14px; margin-bottom:24px; max-width:300px; }
        .empty-btn { padding:12px 28px; background:linear-gradient(135deg,#8B5CF6,#10B981); border:none; border-radius:14px; color:white; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(139,92,246,0.25); transition:all 0.2s; }
        .empty-btn:hover { transform:translateY(-2px); }
      `}</style>

      <div className="root dme-bg">
        <Sidebar stats={stats} />
        <Navbar title="Ordonnances" subtitle={`Dr. ${username ?? ""}`} />

        <main className="main">
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="page-title">Ordonnances</div>
              <div className="page-sub">
                {stats.ordonnances} ordonnance
                {stats.ordonnances !== 1 ? "s" : ""} enregistrée
                {stats.ordonnances !== 1 ? "s" : ""}
              </div>
            </div>
            <button className="btn-new" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} strokeWidth={2} /> Nouvelle ordonnance
            </button>
          </div>

          {/* Toolbar */}
          <div className="toolbar-row">
            <div className="search-container">
              <div className="search-icon-abs">
                <Search size={18} strokeWidth={2} />
              </div>
              <input
                className="search-input"
                placeholder="Rechercher par patient ou médicament…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="clear-btn-search"
                  onClick={() => setSearch("")}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Filtres temporels */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className={`filter-btn ${filterPeriod === "all" ? "active" : ""}`}
                onClick={() => setFilterPeriod("all")}
              >
                <FileText size={14} strokeWidth={2.5} />
                <span>Toutes</span>
                <span
                  style={{
                    marginLeft: 2,
                    background: filterPeriod === "all" ? "#8B5CF6" : "#E2E8F0",
                    color: filterPeriod === "all" ? "#fff" : "#64748B",
                    borderRadius: 20,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {stats.ordonnances}
                </span>
              </button>

              <button
                className={`filter-btn ${filterPeriod === "month" ? "active" : ""}`}
                onClick={() => setFilterPeriod("month")}
              >
                <Calendar size={14} strokeWidth={2.5} />
                <span>Ce mois</span>
                <span
                  style={{
                    marginLeft: 2,
                    background:
                      filterPeriod === "month" ? "#8B5CF6" : "#E2E8F0",
                    color: filterPeriod === "month" ? "#fff" : "#64748B",
                    borderRadius: 20,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {countMonth}
                </span>
              </button>

              <button
                className={`filter-btn ${filterPeriod === "week" ? "active" : ""}`}
                onClick={() => setFilterPeriod("week")}
              >
                <Filter size={14} strokeWidth={2.5} />
                <span>Cette semaine</span>
                <span
                  style={{
                    marginLeft: 2,
                    background: filterPeriod === "week" ? "#8B5CF6" : "#E2E8F0",
                    color: filterPeriod === "week" ? "#fff" : "#64748B",
                    borderRadius: 20,
                    padding: "1px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {countWeek}
                </span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="dme-card table-card">
            <div className="table-head">
              <span>Patient</span>
              <span>Date</span>
              <span>Médicaments</span>
              <span>Actions</span>
            </div>

            {loading ? (
              <div
                style={{
                  padding: 40,
                  display: "flex",
                  justifyContent: "center",
                  color: "#94A3B8",
                }}
              >
                <Loader2 size={32} strokeWidth={2} className="spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">
                  <Inbox size={32} strokeWidth={1.5} />
                </div>
                <div className="empty-title">
                  {search
                    ? `Aucun résultat pour « ${search} »`
                    : filterPeriod !== "all"
                      ? "Aucune ordonnance sur cette période"
                      : "Aucune ordonnance"}
                </div>
                <div className="empty-sub">
                  {search
                    ? "Essayez un autre terme."
                    : filterPeriod !== "all"
                      ? "Élargissez la période ou créez une nouvelle ordonnance."
                      : "Créez votre première ordonnance pour commencer."}
                </div>
                {!search && (
                  <button
                    className="empty-btn"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus
                      size={18}
                      strokeWidth={2}
                      style={{ marginRight: 8 }}
                    />{" "}
                    Nouvelle ordonnance
                  </button>
                )}
              </div>
            ) : (
              filtered.map((o) => (
                <div key={o.id} className="table-row">
                  <div className="td-patient">
                    <div className="avatar">
                      {(o.patient_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="pt-name">{o.patient_name || "—"}</div>
                      <div className="pt-ref">
                        #{String(o.id).padStart(4, "0")}
                      </div>
                    </div>
                  </div>
                  <div className="td-date">
                    {o.date || o.date_heure
                      ? new Date(o.date || o.date_heure).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )
                      : "—"}
                  </div>
                  <div className="td-meds" title={o.medicaments}>
                    {previewMeds(o.medicaments || "")}
                  </div>
                  <div className="actions-cell">
                    <button
                      className="btn-sm btn-view"
                      onClick={() => setViewOrd(o)}
                    >
                      <Eye size={13} strokeWidth={2} /> Voir
                    </button>
                    <button
                      className="btn-sm btn-edit-row"
                      onClick={() => setEditOrd(o)}
                    >
                      <Pencil size={13} strokeWidth={2} /> Modifier
                    </button>
                    <button
                      className="btn-sm btn-del"
                      disabled={deleting === o.id}
                      onClick={() => handleDelete(o.id)}
                    >
                      {deleting === o.id ? (
                        <Loader2 size={13} strokeWidth={2} className="spin" />
                      ) : (
                        <Trash2 size={13} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* MODALS */}
        <OrdonnanceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreated={fetchData}
        />

        {viewOrd && (
          <ViewOrdonnanceModal
            ordonnance={viewOrd}
            onClose={() => setViewOrd(null)}
            onEdit={() => {
              setEditOrd(viewOrd);
              setViewOrd(null);
            }}
          />
        )}

        {editOrd && (
          <EditOrdonnanceModal
            ordonnance={editOrd}
            onClose={() => setEditOrd(null)}
            onSaved={(updated) => {
              setOrdonnances((prev) =>
                prev.map((o) => (o.id === updated.id ? updated : o)),
              );
              setEditOrd(null);
            }}
          />
        )}
      </div>
    </PrivateRoute>
  );
}
