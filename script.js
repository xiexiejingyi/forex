/* ===================================================
   FOREX.com Microsite — Interactions
   =================================================== */
(function () {
  "use strict";

  /* ---------- Capture mode (screenshot verification only) ---------- */
  if (location.search.indexOf("capture") !== -1) {
    document.documentElement.classList.add("capture");
  }

  /* ---------- Header scroll state ---------- */
  const header = document.getElementById("siteHeader");
  const onScrollHeader = () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          // reversible: elements transition IN and OUT as they enter / leave the viewport
          e.target.classList.toggle("in", e.isIntersecting);
        });
      },
      { threshold: 0.16, rootMargin: "-8% 0px -12% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ============================================================
     LIVE MARKET MASTHEAD — data sim, chart, cinematic states
     ============================================================ */
  const masthead = document.getElementById("top");
  const bgCanvas = document.getElementById("bgChart");
  const phoneCanvas = document.getElementById("phoneChart");

  if (masthead && bgCanvas) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- instrument (swap symbol/feed here later) ---- */
    const SYMBOLS = {
      NVDA: { name: "NVIDIA Corporation · NASDAQ", base: 131.4, vol: 0.9,
        desc: "NVIDIA powers the global AI compute boom — its GPUs run the world's data centres, making it one of the most actively traded names on Wall Street right now." },
      MSFT: { name: "Microsoft Corporation · NASDAQ", base: 446.8, vol: 1.4,
        desc: "Microsoft rides the cloud and AI super-cycle through Azure and Copilot — a mega-cap anchor that moves global indices." },
      MU:   { name: "Micron Technology · NASDAQ", base: 138.2, vol: 1.6,
        desc: "Micron's high-bandwidth memory is the backbone of AI accelerators — a high-beta name that swings hard with the chip cycle." },
    };
    const symKey = "NVDA";
    const SYM = SYMBOLS[symKey];

    /* ---- generate seed history (candles) ---- */
    const N = 64;
    let candles = [];
    (function seed() {
      let price = SYM.base * (1 - SYM.vol / 100 * 6);
      for (let i = 0; i < N; i++) {
        const drift = SYM.base * 0.0006;
        const o = price;
        const move = (Math.random() - 0.46) * SYM.vol + drift;
        const c = Math.max(1, o + move);
        const h = Math.max(o, c) + Math.random() * SYM.vol * 0.6;
        const l = Math.min(o, c) - Math.random() * SYM.vol * 0.6;
        candles.push({ o, h, l, c });
        price = c;
      }
    })();
    const open0 = candles[0].o;

    /* ---- DOM refs ---- */
    const elPrice = document.getElementById("tkPrice");
    const elChange = document.getElementById("tkChange");
    const elName = document.getElementById("tkName");
    const elDesc = document.getElementById("marketDesc");
    const elSym = document.getElementById("tkSymbol");
    const phPrice = document.getElementById("phPrice");
    const phChange = document.getElementById("phChange");
    const phSym = document.getElementById("phSymbol");
    const volDots = Array.from(document.querySelectorAll("#volTicks .vt-dot"));
    if (elName) elName.textContent = SYM.name;
    if (elDesc) elDesc.textContent = SYM.desc;
    if (elSym) elSym.textContent = symKey;
    if (phSym) phSym.textContent = symKey;

    /* ---- rotating in-phone nudge copy ---- */
    const nudgeEl = document.getElementById("deviceNudge");
    if (nudgeEl) {
      const NUDGES = [
        "🎯 Practice risk-free with $10,000 virtual funds",
        "🔥 " + symKey + " is trending — trade the move",
        "⚡ Open your account in under 90 seconds",
        "💸 $0 commission on US shares",
        "🚀 Join 1M+ traders worldwide",
        "🆓 Try a demo — no deposit needed",
        "📈 Don't miss the next big move",
      ];
      let ni = 0;
      setInterval(() => {
        ni = (ni + 1) % NUDGES.length;
        nudgeEl.classList.add("swap");
        setTimeout(() => {
          nudgeEl.textContent = NUDGES[ni];
          nudgeEl.classList.remove("swap");
        }, 400);
      }, 3200);
    }

    const fmt = (n) => "$" + n.toFixed(2);

    function updateTickerDOM() {
      const last = candles[candles.length - 1].c;
      const chg = last - open0;
      const pct = (chg / open0) * 100;
      const up = chg >= 0;
      const sign = up ? "+" : "−";
      const abs = Math.abs(chg).toFixed(2);
      const pctTxt = Math.abs(pct).toFixed(2);
      if (elPrice) elPrice.textContent = fmt(last);
      if (elChange) {
        elChange.textContent = `${sign}${abs} (${pctTxt}%)`;
        elChange.className = "tk-change " + (up ? "up" : "down");
      }
      if (phPrice) phPrice.textContent = fmt(last);
      if (phChange) {
        phChange.textContent = `${sign}${pctTxt}%`;
        phChange.className = "ph-change " + (up ? "up" : "down");
      }
      // last 3 directional moves -> vol dots
      const dirs = [];
      for (let i = candles.length - 3; i < candles.length; i++) {
        dirs.push(candles[i].c >= candles[i].o ? "up" : "down");
      }
      volDots.forEach((d, i) => { d.className = "vt-dot " + (dirs[i] || ""); });
    }

    /* ---- chart renderer (view = how many candles from the right are shown) ---- */
    function drawChart(canvas, view) {
      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      view = Math.max(4, Math.min(N, view || N));
      const start = N - view;                       // fractional ok
      const firstIdx = Math.max(0, Math.floor(start));

      // scale range over visible candles only
      let min = Infinity, max = -Infinity;
      for (let i = firstIdx; i < N; i++) {
        if (candles[i].l < min) min = candles[i].l;
        if (candles[i].h > max) max = candles[i].h;
      }
      const pad = (max - min) * 0.14 || 1;
      min -= pad; max += pad;

      const padX = w * 0.02;
      const innerW = w - padX * 2;
      const X = (i) => padX + ((i - start) / (view - 1)) * innerW;
      const Y = (p) => h - ((p - min) / (max - min)) * h;

      // grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      for (let g = 0; g <= 4; g++) {
        const yy = (h / 4) * g;
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
        const val = max - ((max - min) / 4) * g;
        ctx.fillText(val.toFixed(1), w - 42, yy + 14);
      }

      const lastC = candles[N - 1].c;
      const up = lastC >= open0;
      const lineCol = up ? "#4cf09a" : "#ff7d8d";

      // area under close line
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, up ? "rgba(76,240,154,0.30)" : "rgba(255,107,125,0.30)");
      grad.addColorStop(1, "rgba(76,240,154,0)");
      ctx.beginPath();
      ctx.moveTo(X(firstIdx), Y(candles[firstIdx].c));
      for (let i = firstIdx; i < N; i++) ctx.lineTo(X(i), Y(candles[i].c));
      ctx.lineTo(X(N - 1), h); ctx.lineTo(X(firstIdx), h); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();

      // candlesticks
      const cw = Math.max(2, innerW / view * 0.55);
      for (let i = firstIdx; i < N; i++) {
        const c = candles[i], x = X(i);
        const col = c.c >= c.o ? "#4cf09a" : "#ff6b7d";
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1, cw * 0.12);
        ctx.beginPath(); ctx.moveTo(x, Y(c.h)); ctx.lineTo(x, Y(c.l)); ctx.stroke();
        const yo = Y(c.o), yc = Y(c.c);
        ctx.globalAlpha = 0.92;
        ctx.fillRect(x - cw / 2, Math.min(yo, yc), cw, Math.max(2, Math.abs(yc - yo)));
        ctx.globalAlpha = 1;
      }

      // glowing close line
      ctx.shadowColor = lineCol; ctx.shadowBlur = 16;
      ctx.strokeStyle = "rgba(180,240,255,0.95)"; ctx.lineWidth = view < 16 ? 3.4 : 2.2;
      ctx.beginPath();
      for (let i = firstIdx; i < N; i++) { const x = X(i), y = Y(candles[i].c); i === firstIdx ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // last price marker
      const lx = X(N - 1), ly = Y(lastC);
      ctx.fillStyle = lineCol;
      ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(76,240,154,0.18)";
      ctx.beginPath(); ctx.arc(lx, ly, 12, 0, Math.PI * 2); ctx.fill();
    }

    let viewCount = N;            // current candles shown in hero chart
    function renderAll() {
      drawChart(bgCanvas, viewCount);
      if (phoneCanvas) drawChart(phoneCanvas, N);
      updateTickerDOM();
    }

    /* ---- live streaming ticks ---- */
    function tick() {
      const prev = candles[candles.length - 1].c;
      const drift = SYM.base * 0.0004;
      const o = prev;
      const c = Math.max(1, o + (Math.random() - 0.48) * SYM.vol + drift);
      const h = Math.max(o, c) + Math.random() * SYM.vol * 0.55;
      const l = Math.min(o, c) - Math.random() * SYM.vol * 0.55;
      candles.push({ o, h, l, c });
      candles.shift();
      renderAll();
    }

    /* ---- cinematic camera (JS-driven) — only the phone shrink uses transform ---- */
    const cam = document.getElementById("heroCam");
    const REST  = { scale: 1,    txp: 0, typ: 0, opacity: 1 };
    const PHONE = { scale: 0.34, txp: 0, typ: 0, opacity: 0 };
    let cur = Object.assign({}, REST);
    let target = Object.assign({}, REST);
    let osc = 0;                 // vertical bob (px) during intro
    let state = "intro";

    function applyCam() {
      cam.style.transform =
        `scale(${cur.scale.toFixed(4)}) translate(${cur.txp.toFixed(3)}%, calc(${cur.typ.toFixed(3)}% + ${osc.toFixed(1)}px))`;
      cam.style.opacity = cur.opacity.toFixed(3);
    }

    function setState(next) {
      if (state === next) return;
      state = next;
      masthead.classList.remove("state-intro", "state-full", "state-phone", "state-awards");
      masthead.classList.add("state-" + next);
      const collapsed = next === "phone" || next === "awards";
      target = Object.assign({}, collapsed ? PHONE : REST);
    }

    function camLoop() {
      const k = 0.09;
      cur.scale += (target.scale - cur.scale) * k;
      cur.txp += (target.txp - cur.txp) * k;
      cur.typ += (target.typ - cur.typ) * k;
      cur.opacity += (target.opacity - cur.opacity) * k;
      applyCam();
      requestAnimationFrame(camLoop);
    }

    /* ---- intro: close-up on last few candles, bob with volatility 1.5s, then zoom out ---- */
    const INTRO_VIEW = 6;
    function runIntro() {
      viewCount = INTRO_VIEW;
      renderAll();
      const bobDur = 1500;
      const start = performance.now();
      const amp = 22;
      function bob(now) {
        const t = Math.min(1, (now - start) / bobDur);
        osc = Math.sin(t * Math.PI * 3) * amp * (1 - t);   // follow volatility, ease out
        if (t < 1) { requestAnimationFrame(bob); }
        else { osc = 0; zoomOut(); }
      }
      requestAnimationFrame(bob);
    }
    function zoomOut() {
      const dur = 1000;
      const start = performance.now();
      const from = INTRO_VIEW, to = N;
      function frame(now) {
        const t = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);                  // easeOutCubic
        viewCount = from + (to - from) * e;
        renderAll();
        if (t < 1) requestAnimationFrame(frame);
        else { viewCount = N; renderAll(); setState("full"); introDone = true; }
      }
      requestAnimationFrame(frame);
    }

    /* ---- scroll-driven full -> phone -> awards ---- */
    let introDone = false;
    window.addEventListener("scroll", () => {
      if (!introDone) return;
      const vh = window.innerHeight || 800;
      const y = window.scrollY;
      if (y > vh * 0.95) setState("awards");
      else if (y > vh * 0.3) setState("phone");
      else setState("full");
    }, { passive: true });

    /* ---- capture / reduced-motion overrides ---- */
    const forced = (location.search.match(/state=(intro|full|phone|awards)/) || [])[1];

    function boot() {
      applyCam();
      camLoop();
      setInterval(tick, 850);

      if (forced) {
        introDone = true;
        viewCount = forced === "intro" ? INTRO_VIEW : N;
        const rest = (forced === "phone" || forced === "awards") ? PHONE : REST;
        cur = Object.assign({}, rest);
        target = Object.assign({}, rest);
        applyCam();
        masthead.classList.remove("state-intro", "state-full", "state-phone", "state-awards");
        masthead.classList.add("state-" + forced);
        state = forced;
        renderAll();
        return;
      }
      if (reduceMotion) {
        viewCount = N; renderAll();
        masthead.classList.remove("state-intro");
        masthead.classList.add("state-full");
        state = "full"; introDone = true;
        return;
      }
      runIntro();
    }

    window.addEventListener("resize", renderAll);
    boot();
  }

  /* ---------- Pricing billing toggle ---------- */
  const toggle = document.querySelector(".billing-toggle");
  if (toggle) {
    const options = toggle.querySelectorAll(".bt-option");
    const pill = toggle.querySelector(".bt-pill");

    const movePill = (btn) => {
      pill.style.width = btn.offsetWidth + "px";
      pill.style.transform = `translateX(${btn.offsetLeft - 5}px)`;
    };

    const applyPeriod = (period) => {
      document.querySelectorAll(".plan-price .amount, .plan-price .period").forEach((el) => {
        const val = el.getAttribute("data-" + period);
        if (val !== null) el.textContent = val;
      });
    };

    const setActive = (btn) => {
      options.forEach((o) => o.classList.remove("active"));
      btn.classList.add("active");
      movePill(btn);
      applyPeriod(btn.dataset.period);
    };

    options.forEach((btn) => btn.addEventListener("click", () => setActive(btn)));

    // init on active button (Annually)
    const active = toggle.querySelector(".bt-option.active") || options[0];
    requestAnimationFrame(() => movePill(active));
    window.addEventListener("resize", () => {
      const cur = toggle.querySelector(".bt-option.active");
      if (cur) movePill(cur);
    });
  }

  /* ---------- News carousel arrows ---------- */
  const track = document.getElementById("newsTrack");
  const prev = document.getElementById("newsPrev");
  const next = document.getElementById("newsNext");
  if (track && prev && next) {
    const step = () => {
      const card = track.querySelector(".news-card");
      return card ? card.offsetWidth + 24 : 360;
    };
    next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  }

  /* ---------- Sticky Account-Opening glass bar ---------- */
  const bar = document.getElementById("accountBar");
  if (bar) {
    const masthead = document.getElementById("top");
    const modular = document.getElementById("accountModular");
    const onScrollBar = () => {
      const past = masthead ? masthead.offsetHeight * 0.6 : 500;
      let isSnapped = false;
      
      if (modular) {
        // If modular is in view or user scrolled past its top
        const modRect = modular.getBoundingClientRect();
        // Snap when the fixed bar would hit the top of the container
        // Or simply when the modular enters the viewport. Let's snap when the modular top is less than viewport height
        // To make it look like it snaps into place, we snap when the container's top reaches the bottom of the viewport
        // Actually, we want it to be absolute at the top of the container. 
        // When we scroll, it moves up. 
        
        // The fixed bar is at bottom: 26px. Let's say its height is around 64px.
        // It occupies window.innerHeight - 90 to window.innerHeight - 26.
        // If we snap when modRect.top reaches the bar's position:
        if (modRect.top <= window.innerHeight - 26 - bar.offsetHeight) {

          isSnapped = true;
        }
      }
      
      if (isSnapped) {
        bar.classList.add("show");
        bar.classList.add("snapped");
      } else {
        bar.classList.remove("snapped");
        const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 80;
        bar.classList.toggle("show", window.scrollY > past && !nearBottom);
      }
    };
    window.addEventListener("scroll", onScrollBar, { passive: true });
    onScrollBar();
  }

  /* ---------- Mobile nav toggle (simple) ---------- */
  const navToggle = document.getElementById("navToggle");
  const nav = document.querySelector(".main-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.style.display === "flex";
      nav.style.display = open ? "" : "flex";
      nav.style.position = "absolute";
      nav.style.flexDirection = "column";
      nav.style.top = "100%";
      nav.style.right = "28px";
      nav.style.background = "rgba(7,14,40,.97)";
      nav.style.padding = open ? "" : "20px 26px";
      nav.style.borderRadius = "16px";
      nav.style.gap = "18px";
    });
  }
})();
