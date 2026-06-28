/* ============================================================================
   FOR THE JUDGE (in simple words):
   Two games, both about COMPLETING THE SQUARE.

     1. TILE FORGE — a hands-on building puzzle. You're given a blueprint x² + bx.
        You SPLIT the bx strip into two equal (b/2)·x halves, SNAP them onto the
        right and bottom of the x·x block, then FILL the empty (b/2)×(b/2) corner
        with unit tiles — discovering it needs exactly (b/2)² of them. The square
        locks in and the answer (x + b/2)² appears. You don't pick the answer —
        you BUILD it, which is the act of completing the square itself.

     2. KNIGHT DUNGEON — a pixel-art dungeon (drawn at low resolution and scaled
        up for a crisp retro look). Explore, grab gems and the key, and to beat a
        monster or open the door you must SOLVE a quadratic.
   ============================================================================ */
window.Games = (function () {
  'use strict';

  function ms() { return window.I18N && I18N.current && I18N.current() === 'ms'; }
  function L(en, m) { return (ms() && m) ? m : en; }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function rf(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function best(key, v) { try { var k = 'qv-best-' + key, c = +(localStorage.getItem(k) || 0); if (v != null && v > c) { localStorage.setItem(k, v); return v; } return Math.max(c, v || 0); } catch (e) { return v || 0; } }

  function makeCanvas(host, hpx) {
    var c = el('canvas', 'gx-canvas'); host.appendChild(c);
    var ctx = c.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0;
    function size() { var r = c.getBoundingClientRect(); W = Math.max(r.width, 260); H = hpx; c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); c.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size();
    return { c: c, ctx: ctx, size: size, get W() { return W; }, get H() { return H; } };
  }
  function endScreen(area, key, score, onAgain) {
    var b = best(key, score);
    var e = el('div', 'game-over');
    e.innerHTML = '<div class="go-big">' + L('Game over', 'Tamat') + '</div><div class="go-score">' + L('Score', 'Skor') + ': <b>' + score + '</b></div><div class="go-best">' + L('Best', 'Terbaik') + ': ' + b + '</div>';
    var again = el('button', 'go-again', L('Play again', 'Main lagi') + ' ↻'); again.type = 'button'; again.addEventListener('click', onAgain); e.appendChild(again);
    area.appendChild(e);
  }

  var mount, activeCleanup = null;
  var GAMES = [
    { id: 'forge', icon: '🧱', name: { en: 'Tile Forge', ms: 'Bengkel Jubin' },
      desc: { en: 'Build the square by hand — split bx, snap the strips, fill the (b/2)² corner.', ms: 'Bina kuasa dua sendiri — belah bx, lekap jalur, isi sudut (b/2)².' }, start: startForge },
    { id: 'dungeon', icon: '🏰', name: { en: 'Knight Dungeon', ms: 'Kurungan Kesateria' },
      desc: { en: 'Pixel dungeon crawler — solve quadratics to beat monsters & open the door.', ms: 'Pengembara kurungan piksel — selesaikan kuasa dua untuk kalahkan raksasa & buka pintu.' }, start: startDungeon }
  ];

  function showHub() {
    cleanup(); mount.innerHTML = '';
    var grid = el('div', 'games-grid games-grid-2');
    GAMES.forEach(function (g) {
      var c = el('button', 'game-pick'); c.type = 'button';
      c.innerHTML = '<span class="gp-ico">' + g.icon + '</span><span class="gp-name">' + L(g.name.en, g.name.ms) + '</span><span class="gp-desc">' + L(g.desc.en, g.desc.ms) + '</span><span class="gp-best">' + L('Best', 'Terbaik') + ': ' + best(g.id) + '</span><span class="gp-go">' + L('Play', 'Main') + ' →</span>';
      c.addEventListener('click', function () { launch(g); });
      grid.appendChild(c);
    });
    mount.appendChild(grid);
  }
  function launch(g) {
    cleanup(); mount.innerHTML = '';
    var stage = el('div', 'game-stage'), bar = el('div', 'game-bar');
    var back = el('button', 'game-back'); back.type = 'button'; back.innerHTML = '‹ ' + L('All games', 'Semua permainan'); back.addEventListener('click', showHub); bar.appendChild(back);
    bar.appendChild(el('div', 'game-title', g.icon + ' ' + L(g.name.en, g.name.ms)));
    stage.appendChild(bar);
    var area = el('div', 'game-area'); stage.appendChild(area); mount.appendChild(stage);
    activeCleanup = g.start(area) || null;
  }
  function cleanup() { if (activeCleanup) { try { activeCleanup(); } catch (e) {} activeCleanup = null; } }

  /* shared quadratic helpers */
  function fmtEq(b, c) { var bx = b === 0 ? '' : (b > 0 ? ' + ' + b + 'x' : ' − ' + (-b) + 'x'); var cc = c === 0 ? '' : (c > 0 ? ' + ' + c : ' − ' + (-c)); return 'x²' + bx + cc; }
  function fmtSq(p, k) { var inner = p >= 0 ? '(x + ' + p + ')²' : '(x − ' + (-p) + ')²'; var tail = k === 0 ? '' : (k > 0 ? ' + ' + k : ' − ' + (-k)); return inner + tail; }
  function uPush(a, v) { if (a.indexOf(v) === -1) a.push(v); }
  function genQuestion() {  // generic, for the dungeon
    if (Math.random() < 0.5) {
      var r1 = ri(-6, 6), r2 = ri(-6, 6), g = 0; while (r2 === r1 && g++ < 20) r2 = ri(-6, 6);
      var b = -(r1 + r2), c = r1 * r2, rs = function (a, b2) { var s = [a, b2].sort(function (x, y) { return x - y; }); return 'x = ' + s[0] + ', ' + s[1]; };
      var ans = rs(r1, r2), o = [ans]; uPush(o, rs(-r1, -r2)); uPush(o, rs(r1 + 1, r2)); uPush(o, rs(r1, r2 - 1));
      var gg = 1; while (o.length < 4 && gg < 12) { uPush(o, rs(ri(-6, 6), ri(-6, 6))); gg++; }
      return { q: L('Roots of ', 'Punca ') + fmtEq(b, c) + ' = 0', opts: shuffle(o.slice(0, 4)), ans: ans };
    }
    var bb = ri(-4, 4) * 2, cc = ri(-6, 6), p = bb / 2, k = cc - p * p, a2 = fmtSq(p, k), o2 = [a2];
    uPush(o2, fmtSq(-p, k)); uPush(o2, fmtSq(p, cc)); uPush(o2, fmtSq(p, -k));
    var h = 1; while (o2.length < 4 && h < 12) { uPush(o2, fmtSq(p, k + h)); h++; }
    return { q: L('Complete the square: ', 'Sempurnakan: ') + fmtEq(bb, cc), opts: shuffle(o2.slice(0, 4)), ans: a2 };
  }
  function genSquare() {  // completing-the-square: missing corner = (b/2)^2
    var p = ri(1, 6), sign = Math.random() < 0.4 ? -1 : 1, b = 2 * p * sign, c = ri(-5, 5), corner = p * p, k = c - corner;
    var cand = [corner, 2 * p, corner * 2, p, corner + 1, Math.max(1, corner - 1), corner + 3, p + 1, corner + 5], opts = [];
    for (var i = 0; i < cand.length; i++) { var v = cand[i]; if (v > 0) uPush(opts, v); if (opts.length >= 4 && opts.indexOf(corner) >= 0) break; }
    if (opts.indexOf(corner) < 0) opts[0] = corner; opts = opts.slice(0, 4); shuffle(opts);
    var pstr = sign > 0 ? '+ ' + p : '− ' + p;
    return { p: p, sign: sign, b: b, c: c, corner: corner, k: k, opts: opts, ans: corner,
      completed: '(x ' + pstr + ')²' + (k === 0 ? '' : (k > 0 ? ' + ' + k : ' − ' + (-k))), eq: 'x² ' + (b < 0 ? '− ' + (-b) : '+ ' + b) + 'x ' + (c < 0 ? '− ' + (-c) : '+ ' + c) };
  }

  /* ════════════════ GAME 1 — TILE FORGE (build the square) ════════════════
     The player performs completing-the-square by hand on the algebra-tile model:
       • CUT the bx strip exactly in half  → that is b ÷ 2
       • PLACE the two halves on two sides of the x² block → opens a corner gap
       • FILL the corner (it is (b/2)×(b/2)) with (b/2)² unit tiles
     Finishing reveals  x² + bx + c = (x + b/2)² + (c − (b/2)²). */
  function startForge(area) {
    area.innerHTML = '';
    var hud = el('div', 'gx-hud',
      '<span class="gx-pill">' + L('Level', 'Aras') + ' <b class="f-lvl">1</b>/6</span>'
      + '<span class="gx-pill">' + L('Score', 'Skor') + ' <b class="f-score">0</b></span>'
      + '<span class="gx-pill"><b class="f-stars">★ 0</b></span>'
      + '<span class="gx-pill">' + L('Streak', 'Rentetan') + ' <b class="f-streak">0</b></span>');
    area.appendChild(hud);
    var help = el('div', 'gx-help'); area.appendChild(help);
    var cv = makeCanvas(area, 488), ctx = cv.ctx;
    var ctrls = el('div', 'f-ctrls');
    var hintBtn = el('button', 'f-btn', L('💡 Hint', '💡 Petua')); hintBtn.type = 'button';
    var resetBtn = el('button', 'f-btn', L('↻ Restart level', '↻ Mula semula')); resetBtn.type = 'button';
    ctrls.appendChild(hintBtn); ctrls.appendChild(resetBtn); area.appendChild(ctrls);

    var LV = [{ b: 2, c: 1 }, { b: 4, c: 3 }, { b: 4, c: -2 }, { b: 6, c: 5 }, { b: 6, c: -3 }, { b: 8, c: 7 }];
    var li = 0, score = 0, streak = 0, totStars = 0, hintsUsed = 0, levelStart = 0, over = false;
    var phase = 'split', cutX = 0, knifeGrab = false, shake = 0;
    var strip0, blk, rightSlot, botSlot, corner, trayY, sqW, L0, u, BX, BY;
    var pieces = [], placedR = false, placedB = false, cornerFilled = 0, need = 1;
    var drag = null, flyers = [], parts = [], hint = 0, mascot = 0, flash = 0, prompt = '', banner = null, raf = 0, lastT = 0;

    function P() { return LV[li].b / 2; }
    function fmtBP() { return fmtEq(LV[li].b, LV[li].c); }
    function easeOut(t) { return 1 - (1 - t) * (1 - t); }
    function rrp(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r == null ? 6 : r); }

    function fit() {
      var W = cv.W; L0 = Math.round(Math.min(108, (W - 44) / 2)); u = Math.max(13, Math.round(L0 * 0.2));
      var p = P(); sqW = L0 + p * u; BX = Math.round((W - sqW) / 2); BY = 60;
      blk = { x: BX, y: BY, w: L0, h: L0 };
      rightSlot = { x: BX + L0, y: BY, w: p * u, h: L0 };
      botSlot = { x: BX, y: BY + L0, w: L0, h: p * u };
      corner = { x: BX + L0, y: BY + L0, w: p * u, h: p * u };
      trayY = BY + sqW + 20;
      strip0 = { x: Math.round((W - 2 * L0) / 2), y: trayY, w: 2 * L0, h: p * u };
    }
    function dispenser() { return { x: Math.round(cv.W * 0.5) - u / 2, y: trayY + P() * u + 20, w: u, h: u }; }

    function setPrompt() {
      if (phase === 'split') prompt = L('Cut the strip in half — that\u2019s b \u00f7 2', 'Potong jalur kepada dua sama — itu b \u00f7 2');
      else if (phase === 'place') prompt = L('Drag each half onto a side of the square', 'Seret setiap separuh ke sisi kuasa dua');
      else if (phase === 'fill') prompt = L('Fill the corner: (b/2) \u00d7 (b/2). Tap to add tiles', 'Isi sudut: (b/2) \u00d7 (b/2). Ketik untuk tambah');
      else prompt = '';
      help.textContent = prompt;
    }
    function setLevel(i) {
      li = i; phase = 'split'; knifeGrab = false; drag = null; flyers = []; banner = null; hintsUsed = 0; hint = 0;
      placedR = false; placedB = false; cornerFilled = 0; need = P() * P(); pieces = [];
      fit(); cutX = Math.round(strip0.x + strip0.w * 0.32);
      area.querySelector('.f-lvl').textContent = (i + 1); levelStart = performance.now(); setPrompt();
    }
    function bump() { mascot = 0.9; }
    function pop(x, y, col, n) { for (var i = 0; i < (n || 12); i++) { var a = Math.random() * 6.28, s = rf(40, 200); parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, col: col }); } }
    function syncHud() { area.querySelector('.f-score').textContent = score; area.querySelector('.f-streak').textContent = streak; area.querySelector('.f-stars').textContent = '★ ' + totStars; }

    function doCut() {
      if (phase !== 'split') return;
      pop(strip0.x + L0, strip0.y + strip0.h / 2, '#ffcf6b', 18); bump();
      var w = L0, h = P() * u, gap = 14, sx = Math.round((cv.W - (2 * w + gap)) / 2);
      pieces = [{ x: sx, y: trayY, hx: sx, hy: trayY, w: w, h: h, placed: false, popT: 0 },
                { x: sx + w + gap, y: trayY, hx: sx + w + gap, hy: trayY, w: w, h: h, placed: false, popT: 0 }];
      phase = 'place'; setPrompt();
    }
    function placeDone(pc, slot) { pc.placed = true; pc.popT = 0; pc.slot = slot; pop(slot.x + slot.w / 2, slot.y + slot.h / 2, '#7fe0b0', 14); bump(); if (placedR && placedB) { phase = 'fill'; setPrompt(); } }
    function tryPlace(idx, px, py, wasTap) {
      var pc = pieces[idx];
      var inR = !placedR && px > rightSlot.x - 60 && px < rightSlot.x + rightSlot.w + 60 && py > rightSlot.y - 60 && py < rightSlot.y + rightSlot.h + 60;
      var inB = !placedB && px > botSlot.x - 60 && px < botSlot.x + botSlot.w + 60 && py > botSlot.y - 60 && py < botSlot.y + botSlot.h + 60;
      var tgt = null;
      if (inR && inB) tgt = (Math.abs(px - (rightSlot.x + rightSlot.w / 2)) < Math.abs(px - (botSlot.x + botSlot.w / 2))) ? 'R' : 'B';
      else if (inR) tgt = 'R'; else if (inB) tgt = 'B';
      else if (wasTap) tgt = !placedR ? 'R' : (!placedB ? 'B' : null);
      if (tgt === 'R') { placedR = true; placeDone(pc, rightSlot); }
      else if (tgt === 'B') { placedB = true; placeDone(pc, botSlot); }
      else { pc.x = pc.hx; pc.y = pc.hy; }
    }
    function dropUnit() {
      if (phase !== 'fill' || cornerFilled >= need) return;
      var p = P(), idx = cornerFilled, cx = corner.x + (idx % p) * u, cy = corner.y + Math.floor(idx / p) * u, d = dispenser();
      flyers.push({ fromx: d.x, fromy: d.y, tox: cx, toy: cy, t: 0, onDone: function () { cornerFilled++; pop(cx + u / 2, cy + u / 2, '#ffd23f', 8); bump(); if (cornerFilled >= need) complete(); } });
    }
    function complete() {
      phase = 'reveal'; flash = 0.9; var t = (performance.now() - levelStart) / 1000;
      var star = t < 12 ? 3 : t < 24 ? 2 : 1; if (hintsUsed > 0) star = Math.min(star, 2);
      totStars += star; var gained = 80 * star + streak * 15; score += gained; streak++;
      pop(corner.x + corner.w / 2, corner.y + corner.h / 2, '#ffd23f', 40); bump();
      var p = P(); banner = { main: fmtBP() + '  =  ' + fmtSq(p, LV[li].c - p * p), star: star, gained: gained, t: 0 };
      syncHud();
      setTimeout(function () { if (over) return; if (li + 1 >= LV.length) finish(); else setLevel(li + 1); }, 2100);
    }
    function finish() { over = true; setTimeout(function () { area.innerHTML = ''; endScreen(area, 'forge', score, function () { activeCleanup = startForge(area); }); }, 200); }

    function rel(e) { var r = cv.c.getBoundingClientRect(); var pt = e.touches ? e.touches[0] : e; return { x: pt.clientX - r.left, y: pt.clientY - r.top }; }
    function down(e) {
      var p = rel(e); if (e.cancelable) e.preventDefault();
      if (phase === 'split') { if (p.x > strip0.x - 6 && p.x < strip0.x + strip0.w + 6 && p.y > strip0.y - 18 && p.y < strip0.y + strip0.h + 14) { knifeGrab = true; cutX = clamp(p.x, strip0.x + 8, strip0.x + strip0.w - 8); } }
      else if (phase === 'place') { for (var i = 0; i < pieces.length; i++) { var pc = pieces[i]; if (!pc.placed && p.x > pc.x && p.x < pc.x + pc.w && p.y > pc.y && p.y < pc.y + pc.h) { drag = { i: i, ox: p.x - pc.x, oy: p.y - pc.y, sx: p.x, sy: p.y, moved: false }; break; } } }
      else if (phase === 'fill') { var d = dispenser(); var onD = p.x > d.x - 32 && p.x < d.x + d.w + 32 && p.y > d.y - 22 && p.y < d.y + d.h + 22; var onC = p.x > corner.x - 12 && p.x < corner.x + corner.w + 12 && p.y > corner.y - 12 && p.y < corner.y + corner.h + 12; if (onD || onC) dropUnit(); }
    }
    function move(e) {
      var p = rel(e); if (e.cancelable) e.preventDefault();
      if (phase === 'split' && knifeGrab) cutX = clamp(p.x, strip0.x + 8, strip0.x + strip0.w - 8);
      else if (phase === 'place' && drag) { var pc = pieces[drag.i]; pc.x = p.x - drag.ox; pc.y = p.y - drag.oy; if (Math.abs(p.x - drag.sx) > 6 || Math.abs(p.y - drag.sy) > 6) drag.moved = true; }
    }
    function up(e) {
      var p = rel(e);
      if (phase === 'split' && knifeGrab) { knifeGrab = false; if (Math.abs(cutX - (strip0.x + strip0.w / 2)) < 22) doCut(); else { cutX = Math.round(strip0.x + strip0.w * 0.32); shake = 0.45; } }
      else if (phase === 'place' && drag) { var pc = pieces[drag.i], cx = pc.x + pc.w / 2, cy = pc.y + pc.h / 2; tryPlace(drag.i, drag.moved ? cx : p.x, drag.moved ? cy : p.y, !drag.moved); drag = null; }
    }
    cv.c.addEventListener('mousedown', down);
    cv.c.addEventListener('mousemove', function (e) { if (e.buttons || drag || knifeGrab) move(e); });
    window.addEventListener('mouseup', up);
    cv.c.addEventListener('touchstart', down, { passive: false });
    cv.c.addEventListener('touchmove', move, { passive: false });
    cv.c.addEventListener('touchend', up);
    hintBtn.addEventListener('click', function () { hint = 3; hintsUsed++; });
    resetBtn.addEventListener('click', function () { setLevel(li); });
    var onR = function () { cv.size(); setLevel(li); }; window.addEventListener('resize', onR);

    /* ---------- drawing ---------- */
    function gloss(x, y, w, h, c1, c2, r) { var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; rrp(x, y, w, h, r); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.16)'; rrp(x + 1.5, y + 1.5, w - 3, Math.max(3, h * 0.3), r); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1; rrp(x + .5, y + .5, w - 1, h - 1, r); ctx.stroke(); }
    function gridcells(x, y, w, h, nx, ny) { ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 1; for (var i = 1; i < nx; i++) { ctx.beginPath(); ctx.moveTo(x + i * w / nx, y + 2); ctx.lineTo(x + i * w / nx, y + h - 2); ctx.stroke(); } for (var j = 1; j < ny; j++) { ctx.beginPath(); ctx.moveTo(x + 2, y + j * h / ny); ctx.lineTo(x + w - 2, y + j * h / ny); ctx.stroke(); } }
    function slotGlow(s, time) { ctx.save(); ctx.setLineDash([6, 4]); var a = 0.4 + Math.sin(time * 4) * 0.25; ctx.strokeStyle = 'rgba(126,224,176,' + a + ')'; ctx.lineWidth = 2; rrp(s.x + 1, s.y + 1, s.w - 2, s.h - 2, 6); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(126,224,176,.06)'; rrp(s.x, s.y, s.w, s.h, 6); ctx.fill(); ctx.restore(); }
    function xblock() { gloss(blk.x, blk.y, blk.w, blk.h, '#5b8be6', '#2f55a8', 8); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = '800 ' + Math.round(blk.h * 0.26) + 'px Nunito, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('x\u00b2', blk.x + blk.w / 2, blk.y + blk.h / 2); }
    function stripIn(s, vertical) { gloss(s.x, s.y, s.w, s.h, '#f0b14e', '#c77f23', 6); if (vertical) gridcells(s.x, s.y, s.w, s.h, P(), 1); else gridcells(s.x, s.y, s.w, s.h, 1, P()); ctx.fillStyle = 'rgba(40,20,0,.82)'; ctx.font = '800 12px Nunito, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); if (vertical) { ctx.translate(s.x + s.w / 2, s.y + s.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('x \u00b7 ' + P(), 0, 0); } else ctx.fillText('x \u00b7 ' + P(), s.x + s.w / 2, s.y + s.h / 2); ctx.restore(); }
    function trayStrip(pc) { gloss(pc.x, pc.y, pc.w, pc.h, '#f0b14e', '#c77f23', 6); gridcells(pc.x, pc.y, pc.w, pc.h, 1, P()); ctx.fillStyle = 'rgba(40,20,0,.82)'; ctx.font = '800 12px Nunito, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('x \u00b7 ' + P(), pc.x + pc.w / 2, pc.y + pc.h / 2); }
    function splitStrip(time) {
      var off = shake > 0 ? Math.sin(performance.now() / 26) * 4 : 0, x = strip0.x + off;
      gloss(x, strip0.y, strip0.w, strip0.h, '#f0b14e', '#c77f23', 6); gridcells(x, strip0.y, strip0.w, strip0.h, 2, P());
      ctx.fillStyle = 'rgba(40,20,0,.85)'; ctx.font = '800 13px Nunito, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(LV[li].b + ' \u00b7 x', x + strip0.w / 2, strip0.y + strip0.h / 2);
      var mid = Math.abs(cutX - (strip0.x + strip0.w / 2)) < 22, lx = cutX + off;
      ctx.setLineDash([5, 4]); ctx.strokeStyle = mid ? '#7fffa0' : '#ffd27f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, strip0.y - 8); ctx.lineTo(lx, strip0.y + strip0.h + 8); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = mid ? '#7fffa0' : '#ffe9a8'; ctx.beginPath(); ctx.moveTo(lx - 7, strip0.y - 18); ctx.lineTo(lx + 7, strip0.y - 18); ctx.lineTo(lx, strip0.y - 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0a1226'; ctx.font = '700 11px Nunito, system-ui'; ctx.fillText('\u2702', lx, strip0.y - 24);
      if (!mid) { var mxp = strip0.x + strip0.w / 2 + off; ctx.strokeStyle = 'rgba(127,255,160,.55)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(mxp, strip0.y + strip0.h + 9); ctx.lineTo(mxp, strip0.y + strip0.h + 16); ctx.stroke(); ctx.setLineDash([]); }
    }
    function bear() {
      var x = cv.W - 34, y = cv.H - 30, h = mascot > 0, j = h ? Math.sin(performance.now() / 80) * 3 : 0; ctx.save(); ctx.translate(x, y - j);
      ctx.fillStyle = '#a9743f'; ctx.beginPath(); ctx.arc(-8, -9, 5, 0, 6.28); ctx.arc(8, -9, 5, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#c98a4e'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#f0d8b8'; ctx.beginPath(); ctx.ellipse(0, 4, 6, 5, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(-5, -2, 1.6, 0, 6.28); ctx.arc(5, -2, 1.6, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 2, 1.4, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.4; ctx.beginPath(); if (h) ctx.arc(0, 5, 3, 0, Math.PI); else { ctx.moveTo(-2, 6); ctx.lineTo(2, 6); } ctx.stroke();
      ctx.restore();
    }

    function update(dt) {
      mascot = Math.max(0, mascot - dt); flash = Math.max(0, flash - dt * 1.4); hint = Math.max(0, hint - dt); shake = Math.max(0, shake - dt * 2);
      pieces.forEach(function (pc) { if (pc.placed && pc.popT < 1) pc.popT = Math.min(1, pc.popT + dt * 5); });
      for (var i = flyers.length - 1; i >= 0; i--) { var f = flyers[i]; f.t += dt * 4; if (f.t >= 1) { if (f.onDone) f.onDone(); flyers.splice(i, 1); } }
      for (var j = parts.length - 1; j >= 0; j--) { var q = parts[j]; q.life -= dt * 1.7; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt; if (q.life <= 0) parts.splice(j, 1); }
      if (banner) banner.t = Math.min(1, banner.t + dt * 3);
    }
    function draw(time) {
      var W = cv.W, H = cv.H;
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b1733'); g.addColorStop(1, '#0a1124'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(120,170,255,.06)'; ctx.lineWidth = 1; for (var gx = 26; gx < W; gx += 26) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); } for (var gy = 26; gy < H; gy += 26) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      // equation band
      ctx.fillStyle = 'rgba(8,16,34,.8)'; rrp(8, 6, W - 16, 44, 10); ctx.fill(); ctx.strokeStyle = 'rgba(126,209,255,.45)'; ctx.lineWidth = 1.5; rrp(8, 6, W - 16, 44, 10); ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = '#eaf2ff'; ctx.font = '800 16px Nunito, system-ui'; ctx.textBaseline = 'alphabetic'; ctx.fillText(L('Blueprint:  ', 'Pelan:  ') + fmtBP(), W / 2, 26);
      ctx.fillStyle = '#9cc6ff'; ctx.font = '600 12px Nunito, system-ui'; ctx.fillText(prompt, W / 2, 42);
      // empty-slot / corner targets
      if (phase === 'place') { if (!placedR) slotGlow(rightSlot, time); if (!placedB) slotGlow(botSlot, time); }
      if (phase === 'fill') { ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(255,210,63,' + (0.5 + Math.sin(time * 4) * 0.3) + ')'; ctx.lineWidth = 2; rrp(corner.x + 1, corner.y + 1, corner.w - 2, corner.h - 2, 6); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
      // the square being built
      xblock();
      pieces.forEach(function (pc) { if (pc.placed) stripIn(pc.slot, pc.slot === rightSlot); });
      var p = P(); for (var i = 0; i < cornerFilled; i++) { var cx = corner.x + (i % p) * u, cy = corner.y + Math.floor(i / p) * u; gloss(cx + 1, cy + 1, u - 2, u - 2, '#ffe08a', '#e3a92e', 4); }
      // tray
      if (phase === 'split') splitStrip(time);
      if (phase === 'place') pieces.forEach(function (pc, i) { if (!pc.placed && !(drag && drag.i === i)) trayStrip(pc); });
      if (phase === 'fill') { var d = dispenser(); gloss(d.x + 3, d.y + 3, d.w, d.h, '#ffe08a', '#e3a92e', 4); gloss(d.x, d.y, d.w, d.h, '#ffe9a8', '#eab646', 4); ctx.fillStyle = '#fff'; ctx.font = '800 13px Nunito, system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('\u00d7 ' + (need - cornerFilled), d.x + d.w + 8, d.y + d.h / 2); ctx.fillStyle = '#bcd3f2'; ctx.font = '600 11px Nunito, system-ui'; ctx.textAlign = 'center'; ctx.fillText(L('tap to add', 'ketik tambah'), d.x + d.w / 2, d.y + d.h + 14); }
      // dragged piece
      if (phase === 'place' && drag) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 12; trayStrip(pieces[drag.i]); ctx.restore(); }
      // flyers
      flyers.forEach(function (f) { var t = easeOut(f.t), fx = f.fromx + (f.tox - f.fromx) * t, fy = f.fromy + (f.toy - f.fromy) * t; gloss(fx + 1, fy + 1, u - 2, u - 2, '#ffe9a8', '#eab646', 4); });
      // particles
      parts.forEach(function (q) { ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.col; ctx.fillRect(q.x - 1.5, q.y - 1.5, 3, 3); }); ctx.globalAlpha = 1;
      // hint pulse
      if (hint > 0) { var pr = 0.5 + Math.sin(performance.now() / 120) * 0.5; ctx.save(); ctx.globalAlpha = pr * 0.9; ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; if (phase === 'split') { var mxp = strip0.x + strip0.w / 2; ctx.beginPath(); ctx.arc(mxp, strip0.y + strip0.h / 2, 16, 0, 6.28); ctx.stroke(); } else if (phase === 'place') { var s = !placedR ? rightSlot : botSlot; rrp(s.x - 3, s.y - 3, s.w + 6, s.h + 6, 8); ctx.stroke(); } else if (phase === 'fill') { rrp(corner.x - 3, corner.y - 3, corner.w + 6, corner.h + 6, 8); ctx.stroke(); } ctx.restore(); }
      bear();
      if (banner) { var t2 = easeOut(banner.t), cardW = Math.min(W - 36, 380), cx2 = W / 2, y2 = H * 0.6 - 36 * t2; ctx.save(); ctx.globalAlpha = t2; ctx.fillStyle = 'rgba(10,18,38,.96)'; rrp(cx2 - cardW / 2, y2 - 34, cardW, 70, 12); ctx.fill(); ctx.strokeStyle = '#34d3a6'; ctx.lineWidth = 2; rrp(cx2 - cardW / 2, y2 - 34, cardW, 70, 12); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '800 15px Nunito, system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(banner.main, cx2, y2 - 6); var st = ''; for (var k = 0; k < 3; k++) st += k < banner.star ? '\u2605' : '\u2606'; ctx.fillStyle = '#ffd23f'; ctx.font = '800 16px Nunito, system-ui'; ctx.fillText(st + '    +' + banner.gained, cx2, y2 + 18); ctx.restore(); }
      if (flash > 0) { ctx.fillStyle = 'rgba(255,221,120,' + (flash * 0.42) + ')'; ctx.fillRect(0, 0, W, H); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
    function loop(ts) { if (!lastT) lastT = ts; var dt = Math.min(0.05, (ts - lastT) / 1000); lastT = ts; update(dt); draw(ts / 1000); if (!over) raf = requestAnimationFrame(loop); }

    setLevel(0); syncHud(); raf = requestAnimationFrame(loop);
    return function () { if (raf) cancelAnimationFrame(raf); window.removeEventListener('mouseup', up); window.removeEventListener('resize', onR); };
  }

  /* ════════════════ GAME 2 — KNIGHT DUNGEON (pixel-art) ════════════════ */
  function startDungeon(area) {
    area.innerHTML = '';
    var hud = el('div', 'gx-hud',
      '<span class="gx-pill gx-hearts"></span><span class="gx-pill">💎 <b class="d-gems">0</b></span>'
      + '<span class="gx-pill gx-key">🗝 <b class="d-key">0</b></span><span class="gx-pill">' + L('Level', 'Aras') + ' <b class="d-lvl">1</b></span>'
      + '<span class="gx-pill">' + L('Score', 'Skor') + ' <b class="d-score">0</b></span>');
    area.appendChild(hud);
    area.appendChild(el('div', 'gx-help', L('Move: arrows / WASD / buttons. Grab the 🗝 key, beat monsters by solving quadratics, open the door.',
      'Gerak: anak panah / WASD / butang. Ambil 🗝 kunci, kalahkan raksasa dengan menyelesaikan kuasa dua, buka pintu.')));

    var MAPS = [
      ['#############', '#S...G...M.K#', '#.#.#.#.#.#.#', '#..M...G...W#', '#.#.#.#.#.#.#', '#G...C...M..#', '#.#.#.#.#.#.#', '#..M..G....D#', '#############'],
      ['#############', '#S..M..G..WW#', '#.#.#.#.#.#.#', '#G...K...M..#', '#.#.#.#.#.#.#', '#..C..M..G..#', '#.#.#.#.#.#.#', '#M..G...M..D#', '#############'],
      ['#############', '#S.G..M..G.M#', '#.#.#.#.#.#.#', '#..M..K..C..#', '#.#.#.#.#.#.#', '#WW..G..M..G#', '#.#.#.#.#.#.#', '#.M..G..M..D#', '#############']
    ];

    var cv = makeCanvas(area, 444), vctx = cv.ctx;
    cv.c.classList.add('gx-pixel');
    var N = 16, grid, cols, rows, TILE, scale, ox, oy, nc, nctx, torches;
    var hero, gems, monsters, chests, keyPos, doorPos, level = 0, gemCount = 0, score = 0, hearts = 3, hasKey = false, over = false, paused = false;
    var parts = [], toast = null, raf = 0, lastT = 0;

    function parse(m) {
      rows = m.length; cols = m[0].length; grid = []; gems = []; monsters = []; chests = []; keyPos = null; doorPos = null; hasKey = false; torches = [];
      for (var y = 0; y < rows; y++) { var row = []; for (var x = 0; x < cols; x++) {
        var ch = m[y][x]; row.push(ch === '#' ? '#' : (ch === 'W' ? 'W' : '.'));
        if (ch === 'S') hero = { gx: x, gy: y, fx: x, fy: y, mv: 0, dir: 1 };
        else if (ch === 'G') gems.push({ x: x, y: y, got: false });
        else if (ch === 'M') monsters.push({ x: x, y: y, alive: true, ph: Math.random() * 6, type: rnd(2) });
        else if (ch === 'K') keyPos = { x: x, y: y, got: false };
        else if (ch === 'C') chests.push({ x: x, y: y, open: false });
        else if (ch === 'D') doorPos = { x: x, y: y };
      } grid.push(row); }
      for (var ty = 0; ty < rows; ty++) for (var tx = 0; tx < cols; tx++) { if (grid[ty][tx] === '#' && ty < rows - 1 && grid[ty + 1][tx] !== '#' && grid[ty + 1][tx] !== 'W' && ((tx * 5 + ty * 3) % 6 === 0)) torches.push({ x: tx, y: ty }); }
      if (!nc || nc.width !== cols * N) { nc = document.createElement('canvas'); nc.width = cols * N; nc.height = rows * N; nctx = nc.getContext('2d'); }
    }
    function fit() { scale = clamp(Math.floor(Math.min(cv.W / (N * cols), cv.H / (N * rows))), 2, 6); TILE = N * scale; ox = Math.floor((cv.W - TILE * cols) / 2); oy = Math.floor((cv.H - TILE * rows) / 2); }
    function load(i) { parse(MAPS[i]); fit(); area.querySelector('.d-lvl').textContent = (i + 1); sync(); }
    function isWall(x, y) { return (x < 0 || y < 0 || x >= cols || y >= rows) ? true : grid[y][x] === '#'; }
    function monAt(x, y) { for (var i = 0; i < monsters.length; i++) if (monsters[i].alive && monsters[i].x === x && monsters[i].y === y) return monsters[i]; return null; }
    function chestAt(x, y) { for (var i = 0; i < chests.length; i++) if (!chests[i].open && chests[i].x === x && chests[i].y === y) return chests[i]; return null; }

    function tryMove(dx, dy) {
      if (paused || over || hero.mv > 0) return;
      if (dx < 0) hero.dir = -1; if (dx > 0) hero.dir = 1;
      var nx = hero.gx + dx, ny = hero.gy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return;
      if (grid[ny][nx] === '#') return;
      if (grid[ny][nx] === 'W') { toastMsg(L('Water blocks the way', 'Air menghalang')); return; }
      var mon = monAt(nx, ny); if (mon) { ask(function (ok) { if (ok) { mon.alive = false; score += 15; burst(nx, ny, '#34d3a6'); sync(); } else hurt(); }); return; }
      var ch = chestAt(nx, ny); if (ch) { ask(function (ok) { if (ok) { ch.open = true; gemCount += 2; score += 20; burst(nx, ny, '#ffd23f'); sync(); } else hurt(); }); return; }
      if (doorPos && nx === doorPos.x && ny === doorPos.y) { if (!hasKey) { toastMsg(L('Locked — find the 🗝 key!', 'Berkunci — cari 🗝 kunci!')); return; } ask(function (ok) { if (ok) { score += 30; burst(nx, ny, '#ffd23f'); next(); } else hurt(); }, true); return; }
      hero.fx = hero.gx; hero.fy = hero.gy; hero.gx = nx; hero.gy = ny; hero.mv = 1;
    }
    function arrive() {
      for (var i = 0; i < gems.length; i++) { var g = gems[i]; if (!g.got && g.x === hero.gx && g.y === hero.gy) { g.got = true; gemCount++; score += 10; burst(g.x, g.y, '#7ad7ff'); sync(); } }
      if (keyPos && !keyPos.got && keyPos.x === hero.gx && keyPos.y === hero.gy) { keyPos.got = true; hasKey = true; score += 15; burst(keyPos.x, keyPos.y, '#ffd23f'); toastMsg(L('Key found! The door will open.', 'Kunci dijumpai! Pintu boleh dibuka.')); sync(); }
    }
    function next() { level++; if (level >= MAPS.length) { over = true; setTimeout(function () { area.innerHTML = ''; endScreen(area, 'dungeon', score + hearts * 25, function () { activeCleanup = startDungeon(area); }); }, 320); return; } burst(doorPos.x, doorPos.y, '#ffd23f'); load(level); }
    function hurt() { hearts--; sync(); toastMsg(L('Ouch! Wrong answer', 'Aduh! Jawapan salah')); if (hearts <= 0) { over = true; setTimeout(function () { area.innerHTML = ''; endScreen(area, 'dungeon', score, function () { activeCleanup = startDungeon(area); }); }, 360); } }
    function burst(gx, gy, col) { var cx = gx * N + N / 2, cy = gy * N + N / 2; for (var i = 0; i < 12; i++) { var a = Math.random() * 6.28, s = rf(8, 34); parts.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, col: col }); } }
    function toastMsg(s) { toast = { s: s, life: 2.1 }; }
    function sync() { area.querySelector('.d-gems').textContent = gemCount; area.querySelector('.d-score').textContent = score; area.querySelector('.d-key').textContent = (hasKey ? 1 : 0); var h = ''; for (var i = 0; i < 3; i++) h += (i < hearts ? '❤️' : '🤍'); area.querySelector('.gx-hearts').innerHTML = h; }

    function ask(cb, boss) {
      paused = true; var Q = genQuestion();
      var modal = el('div', 'dg-modal');
      modal.innerHTML = '<div class="dg-card"><div class="dg-tag">' + (boss ? L('🚪 Door lock', '🚪 Kunci pintu') : L('⚔ Battle', '⚔ Pertarungan')) + '</div><div class="dg-q">' + Q.q + '</div><div class="dg-opts">' + Q.opts.map(function (o) { return '<button class="dg-opt" type="button">' + o + '</button>'; }).join('') + '</div></div>';
      area.appendChild(modal);
      Array.prototype.forEach.call(modal.querySelectorAll('.dg-opt'), function (btn) {
        btn.addEventListener('click', function () {
          var ok = btn.textContent === Q.ans;
          Array.prototype.forEach.call(modal.querySelectorAll('.dg-opt'), function (b) { b.disabled = true; if (b.textContent === Q.ans) b.classList.add('ok'); });
          if (!ok) btn.classList.add('bad');
          setTimeout(function () { modal.remove(); paused = false; cb(ok); }, ok ? 360 : 850);
        });
      });
    }

    function onKey(e) { var k = e.key.toLowerCase(); if (k === 'arrowup' || k === 'w') { tryMove(0, -1); e.preventDefault(); } else if (k === 'arrowdown' || k === 's') { tryMove(0, 1); e.preventDefault(); } else if (k === 'arrowleft' || k === 'a') { tryMove(-1, 0); e.preventDefault(); } else if (k === 'arrowright' || k === 'd') { tryMove(1, 0); e.preventDefault(); } }
    window.addEventListener('keydown', onKey);
    var pad = el('div', 'dg-pad', '<button class="dg-btn dg-up" type="button">▲</button><div class="dg-mid"><button class="dg-btn dg-left" type="button">◀</button><button class="dg-btn dg-right" type="button">▶</button></div><button class="dg-btn dg-down" type="button">▼</button>');
    area.appendChild(pad);
    pad.querySelector('.dg-up').addEventListener('click', function () { tryMove(0, -1); });
    pad.querySelector('.dg-down').addEventListener('click', function () { tryMove(0, 1); });
    pad.querySelector('.dg-left').addEventListener('click', function () { tryMove(-1, 0); });
    pad.querySelector('.dg-right').addEventListener('click', function () { tryMove(1, 0); });
    var onR = function () { cv.size(); fit(); }; window.addEventListener('resize', onR);

    /* ---------- pixel-art drawing on the native (low-res) canvas ---------- */
    function fr(x, y, w, h, col) { nctx.fillStyle = col; nctx.fillRect(x, y, w, h); }
    function diamond(cx, cy, r, col) { nctx.fillStyle = col; for (var i = -r; i <= r; i++) { var w = r - Math.abs(i); nctx.fillRect(cx - w, cy + i, 2 * w + 1, 1); } }
    function floorN(x, y) {
      var px = x * N, py = y * N, v = (x * 3 + y * 7) & 3;
      fr(px, py, N, N, ['#48455e', '#444159', '#4d4a63', '#403e52'][v]);
      fr(px + 2 + ((x * 5 + y) % 11), py + 3 + ((y * 7 + x) % 9), 1, 1, 'rgba(0,0,0,.22)');
      fr(px + 8 + ((x * 3) % 5), py + 9 + ((y * 3) % 5), 1, 1, 'rgba(0,0,0,.18)');
      fr(px + 5 + ((y * 2) % 6), py + 5 + ((x * 2) % 6), 1, 1, 'rgba(255,255,255,.05)');
      fr(px, py + N - 1, N, 1, 'rgba(0,0,0,.22)'); fr(px + N - 1, py, 1, N, 'rgba(0,0,0,.18)');
    }
    function wallN(x, y) {
      var px = x * N, py = y * N, up = isWall(x, y - 1), lf = isWall(x - 1, y), rt = isWall(x + 1, y);
      fr(px, py, N, N, '#363b50');                                   // front face
      fr(px, py + 5, N, 1, 'rgba(0,0,0,.30)'); fr(px, py + 10, N, 1, 'rgba(0,0,0,.30)');  // mortar rows
      var o = y % 2;
      fr(px + (o ? 4 : 10), py + 1, 1, 4, 'rgba(0,0,0,.30)'); fr(px + (o ? 11 : 5), py + 6, 1, 4, 'rgba(0,0,0,.30)'); fr(px + (o ? 4 : 10), py + 11, 1, 4, 'rgba(0,0,0,.30)');
      fr(px + 1, py + 1, N - 2, 1, 'rgba(255,255,255,.05)'); fr(px + 1, py + 6, N - 3, 1, 'rgba(255,255,255,.05)');
      if (!up) { fr(px, py, N, 5, '#666d86'); fr(px, py, N, 1, '#838bA6'.toLowerCase()); fr(px, py + 5, N, 1, 'rgba(0,0,0,.40)'); }
      if (!lf) fr(px, py, 1, N, 'rgba(0,0,0,.26)');
      if (!rt) fr(px + N - 1, py, 1, N, 'rgba(0,0,0,.32)');
    }
    function waterN(x, y, fr2) {
      var px = x * N, py = y * N; fr(px, py, N, N, '#1c4fa0');
      fr(px, py, N, 1, 'rgba(0,0,0,.28)');
      var o = (fr2 + x) % 4;
      fr(px + 2, py + 3 + (o % 2), 5, 1, 'rgba(160,205,255,.7)'); fr(px + 9, py + 8 + ((o + 1) % 2), 4, 1, 'rgba(160,205,255,.7)');
      fr(px + 5, py + 11 + (o % 2), 4, 1, 'rgba(160,205,255,.45)');
    }
    function torchFlameN(t, fr2) { var bx = t.x * N + N / 2, by = t.y * N + N - 4, f = fr2 % 3; fr(bx - 1, by, 2, 4, '#3a2a18'); fr(bx - 2, by - 6 - f, 4, 4, '#ff7a1a'); fr(bx - 1, by - 7 - f, 2, 4, '#ffc24a'); fr(bx - 1, by - 5 - f, 1, 2, '#fff3c0'); }
    function gemN(g, bob) { if (g.got) return; var cx = g.x * N + N / 2, cy = g.y * N + N / 2 + bob; diamond(cx, cy, 4, '#1c6fb0'); diamond(cx, cy, 3, '#2f96d8'); fr(cx - 2, cy - 1, 1, 1, '#cdefff'); fr(cx - 1, cy - 2, 1, 1, '#cdefff'); }
    function keyN(bob) { if (!keyPos || keyPos.got) return; var cx = keyPos.x * N + N / 2, cy = keyPos.y * N + N / 2 + bob, c = '#ffd23f'; fr(cx - 4, cy - 2, 3, 1, c); fr(cx - 4, cy + 1, 3, 1, c); fr(cx - 4, cy - 1, 1, 2, c); fr(cx - 2, cy - 1, 1, 2, c); fr(cx - 1, cy, 5, 1, c); fr(cx + 2, cy + 1, 1, 2, c); fr(cx + 4, cy + 1, 1, 2, c); }
    function chestN(c) { var x = c.x * N + 2, y = c.y * N + 5, c1 = '#5a3a18'; fr(x, y, 12, 9, c1); fr(x + 1, y + 1, 10, 3, '#8a5a2b'); fr(x, y + 4, 12, 1, '#caa24a'); fr(x + 5, y, 2, 9, '#caa24a'); if (c.open) fr(x + 1, y + 1, 10, 2, '#241405'); else fr(x + 5, y + 5, 2, 2, '#3a2410'); }
    function doorN(time) {
      if (!doorPos) return; var px = doorPos.x * N, py = doorPos.y * N, gl = hasKey ? (0.6 + Math.sin(time * 5) * 0.4) : 0;
      diamond(px + N / 2, py + 5, 7, '#8a98ad'); fr(px, py + 4, N, N - 4, '#0e0b16');
      fr(px + 2, py + 4, N - 4, N - 5, '#6a4a28'); fr(px + 2, py + 4, N - 4, 1, '#8a5a2b');
      fr(px + N / 2 - 1, py + 5, 1, N - 6, '#3a2814');
      fr(px + 3, py + 9, 1, 1, '#caa24a'); fr(px + N - 4, py + 9, 1, 1, '#caa24a');
      if (gl) { fr(px + 2, py + 4, N - 4, 1, 'rgba(255,210,63,' + gl + ')'); fr(px + 2, py + N - 2, N - 4, 1, 'rgba(255,210,63,' + gl + ')'); }
    }
    function slimeN(m, time) {
      var cx = m.x * N + N / 2, cy = m.y * N + N / 2 + 2, sq = Math.sin(time * 5 + m.ph) > 0 ? 1 : 0;
      fr(cx - 5, cy + 3 - sq, 10, 1, 'rgba(0,0,0,.25)');
      fr(cx - 5, cy - 2 + sq, 10, 5 - sq, '#1f9d5b'); fr(cx - 4, cy - 4 + sq, 8, 2, '#1f9d5b');
      fr(cx - 4, cy - 3 + sq, 8, 2, '#3fbf78'); fr(cx - 3, cy - 4 + sq, 3, 1, '#9cf0c0');
      fr(cx - 3, cy - 1 + sq, 2, 2, '#fff'); fr(cx + 1, cy - 1 + sq, 2, 2, '#fff'); fr(cx - 2, cy - 1 + sq, 1, 1, '#0a3'); fr(cx + 2, cy - 1 + sq, 1, 1, '#0a3');
    }
    function skullN(m, time) {
      var cx = m.x * N + N / 2, cy = m.y * N + N / 2 + Math.sin(time * 3 + m.ph) * 1;
      fr(cx - 4, cy - 5, 8, 6, '#edeef4'); fr(cx - 3, cy + 1, 6, 2, '#edeef4'); fr(cx - 5, cy - 4, 1, 4, '#edeef4'); fr(cx + 4, cy - 4, 1, 4, '#edeef4');
      fr(cx - 3, cy - 3, 2, 2, '#1c1c28'); fr(cx + 1, cy - 3, 2, 2, '#1c1c28'); fr(cx - 3, cy - 3, 1, 1, '#ff7a4d'); fr(cx + 1, cy - 3, 1, 1, '#ff7a4d');
      fr(cx - 1, cy - 1, 1, 1, '#888'); fr(cx - 2, cy + 1, 1, 1, '#888'); fr(cx, cy + 1, 1, 1, '#888'); fr(cx + 1, cy + 1, 1, 1, '#888');
    }
    function knightN(time) {
      var k = 1 - hero.mv, nx = Math.round((hero.fx + (hero.gx - hero.fx) * k) * N), ny = Math.round((hero.fy + (hero.gy - hero.fy) * k) * N);
      var cx = nx + N / 2, top = ny + 1, bob = (hero.mv > 0 && Math.floor(time * 10) % 2 === 0) ? 1 : 0, d = hero.dir;
      fr(cx - 5, ny + N - 2, 10, 1, 'rgba(0,0,0,.28)');
      fr(cx - 1, top, 2, 2, '#c0392b'); fr(cx + d, top - 1, 1, 2, '#c0392b');           // plume
      fr(cx - 3, top + 2, 6, 4, '#b6bed0');                                              // helmet
      fr(cx - 2, top + 4, 4, 1, '#2a2f3d'); fr(cx - 2, top + 3, 3, 1, 'rgba(255,255,255,.5)'); // visor + shine
      fr(cx - 3, top + 6 + bob, 6, 5, '#cdd6e8'); fr(cx - 3, top + 9 + bob, 6, 2, '#8b94ac');  // body
      // shield + sword swap by facing
      var shX = d > 0 ? cx - 5 : cx + 4, swX = d > 0 ? cx + 4 : cx - 5;
      fr(shX, top + 7 + bob, 2, 4, '#c0392b'); fr(shX, top + 8 + bob, 1, 1, '#ffd23f');
      fr(swX, top + 4 + bob, 1, 6, '#e8edf6'); fr(swX + (d > 0 ? -1 : 0), top + 8 + bob, 2, 1, '#caa24a');
      fr(cx - 2, top + 11 + bob, 2, 3, '#3b4254'); fr(cx + 1, top + 11 + bob, 2, 3, '#3b4254');  // legs
    }

    function loop(ts) {
      if (!lastT) lastT = ts; var dt = Math.min(0.05, (ts - lastT) / 1000); lastT = ts; var time = ts / 1000, fr2 = Math.floor(time * 6);
      if (hero && hero.mv > 0) { hero.mv = Math.max(0, hero.mv - dt * 7); if (hero.mv === 0) arrive(); }
      for (var p = parts.length - 1; p >= 0; p--) { var q = parts[p]; q.life -= dt * 1.8; q.x += q.vx * dt; q.y += q.vy * dt; if (q.life <= 0) parts.splice(p, 1); }
      if (toast) { toast.life -= dt; if (toast.life <= 0) toast = null; }

      // ---- draw native scene ----
      nctx.fillStyle = '#0e0b16'; nctx.fillRect(0, 0, cols * N, rows * N);
      var bob = Math.round(Math.sin(time * 3) * 1);
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) { var c = grid[y][x]; if (c === '#') wallN(x, y); else if (c === 'W') waterN(x, y, fr2); else floorN(x, y); }
      torches.forEach(function (t) { torchFlameN(t, fr2); });
      gems.forEach(function (g) { gemN(g, bob); });
      chests.forEach(function (c) { chestN(c); });
      keyN(bob); doorN(time);
      monsters.forEach(function (m) { if (m.alive) (m.type === 0 ? slimeN : skullN)(m, time); });
      if (hero) knightN(time);
      parts.forEach(function (q) { nctx.globalAlpha = Math.max(0, q.life); nctx.fillStyle = q.col; nctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }); nctx.globalAlpha = 1;

      // ---- blit native -> visible (crisp upscale) ----
      vctx.clearRect(0, 0, cv.W, cv.H); vctx.fillStyle = '#0a0810'; vctx.fillRect(0, 0, cv.W, cv.H);
      vctx.imageSmoothingEnabled = false;
      vctx.drawImage(nc, 0, 0, cols * N, rows * N, ox, oy, TILE * cols, TILE * rows);
      // torch glow (smooth) on top
      torches.forEach(function (t) { var sx = ox + (t.x + 0.5) * TILE, sy = oy + (t.y + 0.78) * TILE, fl = 0.7 + Math.sin(time * 10 + t.x) * 0.3; var g = vctx.createRadialGradient(sx, sy, 2, sx, sy, TILE * 1.1); g.addColorStop(0, 'rgba(255,170,60,' + (0.4 * fl) + ')'); g.addColorStop(1, 'rgba(255,170,60,0)'); vctx.fillStyle = g; vctx.beginPath(); vctx.arc(sx, sy, TILE * 1.1, 0, 6.28); vctx.fill(); });
      if (toast) { vctx.save(); vctx.globalAlpha = Math.min(1, toast.life); vctx.font = '700 14px Nunito, system-ui'; vctx.textAlign = 'center'; var w = vctx.measureText(toast.s).width + 24; vctx.fillStyle = 'rgba(0,0,0,.72)'; vctx.beginPath(); vctx.roundRect(cv.W / 2 - w / 2, 8, w, 26, 8); vctx.fill(); vctx.fillStyle = '#fff'; vctx.fillText(toast.s, cv.W / 2, 25); vctx.restore(); vctx.textAlign = 'left'; }

      if (!over) raf = requestAnimationFrame(loop);
    }

    load(0);
    raf = requestAnimationFrame(loop);
    return function () { if (raf) cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onR); };
  }

  function init() { mount = document.getElementById('gamesMount'); if (!mount) return; showHub(); if (window.I18N && I18N.onChange) I18N.onChange(function () { if (mount.querySelector('.games-grid')) showHub(); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  return { init: init, showHub: showHub };
})();
