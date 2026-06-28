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
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Masthead parallax ---------- */
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  const euro = document.querySelector(".masthead .euro-symbol");
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-parallax"));
        el.style.transform = `translateY(${y * speed}px)`;
      });
      if (euro) euro.style.transform = `translate(-50%, calc(-52% + ${y * 0.06}px))`;
    },
    { passive: true }
  );

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
    const onScrollBar = () => {
      const past = masthead ? masthead.offsetHeight * 0.6 : 500;
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 80;
      bar.classList.toggle("show", window.scrollY > past && !nearBottom);
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
