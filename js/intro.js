/* ============================================================================
   FOR THE JUDGE (in simple words):
   This is the WELCOME / START screen. Instead of dropping you straight into the
   calculator, QuadVision first shows a friendly overlay that says what the tool
   is and how to use it in three steps. Press "Start exploring" to enter. You can
   reopen this guide any time from the "Guide" button in the top menu. It is fully
   bilingual (English / Bahasa Melayu) and remembers nothing — judges always see
   it first.
   ============================================================================ */
window.Intro = (function () {
  'use strict';

  // tiny bilingual helper (reads the current language; falls back to English)
  function lang() { return (window.I18N && I18N.current && I18N.current() === 'ms') ? 'ms' : 'en'; }
  function L(en, ms) { return (lang() === 'ms' && ms) ? ms : en; }

  var root, card, guideBtn, open = false, built = false;

  // ---- the styles for the overlay (injected once) -----------------------
  var CSS = ''
    + '#qv-intro{position:fixed;inset:0;z-index:120;display:flex;align-items:center;justify-content:center;padding:24px;'
    + 'background:rgba(18,16,40,.55);-webkit-backdrop-filter:saturate(160%) blur(16px);backdrop-filter:saturate(160%) blur(16px);'
    + 'opacity:0;pointer-events:none;transition:opacity .4s ease;}'
    + '#qv-intro.show{opacity:1;pointer-events:auto;}'
    + '.qvi-card{width:min(680px,100%);max-height:92vh;overflow:auto;background:var(--card,#fff);color:var(--ink,#243b53);'
    + 'border:1px solid var(--glass-edge,rgba(255,255,255,.6));border-radius:28px;padding:34px 34px 28px;'
    + 'box-shadow:0 40px 100px -30px rgba(20,12,50,.7);transform:translateY(16px) scale(.97);opacity:0;'
    + 'transition:transform .5s cubic-bezier(.2,.9,.3,1),opacity .5s ease;}'
    + '#qv-intro.show .qvi-card{transform:none;opacity:1;}'
    + '.qvi-top{display:flex;align-items:center;gap:13px;}'
    + '.qvi-top img{width:46px;height:46px;border-radius:13px;box-shadow:0 8px 22px -12px rgba(40,30,90,.6);}'
    + '.qvi-top b{font-family:var(--display,system-ui);font-weight:600;font-size:1.5rem;letter-spacing:-.01em;}'
    + '.qvi-top b span{color:var(--lav-strong,#7a5cf0);}'
    + '.qvi-badge{margin-left:auto;font-family:var(--display,system-ui);font-weight:500;font-size:.7rem;letter-spacing:.12em;'
    + 'text-transform:uppercase;color:var(--lav-strong,#7a5cf0);background:var(--lav-soft,#f1ebff);padding:6px 12px;border-radius:999px;}'
    + '.qvi-lead{font-family:var(--display,system-ui);font-weight:500;font-size:1.5rem;line-height:1.2;letter-spacing:-.015em;margin:20px 0 6px;}'
    + '.qvi-lead em{font-style:normal;color:var(--lav-strong,#7a5cf0);}'
    + '.qvi-sub{color:var(--muted,rgba(36,59,83,.6));font-size:1.02rem;line-height:1.5;}'
    + '.qvi-h{font-family:var(--display,system-ui);font-weight:600;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;'
    + 'color:var(--muted,rgba(36,59,83,.6));margin:24px 0 12px;display:flex;align-items:center;gap:9px;}'
    + '.qvi-h::before{content:"";width:22px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--pink-strong,#e0609a),var(--lav-strong,#7a5cf0));}'
    + '.qvi-steps{display:grid;gap:12px;}'
    + '.qvi-step{display:flex;gap:14px;align-items:flex-start;background:var(--card-2,#fdfbff);border:1px solid var(--hair,rgba(36,59,83,.12));'
    + 'border-radius:16px;padding:14px 15px;}'
    + '.qvi-n{flex:none;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;font-family:var(--display,system-ui);'
    + 'font-weight:600;color:#fff;background:linear-gradient(135deg,var(--lav-strong,#7a5cf0),var(--pink-strong,#e0609a));}'
    + '.qvi-step .t{font-weight:700;}.qvi-step .d{color:var(--muted,rgba(36,59,83,.6));font-size:.93rem;margin-top:2px;line-height:1.45;}'
    + '.qvi-feats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}'
    + '.qvi-feat{display:flex;gap:10px;align-items:center;font-weight:600;font-size:.94rem;background:var(--lav-soft,#f1ebff);'
    + 'border-radius:13px;padding:11px 13px;}'
    + '.qvi-feat .e{font-size:1.15rem;line-height:1;}'
    + '.qvi-actions{display:flex;gap:12px;align-items:center;margin-top:26px;flex-wrap:wrap;}'
    + '.qvi-start{border:0;border-radius:14px;padding:14px 26px;font-family:var(--body,system-ui);font-weight:700;font-size:1.02rem;'
    + 'color:#fff;background:linear-gradient(135deg,var(--lav-strong,#7a5cf0),var(--pink-strong,#e0609a));cursor:pointer;'
    + 'box-shadow:0 14px 30px -14px rgba(122,92,240,.7);transition:transform .14s cubic-bezier(.2,.8,.2,1),filter .2s;}'
    + '.qvi-start:hover{filter:brightness(1.05);}.qvi-start:active{transform:scale(.97);}'
    + '.qvi-skip{background:none;border:0;color:var(--muted,rgba(36,59,83,.6));font-family:var(--body,system-ui);font-weight:700;'
    + 'font-size:.95rem;cursor:pointer;padding:10px;}.qvi-skip:hover{color:var(--ink,#243b53);}'
    + '.qvi-tip{margin-left:auto;color:var(--muted,rgba(36,59,83,.6));font-size:.82rem;}'
    + '.nav a.qvi-guide{cursor:pointer;}'
    + '@media (max-width:560px){.qvi-card{padding:24px 20px;border-radius:22px;}.qvi-lead{font-size:1.28rem;}.qvi-feats{grid-template-columns:1fr;}.qvi-tip{display:none;}}';

  function render() {
    // (re)fill the card text in the current language
    card.innerHTML = ''
      + '<div class="qvi-top">'
      +   '<img src="' + LOGO + '" alt="QuadVision logo"/>'
      +   '<b>Quad<span>Vision</span></b>'
      +   '<span class="qvi-badge">KIE 2026</span>'
      + '</div>'
      + '<div class="qvi-lead">' + L('Quadratics you can actually <em>see</em>.', 'Kuasa dua yang boleh anda <em>lihat</em>.') + '</div>'
      + '<div class="qvi-sub">' + L(
            'QuadVision teaches you to solve quadratic equations by <b>showing</b> the method “completing the square” as a real picture made of tiles — not just formulas.',
            'QuadVision mengajar anda menyelesaikan persamaan kuasa dua dengan <b>menunjukkan</b> kaedah “menyempurnakan kuasa dua” sebagai gambar sebenar daripada jubin — bukan sekadar formula.') + '</div>'

      + '<div class="qvi-h">' + L('How to use it', 'Cara menggunakannya') + '</div>'
      + '<div class="qvi-steps">'
      +   step(1, L('Type your equation', 'Taip persamaan anda'), L('Enter a, b and c (or scan a photo of a question).', 'Masukkan a, b dan c (atau imbas gambar soalan).'))
      +   step(2, L('Watch the square form', 'Lihat segi empat terbentuk'), L('Press Visualise and step through as the tiles complete the square.', 'Tekan Visualise dan ikut langkah sambil jubin menyempurnakan segi empat.'))
      +   step(3, L('Explore & practise', 'Teroka & berlatih'), L('See the live graph, real-life examples, and play the challenges.', 'Lihat graf langsung, contoh kehidupan sebenar, dan main cabaran.'))
      + '</div>'

      + '<div class="qvi-h">' + L('What it does', 'Apa yang ia lakukan') + '</div>'
      + '<div class="qvi-feats">'
      +   feat('🟦', L('Visual method, not memorising', 'Kaedah visual, bukan menghafal'))
      +   feat('🌐', L('English & Bahasa Melayu', 'Bahasa Inggeris & Melayu'))
      +   feat('📈', L('Live, interactive graph', 'Graf langsung & interaktif'))
      +   feat('📷', L('Scan a question by photo', 'Imbas soalan dengan foto'))
      + '</div>'

      + '<div class="qvi-actions">'
      +   '<button class="qvi-start" type="button">' + L('Start exploring', 'Mula meneroka') + '</button>'
      +   '<button class="qvi-skip" type="button">' + L('Skip', 'Langkau') + '</button>'
      +   '<span class="qvi-tip">' + L('Tip: reopen this any time from “Guide”.', 'Petua: buka semula dari “Panduan”.') + '</span>'
      + '</div>';

    card.querySelector('.qvi-start').addEventListener('click', function () { hide(true); });
    card.querySelector('.qvi-skip').addEventListener('click', function () { hide(false); });
  }

  function step(n, t, d) {
    return '<div class="qvi-step"><span class="qvi-n">' + n + '</span><div><div class="t">' + t + '</div><div class="d">' + d + '</div></div></div>';
  }
  function feat(e, t) { return '<div class="qvi-feat"><span class="e">' + e + '</span><span>' + t + '</span></div>'; }

  var LOGO = '';
  function build() {
    if (built) return; built = true;

    // grab the page logo so the overlay matches (works in the bundled file too)
    var bi = document.querySelector('.brand img'); LOGO = bi ? bi.src : '';

    var style = document.createElement('style'); style.id = 'qv-intro-css'; style.textContent = CSS;
    document.head.appendChild(style);

    root = document.createElement('div'); root.id = 'qv-intro';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Welcome to QuadVision');
    card = document.createElement('div'); card.className = 'qvi-card';
    root.appendChild(card);
    document.body.appendChild(root);
    render();

    // click the dimmed backdrop (outside the card) to dismiss
    root.addEventListener('click', function (e) { if (e.target === root) hide(false); });
    document.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') hide(false); });

    // add a "Guide" item to the top menu so it can be reopened
    addGuideButton();

    // re-render text when the language changes
    if (window.I18N && I18N.onChange) I18N.onChange(function () { if (built) render(); if (guideBtn) guideBtn.textContent = L('Guide', 'Panduan'); });
  }

  function addGuideButton() {
    var nav = document.querySelector('.topbar .nav');
    if (!nav || nav.querySelector('.qvi-guide')) return;
    guideBtn = document.createElement('a');
    guideBtn.className = 'qvi-guide';
    guideBtn.setAttribute('role', 'button'); guideBtn.tabIndex = 0;
    guideBtn.textContent = L('Guide', 'Panduan');
    guideBtn.addEventListener('click', function (e) { e.preventDefault(); show(); });
    guideBtn.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
    nav.appendChild(guideBtn);
  }

  function show() {
    build();
    render();                                  // refresh language
    open = true;
    document.body.style.overflow = 'hidden';   // lock scroll behind the overlay
    requestAnimationFrame(function () { root.classList.add('show'); });
  }

  function hide(goToSolver) {
    open = false;
    if (root) root.classList.remove('show');
    document.body.style.overflow = '';
    if (goToSolver) {
      var s = document.getElementById('solve');
      if (s && s.scrollIntoView) setTimeout(function () { s.scrollIntoView({ behavior: 'smooth' }); }, 250);
      // give a friendly nudge from the bear, if present
      if (window.Squary && Squary.say) setTimeout(function () {
        Squary.say(L('Let\u2019s solve one together!', 'Jom selesaikan satu bersama!'), { state: 'wave', duration: 3200 });
      }, 900);
    }
  }

  // show automatically on first paint so judges meet the welcome screen first
  function init() {
    function go() { show(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  }

  return { init: init, show: show, hide: hide };
})();

// start the welcome screen as soon as the script loads
if (window.Intro) Intro.init();
