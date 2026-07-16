"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import api from "../../../../lib/api";

interface Profil {
  id: number;
  username: string;
  email: string;
  role: string;
}
interface FormData {
  username: string;
  email: string;
}

const C = {
  bg: "#0F0A1E",
  bgGrad: "linear-gradient(135deg, #0F0A1E 0%, #0F1F18 100%)",
  surface: "rgba(30, 30, 46, 0.6)",
  surfaceSolid: "#181426",
  surfaceAlt: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#F1F5F9",
  textSub: "#CBD5E1",
  textMuted: "#94A3B8",
  teal: "#34D399",
  tealLight: "rgba(52,211,153,0.14)",
  tealDark: "#10B981",
  violet: "#A78BFA",
  violetLight: "rgba(167,139,250,0.14)",
  sky: "#60A5FA",
  skyLight: "rgba(96,165,250,0.14)",
  amber: "#FBBF24",
  amberLight: "rgba(251,191,36,0.14)",
  red: "#F87171",
  redLight: "rgba(248,113,113,0.14)",
  green: "#34D399",
  greenLight: "rgba(52,211,153,0.14)",
  grad: "linear-gradient(135deg, #8B5CF6 0%, #10B981 100%)",
};

export default function AdminProfil() {
  const { token, isLoading, logout } = useAuth();
  const router = useRouter();

  const [profil, setProfil] = useState<Profil | null>(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<FormData>({ username: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    api.get("users/me/").then((r) => {
      setProfil(r.data);
      setForm({ username: r.data.username || "", email: r.data.email || "" });
    });
  }, [token, isLoading]);

  if (isLoading || !profil) return null;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`users/${profil.id}/`, form);
      setProfil({ ...profil, ...form });
      setEdit(false);
      showToast("Profil mis à jour ✓");
    } catch {
      showToast("Erreur lors de la sauvegarde", false);
    } finally {
      setSaving(false);
    }
  };

  const initials = profil.username?.slice(0, 2).toUpperCase() || "AD";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateY(-10px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes spin    { to{transform:rotate(360deg)} }

        .toast { position:fixed; top:24px; right:28px; z-index:999; padding:13px 20px; border-radius:14px; font-size:13px; font-weight:600; display:flex; align-items:center; gap:9px; animation:toastIn .3s ease; backdrop-filter: blur(14px); box-shadow:0 8px 24px rgba(0,0,0,0.35); }
        .toast.ok  { background:${C.greenLight}; color:${C.green}; border:1px solid rgba(52,211,153,0.3); }
        .toast.err { background:${C.redLight}; color:${C.red}; border:1px solid rgba(248,113,113,0.3); }

        .layout { display:grid; grid-template-columns:300px 1fr; gap:20px; align-items:start; }

        .ap-root {
          display: flex;
          min-height: 100vh;
          background: ${C.bgGrad};
          font-family: 'Inter', sans-serif;
          color: ${C.text};
        }
        .ap-main {
          margin-left: 0;
          flex: 1;
          padding: calc(66px + 1.4rem) 1.4rem 3rem;
          overflow-x: hidden;
          box-sizing: border-box;
        }
        @media (min-width: 1024px) {
          .ap-main { margin-left: 260px; padding: 5rem 2.4rem 3rem; }
        }

        .panel {
          background: ${C.surface};
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid ${C.border};
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          overflow: hidden;
          animation: fadeUp 0.45s ease both;
        }

        /* ── Identity card ── */
        .id-banner { height:100px; background:linear-gradient(135deg, ${C.teal} 0%, ${C.violet} 100%); position:relative; overflow:hidden; }
        .id-banner::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.12'%3E%3Ccircle cx='20' cy='20' r='15'/%3E%3C/g%3E%3C/svg%3E"); }
        .id-banner::after { content:'⚙️'; position:absolute; right:18px; top:50%; transform:translateY(-50%); font-size:44px; opacity:.22; }
        .id-body { padding:0 22px 26px; }

        .avatar-wrap { position:relative; display:inline-block; margin-top:-34px; margin-bottom:14px; }
        .avatar {
          width:68px; height:68px; border-radius:18px;
          background: linear-gradient(135deg, ${C.violet}, ${C.tealDark});
          display:flex; align-items:center; justify-content:center;
          font-family:'Syne',sans-serif; font-size:24px; font-weight:800; color:#fff;
          border:3px solid ${C.surfaceSolid}; box-shadow:0 6px 18px rgba(167,139,250,.35); letter-spacing:-1px;
        }
        .online-dot { position:absolute; bottom:4px; right:4px; width:13px; height:13px; border-radius:50%; background:${C.teal}; border:2.5px solid ${C.surfaceSolid}; animation:pulse 2s ease infinite; }

        .id-name { font-family:'Syne',sans-serif; font-size:19px; font-weight:800; color:${C.text}; }
        .id-tag  { display:inline-flex; align-items:center; gap:5px; margin-top:6px; padding:4px 11px; background:${C.violetLight}; border:1px solid rgba(167,139,250,0.3); border-radius:20px; font-size:11.5px; font-weight:600; color:${C.violet}; }

        .id-info { display:flex; flex-direction:column; gap:10px; margin-top:18px; padding-top:18px; border-top:1px solid ${C.border}; }
        .id-row  { display:flex; align-items:center; gap:10px; font-size:13px; color:${C.textMuted}; }
        .id-icon { width:28px; height:28px; border-radius:8px; background:${C.surfaceAlt}; border:1px solid ${C.border}; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
        .id-val  { font-weight:600; color:${C.textSub}; font-size:13px; word-break:break-all; }
        .id-key-lbl { font-size:10px; color:${C.textMuted}; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }

        .divider { height:1px; background:${C.border}; margin:16px 0; }

        .stat-row { display:flex; gap:12px; }
        .stat-item { flex:1; text-align:center; padding:10px; background:${C.surfaceAlt}; border-radius:12px; border:1px solid ${C.border}; }
        .stat-num  { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:${C.violet}; }
        .stat-lbl  { font-size:10px; color:${C.textMuted}; margin-top:2px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }

        .btn-logout {
          width:100%; margin-top:18px; padding:10px;
          background:${C.redLight}; color:${C.red}; border:1px solid rgba(248,113,113,0.3); border-radius:12px;
          font-family:'Inter',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s ease;
          display:flex; align-items:center; justify-content:center; gap:7px;
        }
        .btn-logout:hover { transform:translateY(-1px); background: rgba(248,113,113,0.22); }

        /* ── Right panels ── */
        .right { display:flex; flex-direction:column; gap:16px; }

        .panel-head { display:flex; align-items:center; justify-content:space-between; padding:18px 22px 16px; border-bottom:1px solid ${C.border}; }
        .panel-title { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:${C.text}; letter-spacing:0.02em; text-transform:uppercase; display:flex; align-items:center; gap:9px; }
        .panel-icon  { width:30px; height:30px; border-radius:9px; background:${C.violetLight}; display:flex; align-items:center; justify-content:center; font-size:14px; }
        .panel-badge { font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; background:${C.grad}; color:#fff; }
        .panel-body  { padding:20px 22px; }

        .fields-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .field-wrap  { display:flex; flex-direction:column; gap:5px; }
        .field-label { font-size:10px; font-weight:700; color:${C.textMuted}; text-transform:uppercase; letter-spacing:.7px; }

        .field-val   { font-size:14px; font-weight:600; color:${C.textSub}; padding:10px 13px; background:${C.surfaceAlt}; border-radius:10px; border:1px solid ${C.border}; min-height:42px; display:flex; align-items:center; }
        .field-empty { color:${C.textMuted}; font-style:italic; font-weight:400; font-size:13px; }

        .field-input { width:100%; padding:10px 13px; font-family:'Inter',sans-serif; font-size:14px; font-weight:500; color:${C.text}; background:${C.surfaceAlt}; border:1px solid ${C.border}; border-radius:10px; outline:none; transition:all .2s ease; }
        .field-input:focus { border-color:${C.violet}; box-shadow:0 0 0 3px rgba(167,139,250,0.16); }
        .field-input::placeholder { color:${C.textMuted}; }

        .actions { display:flex; gap:10px; padding:14px 22px; background:${C.surfaceAlt}; border-top:1px solid ${C.border}; }
        .btn-edit   { flex:1; padding:10px; background:${C.violetLight}; color:${C.violet}; border:1px solid rgba(167,139,250,0.3); border-radius:12px; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s ease; display:flex; align-items:center; justify-content:center; gap:7px; }
        .btn-edit:hover { transform:translateY(-1px); background: rgba(167,139,250,0.22); }
        .btn-save   { flex:2; padding:10px; background:${C.grad}; color:#fff; border:none; border-radius:12px; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px -2px rgba(139,92,246,0.45); transition:all .2s ease; display:flex; align-items:center; justify-content:center; gap:7px; }
        .btn-save:hover:not(:disabled) { transform:translateY(-1px); }
        .btn-save:disabled { opacity:.5; cursor:not-allowed; }
        .btn-cancel { flex:1; padding:10px; background:${C.surfaceAlt}; color:${C.textSub}; border:1px solid ${C.border}; border-radius:12px; font-family:'Inter',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s ease; }
        .btn-cancel:hover { border-color:${C.borderStrong}; color:${C.text}; }

        .spinner { width:13px; height:13px; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }

        .sec-row  { display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid ${C.border}; }
        .sec-row:last-child { border-bottom:none; }
        .sec-lbl  { font-size:13px; font-weight:600; color:${C.text}; }
        .sec-desc { font-size:11px; color:${C.textMuted}; margin-top:2px; }
        .badge-ok    { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; background:${C.greenLight}; color:${C.green}; border:1px solid rgba(52,211,153,0.3); }
        .badge-muted { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; background:${C.surfaceAlt}; color:${C.textMuted}; border:1px solid ${C.border}; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.25); border-radius: 4px; }
      `}</style>

      {toast && (
        <div className={`toast ${toast.ok ? "ok" : "err"}`}>
          {toast.ok ? "✓" : "⚠️"} {toast.msg}
        </div>
      )}

      <div className="ap-root">
        <Sidebar />
        <main className="ap-main">
          <Navbar
            title="Mon Profil"
            subtitle={`Bonjour ${profil.username || "Admin"} 👋`}
          />

          {/* Header */}
          <div
            style={{
              marginBottom: "1.6rem",
              animation: "fadeUp 0.35s ease both",
            }}
          >
            <h1
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 28,
                fontWeight: 800,
                color: C.text,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Mon Profil
            </h1>
            <p
              style={{
                color: C.textMuted,
                fontSize: 13,
                marginTop: 4,
                marginBottom: 0,
              }}
            >
              Gérez vos informations de compte et vos paramètres de sécurité
            </p>
          </div>

          <div className="layout">
            {/* ── Carte identité ── */}
            <div className="panel" style={{ animationDelay: "0.05s" }}>
              <div className="id-banner" />
              <div className="id-body">
                <div className="avatar-wrap">
                  <div className="avatar">{initials}</div>
                  <div className="online-dot" />
                </div>
                <div className="id-name">{profil.username}</div>
                <div>
                  <span className="id-tag">⚙️ Administrateur</span>
                </div>

                <div className="id-info">
                  <div className="id-row">
                    <div className="id-icon">📧</div>
                    <div>
                      <div className="id-key-lbl">Email</div>
                      <div className="id-val">{profil.email || "—"}</div>
                    </div>
                  </div>
                  <div className="id-row">
                    <div className="id-icon">🔑</div>
                    <div>
                      <div className="id-key-lbl">Rôle système</div>
                      <div
                        className="id-val"
                        style={{ textTransform: "capitalize" }}
                      >
                        {profil.role}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                <div className="stat-row">
                  {[
                    { n: "∞", l: "Accès" },
                    { n: "24/7", l: "Dispo" },
                    { n: "JWT", l: "Auth" },
                  ].map((s) => (
                    <div key={s.l} className="stat-item">
                      <div className="stat-num">{s.n}</div>
                      <div className="stat-lbl">{s.l}</div>
                    </div>
                  ))}
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
              {/* Infos compte */}
              <div className="panel" style={{ animationDelay: "0.12s" }}>
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
                            <span className="field-empty">—</span>
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
                            <span className="field-empty">—</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="field-wrap">
                      <div className="field-label">Rôle</div>
                      <div
                        className="field-val"
                        style={{ textTransform: "capitalize" }}
                      >
                        {profil.role}
                      </div>
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
                      <button
                        className="btn-cancel"
                        onClick={() => setEdit(false)}
                      >
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
                          <>💾 Sauvegarder</>
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
              <div className="panel" style={{ animationDelay: "0.19s" }}>
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
                      <div className="sec-desc">
                        Accès privilégié à l'ensemble du système
                      </div>
                    </div>
                    <span className="badge-muted">••••••••</span>
                  </div>
                  <div className="sec-row">
                    <div>
                      <div className="sec-lbl">✉️ Email vérifié</div>
                      <div className="sec-desc">
                        {profil.email || "Non configuré"}
                      </div>
                    </div>
                    <span className="badge-ok">Actif</span>
                  </div>
                  <div className="sec-row">
                    <div>
                      <div className="sec-lbl">🔐 Authentification JWT</div>
                      <div className="sec-desc">
                        Token sécurisé · Expiration 24h
                      </div>
                    </div>
                    <span className="badge-ok">Activée</span>
                  </div>
                  <div className="sec-row">
                    <div>
                      <div className="sec-lbl">🌐 Accès CORS</div>
                      <div className="sec-desc">
                        localhost:3000 · 127.0.0.1:3000
                      </div>
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
