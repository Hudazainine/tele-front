"use client";
import { useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import api from "../lib/api";

interface Props {
  channelName: string;
  rdvId: number;
  onEnd: () => void;
}

export default function VideoCall({ channelName, rdvId, onEnd }: Props) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const joinedRef = useRef(false);

  const [videoTrack, setVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [audioTrack, setAudioTrack] = useState<IMicrophoneAudioTrack | null>(
    null,
  );
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [remoteUserName, setRemoteUserName] = useState("Participant");

  useEffect(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;

    let timer: any;
    let isMounted = true;

    const join = async () => {
      try {
        // 1. Vérification des devices
        let cameras: MediaDeviceInfo[] = [];
        let mics: MediaDeviceInfo[] = [];

        try {
          cameras = await AgoraRTC.getCameras();
          mics = await AgoraRTC.getMicrophones();
        } catch (deviceErr) {
          console.warn("Impossible d'accéder aux devices:", deviceErr);
        }

        if (!cameras.length && !mics.length) {
          setError("Aucune caméra ni microphone détecté.");
          return;
        }
        if (!cameras.length) {
          setError("Aucune caméra détectée.");
          return;
        }
        if (!mics.length) {
          setError("Aucun microphone détecté.");
          return;
        }

        // 2. Créer le client
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        // 3. Écouter les events AVANT de rejoindre
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === "video" && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current);
            setRemoteJoined(true);
          }
          if (mediaType === "audio") {
            user.audioTrack?.play();
          }
        });

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") setRemoteJoined(false);
        });

        client.on("user-left", () => {
          setRemoteJoined(false);
        });

        // 4. Rejoindre le canal
        const res = await api.post(`video/start/${rdvId}/`);
        const token = res.data.token ?? null;
        await client.join(
          res.data.app_id,
          res.data.channel,
          token,
          res.data.uid,
        );

        // 5. Créer et publier les tracks
        const [micTrack, camTrack] =
          await AgoraRTC.createMicrophoneAndCameraTracks();

        if (!isMounted) return;

        setAudioTrack(micTrack);
        setVideoTrack(camTrack);

        if (localVideoRef.current) {
          camTrack.play(localVideoRef.current);
        }

        await client.publish([micTrack, camTrack]);
        setConnected(true);
        timer = setInterval(() => setDuration((d) => d + 1), 1000);
      } catch (err: any) {
        console.error("Agora error:", err);
        if (err?.code === "DEVICE_NOT_FOUND") {
          setError("Caméra ou microphone introuvable.");
        } else if (err?.code === "PERMISSION_DENIED") {
          setError(
            "Permission refusée. Autorisez l'accès à la caméra et au microphone.",
          );
        } else {
          setError("Erreur de connexion: " + (err?.message || "inconnue"));
        }
      }
    };

    join();

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [rdvId]);

  const toggleMic = async () => {
    if (!audioTrack) return;
    const newState = !micOn;
    await audioTrack.setMuted(!newState);
    setMicOn(newState);
  };

  const toggleCam = async () => {
    if (!videoTrack) return;
    const newState = !camOn;
    await videoTrack.setMuted(!newState);
    setCamOn(newState);
  };

  const handleEnd = async () => {
    try {
      videoTrack?.stop();
      videoTrack?.close();
      audioTrack?.stop();
      audioTrack?.close();
      await clientRef.current?.unpublish();
      await clientRef.current?.leave();
      await api.post(`video/end/${rdvId}/`);
    } catch (err) {
      console.error(err);
    }
    onEnd();
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Écran d'erreur
  if (error) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0a0f1a",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: 40,
        }}
      >
        <div
          style={{
            background: "#131f2e",
            borderRadius: 20,
            padding: "40px 48px",
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>📷</div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: "#ff6b6b",
            }}
          >
            Connexion impossible
          </h2>
          <p
            style={{
              color: "#9ca3af",
              fontSize: 15,
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            {error}
          </p>
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              padding: "16px 20px",
              textAlign: "left",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                color: "#6b7280",
                fontSize: 13,
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Solutions possibles :
            </p>
            <ul
              style={{
                color: "#9ca3af",
                fontSize: 13,
                lineHeight: 2,
                paddingLeft: 16,
                margin: 0,
              }}
            >
              <li>Vérifiez que la caméra est branchée</li>
              <li>Autorisez l'accès dans le navigateur (icône 🔒)</li>
              <li>Fermez Zoom, Teams ou toute app utilisant la caméra</li>
              <li>Rafraîchissez la page</li>
            </ul>
          </div>
          <button
            onClick={onEnd}
            style={{
              padding: "12px 32px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 600,
              width: "100%",
            }}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0f1a",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: connected ? "#22c55e" : "#f59e0b",
              boxShadow: connected ? "0 0 8px #22c55e" : "0 0 8px #f59e0b",
            }}
          />
          <span style={{ color: "white", fontSize: 15, fontWeight: 500 }}>
            {connected ? "Consultation en cours" : "Connexion en cours..."}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {connected && (
            <div
              style={{
                background: "rgba(68,182,178,0.15)",
                border: "1px solid rgba(68,182,178,0.3)",
                borderRadius: 8,
                padding: "6px 14px",
                color: "#44B6B2",
                fontFamily: "monospace",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {formatTime(duration)}
            </div>
          )}
        </div>
      </div>

      {/* VIDEO AREA */}
      <div
        style={{
          flex: 1,
          position: "relative",
          padding: 16,
          display: "flex",
          gap: 16,
        }}
      >
        {/* REMOTE VIDEO */}
        <div
          style={{
            flex: 1,
            position: "relative",
            background: "#0d1821",
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div ref={remoteVideoRef} style={{ width: "100%", height: "100%" }} />

          {!remoteJoined && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "rgba(68,182,178,0.1)",
                  border: "2px solid rgba(68,182,178,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                }}
              >
                👤
              </div>
              <p style={{ color: "#6b7280", fontSize: 15 }}>
                En attente du participant...
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#44B6B2",
                      opacity: 0.4,
                      animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Nom du participant remote */}
          {remoteJoined && (
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                background: "rgba(0,0,0,0.6)",
                borderRadius: 8,
                padding: "4px 12px",
                color: "white",
                fontSize: 13,
                backdropFilter: "blur(4px)",
              }}
            >
              {remoteUserName}
            </div>
          )}
        </div>

        {/* LOCAL VIDEO */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 32,
            width: 220,
            height: 155,
            borderRadius: 16,
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.15)",
            background: "#0d1821",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 10,
          }}
        >
          <div ref={localVideoRef} style={{ width: "100%", height: "100%" }} />

          {!camOn && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#0d1821",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 28 }}>🚫</span>
              <span style={{ color: "#6b7280", fontSize: 12 }}>
                Caméra désactivée
              </span>
            </div>
          )}

          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              background: "rgba(0,0,0,0.6)",
              borderRadius: 6,
              padding: "2px 8px",
              color: "white",
              fontSize: 11,
            }}
          >
            Vous
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* MIC */}
        <button
          onClick={toggleMic}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: micOn ? "rgba(255,255,255,0.08)" : "#ef4444",
            border: micOn ? "1px solid rgba(255,255,255,0.15)" : "none",
            cursor: "pointer",
            fontSize: 22,
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {micOn ? "🎤" : "🔇"}
        </button>

        {/* END CALL */}
        <button
          onClick={handleEnd}
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "#ef4444",
            border: "none",
            cursor: "pointer",
            fontSize: 26,
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
          }}
        >
          📵
        </button>

        {/* CAM */}
        <button
          onClick={toggleCam}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: camOn ? "rgba(255,255,255,0.08)" : "#ef4444",
            border: camOn ? "1px solid rgba(255,255,255,0.15)" : "none",
            cursor: "pointer",
            fontSize: 22,
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {camOn ? "📹" : "🚫"}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
