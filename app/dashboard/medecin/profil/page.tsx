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
  specialite: string;
  disponibilites: string;
}

interface FormData {
  username: string;
  email: string;
  specialite: string;
  disponibilites: string;
}

export default function MedecinProfil() {
  const { token, isLoading, logout } = useAuth();
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<FormData>({ username: "", email: "", specialite: "", disponibilites: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [stats] = useState({ rendezvous: 0, consultations: 0, ordonnances: 0 });

  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }
    api.get("users/me/").then((r) => {
      setProfil(r.data);
      setForm({
        username: r.data.username || "",
        email: r.data.email || "",
        specialite: r.data.specialite || "",
        disponibilites: r.data.disponibilites || "",
      });
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
      await api.patch(`medecins/${profil.id}/`, form);
      setProfil({ ...profil, ...form });
      setEdit(false);
      showToast("Profil mis à jour avec succès ✓");
    } catch {
      showToast("Erreur lors de la sauvegarde", false);
    } finally {
      setSaving(false);
    }
  };

  const initials = profil.username?.slice(0, 2).toUpperCase() || "DR";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Instrument+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes slideIn  { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes toastIn  { from { opacity:0; transform:translateY(-12px) scale(.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes pulse    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .profil-root {
          min-height: 100vh;
          background: #F4F2F9;
          font-family: 'Instrument Sans', sans-serif;
          display: flex;
        }

        .profil-main {
          margin-left: 260px;
          flex: 1;
          padding: 2rem 2.5rem;
          padding-top: calc(70px + 2.5rem);
          max-width: calc(100vw - 260px);
        }

        /* ── Toast ── */
        .toast {
          position: fixed;
          top: 24px;
          right: 28px;
          z-index: 999;
          padding: 13px 20px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 9px;
          animation: toastIn .3s ease;
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
        }
        .toast.ok  { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
        .toast.err { background: #FEF2F2; color: #991B1B; border: 1px solid #FCA5A5; }

        /* ── Layout deux colonnes ── */
        .layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          align-items: start;
          animation: fadeUp .45s ease;
        }

        /* ── Carte gauche : identité ── */
        .id-card {
          background: #fff;
          border-radius: 24px;
          border: 1px solid #EAE8F5;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(83,74,183,.06);
        }

        .id-banner {
          height: 110px;
          background: linear-gradient(135deg, #534AB7 0%, #8B5CF6 55%, #10B981 100%);
          position: relative;
          overflow: hidden;
        }

        .id-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .id-banner::after {
          content: '⚕';
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 52px;
          opacity: .12;
        }

        .id-body { padding: 0 24px 28px; }

        .avatar-wrap {
          position: relative;
          display: inline-block;
          margin-top: -36px;
          margin-bottom: 16px;
        }

        .avatar {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          background: linear-gradient(135deg, #534AB7, #8B5CF6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #fff;
          border: 3px solid #fff;
          box-shadow: 0 4px 16px rgba(83,74,183,.3);
          letter-spacing: -1px;
        }

        .online-dot {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #10B981;
          border: 2px solid #fff;
          animation: pulse 2s ease infinite;
        }

        .id-name {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.2;
        }

        .id-role {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 6px;
          padding: 4px 12px;
          background: linear-gradient(135deg, rgba(83,74,183,.1), rgba(139,92,246,.1));
          border: 1px solid rgba(83,74,183,.15);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #534AB7;
        }

        .id-info-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #F1F5F9;
        }

        .id-info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #64748B;
        }

        .id-info-icon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: #F8FAFC;
          border: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .id-info-val {
          font-weight: 600;
          color: #1E293B;
          font-size: 13px;
        }

        .btn-logout {
          width: 100%;
          margin-top: 20px;
          padding: 11px;
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
          border-radius: 13px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .btn-logout:hover {
          background: #FEE2E2;
          border-color: #FCA5A5;
          transform: translateY(-1px);
        }

        /* ── Colonne droite ── */
        .right-col { display: flex; flex-direction: column; gap: 20px; }

        /* ── Section panel ── */
        .panel {
          background: #fff;
          border-radius: 22px;
          border: 1px solid #EAE8F5;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(83,74,183,.05);
          animation: fadeUp .5s ease backwards;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 18px;
          border-bottom: 1px solid #F1F5F9;
        }

        .panel-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .panel-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(83,74,183,.12), rgba(139,92,246,.12));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }

        .panel-body { padding: 22px 24px; }

        /* ── Fields grid ── */
        .fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field-wrap { display: flex; flex-direction: column; gap: 6px; }
        .field-wrap.full { grid-column: 1 / -1; }

        .field-label {
          font-size: 11px;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: .7px;
        }

        .field-value {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
          padding: 10px 14px;
          background: #F8FAFC;
          border-radius: 11px;
          border: 1px solid #F1F5F9;
          min-height: 42px;
          display: flex;
          align-items: center;
        }

        .field-empty { color: #CBD5E1; font-style: italic; font-weight: 400; }

        .field-input {
          width: 100%;
          padding: 10px 14px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #1E293B;
          background: #FAFAFE;
          border: 1.5px solid #E5E2F5;
          border-radius: 11px;
          outline: none;
          transition: all .2s;
        }

        .field-input:focus {
          border-color: #534AB7;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(83,74,183,.1);
        }

        .field-input::placeholder { color: #C4C0D8; }

        /* ── Actions ── */
        .actions-row {
          display: flex;
          gap: 10px;
          padding: 16px 24px;
          background: #FAFAFE;
          border-top: 1px solid #F1F5F9;
        }

        .btn-edit {
          flex: 1;
          padding: 11px;
          background: rgba(83,74,183,.07);
          color: #534AB7;
          border: 1.5px solid rgba(83,74,183,.2);
          border-radius: 13px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .btn-edit:hover { background: rgba(83,74,183,.12); border-color: rgba(83,74,183,.35); transform: translateY(-1px); }

        .btn-save {
          flex: 2;
          padding: 11px;
          background: linear-gradient(135deg, #534AB7, #8B5CF6);
          color: #fff;
          border: none;
          border-radius: 13px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(83,74,183,.3);
          transition: all .2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }

        .btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(83,74,183,.4); }
        .btn-save:disabled { opacity: .6; cursor: not-allowed; }

        .btn-cancel {
          flex: 1;
          padding: 11px;
          background: #fff;
          color: #64748B;
          border: 1.5px solid #E2E8F0;
          border-radius: 13px;
          font-family: 'Instrument Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all .2s;
        }

        .btn-cancel:hover { background: #F8FAFC; border-color: #CBD5E1; }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .6s linear infinite;
        }

        /* ── Security panel ── */
        .security-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid #F8FAFC;
        }

        .security-row:last-child { border-bottom: none; }

        .security-label {
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .security-desc { font-size: 11px; color: #94A3B8; margin-top: 2px; font-weight: 400; }

        .security-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .badge-green { background: #ECFDF5; color: #065F46; }
        .badge-gray  { background: #F1F5F9; color: #64748B; }

        /* ── Role badge on panel ── */
        .role-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          background: linear-gradient(135deg, #534AB7, #8B5CF6);
          color: #fff;
        }
      `}</style>

      {toast && (
        <div className={`toast ${toast.ok ? "ok" : "err"}`}>
          {toast.ok ? "✓" : "⚠️"} {toast.msg}
        </div>
      )}

      <div className="profil-root">
        <Sidebar stats={stats} />
        <Navbar title="Mon Profil" subtitle={`Dr. ${profil.username}`} />

        <main className="profil-main">
          <div className="layout">

            {/* ── Colonne gauche : carte identité ── */}
            <div className="id-card">
              <div className="id-banner" />
              <div className="id-body">
                <div className="avatar-wrap">
                  <div className="avatar">{initials}</div>
                  <div className="online-dot" />
                </div>

                <div className="id-name">Dr. {profil.username}</div>
                <div>
                  <span className="id-role">
                    🩺 {profil.specialite || "Médecin Généraliste"}
                  </span>
                </div>

                <div className="id-info-row">
                  <div className="id-info-item">
                    <div className="id-info-icon">📧</div>
                    <div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Email</div>
                      <div className="id-info-val">{profil.email || "—"}</div>
                    </div>
                  </div>
                  <div className="id-info-item">
                    <div className="id-info-icon">🏥</div>
                    <div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Spécialité</div>
                      <div className="id-info-val">{profil.specialite || "—"}</div>
                    </div>
                  </div>
                  <div className="id-info-item">
                    <div className="id-info-icon">🕐</div>
                    <div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Disponibilités</div>
                      <div className="id-info-val">{profil.disponibilites || "—"}</div>
                    </div>
                  </div>
                  <div className="id-info-item">
                    <div className="id-info-icon">🔑</div>
                    <div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Rôle</div>
                      <div className="id-info-val" style={{ textTransform: "capitalize" }}>{profil.role}</div>
                    </div>
                  </div>
                </div>

                <button className="btn-logout" onClick={() => { logout(); router.push("/login"); }}>
                  <span>⎋</span> Déconnexion
                </button>
              </div>
            </div>

            {/* ── Colonne droite ── */}
            <div className="right-col">

              {/* Informations professionnelles */}
              <div className="panel" style={{ animationDelay: ".05s" }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <div className="panel-icon">👤</div>
                    Informations professionnelles
                  </div>
                  <span className="role-tag">Médecin</span>
                </div>

                <div className="panel-body">
                  <div className="fields-grid">

                    {/* Nom d'utilisateur */}
                    <div className="field-wrap">
                      <div className="field-label">Nom d'utilisateur</div>
                      {edit
                        ? <input className="field-input" type="text" value={form.username} placeholder="Nom d'utilisateur" onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
                        : <div className="field-value">{profil.username || <span className="field-empty">Non renseigné</span>}</div>
                      }
                    </div>

                    {/* Email */}
                    <div className="field-wrap">
                      <div className="field-label">Email</div>
                      {edit
                        ? <input className="field-input" type="email" value={form.email} placeholder="Email" onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                        : <div className="field-value">{profil.email || <span className="field-empty">Non renseigné</span>}</div>
                      }
                    </div>

                    {/* Spécialité */}
                    <div className="field-wrap">
                      <div className="field-label">Spécialité</div>
                      {edit
                        ? <input className="field-input" type="text" value={form.specialite} placeholder="Ex : Cardiologie" onChange={e => setForm(p => ({ ...p, specialite: e.target.value }))} />
                        : <div className="field-value">{profil.specialite || <span className="field-empty">Non renseignée</span>}</div>
                      }
                    </div>

                    {/* Disponibilités */}
                    <div className="field-wrap">
                      <div className="field-label">Disponibilités</div>
                      {edit
                        ? <input className="field-input" type="text" value={form.disponibilites} placeholder="Ex : Lun–Ven 9h–17h" onChange={e => setForm(p => ({ ...p, disponibilites: e.target.value }))} />
                        : <div className="field-value">{profil.disponibilites || <span className="field-empty">Non renseignées</span>}</div>
                      }
                    </div>

                  </div>
                </div>

                <div className="actions-row">
                  {edit ? (
                    <>
                      <button className="btn-cancel" onClick={() => setEdit(false)}>Annuler</button>
                      <button className="btn-save" onClick={save} disabled={saving}>
                        {saving ? <><div className="spinner" /> Sauvegarde…</> : <>💾 Sauvegarder les modifications</>}
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
                <div className="panel-header">
                  <div className="panel-title">
                    <div className="panel-icon">🔐</div>
                    Sécurité du compte
                  </div>
                </div>
                <div className="panel-body">
                  <div className="security-row">
                    <div>
                      <div className="security-label">🔑 Mot de passe</div>
                      <div className="security-desc">Dernière modification inconnue</div>
                    </div>
                    <span className="security-badge badge-gray">••••••••</span>
                  </div>
                  <div className="security-row">
                    <div>
                      <div className="security-label">✉️ Email vérifié</div>
                      <div className="security-desc">{profil.email || "Aucun email"}</div>
                    </div>
                    <span className="security-badge badge-green">Actif</span>
                  </div>
                  <div className="security-row">
                    <div>
                      <div className="security-label">🛡️ Authentification JWT</div>
                      <div className="security-desc">Token sécurisé · Expiration 24h</div>
                    </div>
                    <span className="security-badge badge-green">Activée</span>
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