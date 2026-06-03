"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type Step = "request" | "verify" | "reset" | "done";
type Channel = "email" | "sms";
interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
}

/* ══════════════════════════════════════════
   CSS GLOBAL
   Palette :
   Vert foncé  #44B6B2
   Vert clair  #A3DDDC
   Mauve foncé #A861D8
   Mauve clair #E4CDF3
══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ── Keyframes ── */
@keyframes fpFloat    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
@keyframes fpFadeUp   { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
@keyframes fpSlideL   { from{opacity:0;transform:translateX(-35px)} to{opacity:1;transform:translateX(0)} }
@keyframes fpSlideR   { from{opacity:0;transform:translateX(35px)}  to{opacity:1;transform:translateX(0)} }
@keyframes fpCardIn   { from{opacity:0;transform:translateY(22px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes fpStepIn   { from{opacity:0;transform:translateX(18px)}  to{opacity:1;transform:translateX(0)} }
@keyframes fpStepBack { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)} }
@keyframes fpSpin     { to{transform:rotate(360deg)} }
@keyframes fpPulse    { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
@keyframes fpRipple   { 0%{transform:scale(.85);opacity:1} 100%{transform:scale(2.4);opacity:0} }
@keyframes fpCheckPop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 70%{transform:scale(1.18)} 100%{transform:scale(1);opacity:1} }
@keyframes fpToastIn  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
@keyframes fpBlobMove { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-15px) scale(1.05)} 66%{transform:translate(-10px,10px) scale(.97)} }
@keyframes fpShimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes fpShieldF  { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(2deg)} }
@keyframes fpKeyF     { 0%,100%{transform:translateY(0) rotate(-8deg)} 50%{transform:translateY(-10px) rotate(0deg)} }
@keyframes fpOtpBounce{ 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
@keyframes fpSuccessRing { 0%{transform:scale(.8);opacity:0} 50%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
@keyframes fpEShk     { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(2px)} }
@keyframes fpScanLine { 0%{top:0%} 100%{top:100%} }

*,*::before,*::after { box-sizing:border-box; margin:0; padding:0 }

.fp-root {
  min-height:100vh; display:flex;
  font-family:'Plus Jakarta Sans',sans-serif;
  background:#fff; overflow:hidden;
}

/* ═══════════════════════════
   LEFT PANEL
   Mauve foncé → Vert foncé
═══════════════════════════ */
.fp-left {
  width:50%; min-height:100vh; position:relative; overflow:hidden;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background:linear-gradient(165deg, #2A1A45 0%, #5B2B8A 30%, #7A3BB5 55%, #44B6B2 100%);
  padding:2rem; flex-shrink:0;
  animation:fpSlideL .7s cubic-bezier(.22,1,.36,1) both;
}
.fp-left::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(ellipse 60% 50% at 25% 20%, rgba(228,205,243,0.14) 0%, transparent 70%),
    radial-gradient(ellipse 40% 60% at 75% 80%, rgba(68,182,178,0.12) 0%, transparent 70%),
    radial-gradient(ellipse 50% 40% at 50% 50%, rgba(163,221,220,0.05) 0%, transparent 70%);
}
/* Lignes décoratives en fond */
.fp-left::after {
  content:''; position:absolute; inset:0; pointer-events:none; opacity:.04;
  background:repeating-linear-gradient(
    -45deg, transparent, transparent 40px,
    rgba(255,255,255,1) 40px, rgba(255,255,255,1) 41px
  );
}

.fp-blob { position:absolute; border-radius:50%; pointer-events:none; filter:blur(70px) }
.fp-b1 { width:360px;height:360px;background:rgba(168,97,216,0.18);top:-10%;left:-8%;animation:fpBlobMove 12s ease-in-out infinite }
.fp-b2 { width:280px;height:280px;background:rgba(68,182,178,0.12);bottom:5%;right:-5%;animation:fpBlobMove 10s ease-in-out infinite 3s reverse }
.fp-b3 { width:200px;height:200px;background:rgba(228,205,243,0.1);top:45%;left:55%;animation:fpBlobMove 14s ease-in-out infinite 6s }

/* Logo */
.fp-logo { position:absolute;top:1.75rem;left:2rem;z-index:5;display:flex;align-items:center;gap:10px }
.fp-logo-ic {
  width:38px;height:38px;border-radius:11px;
  background:linear-gradient(135deg,#A3DDDC,#44B6B2);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 14px rgba(68,182,178,0.4);
}
.fp-logo-ic svg { width:18px;height:18px }
.fp-logo-tx { font-size:16px;font-weight:800;color:white;letter-spacing:-.3px }

/* Illustration */
.fp-illus { position:relative;z-index:2;width:100%;max-width:380px;animation:fpFadeUp .8s .2s ease both }
.fp-illus svg { width:100%;height:auto }

/* Texte */
.fp-ltxt { position:relative;z-index:2;text-align:center;margin-top:1.5rem;animation:fpFadeUp .6s .5s ease both }
.fp-ltxt h2 { font-size:26px;font-weight:800;color:white;letter-spacing:-.8px;line-height:1.15;margin-bottom:6px }
.fp-ltxt h2 em {
  font-style:normal;
  background:linear-gradient(135deg,#A3DDDC,#E4CDF3);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.fp-ltxt p { font-size:13.5px;color:rgba(228,205,243,0.7);line-height:1.6;max-width:320px;margin:0 auto }

/* Stats badges */
.fp-badges { position:relative;z-index:2;display:flex;gap:10px;margin-top:1.5rem;animation:fpFadeUp .6s .6s ease both;flex-wrap:wrap;justify-content:center }
.fp-badge {
  display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;
  background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);
  font-size:11px;font-weight:600;color:rgba(228,205,243,0.8);
  backdrop-filter:blur(8px);
}
.fp-badge span { font-size:13px }

/* ═══════════════════════════
   RIGHT PANEL
═══════════════════════════ */
.fp-right {
  flex:1; min-height:100vh; display:flex; align-items:center; justify-content:center;
  padding:2rem; position:relative;
  background:linear-gradient(160deg, #F9F6FF 0%, #EFF9F9 60%, #F9F6FF 100%);
  animation:fpSlideR .7s .1s cubic-bezier(.22,1,.36,1) both;
}
.fp-right::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(circle at 90% 10%, rgba(228,205,243,0.25) 0%, transparent 45%),
    radial-gradient(circle at 5%  90%, rgba(68,182,178,0.08) 0%, transparent 45%);
}
/* Grain texture subtile */
.fp-right::after {
  content:''; position:absolute; inset:0; pointer-events:none; opacity:.015;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:200px;
}

/* Card */
.fp-card {
  width:100%; max-width:420px; background:#FFFFFF; border-radius:28px;
  padding:2.75rem 2.25rem 2.25rem; position:relative; z-index:2; overflow:hidden;
  box-shadow:
    0 0 0 1px rgba(168,97,216,0.08),
    0 4px 6px rgba(168,97,216,0.04),
    0 16px 48px rgba(168,97,216,0.1),
    0 32px 80px rgba(0,0,0,0.04);
  animation:fpCardIn .65s .3s cubic-bezier(.22,1,.36,1) both;
}
/* Trait du haut : vert clair → mauve foncé */
.fp-card::before {
  content:''; position:absolute; top:0; left:6%; right:6%; height:2.5px;
  background:linear-gradient(90deg, transparent, #A3DDDC, #A861D8, transparent);
  border-radius:0 0 3px 3px;
}
/* Reflet coin */
.fp-card::after {
  content:''; position:absolute; bottom:-60px; right:-60px; width:180px; height:180px;
  border-radius:50%;
  background:radial-gradient(circle, rgba(228,205,243,0.12), transparent 65%);
  pointer-events:none;
}

/* Step wrapper */
.fp-step-c   { animation:fpStepIn  .38s cubic-bezier(.22,1,.36,1) both }
.fp-step-c-b { animation:fpStepBack .38s cubic-bezier(.22,1,.36,1) both }

/* Progress pills */
.fp-pills { display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:2rem }
.fp-pill  { height:4px; border-radius:2px; transition:all .45s cubic-bezier(.4,0,.2,1) }

/* Step icon */
.fp-icon {
  width:68px; height:68px; border-radius:20px;
  display:flex; align-items:center; justify-content:center;
  font-size:32px; margin:0 auto 1.25rem; position:relative;
  animation:fpPulse 3.5s ease-in-out infinite;
}
.fp-icon::before {
  content:''; position:absolute; inset:-6px; border-radius:26px;
  border:1.5px solid currentColor; opacity:.18;
  animation:fpRipple 3s ease-out infinite;
}
.fp-icon::after {
  content:''; position:absolute; inset:-6px; border-radius:26px;
  border:1.5px solid currentColor; opacity:.1;
  animation:fpRipple 3s ease-out infinite 1.5s;
}

/* Headings */
.fp-h1 {
  font-size:22px; font-weight:800; color:#1A0A2E;
  text-align:center; margin:0 0 8px; letter-spacing:-.5px;
}
.fp-sub-p {
  font-size:13px; color:#8B7B9E; text-align:center;
  margin:0 0 1.75rem; line-height:1.7;
}

/* Channel toggle */
.fp-ch { display:flex; gap:8px; margin-bottom:1.35rem }
.fp-ch-btn {
  flex:1; padding:11px 14px; border-radius:14px; border:1.5px solid #EBE4F4;
  background:#F8F6FC; color:#9B8CB0; cursor:pointer; font-family:inherit;
  font-size:13px; font-weight:600; transition:all .2s;
  display:flex; align-items:center; justify-content:center; gap:7px;
}
.fp-ch-btn.on  { border-color:#A861D8; background:rgba(168,97,216,0.08); color:#1A0A2E }
.fp-ch-btn:hover:not(.on) { border-color:#D4C1E6; background:#FDFBFF; color:#5E4A6E }
/* Icône canal */
.fp-ch-icon {
  width:28px; height:28px; border-radius:8px; display:flex;
  align-items:center; justify-content:center; font-size:15px;
  background:rgba(168,97,216,0.08); transition:background .2s;
}
.fp-ch-btn.on .fp-ch-icon { background:rgba(168,97,216,0.15) }

/* Form fields */
.fp-ff { margin-bottom:1.1rem }
.fp-fl {
  display:block; font-size:10.5px; font-weight:700; letter-spacing:.08em;
  text-transform:uppercase; color:#9B8CB0; margin-bottom:6px; transition:color .2s;
}
.fp-ff:focus-within .fp-fl { color:#A861D8 }
.fp-fw { position:relative }
.fp-fi {
  width:100%; padding:13px 16px; background:#F8F6FC; border:1.5px solid #EBE4F4;
  border-radius:13px; font-size:14px; font-family:'Plus Jakarta Sans',sans-serif;
  color:#1A0A2E; outline:none; transition:all .25s cubic-bezier(.4,0,.2,1);
}
.fp-fi::placeholder { color:#C4B6D0 }
.fp-fi:hover    { border-color:#D4C1E6; background:#FDFBFF }
.fp-fi:focus    { background:#fff; border-color:#A861D8; box-shadow:0 0 0 4px rgba(168,97,216,0.1) }
.fp-fi--p       { padding-right:48px }
/* Underline animé : mauve → vert */
.fp-fw::after {
  content:''; position:absolute; bottom:-1px; left:14%; right:14%; height:2px;
  border-radius:2px; background:linear-gradient(90deg,#A861D8,#44B6B2);
  transform:scaleX(0); transition:transform .3s cubic-bezier(.4,0,.2,1);
}
.fp-ff:focus-within .fp-fw::after { transform:scaleX(1) }

/* Eye toggle */
.fp-eye {
  position:absolute; right:12px; top:50%; transform:translateY(-50%);
  background:none; border:none; cursor:pointer; width:36px; height:36px;
  border-radius:9px; display:flex; align-items:center; justify-content:center;
  color:#C4B6D0; font-size:17px; transition:all .2s;
}
.fp-eye:hover, .fp-eye--on { color:#A861D8; background:rgba(168,97,216,0.07) }

/* CTA Button : vert clair → vert foncé par défaut */
.fp-btn {
  width:100%; padding:14px; border:none; border-radius:14px;
  font-size:14.5px; font-weight:700; font-family:'Plus Jakarta Sans',sans-serif;
  color:#fff; cursor:pointer; position:relative; overflow:hidden;
  background:linear-gradient(135deg, #A3DDDC 0%, #44B6B2 50%, #A3DDDC 100%);
  background-size:300% 300%; animation:fpShimmer 4s linear infinite;
  box-shadow:0 6px 24px rgba(68,182,178,0.32);
  transition:transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s;
  display:flex; align-items:center; justify-content:center; gap:8px; letter-spacing:.01em;
}
.fp-btn::before {
  content:''; position:absolute; top:0; left:-100%; width:200%; bottom:0;
  background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.1) 45%,rgba(255,255,255,0.18) 50%,rgba(255,255,255,0.1) 55%,transparent 100%);
  transition:left .5s ease; pointer-events:none;
}
.fp-btn:hover:not(:disabled)::before { left:100% }
.fp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 32px rgba(68,182,178,0.38) }
.fp-btn:active:not(:disabled) { transform:translateY(0) }
.fp-btn:disabled { opacity:.48; cursor:not-allowed; transform:none }
.fp-arr { font-size:16px; transition:transform .2s; display:inline-block }
.fp-btn:hover .fp-arr { transform:translateX(3px) }

/* Variante mauve */
.fp-btn--purple {
  background:linear-gradient(135deg,#C88FE8 0%,#A861D8 50%,#C88FE8 100%);
  box-shadow:0 6px 24px rgba(168,97,216,0.32);
}
.fp-btn--purple:hover:not(:disabled) { box-shadow:0 10px 32px rgba(168,97,216,0.38) }

/* Spinner */
.fp-sp {
  width:16px; height:16px; border:2.5px solid rgba(255,255,255,0.3);
  border-top-color:#fff; border-radius:50%; animation:fpSpin .6s linear infinite; flex-shrink:0;
}

/* Back link */
.fp-back {
  display:inline-flex; align-items:center; gap:6px; font-size:12px;
  color:#9B8CB0; cursor:pointer; background:none; border:none; padding:0;
  font-family:inherit; font-weight:600; margin-bottom:1.25rem; transition:color .2s;
}
.fp-back:hover { color:#A861D8 }
.fp-back svg { width:14px; height:14px; transition:transform .2s }
.fp-back:hover svg { transform:translateX(-2px) }

/* Resend / lien */
.fp-resend {
  background:none; border:none; cursor:pointer; font-family:inherit;
  font-size:12.5px; font-weight:700; color:#A861D8; padding:0; transition:all .2s;
}
.fp-resend:disabled { color:#C4B6D0; cursor:not-allowed }
.fp-resend:hover:not(:disabled) { color:#44B6B2 }

.fp-link {
  background:none; border:none; cursor:pointer; font-family:inherit;
  font-size:12.5px; font-weight:700; color:#44B6B2; padding:0; transition:color .2s;
}
.fp-link:hover { color:#A3DDDC }

/* Info box */
.fp-info {
  display:flex; align-items:flex-start; gap:10px; padding:10px 13px;
  border-radius:11px; margin-bottom:1.35rem;
  background:rgba(68,182,178,0.06); border:1px solid rgba(68,182,178,0.18);
}
.fp-info-dot {
  width:20px; height:20px; border-radius:6px; flex-shrink:0;
  background:rgba(68,182,178,0.12);
  display:flex; align-items:center; justify-content:center;
  font-size:11px; color:#44B6B2; font-weight:800;
}
.fp-info p { font-size:12px; color:#4A6B69; line-height:1.6; margin:0 }
.fp-info strong { color:#2A4A48 }

/* Error box */
.fp-err {
  display:none; align-items:center; gap:8px; padding:9px 13px;
  border-radius:11px; margin-bottom:1rem;
  background:rgba(220,38,38,0.05); border:1px solid rgba(220,38,38,0.15);
  color:#DC2626; font-size:12.5px; font-weight:500;
}
.fp-err.sh { display:flex; animation:fpEShk .4s ease }
.fp-err-ic {
  width:18px; height:18px; border-radius:5px; background:rgba(220,38,38,0.1);
  display:flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:800; color:#DC2626; flex-shrink:0;
}

/* ── OTP Input ── */
.fp-otp-wrap { display:flex; gap:9px; justify-content:center; margin-bottom:1.75rem }
.fp-otp-cell {
  width:54px; height:64px; text-align:center; font-size:26px; font-weight:800;
  border-radius:14px; border:1.5px solid #EBE4F4; background:#F8F6FC;
  color:#1A0A2E; outline:none; font-family:inherit; transition:all .2s;
  caret-color:#A861D8;
}
.fp-otp-cell:focus { border-color:#A861D8; background:#fff; box-shadow:0 0 0 4px rgba(168,97,216,0.1) }
.fp-otp-cell.filled {
  border-color:#44B6B2; background:rgba(68,182,178,0.06);
  box-shadow:0 0 0 3px rgba(68,182,178,0.1);
  animation:fpOtpBounce .25s ease;
}
.fp-otp-hint { font-size:11.5px; color:#9B8CB0; text-align:center; margin-top:-1rem; margin-bottom:1.5rem }

/* Countdown ring */
.fp-cd-wrap { display:flex; align-items:center; justify-content:center; gap:8px; margin-top:.75rem }
.fp-cd-ring {
  width:32px; height:32px; border-radius:50%;
  border:2px solid #EBE4F4; border-top-color:#A861D8;
  animation:fpSpin 1s linear infinite;
}
.fp-cd-num { font-size:12px; font-weight:700; color:#9B8CB0; min-width:30px }

/* Password strength */
.fp-str-bars { display:flex; gap:4px; margin-bottom:5px }
.fp-str-bar  { flex:1; height:3px; border-radius:2px; transition:background .3s }
.fp-str-label { font-size:11px; font-weight:600; min-height:16px }

/* Checks list */
.fp-checks { display:flex; flex-direction:column; gap:4px; margin:-4px 0 12px }
.fp-check  { display:flex; align-items:center; gap:6px; font-size:11.5px; color:#9B8CB0; transition:color .2s }
.fp-check.ok { color:#44B6B2 }
.fp-check-dot {
  width:14px; height:14px; border-radius:4px; flex-shrink:0; transition:all .2s;
  border:1.5px solid #D4C1E6; display:flex; align-items:center; justify-content:center;
}
.fp-check.ok .fp-check-dot {
  background:#44B6B2; border-color:#44B6B2;
}
.fp-check-dot svg { width:8px; height:8px; opacity:0; transition:opacity .2s }
.fp-check.ok .fp-check-dot svg { opacity:1 }

/* Match indicator */
.fp-match { font-size:11.5px; font-weight:600; margin-top:-6px; margin-bottom:8px; min-height:18px }

/* Done checkmark */
.fp-done-wrap {
  width:90px; height:90px; border-radius:50%; margin:0 auto 1.5rem;
  display:flex; align-items:center; justify-content:center; position:relative;
  animation:fpSuccessRing .6s cubic-bezier(.34,1.56,.64,1) .1s both;
}
.fp-done-wrap::before {
  content:''; position:absolute; inset:0; border-radius:50%;
  border:2px solid rgba(68,182,178,0.2);
  animation:fpRipple 2.5s ease-out infinite .8s;
}
.fp-done-inner {
  width:70px; height:70px; border-radius:50%;
  background:linear-gradient(135deg,#A3DDDC,#44B6B2);
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 8px 28px rgba(68,182,178,0.35);
  animation:fpCheckPop .6s cubic-bezier(.34,1.56,.64,1) .2s both;
  font-size:34px;
}

/* Toast */
.fp-toast {
  position:fixed; top:24px; right:24px; z-index:200;
  padding:11px 16px; border-radius:13px; font-size:13px; font-weight:600;
  display:flex; align-items:center; gap:9px; max-width:340px;
  box-shadow:0 8px 32px rgba(0,0,0,0.12); font-family:'Plus Jakarta Sans',sans-serif;
  animation:fpToastIn .35s cubic-bezier(.34,1.56,.64,1) both;
}
.fp-toast-ic {
  width:22px; height:22px; border-radius:7px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:800;
}

/* Divider */
.fp-divider {
  height:1px; margin:1.25rem 0;
  background:linear-gradient(90deg, transparent, rgba(168,97,216,0.15), rgba(68,182,178,0.15), transparent);
}

/* Responsive */
@media(max-width:1024px){
  .fp-root { flex-direction:column }
  .fp-left { width:100%; min-height:auto; padding:2rem 1.5rem 1.5rem }
  .fp-logo { position:relative; top:0; left:0; margin-bottom:1rem }
  .fp-illus { max-width:280px }
  .fp-ltxt h2 { font-size:22px }
  .fp-right { min-height:auto; padding:1.5rem 1rem 2.5rem }
}
@media(max-width:480px){
  .fp-illus { max-width:220px }
  .fp-card { padding:2rem 1.25rem 1.75rem; border-radius:22px }
  .fp-otp-cell { width:44px; height:56px; font-size:22px; border-radius:11px }
  .fp-otp-wrap { gap:7px }
  .fp-badges { display:none }
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after { animation-duration:.01ms!important; transition-duration:.01ms!important }
}
`;

/* ══════════════════════════════════════════
   TOAST COMPONENT
══════════════════════════════════════════ */
function Toast({ message, type }: ToastProps) {
  const cfg = {
    success: {
      bg: "rgba(68,182,178,0.1)",
      border: "rgba(68,182,178,0.3)",
      text: "#44B6B2",
      ic: "rgba(68,182,178,0.2)",
      icon: "✓",
    },
    error: {
      bg: "rgba(220,38,38,0.08)",
      border: "rgba(220,38,38,0.25)",
      text: "#DC2626",
      ic: "rgba(220,38,38,0.12)",
      icon: "!",
    },
    info: {
      bg: "rgba(168,97,216,0.08)",
      border: "rgba(168,97,216,0.25)",
      text: "#A861D8",
      ic: "rgba(168,97,216,0.15)",
      icon: "i",
    },
  }[type];
  return (
    <div
      className="fp-toast"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.text,
      }}
    >
      <div
        className="fp-toast-ic"
        style={{ background: cfg.ic, color: cfg.text }}
      >
        {cfg.icon}
      </div>
      {message}
    </div>
  );
}

/* ══════════════════════════════════════════
   OTP INPUT COMPONENT (6 cellules)
══════════════════════════════════════════ */
function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").split("");

  const handleChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const d = [...digits];
    d[i] = v || " ";
    onChange(d.join("").trimEnd());
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const d = [...digits];
      if (d[i].trim()) {
        d[i] = " ";
        onChange(d.join("").trimEnd());
      } else if (i > 0) {
        d[i - 1] = " ";
        onChange(d.join("").trimEnd());
        refs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(p);
    refs.current[Math.min(p.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="fp-otp-wrap">
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const filled = digits[i]?.trim() !== "";
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`fp-otp-cell${filled ? " filled" : ""}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={filled ? digits[i] : ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            aria-label={`Chiffre ${i + 1} du code`}
          />
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   PASSWORD FIELD COMPONENT
══════════════════════════════════════════ */
function PwdField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="fp-ff">
      <label className="fp-fl">{label}</label>
      <div className="fp-fw">
        <input
          className={`fp-fi fp-fi--p`}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className={`fp-eye${show ? " fp-eye--on" : ""}`}
          onClick={() => setShow((s) => !s)}
          aria-label="Afficher le mot de passe"
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PASSWORD STRENGTH COMPONENT
══════════════════════════════════════════ */
function PasswordStrength({ pwd }: { pwd: string }) {
  const checks = [
    { label: "Au moins 8 caractères", ok: pwd.length >= 8 },
    { label: "Une majuscule (A–Z)", ok: /[A-Z]/.test(pwd) },
    { label: "Un chiffre (0–9)", ok: /\d/.test(pwd) },
    { label: "Un caractère spécial (!@#…)", ok: /[^A-Za-z0-9]/.test(pwd) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const [color, label] =
    score === 0
      ? ["#EBE4F4", ""]
      : score === 1
        ? ["#ef4444", "Faible"]
        : score === 2
          ? ["#f97316", "Moyen"]
          : score === 3
            ? ["#A3DDDC", "Bien"]
            : ["#44B6B2", "Fort ✓"];
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="fp-str-bars">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="fp-str-bar"
            style={{ background: i < score ? color : "#EBE4F4" }}
          />
        ))}
      </div>
      <div className="fp-str-label" style={{ color }}>
        {label}
      </div>
      <div className="fp-checks" style={{ marginTop: 8 }}>
        {checks.map(({ label: cl, ok }) => (
          <div key={cl} className={`fp-check${ok ? " ok" : ""}`}>
            <div className="fp-check-dot">
              <svg
                viewBox="0 0 8 8"
                fill="none"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M1 4L3 6L7 2" />
              </svg>
            </div>
            {cl}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [channel, setChannel] = useState<Channel>("email");
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [pwd, setPwd] = useState("");
  const [cfm, setCfm] = useState("");
  const [loading, setLoading] = useState(false);
  const [cd, setCd] = useState(0); // countdown
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [errMsg, setErrMsg] = useState("");
  const [direction, setDirection] = useState<"fwd" | "back">("fwd");
  const timer = useRef<NodeJS.Timeout | null>(null);
  const errRef = useRef<HTMLDivElement>(null);

  const stepIdx = (["request", "verify", "reset", "done"] as Step[]).indexOf(
    step,
  );

  /* Notification toast */
  const notify = (
    message: string,
    type: ToastProps["type"] = "info",
    ms = 3800,
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), ms);
  };

  /* Erreur inline shake */
  const showErr = (msg: string) => {
    setErrMsg(msg);
    if (errRef.current) {
      errRef.current.classList.remove("sh");
      void errRef.current.offsetWidth;
      errRef.current.classList.add("sh");
    }
  };
  const clearErr = () => setErrMsg("");

  /* Countdown timer */
  const startCd = (s = 60) => {
    setCd(s);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCd((c) => {
        if (c <= 1) {
          clearInterval(timer.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  /* Validation email */
  const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  /* Validation phone (TN format) */
  const isPhone = (s: string) =>
    /^\+?[\d\s\-]{8,15}$/.test(s.replace(/\s/g, ""));

  /* ── ÉTAPE 1 : Demande de code ── */
  const doRequest = async () => {
    clearErr();
    if (!contact.trim()) {
      showErr("Veuillez entrer votre email ou numéro de téléphone.");
      return;
    }
    if (channel === "email" && !isEmail(contact)) {
      showErr("Adresse email invalide.");
      return;
    }
    if (channel === "sms" && !isPhone(contact)) {
      showErr("Numéro de téléphone invalide (ex: +216 xx xxx xxx).");
      return;
    }

    setLoading(true);
    try {
      await api.post("password-reset/request-otp/", {
        contact: contact.trim(),
        channel,
      });
      notify(
        `Code envoyé par ${channel === "email" ? "email à " + contact : "SMS au " + contact} !`,
        "success",
      );
      startCd();
      setDirection("fwd");
      setStep("verify");
    } catch (e: any) {
      showErr(
        e?.response?.data?.detail || "Erreur lors de l'envoi. Réessayez.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── ÉTAPE 2 : Vérification OTP ── */
  const doVerify = async () => {
    clearErr();
    const clean = otp.replace(/\s/g, "");
    if (clean.length < 6) {
      showErr("Entrez les 6 chiffres du code reçu.");
      return;
    }

    setLoading(true);
    try {
      await api.post("password-reset/verify-otp/", {
        contact: contact.trim(),
        otp: clean,
      });
      notify("Code vérifié avec succès !", "success");
      setDirection("fwd");
      setStep("reset");
    } catch (e: any) {
      showErr(e?.response?.data?.detail || "Code incorrect ou expiré.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  /* ── Renvoi OTP ── */
  const doResend = async () => {
    if (cd > 0) return;
    setLoading(true);
    try {
      await api.post("password-reset/request-otp/", {
        contact: contact.trim(),
        channel,
      });
      notify("Nouveau code envoyé !", "success");
      startCd();
      setOtp("");
      clearErr();
    } catch {
      notify("Impossible de renvoyer le code.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── ÉTAPE 3 : Nouveau mot de passe ── */
  const pwdChecks = [
    pwd.length >= 8,
    /[A-Z]/.test(pwd),
    /\d/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
  ];
  const pwdScore = pwdChecks.filter(Boolean).length;

  const doReset = async () => {
    clearErr();
    if (pwdScore < 2) {
      showErr("Mot de passe trop faible. Suivez les recommandations.");
      return;
    }
    if (pwd !== cfm) {
      showErr("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await api.post("password-reset/confirm/", {
        contact: contact.trim(),
        otp: otp.replace(/\s/g, ""),
        new_password: pwd,
      });
      notify("Mot de passe mis à jour avec succès !", "success");
      setDirection("fwd");
      setStep("done");
    } catch (e: any) {
      showErr(
        e?.response?.data?.detail || "Erreur lors de la réinitialisation.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Nav retour ── */
  const goBack = (target: Step) => {
    setDirection("back");
    clearErr();
    setStep(target);
  };

  /* Helper couleur urgence pills */
  const pillColor = (i: number) =>
    stepIdx > i ? "#44B6B2" : stepIdx === i ? "#A861D8" : "#EBE4F4";

  const stepClass = direction === "back" ? "fp-step-c-b" : "fp-step-c";

  return (
    <>
      <style>{CSS}</style>
      {toast && <Toast {...toast} />}

      <div className="fp-root">
        {/* ════════════════════════════════
            LEFT PANEL — Illustration
        ════════════════════════════════ */}
        <div className="fp-left">
          <div className="fp-blob fp-b1" />
          <div className="fp-blob fp-b2" />
          <div className="fp-blob fp-b3" />

          {/* Logo */}
          <div className="fp-logo">
            <div className="fp-logo-ic">
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
            <span className="fp-logo-tx">TéléConsult</span>
          </div>

          {/* SVG Illustration */}
          <div className="fp-illus">
            <svg
              viewBox="0 0 400 380"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Ombre */}
              <ellipse
                cx="200"
                cy="350"
                rx="130"
                ry="16"
                fill="rgba(168,97,216,0.06)"
              />

              {/* Téléphone / Device */}
              <g transform="translate(110,30)">
                <rect
                  x="10"
                  y="10"
                  width="180"
                  height="290"
                  rx="26"
                  fill="rgba(42,26,69,0.9)"
                  stroke="rgba(168,97,216,0.2)"
                  strokeWidth="1.5"
                />
                <rect
                  x="20"
                  y="24"
                  width="160"
                  height="258"
                  rx="18"
                  fill="rgba(10,5,25,0.8)"
                />
                <rect
                  x="80"
                  y="12"
                  width="40"
                  height="7"
                  rx="3.5"
                  fill="rgba(168,97,216,0.2)"
                />

                {/* Barre haut : mauve → vert */}
                <rect
                  x="20"
                  y="24"
                  width="160"
                  height="32"
                  rx="18"
                  fill="url(#topGrad)"
                />
                <text
                  x="38"
                  y="44"
                  fontSize="9"
                  fontWeight="700"
                  fill="white"
                  fontFamily="Plus Jakarta Sans"
                >
                  TéléConsult
                </text>
                <circle cx="165" cy="40" r="5" fill="rgba(163,221,220,0.35)" />
                <circle cx="153" cy="40" r="3" fill="rgba(228,205,243,0.3)" />

                {/* Écran principal */}
                <rect
                  x="28"
                  y="62"
                  width="144"
                  height="100"
                  rx="12"
                  fill="rgba(168,97,216,0.06)"
                  stroke="rgba(168,97,216,0.1)"
                  strokeWidth="1"
                />

                {/* Bouclier de sécurité — centré */}
                <g transform="translate(72,68)">
                  <g
                    className="fpShieldF"
                    style={{ transformOrigin: "56px 52px" }}
                  >
                    <path
                      d="M56 10L96 28 96 62Q96 94 56 110 16 94 16 62L16 28Z"
                      fill="rgba(168,97,216,0.15)"
                      stroke="rgba(168,97,216,0.35)"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M56 24L80 38 80 60Q80 80 56 92 32 80 32 60L32 38Z"
                      fill="rgba(168,97,216,0.08)"
                    />
                    {/* Serrure */}
                    <rect
                      x="46"
                      y="50"
                      width="20"
                      height="24"
                      rx="4"
                      fill="#A861D8"
                      opacity=".75"
                    />
                    <rect
                      x="43"
                      y="58"
                      width="26"
                      height="10"
                      rx="3"
                      fill="#A861D8"
                      opacity=".75"
                    />
                    <path
                      d="M50 50V44Q50 36 56 36 62 36 62 44V50"
                      fill="none"
                      stroke="#A3DDDC"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="56" cy="67" r="3" fill="white" opacity=".5" />
                  </g>
                </g>

                {/* Séparateur */}
                <line
                  x1="28"
                  y1="170"
                  x2="172"
                  y2="170"
                  stroke="rgba(168,97,216,0.08)"
                  strokeWidth="1"
                />

                {/* Étapes visuelles */}
                {[
                  { x: 28, color: "#A861D8", label: "Identité" },
                  { x: 76, color: "#A3DDDC", label: "Code OTP" },
                  { x: 124, color: "#44B6B2", label: "Nouveau MDP" },
                ].map(({ x, color, label }, i) => (
                  <g key={i} transform={`translate(${x},178)`}>
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill={
                        i <= stepIdx ? `${color}33` : "rgba(255,255,255,0.04)"
                      }
                      stroke={i <= stepIdx ? color : "rgba(255,255,255,0.08)"}
                      strokeWidth="1.5"
                    />
                    {i <= stepIdx && (
                      <circle cx="12" cy="12" r="4" fill={color} opacity=".8" />
                    )}
                    <text
                      x="12"
                      y="32"
                      fontSize="7"
                      textAnchor="middle"
                      fill={i <= stepIdx ? color : "rgba(255,255,255,0.2)"}
                      fontFamily="Plus Jakarta Sans"
                      fontWeight="600"
                    >
                      {label}
                    </text>
                    {i < 2 && (
                      <line
                        x1="22"
                        y1="12"
                        x2="46"
                        y2="12"
                        stroke={
                          i < stepIdx ? "#44B6B2" : "rgba(255,255,255,0.08)"
                        }
                        strokeWidth="1"
                        strokeDasharray={i < stepIdx ? "0" : "3 2"}
                      />
                    )}
                  </g>
                ))}

                {/* Canal sélectionné */}
                <rect
                  x="28"
                  y="218"
                  width="144"
                  height="28"
                  rx="8"
                  fill="rgba(68,182,178,0.07)"
                />
                <text
                  x="42"
                  y="233"
                  fontSize="9"
                  fill="rgba(163,221,220,0.6)"
                  fontFamily="Plus Jakarta Sans"
                >
                  {channel === "email"
                    ? "📧 Réinitialisation par email"
                    : "📱 Réinitialisation par SMS"}
                </text>
                <circle cx="164" cy="232" r="4" fill="#44B6B2" opacity=".5" />

                {/* Ligne de scan animée */}
                {step === "verify" && (
                  <rect
                    x="28"
                    y="62"
                    width="144"
                    height="1.5"
                    fill="url(#scanGrad)"
                    opacity=".4"
                    style={{ animation: "fpScanLine 2s ease-in-out infinite" }}
                  />
                )}

                {/* Indicateur de succès si done */}
                {step === "done" && (
                  <g transform="translate(78,248)">
                    <circle
                      cx="22"
                      cy="22"
                      r="20"
                      fill="rgba(68,182,178,0.15)"
                      stroke="#44B6B2"
                      strokeWidth="1.5"
                    />
                    <text
                      x="22"
                      y="29"
                      fontSize="18"
                      textAnchor="middle"
                      fill="#44B6B2"
                    >
                      ✓
                    </text>
                  </g>
                )}

                {/* Home indicator */}
                <rect
                  x="80"
                  y="302"
                  width="40"
                  height="4"
                  rx="2"
                  fill="rgba(168,97,216,0.15)"
                />
              </g>

              {/* Clé flottante */}
              <g className="fpKeyF" style={{ transformOrigin: "60px 200px" }}>
                <g transform="translate(36,180) rotate(-8)">
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="#A3DDDC"
                    strokeWidth="2"
                    opacity=".4"
                  />
                  <circle cx="18" cy="18" r="6" fill="rgba(163,221,220,0.15)" />
                  <line
                    x1="32"
                    y1="18"
                    x2="58"
                    y2="18"
                    stroke="#A3DDDC"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity=".4"
                  />
                  <line
                    x1="52"
                    y1="18"
                    x2="52"
                    y2="26"
                    stroke="#A3DDDC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity=".4"
                  />
                  <line
                    x1="58"
                    y1="18"
                    x2="58"
                    y2="26"
                    stroke="#A3DDDC"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity=".4"
                  />
                </g>
              </g>

              {/* Éléments flottants */}
              <g className="fpFloat" style={{ animationDelay: "0s" }}>
                <circle cx="350" cy="90" r="22" fill="rgba(163,221,220,0.06)" />
                <rect
                  x="344"
                  y="80"
                  width="12"
                  height="20"
                  rx="2.5"
                  fill="#A3DDDC"
                  opacity=".3"
                />
                <rect
                  x="341"
                  y="84"
                  width="18"
                  height="12"
                  rx="2.5"
                  fill="#A3DDDC"
                  opacity=".3"
                />
              </g>
              <g className="fpFloat" style={{ animationDelay: "2s" }}>
                <circle cx="48" cy="110" r="17" fill="rgba(168,97,216,0.06)" />
                <text
                  x="48"
                  y="116"
                  fontSize="13"
                  textAnchor="middle"
                  fill="#A861D8"
                  opacity=".35"
                  fontFamily="Plus Jakarta Sans"
                >
                  ♥
                </text>
              </g>
              <g className="fpFloat" style={{ animationDelay: "4s" }}>
                <circle
                  cx="348"
                  cy="280"
                  r="15"
                  fill="rgba(68,182,178,0.05)"
                  stroke="rgba(68,182,178,0.12)"
                  strokeWidth=".8"
                />
                <path
                  d="M342 280L346 284L354 274"
                  stroke="#44B6B2"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity=".35"
                />
              </g>
              <g className="fpFloat" style={{ animationDelay: "1s" }}>
                <circle cx="52" cy="290" r="12" fill="rgba(228,205,243,0.08)" />
                <text
                  x="52"
                  y="294"
                  fontSize="10"
                  textAnchor="middle"
                  fill="#E4CDF3"
                  opacity=".4"
                  fontFamily="Plus Jakarta Sans"
                >
                  +
                </text>
              </g>

              <defs>
                <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A861D8" />
                  <stop offset="100%" stopColor="#44B6B2" />
                </linearGradient>
                <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="#A861D8" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Texte */}
          <div className="fp-ltxt">
            <h2>
              Sécurisez votre <em>accès</em>
            </h2>
            <p>
              Réinitialisez votre mot de passe en quelques étapes simples et
              sécurisées.
            </p>
          </div>

          {/* Badges */}
          <div className="fp-badges">
            <div className="fp-badge">
              <span>🔒</span> SSL chiffré
            </div>
            <div className="fp-badge">
              <span>⏱</span> Code 10 min
            </div>
            <div className="fp-badge">
              <span>🛡</span> Sécurisé
            </div>
          </div>
        </div>

        {/* ════════════════════════════════
            RIGHT PANEL — Formulaire
        ════════════════════════════════ */}
        <div className="fp-right">
          <div className="fp-card">
            {/* Pills de progression */}
            <div className="fp-pills">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="fp-pill"
                  style={{
                    width: stepIdx > i ? 28 : stepIdx === i ? 22 : 8,
                    background: pillColor(i),
                  }}
                />
              ))}
            </div>

            {/* ─────────────────────────
                ÉTAPE 1 — Demande OTP
            ───────────────────────── */}
            {step === "request" && (
              <div className={stepClass}>
                <button
                  className="fp-back"
                  onClick={() => router.push("/login")}
                >
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M9 2L4 7L9 12" />
                  </svg>
                  Retour à la connexion
                </button>

                <div
                  className="fp-icon"
                  style={{
                    background: "rgba(68,182,178,0.08)",
                    color: "#44B6B2",
                  }}
                >
                  🔐
                </div>
                <h1 className="fp-h1">Mot de passe oublié ?</h1>
                <p className="fp-sub-p">
                  Recevez un code à 6 chiffres pour réinitialiser votre accès.
                  <br />
                  <span style={{ fontSize: 12, color: "#C4B6D0" }}>
                    Valable 10 minutes
                  </span>
                </p>

                {/* Sélection canal */}
                <div className="fp-ch">
                  {[
                    { key: "email" as Channel, icon: "📧", label: "Email" },
                    { key: "sms" as Channel, icon: "📱", label: "SMS" },
                  ].map(({ key, icon, label }) => (
                    <button
                      key={key}
                      className={`fp-ch-btn${channel === key ? " on" : ""}`}
                      onClick={() => {
                        setChannel(key);
                        setContact("");
                        clearErr();
                      }}
                    >
                      <span className="fp-ch-icon">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Champ contact */}
                <div className="fp-ff">
                  <label className="fp-fl">
                    {channel === "email"
                      ? "Adresse email"
                      : "Numéro de téléphone"}
                  </label>
                  <div className="fp-fw">
                    <input
                      className="fp-fi"
                      type={channel === "email" ? "email" : "tel"}
                      value={contact}
                      onChange={(e) => {
                        setContact(e.target.value);
                        clearErr();
                      }}
                      onKeyDown={(e) => e.key === "Enter" && doRequest()}
                      placeholder={
                        channel === "email"
                          ? "vous@email.com"
                          : "+216 xx xxx xxx"
                      }
                      autoFocus
                      autoComplete={channel === "email" ? "email" : "tel"}
                      inputMode={channel === "sms" ? "tel" : "email"}
                    />
                  </div>
                </div>

                {/* Info box */}
                <div className="fp-info">
                  <div className="fp-info-dot">ℹ</div>
                  <p>
                    {channel === "email" ? (
                      <>
                        Entrez l'adresse email associée à votre compte.
                        <br />
                        <strong>Un code à 6 chiffres</strong> vous sera envoyé.
                      </>
                    ) : (
                      <>
                        Entrez le numéro de téléphone lié à votre compte.
                        <br />
                        <strong>Un SMS avec votre code</strong> sera envoyé.
                      </>
                    )}
                  </p>
                </div>

                {/* Erreur */}
                <div className="fp-err" ref={errRef}>
                  <div className="fp-err-ic">!</div>
                  <span>{errMsg}</span>
                </div>

                <button
                  className="fp-btn"
                  onClick={doRequest}
                  disabled={loading || !contact.trim()}
                >
                  {loading ? (
                    <>
                      <div className="fp-sp" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      Envoyer le code <span className="fp-arr">→</span>
                    </>
                  )}
                </button>

                <p
                  style={{
                    fontSize: 12,
                    color: "#C4B6D0",
                    textAlign: "center",
                    marginTop: "1.1rem",
                  }}
                >
                  Vous vous souvenez ?{" "}
                  <button
                    className="fp-link"
                    onClick={() => router.push("/login")}
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            )}

            {/* ─────────────────────────
                ÉTAPE 2 — Vérification OTP
            ───────────────────────── */}
            {step === "verify" && (
              <div className={stepClass}>
                <button className="fp-back" onClick={() => goBack("request")}>
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M9 2L4 7L9 12" />
                  </svg>
                  Modifier le contact
                </button>

                <div
                  className="fp-icon"
                  style={{
                    background: "rgba(168,97,216,0.08)",
                    color: "#A861D8",
                  }}
                >
                  🔑
                </div>
                <h1 className="fp-h1">Entrez le code</h1>
                <p className="fp-sub-p">
                  Code envoyé {channel === "email" ? "à" : "au"}{" "}
                  <strong style={{ color: "#1A0A2E" }}>{contact}</strong>
                  <br />
                  <span style={{ fontSize: 12, color: "#C4B6D0" }}>
                    Vérifiez{" "}
                    {channel === "email"
                      ? "votre boîte email (et spam)"
                      : "vos SMS"}
                  </span>
                </p>

                {/* OTP cells */}
                <OtpInput value={otp} onChange={setOtp} disabled={loading} />
                <p className="fp-otp-hint">
                  Saisissez le code à 6 chiffres reçu
                </p>

                {/* Erreur */}
                <div className="fp-err" ref={errRef}>
                  <div className="fp-err-ic">!</div>
                  <span>{errMsg}</span>
                </div>

                <button
                  className="fp-btn fp-btn--purple"
                  onClick={doVerify}
                  disabled={loading || otp.replace(/\s/g, "").length < 6}
                >
                  {loading ? (
                    <>
                      <div className="fp-sp" />
                      Vérification...
                    </>
                  ) : (
                    <>
                      Vérifier le code <span className="fp-arr">→</span>
                    </>
                  )}
                </button>

                <div className="fp-divider" />

                {/* Renvoi */}
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 12, color: "#9B8CB0" }}>
                    Code non reçu ?{" "}
                  </span>
                  <button
                    className="fp-resend"
                    onClick={doResend}
                    disabled={cd > 0 || loading}
                  >
                    {cd > 0 ? `Renvoyer dans ${cd}s` : "Renvoyer le code"}
                  </button>
                  {cd > 0 && (
                    <div className="fp-cd-wrap">
                      <div className="fp-cd-ring" />
                      <span className="fp-cd-num">{cd}s</span>
                    </div>
                  )}
                </div>

                <p
                  style={{
                    fontSize: 11.5,
                    color: "#C4B6D0",
                    textAlign: "center",
                    marginTop: "1rem",
                    lineHeight: 1.6,
                  }}
                >
                  Après 3 tentatives échouées, un nouveau code sera nécessaire.
                </p>
              </div>
            )}

            {/* ─────────────────────────
                ÉTAPE 3 — Nouveau MDP
            ───────────────────────── */}
            {step === "reset" && (
              <div className={stepClass}>
                <div
                  className="fp-icon"
                  style={{
                    background: "rgba(68,182,178,0.08)",
                    color: "#44B6B2",
                  }}
                >
                  🔒
                </div>
                <h1 className="fp-h1">Nouveau mot de passe</h1>
                <p className="fp-sub-p">
                  Choisissez un mot de passe fort et unique.
                  <br />
                  <span style={{ fontSize: 12, color: "#C4B6D0" }}>
                    Ne réutilisez pas un ancien mot de passe
                  </span>
                </p>

                {/* Champ 1 */}
                <PwdField
                  label="Nouveau mot de passe"
                  value={pwd}
                  onChange={(v) => {
                    setPwd(v);
                    clearErr();
                  }}
                  placeholder="Minimum 8 caractères"
                  autoFocus
                />

                {/* Jauge + checks */}
                {pwd && <PasswordStrength pwd={pwd} />}

                {/* Champ 2 */}
                <PwdField
                  label="Confirmer le mot de passe"
                  value={cfm}
                  onChange={(v) => {
                    setCfm(v);
                    clearErr();
                  }}
                  placeholder="Répétez le mot de passe"
                />

                {/* Indicateur de correspondance */}
                {cfm && (
                  <p
                    className="fp-match"
                    style={{ color: cfm === pwd ? "#44B6B2" : "#ef4444" }}
                  >
                    {cfm === pwd
                      ? "✓ Les mots de passe correspondent"
                      : "✗ Ne correspondent pas"}
                  </p>
                )}

                {/* Erreur */}
                <div className="fp-err" ref={errRef}>
                  <div className="fp-err-ic">!</div>
                  <span>{errMsg}</span>
                </div>

                <button
                  className="fp-btn"
                  onClick={doReset}
                  disabled={loading || pwd !== cfm || pwdScore < 2 || !cfm}
                >
                  {loading ? (
                    <>
                      <div className="fp-sp" />
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      Réinitialiser le mot de passe{" "}
                      <span className="fp-arr">→</span>
                    </>
                  )}
                </button>

                <p
                  style={{
                    fontSize: 11.5,
                    color: "#C4B6D0",
                    textAlign: "center",
                    marginTop: "1rem",
                  }}
                >
                  Votre session sera déconnectée partout après la
                  réinitialisation.
                </p>
              </div>
            )}

            {/* ─────────────────────────
                ÉTAPE 4 — Succès
            ───────────────────────── */}
            {step === "done" && (
              <div
                className={stepClass}
                style={{ textAlign: "center", padding: "1rem 0" }}
              >
                <div className="fp-done-wrap">
                  <div className="fp-done-inner">✓</div>
                </div>

                <h1 className="fp-h1" style={{ marginBottom: 10 }}>
                  Mot de passe mis à jour !
                </h1>
                <p
                  style={{
                    fontSize: 13,
                    color: "#8B7B9E",
                    lineHeight: 1.75,
                    marginBottom: "0.75rem",
                  }}
                >
                  Votre mot de passe a été réinitialisé avec succès.
                  <br />
                  Connectez-vous dès maintenant avec votre nouveau mot de passe.
                </p>

                {/* Récap */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    background: "rgba(68,182,178,0.05)",
                    border: "1px solid rgba(68,182,178,0.15)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    marginBottom: "1.5rem",
                    textAlign: "left",
                  }}
                >
                  {[
                    {
                      icon: "✉️",
                      label:
                        channel === "email"
                          ? `Compte : ${contact}`
                          : `Téléphone : ${contact}`,
                    },
                    { icon: "🔒", label: "Mot de passe modifié avec succès" },
                    {
                      icon: "🛡",
                      label: "Toutes vos sessions ont été révoquées",
                    },
                  ].map(({ icon, label }) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        color: "#4A6B69",
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      {label}
                    </div>
                  ))}
                </div>

                <button
                  className="fp-btn"
                  onClick={() => router.push("/login")}
                >
                  Aller à la connexion <span className="fp-arr">→</span>
                </button>

                <p
                  style={{
                    fontSize: 11.5,
                    color: "#C4B6D0",
                    marginTop: "1rem",
                  }}
                >
                  Problème ?{" "}
                  <button
                    className="fp-link"
                    onClick={() => {
                      setStep("request");
                      setContact("");
                      setOtp("");
                      setPwd("");
                      setCfm("");
                    }}
                  >
                    Réessayer
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
