"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirm: string;
  first_name: string;
  last_name: string;
}

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
}

function Toast({ message, type }: ToastProps) {
  const cfg = {
    success: {
      bg: "rgba(68,182,178,0.12)", // Vert foncé clair
      border: "rgba(68,182,178,0.35)",
      text: "#44B6B2", // Vert foncé
      icon: "✓",
    },
    error: {
      bg: "rgba(220,38,38,0.1)",
      border: "rgba(220,38,38,0.3)",
      text: "#DC2626",
      icon: "!",
    },
    info: {
      bg: "rgba(168,97,216,0.1)", // Mauve foncé clair
      border: "rgba(168,97,216,0.3)",
      text: "#A861D8", // Mauve foncé
      icon: "ℹ",
    },
  }[type];
  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 200,
        padding: "12px 18px",
        borderRadius: 12,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.text,
        fontSize: 13,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        animation: "rpToastIn .35s cubic-bezier(.34,1.56,.64,1) both",
        maxWidth: 340,
        fontFamily: "'Plus Jakarta Sans',sans-serif",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          background: `${cfg.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {cfg.icon}
      </span>
      {message}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="rp-ff">
      <label className="rp-fl">{label}</label>
      <div className="rp-fw">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          className={`rp-fi${focus ? " rp-fi--focus" : ""}`}
        />
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  // Adapté à la palette : Rouge -> Orange -> Vert Clair -> Vert Foncé
  const cols = ["", "#ef4444", "#f97316", "#A3DDDC", "#44B6B2"];
  const labs = ["", "Faible", "Moyen", "Bien", "Fort"];
  return (
    <div style={{ marginTop: -4, marginBottom: 4 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              transition: "background 0.3s",
              background: i < score ? cols[score] : "#EBE4F4", // Trait vide Mauve très pâle
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "#8B7B9E" }}>
          Force du mot de passe
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: score > 0 ? cols[score - 1] : "#8B7B9E",
          }}
        >
          {score > 0 ? labs[score - 1] : "—"}
        </span>
      </div>
    </div>
  );
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes rpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  @keyframes rpFadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes rpSlideL{from{opacity:0;transform:translateX(-35px)}to{opacity:1;transform:translateX(0)}}
  @keyframes rpSlideR{from{opacity:0;transform:translateX(35px)}to{opacity:1;transform:translateX(0)}}
  @keyframes rpCardIn{from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes rpStepIn{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
  @keyframes rpSpin{to{transform:rotate(360deg)}}
  @keyframes rpShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes rpToastIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes rpBlobMove{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(20px,-15px) scale(1.05)}66%{transform:translate(-10px,10px) scale(.97)}}
  @keyframes rpPersonFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes rpClipFloat{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-8px) rotate(2deg)}}

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  .rp-root{min-height:100vh;display:flex;font-family:'Plus Jakarta Sans',sans-serif;background:#fff;overflow:hidden}

  /* ── Left Panel ── */
  .rp-left{
    width:50%;min-height:100vh;position:relative;overflow:hidden;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    /* Fond Mauve Foncé vers Vert Foncé */
    background:linear-gradient(165deg, #A861D8 0%, #8A3FB8 30%, #742A9E 60%, #44B6B2 100%);
    padding:2rem;flex-shrink:0;
    animation:rpSlideL .7s cubic-bezier(.22,1,.36,1) both;
  }
  .rp-left::before{
    content:'';position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(ellipse 60% 50% at 30% 20%,rgba(228,205,243,0.15) 0%,transparent 70%), /* Mauve Clair */
              radial-gradient(ellipse 40% 60% at 70% 80%,rgba(68,182,178,0.08) 0%,transparent 70%); /* Vert Foncé */
  }
  .rp-blob{position:absolute;border-radius:50%;pointer-events:none;filter:blur(70px)}
  .rp-b1{width:350px;height:350px;background:rgba(228,205,243,0.12);top:-8%;left:-5%;animation:rpBlobMove 12s ease-in-out infinite} /* Mauve Clair */
  .rp-b2{width:280px;height:280px;background:rgba(68,182,178,0.08);bottom:5%;right:-3%;animation:rpBlobMove 10s ease-in-out infinite 3s reverse} /* Vert Foncé */

  .rp-logo{position:absolute;top:1.75rem;left:2rem;z-index:5;display:flex;align-items:center;gap:10px}
  /* Logo Vert Clair -> Vert Foncé */
  .rp-logo-ic{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#A3DDDC,#44B6B2);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(68,182,178,0.35)}
  .rp-logo-ic svg{width:18px;height:18px}
  .rp-logo-tx{font-size:16px;font-weight:800;color:white;letter-spacing:-.3px}

  .rp-illus{position:relative;z-index:2;width:100%;max-width:420px;animation:rpFadeUp .8s .2s ease both}
  .rp-illus svg{width:100%;height:auto}

  .rp-ltxt{position:relative;z-index:2;text-align:center;margin-top:1.5rem;animation:rpFadeUp .6s .5s ease both}
  .rp-ltxt h2{font-size:26px;font-weight:800;color:white;letter-spacing:-.8px;line-height:1.15;margin-bottom:6px}
  /* Titre Vert Clair -> Blanc */
  .rp-ltxt h2 em{font-style:normal;background:linear-gradient(135deg,#A3DDDC,#FFFFFF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .rp-ltxt p{font-size:13.5px;color:rgba(228,205,243,0.8);line-height:1.6;max-width:340px;margin:0 auto}

  /* Badge patient */
  .rp-badge{
    position:relative;z-index:2;margin-top:1.5rem;padding:"12px 16px";border-radius:14px;
    border:1.5px solid rgba(163,221,220,0.3);background:rgba(163,221,220,0.06);
    display:flex;align-items:center;gap:12px;width:100%;max-width:340px;
    animation:rpFadeUp .6s .6s ease both;
  }
  .rp-badge-tx{flex:1}
  .rp-badge-title{font-size:13px;font-weight:700;color:#44B6B2} /* Vert Foncé */
  .rp-badge-sub{font-size:11px;color:rgba(228,205,243,0.6);margin-top:2px}
  .rp-badge-check{width:22px;height:22px;border-radius:50%;background:#44B6B2;display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:700}

  .rp-note{
    position:relative;z-index:2;margin-top:12px;padding:"10px 14px";border-radius:10px;
    background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
    display:flex;align-items:flex-start;gap:8px;max-width:340px;width:100%;
    animation:rpFadeUp .6s .65s ease both;
  }
  .rp-note p{font-size:11.5px;color:rgba(228,205,243,0.5);lineHeight:1.6;margin:0}

  .rp-back-link{
    position:relative;z-index:2;margin-top:auto;padding-top:2.5rem;
    font-size:13px;color:rgba(228,205,243,0.6);
    animation:rpFadeUp .6s .7s ease both;
  }
  .rp-back-link button{background:none;border:none;cursor:pointer;font-family:inherit;font-size:13px;color:#A3DDDC;font-weight:600;padding:0} /* Vert Clair */

  /* ── Right Panel ── */
  .rp-right{
    flex:1;min-height:100vh;display:flex;align-items:center;justify-content:center;
    padding:2rem;position:relative;
    background:#E4CDF3; /* Fond Mauve Clair */
    animation:rpSlideR .7s .1s cubic-bezier(.22,1,.36,1) both;
  }
  .rp-right::before{
    content:'';position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(circle at 85% 15%,rgba(255,255,255,0.6) 0%,transparent 50%),
              radial-gradient(circle at 10% 90%,rgba(68,182,178,0.05) 0%,transparent 50%);
  }

  .rp-card{
    width:100%;max-width:430px;background:#fff;border-radius:24px;
    padding:2.75rem 2.25rem 2.25rem;position:relative;z-index:2;overflow:hidden;
    box-shadow:0 2px 4px rgba(168,97,216,0.04),0 12px 40px rgba(168,97,216,0.08),0 0 0 1px rgba(255,255,255,0.4);
    animation:rpCardIn .65s .3s cubic-bezier(.22,1,.36,1) both;
  }
  .rp-card::before{
    content:'';position:absolute;top:0;left:8%;right:8%;height:2.5px;
    /* Trait haut : Vert Clair -> Vert Foncé */
    background:linear-gradient(90deg,transparent,#A3DDDC,#44B6B2,transparent);
    border-radius:0 0 2px 2px;
  }

  .rp-step-c{animation:rpStepIn .38s cubic-bezier(.22,1,.36,1) both}

  /* Step indicator */
  .rp-steps{display:flex;align-items:center;gap:8px;margin-bottom:2rem}
/* Dans votre constante CSS */
  .rp-step-dot {
    width: 40px;          /* Taille réduite pour s'intégrer correctement */
    height: 40px;         /* Hauteur identique à la largeur pour faire un cercle */
    border-radius: 50%;   /* 50% pour avoir un cercle parfait (au lieu de 25%) */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;      /* Taille du chiffre à l'intérieur */
    font-weight: 700;
    transition: all 0.4s;
    border: 2px solid transparent; /* Ajout d'une bordure par défaut */
  }
  .rp-step-line{width:40;height:1.5;border-radius:2;margin-left:4;transition:background .4s}
  .rp-step-lbl{font-size:12;font-weight:500;transition:color .4s}

  /* Fields */
  .rp-ff{margin-bottom:1.15rem}
  .rp-fl{display:block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8B7B9E;margin-bottom:6px;transition:color .2s}
  .rp-ff:focus-within .rp-fl{color:#A861D8} /* Focus Mauve Foncé */
  .rp-fw{position:relative}
  .rp-fi{
    width:100%;padding:13px 16px;background:#F8F6FC;border:1.5px solid #EBE4F4;border-radius:12px;
    font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;color:#4B2B63;outline:none;
    transition:all .25s cubic-bezier(.4,0,.2,1);box-sizing:border-box;
  }
  .rp-fi::placeholder{color:#C4B6D0}
  .rp-fi:hover{border-color:#D4C1E6;background:#FDFBFF}
  .rp-fi--focus,.rp-fi:focus{background:#fff;border-color:#A861D8;box-shadow:0 0 0 4px rgba(168,97,216,0.1)}
  .rp-fw::after{
    content:'';position:absolute;bottom:-1px;left:16%;right:16%;height:2px;border-radius:2px;
    /* Underline : Mauve Foncé -> Vert Clair */
    background:linear-gradient(90deg,#A861D8,#A3DDDC);
    transform:scaleX(0);transition:transform .3s cubic-bezier(.4,0,.2,1)
  }
  .rp-ff:focus-within .rp-fw::after{transform:scaleX(1)}

  /* Buttons */
  .rp-btn{
    width:100%;padding:14px;border:none;border-radius:13px;font-size:14.5px;font-weight:700;
    font-family:'Plus Jakarta Sans',sans-serif;color:#fff;cursor:pointer;position:relative;overflow:hidden;
    /* Bouton : Vert Foncé -> Vert Clair */
    background:linear-gradient(135deg,#44B6B2 0%,#A3DDDC 50%,#44B6B2 100%);
    background-size:300% 300%;animation:rpShimmer 4s linear infinite;
    box-shadow:0 6px 22px rgba(68,182,178,0.3);transition:transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s;
    display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:.01em;
  }
  .rp-btn::before{content:'';position:absolute;top:0;left:-100%;width:200%;bottom:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.08) 45%,rgba(255,255,255,0.16) 50%,rgba(255,255,255,0.08) 55%,transparent 100%);transition:left .5s ease;pointer-events:none}
  .rp-btn:hover:not(:disabled)::before{left:100%}
  .rp-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 30px rgba(68,182,178,0.35)}
  .rp-btn:active:not(:disabled){transform:translateY(0)}
  .rp-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
  .rp-arr{font-size:16px;transition:transform .2s;display:inline-block}
  .rp-btn:hover .rp-arr{transform:translateX(3px)}
  .rp-sp{width:16px;height:16px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:rpSpin .6s linear infinite;flex-shrink:0}

  .rp-btn-back{
    width:48px;height:48px;flex-shrink:0;padding:0;border-radius:12px;
    border:1.5px solid #EBE4F4;background:#F8F6FC;color:#8B7B9E;
    font-size:18px;cursor:pointer;font-family:inherit;
    display:flex;align-items:center;justify-content:center;transition:all .2s;
  }
  .rp-btn-back:hover{border-color:#A861D8;color:#A861D8;background:rgba(168,97,216,0.06)}

  /* Google */
  .rp-or{display:flex;align-items:center;gap:12px;margin:1.35rem 0}
  .rp-or::before,.rp-or::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,#EBE4F4,transparent)}
  .rp-or span{font-size:10.5px;font-weight:700;color:#C4B6D0;letter-spacing:.1em;text-transform:uppercase}

  .rp-ggl{
    width:100%;padding:12px;border:1.5px solid #EBE4F4;border-radius:12px;background:#fff;
    font-size:13.5px;font-weight:500;font-family:'Plus Jakarta Sans',sans-serif;color:#5E4A6E;
    cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:9px;
  }
  .rp-ggl:hover{border-color:rgba(168,97,216,0.3);box-shadow:0 3px 14px rgba(168,97,216,0.05);transform:translateY(-1px)}
  .rp-ggl:disabled{opacity:.6;cursor:not-allowed;transform:none}

  /* Error */
  .rp-err{padding:10px 14px;border-radius:10px;margin-bottom:16px;background:rgba(220,38,38,0.05);border:1px solid rgba(220,38,38,0.15);color:#DC2626;font-size:13px;font-weight:500;display:flex;align-items:center;gap:8px}
  .rp-err-dot{width:18px;height:18px;border-radius:5px;background:rgba(220,38,38,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;font-weight:800;color:#DC2626}

  .rp-ft{font-size:11px;color:"#8B7B9E";text-align:center;margin-top:20px;line-height:1.6}

  @media(max-width:1024px){
    .rp-root{flex-direction:column}
    .rp-left{width:100%;min-height:auto;padding:2rem 1.5rem 1.5rem}
    .rp-logo{position:relative;top:0;left:0;margin-bottom:1rem}
    .rp-illus{max-width:320px}
    .rp-ltxt h2{font-size:22px}
    .rp-badge,.rp-note{max-width:100%}
    .rp-right{min-height:auto;padding:1.5rem 1rem 2.5rem}
  }
  @media(max-width:480px){
    .rp-illus{max-width:260px}
    .rp-card{padding:2rem 1.5rem 1.75rem;border-radius:20px}
  }
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirm: "",
    first_name: "",
    last_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [toast, setToast] = useState<ToastProps | null>(null);

  const set = (k: keyof FormData, v: string) =>
    setForm((p) => ({ ...p, [k]: v }));
  const notify = (
    message: string,
    type: ToastProps["type"] = "info",
    ms = 3500,
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), ms);
  };

  // ── Google Auth ──
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }, []);

  const handleGoogleCredential = async (response: { credential: string }) => {
    setGoogleLoading(true);
    try {
      await api.post("auth/google/", {
        token: response.credential,
        role: "patient",
      });
      notify("Compte créé avec succès !", "success");
      setTimeout(() => router.push("/login?registered=1"), 800);
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      notify(detail || "Erreur lors de l'inscription Google.", "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const signInWithGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      notify(
        "Authentification Google non configurée. Contactez l'administrateur.",
        "error",
      );
      return;
    }
    const g = (window as any).google;
    if (!g?.accounts?.id) {
      notify("Chargement en cours, réessayez...", "info");
      return;
    }
    g.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      auto_select: false,
    });
    g.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        notify("Impossible d'ouvrir la fenêtre Google.", "error");
      }
    });
  };

  const goStep2 = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Veuillez renseigner votre prénom et nom.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError("Tous les champs sont requis.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    try {
      await api.post("register/", {
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        role: "patient",
      });
      router.push("/login?registered=1");
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.username) setError("Ce nom d'utilisateur est déjà pris.");
      else if (data?.email) setError("Cet email est déjà utilisé.");
      else setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      {toast && <Toast {...toast} />}

      <div className="rp-root">
        <div className="rp-left">
          <div className="rp-blob rp-b1" />
          <div className="rp-blob rp-b2" />
          <div className="rp-logo">
            <div className="rp-logo-ic">
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
            <span className="rp-logo-tx">TéléConsult</span>
          </div>
          <div className="rp-illus">
            <svg viewBox="0 0 440 380" fill="none">
              <ellipse
                cx="220"
                cy="345"
                rx="150"
                ry="18"
                fill="rgba(168,97,216,0.05)"
              />
              <g transform="translate(100,30)">
                <g
                  className="rpPersonFloat"
                  style={{ transformOrigin: "120px 180px" }}
                >
                  {/* Person */}
                  <circle cx="120" cy="80" r="30" fill="#EDCAA8" />
                  <path
                    d="M90 76Q90 46 120 44 150 46 150 76 148 62 120 60 92 62 90 76Z"
                    fill="#3A2215"
                  />
                  <path
                    d="M90 76Q88 86 90 94"
                    stroke="#3A2215"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M150 76Q152 86 150 94"
                    stroke="#3A2215"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <ellipse cx="112" cy="82" rx="2.5" ry="3" fill="#2C1810" />
                  <ellipse cx="128" cy="82" rx="2.5" ry="3" fill="#2C1810" />
                  <circle cx="113" cy="81" r=".8" fill="white" opacity=".6" />
                  <circle cx="129" cy="81" r=".8" fill="white" opacity=".6" />
                  <path
                    d="M114 93Q120 99 126 93"
                    stroke="#C09070"
                    strokeWidth="1.3"
                    fill="none"
                    strokeLinecap="round"
                  />
                  {/* Body */}
                  <path
                    d="M86 116Q82 130 80 165L80 230 160 230 160 165Q158 130 154 116Z"
                    fill="url(#rpCoat)"
                  />
                  <line
                    x1="120"
                    y1="116"
                    x2="120"
                    y2="230"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                  {/* Arms */}
                  <path
                    d="M86 120Q72 134 68 155"
                    stroke="url(#rpCoat)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M154 120Q168 134 172 155"
                    stroke="url(#rpCoat)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Plus badge on chest - Mauve Foncé */}
                  <g transform="translate(100,140)">
                    <rect
                      width="40"
                      height="40"
                      rx="12"
                      fill="rgba(168,97,216,0.15)"
                      stroke="rgba(168,97,216,0.3)"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="16"
                      y="10"
                      width="8"
                      height="20"
                      rx="2"
                      fill="#A861D8"
                      opacity=".7"
                    />
                    <rect
                      x="10"
                      y="16"
                      width="20"
                      height="8"
                      rx="2"
                      fill="#A861D8"
                      opacity=".7"
                    />
                  </g>
                </g>
                {/* Clipboard */}
                <g
                  className="rpClipFloat"
                  style={{ transformOrigin: "220px 150px" }}
                  transform="translate(200,100)"
                >
                  <rect
                    width="50"
                    height="65"
                    rx="6"
                    fill="white"
                    stroke="#D4C1E6"
                    strokeWidth="1"
                  />
                  <rect
                    x="8"
                    y="10"
                    width="34"
                    height="3"
                    rx="1.5"
                    fill="#EBE4F4"
                  />
                  <rect
                    x="8"
                    y="18"
                    width="28"
                    height="3"
                    rx="1.5"
                    fill="#EBE4F4"
                  />
                  <rect
                    x="8"
                    y="26"
                    width="32"
                    height="3"
                    rx="1.5"
                    fill="#EBE4F4"
                  />
                  <rect
                    x="8"
                    y="34"
                    width="24"
                    height="3"
                    rx="1.5"
                    fill="#EBE4F4"
                  />
                  <rect
                    x="15"
                    y="-3"
                    width="20"
                    height="7"
                    rx="3.5"
                    fill="#D4C1E6"
                  />
                  <text
                    x="25"
                    y="55"
                    fontSize="12"
                    fontWeight="800"
                    fill="#A861D8"
                    fontFamily="Plus Jakarta Sans"
                    textAnchor="middle"
                    opacity=".6"
                  >
                    Rx
                  </text>
                </g>
              </g>
              {/* Floating elements */}
              <g className="rpFloat" style={{ animationDelay: "0s" }}>
                <circle cx="370" cy="90" r="20" fill="rgba(163,221,220,0.06)" />
                <rect
                  x="364"
                  y="80"
                  width="12"
                  height="20"
                  rx="2.5"
                  fill="#A3DDDC"
                  opacity=".3"
                />
                <rect
                  x="361"
                  y="84"
                  width="18"
                  height="12"
                  rx="2.5"
                  fill="#A3DDDC"
                  opacity=".3"
                />
              </g>
              <g className="rpFloat" style={{ animationDelay: "2s" }}>
                <circle cx="60" cy="120" r="16" fill="rgba(168,97,216,0.06)" />
                <text
                  x="60"
                  y="125"
                  fontSize="13"
                  textAnchor="middle"
                  fill="#A861D8"
                  opacity=".3"
                  fontFamily="Plus Jakarta Sans"
                >
                  ♥
                </text>
              </g>
              <g className="rpFloat" style={{ animationDelay: "3s" }}>
                <circle
                  cx="380"
                  cy="260"
                  r="14"
                  fill="rgba(163,221,220,0.05)"
                  stroke="rgba(163,221,220,0.1)"
                  strokeWidth=".8"
                />
                <text
                  x="380"
                  y="264"
                  fontSize="10"
                  textAnchor="middle"
                  fill="#44B6B2"
                  opacity=".3"
                  fontFamily="Plus Jakarta Sans"
                >
                  +
                </text>
              </g>
              <g className="rpFloat" style={{ animationDelay: "1s" }}>
                <path
                  d="M55 280L63 284 63 290Q63 298 55 300 47 298 47 290L47 284Z"
                  fill="rgba(168,97,216,0.06)"
                  stroke="rgba(168,97,216,0.12)"
                  strokeWidth=".8"
                />
                <path
                  d="M51 288L54 291L58 287"
                  stroke="#44B6B2"
                  strokeWidth="1"
                  strokeLinecap="round"
                  opacity=".3"
                />
              </g>
              <defs>
                {/* Coat Gradient: Mauve Foncé -> Vert Clair */}
                <linearGradient id="rpCoat" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A861D8" />
                  <stop offset="100%" stopColor="#A3DDDC" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="rp-ltxt">
            <h2>
              Créez votre <em>espace santé</em>
            </h2>
            <p>
              Accédez à vos consultations, ordonnances et rendez-vous médicaux
              en toute sécurité.
            </p>
          </div>
          <div className="rp-badge">
            <span style={{ fontSize: 22 }}>🧑</span>
            <div className="rp-badge-tx">
              <div className="rp-badge-title">Patient</div>
              <div className="rp-badge-sub">
                Prenez vos rendez-vous, consultez vos ordonnances
              </div>
            </div>
            <div className="rp-badge-check">✓</div>
          </div>
          <div className="rp-note">
            <span style={{ fontSize: 13, marginTop: 1 }}>ℹ️</span>
            <p>
              Vous êtes médecin ? Les comptes praticiens sont créés par
              l&apos;administrateur de la plateforme.
            </p>
          </div>
          <div className="rp-back-link">
            Déjà un compte ?{" "}
            <button onClick={() => router.push("/login")}>
              Se connecter →
            </button>
          </div>
        </div>

        <div className="rp-right">
          <div className="rp-card">
            {/* Step indicator */}
            <div className="rp-steps">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div
                    className="rp-step-dot"
                    style={{
                      background:
                        step >= s
                          ? "linear-gradient(135deg,#A3DDDC,#44B6B2)" /* Steps verts */
                          : "#F8F6FC",
                      border: `2px solid ${step >= s ? "#44B6B2" : "#EBE4F4"}`,
                      color: step >= s ? "white" : "#C4B6D0",
                    }}
                  >
                    {step > s ? "✓" : s}
                  </div>
                  <span
                    className="rp-step-lbl"
                    style={{ color: step >= s ? "#4B2B63" : "#C4B6D0" }}
                  >
                    {s === 1 ? "Identité" : "Compte"}
                  </span>
                  {s < 2 && (
                    <div
                      className="rp-step-line"
                      style={{ background: step > s ? "#44B6B2" : "#EBE4F4" }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#4B2B63" /* Titre Mauve très foncé */,
                  letterSpacing: "-.5px",
                  marginBottom: 6,
                }}
              >
                {step === 1 ? "Vos informations" : "Vos identifiants"}
              </h2>
              <p style={{ fontSize: 13, color: "#8B7B9E" }}>
                {step === 1
                  ? "Renseignez votre prénom et nom"
                  : "Choisissez un identifiant et un mot de passe sécurisé"}
              </p>
            </div>

            {error && (
              <div className="rp-err">
                <div className="rp-err-dot">!</div>
                <span>{error}</span>
              </div>
            )}

            {step === 1 && (
              <div
                className="rp-step-c"
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <Field
                    label="Prénom"
                    value={form.first_name}
                    onChange={(v) => set("first_name", v)}
                    placeholder="Jean"
                  />
                  <Field
                    label="Nom"
                    value={form.last_name}
                    onChange={(v) => set("last_name", v)}
                    placeholder="Dupont"
                  />
                </div>
                <button className="rp-btn" onClick={goStep2}>
                  Continuer <span className="rp-arr">→</span>
                </button>
              </div>
            )}

            {step === 2 && (
              <div
                className="rp-step-c"
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <Field
                  label="Nom d'utilisateur"
                  value={form.username}
                  onChange={(v) => set("username", v)}
                  placeholder="jean.dupont"
                />
                <Field
                  label="Adresse email"
                  value={form.email}
                  onChange={(v) => set("email", v)}
                  placeholder="jean@email.com"
                  type="email"
                />
                <Field
                  label="Mot de passe"
                  value={form.password}
                  onChange={(v) => set("password", v)}
                  placeholder="••••••••"
                  type="password"
                />
                {form.password && <PasswordStrength password={form.password} />}
                <Field
                  label="Confirmer le mot de passe"
                  value={form.confirm}
                  onChange={(v) => set("confirm", v)}
                  placeholder="••••••••"
                  type="password"
                />
                {form.confirm && (
                  <p
                    style={{
                      margin: "-4px 0 0",
                      fontSize: 11,
                      fontWeight: 600,
                      color:
                        form.confirm === form.password ? "#44B6B2" : "#DC2626",
                    }}
                  >
                    {form.confirm === form.password
                      ? "✓ Les mots de passe correspondent"
                      : "✗ Ne correspondent pas"}
                  </p>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button
                    className="rp-btn-back"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                  >
                    ←
                  </button>
                  <button
                    className="rp-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="rp-sp" />
                        Création en cours...
                      </>
                    ) : (
                      "Créer mon compte"
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="rp-or">
              <span>OU</span>
            </div>
            <button
              className="rp-ggl"
              disabled={googleLoading || loading}
              onClick={signInWithGoogle}
            >
              {googleLoading ? (
                <>
                  <div className="rp-sp" />
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

            <p className="rp-ft">
              En créant un compte, vous acceptez nos conditions
              d&apos;utilisation et notre politique de confidentialité.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
