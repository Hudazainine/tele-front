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
  /** "medecin" ou "patient" — détermine les libellés et avatars affichés */
  role: "medecin" | "patient";
  /** Nom affiché pour l'autre participant (optionnel, sinon déduit du rôle) */
  remoteName?: string;
}

/* ─── icons (inline SVG, no external dep) ─── */
const IconPhone = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.43 9.88a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.34 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11z" />
    <line x1="23" y1="1" x2="1" y2="23" />
  </svg>
);
const IconMic = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const IconMicOff = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const IconCamera = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const IconCameraOff = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h2a2 2 0 0 1 2 2v9.34" />
    <polygon points="23 7 16 12 23 17 23 7" opacity="0.4" />
  </svg>
);
const IconShield = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const IconUsers = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconShare = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);
const IconDots = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

/* ─── styles ─── */
const S: Record<string, React.CSSProperties> = {
  root: {
    position: "fixed",
    inset: 0,
    background: "#0b0f17",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 24px",
    borderBottom: "0.5px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    flexShrink: 0,
  },
  statusRow: { display: "flex", alignItems: "center", gap: 8 },
  dot: (on: boolean): React.CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: on ? "#22c55e" : "#f59e0b",
    flexShrink: 0,
  }),
  statusText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontWeight: 400,
    letterSpacing: "0.01em",
  },
  badges: { display: "flex", alignItems: "center", gap: 8 },
  badge: {
    background: "rgba(255,255,255,0.04)",
    border: "0.5px solid rgba(255,255,255,0.09)",
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  timer: {
    background: "rgba(20,184,166,0.1)",
    border: "0.5px solid rgba(20,184,166,0.22)",
    borderRadius: 6,
    padding: "4px 14px",
    fontSize: 13,
    color: "#14b8a6",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 500,
  },
  /* Vue à deux panneaux (les deux participants sont connectés) */
  body: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr 1fr",
    gap: 10,
    padding: 12,
    minHeight: 0,
  },
  /* Vue solo (un seul participant connecté pour l'instant) */
  bodySolo: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
    padding: 12,
    minHeight: 0,
  },
  panel: (isLocal: boolean): React.CSSProperties => ({
    borderRadius: 16,
    background: isLocal ? "#0e131c" : "#111622",
    border: `0.5px solid rgba(255,255,255,${isLocal ? "0.04" : "0.07"})`,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 10,
  }),
  avatar: (isLocal: boolean): React.CSSProperties => ({
    width: 68,
    height: 68,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 500,
    background: isLocal ? "rgba(20,184,166,0.13)" : "rgba(99,102,241,0.16)",
    color: isLocal ? "#5eead4" : "#a5b4fc",
    letterSpacing: "0.05em",
  }),
  panelSub: { fontSize: 12, color: "rgba(255,255,255,0.22)", marginTop: 2 },
  nameTag: {
    position: "absolute",
    bottom: 12,
    left: 12,
    background: "rgba(0,0,0,0.5)",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    display: "flex",
    alignItems: "center",
    gap: 5,
    backdropFilter: "blur(6px)",
  },
  stateBadge: (muted?: boolean): React.CSSProperties => ({
    position: "absolute",
    top: 12,
    right: 12,
    background: "rgba(0,0,0,0.45)",
    borderRadius: 6,
    padding: "3px 9px",
    fontSize: 11,
    color: muted ? "#f87171" : "rgba(255,255,255,0.38)",
    display: "flex",
    alignItems: "center",
    gap: 4,
  }),
  waitingDots: { display: "flex", gap: 5, marginTop: 4 },
  footer: {
    padding: "14px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "0.5px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.01)",
    flexShrink: 0,
  },
  controls: { display: "flex", alignItems: "center", gap: 10 },
  ctrlBtn: (off?: boolean): React.CSSProperties => ({
    width: 46,
    height: 46,
    borderRadius: "50%",
    border: `0.5px solid ${off ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.11)"}`,
    background: off ? "rgba(239,68,68,0.16)" : "rgba(255,255,255,0.05)",
    color: off ? "#f87171" : "rgba(255,255,255,0.75)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
  }),
  endBtn: {
    width: 54,
    height: 54,
    borderRadius: "50%",
    border: "none",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 6px",
    transition: "background 0.15s, transform 0.1s",
    boxShadow: "0 0 0 4px rgba(239,68,68,0.15)",
  },
  footerInfo: {
    fontSize: 12,
    color: "rgba(255,255,255,0.22)",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  qualityBars: { display: "flex", gap: 2, alignItems: "flex-end" },
  errorWrap: {
    position: "fixed",
    inset: 0,
    background: "#0b0f17",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  errorCard: {
    background: "#111622",
    borderRadius: 20,
    padding: "40px 48px",
    maxWidth: 460,
    width: "100%",
    textAlign: "center",
    border: "0.5px solid rgba(255,255,255,0.08)",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 500,
    color: "#f87171",
    marginBottom: 10,
  },
  errorBody: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    lineHeight: 1.7,
    marginBottom: 22,
  },
  errorList: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    padding: "14px 18px",
    textAlign: "left",
    marginBottom: 22,
  },
  errorListLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 8,
  },
  errorListItem: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    lineHeight: 2,
  },
  errorBtn: {
    padding: "11px 0",
    width: "100%",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
};

/* ─── Dot animation style injected once ─── */
const DOT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');
@keyframes _vcpulse {
  0%,100%{opacity:0.3;transform:scale(1)}
  50%{opacity:1;transform:scale(1.3)}
}
._vcdot{animation:_vcpulse 1.4s ease-in-out infinite}
._vcdot:nth-child(2){animation-delay:.2s}
._vcdot:nth-child(3){animation-delay:.4s}
`;

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/*
 * Garde PARTAGÉE entre toutes les instances de VideoCall dans cet onglet
 * (donc au-dessus du composant, en portée module). Contrairement à un
 * useRef, elle survit même si deux instances du composant sont montées
 * en même temps (ex: VideoCall rendu deux fois dans l'arbre React,
 * double-clic sur "Rejoindre", deuxième fenêtre, etc.) — le scénario que
 * ne couvrait pas la protection précédente (qui ne gérait que le
 * remount séquentiel de React StrictMode).
 *
 * Pour un rdvId donné :
 *  - leaving === null  -> une instance est actuellement connectée
 *  - leaving = Promise  -> une instance précédente est en train de partir
 *  - absent de la Map   -> personne n'est connecté
 */
const activeJoins = new Map<
  number,
  { instanceId: string; leaving: Promise<void> | null }
>();

/** Déduit les initiales / libellés à partir du rôle */
const roleLabels = (role: "medecin" | "patient", remoteName?: string) => {
  if (role === "medecin") {
    return {
      localLabel: "Vous",
      localInitials: "VS",
      remoteLabel: remoteName ?? "Patient",
      remoteInitials: (remoteName ?? "Patient").slice(0, 2).toUpperCase(),
      waitingText: "En attente du patient…",
    };
  }
  return {
    localLabel: "Vous",
    localInitials: "VS",
    remoteLabel: remoteName ?? "Dr. Dupont",
    remoteInitials: (remoteName ?? "Dr")
      .replace("Dr.", "Dr")
      .slice(0, 2)
      .toUpperCase(),
    waitingText: "En attente du médecin…",
  };
};

export default function VideoCall({
  channelName,
  rdvId,
  onEnd,
  role,
  remoteName,
}: Props) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  // Mémorise la piste vidéo distante reçue, pour pouvoir la (re)jouer une
  // fois que le panneau distant est réellement monté dans le DOM (voir
  // le useEffect [remoteJoined] plus bas).
  const remoteVideoTrackRef = useRef<any>(null);

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

  const labels = roleLabels(role, remoteName);

  /*
   * Garde une référence à la promesse de "leave" en cours entre deux cycles
   * d'effet. En React 18 StrictMode (dev), l'effet est monté → démonté →
   * remonté quasi instantanément. Sans cette garde, la 2e connexion Agora
   * pouvait démarrer AVANT que la 1re ait vraiment quitté le canal, créant
   * deux participants actifs (la même caméra vue "en double").
   */
  const leavingRef = useRef<Promise<void> | null>(null);
  // Identifiant unique de CETTE instance du composant — sert à savoir si
  // c'est bien "nous" qui détenons la connexion active dans activeJoins.
  const instanceIdRef = useRef(
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  );

  useEffect(() => {
    const instanceId = instanceIdRef.current;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval>;
    let client: IAgoraRTCClient | null = null;
    let micTrack: IMicrophoneAudioTrack | null = null;
    let camTrack: ICameraVideoTrack | null = null;

    const join = async () => {
      try {
        // 1) Une session précédente (même instance, remount StrictMode)
        //    est peut-être encore en train de partir : on attend.
        if (leavingRef.current) {
          await leavingRef.current;
        }
        if (cancelled) return;

        // 2) Garde partagée : si une AUTRE instance vivante de VideoCall
        //    détient déjà la connexion pour ce rdvId, on n'ouvre pas une
        //    deuxième connexion Agora (ce qui provoquerait le doublon
        //    vidéo observé). On journalise clairement pour localiser la
        //    source du double montage côté React.
        const existing = activeJoins.get(rdvId);
        if (existing && existing.instanceId !== instanceId) {
          if (existing.leaving) {
            await existing.leaving;
          } else {
            console.error(
              `[VideoCall] Double connexion détectée pour le RDV ${rdvId} — ` +
                `une instance (${existing.instanceId}) est déjà connectée, ` +
                `une seconde instance (${instanceId}) tente de rejoindre. ` +
                `Le composant <VideoCall /> est probablement rendu deux fois ` +
                `dans l'arbre React (vérifier le parent, une modale + une page, ` +
                `un double-clic sur "Rejoindre", ou une deuxième fenêtre).`,
            );
            setError(
              "Une session vidéo est déjà active pour ce rendez-vous dans cet onglet. Fermez les onglets ou fenêtres en double puis réessayez.",
            );
            return;
          }
        }

        let cameras: MediaDeviceInfo[] = [];
        let mics: MediaDeviceInfo[] = [];
        try {
          cameras = await AgoraRTC.getCameras();
          mics = await AgoraRTC.getMicrophones();
        } catch {
          /* silent */
        }
        if (cancelled) return;
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

        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;
        // On prend possession de la garde pour ce rdvId.
        activeJoins.set(rdvId, { instanceId, leaving: null });
        console.log(
          `[VideoCall] instance ${instanceId} rejoint le RDV ${rdvId}`,
        );

        client.on("user-published", async (user, mediaType) => {
          await client!.subscribe(user, mediaType);
          if (mediaType === "video") {
            // On mémorise la piste : le panneau distant n'existe pas
            // encore dans le DOM à cet instant (il n'apparaît qu'une
            // fois remoteJoined=true), donc on ne peut pas appeler
            // .play() ici. Le useEffect [remoteJoined] s'en charge une
            // fois le <div ref={remoteVideoRef}> réellement monté.
            remoteVideoTrackRef.current = user.videoTrack;
            setRemoteJoined(true);
          }
          if (mediaType === "audio") user.audioTrack?.play();
        });
        client.on("user-unpublished", (_, mt) => {
          if (mt === "video") {
            remoteVideoTrackRef.current = null;
            setRemoteJoined(false);
          }
        });
        client.on("user-left", () => {
          remoteVideoTrackRef.current = null;
          setRemoteJoined(false);
        });

        const res = await api.post(`video/start/${rdvId}/`);
        if (cancelled) return;

        await client.join(
          res.data.app_id,
          res.data.channel,
          res.data.token ?? null,
          res.data.uid,
        );
        if (cancelled) {
          await client.leave().catch(() => {});
          return;
        }

        try {
          [micTrack, camTrack] =
            await AgoraRTC.createMicrophoneAndCameraTracks();
        } catch (e: any) {
          if (e?.code === "NOT_READABLE") {
            try {
              micTrack = await AgoraRTC.createMicrophoneAudioTrack();
              setError(
                "Caméra occupée par une autre application — audio uniquement.",
              );
            } catch {
              setError(
                "Micro et caméra inaccessibles. Fermez les autres applications.",
              );
            }
            return;
          } else throw e;
        }

        if (cancelled) {
          micTrack?.close();
          camTrack?.close();
          await client.unpublish().catch(() => {});
          await client.leave().catch(() => {});
          return;
        }

        setAudioTrack(micTrack);
        setVideoTrack(camTrack);
        if (localVideoRef.current && camTrack)
          camTrack.play(localVideoRef.current);
        await client.publish([micTrack!, camTrack!]);
        setConnected(true);
        timer = setInterval(() => setDuration((d) => d + 1), 1000);
      } catch (err: any) {
        if (err?.code === "DEVICE_NOT_FOUND")
          setError("Caméra ou microphone introuvable.");
        else if (err?.code === "PERMISSION_DENIED")
          setError("Permission refusée. Autorisez la caméra et le microphone.");
        else setError("Erreur de connexion : " + (err?.message || "inconnue"));
      }
    };

    join();

    return () => {
      cancelled = true;
      clearInterval(timer);
      // Cleanup asynchrone mais dont la promesse est mémorisée : le
      // prochain montage (StrictMode) attendra sa fin avant de rejoindre.
      const leavePromise = (async () => {
        try {
          camTrack?.stop();
          camTrack?.close();
          micTrack?.stop();
          micTrack?.close();
          if (client) {
            await client.unpublish().catch(() => {});
            await client.leave();
            console.log(
              `[VideoCall] instance ${instanceId} a quitté le RDV ${rdvId}`,
            );
          }
        } catch {
          /* silent */
        } finally {
          clientRef.current = null;
          leavingRef.current = null;
        }
      })();

      leavingRef.current = leavePromise;

      // Ne libère la garde partagée que si c'est bien NOUS qui la
      // détenions (évite qu'une instance en retard n'efface la garde
      // d'une instance plus récente).
      const current = activeJoins.get(rdvId);
      if (current && current.instanceId === instanceId) {
        activeJoins.set(rdvId, { instanceId, leaving: leavePromise });
        leavePromise.then(() => {
          const stillOurs = activeJoins.get(rdvId);
          if (stillOurs && stillOurs.instanceId === instanceId) {
            activeJoins.delete(rdvId);
          }
        });
      }
    };
  }, [rdvId]);

  // Une fois remoteJoined=true, React monte le <div ref={remoteVideoRef}>.
  // C'est SEULEMENT à ce moment que le ref est disponible : on y joue
  // alors la piste vidéo distante mémorisée par user-published.
  useEffect(() => {
    if (remoteJoined && remoteVideoRef.current && remoteVideoTrackRef.current) {
      remoteVideoTrackRef.current.play(remoteVideoRef.current);
    }
  }, [remoteJoined]);

  const toggleMic = async () => {
    if (!audioTrack) return;
    const next = !micOn;
    await audioTrack.setMuted(!next);
    setMicOn(next);
  };

  const toggleCam = async () => {
    if (!videoTrack) return;
    const next = !camOn;
    await videoTrack.setMuted(!next);
    setCamOn(next);
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

  /* ── Error screen ── */
  if (error)
    return (
      <div style={S.errorWrap}>
        <style>{DOT_STYLE}</style>
        <div style={S.errorCard}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>📷</div>
          <h2 style={S.errorTitle}>Connexion impossible</h2>
          <p style={S.errorBody}>{error}</p>
          <div style={S.errorList}>
            <p style={S.errorListLabel}>Solutions possibles</p>
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {[
                "Vérifiez que la caméra est branchée",
                "Autorisez l'accès dans le navigateur (icône 🔒)",
                "Fermez Zoom, Teams ou toute app utilisant la caméra",
                "Rafraîchissez la page",
              ].map((t) => (
                <li key={t} style={S.errorListItem}>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <button style={S.errorBtn} onClick={onEnd}>
            Retour
          </button>
        </div>
      </div>
    );

  /* ── Main UI ── */
  return (
    <div style={S.root}>
      <style>{DOT_STYLE}</style>

      {/* HEADER */}
      <div style={S.header}>
        <div style={S.statusRow}>
          <div style={S.dot(connected)} />
          <span style={S.statusText}>
            {!connected
              ? "Connexion en cours…"
              : remoteJoined
                ? "Consultation en cours"
                : labels.waitingText}
          </span>
        </div>
        <div style={S.badges}>
          <div style={S.badge}>
            <IconShield />
            Chiffré
          </div>
          <div style={S.badge}>
            <IconUsers />
            {remoteJoined ? "2 participants" : "1 participant"}
          </div>
          {connected && <div style={S.timer}>{fmt(duration)}</div>}
        </div>
      </div>

      {/* VIDEO PANELS — un seul panneau tant que l'autre participant n'a pas rejoint */}

      <div style={remoteJoined ? S.body : S.bodySolo}>
        {(() => {
          const localPanel = (
            <div style={S.panel(true)} key="local">
              <div
                ref={localVideoRef}
                style={{ position: "absolute", inset: 0 }}
              />
              {!camOn && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#0e131c",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <div style={S.avatar(true)}>{labels.localInitials}</div>
                  <span style={S.panelSub}>Caméra désactivée</span>
                </div>
              )}
              <div style={S.nameTag}>{labels.localLabel}</div>
              <div style={S.stateBadge(!micOn)}>{micOn ? "Actif" : "Muet"}</div>
            </div>
          );

          const remotePanel = remoteJoined && (
            <div style={S.panel(false)} key="remote">
              <div
                ref={remoteVideoRef}
                style={{ position: "absolute", inset: 0 }}
              />
              <div style={S.nameTag}>{labels.remoteLabel}</div>
              <div style={S.stateBadge()}>HD</div>
            </div>
          );

          // Le médecin est toujours affiché en premier (donc en haut dans la grille en lignes),
          // que ce soit lui le "local" ou le "remote".
          const medecinPanel = role === "medecin" ? localPanel : remotePanel;
          const patientPanel = role === "medecin" ? remotePanel : localPanel;

          return (
            <>
              {medecinPanel}
              {patientPanel}
            </>
          );
        })()}
      </div>

      {/* Message d'attente sous le panneau solo */}
      {connected && !remoteJoined && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            paddingBottom: 8,
          }}
        >
          <span style={S.panelSub}>{labels.waitingText}</span>
          <div style={S.waitingDots}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="_vcdot"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#14b8a6",
                  opacity: 0.5,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* FOOTER CONTROLS */}
      <div style={S.footer}>
        {/* Left: quality */}
        <div style={S.footerInfo}>
          <div style={S.qualityBars}>
            {[6, 10, 14, 18].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: h,
                  borderRadius: 2,
                  background: i < 3 ? "#22c55e" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
          Bonne connexion
        </div>

        {/* Center: controls */}
        <div style={S.controls}>
          <button
            style={S.ctrlBtn(!micOn)}
            onClick={toggleMic}
            title={micOn ? "Couper le micro" : "Activer le micro"}
            aria-label={micOn ? "Couper le micro" : "Activer le micro"}
          >
            {micOn ? <IconMic /> : <IconMicOff />}
          </button>
          <button
            style={S.ctrlBtn(!camOn)}
            onClick={toggleCam}
            title={camOn ? "Couper la caméra" : "Activer la caméra"}
            aria-label={camOn ? "Couper la caméra" : "Activer la caméra"}
          >
            {camOn ? <IconCamera /> : <IconCameraOff />}
          </button>
          <button
            style={S.endBtn}
            onClick={handleEnd}
            title="Terminer l'appel"
            aria-label="Terminer l'appel"
          >
            <IconPhone />
          </button>
          <button
            style={S.ctrlBtn()}
            title="Partager l'écran"
            aria-label="Partager l'écran"
          >
            <IconShare />
          </button>
          <button
            style={S.ctrlBtn()}
            title="Plus d'options"
            aria-label="Plus d'options"
          >
            <IconDots />
          </button>
        </div>

        {/* Right: RDV ID */}
        <div style={S.footerInfo}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          RDV #{rdvId}
        </div>
      </div>
    </div>
  );
}
