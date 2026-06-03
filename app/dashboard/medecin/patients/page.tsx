// app/dashboard/medecin/patients/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import api from "../../../../lib/api";

interface Patient {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telephone?: string;
  date_naissance?: string;
}

interface Medecin {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  specialite?: string;
}

export default function PatientsPage() {
  const { role } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [selectedMedecin, setSelectedMedecin] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (role === "admin") {
        const [pRes, mRes] = await Promise.all([
          api.get("patients/"),
          api.get("medecins/"),
        ]);
        setPatients(pRes.data);
        setMedecins(mRes.data);
      } else {
        const res = await api.get("patients/");
        setPatients(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Pour l'admin : filtrer les patients par médecin via les rendez-vous
  const [rdvMap, setRdvMap] = useState<Record<number, number[]>>({});

  useEffect(() => {
    if (role === "admin") {
      api.get("rendezvous/").then((res) => {
        const map: Record<number, number[]> = {};
        res.data.forEach((rdv: { medecin: number; patient: number }) => {
          if (!map[rdv.medecin]) map[rdv.medecin] = [];
          if (!map[rdv.medecin].includes(rdv.patient))
            map[rdv.medecin].push(rdv.patient);
        });
        setRdvMap(map);
      });
    }
  }, [role]);

  const filteredPatients = patients.filter((p) => {
    const matchSearch =
      `${p.first_name} ${p.last_name} ${p.username} ${p.email}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchMedecin =
      role !== "admin" ||
      selectedMedecin === null ||
      rdvMap[selectedMedecin]?.includes(p.id);

    return matchSearch && matchMedecin;
  });

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: "1.5rem",
          color: "#1e293b",
        }}
      >
        👥 {role === "admin" ? "Patients par médecin" : "Mes patients"}
      </h1>

      {/* Filtres */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Rechercher un patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "10px 14px",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            fontSize: 14,
            outline: "none",
          }}
        />

        {role === "admin" && (
          <select
            value={selectedMedecin ?? ""}
            onChange={(e) =>
              setSelectedMedecin(e.target.value ? Number(e.target.value) : null)
            }
            style={{
              padding: "10px 14px",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 14,
              background: "white",
              minWidth: 200,
              outline: "none",
            }}
          >
            <option value="">Tous les médecins</option>
            {medecins.map((m) => (
              <option key={m.id} value={m.id}>
                Dr. {m.first_name} {m.last_name}
                {m.specialite ? ` — ${m.specialite}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Contenu */}
      {loading ? (
        <p style={{ color: "#64748b" }}>Chargement...</p>
      ) : filteredPatients.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "#f8fafc",
            borderRadius: 16,
            color: "#94a3b8",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
          <p>Aucun patient trouvé</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredPatients.map((p) => (
            <div
              key={p.id}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #44B6B2, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {(p.first_name?.[0] || p.username[0]).toUpperCase()}
              </div>

              {/* Infos */}
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontWeight: 600, color: "#1e293b", fontSize: 15 }}
                >
                  {p.first_name} {p.last_name}
                  {!p.first_name && !p.last_name && p.username}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  {p.email}
                  {p.telephone && ` · ${p.telephone}`}
                </div>
              </div>

              {/* Badge */}
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "#f0fdf4",
                  color: "#16a34a",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Patient actif
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compteur */}
      <p style={{ marginTop: "1rem", fontSize: 13, color: "#94a3b8" }}>
        {filteredPatients.length} patient
        {filteredPatients.length > 1 ? "s" : ""} affiché
        {filteredPatients.length > 1 ? "s" : ""}
      </p>
    </div>
  );
}
