// EditOrdonnanceModal.tsx
"use client";
import { useState, useCallback } from "react";
import api from "../../../../lib/api";
import { FileText, X, Filter } from "lucide-react";
import { Med, MedRow, Ordonnance, newMed } from "./ordonnances-shared";

let _localId = 100000; // namespace séparé pour éviter collision avec newMed() du module shared

export default function EditOrdonnanceModal({
  ordonnance,
  onClose,
  onSaved,
}: {
  ordonnance: Ordonnance;
  onClose: () => void;
  onSaved: (updated: Ordonnance) => void;
}) {
  const [meds, setMeds] = useState<Med[]>(() => {
    const lines = (ordonnance.medicaments || "")
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("Notes"));
    if (lines.length === 0) return [newMed()];
    return lines.map((line) => {
      const clean = line.replace(/^[-•]\s*/, "");
      const parts = clean.split(" — ");
      const nomPart = parts[0] || "";
      const rest = parts[1] || "";
      const restParts = rest.split(", ");
      return {
        id: ++_localId,
        nom: nomPart.trim(),
        posologie: restParts[0]?.trim() || "",
        duree: restParts[1]?.trim() || "",
      };
    });
  });

  const [notes, setNotes] = useState(() => {
    if (ordonnance.medicaments?.includes("Notes :")) {
      return ordonnance.medicaments.split("Notes :")[1]?.trim() || "";
    }
    return "";
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addMed = useCallback(() => setMeds((p) => [...p, newMed()]), []);
  const removeMed = useCallback(
    (id: number) =>
      setMeds((p) => (p.length > 1 ? p.filter((m) => m.id !== id) : p)),
    [],
  );
  const chgMed = useCallback(
    (id: number, f: keyof Med, v: string) =>
      setMeds((p) => p.map((m) => (m.id === id ? { ...m, [f]: v } : m))),
    [],
  );

  const activeMeds = meds.filter((m) => m.nom.trim());

  const handleSave = async () => {
    if (activeMeds.length === 0) {
      setErrorMsg("Ajoutez au moins un médicament.");
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    try {
      const medText =
        activeMeds
          .map(
            (m) =>
              `- ${m.nom}${m.posologie ? ` — ${m.posologie}` : ""}${m.duree ? `, ${m.duree}` : ""}`,
          )
          .join("\n") + (notes.trim() ? `\n\nNotes :\n${notes.trim()}` : "");
      await api.patch(`ordonnances/${ordonnance.id}/`, {
        medicaments: medText,
      });
      onSaved({ ...ordonnance, medicaments: medText });
    } catch {
      setErrorMsg("Erreur lors de la sauvegarde. Vérifiez votre connexion.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 700 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="form-panel">
          {/* Header */}
          <div
            style={{
              padding: "22px 28px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Modifier l'ordonnance #{String(ordonnance.id).padStart(4, "0")}
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>
                {ordonnance.patient_name}
              </div>
            </div>
            <button className="btn-close-modal" onClick={onClose}>
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Prescription */}
          <div className="form-section">
            <div className="sec-hd">
              <div className="sec-icon rx">
                <Filter size={18} strokeWidth={2} />
              </div>
              <span className="sec-title">Prescription</span>
            </div>
            {errorMsg && <div className="err">{errorMsg}</div>}
            <div className="med-cols">
              <span className="med-col-lbl">Médicament</span>
              <span className="med-col-lbl">Posologie</span>
              <span className="med-col-lbl">Durée</span>
              <span />
            </div>
            {meds.map((m) => (
              <MedRow
                key={m.id}
                med={m}
                onRemove={() => removeMed(m.id)}
                onChange={(f, v) => chgMed(m.id, f, v)}
              />
            ))}
            <button className="add-med-btn" onClick={addMed}>
              ＋ Ajouter un médicament
            </button>
          </div>

          {/* Notes */}
          <div className="form-section">
            <div className="sec-hd">
              <div className="sec-icon nt">
                <FileText size={18} strokeWidth={2} />
              </div>
              <span className="sec-title">Notes & conseils</span>
            </div>
            <textarea
              className="f-txt"
              rows={3}
              placeholder="Conseils, précautions, suivi…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={saving || activeMeds.length === 0}
            >
              {saving ? "Sauvegarde…" : "Sauvegarder les modifications"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
