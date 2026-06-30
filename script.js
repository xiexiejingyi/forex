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
     MARKETS CLASSIFICATION — class cards cycle on scroll,
     the body copy + stat below swap to match the active card
     ============================================================ */
  (function marketsCycle() {
    const scroller = document.getElementById("credScroll");
    const markets = document.getElementById("markets");
    if (!scroller || !markets) return;
    const cards = Array.from(markets.querySelectorAll(".market-card"));
    const bodyEl = document.getElementById("credBody");
    const statEl = document.getElementById("credStat");
    let current = cards.findIndex((c) => c.classList.contains("active"));
    if (current < 0) current = 0;
    let swapT = null;

    function setActive(idx) {
      if (idx === current) return;
      current = idx;
      cards.forEach((c, i) => c.classList.toggle("active", i === idx));
      const card = cards[idx];
      const desc = card.getAttribute("data-desc") || "";
      const stat = card.getAttribute("data-stat") || "";
      if (bodyEl) bodyEl.classList.add("swap");
      if (statEl) statEl.classList.add("swap");
      clearTimeout(swapT);
      swapT = setTimeout(() => {
        if (bodyEl) { bodyEl.textContent = desc; bodyEl.classList.remove("swap"); }
        if (statEl) { statEl.textContent = stat; statEl.classList.remove("swap"); }
      }, 180);
    }

    function onScroll() {
      const total = scroller.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-scroller.getBoundingClientRect().top, 0), total);
      const p = total > 0 ? scrolled / total : 0;
      let idx = Math.floor(p * cards.length);
      if (idx >= cards.length) idx = cards.length - 1;
      if (idx < 0) idx = 0;
      setActive(idx);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  })();

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
    const elPill = document.getElementById("tkPill");
    const elCaret = elPill ? elPill.querySelector(".hh-caret") : null;
    const elTime = document.getElementById("tkTime");
    const elSym = document.getElementById("tkSymbol");
    const symLabels = Array.from(document.querySelectorAll(".hgc-sym"));
    if (elSym) elSym.textContent = symKey;
    symLabels.forEach((s) => (s.textContent = symKey));

    const fmt = (n) => "$" + n.toFixed(2);

    function fmtClock() {
      const d = new Date();
      const mon = d.toLocaleString("en-US", { month: "short" });
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, "0");
      const ap = h >= 12 ? "pm" : "am";
      h = h % 12 || 12;
      return `${d.getDate()} ${mon}, ${h}:${m}${ap} GMT-4`;
    }

    function updateTickerDOM() {
      const last = candles[candles.length - 1].c;
      const chg = last - open0;
      const pct = (chg / open0) * 100;
      const up = chg >= 0;
      const sign = up ? "+" : "−";
      const abs = Math.abs(chg).toFixed(2);
      const pctTxt = Math.abs(pct).toFixed(2);
      if (elPrice) elPrice.textContent = fmt(last);
      if (elChange) elChange.textContent = `${sign}${abs} (${pctTxt}%)`;
      if (elPill) elPill.className = "hh-pill " + (up ? "up" : "down");
      if (elCaret) elCaret.textContent = up ? "▲" : "▼";
      if (elTime) elTime.textContent = fmtClock();
    }

    /* ---- chart renderer (view = how many candles from the right are shown) ---- */
    function drawChart(canvas, view, topFrac) {
      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // keep the plot in the lower band so hero text sits cleanly above it
      const topPx = h * Math.max(0, Math.min(0.7, topFrac || 0));
      const plotH = h - topPx;

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
      const Y = (p) => h - ((p - min) / (max - min)) * plotH;

      // grid (confined to the plot band)
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      for (let g = 0; g <= 4; g++) {
        const yy = topPx + (plotH / 4) * g;
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
        const val = max - ((max - min) / 4) * g;
        ctx.fillText(val.toFixed(1), w - 42, yy + 14);
      }

      const lastC = candles[N - 1].c;
      const up = lastC >= open0;
      const lineCol = up ? "#4cf09a" : "#ff7d8d";

      // area under close line
      const grad = ctx.createLinearGradient(0, topPx, 0, h);
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

    const gridCanvases = Array.from(document.querySelectorAll(".hgc-canvas"));
    let viewCount = N;            // current candles shown in hero chart
    // lower-band top for the zoomed-out hero chart — pushed down more on narrow screens
    const bgTopTarget = () => (window.innerWidth <= 768 ? 0.54 : 0.42);
    let bgTopFrac = 0;            // 0 during the immersive close-up intro
    function renderAll() {
      drawChart(bgCanvas, viewCount, bgTopFrac);
      gridCanvases.forEach((c) => drawChart(c, N, 0));
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
    const hgCardsEl = document.getElementById("hgCards");
    const REST = { scale: 1,    txp: 0, typ: 0, opacity: 1 };
    const GRID = { scale: 0.32, txp: 0, typ: 6, opacity: 0 };

    // shrink the live chart onto the centre of the mini-chart row so it hands off
    // seamlessly to one of the carousel cards (transform-origin is 50% 62%)
    function computeGridTarget() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const card = hgCardsEl && hgCardsEl.querySelector(".hg-card");
      if (!card) return Object.assign({}, GRID);
      const cr = card.getBoundingClientRect();
      const row = hgCardsEl.getBoundingClientRect();
      const s = Math.max(0.12, cr.width / vw);
      const ox = vw * 0.5, oy = vh * 0.62;       // cam transform-origin
      const Tx = vw * 0.5;                        // land at horizontal centre
      const Ty = row.top + row.height / 2;        // vertical centre of the card row
      const tx = Tx - ox - s * (vw / 2 - ox);
      const ty = Ty - oy - s * (vh / 2 - oy);
      return { scale: s, txp: (tx / vw) * 100, typ: (ty / vh) * 100, opacity: 0 };
    }

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
      masthead.classList.remove("state-intro", "state-full", "state-grid");
      masthead.classList.add("state-" + next);
      target = Object.assign({}, next === "grid" ? computeGridTarget() : REST);
    }

    function camLoop() {
      const k = 0.09;
      cur.scale += (target.scale - cur.scale) * k;
      cur.txp += (target.txp - cur.txp) * k;
      cur.typ += (target.typ - cur.typ) * k;
      if (state === "grid") {
        // keep the shrinking chart fully visible until it nearly reaches card size,
        // then fade quickly so it hands off to the carousel card underneath
        const span = (1 - target.scale) || 1;
        const prog = Math.min(1, Math.max(0, (1 - cur.scale) / span));
        cur.opacity = prog < 0.62 ? 1 : Math.max(0, 1 - (prog - 0.62) / 0.38);
      } else {
        cur.opacity += (target.opacity - cur.opacity) * k;
      }
      applyCam();
      requestAnimationFrame(camLoop);
    }

    /* ---- intro: close-up on last few candles, bob with volatility 1.5s, then zoom out ---- */
    const INTRO_VIEW = 6;
    function runIntro() {
      viewCount = INTRO_VIEW;
      renderAll();
      const bobDur = 3500;
      const start = performance.now();
      const amp = 22;
      function bob(now) {
        const t = Math.min(1, (now - start) / bobDur);
        osc = Math.sin(t * Math.PI * 7) * amp * (1 - t);   // follow volatility, ease out
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
        bgTopFrac = bgTopTarget() * e;                      // settle the chart into the lower band
        renderAll();
        if (t < 1) requestAnimationFrame(frame);
        else { viewCount = N; bgTopFrac = bgTopTarget(); renderAll(); setState("full"); introDone = true; }
      }
      requestAnimationFrame(frame);
    }

    /* ---- scroll-driven full -> grid ---- */
    let introDone = false;
    window.addEventListener("scroll", () => {
      if (!introDone) return;
      const vh = window.innerHeight || 800;
      const y = window.scrollY;
      if (y > vh * 0.5) setState("grid");
      else setState("full");
    }, { passive: true });

    /* ---- capture / reduced-motion overrides ---- */
    const forced = (location.search.match(/state=(intro|full|grid)/) || [])[1];

    function boot() {
      applyCam();
      camLoop();
      setInterval(tick, 850);

      if (forced) {
        introDone = true;
        viewCount = forced === "intro" ? INTRO_VIEW : N;
        bgTopFrac = forced === "intro" ? 0 : bgTopTarget();
        const rest = forced === "grid" ? computeGridTarget() : REST;
        cur = Object.assign({}, rest);
        target = Object.assign({}, rest);
        applyCam();
        masthead.classList.remove("state-intro", "state-full", "state-grid");
        masthead.classList.add("state-" + forced);
        state = forced;
        renderAll();
        return;
      }
      if (reduceMotion) {
        viewCount = N; bgTopFrac = bgTopTarget(); renderAll();
        masthead.classList.remove("state-intro");
        masthead.classList.add("state-full");
        state = "full"; introDone = true;
        return;
      }
      runIntro();
    }

    window.addEventListener("resize", () => {
      if (introDone && state !== "intro") bgTopFrac = bgTopTarget();
      if (state === "grid") target = computeGridTarget();
      renderAll();
    });
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

  /* ---------- News: continuously side-scrolling article rail ---------- */
  const track = document.getElementById("newsTrack");
  const marquee = document.getElementById("newsMarquee");
  const prev = document.getElementById("newsPrev");
  const next = document.getElementById("newsNext");
  if (marquee && !reduceMotion) {
    // duplicate the cards once so the -50% loop is perfectly seamless
    Array.from(marquee.children).forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      marquee.appendChild(clone);
    });
    // arrows flip the scroll direction instead of paging
    if (next) next.addEventListener("click", () => marquee.classList.remove("rev"));
    if (prev) prev.addEventListener("click", () => marquee.classList.add("rev"));
  } else if (track && prev && next) {
    // reduced-motion fallback: manual paging through the rail
    track.style.overflowX = "auto";
    const step = () => {
      const card = track.querySelector(".news-card");
      return card ? card.offsetWidth + 24 : 360;
    };
    next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  }

  /* ---------- About: floating stack reveals info on hover/focus ---------- */
  const stackInfo = document.getElementById("stackInfo");
  const layers = document.querySelectorAll(".about .layer");
  if (stackInfo && layers.length) {
    const siTitle = stackInfo.querySelector(".si-title");
    const siText = stackInfo.querySelector(".si-text");
    let hideT = null;
    const show = (layer) => {
      clearTimeout(hideT);
      layers.forEach((l) => l.classList.toggle("is-active", l === layer));
      const t = layer.querySelector(".layer-title");
      const i = layer.querySelector(".layer-info");
      if (siTitle && t) siTitle.textContent = t.textContent;
      if (siText && i) siText.textContent = i.textContent;
      stackInfo.classList.add("show");
    };
    const hide = () => {
      hideT = setTimeout(() => {
        layers.forEach((l) => l.classList.remove("is-active"));
        stackInfo.classList.remove("show");
      }, 120);
    };
    layers.forEach((layer) => {
      layer.addEventListener("mouseenter", () => show(layer));
      layer.addEventListener("mouseleave", hide);
      layer.addEventListener("focus", () => show(layer));
      layer.addEventListener("blur", hide);
    });
    // pre-fill (kept hidden until hover) for a11y + first paint
    const first = layers[0];
    const ft = first.querySelector(".layer-title");
    const fi = first.querySelector(".layer-info");
    if (siTitle && ft) siTitle.textContent = ft.textContent;
    if (siText && fi) siText.textContent = fi.textContent;
  }

  /* ---------- Sticky Account-Opening glass bar ---------- */
  const bar = document.getElementById("accountBar");
  if (bar) {
    const masthead = document.getElementById("top");
    const modular = document.getElementById("accountModular");
    const onScrollBar = () => {
      const past = masthead ? masthead.offsetHeight * 0.6 : 500;
      // hide the floating CTA once the account section (which has its own bold CTA) appears
      let atSection = false;
      if (modular) {
        const modRect = modular.getBoundingClientRect();
        if (modRect.top <= window.innerHeight * 0.85) atSection = true;
      }
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 80;
      bar.classList.remove("snapped");
      bar.classList.toggle("show", window.scrollY > past && !nearBottom && !atSection);
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
