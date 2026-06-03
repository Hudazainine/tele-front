"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

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

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .med-row { transition: background 0.15s; }
  .med-row:hover { background: rgba(167,139,250,0.06) !important; }

  .med-input {
    width: 100%; padding: 11px 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; font-size: 13px; color: white;
    outline: none; box-sizing: border-box; font-family: inherit;
    transition: border-color 0.2s, background 0.2s;
  }
  .med-input::placeholder { color: rgba(255,255,255,0.25); }
  .med-input:focus {
    border-color: rgba(167,139,250,0.6);
    background: rgba(255,255,255,0.07);
  }
  .med-label {
    font-size: 10px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: rgba(255,255,255,0.35);
    display: block; margin-bottom: 6px;
  }
  .spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }
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
  const { token, isLoading } = useAuth();
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

    // Validations front
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
        // Afficher le détail brut pour le debug
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
      <style>{style}</style>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#0d1520",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <Sidebar />
        <main
          style={{
            marginLeft: 260,
            flex: 1,
            padding: "2.5rem",
            overflowX: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
              animation: "fadeUp 0.4s ease both",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "#a78bfa",
                  marginBottom: 6,
                }}
              >
                Administration
              </p>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#f0f4ff",
                  fontFamily: "'Syne', sans-serif",
                  letterSpacing: "-0.5px",
                  margin: 0,
                }}
              >
                Gestion des médecins
              </h1>
              <p style={{ color: "#4a6080", fontSize: 13, marginTop: 4 }}>
                {medecins.length} praticien(s) enregistré(s) · Seul l'admin peut
                créer des comptes médecins
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  fontSize: 13,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  outline: "none",
                  fontFamily: "inherit",
                  width: 220,
                }}
              />
              <button
                onClick={() => {
                  setShowForm(true);
                  setFormError("");
                  setFormSuccess("");
                }}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                  border: "none",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
                }}
              >
                <span style={{ fontSize: 16 }}>+</span> Nouveau médecin
              </button>
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              background: "linear-gradient(145deg, #131f2e, #1a2a3f)",
              borderRadius: 18,
              border: "1px solid #1e3050",
              overflow: "hidden",
              animation: "fadeUp 0.4s 0.1s ease both",
              opacity: 0,
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e3050" }}>
                  {[
                    "Médecin",
                    "Spécialité",
                    "Email",
                    "Identifiant",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 20px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: "#4a6080",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "3rem",
                        textAlign: "center",
                        color: "#4a6080",
                      }}
                    >
                      Chargement...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: "3rem",
                        textAlign: "center",
                        color: "#4a6080",
                      }}
                    >
                      Aucun médecin trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((m, i) => (
                    <tr
                      key={m.id}
                      className="med-row"
                      style={{ borderBottom: "1px solid #1a2a3f" }}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "rgba(167,139,250,0.15)",
                              border: "1px solid rgba(167,139,250,0.25)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                            }}
                          >
                            ⚕
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#c8d8f0",
                              }}
                            >
                              Dr. {m.first_name} {m.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            background: "rgba(167,139,250,0.12)",
                            color: "#a78bfa",
                            border: "1px solid rgba(167,139,250,0.2)",
                          }}
                        >
                          {m.specialite || "—"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          fontSize: 13,
                          color: "#4a6080",
                        }}
                      >
                        {m.email || "—"}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <code
                          style={{
                            fontSize: 12,
                            color: "#22d3a5",
                            background: "rgba(34,211,165,0.08)",
                            padding: "3px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {m.username}
                        </code>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {deleteId === m.id ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => handleDelete(m.id)}
                              style={{
                                padding: "5px 12px",
                                borderRadius: 7,
                                border: "none",
                                background: "#dc2626",
                                color: "white",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setDeleteId(null)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: 7,
                                border: "1px solid #1e3050",
                                background: "transparent",
                                color: "#4a6080",
                                fontSize: 11,
                                cursor: "pointer",
                                fontFamily: "inherit",
                              }}
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(m.id)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 7,
                              border: "1px solid rgba(220,38,38,0.25)",
                              background: "rgba(220,38,38,0.08)",
                              color: "#f87171",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            Supprimer
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
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowForm(false);
            }}
          >
            <div
              style={{
                background: "linear-gradient(145deg, #131f2e, #1a2a3f)",
                border: "1px solid #1e3050",
                borderRadius: 22,
                padding: "2rem",
                width: "100%",
                maxWidth: 480,
                animation: "slideIn 0.3s ease both",
                boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
              }}
            >
              {/* Modal header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.75rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "#a78bfa",
                      marginBottom: 4,
                    }}
                  >
                    Compte médecin
                  </div>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#f0f4ff",
                      fontFamily: "'Syne', sans-serif",
                      margin: 0,
                    }}
                  >
                    Créer un nouveau praticien
                  </h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#4a6080",
                    fontSize: 16,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Restriction notice */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  marginBottom: "1.25rem",
                  background: "rgba(167,139,250,0.08)",
                  border: "1px solid rgba(167,139,250,0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>🔒</span>
                <span style={{ fontSize: 12, color: "rgba(167,139,250,0.8)" }}>
                  Seul l'administrateur peut créer des comptes médecins.
                </span>
              </div>

              {formError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    marginBottom: "1rem",
                    background: "rgba(220,38,38,0.1)",
                    border: "1px solid rgba(220,38,38,0.3)",
                    color: "#f87171",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>⚠</span> {formError}
                </div>
              )}

              {formSuccess && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    marginBottom: "1rem",
                    background: "rgba(34,211,165,0.1)",
                    border: "1px solid rgba(34,211,165,0.3)",
                    color: "#22d3a5",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>✓</span> {formSuccess}
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
                    style={{
                      color: form.specialite
                        ? "white"
                        : "rgba(255,255,255,0.25)",
                    }}
                  >
                    <option value="" disabled style={{ background: "#131f2e" }}>
                      Choisir une spécialité...
                    </option>
                    {SPECIALITES.map((s) => (
                      <option
                        key={s}
                        value={s}
                        style={{ background: "#131f2e", color: "white" }}
                      >
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
                          ? "rgba(220,38,38,0.5)"
                          : undefined,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 11,
                      marginTop: 5,
                      color:
                        form.username && /\s/.test(form.username)
                          ? "#f87171"
                          : "rgba(255,255,255,0.2)",
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
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10,
                      color: "#4a6080",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={formLoading}
                    style={{
                      flex: 2,
                      padding: "12px",
                      background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                      border: "none",
                      borderRadius: 10,
                      color: "white",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: formLoading ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      opacity: formLoading ? 0.7 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {formLoading ? (
                      <>
                        <div className="spinner" /> Création...
                      </>
                    ) : (
                      "✓ Créer le compte médecin"
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
