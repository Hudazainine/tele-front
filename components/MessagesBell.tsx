"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

interface Conversation {
  id: number;
  sender: number;
  sender_name: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

export default function MessagesBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const fetchUnread = () => {
      api.get("messages/unread_count/")
        .then((r) => setUnreadTotal(r.data.messagesNonLus || 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    api.get("messages/")
      .then((r) => {
        const msgs: Conversation[] = r.data.results || r.data;
        const seen = new Set<number>();
        const latest = msgs
          .slice()
          .reverse()
          .filter((m) => {
            if (seen.has(m.sender)) return false;
            seen.add(m.sender);
            return true;
          })
          .reverse()
          .slice(0, 5);
        setConversations(latest);
      })
      .catch(() => {});
  }, [open]);

  const markAllRead = () => {
    conversations.forEach((msg) => {
      if (!msg.is_read) {
        api.patch(`messages/${msg.id}/mark_as_read/`).catch(() => {});
      }
    });
    setConversations((prev) => prev.map((m) => ({ ...m, is_read: true })));
    setUnreadTotal(0);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000)
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (diff < 172800000) return "Hier";
    return d.toLocaleDateString("fr-FR", { weekday: "short" });
  };

  const getInitial = (name: string) =>
    name.replace("Dr. ", "").charAt(0).toUpperCase();

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Messages"
        style={{
          width: 40, height: 40, borderRadius: 12,
          border: open ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(0,0,0,0.08)",
          background: open ? "rgba(139,92,246,0.08)" : "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 18,
          color: open ? "#8B5CF6" : "#64748b",
          transition: "all 0.2s", position: "relative",
        }}
      >
        ✉
        {unreadTotal > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "#EF4444", color: "white",
            borderRadius: 999, fontSize: 10, fontWeight: 700,
            padding: "1px 5px", minWidth: 18, textAlign: "center",
            border: "2px solid white",
          }}>
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: 48, right: 0, width: 320,
          background: "white", borderRadius: 16,
          border: "0.5px solid rgba(0,0,0,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          zIndex: 1000, overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px", display: "flex",
            alignItems: "center", justifyContent: "space-between",
            borderBottom: "0.5px solid rgba(0,0,0,0.06)",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b" }}>
              Messages{" "}
              {unreadTotal > 0 && (
                <span style={{
                  marginLeft: 6, background: "#EF4444", color: "white",
                  borderRadius: 999, fontSize: 10, fontWeight: 700,
                  padding: "1px 6px",
                }}>
                  {unreadTotal}
                </span>
              )}
            </span>
            {unreadTotal > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: 12, color: "#8B5CF6", background: "none",
                  border: "none", cursor: "pointer", fontWeight: 500,
                }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste conversations */}
          {conversations.length === 0 ? (
            <div style={{
              padding: "32px 16px", textAlign: "center",
              color: "#94a3b8", fontSize: 13,
            }}>
              Aucun message
            </div>
          ) : (
            conversations.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  router.push(`/dashboard/medecin/messages?contact=${msg.sender}`);
                  setOpen(false);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", cursor: "pointer",
                  background: !msg.is_read ? "rgba(139,92,246,0.04)" : "white",
                  borderBottom: "0.5px solid rgba(0,0,0,0.04)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#faf8ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = !msg.is_read
                    ? "rgba(139,92,246,0.04)"
                    : "white")
                }
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg, #8B5CF6, #10B981)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: 14,
                }}>
                  {getInitial(msg.sender_name)}
                </div>

                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1e1b4b" }}>
                    {msg.sender_name}
                  </p>
                  <p style={{
                    margin: 0, fontSize: 12, color: "#94a3b8",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {msg.content}
                  </p>
                </div>

                <div style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "flex-end", gap: 4, flexShrink: 0,
                }}>
                  <span style={{ fontSize: 11, color: "#cbd5e1" }}>
                    {formatTime(msg.timestamp)}
                  </span>
                  {!msg.is_read && (
                    <span style={{
                      width: 8, height: 8,
                      background: "#8B5CF6", borderRadius: "50%",
                    }} />
                  )}
                </div>
              </div>
            ))
          )}

          {/* Footer */}
          <div style={{
            padding: "12px 16px",
            borderTop: "0.5px solid rgba(0,0,0,0.06)",
            textAlign: "center",
          }}>
            <button
              onClick={() => {
                router.push("/dashboard/medecin/messages");
                setOpen(false);
              }}
              style={{
                fontSize: 13, color: "#8B5CF6", background: "none",
                border: "none", cursor: "pointer", fontWeight: 600,
              }}
            >
              Voir toutes les conversations →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}