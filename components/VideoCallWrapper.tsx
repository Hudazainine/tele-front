// components/VideoCallWrapper.tsx
"use client";
import dynamic from "next/dynamic";

const VideoCall = dynamic(() => import("./VideoCall"), {
  ssr: false,
  loading: () => <p>Chargement de la vidéo...</p>,
});

export default VideoCall;
