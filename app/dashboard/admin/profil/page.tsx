"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import api from "../../../../lib/api";

interface Profil { id: number; username: string; email: string; role: string; }
interface FormData { username: string; email: string; }

export default function AdminProfil() {
  const { token, isLoading, logout } = useAuth();
  const router = useRouter();

  const [profil, setProfil]  = useState<Profil | null>(null);
  const [edit, setEdit]      = useState(false);
  const [form, setForm]      = useState<FormData>({ username: "", email: "" });
  const [saving, setSaving]  = useState(false);
  const [toast, setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    api.get("users/me/").then((r) => {
      setProfil(r.data);
      setForm({ username: r.data.username || "", email: r.data.email || "" });
    });
  }, [token, isLoading]);

  if (isLoading || !profil) return null;

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`users/${profil.id}/`, form);
      setProfil({ ...profil, ...form });
      setEdit(false);
      showToast("Profil mis à jour ✓");
    } catch { showToast("Erreur lors de la sauvegarde", false); }
    finally { setSaving(false); }
  };

  const initials = profil.username?.slice(0, 2).toUpperCase() || "AD";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateY(-10px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes glow    { 0%,100%{box-shadow:0 0 12px rgba(167,139,250,.3)} 50%{box-shadow:0 0 24px rgba(167,139,250,.6)} }

        .root { min-height:100vh; background:linear-gradient(160deg,#0a1120 0%,#0d1827 60%,#0f1e10 100%); font-family:'Instrument Sans',sans-serif; display:flex; }
        .main { margin-left:260px; flex:1; padding:2rem 2.5rem; padding-top:calc(70px + 2.5rem); }

        .toast { position:fixed; top:24px; right:28px; z-index:999; padding:13px 20px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:9px; animation:toastIn .3s ease; box-shadow:0 8px 24px rgba(0,0,0,.4); }
        .toast.ok  { background:rgba(34,211,165,.12); color:#34D399; border:1px solid rgba(34,211,165,.25); }
        .toast.err { background:rgba(248,113,113,.1); color:#F87171; border:1px solid rgba(248,113,113,.25); }

        .layout { display:grid; grid-template-columns:300px 1fr; gap:22px; align-items:start; animation:fadeUp .45s ease; }

        /* ── ID card dark ── */
        .id-card { background:linear-gradient(160deg,#131f2e,#0d1827); border-radius:24px; border:1px solid #1e3050; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,.4); }
        .id-banner { height:100px; background:linear-gradient(135deg,#4C1D95 0%,#7C3AED 50%,#1D4ED8 100%); position:relative; overflow:hidden; }
        .id-banner::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='20' cy='20' r='15'/%3E%3C/g%3E%3C/svg%3E"); }
        .id-banner::after { content:'⚙️'; position:absolute; right:18px; top:50%; transform:translateY(-50%); font-size:44px; opacity:.18; }
        .id-body { padding:0 22px 26px; }

        .avatar-wrap { position:relative; display:inline-block; margin-top:-34px; margin-bottom:14px; }
        .avatar { width:68px; height:68px; border-radius:20px; background:linear-gradient(135deg,#7C3AED,#4C1D95); display:flex; align-items:center; justify-content:center; font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:#fff; border:3px solid #131f2e; box-shadow:0 0 20px rgba(124,58,237,.5); letter-spacing:-1px; animation:glow 3s ease infinite; }
        .online-dot { position:absolute; bottom:4px; right:4px; width:13px; height:13px; border-radius:50%; background:#22D3EE; border:2.5px solid #131f2e; animation:pulse 2s ease infinite; }

        .id-name { font-family:'Bricolage Grotesque',sans-serif; font-size:19px; font-weight:700; color:#F0F4FF; }
        .id-tag  { display:inline-flex; align-items:center; gap:5px; margin-top:6px; padding:4px 11px; background:rgba(167,139,250,.12); border:1px solid rgba(167,139,250,.25); border-radius:20px; font-size:11.5px; font-weight:600; color:#A78BFA; }

        .id-info { display:flex; flex-direction:column; gap:10px; margin-top:18px; padding-top:18px; border-top:1px solid #1e3050; }
        .id-row  { display:flex; align-items:center; gap:10px; font-size:13px; color:#4a6080; }
        .id-icon { width:28px; height:28px; border-radius:8px; background:#1a2a3f; border:1px solid #1e3050; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
        .id-val  { font-weight:600; color:#8BA0C0; font-size:13px; word-break:break-all; }

        .divider { height:1px; background:linear-gradient(90deg,transparent,#1e3050,transparent); margin:16px 0; }

        .stat-row { display:flex; gap:16px; }
        .stat-item { flex:1; text-align:center; padding:10px; background:#0d1827; border-radius:12px; border:1px solid #1e3050; }
        .stat-num  { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; background:linear-gradient(135deg,#A78BFA,#22D3EE); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .stat-lbl  { font-size:10px; color:#4a6080; margin-top:2px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }

        .btn-logout { width:100%; margin-top:18px; padding:10px; background:rgba(248,113,113,.08); color:#F87171; border:1px solid rgba(248,113,113,.2); border-radius:12px; font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:7px; }
        .btn-logout:hover { background:rgba(248,113,113,.14); transform:translateY(-1px); }

        /* ── Right panels ── */
        .right { display:flex; flex-direction:column; gap:20px; }

        .panel { background:linear-gradient(160deg,#131f2e,#0d1827); border-radius:22px; border:1px solid #1e3050; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.3); animation:fadeUp .5s ease backwards; }
        .panel-head { display:flex; align-items:center; justify-content:space-between; padding:18px 22px 16px; border-bottom:1px solid #1e3050; }
        .panel-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; color:#F0F4FF; display:flex; align-items:center; gap:9px; }
        .panel-icon  { width:30px; height:30px; border-radius:9px; background:rgba(167,139,250,.12); display:flex; align-items:center; justify-content:center; font-size:14px; }
        .panel-badge { font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; background:linear-gradient(135deg,#7C3AED,#4C1D95); color:#fff; }
        .panel-body  { padding:20px 22px; }

        .fields-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .field-wrap  { display:flex; flex-direction:column; gap:5px; }
        .field-label { font-size:11px; font-weight:700; color:#2a4060; text-transform:uppercase; letter-spacing:.7px; }

        .field-val   { font-size:14px; font-weight:600; color:#8BA0C0; padding:10px 13px; background:#0d1827; border-radius:10px; border:1px solid #1e3050; min-height:42px; display:flex; align-items:center; }
        .field-empty { color:#2a4060; font-style:italic; font-weight:400; font-size:13px; }

        .field-input { width:100%; padding:10px 13px; font-family:'Instrument Sans',sans-serif; font-size:14px; font-weight:500; color:#C8D8F0; background:#0a1120; border:1.5px solid #1e3050; border-radius:10px; outline:none; transition:all .2s; }
        .field-input:focus { border-color:#7C3AED; background:#0d1520; box-shadow:0 0 0 3px rgba(124,58,237,.15); }
        .field-input::placeholder { color:#2a4060; }

        .actions { display:flex; gap:10px; padding:14px 22px; background:rgba(0,0,0,.2); border-top:1px solid #1e3050; }
        .btn-edit   { flex:1; padding:10px; background:rgba(167,139,250,.08); color:#A78BFA; border:1.5px solid rgba(167,139,250,.2); border-radius:12px; font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; display:flex; align-items:center; justify-content:center; gap:7px; }
        .btn-edit:hover { background:rgba(167,139,250,.14); transform:translateY(-1px); }
        .btn-save   { flex:2; padding:10px; background:linear-gradient(135deg,#7C3AED,#4C1D95); color:#fff; border:none; border-radius:12px; font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(124,58,237,.4); transition:all .2s; display:flex; align-items:center; justify-content:center; gap:7px; }
        .btn-save:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(124,58,237,.5); }
        .btn-save:disabled { opacity:.5; cursor:not-allowed; }
        .btn-cancel { flex:1; padding:10px; background:rgba(255,255,255,.04); color:#4a6080; border:1.5px solid #1e3050; border-radius:12px; font-family:'Instrument Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; }
        .btn-cancel:hover { background:rgba(255,255,255,.07); color:#8BA0C0; }

        .spinner { width:13px; height:13px; border:2px solid rgba(255,255,255,.25); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }

        .sec-row  { display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid #0d1827; }
        .sec-row:last-child { border-bottom:none; }
        .sec-lbl  { font-size:13px; font-weight:600; color:#8BA0C0; }
        .sec-desc { font-size:11px; color:#2a4060; margin-top:2px; }
        .badge-ok   { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; background:rgba(34,211,165,.1); color:#34D399; border:1px solid rgba(34,211,165,.2); }
        .badge-muted{ font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; background:rgba(255,255,255,.05); color:#4a6080; }
      `}</style>

      {toast && <div className={`toast ${toast.ok ? "ok" : "err"}`}>{toast.ok ? "✓" : "⚠️"} {toast.msg}</div>}

      <div className="root">
        <Sidebar />
        <Navbar title="Mon Profil" subtitle="Administration" />

        <main className="main">
          <div className="layout">

            {/* ── Carte identité dark ── */}
            <div className="id-card">
              <div className="id-banner" />
              <div className="id-body">
                <div className="avatar-wrap">
                  <div className="avatar">{initials}</div>
                  <div className="online-dot" />
                </div>
                <div className="id-name">{profil.username}</div>
                <div><span className="id-tag">⚙️ Administrateur</span></div>

                <div className="id-info">
                  <div className="id-row">
                    <div className="id-icon">📧</div>
                    <div>
                      <div style={{ fontSize: 10, color: "#2a4060", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Email</div>
                      <div className="id-val">{profil.email || "—"}</div>
                    </div>
                  </div>
                  <div className="id-row">
                    <div className="id-icon">🔑</div>
                    <div>
                      <div style={{ fontSize: 10, color: "#2a4060", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Rôle système</div>
                      <div className="id-val" style={{ textTransform: "capitalize" }}>{profil.role}</div>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                <div className="stat-row">
                  {[{ n: "∞", l: "Accès" }, { n: "24/7", l: "Dispo" }, { n: "JWT", l: "Auth" }].map(s => (
                    <div key={s.l} className="stat-item">
                      <div className="stat-num">{s.n}</div>
                      <div className="stat-lbl">{s.l}</div>
                    </div>
                  ))}
                </div>

                <button className="btn-logout" onClick={() => { logout?.(); router.push("/login"); }}>
                  ⎋ Déconnexion
                </button>
              </div>
            </div>

            {/* ── Colonne droite ── */}
            <div className="right">

              {/* Infos compte */}
              <div className="panel" style={{ animationDelay: ".05s" }}>
                <div className="panel-head">
                  <div className="panel-title">
                    <div className="panel-icon">⚙️</div>
                    Informations du compte
                  </div>
                  <span className="panel-badge">Admin</span>
                </div>
                <div className="panel-body">
                  <div className="fields-grid">
                    <div className="field-wrap">
                      <div className="field-label">Nom d'utilisateur</div>
                      {edit
                        ? <input className="field-input" type="text" value={form.username} placeholder="Nom d'utilisateur" onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
                        : <div className="field-val">{profil.username || <span className="field-empty">—</span>}</div>}
                    </div>
                    <div className="field-wrap">
                      <div className="field-label">Email</div>
                      {edit
                        ? <input className="field-input" type="email" value={form.email} placeholder="Email" onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                        : <div className="field-val">{profil.email || <span className="field-empty">—</span>}</div>}
                    </div>
                    <div className="field-wrap">
                      <div className="field-label">Rôle</div>
                      <div className="field-val" style={{ textTransform: "capitalize" }}>{profil.role}</div>
                    </div>
                    <div className="field-wrap">
                      <div className="field-label">ID Système</div>
                      <div className="field-val">#{profil.id}</div>
                    </div>
                  </div>
                </div>
                <div className="actions">
                  {edit ? (
                    <>
                      <button className="btn-cancel" onClick={() => setEdit(false)}>Annuler</button>
                      <button className="btn-save" onClick={save} disabled={saving}>
                        {saving ? <><div className="spinner" /> Sauvegarde…</> : <>💾 Sauvegarder</>}
                      </button>
                    </>
                  ) : (
                    <button className="btn-edit" onClick={() => setEdit(true)}>✏️ Modifier les informations</button>
                  )}
                </div>
              </div>

              {/* Sécurité */}
              <div className="panel" style={{ animationDelay: ".1s" }}>
                <div className="panel-head">
                  <div className="panel-title">
                    <div className="panel-icon">🛡️</div>
                    Sécurité & Accès
                  </div>
                </div>
                <div className="panel-body">
                  <div className="sec-row">
                    <div>
                      <div className="sec-lbl">🔑 Mot de passe admin</div>
                      <div className="sec-desc">Accès privilégié à l'ensemble du système</div>
                    </div>
                    <span className="badge-muted">••••••••</span>
                  </div>
                  <div className="sec-row">
                    <div>
                      <div className="sec-lbl">✉️ Email vérifié</div>
                      <div className="sec-desc">{profil.email || "Non configuré"}</div>
                    </div>
                    <span className="badge-ok">Actif</span>
                  </div>
                  <div className="sec-row">
                    <div>
                      <div className="sec-lbl">🔐 Authentification JWT</div>
                      <div className="sec-desc">Token sécurisé · Expiration 24h</div>
                    </div>
                    <span className="badge-ok">Activée</span>
                  </div>
                  <div className="sec-row">
                    <div>
                      <div className="sec-lbl">🌐 Accès CORS</div>
                      <div className="sec-desc">localhost:3000 · 127.0.0.1:3000</div>
                    </div>
                    <span className="badge-ok">Autorisé</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}