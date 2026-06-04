"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface Medecin {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface Message {
  id: number;
  sender: number;
  receiver: number;
  content: string;
  timestamp: string;
  is_read: boolean;
}

// ─────────────────────────────────────────────────────────────
// PAGE MESSAGERIE MÉDECIN
// ─────────────────────────────────────────────────────────────

export default function MedecinMessages() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [activeMedecin, setActiveMedecin] = useState<Medecin | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Récupérer la liste des médecins
  useEffect(() => {
    if (isLoading) return;
    if (!token) { router.push("/login"); return; }

    api.get("medecins/")
      .then((r) => {
        // Exclure l'utilisateur actuel de la liste des contacts
        const others = (r.data.results || r.data).filter((m: Medecin) => m.id !== user?.id);
        setMedecins(others);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, isLoading, user]);

  // Récupérer les messages de la conversation active (Polling)
  useEffect(() => {
    if (!activeMedecin) return;

    const fetchMessages = () => {
      api.get(`messages/?contact=${activeMedecin.id}`)
        .then((r) => {
          const msgs = r.data.results || r.data;
          setMessages(msgs);
          
          // Marquer les messages reçus comme lus
          msgs.forEach((msg: Message) => {
            if (msg.sender === activeMedecin.id && !msg.is_read) {
              api.patch(`messages/${msg.id}/mark_as_read/`).catch(() => {});
            }
          });
        })
        .catch(() => {});
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // Vérification toutes les 4 sec
    return () => clearInterval(interval);
  }, [activeMedecin]);

  // Défilement automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeMedecin) return;

    console.log("📤 Envoi message:", {
      receiver: activeMedecin.id,
      content: newMessage.trim(),
    });

    try {
      const res = await api.post("messages/", {
        receiver: activeMedecin.id,
        content: newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err: any) {
      console.error("❌ Erreur détaillée:", err.response?.data);
    }
  };
  const getMedecinName = (m: Medecin) => 
    `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.username;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) return null;

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .main-gradient-bg {
          background: linear-gradient(135deg, #FDF4FF 0%, #ECFDF5 100%);
          min-height: 100vh;
        }
        .text-gradient {
          background: linear-gradient(135deg, #8B5CF6, #10B981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .contact-item {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border-radius: 16px;
          cursor: pointer; transition: all 0.2s;
          border: 1px solid transparent;
        }
        .contact-item:hover { background: rgba(139, 92, 246, 0.05); }
        .contact-item.active { 
          background: rgba(139, 92, 246, 0.08); 
          border-color: rgba(139, 92, 246, 0.2); 
        }
        .msg-bubble {
          max-width: 75%; padding: 12px 16px; border-radius: 18px;
          font-size: 14px; line-height: 1.5; animation: slideUp 0.2s ease;
          position: relative;
        }
        .msg-sent {
          background: linear-gradient(135deg, #8B5CF6, #06C98B);
          color: white; border-bottom-right-radius: 4px; margin-left: auto;
        }
        .msg-received {
          background: rgba(255, 255, 255, 0.9); color: #1e1b4b;
          border: 1px solid rgba(0,0,0,0.05); border-bottom-left-radius: 4px;
        }
        .chat-input {
          width: 100%; padding: 14px 18px; border-radius: 16px;
          background: rgba(248, 250, 252, 0.9); border: 1px solid rgba(0,0,0,0.07);
          font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none;
          transition: all 0.3s;
        }
        .chat-input:focus { border-color: #8B5CF6; box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.08); }
      `}</style>

      <div className="main-gradient-bg" style={{ display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
        <Sidebar stats={{ rendezvous: 0, consultations: 0, ordonnances: 0 }} />
        <Navbar title="Messagerie" subtitle="Communication entre médecins" />

        <main style={{ marginLeft: 240, flex: 1, padding: "2rem", paddingTop: "100px" }}>
          <h1 className="text-gradient" style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, margin: 0, marginBottom: 24 }}>
            Discussion Directe
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, height: "calc(100vh - 200px)" }}>
            
            {/* PANNEAU GAUCHE : LISTE DES CONTACTS */}
            <div className="glass-card" style={{ padding: "16px", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "0 8px" }}>
                <span style={{ fontSize: 18 }}>👨‍⚕️</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e1b4b", margin: 0 }}>Mes Collègues</h3>
              </div>
              
              {medecins.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 40 }}>Aucun autre médecin inscrit.</p>
              ) : (
                medecins.map((m) => (
                  <div 
                    key={m.id} 
                    className={`contact-item ${activeMedecin?.id === m.id ? "active" : ""}`}
                    onClick={() => setActiveMedecin(m)}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: activeMedecin?.id === m.id ? "linear-gradient(135deg, #8B5CF6, #10B981)" : "rgba(139, 92, 246, 0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: activeMedecin?.id === m.id ? "white" : "#8B5CF6",
                      fontWeight: 700, fontSize: 16
                    }}>
                      {getMedecinName(m).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#1e1b4b" }}>Dr. {getMedecinName(m)}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.email || "En ligne"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* PANNEAU DROIT : FENÊTRE DE CHAT */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              
              {!activeMedecin ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 60, marginBottom: 16 }}>💬</span>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#334155" }}>Sélectionnez un collègue</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14 }}>Choisissez un médecin pour commencer une discussion.</p>
                </div>
              ) : (
                <>
                  {/* En-tête du chat */}
                  <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 700, fontSize: 16
                    }}>
                      {getMedecinName(activeMedecin).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#1e1b4b" }}>Dr. {getMedecinName(activeMedecin)}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#10B981", fontWeight: 600 }}>Discussion privée et sécurisée</p>
                    </div>
                  </div>

                  {/* Zone des messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "12px", background: "rgba(250, 250, 255, 0.4)" }}>
                    {messages.map((msg) => (
                      <div key={msg.id} style={{ display: "flex", justifyContent: msg.sender === user?.id ? "flex-end" : "flex-start" }}>
                        <div className={`msg-bubble ${msg.sender === user?.id ? "msg-sent" : "msg-received"}`}>
                          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                          <p style={{ 
                            margin: 0, marginTop: 6, fontSize: 10, textAlign: "right",
                            opacity: 0.7, fontWeight: 600 
                          }}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Zone de saisie */}
                  <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "white" }}>
                    <form onSubmit={handleSend} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {/* Bouton partage médical (fictif pour l'UI, à connecter plus tard) */}
                      <button 
                        type="button" 
                        title="Partager une info médicale"
                        style={{ 
                          width: 44, height: 44, borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)", 
                          background: "rgba(248, 250, 252, 0.9)", cursor: "pointer", fontSize: 18, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      >
                        🩺
                      </button>
                      
                      <input 
                        type="text" 
                        className="chat-input" 
                        placeholder="Écrire un message..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        autoComplete="off"
                      />
                      
                      <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        style={{
                          width: 44, height: 44, borderRadius: 12, border: "none",
                          background: newMessage.trim() ? "linear-gradient(135deg, #8B5CF6, #06C98B)" : "#e2e8f0",
                          color: newMessage.trim() ? "white" : "#94a3b8",
                          cursor: newMessage.trim() ? "pointer" : "not-allowed",
                          fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                      >
                        ➤
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </PrivateRoute>
  );
}