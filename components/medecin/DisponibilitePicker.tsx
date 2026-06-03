// src/components/medecin/DisponibilitePicker.tsx
"use client";

import { useState } from "react";
// On suppose que tu as les icônes SVG pro ici
import { Clock, Plus, Trash2 } from "lucide-react";

const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

interface Slot {
  jour: number; // 0-6
  debut: string;
  fin: string;
}

export default function DisponibilitePicker() {
  const [slots, setSlots] = useState<Slot[]>([
    { jour: 1, debut: "09:00", fin: "12:00" },
    { jour: 1, debut: "14:00", fin: "17:00" },
  ]);

  const addSlot = (jour: number) => {
    setSlots([...slots, { jour, debut: "09:00", fin: "10:00" }]);
  };

  const updateSlot = (index: number, field: keyof Slot, value: string) => {
    const newSlots = [...slots];
    newSlots[index][field] = value as any;
    setSlots(newSlots);
  };

  return (
    <div
      style={{
        padding: 20,
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
      }}
    >
      <h3 style={{ marginBottom: 16, color: "#1e293b" }}>Mes Créneaux</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {JOURS.map((jour, idx) => (
          <button
            key={idx}
            onClick={() => addSlot(idx)}
            style={{
              padding: 8,
              border: "1px dashed #cbd5e1",
              borderRadius: 8,
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {jour}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {slots.map((slot, i) => (
          <div
            key={i}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <span style={{ width: 40, fontSize: 13, color: "#64748b" }}>
              {JOURS[slot.jour]}
            </span>
            <input
              type="time"
              value={slot.debut}
              onChange={(e) => updateSlot(i, "debut", e.target.value)}
              style={{
                padding: 6,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
              }}
            />
            <span style={{ color: "#94a3b8" }}>à</span>
            <input
              type="time"
              value={slot.fin}
              onChange={(e) => updateSlot(i, "fin", e.target.value)}
              style={{
                padding: 6,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
              }}
            />
            <button
              onClick={() => setSlots(slots.filter((_, idx) => idx !== i))}
              style={{ marginLeft: "auto", color: "#ef4444" }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
