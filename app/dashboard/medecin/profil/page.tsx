"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import api from "../../../../lib/api";
import {
  Phone,
  MapPin,
  Stethoscope,
  CreditCard,
  LogOut,
  ShieldCheck,
  Camera,
  Loader2,
  Save,
  Pencil,
  X,
} from "lucide-react";

interface Profil {
  id: number;
  username: string;
  email: string;
  role: string;
  photo?: string;
  specialite: string;
  rpps: string;
  tel: string;
  ville: string;
}

interface FormData {
  specialite: string;
  rpps: string;
  tel: string;
  ville: string;
  email: string;
}

export default function MedecinProfil() {
  const { token, isLoading, username, logout } = useAuth();
  const router = useRouter();

  const [profil, setProfil] = useState<Profil | null>(null);
  const [form, setForm] = useState<FormData>({
    specialite: "",
    rpps: "",
    tel: "",
    ville: "",
    email: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [stats] = useState({ rendezvous: 0, consultations: 0, ordonnances: 0 });

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    api.get("users/me/").then((r) => {
      setProfil(r.data);
      setPhotoPreview(r.data.photo || null);
      setForm({
        specialite: r.data.specialite || "",
        rpps: r.data.rpps || "",
        tel: r.data.tel || "",
        ville: r.data.ville || "",
        email: r.data.email || "",
      });
    });
  }, [token, isLoading]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("L'image est trop lourde (max 2 Mo)", false);
      return;
    }
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      await api.post("users/me/photo/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPhotoPreview(URL.createObjectURL(file));
      showToast("Photo mise à jour !");
    } catch {
      showToast("Échec du téléchargement", false);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveInfos = async () => {
    setSaving(true);
    try {
      const res = await api.patch("users/me/", form);
      setProfil((p) => (p ? { ...p, ...form } : p));
      setIsEditing(false);
      showToast("Informations mises à jour");
    } catch {
      showToast("Erreur lors de la sauvegarde", false);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profil) {
      setForm({
        specialite: profil.specialite || "",
        rpps: profil.rpps || "",
        tel: profil.tel || "",
        ville: profil.ville || "",
        email: profil.email || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading || !profil) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

        .pr-root { min-height: 100vh; background: linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 100%); font-family: 'DM Sans', sans-serif; display: flex; }
        .pr-main { margin-left: 260px; flex: 1; padding: 2rem 2.5rem; padding-top: calc(70px + 2rem); }

        /* ── Page grid ── */
        .pr-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; animation: fadeUp .5s ease; }

        /* ── Left card ── */
        .pr-left { background: #fff; border-radius: 24px; border: 1px solid #EAE8F5; box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden; }
        .pr-banner { height: 90px; background: linear-gradient(135deg, #534AB7 0%, #8B5CF6 55%, #10B981 100%); }

        .pr-avatar-wrap { display: flex; flex-direction: column; align-items: center; padding: 0 24px 24px; margin-top: -36px; }
        .pr-avatar-btn {
          width: 72px; height: 72px; border-radius: 20px;
          background: #E2E8F0; border: 3px solid #fff;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          cursor: pointer; position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s; flex-shrink: 0;
        }
        .pr-avatar-btn:hover { transform: scale(1.04); box-shadow: 0 6px 20px rgba(0,0,0,0.16); }
        .pr-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .pr-avatar-initials { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: #534AB7; }
        .pr-avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: #fff; opacity: 0; transition: opacity .2s; border-radius: 17px; }
        .pr-avatar-btn:hover .pr-avatar-overlay { opacity: 1; }

        .pr-name { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #0F172A; margin-top: 14px; text-align: center; }
        .pr-spec-badge { display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; padding: 4px 12px; background: linear-gradient(135deg, rgba(83,74,183,.08), rgba(139,92,246,.08)); border: 1px solid rgba(83,74,183,.15); border-radius: 20px; font-size: 12px; font-weight: 600; color: #534AB7; }
        .pr-hint { font-size: 11px; color: #94A3B8; margin-top: 8px; text-align: center; }

        .pr-divider { height: 1px; background: #F1F5F9; margin: 20px 24px; }

        /* Info list */
        .pr-info-list { padding: 0 24px; display: flex; flex-direction: column; gap: 12px; }
        .pr-info-row { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #64748B; }
        .pr-info-row svg { color: #8B5CF6; flex-shrink: 0; }
        .pr-info-row span { font-weight: 600; color: #1E293B; }
        .pr-info-empty { color: #CBD5E1; font-style: italic; font-weight: 400; }

        .pr-logout-btn { margin: 20px 24px 24px; width: calc(100% - 48px); padding: 11px; background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 7px; }
        .pr-logout-btn:hover { background: #FEE2E2; transform: translateY(-1px); }

        /* ── Right panels ── */
        .pr-right { display: flex; flex-direction: column; gap: 20px; }

        .pr-panel { background: #fff; border-radius: 20px; border: 1px solid #EAE8F5; box-shadow: 0 2px 12px rgba(0,0,0,0.04); overflow: hidden; }
        .pr-panel-hd { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
        .pr-panel-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: #1E293B; display: flex; align-items: center; gap: 10px; }
        .pr-panel-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #EEF2FF, #E0E7FF); display: flex; align-items: center; justify-content: center; color: #6366F1; }
        .pr-panel-body { padding: 20px 24px 24px; }

        /* Edit button */
        .pr-edit-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.2); border-radius: 10px; font-size: 13px; font-weight: 600; color: #8B5CF6; cursor: pointer; transition: all .2s; }
        .pr-edit-btn:hover { background: #8B5CF6; color: #fff; }

        /* Info display */
        .pr-fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pr-display-field { background: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 12px; padding: 12px 16px; }
        .pr-display-lbl { font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 5px; }
        .pr-display-val { font-size: 14px; font-weight: 600; color: #1E293B; }
        .pr-display-empty { font-size: 13px; color: #CBD5E1; font-style: italic; font-weight: 400; }

        /* Form inputs */
        .pr-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .pr-form-field { display: flex; flex-direction: column; gap: 6px; }
        .pr-form-lbl { font-size: 11px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: .6px; }
        .pr-inp-wrap { position: relative; display: flex; align-items: center; }
        .pr-inp-icon { position: absolute; left: 12px; color: #94A3B8; pointer-events: none; }
        .pr-inp {
          width: 100%; padding: 11px 14px 11px 38px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: #1E293B;
          background: #F8FAFC; border: 1.5px solid #E5E2F5; border-radius: 10px;
          outline: none; transition: all .2s;
        }
        .pr-inp:focus { border-color: #8B5CF6; background: #fff; box-shadow: 0 0 0 3px rgba(139,92,246,.1); }
        .pr-inp::placeholder { color: #94A3B8; }

        /* Form actions */
        .pr-form-actions { display: flex; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 1px solid #F1F5F9; }
        .pr-btn-cancel { padding: 10px 20px; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #64748B; cursor: pointer; transition: all .2s; }
        .pr-btn-cancel:hover { background: #fff; border-color: #CBD5E1; color: #334155; }
        .pr-btn-save { flex: 1; padding: 10px 20px; background: linear-gradient(135deg, #8B5CF6, #6366F1); border: none; border-radius: 10px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: all .2s; box-shadow: 0 4px 12px rgba(139,92,246,.25); }
        .pr-btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(139,92,246,.35); }
        .pr-btn-save:disabled { opacity: .5; cursor: not-allowed; }

        /* Security panel rows */
        .pr-sec-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #F8FAFC; }
        .pr-sec-row:last-child { border-bottom: none; }
        .pr-sec-lbl { font-size: 13px; font-weight: 600; color: #1E293B; margin-bottom: 2px; }
        .pr-sec-sub { font-size: 11px; color: #94A3B8; }
        .pr-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
        .pr-badge-active { background: #ECFDF5; color: #059669; }
        .pr-badge-neutral { background: #F1F5F9; color: #64748B; letter-spacing: 2px; }

        /* Toast */
        .pr-toast { position: fixed; bottom: 28px; right: 28px; z-index: 9999; padding: 12px 20px; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); animation: slideIn .25s ease; }
        .pr-toast-ok { background: #ECFDF5; color: #059669; border: 1px solid rgba(5,150,105,.2); }
        .pr-toast-err { background: #FEF2F2; color: #DC2626; border: 1px solid rgba(220,38,38,.2); }

        .spin { animation: spin 1s linear infinite; }
      `}</style>

      <div className="pr-root">
        <Sidebar stats={stats} />
        <Navbar title="Mon Profil" subtitle={` ${username}`} />

        <main className="pr-main">
          <div className="pr-grid">
            {/* ── LEFT : carte identité ── */}
            <div className="pr-left">
              <div className="pr-banner" />

              <div className="pr-avatar-wrap">
                {/* Avatar cliquable */}
                <div
                  className="pr-avatar-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingPhoto ? (
                    <Loader2
                      size={28}
                      className="spin"
                      style={{ color: "#8B5CF6" }}
                    />
                  ) : photoPreview ? (
                    <img
                      src={photoPreview}
                      className="pr-avatar-img"
                      alt="Photo profil"
                    />
                  ) : (
                    <span className="pr-avatar-initials">
                      {profil.username?.slice(0, 2).toUpperCase() || ""}
                    </span>
                  )}
                  <div className="pr-avatar-overlay">
                    <Camera size={20} strokeWidth={2} />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                />

                <div className="pr-name">{profil.username}</div>
                <div className="pr-spec-badge">
                  <Stethoscope size={11} />
                  {profil.specialite || "Médecin Généraliste"}
                </div>
                <div className="pr-hint">
                  Cliquer sur la photo pour la modifier
                </div>
              </div>

              <div className="pr-divider" />

              {/* Info rapide */}
              <div className="pr-info-list">
                <div className="pr-info-row">
                  <Stethoscope size={15} />
                  {profil.specialite ? (
                    <span>{profil.specialite}</span>
                  ) : (
                    <span className="pr-info-empty">
                      Spécialité non renseignée
                    </span>
                  )}
                </div>
                <div className="pr-info-row">
                  <Phone size={15} />
                  {profil.tel ? (
                    <span>{profil.tel}</span>
                  ) : (
                    <span className="pr-info-empty">
                      Téléphone non renseigné
                    </span>
                  )}
                </div>
                <div className="pr-info-row">
                  <MapPin size={15} />
                  {profil.ville ? (
                    <span>{profil.ville}</span>
                  ) : (
                    <span className="pr-info-empty">Ville non renseignée</span>
                  )}
                </div>
                <div className="pr-info-row">
                  <CreditCard size={15} />
                  {profil.rpps ? (
                    <span>{profil.rpps}</span>
                  ) : (
                    <span className="pr-info-empty">
                      Matricule non renseigné
                    </span>
                  )}
                </div>
              </div>

              <button
                className="pr-logout-btn"
                onClick={() => {
                  logout?.();
                  router.push("/login");
                }}
              >
                <LogOut size={14} /> Déconnexion
              </button>
            </div>

            {/* ── RIGHT : panneaux ── */}
            <div className="pr-right">
              {/* ─ Informations personnelles ─ */}
              <div className="pr-panel">
                <div className="pr-panel-hd">
                  <div className="pr-panel-title">
                    <div className="pr-panel-icon">
                      <Stethoscope size={18} />
                    </div>
                    Informations personnelles
                  </div>
                  {!isEditing && (
                    <button
                      className="pr-edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil size={13} /> Modifier
                    </button>
                  )}
                </div>

                <div className="pr-panel-body">
                  {isEditing ? (
                    <>
                      <div className="pr-form-grid">
                        {/* Spécialité */}
                        <div className="pr-form-field">
                          <label className="pr-form-lbl">Spécialité</label>
                          <div className="pr-inp-wrap">
                            <Stethoscope size={16} className="pr-inp-icon" />
                            <input
                              className="pr-inp"
                              value={form.specialite}
                              onChange={(e) =>
                                setForm({ ...form, specialite: e.target.value })
                              }
                              placeholder="Médecin généraliste"
                            />
                          </div>
                        </div>

                        {/* Matricule */}
                        <div className="pr-form-field">
                          <label className="pr-form-lbl">Matricule</label>
                          <div className="pr-inp-wrap">
                            <CreditCard size={16} className="pr-inp-icon" />
                            <input
                              className="pr-inp"
                              value={form.rpps}
                              onChange={(e) =>
                                setForm({ ...form, rpps: e.target.value })
                              }
                              placeholder="Numéro d'inscription"
                            />
                          </div>
                        </div>

                        {/* Téléphone */}
                        <div className="pr-form-field">
                          <label className="pr-form-lbl">Téléphone</label>
                          <div className="pr-inp-wrap">
                            <Phone size={16} className="pr-inp-icon" />
                            <input
                              className="pr-inp"
                              type="tel"
                              value={form.tel}
                              onChange={(e) =>
                                setForm({ ...form, tel: e.target.value })
                              }
                              placeholder="+216 XX XXX XXX"
                            />
                          </div>
                        </div>

                        {/* Ville */}
                        <div className="pr-form-field">
                          <label className="pr-form-lbl">Ville</label>
                          <div className="pr-inp-wrap">
                            <MapPin size={16} className="pr-inp-icon" />
                            <input
                              className="pr-inp"
                              value={form.ville}
                              onChange={(e) =>
                                setForm({ ...form, ville: e.target.value })
                              }
                              placeholder="Ex : Tunis"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pr-form-actions">
                        <button className="pr-btn-cancel" onClick={cancelEdit}>
                          Annuler
                        </button>
                        <button
                          className="pr-btn-save"
                          onClick={saveInfos}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 size={15} className="spin" /> Sauvegarde…
                            </>
                          ) : (
                            <>
                              <Save size={15} /> Enregistrer
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="pr-fields-grid">
                      <div className="pr-display-field">
                        <div className="pr-display-lbl">Spécialité</div>
                        {profil.specialite ? (
                          <div className="pr-display-val">
                            {profil.specialite}
                          </div>
                        ) : (
                          <div className="pr-display-empty">Non renseignée</div>
                        )}
                      </div>
                      <div className="pr-display-field">
                        <div className="pr-display-lbl">Matricule</div>
                        {profil.rpps ? (
                          <div className="pr-display-val">{profil.rpps}</div>
                        ) : (
                          <div className="pr-display-empty">—</div>
                        )}
                      </div>
                      <div className="pr-display-field">
                        <div className="pr-display-lbl">Téléphone</div>
                        {profil.tel ? (
                          <div className="pr-display-val">{profil.tel}</div>
                        ) : (
                          <div className="pr-display-empty">—</div>
                        )}
                      </div>
                      <div className="pr-display-field">
                        <div className="pr-display-lbl">Ville</div>
                        {profil.ville ? (
                          <div className="pr-display-val">{profil.ville}</div>
                        ) : (
                          <div className="pr-display-empty">—</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ─ Sécurité du compte ─ */}
              <div className="pr-panel">
                <div className="pr-panel-hd">
                  <div className="pr-panel-title">
                    <div
                      className="pr-panel-icon"
                      style={{
                        background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
                        color: "#059669",
                      }}
                    >
                      <ShieldCheck size={18} />
                    </div>
                    Sécurité du compte
                  </div>
                </div>

                <div className="pr-panel-body">
                  <div className="pr-sec-row">
                    <div>
                      <div className="pr-sec-lbl">Mot de passe</div>
                      <div className="pr-sec-sub">
                        Modifiez votre mot de passe régulièrement
                      </div>
                    </div>
                    <span className="pr-badge pr-badge-neutral">••••••••</span>
                  </div>

                  <div className="pr-sec-row">
                    <div>
                      <div className="pr-sec-lbl">Email</div>
                      <div className="pr-sec-sub">{profil.email}</div>
                    </div>
                    <span className="pr-badge pr-badge-active">Actif</span>
                  </div>

                  <div className="pr-sec-row">
                    <div>
                      <div className="pr-sec-lbl">Rôle</div>
                      <div className="pr-sec-sub">Accès médecin complet</div>
                    </div>
                    <span className="pr-badge pr-badge-active">Médecin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Toast */}
        {toast && (
          <div
            className={`pr-toast ${toast.ok ? "pr-toast-ok" : "pr-toast-err"}`}
          >
            {toast.ok ? "✓" : "⚠"} {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}
