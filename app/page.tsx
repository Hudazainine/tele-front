"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ── SVG Icon Helper ─────────────────────────────────────────────────────────
const Icon = ({ d, size = 22 }: { d: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const icons = {
  menu: "M4 6h16M4 12h16M4 18h16",
  x: "M18 6L6 18M6 6l12 12",
  search: "M11 3a8 8 0 100 16 8 8 0 000-16zM21 21l-4.35-4.35",
  video:
    "M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
  calendar:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  heart:
    "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  brain:
    "M9.5 2A2.5 2.5 0 017 4.5v0A2.5 2.5 0 014.5 7H4a2 2 0 00-2 2v0a2 2 0 002 2h.5A2.5 2.5 0 017 13.5v0A2.5 2.5 0 019.5 16H10v2a2 2 0 002 2v0a2 2 0 002-2v-2h.5A2.5 2.5 0 0117 13.5v0A2.5 2.5 0 0119.5 11H20a2 2 0 002-2v0a2 2 0 00-2-2h-.5A2.5 2.5 0 0117 4.5v0A2.5 2.5 0 0114.5 2H14",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  check: "M20 6L9 17l-5-5",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  stethoscope: "M6 14h.01M6 18h.01M8 6v6a4 4 0 01-4 4H2m20-8v2a8 8 0 01-8 8h-2",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z",
  quote:
    "M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21zm16 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-1.75 4v3c0 1 0 1 1 1z",
};

// ── Data ─────────────────────────────────────────────────────────────────────
const SPECIALTIES = [
  {
    icon: icons.heart,
    title: "Cardiologie",
    color: "#7C3AED",
    img: "https://images.unsplash.com/photo-1628348070881-cf72db4a5646?q=80&w=400&auto=format&fit=crop",
  },
  {
    icon: icons.brain,
    title: "Neurologie",
    color: "#14B8A6",
    img: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=400&auto=format&fit=crop",
  },
  {
    icon: icons.eye,
    title: "Ophtalmologie",
    color: "#3B82F6",
    img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=400&auto=format&fit=crop",
  },
  {
    icon: icons.stethoscope,
    title: "Généraliste",
    color: "#10B981",
    img: "https://images.unsplash.com/photo-1612349317150-e813f7851ce5?q=80&w=400&auto=format&fit=crop",
  },
  {
    icon: icons.user,
    title: "Pédiatrie",
    color: "#F59E0B",
    img: "https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=400&auto=format&fit=crop",
  },
  {
    icon: icons.shield,
    title: "Dermatologie",
    color: "#EC4899",
    img: "https://images.unsplash.com/photo-1570172619644-d6013b3a7b3f?q=80&w=400&auto=format&fit=crop",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Inscrivez-vous",
    desc: "Créez votre espace santé sécurisé en quelques clics.",
    icon: icons.user,
    img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=400&auto=format&fit=crop",
  },
  {
    num: "02",
    title: "Réservez",
    desc: "Choisissez un spécialiste et prenez rendez-vous instantanément.",
    icon: icons.calendar,
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop",
  },
  {
    num: "03",
    title: "Consultez",
    desc: "Rencontrez votre médecin en visioconférence sécurisée.",
    icon: icons.video,
    img: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=400&auto=format&fit=crop",
  },
];

const STATS = [
  { value: "200+", label: "Médecins vérifiés" },
  { value: "15k+", label: "Patients satisfaits" },
  { value: "98%", label: "Taux de satisfaction" },
];

const TESTIMONIALS = [
  {
    name: "Sophie L.",
    role: "Patiente",
    text: "Une plateforme incroyablement simple. J'ai pu consulter un cardiologue en 10 minutes sans sortir de chez moi.",
    rating: 5,
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop",
  },
  {
    name: "Dr. Karim B.",
    role: "Cardiologue",
    text: "L'outil parfait pour mes consultations à distance. L'interface est fluide et mes patients adorent.",
    rating: 5,
    img: "https://images.unsplash.com/photo-1612349317150-e813f7851ce5?q=80&w=100&auto=format&fit=crop",
  },
  {
    name: "Marie D.",
    role: "Patiente",
    text: "Le suivi médical est top ! Je retrouve toutes mes ordonnances et historiques en un clic.",
    rating: 5,
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop",
  },
];

// ── Components ───────────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `all 0.9s ${delay}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
    >
      {children}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        color: "#1E293B",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:#F8FAFC}
        ::-webkit-scrollbar-thumb{background:linear-gradient(180deg, #7C3AED, #14B8A6);border-radius:3px}
        
        .btn-primary{background:linear-gradient(135deg, #7C3AED, #14B8A6);color:white;border:none;padding:14px 28px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.3s;box-shadow:0 8px 20px rgba(124,58,237,0.25)}
        .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(20,184,166,0.35)}
        
        .btn-outline{background:transparent;color:#7C3AED;border:1.5px solid rgba(124,58,237,0.3);padding:13px 28px;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.3s}
        .btn-outline:hover{background:rgba(124,58,237,0.05);border-color:#7C3AED;transform:translateY(-2px)}
        
        .nav-link{font-size:14px;font-weight:600;color:#64748B;cursor:pointer;transition:color 0.2s;background:none;border:none;font-family:inherit}
        .nav-link:hover{color:#7C3AED}
        
        .spec-card{transition:all 0.4s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid rgba(255,255,255,0.8); background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.03);}
        .spec-card:hover{transform:translateY(-8px);box-shadow:0 20px 40px rgba(124,58,237,0.1);border-color:rgba(20,184,166,0.2)}
        .spec-card:hover .spec-img{transform: scale(1.05)}
        .spec-img{transition: transform 0.5s ease}
        
        .step-card{transition:all 0.4s cubic-bezier(0.16, 1, 0.3, 1); border: 1px solid rgba(255,255,255,0.8); background: white; overflow: hidden; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);}
        .step-card:hover{transform:translateY(-5px);box-shadow:0 20px 40px rgba(20,184,166,0.1);border-color:rgba(124,58,237,0.2)}

        .glass-card{background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.6);box-shadow:0 15px 40px rgba(0,0,0,0.08)}
        
        .testimonial-card{background:#FFFFFF;border:1px solid rgba(255,255,255,0.8);border-radius:24px;padding:32px;transition:all 0.3s;position:relative;box-shadow:0 4px 20px rgba(0,0,0,0.03)}
        .testimonial-card:hover{transform:translateY(-5px);box-shadow:0 15px 30px rgba(124,58,237,0.08);border-color:rgba(20,184,166,0.15)}

        @media(max-width:768px){.desktop-nav{display:none!important}.mobile-nav{display:block!important}}
        @media(min-width:769px){.mobile-nav{display:none!important}}
      `}</style>

      {/* ── NAVBAR ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: scrolled ? "12px 5%" : "20px 5%",
          background: scrolled ? "rgba(255,255,255,0.9)" : "#FFFFFF",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(0,0,0,0.05)"
            : "1px solid transparent",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
          }}
          onClick={() => scrollTo("hero")}
        >
          {/* Custom AlloMed Logo SVG */}
          <img
            src="/LogoT.png"
            alt="AlloMed Logo"
            style={{
              width: 40,
              height: 40,
              objectFit: "contain",
            }}
          />
        </div>

        <div
          className="desktop-nav"
          style={{ display: "flex", alignItems: "center", gap: 32 }}
        >
          {[
            ["Accueil", "hero"],
            ["Spécialités", "specialties"],
            ["Fonctionnement", "steps"],
            ["Témoignages", "testimonials"],
          ].map(([l, id]) => (
            <button key={id} className="nav-link" onClick={() => scrollTo(id)}>
              {l}
            </button>
          ))}
        </div>

        <div
          className="desktop-nav"
          style={{ display: "flex", gap: 12, alignItems: "center" }}
        >
          <button
            className="nav-link"
            onClick={() => router.push("/login")}
            style={{
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: "10px",
              transition: "background 0.2s",
            }}
          >
            Connexion
          </button>
          <button
            className="btn-primary"
            onClick={() => router.push("/register")}
          >
            Inscription
          </button>
        </div>

        <button
          className="mobile-nav"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "none",
            border: "none",
            color: "#0F172A",
            cursor: "pointer",
          }}
        >
          <Icon d={menuOpen ? icons.x : icons.menu} size={24} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
            background: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
          }}
        >
          {["Accueil", "Spécialités", "Fonctionnement", "Témoignages"].map(
            (l) => (
              <button
                key={l}
                onClick={() => scrollTo(l.toLowerCase())}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0F172A",
                  fontSize: 22,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {l}
              </button>
            ),
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              className="btn-outline"
              onClick={() => {
                router.push("/login");
                setMenuOpen(false);
              }}
            >
              Connexion
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                router.push("/register");
                setMenuOpen(false);
              }}
            >
              Inscription
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section
        id="hero"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          paddingTop: 80,
          position: "relative",
          overflow: "hidden",
          background: "#FFFFFF",
        }}
      >
        {/* Gradient Mesh Background */}
        <div
          style={{
            position: "absolute",
            top: "-30%",
            right: "-15%",
            width: 800,
            height: 800,
            borderRadius: "50%",
            background: "rgba(124,58,237,0.06)",
            filter: "blur(120px)",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            bottom: "-20%",
            left: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "rgba(20,184,166,0.06)",
            filter: "blur(120px)",
          }}
        ></div>

        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 5%",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5rem",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(124,58,237,0.05)",
                color: "#7C3AED",
                padding: "8px 18px",
                borderRadius: 30,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 28,
                border: "1px solid rgba(124,58,237,0.1)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7C3AED, #14B8A6)",
                  display: "inline-block",
                }}
              ></span>{" "}
              Téléconsultation en ligne
            </div>
            <h1
              style={{
                fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
                fontWeight: 800,
                color: "#0F172A",
                lineHeight: 1.05,
                marginBottom: 24,
                letterSpacing: "-2px",
              }}
            >
              Votre santé,
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #14B8A6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                à portée de clic.
              </span>
            </h1>
            <p
              style={{
                fontSize: 18,
                color: "#64748B",
                lineHeight: 1.7,
                marginBottom: 40,
                maxWidth: 480,
                fontWeight: 400,
              }}
            >
              Consultez des médecins certifiés en vidéo, obtenez vos ordonnances
              en ligne et suivez votre santé sans vous déplacer.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button
                className="btn-primary"
                style={{
                  padding: "16px 32px",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
                onClick={() => router.push("/register")}
              >
                <Icon d={icons.video} size={18} /> Lancer une téléconsultation
              </button>
              <button
                className="btn-outline"
                style={{ padding: "16px 32px", fontSize: 16 }}
                onClick={() => scrollTo("steps")}
              >
                Comment ça marche ?
              </button>
            </div>
          </div>

          {/* Image Section with Professional Fade & Floating UI */}
          <div
            style={{ position: "relative", width: "100%", minHeight: "600px" }}
          >
            <img
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1587&auto=format&fit=crop"
              alt="Médecin professionnel utilisant une plateforme de téléconsultation moderne"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 32,
                boxShadow: "0 30px 60px -15px rgba(124,58,237,0.2)",
                position: "absolute",
                right: 0,
                top: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "50%",
                background: "linear-gradient(to top, #FFFFFF, transparent)",
                borderRadius: "0 0 32px 32px",
              }}
            ></div>

            {/* Floating Glass UI Widget */}
            <div
              className="glass-card"
              style={{
                position: "absolute",
                bottom: 50,
                left: -20,
                width: 320,
                borderRadius: 24,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                boxShadow: "0 20px 50px rgba(124,58,237,0.15)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                  paddingBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #7C3AED, #14B8A6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                  }}
                >
                  <Icon d={icons.video} size={20} />
                </div>
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}
                  >
                    Téléconsultation
                  </div>
                  <div
                    style={{ fontSize: 12, color: "#14B8A6", fontWeight: 600 }}
                  >
                    Aujourd'hui - 14:30
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src="https://images.unsplash.com/photo-1612349317150-e813f7851ce5?q=80&w=100&auto=format&fit=crop"
                  alt="Dr."
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid white",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}
                  >
                    Dr. Karim Mrad
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>
                    Généraliste • En ligne
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{
                    padding: "8px 16px",
                    fontSize: 12,
                    borderRadius: 10,
                  }}
                >
                  Rejoindre
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        style={{
          background: "#0F172A",
          padding: "80px 5%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(124,58,237,0.15)",
            filter: "blur(100px)",
          }}
        ></div>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "2rem",
            textAlign: "center",
            color: "white",
            position: "relative",
            zIndex: 1,
          }}
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #A78BFA, #5EEAD4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 8,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#94A3B8",
                  fontWeight: 600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SPECIALTIES ── */}
      <FadeIn>
        <section
          id="specialties"
          style={{ padding: "120px 5%", background: "#F8FAFC" }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(20,184,166,0.05)",
                  color: "#14B8A6",
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 16,
                  border: "1px solid rgba(20,184,166,0.1)",
                  letterSpacing: "1px",
                }}
              >
                SPÉCIALITÉS
              </div>
              <h2
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: "#0F172A",
                  marginBottom: 16,
                  letterSpacing: "-1.5px",
                }}
              >
                Nos spécialités
              </h2>
              <p
                style={{
                  color: "#64748B",
                  fontSize: 18,
                  maxWidth: 500,
                  margin: "0 auto",
                  lineHeight: 1.6,
                }}
              >
                Un réseau de spécialistes qualifiés à votre écoute, où que vous
                soyez.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "1.5rem",
              }}
            >
              {SPECIALTIES.map((s) => (
                <div
                  key={s.title}
                  className="spec-card"
                  style={{
                    borderRadius: 24,
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => router.push("/register")}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 160,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      src={s.img}
                      alt={s.title}
                      className="spec-img"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(15,23,42,0.5), transparent)",
                      }}
                    ></div>
                  </div>
                  <div style={{ padding: "20px 16px", textAlign: "center" }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: `${s.color}10`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: s.color,
                        margin: "0 auto 12px",
                        border: `1px solid ${s.color}20`,
                      }}
                    >
                      <Icon d={s.icon} size={22} />
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#0F172A",
                      }}
                    >
                      {s.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── HOW IT WORKS ── */}
      <FadeIn>
        <section
          id="steps"
          style={{ padding: "120px 5%", background: "#FFFFFF" }}
        >
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(124,58,237,0.05)",
                  color: "#7C3AED",
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 16,
                  border: "1px solid rgba(124,58,237,0.1)",
                  letterSpacing: "1px",
                }}
              >
                PROCESSUS
              </div>
              <h2
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: "#0F172A",
                  marginBottom: 16,
                  letterSpacing: "-1.5px",
                }}
              >
                Comment ça marche ?
              </h2>
              <p style={{ color: "#64748B", fontSize: 18, lineHeight: 1.6 }}>
                Trois étapes simples pour prendre soin de votre santé.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "2rem",
              }}
            >
              {STEPS.map((s) => (
                <div key={s.num} className="step-card">
                  <div
                    style={{
                      width: "100%",
                      height: 220,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      src={s.img}
                      alt={s.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(15,23,42,0.7), transparent)",
                      }}
                    ></div>
                    <div
                      style={{
                        position: "absolute",
                        top: 16,
                        left: 16,
                        background: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(8px)",
                        padding: "6px 14px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #7C3AED, #14B8A6)",
                        color: "white",
                        boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                      }}
                    >
                      ÉTAPE {s.num}
                    </div>
                  </div>
                  <div style={{ padding: "28px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: "rgba(124,58,237,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#7C3AED",
                        }}
                      >
                        <Icon d={s.icon} size={20} />
                      </div>
                      <h3
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#0F172A",
                        }}
                      >
                        {s.title}
                      </h3>
                    </div>
                    <p
                      style={{
                        color: "#64748B",
                        fontSize: 15,
                        lineHeight: 1.7,
                      }}
                    >
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── TESTIMONIALS ── */}
      <FadeIn>
        <section
          id="testimonials"
          style={{ padding: "120px 5%", background: "#F8FAFC" }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(124,58,237,0.05)",
                  color: "#7C3AED",
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 16,
                  border: "1px solid rgba(124,58,237,0.1)",
                  letterSpacing: "1px",
                }}
              >
                TÉMOIGNAGES
              </div>
              <h2
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: "#0F172A",
                  marginBottom: 16,
                  letterSpacing: "-1.5px",
                }}
              >
                Ils nous font confiance
              </h2>
              <p style={{ color: "#64748B", fontSize: 18, lineHeight: 1.6 }}>
                Découvrez les témoignages de nos patients et praticiens.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
              }}
            >
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="testimonial-card">
                  <div
                    style={{
                      color: "#7C3AED",
                      opacity: 0.15,
                      position: "absolute",
                      top: 24,
                      right: 24,
                    }}
                  >
                    <Icon d={icons.quote} size={40} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      marginBottom: 20,
                      color: "#F59E0B",
                    }}
                  >
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Icon key={idx} d={icons.star} size={16} />
                    ))}
                  </div>
                  <p
                    style={{
                      color: "#334155",
                      fontSize: 15,
                      lineHeight: 1.8,
                      marginBottom: 28,
                      fontWeight: 400,
                    }}
                  >
                    "{t.text}"
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      borderTop: "1px solid rgba(0,0,0,0.05)",
                      paddingTop: 20,
                    }}
                  >
                    <img
                      src={t.img}
                      alt={t.name}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "3px solid white",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0F172A",
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#14B8A6",
                          fontWeight: 600,
                        }}
                      >
                        {t.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── CTA PRO ── */}
      <FadeIn>
        <section style={{ padding: "0 5% 120px", background: "#FFFFFF" }}>
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              background: "linear-gradient(135deg, #0F172A, #1E293B)",
              borderRadius: 32,
              overflow: "hidden",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              position: "relative",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                padding: "clamp(40px, 6vw, 80px)",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 400,
                  height: 400,
                  background:
                    "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              ></div>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(124,58,237,0.15)",
                  color: "#A78BFA",
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 24,
                  border: "1px solid rgba(124,58,237,0.2)",
                  letterSpacing: "1px",
                }}
              >
                ESPACE PRO
              </div>
              <h2
                style={{
                  fontSize: 38,
                  fontWeight: 800,
                  color: "white",
                  marginBottom: 20,
                  letterSpacing: "-1px",
                }}
              >
                Vous êtes professionnel de santé ?
              </h2>
              <p
                style={{
                  color: "#94A3B8",
                  fontSize: 16,
                  lineHeight: 1.7,
                  marginBottom: 36,
                  maxWidth: 500,
                }}
              >
                Rejoignez AlloMed pour développer votre activité, gérer vos
                rendez-vous et suivre vos patients en toute sécurité.
              </p>
              <button
                className="btn-primary"
                style={{ boxShadow: "0 10px 25px rgba(124,58,237,0.3)" }}
                onClick={() => router.push("/register")}
              >
                Créer un compte professionnel
              </button>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  marginTop: 40,
                }}
              >
                {[
                  "📊 Tableau de bord analytique",
                  "🔒 Conformité HDS & GDPR",
                  "📅 Planning intelligent",
                  "💰 Paiements automatisés",
                ].map((f) => (
                  <div
                    key={f}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      padding: "14px 18px",
                      borderRadius: 14,
                      color: "#E2E8F0",
                      fontSize: 14,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      transition: "0.2s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(124,58,237,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)")
                    }
                  >
                    <span style={{ color: "#5EEAD4", fontSize: 16 }}>✓</span>{" "}
                    {f.split(" ").slice(1).join(" ")}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: "relative", minHeight: 500 }}>
              <img
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop"
                alt="Docteur utilisant AlloMed"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to right, #0F172A, rgba(15,23,42,0.3), transparent)",
                }}
              ></div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid rgba(0,0,0,0.05)",
          padding: "80px 5% 30px",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "3rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {/* Custom AlloMed Logo SVG */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 8C6 5.79086 7.79086 4 10 4H30C32.2091 4 34 5.79086 34 8V24C34 26.2091 32.2091 28 30 28H16L8 34V28H10C7.79086 28 6 26.2091 6 24V8Z"
                  fill="url(#alloGrad2)"
                />
                <path
                  d="M17 13L24 17L17 21V13Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="30" cy="8" r="3" fill="#14B8A6" />
                <defs>
                  <linearGradient
                    id="alloGrad2"
                    x1="6"
                    y1="4"
                    x2="34"
                    y2="34"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#7C3AED" />
                    <stop offset="1" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#0F172A",
                    display: "block",
                    lineHeight: 1,
                  }}
                >
                  AlloMed
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 600,
                    color: "#14B8A6",
                    textTransform: "uppercase",
                  }}
                >
                  Téléconsultation
                </span>
              </div>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "#64748B",
                lineHeight: 1.7,
                maxWidth: 280,
                fontWeight: 400,
                marginTop: 12,
              }}
            >
              La plateforme de télémédecine de référence pour patients et
              professionnels de santé.
            </p>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              Navigation
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {["Accueil", "Spécialités", "Comment ça marche"].map((l) => (
                <span
                  key={l}
                  onClick={() => scrollTo(l.toLowerCase())}
                  style={{
                    fontSize: 14,
                    color: "#64748B",
                    cursor: "pointer",
                    transition: "color 0.2s",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#7C3AED")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#64748B")
                  }
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              Légal
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {["CGU", "Politique de confidentialité", "Mentions légales"].map(
                (l) => (
                  <span
                    key={l}
                    style={{
                      fontSize: 14,
                      color: "#64748B",
                      cursor: "pointer",
                      transition: "color 0.2s",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#7C3AED")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#64748B")
                    }
                  >
                    {l}
                  </span>
                ),
              )}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0F172A",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              Contact
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <span style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>
                contact@allomed.tn
              </span>
              <span style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>
                +216 71 000 000
              </span>
            </div>
          </div>
        </div>
        <div
          style={{
            maxWidth: 1200,
            margin: "40px auto 0",
            borderTop: "1px solid rgba(0,0,0,0.05)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>
            © 2026 AlloMed. Tous droits réservés.
          </span>
          <span
            style={{
              fontSize: 13,
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#14B8A6",
                display: "inline-block",
              }}
            ></span>{" "}
            Certifié HDS · Tunisie
          </span>
        </div>
      </footer>
    </div>
  );
}
