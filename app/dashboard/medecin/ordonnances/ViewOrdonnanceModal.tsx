// ViewOrdonnanceModal.tsx
"use client";
import { X, Pencil } from "lucide-react";
import { Ordonnance } from "./ordonnances-shared";

export default function ViewOrdonnanceModal({
  ordonnance,
  onClose,
  onEdit,
}: {
  ordonnance: Ordonnance;
  onClose: () => void;
  onEdit: () => void;
}) {
  const medLines = (ordonnance.medicaments || "")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("Notes"));

  const notesText = ordonnance.medicaments?.includes("Notes :")
    ? ordonnance.medicaments.split("Notes :")[1]?.trim()
    : null;

  const dateStr = ordonnance.date || ordonnance.date_heure;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 580 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
          }}
        >
          {/* Stripe */}
          <div
            style={{
              height: 4,
              background: "linear-gradient(90deg,#8B5CF6,#10B981)",
            }}
          />

          {/* Header */}
          <div
            style={{
              padding: "24px 28px 20px",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Ordonnance #{String(ordonnance.id).padStart(4, "0")}
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                {dateStr
                  ? new Date(dateStr).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </div>
            </div>
            <button className="btn-close-modal" onClick={onClose}>
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div style={{ padding: "20px 28px 0" }}>
            {/* Patient */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: ".8px",
                  marginBottom: 6,
                }}
              >
                Patient
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#111827",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "linear-gradient(135deg,#E0E7FF,#C7D2FE)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#4F46E5",
                  }}
                >
                  {(ordonnance.patient_name ?? "?").charAt(0).toUpperCase()}
                </div>
                {ordonnance.patient_name || "—"}
              </div>
            </div>

            {/* Médicaments */}
            <div style={{ marginBottom: notesText ? 18 : 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: ".8px",
                  marginBottom: 10,
                }}
              >
                Médicaments prescrits
                <span
                  style={{
                    marginLeft: 8,
                    background: "#EEF2FF",
                    color: "#4F6BF6",
                    borderRadius: 20,
                    padding: "2px 9px",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {medLines.length}
                </span>
              </div>
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "6px 16px",
                }}
              >
                {medLines.length === 0 ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#D1D5DB",
                      fontStyle: "italic",
                      padding: "10px 0",
                    }}
                  >
                    Aucun médicament
                  </div>
                ) : (
                  medLines.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 10,
                        padding: "9px 0",
                        borderBottom:
                          i < medLines.length - 1
                            ? "1px solid #F1F5F9"
                            : "none",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: "#374151",
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "#EEF2FF",
                          color: "#4F6BF6",
                          fontSize: 9,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      {line.replace(/^[-•]\s*/, "")}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notes */}
            {notesText && (
              <div style={{ marginBottom: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: ".8px",
                    marginBottom: 8,
                  }}
                >
                  Notes
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#64748B",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    background: "#FFFBEB",
                    border: "1px dashed #FDE68A",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  {notesText}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: "20px 28px",
              marginTop: 4,
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: 11,
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: "#64748B",
                cursor: "pointer",
                transition: "all .2s",
              }}
            >
              Fermer
            </button>
            <button
              onClick={onEdit}
              style={{
                flex: 2,
                padding: 11,
                background: "linear-gradient(135deg,#8B5CF6,#10B981)",
                border: "none",
                borderRadius: 10,
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Pencil size={15} strokeWidth={2} /> Modifier cette ordonnance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
