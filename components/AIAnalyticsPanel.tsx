"use client";
import { useState, useRef, useEffect } from "react";
import { Brain, Send, Sparkles, X, Minimize2, Maximize2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface RendezVous {
  id: number;
  patient_name: string;
  medecin_name: string;
  date_heure: string;
  status: string;
}
interface Consultation {
  id: number;
  patient_name: string;
  medecin_name: string;
  date_heure: string;
  notes: string;
}
interface Medecin {
  id: number;
  first_name: string;
  last_name: string;
  specialite: string;
  username: string;
}
interface Patient {
  id: number;
}

export interface DashboardData {
  patients: Patient[];
  medecins: Medecin[];
  rdvList: RendezVous[];
  consList: Consultation[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  bg: "#050a10",
  surface: "#131f2e",
  surfaceAlt: "#1a283a",
  border: "#1e3050",
  borderStrong: "#2d456e",
  text: "#f0f4ff",
  textSub: "#8ba0c0",
  textMuted: "#4a6080",
  teal: "#22d3a5",
  tealLight: "rgba(34, 211, 165, 0.12)",
  violet: "#a78bfa",
  violetLight: "rgba(167, 139, 250, 0.12)",
  amber: "#fbbf24",
  red: "#f87171",
};

// ─── Helpers ──────────────────────────────────────────────────
function buildContext(data: DashboardData): string {
  const { patients, medecins, rdvList, consList } = data;

  const statusCount = rdvList.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const medecinRdv: Record<
    string,
    { total: number; annules: number; spec: string }
  > = {};
  rdvList.forEach((r) => {
    const key = r.medecin_name || "Inconnu";
    if (!medecinRdv[key]) {
      const med = medecins.find(
        (m) => `${m.first_name} ${m.last_name}` === key || m.username === key,
      );
      medecinRdv[key] = { total: 0, annules: 0, spec: med?.specialite || "—" };
    }
    medecinRdv[key].total++;
    if (r.status === "annulé") medecinRdv[key].annules++;
  });

  const heureCount: Record<number, number> = {};
  rdvList.forEach((r) => {
    const h = new Date(r.date_heure).getHours();
    heureCount[h] = (heureCount[h] || 0) + 1;
  });
  const heurePointe = Object.entries(heureCount)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([h, c]) => `${h}h (${c} RDV)`)
    .join(", ");

  const specialiteCount: Record<string, number> = {};
  rdvList.forEach((r) => {
    const med = medecins.find(
      (m) =>
        `${m.first_name} ${m.last_name}` === r.medecin_name ||
        m.username === r.medecin_name,
    );
    const spec = med?.specialite || "Non renseignée";
    specialiteCount[spec] = (specialiteCount[spec] || 0) + 1;
  });

  const nowM = new Date().getMonth();
  const rdvByMonth = Array(12).fill(0);
  const consByMonth = Array(12).fill(0);
  rdvList.forEach((r) => rdvByMonth[new Date(r.date_heure).getMonth()]++);
  consList.forEach((c) => consByMonth[new Date(c.date_heure).getMonth()]++);
  const months = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Jun",
    "Jul",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const idx = (nowM - 5 + i + 12) % 12;
    return `${months[idx]}: ${rdvByMonth[idx]} RDV / ${consByMonth[idx]} consultations`;
  }).join(" | ");

  const topMedecins = Object.entries(medecinRdv)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(
      ([name, d]) =>
        `Dr. ${name} (${d.spec}): ${d.total} RDV, ${d.annules} annulés`,
    )
    .join(" | ");

  const topSpecialites = Object.entries(specialiteCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([s, c]) => `${s}: ${c}`)
    .join(", ");

  return `
DONNÉES PLATEFORME (temps réel) :
- Total patients inscrits : ${patients.length}
- Total médecins : ${medecins.length}
- Total rendez-vous : ${rdvList.length}
- Total consultations : ${consList.length}

STATUTS RDV :
- Confirmés : ${statusCount["confirmé"] || 0}
- En attente : ${statusCount["en attente"] || 0}
- Annulés : ${statusCount["annulé"] || 0}
- Terminés : ${statusCount["terminé"] || 0}
- Taux confirmation : ${rdvList.length > 0 ? Math.round(((statusCount["confirmé"] || 0) / rdvList.length) * 100) : 0}%
- Taux annulation : ${rdvList.length > 0 ? Math.round(((statusCount["annulé"] || 0) / rdvList.length) * 100) : 0}%

ACTIVITÉ 6 DERNIERS MOIS : ${last6Months}

TOP MÉDECINS PAR ACTIVITÉ : ${topMedecins}

HEURES DE POINTE : ${heurePointe || "Données insuffisantes"}

RÉPARTITION PAR SPÉCIALITÉ : ${topSpecialites}
`.trim();
}

const SUGGESTIONS = [
  { icon: "⏰", text: "Quelles sont les heures de pointe ?" },
  { icon: "❌", text: "Quels médecins ont le plus d'annulations ?" },
  { icon: "📈", text: "Évolution des consultations ce mois" },
  { icon: "🏥", text: "Spécialité la plus demandée" },
  { icon: "⚠️", text: "Y a-t-il des alertes à surveiller ?" },
];

// ─── Component ────────────────────────────────────────────────
export default function AIAnalyticsPanel({ data }: { data: DashboardData }) {
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis votre assistant analytics. Je peux analyser vos données en temps réel : annulations, tendances, heures de pointe, performance des médecins… Que voulez-vous savoir ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const context = buildContext(data);

      // Historique sans le message système initial
      const history = messages
        .filter((m) => !(m.role === "assistant" && messages.indexOf(m) === 0))
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/ai-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          messages: [...history, { role: "user", content: question.trim() }],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();
      const reply = json.reply ?? "Aucune réponse reçue.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, timestamp: new Date() },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Une erreur s'est produite. Vérifiez que ANTHROPIC_API_KEY est définie dans votre fichier .env.local.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: C.teal,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 0 4px ${C.tealLight}, 0 8px 24px rgba(34,211,165,0.3)`,
          zIndex: 1000,
        }}
        title="Ouvrir l'assistant analytics"
      >
        <Brain size={22} color={C.bg} />
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 340,
        height: collapsed ? "auto" : 560,
        background: C.surface,
        border: `1px solid ${C.borderStrong}`,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
        transition: "height 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: collapsed ? "none" : `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          flexShrink: 0,
        }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: C.tealLight,
            border: `1px solid ${C.teal}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Brain size={18} color={C.teal} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.2,
            }}
          >
            Assistant Analytics
          </div>
          <div
            style={{
              fontSize: 10,
              color: C.teal,
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 2,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: C.teal,
                display: "inline-block",
              }}
            />
            Connecté aux données
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((v) => !v);
            }}
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.textMuted,
            }}
            title={collapsed ? "Agrandir" : "Réduire"}
          >
            {collapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              border: `1px solid ${C.border}`,
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.textMuted,
            }}
            title="Fermer"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 12px 4px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                {msg.role === "assistant" && (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      background: C.tealLight,
                      border: `1px solid ${C.teal}33`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Brain size={12} color={C.teal} />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "80%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      background:
                        msg.role === "user" ? "#0f2a3a" : C.surfaceAlt,
                      border: `1px solid ${msg.role === "user" ? `${C.teal}33` : C.border}`,
                      borderRadius:
                        msg.role === "user"
                          ? "12px 0 12px 12px"
                          : "0 12px 12px 12px",
                      padding: "9px 12px",
                      fontSize: 12.5,
                      color: msg.role === "user" ? "#e0f4ff" : C.textSub,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.content}
                  </div>
                  <span style={{ fontSize: 9, color: C.textMuted }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: C.tealLight,
                    border: `1px solid ${C.teal}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Brain size={12} color={C.teal} />
                </div>
                <div
                  style={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: "0 12px 12px 12px",
                    padding: "10px 14px",
                    display: "flex",
                    gap: 5,
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: C.teal,
                        animation: `bounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — uniquement au démarrage */}
          {messages.length === 1 && (
            <div
              style={{
                padding: "6px 12px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 5,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.textMuted,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 2,
                }}
              >
                <Sparkles size={10} />
                Suggestions
              </div>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => send(s.text)}
                  style={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 11.5,
                    color: C.textSub,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontFamily: "inherit",
                    transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      `${C.teal}44`;
                    (e.currentTarget as HTMLElement).style.color = C.text;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor =
                      C.border;
                    (e.currentTarget as HTMLElement).style.color = C.textSub;
                  }}
                >
                  <span>{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
              placeholder="Posez une question sur vos données…"
              disabled={loading}
              style={{
                flex: 1,
                background: C.surfaceAlt,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 12.5,
                color: C.text,
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                ((e.target as HTMLElement).style.borderColor = `${C.teal}66`)
              }
              onBlur={(e) =>
                ((e.target as HTMLElement).style.borderColor = C.border)
              }
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: input.trim() && !loading ? C.teal : C.surfaceAlt,
                border: "none",
                cursor: input.trim() && !loading ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s, transform 0.15s",
                flexShrink: 0,
              }}
            >
              <Send
                size={15}
                color={input.trim() && !loading ? C.bg : C.textMuted}
              />
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
