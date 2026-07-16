"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import PrivateRoute from "../../../../components/PrivateRoute";
import Navbar from "../../../../components/Navbar";
import api from "../../../../lib/api";
import {
  Stethoscope,
  Search,
  Plus,
  X,
  Lock,
  AlertTriangle,
  Check,
  User,
  Mail,
  Shield,
  Trash2,
  Loader2,
} from "lucide-react";

interface Medecin {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  specialite: string;
}

const SPECIALITES = [
  "Généraliste",
  "Cardiologue",
  "Dermatologue",
  "Pédiatre",
  "Neurologue",
  "Gynécologue",
  "Orthopédiste",
  "Psychiatre",
  "Ophtalmologue",
  "ORL",
  "Endocrinologue",
  "Rhumatologue",
];

// ─── Dark Theme Design Tokens ──────────────────────────────────
const C = {
  bg: "#050a10", // Fond global très sombre
  surface: "#131f2e", // Cartes / Modales
  surfaceAlt: "#1e2a3d", // Hover / Inputs
  border: "#2d456e", // Bordures
  borderStrong: "#4a6080",

  text: "#f1f5f9", // Texte principal
  textSub: "#94a3b8", // Texte secondaire
  textMuted: "#64748b", // Texte muted

  // Accents (Teal, Violet, Sky, etc.)
  teal: "#2dd4bf",
  tealLight: "rgba(45, 212, 191, 0.15)",
  tealDark: "#0f766e",

  violet: "#8b5cf6",
  violetLight: "rgba(139, 92, 246, 0.15)",

  sky: "#38bdf8",
  skyLight: "rgba(56, 189, 248, 0.15)",

  amber: "#fbbf24",
  amberLight: "rgba(251, 191, 36, 0.15)",

  red: "#f87171",
  redLight: "rgba(248, 113, 113, 0.15)",

  green: "#4ade80",
  greenLight: "rgba(74, 222, 128, 0.15)",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(28px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes spin    { to { transform: rotate(360deg); } }

  .panel {
    background: ${C.surface};
    border-radius: 16px;
    border: 1px solid ${C.border};
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
    animation: fadeUp 0.45s ease both;
  }

  .med-row { transition: background 0.15s; }
  .med-row:hover { background: ${C.surfaceAlt}; }

  .search-input {
    padding: 10px 16px 10px 40px; border-radius: 10px; border: 1px solid ${C.border};
    background: ${C.surface}; color: ${C.text}; font-size: 13px;
    font-family: inherit; outline: none; transition: border-color 0.2s ease; width: 260px;
  }
  .search-input::placeholder { color: ${C.textMuted}; }
  .search-input:focus { border-color: ${C.violet}; box-shadow: 0 0 0 3px ${C.violetLight}; }

  .add-btn {
    padding: 10px 20px; background: ${C.violet}; border: none; border-radius: 10px;
    color: white; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 4px 12px ${C.violet}44; transition: all 0.2s ease;
  }
  .add-btn:hover { transform: translateY(-1px); background: #7c3aed; }

  .dt-table-wrap { border-radius: 16px; overflow: hidden; border: 1px solid ${C.border}; background: ${C.surface}; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
  .dt-table { width: 100%; border-collapse: collapse; }
  .dt-thead-tr { background: ${C.surfaceAlt}; border-bottom: 1px solid ${C.border}; }
  .dt-th {
    text-align: left; padding: 12px 20px; font-size: 11px; font-weight: 700;
    color: ${C.textMuted}; letter-spacing: 0.08em; text-transform: uppercase;
  }
  .dt-row { border-bottom: 1px solid ${C.border}; transition: background 0.15s; }
  .dt-row:last-child { border-bottom: none; }
  .dt-td { padding: 14px 20px; font-size: 13px; color: ${C.textSub}; vertical-align: middle; }
  .dt-empty { padding: 2.5rem 0; text-align: center; color: ${C.textMuted}; font-size: 13px; }

  .del-btn {
    padding: 6px 12px; border-radius: 7px; border: 1px solid ${C.red}40;
    background: ${C.redLight}; color: ${C.red}; font-size: 11px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all 0.15s ease;
    display: inline-flex; align-items: center; gap: 4px;
  }
  .del-btn:hover { transform: translateY(-1px); background: ${C.red}20; }
  
  .del-confirm {
    padding: 6px 12px; border-radius: 7px; border: none;
    background: ${C.red}; color: white; font-size: 11px; font-weight: 700;
    cursor: pointer; font-family: inherit;
  }
  .del-cancel {
    padding: 6px 10px; border-radius: 7px; border: 1px solid ${C.border};
    background: transparent; color: ${C.textSub}; font-size: 11px;
    cursor: pointer; font-family: inherit;
  }
  .del-cancel:hover { color: ${C.text}; border-color: ${C.borderStrong}; }

  .med-input {
    width: 100%; padding: 11px 14px;
    background: ${C.surfaceAlt};
    border: 1px solid ${C.border};
    border-radius: 10px; font-size: 13px; color: ${C.text};
    outline: none; box-sizing: border-box; font-family: inherit;
    transition: border-color 0.2s, background 0.2s;
  }
  .med-input::placeholder { color: ${C.textMuted}; }
  .med-input:focus {
    border-color: ${C.violet}; background: ${C.surface};
  }
  .med-input option { background: ${C.surface}; color: ${C.text}; }

  .med-label {
    font-size: 10px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: ${C.textMuted};
    display: block; margin-bottom: 6px;
  }

  .spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }

  .mo {
    position: fixed; inset: 0; z-index: 50;
    background: rgba(5, 10, 16, 0.75); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn .2s ease;
  }
  .mb {
    background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 20px;
    padding: 2rem; width: 100%; max-width: 480px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.5);
    animation: slideUp .28s cubic-bezier(.34,1.56,.64,1);
  }

  .modal-close {
    width: 32px; height: 32px; border-radius: 8px;
    background: ${C.surfaceAlt}; border: 1px solid ${C.border};
    color: ${C.textSub}; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .modal-close:hover { background: ${C.border}; color: ${C.text}; }

  .bs {
    padding: 11px 20px; background: transparent; border: 1px solid ${C.border};
    border-radius: 11px; color: ${C.textSub}; font-size: 13px; font-weight: 600;
    font-family: inherit; cursor: pointer; transition: all .2s ease;
  }
  .bs:hover { border-color: ${C.borderStrong}; color: ${C.text}; background: ${C.surfaceAlt}; }

  .bp {
    padding: 12px; background: ${C.violet}; border: none; border-radius: 10px;
    color: white; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 12px ${C.violet}44; transition: all .2s ease;
  }
  .bp:hover { transform: translateY(-1px); background: #7c3aed; }
  .bp:disabled { opacity: 0.6; cursor: not-allowed; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${C.bg}; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: ${C.borderStrong}; }
`;

const emptyForm = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  specialite: "",
};

export default function AdminMedecins() {
  const { token, isLoading, user } = useAuth();
  const router = useRouter();
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchMedecins = () =>
    api
      .get("medecins/")
      .then((r) => setMedecins(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    fetchMedecins();
    const interval = setInterval(fetchMedecins, 8000);
    return () => clearInterval(interval);
  }, [token, isLoading, router]);

  if (isLoading) return null;

  const set = (k: keyof typeof emptyForm, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const filtered = medecins.filter((m) =>
    `${m.first_name} ${m.last_name} ${m.username} ${m.specialite}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    setFormError("");
    const { username, email, password, first_name, last_name, specialite } =
      form;

    if (!first_name.trim() || !last_name.trim()) {
      setFormError("Prénom et nom sont requis.");
      return;
    }
    if (!specialite) {
      setFormError("Veuillez choisir une spécialité.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Adresse email invalide.");
      return;
    }
    if (!username.trim()) {
      setFormError("Le nom d'utilisateur est requis.");
      return;
    }
    if (/\s/.test(username)) {
      setFormError("Le nom d'utilisateur ne doit pas contenir d'espaces.");
      return;
    }
    if (!/^[\w.@+-]+$/.test(username)) {
      setFormError(
        "Nom d'utilisateur invalide (lettres, chiffres, . @ + - _ uniquement).",
      );
      return;
    }
    if (!password || password.length < 8) {
      setFormError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setFormLoading(true);
    try {
      await api.post("register/", {
        username: username.trim(),
        email: email.trim(),
        password,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        specialite,
        role: "medecin",
      });
      setFormSuccess(
        `Compte médecin créé pour Dr. ${first_name} ${last_name}.`,
      );
      setForm(emptyForm);
      fetchMedecins();
      setTimeout(() => {
        setFormSuccess("");
        setShowForm(false);
      }, 2500);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.username) setFormError("Ce nom d'utilisateur est déjà pris.");
      else if (data?.email) setFormError("Cet email est déjà utilisé.");
      else if (data?.password)
        setFormError(`Mot de passe : ${data.password[0]}`);
      else if (data?.non_field_errors) setFormError(data.non_field_errors[0]);
      else {
        const detail =
          data?.detail || JSON.stringify(data) || "Erreur inconnue.";
        setFormError(`Erreur : ${detail}`);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`medecins/${id}/`);
      setMedecins((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Impossible de supprimer ce médecin.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <PrivateRoute allowedRoles={["admin"]}>
      <style>{css}</style>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: C.bg,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Sidebar />
        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "5rem 2.4rem 3rem",
            overflowX: "hidden",
          }}
        >
          <Navbar
            title="Médecins"
            subtitle={`Bonjour ${user?.username || "Admin"}`}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "1.6rem",
              animation: "fadeUp 0.35s ease both",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: C.violet,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Stethoscope size={14} /> Administration
              </div>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: C.text,
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                Gestion des médecins
              </h1>
              <p
                style={{
                  color: C.textMuted,
                  fontSize: 13,
                  marginTop: 4,
                  marginBottom: 0,
                }}
              >
                {medecins.length} praticien(s) enregistré(s) · Seul l'admin peut
                créer des comptes médecins
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: C.textMuted,
                  }}
                >
                  <Search size={16} />
                </div>
                <input
                  className="search-input"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                className="add-btn"
                onClick={() => {
                  setShowForm(true);
                  setFormError("");
                  setFormSuccess("");
                }}
              >
                <Plus size={16} /> Nouveau médecin
              </button>
            </div>
          </div>

          {/* Table */}
          <div
            className="dt-table-wrap"
            style={{ animation: "fadeUp 0.45s ease both" }}
          >
            <table className="dt-table">
              <thead>
                <tr className="dt-thead-tr">
                  {[
                    "Médecin",
                    "Spécialité",
                    "Email",
                    "Identifiant",
                    "Action",
                  ].map((h) => (
                    <th key={h} className="dt-th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="dt-empty">
                      Chargement...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="dt-empty">
                      Aucun médecin trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="med-row dt-row">
                      <td className="dt-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: C.violetLight,
                              border: `1px solid ${C.violet}44`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: C.violet,
                            }}
                          >
                            <Stethoscope size={18} />
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: C.text,
                            }}
                          >
                            Dr. {m.first_name} {m.last_name}
                          </div>
                        </div>
                      </td>
                      <td className="dt-td">
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            background: C.violetLight,
                            color: C.violet,
                            border: `1px solid ${C.violet}33`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Shield size={10} /> {m.specialite || "—"}
                        </span>
                      </td>
                      <td className="dt-td">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Mail size={12} color={C.textMuted} />{" "}
                          {m.email || "—"}
                        </div>
                      </td>
                      <td className="dt-td">
                        <code
                          style={{
                            fontSize: 12,
                            color: C.teal,
                            background: C.tealLight,
                            padding: "3px 8px",
                            borderRadius: 6,
                            border: `1px solid ${C.teal}33`,
                          }}
                        >
                          {m.username}
                        </code>
                      </td>
                      <td className="dt-td">
                        {deleteId === m.id ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="del-confirm"
                              onClick={() => handleDelete(m.id)}
                            >
                              Confirmer
                            </button>
                            <button
                              className="del-cancel"
                              onClick={() => setDeleteId(null)}
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            className="del-btn"
                            onClick={() => setDeleteId(m.id)}
                          >
                            <Trash2 size={12} /> Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* ── Modal création médecin ── */}
        {showForm && (
          <div
            className="mo"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <div className="mb">
              {/* Modal header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.violet,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Compte médecin
                  </div>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: C.text,
                      margin: 0,
                    }}
                  >
                    Créer un nouveau praticien
                  </h2>
                </div>
                <button
                  className="modal-close"
                  onClick={() => setShowForm(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Restriction notice */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  marginBottom: "1.25rem",
                  background: C.violetLight,
                  border: `1px solid ${C.violet}33`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Lock size={14} color={C.violet} />
                <span style={{ fontSize: 12, color: C.textSub }}>
                  Seul l'administrateur peut créer des comptes médecins.
                </span>
              </div>

              {formError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    marginBottom: "1rem",
                    background: C.redLight,
                    border: `1px solid ${C.red}44`,
                    color: C.red,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={14} /> {formError}
                </div>
              )}

              {formSuccess && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    marginBottom: "1rem",
                    background: C.greenLight,
                    border: `1px solid ${C.green}44`,
                    color: C.green,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Check size={14} /> {formSuccess}
                </div>
              )}

              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* Nom / Prénom */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div>
                    <label className="med-label">Prénom</label>
                    <input
                      className="med-input"
                      value={form.first_name}
                      onChange={(e) => set("first_name", e.target.value)}
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="med-label">Nom</label>
                    <input
                      className="med-input"
                      value={form.last_name}
                      onChange={(e) => set("last_name", e.target.value)}
                      placeholder="Martin"
                    />
                  </div>
                </div>

                {/* Spécialité */}
                <div>
                  <label className="med-label">Spécialité</label>
                  <select
                    className="med-input"
                    value={form.specialite}
                    onChange={(e) => set("specialite", e.target.value)}
                    style={{ color: form.specialite ? C.text : C.textMuted }}
                  >
                    <option value="" disabled>
                      Choisir une spécialité...
                    </option>
                    {SPECIALITES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div>
                  <label className="med-label">Adresse email</label>
                  <input
                    className="med-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="jean.martin@hopital.fr"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="med-label">Nom d'utilisateur</label>
                  <input
                    className="med-input"
                    value={form.username}
                    onChange={(e) =>
                      set("username", e.target.value.replace(/\s/g, ""))
                    }
                    placeholder="dr.martin"
                    style={{
                      borderColor:
                        form.username && /\s/.test(form.username)
                          ? C.red
                          : undefined,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 11,
                      marginTop: 5,
                      color:
                        form.username && /\s/.test(form.username)
                          ? C.red
                          : C.textMuted,
                    }}
                  >
                    Sans espaces, ex : dr.martin ou drmartin
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="med-label">Mot de passe temporaire</label>
                  <input
                    className="med-input"
                    type="password"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="Min. 8 caractères"
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    className="bs"
                    style={{ flex: 1 }}
                    onClick={() => setShowForm(false)}
                  >
                    Annuler
                  </button>
                  <button
                    className="bp"
                    style={{ flex: 2 }}
                    onClick={handleCreate}
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <>
                        <div className="spinner" /> Création...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Créer le compte médecin
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}
