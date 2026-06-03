"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  /* ── Keyframes ── */
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes floatSlow { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeLeft { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
  @keyframes fadeRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
  @keyframes ecgDraw { 0%{stroke-dashoffset:400} 50%{stroke-dashoffset:0} 100%{stroke-dashoffset:-400} }
  @keyframes pulseRing { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.8);opacity:0} }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes handReach { 0%,100%{transform:translateX(0) translateY(0)} 50%{transform:translateX(6px) translateY(-4px)} }
  @keyframes docWave { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(3deg)} 75%{transform:rotate(-2deg)} }
  @keyframes rxFloat { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-6px) rotate(0deg)} }
  @keyframes iconBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes blobMove { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-15px) scale(1.05)} 66%{transform:translate(-10px,10px) scale(.97)} }
  @keyframes cardIn { from{opacity:0;transform:translateY(20px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes checkDraw { from{stroke-dashoffset:24} to{stroke-dashoffset:0} }
  @keyframes spin { to{transform:rotate(360deg)} }

  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

  .pg {
    min-height:100vh;
    display:flex;
    font-family:'Plus Jakarta Sans',sans-serif;
    background:#F3F0F8;
    overflow:hidden;
    position:relative;
  }

  /* ── Left Panel ── */
  .pg-left {
    width:50%;
    min-height:100vh;
    background:linear-gradient(165deg, #A861D8 0%, #8A3FB8 30%, #742A9E 60%, #44B6B2 100%);
    position:relative;
    overflow:hidden;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    padding:2rem;
    flex-shrink:0;
    animation:fadeLeft .7s cubic-bezier(.22,1,.36,1) both;
  }

  .pg-left::before {
    content:'';position:absolute;inset:0;
    background:
      radial-gradient(ellipse 60% 50% at 30% 20%,rgba(228,205,243,0.15) 0%,transparent 70%),
      radial-gradient(ellipse 40% 60% at 70% 80%,rgba(68,182,178,0.08) 0%,transparent 70%),
      radial-gradient(ellipse 50% 40% at 50% 50%,rgba(163,221,220,0.06) 0%,transparent 70%);
    pointer-events:none;
  }

  .pg-blob { position:absolute;border-radius:50%;pointer-events:none;filter:blur(70px); }
  .pg-b1 { width:350px;height:350px;background:rgba(228,205,243,0.12);top:-8%;left:-5%;animation:blobMove 12s ease-in-out infinite; }
  .pg-b2 { width:280px;height:280px;background:rgba(68,182,178,0.08);bottom:5%;right:-3%;animation:blobMove 10s ease-in-out infinite 3s reverse; }
  .pg-b3 { width:200px;height:200px;background:rgba(163,221,220,0.06);top:45%;left:60%;animation:blobMove 14s ease-in-out infinite 5s; }

  .pg-logo {
    position:absolute;top:1.75rem;left:2rem;z-index:5;
    display:flex;align-items:center;gap:10px;
  }
  .pg-logo-ic {
    width:38px;height:38px;border-radius:11px;
    background:linear-gradient(135deg,#A3DDDC,#44B6B2);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 14px rgba(68,182,178,0.35);
  }
  .pg-logo-ic svg { width:18px;height:18px; }
  .pg-logo-tx { font-size:16px;font-weight:800;color:white;letter-spacing:-.3px; }

  .pg-illus { position:relative;z-index:2;width:100%;max-width:480px;animation:fadeUp .8s .2s ease both; }
  .pg-illus svg { width:100%;height:auto; }

  .pg-left-txt { position:relative;z-index:2;text-align:center;margin-top:1.5rem;animation:fadeUp .6s .5s ease both; }
  .pg-left-txt h2 { font-size:26px;font-weight:800;color:white;letter-spacing:-.8px;line-height:1.15;margin-bottom:6px; }
  .pg-left-txt h2 em {
    font-style:normal;
    background:linear-gradient(135deg,#A3DDDC,#FFFFFF);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  .pg-left-txt p { font-size:13.5px;color:rgba(228,205,243,0.8);line-height:1.6;max-width:340px;margin:0 auto; }

  .pg-stats { position:relative;z-index:2;display:flex;gap:28px;margin-top:1.5rem;animation:fadeUp .6s .6s ease both; }
  .pg-stat-v { font-size:22px;font-weight:800;color:#A3DDDC;line-height:1; }
  .pg-stat-l { font-size:11px;color:rgba(228,205,243,0.6);margin-top:3px;font-weight:600;text-transform:uppercase;letter-spacing:.04em; }

  /* ── Right Panel ── */
  .pg-right {
    flex:1;min-height:100vh;
    display:flex;align-items:center;justify-content:center;
    padding:2rem;position:relative;
    background:#E4CDF3;
    animation:fadeRight .7s .1s cubic-bezier(.22,1,.36,1) both;
  }
  .pg-right::before {
    content:'';position:absolute;inset:0;pointer-events:none;
    background:
      radial-gradient(circle at 85% 15%,rgba(255,255,255,0.6) 0%,transparent 50%),
      radial-gradient(circle at 10% 90%,rgba(163,221,220,0.15) 0%,transparent 50%);
  }

  /* Card */
  .pg-card {
    width:100%;max-width:410px;
    background:#FFFFFF;
    border-radius:24px;
    padding:2.75rem 2.25rem 2.25rem;
    position:relative;z-index:2;overflow:hidden;
    box-shadow:0 2px 4px rgba(168,97,216,0.04),0 12px 40px rgba(168,97,216,0.08),0 0 0 1px rgba(255,255,255,0.4);
    animation:cardIn .65s .3s cubic-bezier(.22,1,.36,1) both;
  }
  .pg-card::before {
    content:'';position:absolute;top:0;left:8%;right:8%;height:2.5px;
    background:linear-gradient(90deg,transparent,#A3DDDC,#44B6B2,transparent);
    border-radius:0 0 2px 2px;
  }
  .pg-card::after {
    content:'';position:absolute;bottom:-40px;right:-40px;width:140px;height:140px;
    border-radius:50%;background:radial-gradient(circle,rgba(168,97,216,0.03),transparent 70%);
    pointer-events:none;
  }

  .pg-card-ic {
    width:56px;height:56px;border-radius:16px;
    background:linear-gradient(135deg,#44B6B2,#A3DDDC);
    display:flex;align-items:center;justify-content:center;
    margin:0 auto 1.5rem;
    box-shadow:0 6px 20px rgba(68,182,178,0.25);
    position:relative;
  }
  .pg-card-ic::before,.pg-card-ic::after {
    content:'';position:absolute;inset:-4px;border-radius:20px;
    border:1.5px solid rgba(68,182,178,0.2);
    animation:pulseRing 3s ease-out infinite;
  }
  .pg-card-ic::after { animation-delay:1.5s; }

  .pg-head { text-align:center;margin-bottom:1.5rem; }
  .pg-head h1 { font-size:24px;font-weight:800;color:#4B2B63;letter-spacing:-.5px;margin-bottom:4px; }
  .pg-head p { font-size:13.5px;color:#8B7B9E; }

  .pg-div {
    height:1px;margin-bottom:1.5rem;
    background:linear-gradient(90deg,transparent,rgba(168,97,216,0.15),rgba(68,182,178,0.1),transparent);
  }

  /* Fields */
  .pg-ff { margin-bottom:1.15rem; }
  .pg-fl { display:block;font-size:11px;font-weight:700;color:#8B7B9E;margin-bottom:6px;text-transform:uppercase;letter-spacing:.08em;transition:color .2s; }
  .pg-ff:focus-within .pg-fl { color:#A861D8; }
  .pg-fw { position:relative; }
  .pg-fi {
    width:100%;padding:13px 16px;
    background:#F8F6FC;border:1.5px solid #EBE4F4;border-radius:12px;
    font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;color:#4B2B63;outline:none;
    transition:all .25s cubic-bezier(.4,0,.2,1);
  }
  .pg-fi::placeholder { color:#C4B6D0; }
  .pg-fi:hover { border-color:#D4C1E6;background:#FDFBFF; }
  .pg-fi:focus { background:#fff;border-color:#A861D8;box-shadow:0 0 0 4px rgba(168,97,216,0.1); }
  .pg-fw::after {
    content:'';position:absolute;bottom:-1px;left:16%;right:16%;height:2px;border-radius:2px;
    background:linear-gradient(90deg,#A861D8,#A3DDDC);
    transform:scaleX(0);transition:transform .3s cubic-bezier(.4,0,.2,1);
  }
  .pg-ff:focus-within .pg-fw::after { transform:scaleX(1); }
  .pg-fi--p { padding-right:46px; }

  .pg-eye {
    position:absolute;right:12px;top:50%;transform:translateY(-50%);
    background:none;border:none;cursor:pointer;padding:0;
    width:34px;height:34px;border-radius:8px;
    display:flex;align-items:center;justify-content:center;
    color:#C4B6D0;font-size:16px;transition:all .2s;
  }
  .pg-eye:hover { color:#A861D8;background:rgba(168,97,216,0.06); }
  .pg-eye.on { color:#A861D8; }

  .pg-row { display:flex;align-items:center;justify-content:space-between;margin-bottom:1.35rem; }
  .pg-cb { display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none; }
  .pg-cb input { display:none; }
  .pg-cbb {
    width:17px;height:17px;border-radius:5px;border:1.5px solid #EBE4F4;background:#F8F6FC;
    display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;
  }
  .pg-cbb svg { width:10px;height:10px;opacity:0;transform:scale(.5);transition:all .2s; }
  .pg-cb input:checked+.pg-cbb {
    background:linear-gradient(135deg,#A3DDDC,#44B6B2);border-color:transparent;
    box-shadow:0 2px 8px rgba(68,182,178,0.25);
  }
  .pg-cb input:checked+.pg-cbb svg { opacity:1;transform:scale(1); }
  .pg-cbl { font-size:12.5px;color:#5E4A6E; }

  .pg-fgl {
    font-size:12px;font-weight:600;color:#A861D8;
    text-decoration:none;cursor:pointer;background:none;border:none;
    font-family:inherit;padding:0;transition:color .2s;position:relative;
  }
  .pg-fgl::after {
    content:'';position:absolute;bottom:-1px;left:0;right:0;height:1px;
    background:#A861D8;transform:scaleX(0);transform-origin:right;transition:transform .25s ease;
  }
  .pg-fgl:hover { color:#742A9E; }
  .pg-fgl:hover::after { transform:scaleX(1);transform-origin:left; }

  /* Error */
  .pg-err {
    padding:9px 13px;border-radius:10px;margin-bottom:1.1rem;
    background:rgba(220,38,38,0.05);border:1px solid rgba(220,38,38,0.15);
    color:#DC2626;font-size:12.5px;font-weight:500;
    display:none;align-items:center;gap:7px;
  }
  .pg-err.sh { display:flex;animation:eShk .4s ease; }
  @keyframes eShk { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(2px)} }
  .pg-ed {
    width:18px;height:18px;border-radius:5px;background:rgba(220,38,38,0.1);
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
    font-size:10px;font-weight:800;color:#DC2626;
  }

  /* Submit */
  .pg-sub {
    width:100%;padding:14px;border:none;border-radius:13px;
    font-size:14.5px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;
    color:#fff;cursor:pointer;position:relative;overflow:hidden;
    background:linear-gradient(135deg,#44B6B2 0%,#A3DDDC 50%,#44B6B2 100%);
    background-size:300% 300%;animation:shimmer 4s linear infinite;
    box-shadow:0 6px 22px rgba(68,182,178,0.3);
    transition:transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s;
    display:flex;align-items:center;justify-content:center;gap:8px;
    letter-spacing:.01em;
  }
  .pg-sub::before {
    content:'';position:absolute;top:0;left:-100%;width:200%;bottom:0;
    background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.08) 45%,rgba(255,255,255,0.16) 50%,rgba(255,255,255,0.08) 55%,transparent 100%);
    transition:left .5s ease;pointer-events:none;
  }
  .pg-sub:hover:not(:disabled)::before { left:100%; }
  .pg-sub:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 10px 30px rgba(68,182,178,0.35); }
  .pg-sub:active:not(:disabled) { transform:translateY(0); }
  .pg-sub:disabled { opacity:.5;cursor:not-allowed;transform:none; }
  .pg-arr { font-size:16px;transition:transform .2s;display:inline-block; }
  .pg-sub:hover .pg-arr { transform:translateX(3px); }
  .pg-sp { width:16px;height:16px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;flex-shrink:0; }

  .pg-or { display:flex;align-items:center;gap:12px;margin:1.35rem 0; }
  .pg-or::before,.pg-or::after { content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,#EBE4F4,transparent); }
  .pg-or span { font-size:10.5px;font-weight:700;color:#C4B6D0;letter-spacing:.1em;text-transform:uppercase; }

  /* Google button */
  .pg-ggl {
    width:100%;padding:12px;border:1.5px solid #EBE4F4;border-radius:12px;background:#fff;
    font-size:13.5px;font-weight:500;font-family:'Plus Jakarta Sans',sans-serif;color:#5E4A6E;
    cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:9px;
  }
  .pg-ggl:hover { border-color:rgba(168,97,216,0.3);box-shadow:0 3px 14px rgba(168,97,216,0.05);transform:translateY(-1px); }
  .pg-ggl:disabled { opacity:.6;cursor:not-allowed;transform:none; }

  .pg-ft { text-align:center;margin-top:1.2rem;font-size:12.5px;color:#8B7B9E; }
  .pg-ft a { font-weight:700;color:#44B6B2;text-decoration:none;cursor:pointer;transition:color .2s; }
  .pg-ft a:hover { color:#A861D8; }

  /* Success overlay */
  .pg-sc {
    position:absolute;inset:0;background:rgba(255,255,255,0.97);border-radius:24px;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    z-index:20;opacity:0;pointer-events:none;transition:opacity .4s ease;
  }
  .pg-sc.v { opacity:1;pointer-events:auto; }
  .pg-sc-c {
    width:56px;height:56px;border-radius:50%;
    background:linear-gradient(135deg,#A3DDDC,#44B6B2);
    display:flex;align-items:center;justify-content:center;
    margin-bottom:14px;box-shadow:0 8px 28px rgba(68,182,178,0.3);
    animation:sB .5s .15s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes sB { from{transform:scale(.3);opacity:0} to{transform:scale(1);opacity:1} }
  .pg-sc-c svg { stroke-dasharray:24;stroke-dashoffset:24;animation:checkDraw .5s .45s ease forwards; }
  .pg-sc-t { font-size:18px;font-weight:800;color:#4B2B63;animation:fadeUp .3s .4s ease both; }
  .pg-sc-s { font-size:13px;color:#8B7B9E;margin-top:4px;animation:fadeUp .3s .5s ease both; }

  /* ── Responsive ── */
  @media(max-width:1024px){
    .pg { flex-direction:column; }
    .pg-left { width:100%;min-height:auto;padding:2rem 1.5rem 1.5rem; }
    .pg-logo { position:relative;top:0;left:0;margin-bottom:1rem; }
    .pg-illus { max-width:380px; }
    .pg-left-txt h2 { font-size:22px; }
    .pg-left-txt { margin-top:1rem; }
    .pg-stats { margin-top:1rem; }
    .pg-right { min-height:auto;padding:1.5rem 1rem 2.5rem; }
  }
  @media(max-width:480px){
    .pg-left { padding:1.5rem 1rem 1rem; }
    .pg-illus { max-width:300px; }
    .pg-left-txt h2 { font-size:20px; }
    .pg-card { padding:2rem 1.5rem 1.75rem;border-radius:20px; }
    .pg-row { flex-direction:column;align-items:flex-start;gap:8px; }
  }
  @media(prefers-reduced-motion:reduce){
    *,*::before,*::after { animation-duration:.01ms!important;transition-duration:.01ms!important; }
  }
`;

export default function LoginPage() {
  // ── On destructure loginWithGoogle depuis le contexte ──────────────────
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const errRef = useState<HTMLDivElement | null>(null);

  /* ── Helper : affiche + anime l'erreur ── */
  const triggerErr = (msg: string) => {
    setError(msg);
    if (errRef[0]) {
      errRef[0].classList.remove("sh");
      void errRef[0].offsetWidth; // reflow pour relancer l'animation
      errRef[0].classList.add("sh");
    }
  };

  /* ── Helper : redirige selon le rôle ── */
  const redirectByRole = (role: string) => {
    if (role === "admin") router.push("/dashboard/admin");
    else if (role === "medecin") router.push("/dashboard/medecin");
    else router.push("/dashboard/patient");
  };

  /* ── Connexion classique ── */
  const handleLogin = async () => {
    if (loading) return;
    if (!username.trim() || !password) {
      triggerErr("Veuillez renseigner tous les champs.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const role = await login(username, password);
      setSuccess(true);
      setTimeout(() => redirectByRole(role), 1200);
    } catch {
      triggerErr("Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Connexion Google via le contexte (méthode pro) ── */
  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setError("");
    try {
      // loginWithGoogle() gère Firebase + backend + localStorage + état global
      const role = await loginWithGoogle();
      setSuccess(true);
      setTimeout(() => redirectByRole(role), 1200);
    } catch {
      triggerErr("Connexion Google échouée. Veuillez réessayer.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>

      <div className="pg">
        {/* ═══ LEFT ═══ */}
        <div className="pg-left">
          <div className="pg-blob pg-b1" />
          <div className="pg-blob pg-b2" />
          <div className="pg-blob pg-b3" />

          <div className="pg-logo">
            <div className="pg-logo-ic">
              <svg viewBox="0 0 18 18" fill="none">
                <rect
                  x="3"
                  y="6.5"
                  width="12"
                  height="5"
                  rx="1.2"
                  fill="white"
                />
                <rect
                  x="6.5"
                  y="3"
                  width="5"
                  height="12"
                  rx="1.2"
                  fill="white"
                />
              </svg>
            </div>
            <span className="pg-logo-tx">TéléConsult</span>
          </div>

          <div className="pg-illus">
            <svg viewBox="0 0 520 420" fill="none">
              <ellipse
                cx="260"
                cy="385"
                rx="180"
                ry="22"
                fill="rgba(168,97,216,0.06)"
              />

              {/* ── Phone ── */}
              <g transform="translate(110,35)">
                <rect
                  x="20"
                  y="10"
                  width="260"
                  height="360"
                  rx="28"
                  fill="#F3F0F8"
                  stroke="#D4C1E6"
                  strokeWidth="1.5"
                />
                <rect
                  x="28"
                  y="22"
                  width="244"
                  height="330"
                  rx="22"
                  fill="#FFFFFF"
                />
                <rect
                  x="115"
                  y="12"
                  width="70"
                  height="8"
                  rx="4"
                  fill="#F3F0F8"
                />

                {/* Status bar */}
                <rect
                  x="28"
                  y="22"
                  width="244"
                  height="30"
                  rx="22"
                  fill="url(#phoneGrad)"
                />
                <text
                  x="50"
                  y="42"
                  fontSize="10"
                  fontWeight="700"
                  fill="white"
                  fontFamily="Plus Jakarta Sans"
                >
                  09:41
                </text>
                <circle cx="252" cy="37" r="2.5" fill="rgba(255,255,255,0.4)" />
                <circle cx="242" cy="37" r="2.5" fill="rgba(255,255,255,0.4)" />
                <circle cx="232" cy="37" r="2.5" fill="rgba(255,255,255,0.4)" />

                {/* Video area */}
                <rect
                  x="36"
                  y="58"
                  width="228"
                  height="150"
                  rx="14"
                  fill="#4B2B63"
                />

                {/* Doctor in video */}
                <g
                  className="docWave"
                  style={{ transformOrigin: "150px 120px" }}
                >
                  <circle cx="150" cy="108" r="24" fill="#EDCAA8" />
                  <path
                    d="M126 104Q126 80 150 78 174 80 174 104 172 92 150 90 128 92 126 104Z"
                    fill="#3A2215"
                  />
                  <ellipse cx="142" cy="108" rx="2.2" ry="2.8" fill="#1A2B28" />
                  <ellipse cx="158" cy="108" rx="2.2" ry="2.8" fill="#1A2B28" />
                  <circle cx="143" cy="107" r=".8" fill="white" opacity=".6" />
                  <circle cx="159" cy="107" r=".8" fill="white" opacity=".6" />
                  <path
                    d="M144 118Q150 124 156 118"
                    stroke="#C09070"
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M118 136Q130 128 150 126 170 128 182 136L182 172 118 172Z"
                    fill="rgba(255,255,255,0.12)"
                  />
                  <line
                    x1="150"
                    y1="126"
                    x2="150"
                    y2="172"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                  {/* Stethoscope — vert clair */}
                  <path
                    d="M132 132Q126 142 124 158 123 168 128 170"
                    stroke="#A3DDDC"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    opacity=".6"
                  />
                  <circle
                    cx="128"
                    cy="172"
                    r="4.5"
                    fill="none"
                    stroke="#A3DDDC"
                    strokeWidth="1.8"
                    opacity=".6"
                  />
                </g>

                {/* Doctor info bar */}
                <rect
                  x="36"
                  y="214"
                  width="228"
                  height="28"
                  rx="7"
                  fill="rgba(168,97,216,0.06)"
                />
                <circle cx="54" cy="228" r="9" fill="url(#avGr)" />
                <text
                  x="70"
                  y="225"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#4B2B63"
                  fontFamily="Plus Jakarta Sans"
                >
                  Dr.Hamadi Zine
                </text>
                <text
                  x="70"
                  y="236"
                  fontSize="8"
                  fill="#8B7B9E"
                  fontFamily="Plus Jakarta Sans"
                >
                  Cardiologue • En ligne
                </text>
                <circle cx="250" cy="228" r="4" fill="#44B6B2" />

                {/* ECG */}
                <g transform="translate(36,250)">
                  <rect
                    width="228"
                    height="32"
                    rx="7"
                    fill="rgba(168,97,216,0.04)"
                  />
                  <path
                    d="M12 16H75L86 6L97 26L108 4L119 22L130 16H216"
                    stroke="url(#ecgGr)"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 400,
                      animation: "ecgDraw 2.5s ease-in-out infinite",
                    }}
                  />
                  <text
                    x="176"
                    y="20"
                    fontSize="8"
                    fontWeight="700"
                    fill="#A861D8"
                    fontFamily="Plus Jakarta Sans"
                  >
                    72 BPM
                  </text>
                </g>

                {/* Chat bubbles */}
                <g
                  className="floatSlow"
                  style={{ transformOrigin: "180px 300px" }}
                >
                  <rect
                    x="36"
                    y="292"
                    width="140"
                    height="24"
                    rx="7"
                    fill="rgba(168,97,216,0.08)"
                  />
                  <text
                    x="46"
                    y="308"
                    fontSize="8"
                    fill="#4B2B63"
                    fontFamily="Plus Jakarta Sans"
                  >
                    Comment vous sentez-vous ?
                  </text>
                </g>
                <g
                  className="float"
                  style={{
                    transformOrigin: "200px 322px",
                    animationDelay: "1s",
                  }}
                >
                  <rect
                    x="124"
                    y="322"
                    width="140"
                    height="24"
                    rx="7"
                    fill="rgba(68,182,178,0.06)"
                  />
                  <text
                    x="134"
                    y="338"
                    fontSize="8"
                    fill="#5E4A6E"
                    fontFamily="Plus Jakarta Sans"
                  >
                    Mieux, merci docteur
                  </text>
                </g>

                {/* Bottom icons */}
                <g transform="translate(90,355)">
                  <g className="iconBounce" style={{ animationDelay: "0s" }}>
                    <circle
                      cx="15"
                      cy="8"
                      r="14"
                      fill="rgba(168,97,216,0.08)"
                    />
                    <path
                      d="M10 4L20 4 20 10 17 10 17 12 13 12 13 6 10 6Z"
                      fill="#A861D8"
                      opacity=".5"
                    />
                  </g>
                  <g className="iconBounce" style={{ animationDelay: ".15s" }}>
                    <circle
                      cx="60"
                      cy="8"
                      r="14"
                      fill="rgba(168,97,216,0.08)"
                    />
                    <path
                      d="M55 4L65 4 65 10 62 10 62 12 58 12 58 6 55 6Z"
                      fill="#A861D8"
                      opacity=".5"
                      transform="rotate(180,60,8)"
                    />
                  </g>
                  <g className="iconBounce" style={{ animationDelay: ".3s" }}>
                    <circle
                      cx="105"
                      cy="8"
                      r="14"
                      fill="rgba(68,182,178,0.08)"
                    />
                    <rect
                      x="98"
                      y="1"
                      width="14"
                      height="14"
                      rx="3"
                      fill="#44B6B2"
                      opacity=".35"
                    />
                  </g>
                  <g className="iconBounce" style={{ animationDelay: ".45s" }}>
                    <circle
                      cx="150"
                      cy="8"
                      r="14"
                      fill="rgba(163,221,220,0.08)"
                    />
                    <circle
                      cx="150"
                      cy="8"
                      r="5"
                      fill="none"
                      stroke="#A3DDDC"
                      strokeWidth="1.5"
                      opacity=".5"
                    />
                    <circle cx="150" cy="8" r="2" fill="#A3DDDC" opacity=".5" />
                  </g>
                </g>
              </g>

              {/* ── Hand ── */}
              <g
                className="handReach"
                style={{ transformOrigin: "380px 230px" }}
              >
                <path
                  d="M420 270Q400 250 395 230Q392 218 398 212"
                  fill="none"
                  stroke="#EDCAA8"
                  strokeWidth="22"
                  strokeLinecap="round"
                />
                <path
                  d="M425 278Q410 262 406 248"
                  fill="none"
                  stroke="#A861D8"
                  strokeWidth="24"
                  strokeLinecap="round"
                />
                <g transform="translate(385,195)">
                  <ellipse cx="12" cy="18" rx="14" ry="16" fill="#EDCAA8" />
                  <ellipse
                    cx="4"
                    cy="6"
                    rx="3.5"
                    ry="7"
                    fill="#EDCAA8"
                    transform="rotate(-15,4,6)"
                  />
                  <ellipse cx="12" cy="2" rx="3.2" ry="8" fill="#EDCAA8" />
                  <ellipse
                    cx="20"
                    cy="3"
                    rx="3"
                    ry="7.5"
                    fill="#EDCAA8"
                    transform="rotate(10,20,3)"
                  />
                  <ellipse
                    cx="26"
                    cy="7"
                    rx="2.8"
                    ry="6"
                    fill="#EDCAA8"
                    transform="rotate(25,26,7)"
                  />
                </g>
              </g>

              {/* ── Rx Document ── */}
              <g className="rxFloat" style={{ transformOrigin: "100px 370px" }}>
                <g transform="translate(60,340) rotate(-8)">
                  <rect
                    width="80"
                    height="60"
                    rx="6"
                    fill="white"
                    stroke="#D4C1E6"
                    strokeWidth="1"
                  />
                  <rect
                    x="8"
                    y="8"
                    width="64"
                    height="3"
                    rx="1.5"
                    fill="#EBE4F4"
                  />
                  <rect
                    x="8"
                    y="16"
                    width="48"
                    height="3"
                    rx="1.5"
                    fill="#EBE4F4"
                  />
                  <rect
                    x="8"
                    y="24"
                    width="56"
                    height="3"
                    rx="1.5"
                    fill="#EBE4F4"
                  />
                  <text
                    x="44"
                    y="50"
                    fontSize="18"
                    fontWeight="800"
                    fill="#A861D8"
                    fontFamily="Plus Jakarta Sans"
                    textAnchor="middle"
                    opacity=".7"
                  >
                    Rx
                  </text>
                </g>
              </g>

              {/* ── Floating elements ── */}
              <g className="float" style={{ animationDelay: "0s" }}>
                <circle
                  cx="460"
                  cy="100"
                  r="24"
                  fill="rgba(163,221,220,0.06)"
                />
                <rect
                  x="453"
                  y="88"
                  width="14"
                  height="24"
                  rx="3"
                  fill="url(#crossG)"
                  opacity=".5"
                />
                <rect
                  x="449"
                  y="92"
                  width="22"
                  height="16"
                  rx="3"
                  fill="url(#crossG)"
                  opacity=".5"
                />
              </g>
              <g className="floatSlow" style={{ animationDelay: "2s" }}>
                <circle cx="50" cy="120" r="18" fill="rgba(168,97,216,0.06)" />
                <text
                  x="50"
                  y="126"
                  fontSize="16"
                  textAnchor="middle"
                  fill="#A861D8"
                  opacity=".4"
                  fontFamily="Plus Jakarta Sans"
                >
                  ♥
                </text>
              </g>
              <g className="float" style={{ animationDelay: "3s" }}>
                <path
                  d="M475 300L485 305 485 312Q485 320 475 323 465 320 465 312L465 305Z"
                  fill="rgba(163,221,220,0.08)"
                  stroke="rgba(163,221,220,0.15)"
                  strokeWidth="1"
                />
                <path
                  d="M471 308L474 311L479 306"
                  stroke="#44B6B2"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity=".4"
                />
              </g>
              <g
                className="rxFloat"
                style={{
                  animationDelay: "1.5s",
                  transformOrigin: "440px 380px",
                }}
              >
                <circle
                  cx="440"
                  cy="380"
                  r="14"
                  fill="rgba(168,97,216,0.05)"
                  stroke="rgba(168,97,216,0.1)"
                  strokeWidth=".8"
                />
                <text
                  x="440"
                  y="384"
                  fontSize="10"
                  textAnchor="middle"
                  fill="#A861D8"
                  opacity=".35"
                  fontFamily="Plus Jakarta Sans"
                >
                  +
                </text>
              </g>

              <defs>
                <linearGradient
                  id="phoneGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#A861D8" />
                  <stop offset="100%" stopColor="#44B6B2" />
                </linearGradient>
                <linearGradient id="ecgGr" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A861D8" stopOpacity=".3" />
                  <stop offset="50%" stopColor="#44B6B2" stopOpacity=".6" />
                  <stop offset="100%" stopColor="#A3DDDC" stopOpacity=".2" />
                </linearGradient>
                <linearGradient id="avGr" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A861D8" />
                  <stop offset="100%" stopColor="#44B6B2" />
                </linearGradient>
                <linearGradient id="crossG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A861D8" />
                  <stop offset="100%" stopColor="#44B6B2" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="pg-left-txt">
            <h2>
              Votre santé,
              <br />
              <em>à distance.</em>
            </h2>
            <p>
              Consultez un médecin qualifié par vidéo, recevez vos ordonnances
              en ligne.
            </p>
          </div>

          <div className="pg-stats">
            <div>
              <div className="pg-stat-v">2 500+</div>
              <div className="pg-stat-l">Médecins</div>
            </div>
            <div>
              <div className="pg-stat-v">98%</div>
              <div className="pg-stat-l">Satisfaction</div>
            </div>
            <div>
              <div className="pg-stat-v">15 min</div>
              <div className="pg-stat-l">Attente</div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT ═══ */}
        <div className="pg-right">
          <div className="pg-card">
            {/* ── Success overlay ── */}
            <div className={`pg-sc${success ? " v" : ""}`}>
              <div className="pg-sc-c">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 12L10 16L18 8"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="pg-sc-t">Connecté avec succès</div>
              <div className="pg-sc-s">Redirection vers votre espace...</div>
            </div>

            {/* ── Card icon ── */}
            <div className="pg-card-ic">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="8" width="14" height="8" rx="1.5" fill="white" />
                <rect x="8" y="5" width="8" height="14" rx="1.5" fill="white" />
              </svg>
            </div>

            <div className="pg-head">
              <h1>Connexion</h1>
              <p>Accédez à votre espace de téléconsultation</p>
            </div>
            <div className="pg-div" />

            {/* ── Form ── */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              autoComplete="off"
            >
              <div className="pg-ff">
                <label className="pg-fl">Identifiant</label>
                <div className="pg-fw">
                  <input
                    className="pg-fi"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Votre identifiant"
                    autoFocus
                  />
                </div>
              </div>

              <div className="pg-ff">
                <label className="pg-fl">Mot de passe</label>
                <div className="pg-fw">
                  <input
                    className="pg-fi pg-fi--p"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className={`pg-eye${showPwd ? " on" : ""}`}
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label="Afficher le mot de passe"
                  >
                    {showPwd ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div className="pg-row">
                <label className="pg-cb">
                  <input type="checkbox" readOnly />
                  <div className="pg-cbb">
                    <svg viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="pg-cbl">Se souvenir de moi</span>
                </label>
                <button
                  type="button"
                  className="pg-fgl"
                  onClick={() => router.push("/forgot-password")}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Error message */}
              <div
                className="pg-err"
                ref={(el) => {
                  (errRef as unknown as [HTMLDivElement | null])[0] = el;
                }}
              >
                <div className="pg-ed">!</div>
                <span>{error}</span>
              </div>

              <button
                type="submit"
                className="pg-sub"
                disabled={loading || success}
              >
                {loading ? (
                  <>
                    <div className="pg-sp" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter<span className="pg-arr">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="pg-or">
              <span>OU</span>
            </div>

            {/* ── Google button — appelle loginWithGoogle() du contexte ── */}
            <button
              type="button"
              className="pg-ggl"
              disabled={googleLoading || success}
              onClick={handleGoogle}
            >
              {googleLoading ? (
                <>
                  <div
                    className="pg-sp"
                    style={{ borderTopColor: "#A861D8" }}
                  />
                  Connexion Google...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 18 18">
                    <path
                      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                      fill="#4285F4"
                    />
                    <path
                      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                      fill="#34A853"
                    />
                    <path
                      d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuer avec Google
                </>
              )}
            </button>

            <div className="pg-ft">
              Pas encore de compte ?{" "}
              <a onClick={() => router.push("/register")}>S&apos;inscrire</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
