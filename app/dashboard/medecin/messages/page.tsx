"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import Sidebar from "../../../../components/Sidebar";
import Navbar from "../../../../components/Navbar";
import PrivateRoute from "../../../../components/PrivateRoute";
import api from "../../../../lib/api";

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
  file?: string;
  file_name?: string;
  file_type?: string;
}

const MY_PALETTE = {
  bg: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
  text: "white" as const,
  meta: "rgba(255,255,255,0.7)",
};

const THEIR_PALETTE = {
  bg: "#F0FDF4",
  border: "#86EFAC",
  text: "#14532D",
  meta: "rgba(20,83,45,0.55)",
};

function extractId(obj: any): number | null {
  if (!obj) return null;
  const candidates = [
    obj?.id, obj?.user_id, obj?.pk,
    obj?.user?.id, obj?.user?.user_id, obj?.user?.pk,
    obj?.data?.id, obj?.data?.user_id,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (!isNaN(n) && n > 0) return n;
  }
  return null;
}

function MedecinMessagesInner() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [filteredMedecins, setFilteredMedecins] = useState<Medecin[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMedecin, setActiveMedecin] = useState<Medecin | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const idFromContext = extractId(user);
    if (idFromContext) { setCurrentUserId(idFromContext); return; }
    if (!token) return;
    api.get("users/me/")
      .then((r) => {
        const id = extractId(r.data);
        if (id) setCurrentUserId(id);
        else setCurrentUserId(-1);
      })
      .catch(() => setCurrentUserId(-1));
  }, [user, token]);

  const isMine = (senderId: number) =>
    currentUserId !== null && Number(senderId) === Number(currentUserId);

  useEffect(() => {
    if (isLoading || !token) return;
    api.get("medecins/")
      .then((r) => {
        const all: Medecin[] = r.data.results || r.data;
        const unique = all.filter((m, i, s) => s.findIndex((x) => x.id === m.id) === i);
        setMedecins(unique);
        setFilteredMedecins(unique);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, isLoading]);

  useEffect(() => {
    if (currentUserId === null) return;
    setMedecins(prev => prev.filter(m => Number(m.id) !== currentUserId));
    setFilteredMedecins(prev => prev.filter(m => Number(m.id) !== currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    if (!medecins.length) return;
    const contactId = searchParams.get("contact");
    if (!contactId) return;
    const found = medecins.find((m) => m.id === parseInt(contactId));
    if (found) setActiveMedecin(found);
  }, [medecins, searchParams]);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredMedecins(medecins); return; }
    const q = searchQuery.toLowerCase();
    setFilteredMedecins(
      medecins.filter((m) =>
        getMedecinName(m).toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q)
      )
    );
  }, [searchQuery, medecins]);

  useEffect(() => {
    if (!activeMedecin || currentUserId === null) return;
    let isMounted = true;

    const fetchMessages = () => {
      api.get(`messages/?contact=${activeMedecin.id}`)
        .then((r) => {
          if (!isMounted) return;
          const msgs: Message[] = r.data.results || r.data;
          setMessages((prev) => {
            if (msgs.length > prevMessageCount.current && prevMessageCount.current > 0) {
              const newMsgs = msgs.slice(prevMessageCount.current);
              if (newMsgs.some((m) => !isMine(m.sender) && !m.is_read)) {
                showNotif(
                  `Dr. ${getMedecinName(activeMedecin)}`,
                  newMsgs.find((m) => !isMine(m.sender))?.content || "Nouveau message"
                );
              }
            }
            prevMessageCount.current = msgs.length;
            return msgs;
          });
          msgs.forEach((msg) => {
            if (!isMine(msg.sender) && !msg.is_read)
              api.patch(`messages/${msg.id}/mark_as_read/`).catch(() => {});
          });
        })
        .catch(() => {});
    };

    prevMessageCount.current = 0;
    setMessages([]);
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [activeMedecin, currentUserId]);

  useEffect(() => {
    if (!token || !medecins.length) return;
    const fn = () =>
      api.get("messages/unread_by_contact/")
        .then((r) => setUnreadCounts(r.data))
        .catch(() => {});
    fn();
    const interval = setInterval(fn, 8000);
    return () => clearInterval(interval);
  }, [medecins, token]);

  const showNotif = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted")
      new Notification(title, { body, icon: "/favicon.ico" });
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default")
      Notification.requestPermission();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeMedecin) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("receiver", String(activeMedecin.id));
        formData.append("file", selectedFile);
        formData.append("content", content);

        await api.post("messages/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        clearFile();
      } else {
        await api.post("messages/", {
          receiver: activeMedecin.id,
          content,
        });
      }

      const r = await api.get(`messages/?contact=${activeMedecin.id}`);
      const msgs: Message[] = r.data.results || r.data;
      prevMessageCount.current = msgs.length;
      setMessages(msgs);

    } catch (err: any) {
      setNewMessage(content);
      console.error("❌ Status:", err?.response?.status);
      console.error("❌ Data:", JSON.stringify(err?.response?.data, null, 2));
    } finally {
      setSending(false);
    }
  };

  const getMedecinName = (m: Medecin) =>
    `${m.first_name || ""} ${m.last_name || ""}`.trim() || m.username;

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const getMyInitial = () => {
    const u = user as any;
    return u?.first_name?.charAt(0)?.toUpperCase() || u?.username?.charAt(0)?.toUpperCase() || "M";
  };

  const renderFile = (msg: Message, sent: boolean) => {
    if (!msg.file) return null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    const url = msg.file.startsWith("http") ? msg.file : `${apiBase}${msg.file}`;
    const name = msg.file_name || msg.file.split("/").pop() || "Fichier";
    const isImage = msg.file_type?.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
    const isPDF = /\.pdf$/i.test(name);
    const mb = msg.content ? 8 : 0;

    if (isImage) {
      return (
        <a href={url} target={"_blank" as string} rel="noopener noreferrer" style={{ display: "block", marginBottom: mb }}>
          <img src={url} alt={name} style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 10, display: "block", objectFit: "cover" }} />
        </a>
      );
    }

    const linkStyle: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderRadius: 12,
      marginBottom: mb,
      background: sent ? "rgba(255,255,255,0.15)" : "rgba(20,83,45,0.08)",
      border: sent ? "1px solid rgba(255,255,255,0.25)" : "1px solid #86EFAC",
      textDecoration: "none",
    };

    return (
      <a href={url} target={"_blank" as string} rel="noopener noreferrer" style={linkStyle}>
        <span style={{ fontSize: 24 }}>{isPDF ? "📄" : "📎"}</span>
        <div style={{ overflow: "hidden" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: sent ? "white" : "#14532D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
            {name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: sent ? "rgba(255,255,255,0.65)" : "#166534" }}>
            Cliquez pour ouvrir
          </p>
        </div>
      </a>
    );
  };

  if (isLoading) return null;

  return (
    <PrivateRoute allowedRoles={["medecin"]}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        .main-gradient-bg { background: linear-gradient(135deg,#EFF6FF 0%,#F0FDF4 100%); min-height:100vh; }
        .text-gradient { background: linear-gradient(135deg,#3B82F6,#10B981); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .glass-card { background:rgba(255,255,255,0.82); backdrop-filter:blur(14px); border:1px solid rgba(255,255,255,0.9); border-radius:24px; box-shadow:0 2px 12px rgba(0,0,0,0.04); }
        .contact-item { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:14px; cursor:pointer; transition:all 0.2s; border:1px solid transparent; }
        .contact-item:hover { background:rgba(59,130,246,0.06); }
        .contact-item.active { background:rgba(59,130,246,0.09); border-color:rgba(59,130,246,0.22); }
        .msg-bubble { max-width:72%; padding:11px 15px; border-radius:18px; font-size:14px; line-height:1.55; animation:slideUp 0.18s ease; word-break:break-word; }
        .msg-sent { border-bottom-right-radius:4px; }
        .msg-received { border-bottom-left-radius:4px; }
        .search-input { width:100%; padding:9px 14px 9px 36px; border-radius:12px; border:1px solid rgba(0,0,0,0.07); background:rgba(248,250,252,0.95); font-size:13px; font-family:'DM Sans',sans-serif; outline:none; transition:all 0.25s; box-sizing:border-box; }
        .search-input:focus { border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
        .chat-input { flex:1; padding:12px 16px; border-radius:14px; background:rgba(248,250,252,0.95); border:1px solid rgba(0,0,0,0.07); font-size:14px; font-family:'DM Sans',sans-serif; outline:none; transition:all 0.25s; }
        .chat-input:focus { border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,0.08); }
        .badge { background:#EF4444; color:white; border-radius:999px; font-size:10px; font-weight:700; padding:1px 6px; min-width:18px; text-align:center; animation:pulse 1s ease infinite; }
        .msg-meta { font-size:10px; text-align:right; margin:5px 0 0; font-weight:600; }
        .avatar-sm { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0; }
        .file-btn { width:38px; height:38px; border-radius:11px; border:1px solid rgba(0,0,0,0.09); background:white; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:17px; flex-shrink:0; transition:all 0.2s; }
        .file-btn:hover { background:#EFF6FF; border-color:#3B82F6; }
        .send-btn { width:42px; height:42px; border-radius:13px; border:none; display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0; cursor:pointer; transition:all 0.2s; }
        .send-btn:disabled { cursor:not-allowed; }
        .file-preview-bar { display:flex; align-items:center; gap:10px; padding:10px 14px; background:#EFF6FF; border-radius:12px; margin-bottom:10px; border:1px solid #BFDBFE; }
      `}</style>

      <div className="main-gradient-bg" style={{ display: "flex", fontFamily: "'DM Sans', sans-serif" }}>
        <Sidebar stats={{ rendezvous: 0, consultations: 0, ordonnances: 0 }} />
        <Navbar title="Messagerie" subtitle="Communication entre médecins" />

        <main style={{ marginLeft: 240, flex: 1, padding: "2rem", paddingTop: "100px" }}>
          <h1 className="text-gradient" style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, margin: 0, marginBottom: 24 }}>
            Discussion Directe
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, height: "calc(100vh - 200px)" }}>

            {/* PANNEAU GAUCHE */}
            <div className="glass-card" style={{ padding: 14, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#94a3b8" }}>🔍</span>
                <input className="search-input" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 4px" }}>
                <span style={{ fontSize: 15 }}>👨‍⚕️</span>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", margin: 0 }}>
                  Mes Collègues {searchQuery && <span style={{ color: "#94a3b8", fontWeight: 400 }}>({filteredMedecins.length})</span>}
                </h3>
              </div>

              {loading ? (
                <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 16 }}>Chargement...</p>
              ) : filteredMedecins.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 16 }}>
                  {searchQuery ? "Aucun résultat." : "Aucun médecin inscrit."}
                </p>
              ) : (
                filteredMedecins.map((m) => (
                  <div
                    key={m.id}
                    className={`contact-item ${activeMedecin?.id === m.id ? "active" : ""}`}
                    onClick={() => setActiveMedecin(m)}
                  >
                    <div style={{ position: "relative" }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                        background: activeMedecin?.id === m.id
                          ? "linear-gradient(135deg, #3B82F6, #1D4ED8)"
                          : "linear-gradient(135deg, #DBEAFE, #EFF6FF)",
                        border: "1px solid #BFDBFE",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: activeMedecin?.id === m.id ? "white" : "#1e3a8a",
                        fontWeight: 700, fontSize: 15,
                      }}>
                        {getMedecinName(m).charAt(0).toUpperCase()}
                      </div>
                      {(unreadCounts[m.id] || 0) > 0 && (
                        <span className="badge" style={{ position: "absolute", top: -4, right: -4 }}>
                          {unreadCounts[m.id]}
                        </span>
                      )}
                    </div>
                    <div style={{ overflow: "hidden", flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#1e1b4b" }}>Dr. {getMedecinName(m)}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.email || "Médecin"}
                      </p>
                    </div>
                    {(unreadCounts[m.id] || 0) > 0 && <span style={{ fontSize: 7, color: "#3B82F6" }}>●</span>}
                  </div>
                ))
              )}
            </div>

            {/* PANNEAU DROIT */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {!activeMedecin ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <span style={{ fontSize: 56 }}>💬</span>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#334155", margin: 0 }}>Sélectionnez un collègue</h3>
                  <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Choisissez un médecin pour commencer une discussion.</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.055)", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.6)" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: "linear-gradient(135deg, #DBEAFE, #EFF6FF)",
                      border: "1px solid #BFDBFE",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#1e3a8a", fontWeight: 700, fontSize: 15,
                    }}>
                      {getMedecinName(activeMedecin).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#1e1b4b" }}>Dr. {getMedecinName(activeMedecin)}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#10B981", fontWeight: 600 }}>● Discussion privée et sécurisée</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 6, background: "linear-gradient(180deg,#F8FAFF 0%,#F0FDF4 100%)" }}>
                    {messages.length === 0 ? (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <p style={{ fontSize: 13, color: "#94a3b8" }}>Aucun message. Commencez la conversation !</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const sent = isMine(msg.sender);
                        return (
                          <div key={msg.id} style={{ display: "flex", justifyContent: sent ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 7 }}>
                            {!sent && (
                              <div className="avatar-sm" style={{ background: "linear-gradient(135deg,#DBEAFE,#EFF6FF)", border: "1px solid #BFDBFE", color: "#1e3a8a" }}>
                                {getMedecinName(activeMedecin).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div
                              className={`msg-bubble ${sent ? "msg-sent" : "msg-received"}`}
                              style={sent
                                ? { background: MY_PALETTE.bg, color: MY_PALETTE.text }
                                : { background: THEIR_PALETTE.bg, border: `1px solid ${THEIR_PALETTE.border}`, color: THEIR_PALETTE.text }
                              }
                            >
                              {renderFile(msg, sent)}
                              {msg.content && <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>}
                              <p className="msg-meta" style={{ color: sent ? MY_PALETTE.meta : THEIR_PALETTE.meta }}>
                                {formatTime(msg.timestamp)}
                                {sent && <span style={{ marginLeft: 4 }}>{msg.is_read ? "✓✓" : "✓"}</span>}
                              </p>
                            </div>
                            {sent && (
                              <div className="avatar-sm" style={{ background: "linear-gradient(135deg,#3B82F6,#1D4ED8)", color: "white" }}>
                                {getMyInitial()}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(0,0,0,0.055)", background: "white" }}>
                    {selectedFile && (
                      <div className="file-preview-bar">
                        {filePreview
                          ? <img src={filePreview} alt="preview" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                          : <span style={{ fontSize: 24, flexShrink: 0 }}>{selectedFile.name.endsWith(".pdf") ? "📄" : "📎"}</span>
                        }
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#1e3a8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selectedFile.name}
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                            {(selectedFile.size / 1024).toFixed(0)} Ko
                          </p>
                        </div>
                        <button onClick={clearFile} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8", padding: 4 }}>
                          ✕
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSend} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                      <button type="button" className="file-btn" onClick={() => fileInputRef.current?.click()} title="Joindre un fichier">
                        📎
                      </button>
                      <input
                        type="text"
                        className="chat-input"
                        placeholder={selectedFile ? "Ajouter un message (optionnel)..." : "Écrire un message..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        className="send-btn"
                        disabled={(!newMessage.trim() && !selectedFile) || sending}
                        style={{
                          background: (newMessage.trim() || selectedFile) && !sending
                            ? "linear-gradient(135deg,#3B82F6,#1D4ED8)"
                            : "#e2e8f0",
                          color: (newMessage.trim() || selectedFile) && !sending ? "white" : "#94a3b8",
                        }}
                      >
                        {sending ? "⏳" : "➤"}
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

export default function MedecinMessages() {
  return (
    <Suspense fallback={null}>
      <MedecinMessagesInner />
    </Suspense>
  );
}