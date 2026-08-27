const albumTracks = window.DESECRATE_TRACKS || [];
const demo1988Tracks = window.DESECRATE_DEMO_1988 || [];
const arrangerTracks = window.DESECRATE_ARRANGER_1989 || [];
const lonelyTracks = window.DESECRATE_LONELY_1989 || [];
const liveTracks = window.DESECRATE_LIVE_TRACKS || [];

const audio = document.getElementById("audio");
audio.preload = "metadata";

const sticky = document.getElementById("stickyPlayer");
const stickyTitle = document.getElementById("stickyTitle");
const stickySource = document.getElementById("stickySource");
const stickyPlay = document.getElementById("stickyPlay");
const stickyPrev = document.getElementById("stickyPrev");
const stickyNext = document.getElementById("stickyNext");
const liveLocationNote = document.getElementById("liveLocationNote");

const collections = {
  album: {
    label: "SECOND DEATH · 2026",
    tracks: albumTracks,
    list: document.getElementById("trackList"),
    title: document.getElementById("nowTitle"),
    play: document.getElementById("playBtn"),
    prev: document.getElementById("prevBtn"),
    next: document.getElementById("nextBtn"),
    progress: document.getElementById("progress"),
    current: document.getElementById("currentTime"),
    total: document.getElementById("totalTime"),
    rowClass: "track-row"
  },
  demo1988: {
    label: "WE ONLY MAKE JOKES · 1988",
    tracks: demo1988Tracks,
    list: document.getElementById("demoTrackList"),
    title: document.getElementById("demoNowTitle"),
    note: document.getElementById("demoNowNote"),
    play: document.getElementById("demoPlayBtn"),
    prev: document.getElementById("demoPrevBtn"),
    next: document.getElementById("demoNextBtn"),
    progress: document.getElementById("demoProgress"),
    current: document.getElementById("demoCurrentTime"),
    total: document.getElementById("demoTotalTime"),
    rowClass: "demo-track-row"
  },
  arranger: {
    label: "ARRANGER OF DISORDER · 1989",
    tracks: arrangerTracks,
    list: document.getElementById("arrangerTrackList"),
    title: document.getElementById("arrangerNowTitle"),
    play: document.getElementById("arrangerPlayBtn"),
    prev: document.getElementById("arrangerPrevBtn"),
    next: document.getElementById("arrangerNextBtn"),
    progress: document.getElementById("arrangerProgress"),
    current: document.getElementById("arrangerCurrentTime"),
    total: document.getElementById("arrangerTotalTime"),
    rowClass: "demo-track-row"
  },
  lonely: {
    label: "LONELY DISGRACE · 1989",
    tracks: lonelyTracks,
    list: document.getElementById("lonelyTrackList"),
    title: document.getElementById("lonelyNowTitle"),
    play: document.getElementById("lonelyPlayBtn"),
    prev: document.getElementById("lonelyPrevBtn"),
    next: document.getElementById("lonelyNextBtn"),
    progress: document.getElementById("lonelyProgress"),
    current: document.getElementById("lonelyCurrentTime"),
    total: document.getElementById("lonelyTotalTime"),
    rowClass: "demo-track-row"
  },
  live: {
    label: "LIVE ARCHIVE · 1989",
    tracks: liveTracks,
    list: document.getElementById("liveTrackList"),
    title: document.getElementById("liveNowTitle"),
    play: document.getElementById("livePlayBtn"),
    prev: document.getElementById("livePrevBtn"),
    next: document.getElementById("liveNextBtn"),
    progress: document.getElementById("liveProgress"),
    current: document.getElementById("liveCurrentTime"),
    total: document.getElementById("liveTotalTime"),
    rowClass: "live-track-row"
  }
};

let activeCollection = "album";
let activeIndex = 0;

function fmt(seconds){
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

function getCollection(key = activeCollection){
  return collections[key];
}

function renderCollection(key){
  const c = getCollection(key);
  if (!c || !c.list) return;

  c.list.innerHTML = c.tracks.map((t, i) => {
    const isActive = key === activeCollection && i === activeIndex;
    const note = key === "demo1988" && t.note ? `<small>${t.note}</small>` : "";
    return `<div class="${c.rowClass} ${isActive ? "active" : ""}" data-collection="${key}" data-i="${i}">
      <span>${String(t.n).padStart(2, "0")}</span>
      <div><b>${t.title}</b>${note}</div>
      <em>${t.duration}</em>
    </div>`;
  }).join("");

  c.list.querySelectorAll("[data-i]").forEach(row => {
    row.addEventListener("click", () => {
      playTrack(row.dataset.collection, Number(row.dataset.i), true);
    });
  });
}

function renderAll(){
  Object.keys(collections).forEach(renderCollection);
}

function updateSectionUI(){
  Object.entries(collections).forEach(([key, c]) => {
    if (!c.play) return;
    const isActive = key === activeCollection;
    c.play.textContent = isActive && !audio.paused ? "Ⅱ" : "▶";
  });

  const c = getCollection();
  const track = c?.tracks?.[activeIndex];
  if (!c || !track) return;

  if (c.title) c.title.textContent = track.title;
  if (c.note) c.note.textContent = track.note || "Original demo recording";
  if (c.total) c.total.textContent = track.duration;
  if (stickyTitle) stickyTitle.textContent = track.title;
  if (stickySource) stickySource.textContent = c.label;
  if (stickyPlay) stickyPlay.textContent = audio.paused ? "▶" : "Ⅱ";
  if (activeCollection === "live" && liveLocationNote) {
    const liveTrack = collections.live.tracks[activeIndex];
    const parts = [liveTrack?.location, liveTrack?.date].filter(Boolean);
    liveLocationNote.textContent = parts.join(" · ");
  }
}

function playTrack(collectionKey, index, autoplay = false){
  const c = getCollection(collectionKey);
  if (!c || !c.tracks.length) return;

  activeCollection = collectionKey;
  activeIndex = Math.max(0, Math.min(index, c.tracks.length - 1));
  const track = c.tracks[activeIndex];

  const desired = new URL(track.src, document.baseURI).href;
  if (audio.src !== desired) {
    audio.src = track.src;
    audio.load();
  }

  if (c.current) c.current.textContent = "0:00";
  if (c.progress) c.progress.value = 0;

  renderAll();
  updateSectionUI();

  if (autoplay) {
    const promise = audio.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(err => console.warn("Audio playback blocked:", err));
    }
    if (sticky) sticky.classList.add("visible");
  }
}

function toggleCollection(key){
  const c = getCollection(key);
  if (!c || !c.tracks.length) return;

  if (activeCollection !== key) {
    playTrack(key, 0, true);
    return;
  }

  if (!audio.src) {
    playTrack(key, activeIndex, true);
    return;
  }

  if (audio.paused) {
    audio.play().catch(err => console.warn("Audio playback blocked:", err));
    if (sticky) sticky.classList.add("visible");
  } else {
    audio.pause();
  }
}

function previous(){
  const c = getCollection();
  if (!c || !c.tracks.length) return;
  playTrack(activeCollection, (activeIndex - 1 + c.tracks.length) % c.tracks.length, true);
}

function next(){
  const c = getCollection();
  if (!c || !c.tracks.length) return;
  playTrack(activeCollection, (activeIndex + 1) % c.tracks.length, true);
}

Object.entries(collections).forEach(([key, c]) => {
  if (c.play) c.play.addEventListener("click", () => toggleCollection(key));
  if (c.prev) c.prev.addEventListener("click", () => {
    if (activeCollection !== key) playTrack(key, 0, true);
    else previous();
  });
  if (c.next) c.next.addEventListener("click", () => {
    if (activeCollection !== key) playTrack(key, 0, true);
    else next();
  });
  if (c.progress) c.progress.addEventListener("input", () => {
    if (activeCollection === key && audio.duration) {
      audio.currentTime = Number(c.progress.value) / 100 * audio.duration;
    }
  });
});

if (stickyPlay) stickyPlay.addEventListener("click", () => toggleCollection(activeCollection));
if (stickyPrev) stickyPrev.addEventListener("click", previous);
if (stickyNext) stickyNext.addEventListener("click", next);

const volume = document.getElementById("volume");
if (volume) {
  audio.volume = Number(volume.value);
  volume.addEventListener("input", () => audio.volume = Number(volume.value));
}

audio.addEventListener("play", () => {
  if (sticky) sticky.classList.add("visible");
  updateSectionUI();
});

audio.addEventListener("pause", updateSectionUI);
audio.addEventListener("ended", next);

audio.addEventListener("timeupdate", () => {
  const c = getCollection();
  if (!c || !audio.duration) return;
  if (c.progress) c.progress.value = audio.currentTime / audio.duration * 100;
  if (c.current) c.current.textContent = fmt(audio.currentTime);
});

audio.addEventListener("loadedmetadata", () => {
  const c = getCollection();
  if (!c) return;
  if (c.total && Number.isFinite(audio.duration)) c.total.textContent = fmt(audio.duration);
});

const playAlbumBtn = document.getElementById("playAlbumBtn");
if (playAlbumBtn) {
  playAlbumBtn.addEventListener("click", () => {
    playTrack("album", 0, true);
    const music = document.getElementById("music");
    if (music) music.scrollIntoView({behavior:"smooth"});
  });
}

// Archive lightbox
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lightboxImage");
document.querySelectorAll(".archive-open").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!lightbox || !lbImg) return;
    lbImg.src = btn.dataset.full;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});
function closeLightbox(){
  if (!lightbox || !lbImg) return;
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lbImg.src = "";
}
const closeLb = document.getElementById("closeLightbox");
if (closeLb) closeLb.addEventListener("click", closeLightbox);
if (lightbox) lightbox.addEventListener("click", e => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeLightbox();
});

// Mobile menu
(() => {
  const btn = document.getElementById("mobileMenuBtn");
  const nav = document.getElementById("mainNav");
  if (!btn || !nav) return;

  function setOpen(open){
    btn.classList.toggle("open", open);
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menu-open", open);
  }

  btn.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) setOpen(false);
  });
})();

// Initial state
renderAll();
if (albumTracks.length) playTrack("album", 0, false);
else if (demo1988Tracks.length) playTrack("demo1988", 0, false);
