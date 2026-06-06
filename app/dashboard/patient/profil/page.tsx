"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../lib/api";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";

interface Profil {
  id: number;
  username: string;
  email: string;
  allergies: string;
  historique: string;
}
interface FormData {
  username: string;
  email: string;
  allergies: string;
  historique: string;
}

export default function PatientProfil() {
  const { token, isLoading, logout } = useAuth();
  const router = useRouter();

  const [profil, setProfil] = useState<Profil | null>(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    allergies: "",
    historique: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [stats, setStats] = useState({
    rendezvous: 0,
    consultations: 0,
    ordonnances: 0,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    api
      .get("users/me/")
      .then((r) => {
        setProfil(r.data);
        setForm({
          username: r.data.username || "",
          email: r.data.email || "",
          allergies: r.data.allergies || "",
          historique: r.data.historique || "",
        });
      })
      .catch(() => {});
    Promise.all([
      api.get("rendezvous/"),
      api.get("consultations/"),
      api.get("ordonnances/"),
    ])
      .then(([r, c, o]) =>
        setStats({
          rendezvous: r.data.length,
          consultations: c.data.length,
          ordonnances: o.data.length,
        }),
      )
      .catch(() => {});
  }, [token, isLoading, router]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("users/me/", form);
      if (profil) setProfil({ ...profil, ...form });
      setEdit(false);
      showToast("Profil mis à jour avec succès ✓");
    } catch {
      showToast("Erreur lors de la sauvegarde", false);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profil)
      setForm({
        username: profil.username || "",
        email: profil.email || "",
        allergies: profil.allergies || "",
        historique: profil.historique || "",
      });
    setEdit(false);
  };

  if (isLoading || !profil) return null;

  const initials = profil.username?.slice(0, 2).toUpperCase() || "PT";

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateY(-10px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes spin    { to{transform:rotate(360deg)} }

        .root { min-height:100vh; background:#EFF6FF ; background-image:radial-gradient(at 5% 5%,rgba(139,92,246,.08) 0,transparent 50%),radial-gradient(at 95% 95%,rgba(16,185,129,.07) 0,transparent 50%); font-family:'Instrument Sans',sans-serif; display:flex; }
        .main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }

        .toast { position:fixed; top:24px; right:28px; z-index:999; padding:13px 20px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:9px; animation:toastIn .3s ease; box-shadow:0 8px 24px rgba(0,0,0,.12); }
        .toast.ok  { background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; }
        .toast.err { background:#FEF2F2; color:#991B1B; border:1px solid #FCA5A5; }

        .layout { display:grid; grid-template-columns:320px 1fr; gap:22px; align-items:start; animation:fadeUp .45s ease; }

        /* ── ID card ── */
        .id-card { background:#fff; border-radius:24px; border:1px solid #EAE8F5; overflow:hidden; box-shadow:0 4px 20px rgba(83,74,183,.06); }
        .id-banner { height:100px; background:linear-gradient(135deg,#378ADD 0%,#10B981 100%); position:relative; overflow:hidden; }
        .id-banner::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.07'%3E%3Ccircle cx='20' cy='20' r='15'/%3E%3C/g%3E%3C/svg%3E"); }
        .id-banner::after { content:'👤'; position:absolute; right:18px; top:50%; transform:translateY(-50%); font-size:44px; opacity:.15; }
        .id-body { padding:0 22px 26px; }

        .avatar-wrap { position:relative; display:inline-block; margin-top:-34px; margin-bottom:14px; }
        .avatar { width:68px; height:68px; border-radius:20px; background:linear-gradient(135deg,#378ADD,#10B981); display:flex; align-items:center; justify-content:center; font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:#fff; border:3px solid #fff; box-shadow:0 4px 16px rgba(139,92,246,.3); letter-spacing:-1px; }
        .online-dot { position:absolute; bottom:4px; right:4px; width:13px; height:13px; border-radius:50%; background:#10B981; border:2.5px solid #fff; animation:pulse 2s ease infinite; }

        .id-name { font-family:'Bricolage Grotesque',sans-serif; font-size:19px; font-weight:700; color:#0F172A; }
        .id-tag  { display:inline-flex; align-items:center; gap:5px; margin-top:6px; padding:4px 11px; background:rgba(139,92,246,.1); border:1px solid rgba(139,92,246,.18); border-radius:20px; font-size:11.5px; font-weight:600; color:#7C3AED; }

        .id-info { display:flex; flex-direction:column; gap:10px; margin-top:18px; padding-top:18px; border-top:1px solid #F1F5F9; }
        .id-row  { display:flex; align-items:center; gap:10px; font-size:13px; color:#64748B; }
        .id-icon { width:28px; height:28px; border-radius:8px; background:#F8FAFC; border:1px solid #F1F5F9; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
        .id-val  { font-weight:600; color:#1E293B; font-size:13px; word-break:break-all; }

        .btn-logout { width:100%; margin-top:18px; padding:10px; background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; border-radius:12px; font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:7px; }
        .btn-logout:hover { background:#FEE2E2; transform:translateY(-1px); }

        /* ── Right panels ── */
        .right { display:flex; flex-direction:column; gap:20px; }
        .panel { background:#fff; border-radius:22px; border:1px solid #EAE8F5; overflow:hidden; box-shadow:0 2px 12px rgba(83,74,183,.05); animation:fadeUp .5s ease backwards; }
        .panel-head { display:flex; align-items:center; justify-content:space-between; padding:18px 22px 16px; border-bottom:1px solid #F1F5F9; }
        .panel-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#0F172A; display:flex; align-items:center; gap:9px; }
        .panel-icon  { width:30px; height:30px; border-radius:9px; background:rgba(139,92,246,.1); display:flex; align-items:center; justify-content:center; font-size:14px; }
        .panel-body  { padding:20px 22px; }

        .fields-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .field-wrap  { display:flex; flex-direction:column; gap:5px; }
        .field-wrap.full { grid-column:1/-1; }
        .field-label { font-size:11px; font-weight:700; color:#94A3B8; text-transform:uppercase; letter-spacing:.7px; }

        .field-val  { font-size:14px; font-weight:600; color:#1E293B; padding:10px 13px; background:#F8FAFC; border-radius:10px; border:1px solid #F1F5F9; min-height:42px; display:flex; align-items:flex-start; white-space:pre-wrap; line-height:1.5; }
        .field-empty { color:#CBD5E1; font-style:italic; font-weight:400; font-size:13px; }

        .field-input    { width:100%; padding:10px 13px; font-family:'Instrument Sans',sans-serif; font-size:14px; font-weight:500; color:#1E293B; background:#FAFAFE; border:1.5px solid #E5E2F5; border-radius:10px; outline:none; transition:all .2s; }
        .field-input:focus { border-color:#378ADD; background:#fff; box-shadow:0 0 0 3px rgba(139,92,246,.1); }
        .field-input::placeholder { color:#C4C0D8; }
        .field-textarea { resize:vertical; line-height:1.6; min-height:90px; }

        .actions { display:flex; gap:10px; padding:14px 22px; background:#FAFAFE; border-top:1px solid #F1F5F9; }
        .btn-edit   { flex:1; padding:10px; background:rgba(139,92,246,.08); color:#7C3AED; border:1.5px solid rgba(139,92,246,.2); border-radius:12px; font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:7px; }
        .btn-edit:hover { background:rgba(139,92,246,.13); transform:translateY(-1px); }
        .btn-save   { flex:2; padding:10px; background:linear-gradient(135deg,#378ADD,#10B981); color:#fff; border:none; border-radius:12px; font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(139,92,246,.28); transition:all .2s; display:flex; align-items:center; justify-content:center; gap:7px; }
        .btn-save:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(139,92,246,.38); }
        .btn-save:disabled { opacity:.6; cursor:not-allowed; }
        .btn-cancel { flex:1; padding:10px; background:#fff; color:#64748B; border:1.5px solid #E2E8F0; border-radius:12px; font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; }
        .btn-cancel:hover { background:#F8FAFC; }

        .spinner { width:13px; height:13px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }

        .sec-row  { display:flex; align-items:center; justify-content:space-between; padding:13px 0; border-bottom:1px solid #F8FAFC; }
        .sec-row:last-child { border-bottom:none; }
        .sec-lbl  { font-size:13px; font-weight:600; color:#1E293B; }
        .sec-desc { font-size:11px; color:#94A3B8; margin-top:2px; }
        .badge-green { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; background:#ECFDF5; color:#065F46; }
        .badge-gray  { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; background:#F1F5F9; color:#64748B; }
      `}</style>

      {toast && (
        <div className={`toast ${toast.ok ? "ok" : "err"}`}>
          {toast.ok ? "✓" : "⚠️"} {toast.msg}
        </div>
      )}

      <div className="root">
        <Sidebar stats={stats} />
        <Navbar title="Mon Profil" subtitle="Espace patient" />

        <main className="main">
          <div className="layout">
            {/* ── Carte identité ── */}
            <div className="id-card">
              <div className="id-banner" />
              <div className="id-body">
                <div className="avatar-wrap">
                  <div className="avatar">{initials}</div>
                  <div className="online-dot" />
                </div>
                <div className="id-name">{profil.username}</div>
                <div>
                  <span className="id-tag">🩺 Patient</span>
                </div>

                <div className="id-info">
                  <div className="id-row">
                    <div className="id-icon">📧</div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94A3B8",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: ".5px",
                        }}
                      >
                        Email
                      </div>
                      <div className="id-val">{profil.email || "—"}</div>
                    </div>
                  </div>
                  <div className="id-row">
                    <div className="id-icon">⚠️</div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#94A3B8",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: ".5px",
                        }}
                      >
                        Allergies
                      </div>
                      <div
                        className="id-val"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {profil.allergies || "Aucune renseignée"}
                      </div>
                    </div>
                  </div>
                  <div className="id-row">
                    <div className="id-icon">📊</div>
                    <div style={{ display: "flex", gap: 14 }}>
                      {[
                        { v: stats.rendezvous, l: "RDV" },
                        { v: stats.consultations, l: "Consult." },
                        { v: stats.ordonnances, l: "Ordonn." },
                      ].map((s) => (
                        <div key={s.l} style={{ textAlign: "center" }}>
                          <div
                            style={{
                              fontFamily: "'Bricolage Grotesque',sans-serif",
                              fontSize: 18,
                              fontWeight: 800,
                              color: "#7C3AED",
                            }}
                          >
                            {s.v}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#94A3B8",
                              fontWeight: 600,
                            }}
                          >
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  className="btn-logout"
                  onClick={() => {
                    logout?.();
                    router.push("/login");
                  }}
                >
                  ⎋ Déconnexion
                </button>
              </div>
            </div>

            {/* ── Colonne droite ── */}
            <div className="right">
              {/* Infos personnelles */}
              <div className="panel" style={{ animationDelay: ".05s" }}>
                <div className="panel-head">
                  <div className="panel-title">
                    <div className="panel-icon">👤</div>
                    Informations personnelles
                  </div>
                </div>
                <div className="panel-body">
                  <div className="fields-grid">
                    <div className="field-wrap">
                      <div className="field-label">Nom d'utilisateur</div>
                      {edit ? (
                        <input
                          className="field-input"
                          type="text"
                          value={form.username}
                          placeholder="Nom d'utilisateur"
                          onChange={(e) =>
                            setForm((p) => ({ ...p, username: e.target.value }))
                          }
                        />
                      ) : (
                        <div className="field-val">
                          {profil.username || (
                            <span className="field-empty">Non renseigné</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="field-wrap">
                      <div className="field-label">Email</div>
                      {edit ? (
                        <input
                          className="field-input"
                          type="email"
                          value={form.email}
                          placeholder="Email"
                          onChange={(e) =>
                            setForm((p) => ({ ...p, email: e.target.value }))
                          }
                        />
                      ) : (
                        <div className="field-val">
                          {profil.email || (
                            <span className="field-empty">Non renseigné</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="field-wrap full">
                      <div className="field-label">Allergies</div>
                      {edit ? (
                        <textarea
                          className="field-input field-textarea"
                          value={form.allergies}
                          placeholder="Décrivez vos allergies connues…"
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              allergies: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <div className="field-val" style={{ minHeight: 60 }}>
                          {profil.allergies || (
                            <span className="field-empty">
                              Aucune allergie renseignée
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="field-wrap full">
                      <div className="field-label">Historique médical</div>
                      {edit ? (
                        <textarea
                          className="field-input field-textarea"
                          style={{ minHeight: 110 }}
                          value={form.historique}
                          placeholder="Antécédents médicaux, chirurgies, traitements…"
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              historique: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        <div className="field-val" style={{ minHeight: 80 }}>
                          {profil.historique || (
                            <span className="field-empty">
                              Aucun historique renseigné
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="actions">
                  {edit ? (
                    <>
                      <button className="btn-cancel" onClick={cancelEdit}>
                        Annuler
                      </button>
                      <button
                        className="btn-save"
                        onClick={save}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="spinner" /> Sauvegarde…
                          </>
                        ) : (
                          <>💾 Sauvegarder les modifications</>
                        )}
                      </button>
                    </>
                  ) : (
                    <button className="btn-edit" onClick={() => setEdit(true)}>
                      ✏️ Modifier les informations
                    </button>
                  )}
                </div>
              </div>

              {/* Sécurité */}
              <div className="panel" style={{ animationDelay: ".1s" }}>
                <div className="panel-head">
                  <div className="panel-title">
                    <div className="panel-icon">🔐</div>
                    Sécurité du compte
                  </div>
                </div>
                <div className="panel-body">
                  <div className="sec-row">
                    <div>
                      <div className="sec-lbl">🔑 Mot de passe</div>
                      <div className="sec-desc">
                        Protège l'accès à votre espace santé
                      </div>
                    </div>
                    <span className="badge-gray">••••••••</span>
                  </div>
                  <div className="sec-row">
                    <div>
                      <div className="sec-lbl">✉️ Email vérifié</div>
                      <div className="sec-desc">
                        {profil.email || "Aucun email configuré"}
                      </div>
                    </div>
                    <span className="badge-green">Actif</span>
                  </div>
                  <div className="sec-row">
                    <div>
                      <div className="sec-lbl">🛡️ Session sécurisée</div>
                      <div className="sec-desc">
                        Authentification JWT · Expiration 24h
                      </div>
                    </div>
                    <span className="badge-green">Activée</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}
