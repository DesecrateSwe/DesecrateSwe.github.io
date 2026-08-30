(() => {
  /*
   * Persistent site shell + audio player.
   *
   * Internal HTML navigation is fetched and swapped into <main> instead of
   * replacing the whole document. The header and audio dock therefore stay
   * alive while the URL, title and page content change.
   */

  const body = document.body;
  const siteScript = document.currentScript;
  const SITE_ROOT = siteScript?.src
    ? new URL("../", siteScript.src)
    : new URL("./", location.href);

  const header = document.getElementById("siteHeader");
  const menu = document.getElementById("menuButton");
  const nav = document.getElementById("navLinks");

  const music = window.JOHN_SWAHN_MUSIC || {bands: [], releases: []};
  const tracks = Array.isArray(window.JOHN_SWAHN_TRACKS) ? window.JOHN_SWAHN_TRACKS : [];

  const norm = v => String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const esc = v => String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const siteUrl = p => new URL(p, SITE_ROOT).href;
  const relUrl = r => siteUrl(r.url);
  const bandUrl = b => siteUrl(`bands/${b.slug}.html`);

  /* Header --------------------------------------------------------------- */

  const updateHeaderScroll = () => header?.classList.toggle("scrolled", scrollY > 16);
  updateHeaderScroll();
  addEventListener("scroll", updateHeaderScroll, {passive: true});

  menu?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    menu.textContent = open ? "×" : "☰";
    menu.setAttribute("aria-expanded", open ? "true" : "false");
  });

  function closeMenu() {
    nav?.classList.remove("open");
    if (menu) {
      menu.textContent = "☰";
      menu.setAttribute("aria-expanded", "false");
    }
  }

  function updateActiveNav() {
    const page = body.dataset.page || "home";
    document.querySelectorAll("[data-nav]").forEach(a => {
      a.classList.toggle("current", a.dataset.nav === page);
    });
  }

  function syncHeaderLinks(targetDoc, targetUrl) {
    const targetHeader = targetDoc.querySelector("#siteHeader");
    if (!targetHeader || !header) return;

    const targetBrand = targetHeader.querySelector(".brand");
    const brand = header.querySelector(".brand");
    if (brand && targetBrand) {
      brand.href = new URL(targetBrand.getAttribute("href"), targetUrl).href;
    }

    header.querySelectorAll("[data-nav]").forEach(a => {
      const match = targetHeader.querySelector(`[data-nav="${a.dataset.nav}"]`);
      if (match) a.href = new URL(match.getAttribute("href"), targetUrl).href;
    });
  }

  updateActiveNav();

  /* Lightbox ------------------------------------------------------------- */

  const lb = document.getElementById("mediaLightbox");
  const im = document.getElementById("lightboxImage");
  const cap = document.getElementById("lightboxCaption");

  const closeLightbox = () => {
    lb?.classList.remove("open");
    lb?.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
  };

  document.addEventListener("click", e => {
    const t = e.target.closest?.("[data-lightbox]");
    if (t && lb) {
      e.preventDefault();
      if (im) {
        im.src = t.dataset.lightbox;
        im.alt = t.dataset.caption || "";
      }
      if (cap) cap.textContent = t.dataset.caption || "";
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      body.style.overflow = "hidden";
    }
    if (e.target.id === "lightboxClose" || e.target === lb) closeLightbox();
  });

  addEventListener("keydown", e => {
    if (e.key === "Escape") closeLightbox();
  });

  /* Global search -------------------------------------------------------- */

  function initGlobalSearch(scope = document) {
    scope.querySelectorAll?.("[data-global-search]").forEach(block => {
      if (block.dataset.searchReady === "1") return;
      block.dataset.searchReady = "1";

      const input = block.querySelector("[data-global-search-input]");
      const results = block.querySelector("[data-global-search-results]");
      if (!input || !results) return;

      const render = () => {
        const q = norm(input.value).trim();
        if (!q) {
          results.hidden = true;
          return;
        }

        const hit = s => norm(s).includes(q);
        const bs = music.bands
          .filter(b => hit(`${b.name} ${b.genre} ${b.summary}`))
          .slice(0, 4);
        const rs = music.releases
          .filter(r => hit(`${r.title} ${r.project} ${r.year}`))
          .slice(0, 5);
        const ts = tracks
          .filter(t => hit(`${t.title} ${t.project} ${t.release}`))
          .slice(0, 5);

        let html = "";
        if (bs.length) {
          html += '<small class="search-group">Band</small>' +
            bs.map(b => `<a href="${bandUrl(b)}"><strong>${esc(b.name)}</strong><span>${esc(b.genre || "")}</span></a>`).join("");
        }
        if (rs.length) {
          html += '<small class="search-group">Skivor</small>' +
            rs.map(r => `<a href="${relUrl(r)}"><strong>${esc(r.title)}</strong><span>${esc(r.project)} · ${esc(r.year)}</span></a>`).join("");
        }
        if (ts.length) {
          html += '<small class="search-group">Låtar</small>' +
            ts.map(t => `<a href="${siteUrl(`songs/index.html?q=${encodeURIComponent(t.title)}`)}"><strong>${esc(t.title)}</strong><span>${esc(t.project)} · ${esc(t.release)}</span></a>`).join("");
        }

        results.innerHTML = html || '<div class="no-result">Ingen träff.</div>';
        results.hidden = false;
      };

      input.addEventListener("input", render);
    });
  }

  document.addEventListener("click", e => {
    document.querySelectorAll("[data-global-search]").forEach(block => {
      if (!block.contains(e.target)) {
        const results = block.querySelector("[data-global-search-results]");
        if (results) results.hidden = true;
      }
    });
  });

  document.addEventListener("keydown", e => {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) {
      const input = document.querySelector("[data-global-search-input]");
      if (input) {
        e.preventDefault();
        input.focus();
      }
    }
  });

  initGlobalSearch();

  /* Persistent audio player -------------------------------------------- */

  let dock = document.getElementById("audioDock");
  if (!dock) {
    dock = document.createElement("div");
    dock.id = "audioDock";
    dock.className = "audio-dock";
    dock.hidden = true;
    dock.innerHTML = `
      <div>
        <small>Spelas nu</small>
        <strong id="audioDockTitle"></strong>
        <span id="audioDockMeta"></span>
      </div>
      <audio id="siteAudioPlayer" controls preload="metadata"></audio>
      <button id="audioDockClose" type="button" aria-label="Stäng spelaren">×</button>`;
    body.appendChild(dock);
  }

  const audio = dock.querySelector("#siteAudioPlayer");
  const audioTitle = dock.querySelector("#audioDockTitle");
  const audioMeta = dock.querySelector("#audioDockMeta");

  let sources = [];
  let sourceIndex = 0;
  let activeSource = "";
  let queue = [];
  let queueIndex = -1;

  function absoluteAudioUrl(src) {
    if (!src) return "";
    try {
      return new URL(src, location.href).href;
    } catch {
      return src;
    }
  }

  function getSources(button) {
    let list = [];
    try {
      list = JSON.parse(button.dataset.audioSources || "[]");
    } catch {}
    if (!list.length && button.dataset.audioSrc) list = [button.dataset.audioSrc];
    return list.filter(Boolean).map(absoluteAudioUrl);
  }

  function buttonItem(button) {
    return {
      sources: getSources(button),
      title: button.dataset.audioTitle || "",
      project: button.dataset.audioProject || "",
      release: button.dataset.audioRelease || ""
    };
  }

  const playableButtons = () =>
    [...document.querySelectorAll(".track-play")].filter(b => getSources(b).length);

  function captureQueue(clicked) {
    const buttons = playableButtons();
    queue = buttons.map(buttonItem);
    queueIndex = buttons.indexOf(clicked);
    if (queueIndex < 0) {
      queue = [buttonItem(clicked)];
      queueIndex = 0;
    }
  }

  function syncPlayButtons() {
    document.querySelectorAll(".track-play").forEach(b => {
      const isCurrent = getSources(b).includes(activeSource);
      b.classList.toggle("is-playing", isCurrent && !audio.paused);
      b.setAttribute("aria-pressed", isCurrent && !audio.paused ? "true" : "false");
    });
  }

  function playItem(item, autoplay = true) {
    if (!item?.sources?.length) return;

    sources = item.sources.map(absoluteAudioUrl);
    sourceIndex = 0;
    activeSource = sources[0];

    audio.src = activeSource;
    if (audioTitle) audioTitle.textContent = item.title || "";
    if (audioMeta) audioMeta.textContent = [item.project, item.release].filter(Boolean).join(" · ");
    dock.hidden = false;

    if (autoplay) audio.play().catch(() => {});
    syncPlayButtons();
  }

  function playQueueIndex(index) {
    if (index < 0 || index >= queue.length) return;
    queueIndex = index;
    playItem(queue[index], true);
  }

  document.addEventListener("click", e => {
    const button = e.target.closest?.(".track-play");
    if (!button) return;

    e.preventDefault();

    const clickedSources = getSources(button);
    const sameTrack = clickedSources.includes(activeSource);

    if (sameTrack && !audio.paused) {
      audio.pause();
      return;
    }

    if (sameTrack && audio.paused && audio.src) {
      dock.hidden = false;
      audio.play().catch(() => {});
      return;
    }

    captureQueue(button);
    playQueueIndex(queueIndex);
  });

  function playNext() {
    if (queueIndex >= 0 && queueIndex < queue.length - 1) {
      playQueueIndex(queueIndex + 1);
    }
  }

  audio.addEventListener("play", syncPlayButtons);
  audio.addEventListener("pause", syncPlayButtons);
  audio.addEventListener("ended", playNext);

  audio.addEventListener("error", () => {
    if (sourceIndex < sources.length - 1) {
      activeSource = sources[++sourceIndex];
      audio.src = activeSource;
      audio.play().catch(() => {});
    } else {
      syncPlayButtons();
    }
  });

  dock.querySelector("#audioDockClose")?.addEventListener("click", () => {
    audio.pause();
    dock.hidden = true;
  });

  /* Small page-level helpers ------------------------------------------- */

  function initPageBasics(scope = document) {
    scope.querySelectorAll?.(".reveal").forEach(x => x.classList.add("visible"));
    initGlobalSearch(scope);

    const homeBandCount = document.getElementById("homeBandCount");
    if (homeBandCount) homeBandCount.textContent = music.bands.length;

    const homeReleaseCount = document.getElementById("homeReleaseCount");
    if (homeReleaseCount) homeReleaseCount.textContent = music.releases.length;

    const homeTrackCount = document.getElementById("homeTrackCount");
    if (homeTrackCount) homeTrackCount.textContent = tracks.length;

    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    updateActiveNav();
    syncPlayButtons();
  }

  initPageBasics();

  /* SPA-like internal navigation --------------------------------------- */

  let navigationToken = 0;

  function isInternalHtmlRoute(url) {
    if (!/^https?:$/.test(url.protocol)) return false;
    if (url.origin !== SITE_ROOT.origin) return false;
    if (!url.pathname.startsWith(SITE_ROOT.pathname)) return false;

    const last = url.pathname.split("/").pop() || "";
    return url.pathname.endsWith("/") ||
      !last.includes(".") ||
      last.toLowerCase().endsWith(".html");
  }

  function syncBodyDataset(targetBody) {
    for (const key of Object.keys(body.dataset)) delete body.dataset[key];
    for (const [key, value] of Object.entries(targetBody.dataset)) body.dataset[key] = value;
    body.className = targetBody.className || "";
  }

  function syncDocumentMeta(targetDoc) {
    document.title = targetDoc.title || document.title;
    const current = document.querySelector('meta[name="description"]');
    const target = targetDoc.querySelector('meta[name="description"]');
    if (current && target) current.setAttribute("content", target.getAttribute("content") || "");
  }

  async function ensureTargetStyles(targetDoc, targetUrl) {
    const targetStyles = [...targetDoc.querySelectorAll('link[rel="stylesheet"][href]')]
      .map(link => new URL(link.getAttribute("href"), targetUrl).href);

    const existing = new Set(
      [...document.querySelectorAll('link[rel="stylesheet"][href]')].map(link => link.href)
    );

    await Promise.all(targetStyles.filter(href => !existing.has(href)).map(href => new Promise(resolve => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.spaStyle = "1";
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    })));
  }

  async function runTargetScripts(targetDoc, targetUrl) {
    const scripts = [...targetDoc.querySelectorAll("script")];

    for (const s of scripts) {
      const srcAttr = s.getAttribute("src");

      if (srcAttr) {
        const src = new URL(srcAttr, targetUrl).href;
        const path = new URL(src).pathname.toLowerCase();

        // These globals and the persistent shell are already alive.
        if (
          path.endsWith("/assets/site.js") ||
          path.endsWith("/assets/data/catalog.js") ||
          path.endsWith("/assets/data/music-data.js")
        ) continue;

        await new Promise(resolve => {
          const script = document.createElement("script");
          script.src = src;
          script.async = false;
          script.dataset.spaRouteScript = "1";
          script.onload = () => {
            script.remove();
            resolve();
          };
          script.onerror = () => {
            script.remove();
            resolve();
          };
          document.body.appendChild(script);
        });
      } else {
        const code = s.textContent?.trim();
        if (!code) continue;
        try {
          // Current release pages use this to set document.body.dataset.release.
          Function(code)();
        } catch (err) {
          console.warn("Kunde inte köra sidans inline-script:", err);
        }
      }
    }
  }

  async function navigate(urlLike, {push = true, scroll = true} = {}) {
    const targetUrl = urlLike instanceof URL ? urlLike : new URL(urlLike, location.href);
    const token = ++navigationToken;

    try {
      closeLightbox();
      closeMenu();

      const response = await fetch(targetUrl.href, {
        credentials: "same-origin",
        headers: {"X-John-Swahn-Navigation": "1"}
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      if (token !== navigationToken) return;

      const targetDoc = new DOMParser().parseFromString(html, "text/html");
      const targetMain = targetDoc.querySelector("main");
      const currentMain = document.querySelector("main");
      if (!targetMain || !currentMain) throw new Error("Sidan saknar main-element.");

      await ensureTargetStyles(targetDoc, targetUrl);
      if (token !== navigationToken) return;

      if (push) history.pushState({johnSpa: true}, "", targetUrl.href);

      syncBodyDataset(targetDoc.body);
      syncDocumentMeta(targetDoc);
      syncHeaderLinks(targetDoc, targetUrl);

      const importedMain = document.importNode(targetMain, true);
      currentMain.replaceWith(importedMain);

      const currentFooter = document.querySelector("footer");
      const targetFooter = targetDoc.querySelector("footer");
      if (currentFooter && targetFooter) {
        currentFooter.replaceWith(document.importNode(targetFooter, true));
      }

      await runTargetScripts(targetDoc, targetUrl);
      if (token !== navigationToken) return;

      initPageBasics(document);

      if (scroll) {
        if (targetUrl.hash) {
          requestAnimationFrame(() => document.querySelector(targetUrl.hash)?.scrollIntoView());
        } else {
          scrollTo({top: 0, behavior: "instant"});
        }
      }
    } catch (err) {
      console.warn("Intern sidnavigering misslyckades, laddar normalt:", err);
      location.href = targetUrl.href;
    }
  }

  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target.closest?.("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;

    const raw = a.getAttribute("href");
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;

    let url;
    try {
      url = new URL(a.href, location.href);
    } catch {
      return;
    }

    if (!isInternalHtmlRoute(url)) return;

    const sameDocument =
      url.pathname === location.pathname &&
      url.search === location.search;

    // Let normal anchor jumps work on the current document.
    if (sameDocument && url.hash) return;

    e.preventDefault();
    navigate(url, {push: true, scroll: true});
  });

  addEventListener("popstate", () => {
    const url = new URL(location.href);
    if (isInternalHtmlRoute(url)) navigate(url, {push: false, scroll: true});
  });

  // Expose only for debugging/local testing.
  window.__JOHN_SWAHN_NAVIGATE = navigate;
})();
