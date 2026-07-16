"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (Identiques à la maquette de référence — palette violette)
// ─────────────────────────────────────────────────────────────
const T = {
  bg: "#F0F4F1",
  surface: "#FFFFFF",
  border: "#E2EAE5",
  borderMid: "#D6D1FB",
  accent: "#6C63FF",
  accentLight: "#EEECFF",
  accentDark: "#4B3FD1",
  online: "#22C55E",
  textPrimary: "#0F1F18",
  textMuted: "#4A5C52",
  textLight: "#8A9A92",
  font: "'Plus Jakarta Sans', -apple-system, sans-serif",
  radius: "8px",
  radiusLg: "12px",
};

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

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
        "Bonjour ! Je suis votre assistant médical IA.\n\nJe peux analyser vos symptômes, vous orienter vers le bon spécialiste, ou répondre à vos questions médicales en français ou en Darja.\n\nComment puis-je vous aider aujourd'hui ?",
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
        { responseType: "blob" },
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
      return {
        bg: "#FEF2F2",
        color: "#EF4444",
        border: "#FCA5A5",
        label: "Critique",
      };
    if (score >= 3)
      return {
        bg: "#FFFBEB",
        color: "#D97706",
        border: "#FDE68A",
        label: "Moyenne",
      };
    return {
      bg: T.accentLight,
      color: T.accent,
      border: T.borderMid,
      label: "Faible",
    };
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => (
      <span key={i}>
        {line.replace(/\*\*(.*?)\*\*/g, "$1")}
        {i < content.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  return (
    <PrivateRoute allowedRoles={["patient"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-5px); opacity: 1; } }

        .pg-root { min-height:100vh; background:${T.bg}; font-family:${T.font}; display:flex; }
        .pg-main { margin-left:260px; flex:1; padding:1.5rem; padding-top:calc(52px + 1.5rem); display:flex; flex-direction:column; gap:12px; }

        /* Header */
        .pg-header { display:flex; align-items:center; justify-content:space-between; }
        .pg-title  { font-size:20px; font-weight:800; color:${T.textPrimary}; }
        .pg-sub    { font-size:12px; color:${T.textLight}; margin-top:2px; display:flex; align-items:center; gap:6px; }

        /* Cards & Surfaces */
        .card-surface { background:${T.surface}; border:0.5px solid ${T.border}; border-radius:${T.radiusLg}; overflow:hidden; transition:border-color .15s, box-shadow .15s; }
        
        /* Stat Icon */
        .stat-icon { width:34px; height:34px; border-radius:8px; background:${T.accentLight}; border:0.5px solid ${T.borderMid}; display:flex; align-items:center; justify-content:center; color:${T.accentDark}; font-size:16px; flex-shrink:0; }
        
        /* Badge */
        .li-badge { font-size:10px; font-weight:700; color:${T.accentDark}; background:${T.accentLight}; border:0.5px solid ${T.borderMid}; padding:2px 8px; border-radius:20px; flex-shrink:0; display:inline-flex; align-items:center; gap:4px; cursor:default; transition: all .12s; }
        .li-badge:hover { background:${T.borderMid}; }
        
        /* Inputs & Forms */
        .form-input { width:100%; padding:8px 12px; border-radius:${T.radius}; border:0.5px solid ${T.border}; background:${T.surface}; font-family:${T.font}; font-size:13px; color:${T.textPrimary}; outline:none; transition:border-color .15s; }
        .form-input:focus { border-color:${T.borderMid}; }
        .form-input::placeholder { color:${T.textLight}; }
        
        /* Buttons */
        .btn-primary { background:${T.accent}; color:white; border:none; border-radius:${T.radius}; padding:8px 14px; font-size:12px; font-weight:600; font-family:${T.font}; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all .12s; }
        .btn-primary:hover { background:${T.accentDark}; }
        .btn-primary:disabled { opacity:.45; cursor:not-allowed; }
        
        .btn-exp { flex:1; background:${T.surface}; border:0.5px solid ${T.border}; border-radius:${T.radius}; color:${T.textMuted}; font-size:12px; padding:8px 6px; cursor:pointer; font-family:${T.font}; display:flex; align-items:center; justify-content:center; gap:5px; font-weight:600; transition:all .12s; }
        .btn-exp:hover { background:${T.accentLight}; border-color:${T.borderMid}; color:${T.accentDark}; }
        
        .btn-sec { background:transparent; border:0.5px solid ${T.border}; border-radius:${T.radius}; color:${T.textMuted}; font-size:12px; padding:8px 14px; cursor:pointer; font-family:${T.font}; display:inline-flex; align-items:center; gap:6px; transition:all .12s; font-weight:600; }
        .btn-sec:hover { background:${T.accentLight}; border-color:${T.borderMid}; color:${T.accentDark}; }

        /* Error */
        .error-box { font-size:11px; color:#DC2626; background:#FEF2F2; border:0.5px solid #FCA5A5; border-radius:${T.radius}; padding:10px 12px; display:flex; align-items:center; gap:8px; font-weight:600; }

        /* Filters */
        .filter-btn { background:${T.surface}; border:0.5px solid ${T.border}; border-radius:${T.radius}; padding:8px 12px; color:${T.textMuted}; font-size:12px; font-weight:600; font-family:${T.font}; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .12s; }
        .filter-btn:hover { background:${T.accentLight}; border-color:${T.borderMid}; color:${T.accentDark}; }
        .filter-btn.active { background:${T.accent}; border-color:${T.accent}; color:#fff; }
      `}</style>

      <div className="pg-root">
        <Sidebar
          stats={{
            rendezvous: 0,
            consultations: 0,
            ordonnances: 0,
            notifications: 0,
          }}
        />
        <Navbar
          title="Assistant Médical IA"
          subtitle="Analyse · Orientation · Pré-consultation"
        />

        <main className="pg-main">
          {/* Header Status */}
          <div className="pg-header" style={{ animation: "fadeUp .3s ease" }}>
            <div>
              <div className="pg-title">Assistant Médical IA</div>
              <div className="pg-sub">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: T.online,
                    display: "inline-block",
                  }}
                />
                Disponible 24h/7j
              </div>
            </div>
            <div
              className="li-badge"
              style={{ padding: "4px 12px", fontSize: "11px" }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: T.online,
                }}
              ></span>
              En ligne
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              animation: "fadeUp .3s .07s ease backwards",
            }}
          >
            {[
              {
                key: "chat",
                label: "Chat intelligent",
                icon: "ti-message-chatbot",
              },
              {
                key: "analyse",
                label: "Analyser mes symptômes",
                icon: "ti-microscope",
              },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`filter-btn${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key as any)}
              >
                <i
                  className={`ti ${tab.icon}`}
                  style={{ fontSize: 14 }}
                  aria-hidden="true"
                />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* TAB CHAT                                  */}
          {/* ══════════════════════════════════════════ */}
          {activeTab === "chat" && (
            <div
              className="card-surface"
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: 500,
                flex: 1,
                animation: "fadeUp .3s .1s ease backwards",
              }}
            >
              {/* Messages Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  background: T.bg,
                  borderBottom: `0.5px solid ${T.border}`,
                }}
              >
                {messages.map((msg, i) => (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexDirection:
                          msg.role === "user" ? "row-reverse" : "row",
                        alignItems: "flex-end",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="stat-icon"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          fontSize: 14,
                          background:
                            msg.role === "assistant" ? T.accentLight : T.accent,
                          color:
                            msg.role === "assistant" ? T.accentDark : "#fff",
                          border: `0.5px solid ${msg.role === "assistant" ? T.borderMid : T.accent}`,
                        }}
                      >
                        <i
                          className={`ti ${msg.role === "assistant" ? "ti-robot" : "ti-user"}`}
                          aria-hidden="true"
                        />
                      </div>

                      {/* Bubble */}
                      <div style={{ maxWidth: "72%" }}>
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius:
                              msg.role === "user"
                                ? "12px 2px 12px 12px"
                                : "2px 12px 12px 12px",
                            background:
                              msg.role === "user" ? T.accent : T.surface,
                            color: msg.role === "user" ? "#fff" : T.textPrimary,
                            fontSize: 13,
                            lineHeight: 1.6,
                            border: `0.5px solid ${msg.role === "user" ? T.accent : T.border}`,
                            boxShadow: "0 1px 2px rgba(13,75,55,0.05)",
                          }}
                        >
                          {renderContent(msg.content)}
                        </div>

                        {/* Analyse rapide inline */}
                        {msg.analyse_rapide && (
                          <div
                            style={{
                              marginTop: 6,
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            <span className="li-badge">
                              <i
                                className="ti ti-hospital"
                                style={{ fontSize: 10 }}
                              />{" "}
                              {msg.analyse_rapide.specialite}
                            </span>
                            <span
                              className="li-badge"
                              style={{
                                background: urgenceStyle(
                                  msg.analyse_rapide.score,
                                ).bg,
                                color: urgenceStyle(msg.analyse_rapide.score)
                                  .color,
                                borderColor: urgenceStyle(
                                  msg.analyse_rapide.score,
                                ).border,
                              }}
                            >
                              {urgenceStyle(msg.analyse_rapide.score).label}
                            </span>
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: 10,
                            color: T.textLight,
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
                            gap: 6,
                            flexWrap: "wrap",
                            marginTop: 6,
                            marginLeft: 38,
                          }}
                        >
                          {msg.chips.map((chip) => (
                            <button
                              key={chip}
                              className="li-badge"
                              style={{ cursor: "pointer" }}
                              onClick={() => sendMessage(chip)}
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
                    style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
                  >
                    <div
                      className="stat-icon"
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        fontSize: 14,
                        background: T.accentLight,
                        color: T.accentDark,
                        border: `0.5px solid ${T.borderMid}`,
                      }}
                    >
                      <i className="ti ti-robot" aria-hidden="true" />
                    </div>
                    <div
                      style={{
                        background: T.surface,
                        borderRadius: "2px 12px 12px 12px",
                        padding: "10px 16px",
                        display: "flex",
                        gap: 4,
                        alignItems: "center",
                        border: `0.5px solid ${T.border}`,
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: T.accent,
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
                  padding: "10px 14px",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  background: T.surface,
                }}
              >
                {/* Micro */}
                <button
                  onClick={toggleMic}
                  className="stat-icon"
                  style={{
                    cursor: "pointer",
                    background: isRecording ? "#FEF2F2" : T.accentLight,
                    color: isRecording ? "#EF4444" : T.accentDark,
                    border: isRecording
                      ? "1px solid #FCA5A5"
                      : `0.5px solid ${T.borderMid}`,
                    transition: "all .15s",
                  }}
                >
                  <i
                    className={`ti ${isRecording ? "ti-player-stop" : "ti-microphone"}`}
                    aria-hidden="true"
                  />
                </button>

                {/* Input */}
                <input
                  ref={inputRef}
                  className="form-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  placeholder="Décrivez vos symptômes ou posez une question..."
                  style={{ flex: 1 }}
                />

                {/* Envoyer */}
                <button
                  className="btn-primary"
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                >
                  <i
                    className="ti ti-send"
                    style={{ fontSize: 14 }}
                    aria-hidden="true"
                  />
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════ */}
          {/* TAB ANALYSE                               */}
          {/* ══════════════════════════════════════════ */}
          {activeTab === "analyse" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                animation: "fadeUp .3s .1s ease backwards",
              }}
            >
              {/* Input Card */}
              <div className="card-surface" style={{ padding: "14px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.textPrimary,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <i
                      className="ti ti-microscope"
                      style={{ fontSize: 14, color: T.accent }}
                    />{" "}
                    Décrivez vos symptômes
                  </span>
                </div>
                <p
                  style={{
                    color: T.textLight,
                    fontSize: 11,
                    margin: 0,
                    marginBottom: 10,
                  }}
                >
                  Soyez précis : localisation, durée, intensité.
                </p>

                {/* Suggestions rapides */}
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 8,
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
                      className="li-badge"
                      style={{ cursor: "pointer" }}
                      onClick={() => setSymptomes(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div
                  style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
                >
                  <textarea
                    className="form-input"
                    value={symptomes}
                    onChange={(e) => setSymptomes(e.target.value)}
                    placeholder="Décrivez en détail ce que vous ressentez..."
                    rows={3}
                    style={{ resize: "vertical", minHeight: 60, flex: 1 }}
                  />
                  {/* Micro pour analyse */}
                  <button
                    onClick={toggleMic}
                    className="stat-icon"
                    style={{
                      cursor: "pointer",
                      background: isRecording ? "#FEF2F2" : T.accentLight,
                      color: isRecording ? "#EF4444" : T.accentDark,
                      border: isRecording
                        ? "1px solid #FCA5A5"
                        : `0.5px solid ${T.borderMid}`,
                    }}
                  >
                    <i
                      className={`ti ${isRecording ? "ti-player-stop" : "ti-microphone"}`}
                      style={{ fontSize: 16 }}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <button
                  className="btn-primary"
                  onClick={analyserSymptomes}
                  disabled={analyseLoading || !symptomes.trim()}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    justifyContent: "center",
                    padding: "10px",
                  }}
                >
                  <i className="ti ti-microscope" style={{ fontSize: 14 }} />
                  {analyseLoading
                    ? "Analyse en cours..."
                    : "Analyser mes symptômes"}
                </button>
              </div>

              {/* Résultat */}
              {analyse &&
                (() => {
                  const urg = urgenceStyle(analyse.score);
                  return (
                    <div className="card-surface" style={{ padding: "14px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: T.textPrimary,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <i
                            className="ti ti-clipboard-list"
                            style={{ fontSize: 14, color: T.accent }}
                          />{" "}
                          Résultat de l'analyse
                        </span>
                        <button
                          className="btn-exp"
                          style={{ flex: "none", padding: "6px 12px" }}
                          onClick={telechargerRapport}
                          disabled={rapportLoading}
                        >
                          <i
                            className="ti ti-file-type-pdf"
                            style={{ fontSize: 13 }}
                          />{" "}
                          {rapportLoading ? "Génération..." : "PDF"}
                        </button>
                      </div>

                      {/* Alerte urgence critique */}
                      {analyse.redirection_urgences && (
                        <div className="error-box" style={{ marginBottom: 12 }}>
                          <i
                            className="ti ti-alert-triangle"
                            style={{ fontSize: 18, flexShrink: 0 }}
                            aria-hidden="true"
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 12 }}>
                              Urgence critique détectée
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 400 }}>
                              Appelez immédiatement le 190 (SAMU) ou rendez-vous
                              aux urgences.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cards résumé */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            background: T.accentLight,
                            borderRadius: T.radiusLg,
                            padding: "10px 12px",
                            border: `0.5px solid ${T.borderMid}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: T.textLight,
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
                              fontSize: 14,
                              fontWeight: 700,
                              color: T.accentDark,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <i
                              className="ti ti-hospital"
                              style={{ fontSize: 16 }}
                            />{" "}
                            {analyse.specialite}
                          </div>
                        </div>

                        <div
                          style={{
                            background: urg.bg,
                            borderRadius: T.radiusLg,
                            padding: "10px 12px",
                            border: `0.5px solid ${urg.border}`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: T.textLight,
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
                              fontSize: 14,
                              fontWeight: 700,
                              color: urg.color,
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <i
                              className="ti ti-activity"
                              style={{ fontSize: 16 }}
                            />{" "}
                            {urg.label}
                          </div>
                          <div
                            style={{ display: "flex", gap: 3, marginTop: 6 }}
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <div
                                key={n}
                                style={{
                                  flex: 1,
                                  height: 4,
                                  borderRadius: 2,
                                  background:
                                    n <= analyse.score ? urg.color : T.border,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Symptômes détectés */}
                      {analyse.symptomes_detectes.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: T.textMuted,
                              marginBottom: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <i
                              className="ti ti-list-search"
                              style={{ fontSize: 13 }}
                            />{" "}
                            Symptômes détectés :
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {analyse.symptomes_detectes.map((s) => (
                              <span key={s} className="li-badge">
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
                          gap: 6,
                          marginBottom: 10,
                        }}
                      >
                        {[
                          {
                            label: "Localisation",
                            value: analyse.localisation || "Non précisée",
                            icon: "ti-map-pin",
                          },
                          {
                            label: "Durée",
                            value: analyse.duree || "Non précisée",
                            icon: "ti-clock",
                          },
                          {
                            label: "Intensité",
                            value: analyse.intensite || "Non précisée",
                            icon: "ti-barbell",
                          },
                        ].map(({ label, value, icon }) => (
                          <div
                            key={label}
                            style={{
                              background: T.bg,
                              borderRadius: T.radius,
                              padding: "8px 10px",
                              border: `0.5px solid ${T.border}`,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 10,
                                color: T.textLight,
                                marginBottom: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <i
                                className={`ti ${icon}`}
                                style={{ fontSize: 11 }}
                              />{" "}
                              {label}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: T.textPrimary,
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
                          borderRadius: T.radius,
                          padding: "10px 12px",
                          border: `0.5px solid ${urg.border}`,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: urg.color,
                            marginBottom: 4,
                            letterSpacing: "0.5px",
                          }}
                        >
                          CONSEIL
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: T.textPrimary,
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {analyse.conseil}
                        </p>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn-primary"
                          onClick={() =>
                            router.push("/dashboard/patient/rendezvous")
                          }
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            padding: "10px",
                          }}
                        >
                          <i
                            className="ti ti-calendar-event"
                            style={{ fontSize: 14 }}
                          />{" "}
                          Prendre RDV en {analyse.specialite}
                        </button>
                        <button
                          className="btn-sec"
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
                        >
                          <i
                            className="ti ti-message-chatbot"
                            style={{ fontSize: 14 }}
                          />{" "}
                          Discuter
                        </button>
                      </div>
                    </div>
                  );
                })()}

              {/* Capacités */}
              <div className="card-surface" style={{ padding: "14px" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.textPrimary,
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <i
                    className="ti ti-sparkles"
                    style={{ fontSize: 14, color: T.accent }}
                  />{" "}
                  Capacités de l'assistant IA
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                  }}
                >
                  {[
                    {
                      icon: "ti-flask",
                      title: "Analyse symptômes",
                      desc: "NER médical précis",
                    },
                    {
                      icon: "ti-hospital",
                      title: "Orientation",
                      desc: "12 spécialités couvertes",
                    },
                    {
                      icon: "ti-bolt",
                      title: "Score d'urgence",
                      desc: "Évaluation 1 à 5",
                    },
                    {
                      icon: "ti-file-type-pdf",
                      title: "Rapport PDF",
                      desc: "Pour votre médecin",
                    },
                    {
                      icon: "ti-language",
                      title: "Français & Darja",
                      desc: "Dialecte tunisien",
                    },
                    {
                      icon: "ti-clock-24",
                      title: "24h/7j",
                      desc: "Toujours disponible",
                    },
                  ].map(({ icon, title, desc }) => (
                    <div
                      key={title}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                        padding: 8,
                        background: T.bg,
                        borderRadius: T.radius,
                        border: `0.5px solid ${T.border}`,
                      }}
                    >
                      <div
                        className="stat-icon"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        <i className={`ti ${icon}`} />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: T.textPrimary,
                          }}
                        >
                          {title}
                        </div>
                        <div style={{ fontSize: 10, color: T.textLight }}>
                          {desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </PrivateRoute>
  );
}
