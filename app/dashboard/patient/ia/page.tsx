"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import api from "../../../../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  chips?: string[];
  analyse_rapide?: {
    specialite: string;
    urgence: string;
    score: number;
  } | null;
}

interface AnalyseResult {
  specialite: string;
  urgence: string;
  score: number;
  conseil: string;
  resume: string;
  symptomes_detectes: string[];
  localisation: string | null;
  duree: string | null;
  intensite: string | null;
  redirection_urgences: boolean;
  rapport_json: object;
}

export default function PatientIA() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis votre assistant médical IA 🤖\n\nJe peux analyser vos symptômes, vous orienter vers le bon spécialiste, ou répondre à vos questions médicales en français ou en Darja.\n\nComment puis-je vous aider aujourd'hui ?",
      timestamp: new Date().toISOString(),
      chips: [
        "J'ai des symptômes",
        "Prendre un RDV",
        "Mes ordonnances",
        "Urgence ?",
      ],
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "analyse">("chat");
  const [symptomes, setSymptomes] = useState("");
  const [analyse, setAnalyse] = useState<AnalyseResult | null>(null);
  const [analyseLoading, setAnalyseLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [rapportLoading, setRapportLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!token) router.push("/login");
  }, [token, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) return null;

  // ── SEND MESSAGE ──────────────────────────────────────────
  const sendMessage = async (texte?: string) => {
    const msg = (texte || input).trim();
    if (!msg || loading) return;

    const userMsg: Message = {
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("ia/chat/", {
        message: msg,
        historique: messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const assistantMsg: Message = {
        role: "assistant",
        content: res.data.reponse,
        timestamp: res.data.timestamp,
        chips: res.data.chips || [],
        analyse_rapide: res.data.analyse_rapide || null,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
          timestamp: new Date().toISOString(),
          chips: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── ANALYSE SYMPTÔMES ─────────────────────────────────────
  const analyserSymptomes = async () => {
    if (!symptomes.trim()) return;
    setAnalyseLoading(true);
    setAnalyse(null);
    try {
      const res = await api.post("ia/analyse/", { symptomes });
      setAnalyse(res.data);
    } catch {
      alert("Erreur lors de l'analyse.");
    } finally {
      setAnalyseLoading(false);
    }
  };

  // ── TÉLÉCHARGER RAPPORT PDF ───────────────────────────────
  const telechargerRapport = async () => {
    if (!analyse?.rapport_json) return;
    setRapportLoading(true);
    try {
      const res = await api.post(
        "ia/rapport/",
        { rapport: analyse.rapport_json },
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "rapport_preconsultation.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setRapportLoading(false);
    }
  };

  // ── MICRO (Speech to Text) ────────────────────────────────
  const toggleMic = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert(
        "Votre navigateur ne supporte pas la reconnaissance vocale. Utilisez Chrome.",
      );
      return;
    }
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = false;

    setIsRecording(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
  };

  const urgenceStyle = (score: number) => {
    if (score >= 5)
      return { bg: "#fee2e2", color: "#dc2626", label: "🚨 Critique" };
    if (score >= 3)
      return { bg: "#fef3c7", color: "#d97706", label: "⚠️ Moyenne" };
    return { bg: "#dcfce7", color: "#16a34a", label: "✅ Faible" };
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => (
      <span key={i}>
        {line.replace(/\*\*(.*?)\*\*/g, "$1")}
        {i < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#FAF7FF" }}>
      <Sidebar />

      <main
        style={{
          marginLeft: 260,
          flex: 1,
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #A861D8, #7C3AED)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                boxShadow: "0 4px 16px rgba(168,97,216,0.35)",
              }}
            >
              🤖
            </div>
            <div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  margin: 0,
                }}
              >
                Assistant Médical IA
              </h1>
              <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
                Analyse · Orientation · Pré-consultation · Disponible 24h/7j
              </p>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#dcfce7",
              borderRadius: 20,
              padding: "6px 14px",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#16a34a",
              }}
            />
            <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
              En ligne
            </span>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "chat", label: "💬 Chat intelligent" },
            { key: "analyse", label: "🔬 Analyser mes symptômes" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 14,
                transition: "all 0.2s",
                background:
                  activeTab === tab.key
                    ? "linear-gradient(135deg, #A861D8, #7C3AED)"
                    : "white",
                color: activeTab === tab.key ? "white" : "#6b7280",
                boxShadow:
                  activeTab === tab.key
                    ? "0 4px 12px rgba(168,97,216,0.3)"
                    : "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* TAB CHAT                                  */}
        {/* ══════════════════════════════════════════ */}
        {activeTab === "chat" && (
          <div
            style={{
              background: "white",
              borderRadius: 20,
              boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
              display: "flex",
              flexDirection: "column",
              minHeight: 560,
              flex: 1,
            }}
          >
            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {messages.map((msg, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexDirection:
                        msg.role === "user" ? "row-reverse" : "row",
                      alignItems: "flex-end",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        flexShrink: 0,
                        background:
                          msg.role === "assistant"
                            ? "linear-gradient(135deg, #A861D8, #7C3AED)"
                            : "linear-gradient(135deg, #44B6B2, #0891B2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                      }}
                    >
                      {msg.role === "assistant" ? "🤖" : "👤"}
                    </div>

                    {/* Bulle */}
                    <div style={{ maxWidth: "72%" }}>
                      <div
                        style={{
                          padding: "12px 16px",
                          borderRadius:
                            msg.role === "user"
                              ? "18px 18px 4px 18px"
                              : "18px 18px 18px 4px",
                          background:
                            msg.role === "user"
                              ? "linear-gradient(135deg, #A861D8, #7C3AED)"
                              : "#F8F4FF",
                          color: msg.role === "user" ? "white" : "#1a1a2e",
                          fontSize: 14,
                          lineHeight: 1.7,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                        }}
                      >
                        {renderContent(msg.content)}
                      </div>

                      {/* Analyse rapide inline */}
                      {msg.analyse_rapide && (
                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 20,
                              background: "rgba(168,97,216,0.1)",
                              color: "#A861D8",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            🏥 {msg.analyse_rapide.specialite}
                          </span>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 20,
                              background: urgenceStyle(msg.analyse_rapide.score)
                                .bg,
                              color: urgenceStyle(msg.analyse_rapide.score)
                                .color,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {urgenceStyle(msg.analyse_rapide.score).label}
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginTop: 4,
                          textAlign: msg.role === "user" ? "right" : "left",
                        }}
                      >
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Chips */}
                  {msg.chips &&
                    msg.chips.length > 0 &&
                    msg.role === "assistant" && (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 8,
                          marginLeft: 46,
                        }}
                      >
                        {msg.chips.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => sendMessage(chip)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 20,
                              border: "1.5px solid rgba(168,97,216,0.3)",
                              background: "rgba(168,97,216,0.06)",
                              color: "#A861D8",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLElement).style.background =
                                "rgba(168,97,216,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLElement).style.background =
                                "rgba(168,97,216,0.06)";
                            }}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div
                  style={{ display: "flex", gap: 10, alignItems: "flex-end" }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #A861D8, #7C3AED)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    🤖
                  </div>
                  <div
                    style={{
                      background: "#F8F4FF",
                      borderRadius: "18px 18px 18px 4px",
                      padding: "12px 18px",
                      display: "flex",
                      gap: 5,
                      alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#A861D8",
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input zone */}
            <div
              style={{
                borderTop: "1px solid #f3f4f6",
                padding: "1rem 1.5rem",
                display: "flex",
                gap: 10,
              }}
            >
              {/* Micro */}
              <button
                onClick={toggleMic}
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  border: "none",
                  background: isRecording
                    ? "linear-gradient(135deg, #ef4444, #dc2626)"
                    : "rgba(168,97,216,0.1)",
                  color: isRecording ? "white" : "#A861D8",
                  cursor: "pointer",
                  fontSize: 18,
                  flexShrink: 0,
                  boxShadow: isRecording
                    ? "0 0 0 4px rgba(239,68,68,0.2)"
                    : "none",
                  transition: "all 0.2s",
                }}
              >
                {isRecording ? "⏹" : "🎤"}
              </button>

              {/* Input */}
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
                placeholder="Décrivez vos symptômes ou posez une question..."
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 14,
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#A861D8")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />

              {/* Envoyer */}
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: input.trim()
                    ? "linear-gradient(135deg, #A861D8, #7C3AED)"
                    : "#e5e7eb",
                  color: "white",
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s",
                  flexShrink: 0,
                  boxShadow: input.trim()
                    ? "0 4px 12px rgba(168,97,216,0.3)"
                    : "none",
                }}
              >
                Envoyer →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* TAB ANALYSE                               */}
        {/* ══════════════════════════════════════════ */}
        {activeTab === "analyse" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Input */}
            <div
              style={{
                background: "white",
                borderRadius: 20,
                padding: "1.5rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  marginBottom: 6,
                }}
              >
                🔬 Décrivez vos symptômes
              </h3>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
                Soyez précis : localisation, durée, intensité. Ex: "J'ai mal à
                la tête depuis 3 jours, très intense, avec nausées."
              </p>

              {/* Suggestions rapides */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                {[
                  "Mal de tête intense depuis 3 jours",
                  "Douleur poitrine et essoufflement",
                  "Nausées et douleur ventre",
                  "Fatigue et anxiété depuis 2 semaines",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSymptomes(s)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "1px solid rgba(168,97,216,0.25)",
                      background: "rgba(168,97,216,0.06)",
                      color: "#A861D8",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <textarea
                  value={symptomes}
                  onChange={(e) => setSymptomes(e.target.value)}
                  placeholder="Décrivez en détail ce que vous ressentez..."
                  rows={4}
                  style={{
                    flex: 1,
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1.5px solid #e5e7eb",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#A861D8")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
                {/* Micro pour analyse */}
                <button
                  onClick={toggleMic}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    border: "none",
                    background: isRecording
                      ? "#ef4444"
                      : "rgba(168,97,216,0.1)",
                    color: isRecording ? "white" : "#A861D8",
                    cursor: "pointer",
                    fontSize: 20,
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                >
                  {isRecording ? "⏹" : "🎤"}
                </button>
              </div>

              <button
                onClick={analyserSymptomes}
                disabled={analyseLoading || !symptomes.trim()}
                style={{
                  marginTop: 12,
                  padding: "13px 28px",
                  borderRadius: 12,
                  border: "none",
                  background: symptomes.trim()
                    ? "linear-gradient(135deg, #A861D8, #7C3AED)"
                    : "#e5e7eb",
                  color: "white",
                  cursor: symptomes.trim() ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  fontSize: 15,
                  transition: "all 0.2s",
                  boxShadow: symptomes.trim()
                    ? "0 4px 12px rgba(168,97,216,0.3)"
                    : "none",
                }}
              >
                {analyseLoading
                  ? "⏳ Analyse en cours..."
                  : "🔬 Analyser mes symptômes"}
              </button>
            </div>

            {/* Résultat */}
            {analyse &&
              (() => {
                const urg = urgenceStyle(analyse.score);
                return (
                  <div
                    style={{
                      background: "white",
                      borderRadius: 20,
                      padding: "1.5rem",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#1a1a2e",
                          margin: 0,
                        }}
                      >
                        📋 Résultat de l'analyse
                      </h3>
                      <button
                        onClick={telechargerRapport}
                        disabled={rapportLoading}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 10,
                          border: "none",
                          background:
                            "linear-gradient(135deg, #1B6CA8, #0e4d7a)",
                          color: "white",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                          boxShadow: "0 2px 8px rgba(27,108,168,0.3)",
                        }}
                      >
                        {rapportLoading
                          ? "⏳ Génération..."
                          : "📄 Télécharger PDF"}
                      </button>
                    </div>

                    {/* Alerte urgence critique */}
                    {analyse.redirection_urgences && (
                      <div
                        style={{
                          background: "#fee2e2",
                          border: "1px solid #fca5a5",
                          borderRadius: 12,
                          padding: "1rem",
                          marginBottom: 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span style={{ fontSize: 28 }}>🚨</span>
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#dc2626",
                              fontSize: 15,
                            }}
                          >
                            Urgence critique détectée
                          </div>
                          <div style={{ color: "#dc2626", fontSize: 13 }}>
                            Appelez immédiatement le 190 (SAMU Tunisie) ou
                            rendez-vous aux urgences.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cards résumé */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(168,97,216,0.07)",
                          borderRadius: 14,
                          padding: "1rem",
                          border: "1px solid rgba(168,97,216,0.15)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            fontWeight: 700,
                            marginBottom: 4,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Spécialité recommandée
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#A861D8",
                          }}
                        >
                          🏥 {analyse.specialite}
                        </div>
                      </div>

                      <div
                        style={{
                          background: urg.bg,
                          borderRadius: 14,
                          padding: "1rem",
                          border: `1px solid ${urg.color}44`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            fontWeight: 700,
                            marginBottom: 4,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Niveau d'urgence
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: urg.color,
                          }}
                        >
                          {urg.label}
                        </div>
                        <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div
                              key={n}
                              style={{
                                flex: 1,
                                height: 5,
                                borderRadius: 3,
                                background:
                                  n <= analyse.score ? urg.color : "#e5e7eb",
                                transition: "background 0.3s",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Symptômes détectés */}
                    {analyse.symptomes_detectes.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#374151",
                            marginBottom: 8,
                          }}
                        >
                          Symptômes détectés :
                        </div>
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {analyse.symptomes_detectes.map((s) => (
                            <span
                              key={s}
                              style={{
                                padding: "4px 12px",
                                borderRadius: 20,
                                background: "rgba(168,97,216,0.1)",
                                color: "#A861D8",
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Détails NER */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      {[
                        {
                          label: "📍 Localisation",
                          value: analyse.localisation || "Non précisée",
                        },
                        {
                          label: "⏱ Durée",
                          value: analyse.duree || "Non précisée",
                        },
                        {
                          label: "💪 Intensité",
                          value: analyse.intensite || "Non précisée",
                        },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          style={{
                            background: "#f9fafb",
                            borderRadius: 10,
                            padding: "10px 12px",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginBottom: 2,
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Conseil */}
                    <div
                      style={{
                        background: urg.bg,
                        borderRadius: 12,
                        padding: "1rem",
                        border: `1px solid ${urg.color}33`,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: urg.color,
                          marginBottom: 4,
                        }}
                      >
                        CONSEIL
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          color: "#374151",
                          margin: 0,
                          lineHeight: 1.6,
                        }}
                      >
                        {analyse.conseil}
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() =>
                          router.push("/dashboard/patient/rendezvous")
                        }
                        style={{
                          flex: 1,
                          padding: "12px",
                          borderRadius: 12,
                          border: "none",
                          background:
                            "linear-gradient(135deg, #A861D8, #7C3AED)",
                          color: "white",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 14,
                          boxShadow: "0 4px 12px rgba(168,97,216,0.3)",
                        }}
                      >
                        📅 Prendre RDV en {analyse.specialite}
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("chat");
                          setTimeout(
                            () =>
                              sendMessage(
                                `J'ai analysé mes symptômes : ${symptomes}. Que me conseillez-vous ?`,
                              ),
                            100,
                          );
                        }}
                        style={{
                          padding: "12px 20px",
                          borderRadius: 12,
                          border: "1.5px solid rgba(168,97,216,0.3)",
                          background: "white",
                          color: "#A861D8",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        💬 Discuter avec l'IA
                      </button>
                    </div>
                  </div>
                );
              })()}

            {/* Capacités */}
            <div
              style={{
                background: "white",
                borderRadius: 20,
                padding: "1.5rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  marginBottom: 14,
                }}
              >
                Capacités de l'assistant IA
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                }}
              >
                {[
                  {
                    icon: "🔬",
                    title: "Analyse symptômes",
                    desc: "NER médical précis",
                  },
                  {
                    icon: "🏥",
                    title: "Orientation spécialité",
                    desc: "12 spécialités couvertes",
                  },
                  {
                    icon: "⚡",
                    title: "Score d'urgence",
                    desc: "Évaluation 1 à 5",
                  },
                  {
                    icon: "📄",
                    title: "Rapport PDF",
                    desc: "Pour votre médecin",
                  },
                  {
                    icon: "🌍",
                    title: "Français & Darja",
                    desc: "Dialecte tunisien",
                  },
                  { icon: "🕐", title: "24h/7j", desc: "Toujours disponible" },
                ].map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    style={{
                      background: "#FAF7FF",
                      borderRadius: 12,
                      padding: "1rem",
                      border: "1px solid rgba(168,97,216,0.1)",
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1a1a2e",
                        marginBottom: 2,
                      }}
                    >
                      {title}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
