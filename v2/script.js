const collections = {
  album: {
    label: "SECOND DEATH · 2026",
    kicker: "2026 · ALBUM",
    title: "SECOND DEATH",
    text: "Thirteen songs from Desecrate's past, recorded again more than three decades later.",
    cover: "assets/images/second-death-front.jpg",
    tracks: [
      ["Second Death","assets/audio/01-second-death.mp3"],
      ["World Pollution","assets/audio/02-world-pollution.mp3"],
      ["Disorder","assets/audio/03-disorder.mp3"],
      ["Scooby Dooaaauöö","assets/audio/04-scooby-dooaaauoo.mp3"],
      ["Undivided Attention","assets/audio/05-undivided-attention.mp3"],
      ["Injustice of Society","assets/audio/06-injustice-of-society.mp3"],
      ["Lightened Souls","assets/audio/07-lightened-souls.mp3"],
      ["Possessor of Life","assets/audio/08-possessor-of-life.mp3"],
      ["Schedule","assets/audio/09-schedule.mp3"],
      ["F**k Trump","assets/audio/10-fk-trump.mp3"],
      ["Desecration","assets/audio/11-desecration.mp3"],
      ["Minds of Iustitia","assets/audio/12-minds-of-iustitia.mp3"],
      ["Bang Your Head","assets/audio/13-bang-your-head.mp3"]
    ]
  },
  demo1988: {
    label: "WE ONLY MAKE JOKES · 1988",
    kicker: "1988 · ORIGINAL DEMO",
    title: "WE ONLY MAKE JOKES... WE MADE YOU",
    text: "The first Desecrate demo, made on a Portastudio at Nyby Fritidsgård by Rickard Ceder, Jakob “Kobben” Bergström and John Swahn.",
    cover: "assets/images/demo-covers/we-only-make-jokes-cover.jpg",
    tracks: [
      ["Devils Fate","assets/audio/demo-1988/01-devils-fate.mp3"],
      ["Desecration","assets/audio/demo-1988/02-desecration.mp3"],
      ["Injustice of Society","assets/audio/demo-1988/03-injustice-of-society.mp3"],
      ["Scooby Dooaaauöö I","assets/audio/demo-1988/04-scooby-doo-i.mp3"],
      ["Bang Your Head to Death","assets/audio/demo-1988/05-bang-your-head-to-death.mp3"]
    ]
  },
  arranger: {
    label: "ARRANGER OF DISORDER · 1989",
    kicker: "MAY 1989 · ORIGINAL DEMO",
    title: "ARRANGER OF DISORDER",
    text: "Recorded at Musikhuset in Enköping on 27–28 May 1989, with Dave Janney on bass and Måns Magnusson on lead guitar.",
    cover: "assets/images/demo-covers/arranger-of-disorder-cover.jpg",
    tracks: [
      ["Disorder","assets/audio/arranger-of-disorder-1989/01-disorder.mp3"],
      ["Lightened Souls","assets/audio/arranger-of-disorder-1989/02-lightened-souls.mp3"],
      ["Minds of Justitia","assets/audio/arranger-of-disorder-1989/03-minds-of-justitia.mp3"]
    ]
  },
  lonely: {
    label: "LONELY DISGRACE · 1989",
    kicker: "DECEMBER 1989 · ORIGINAL DEMO",
    title: "LONELY DISGRACE",
    text: "The third Desecrate demo. Dave Janney had moved to guitar and Jens “Jenka” Åberg joined on bass.",
    cover: "assets/images/demo-covers/lonely-disgrace-cover.jpg",
    tracks: [
      ["World Pollution","assets/audio/lonely-disgrace-1989/01-world-pollution.mp3"],
      ["Undivided Etension","assets/audio/lonely-disgrace-1989/02-undivided-etension.mp3"],
      ["Blitzkrieg Bop","assets/audio/lonely-disgrace-1989/03-blietzkrieg-bop.mp3"],
      ["Schedule","assets/audio/lonely-disgrace-1989/04-scedule.mp3"],
      ["Fuck Bush","assets/audio/lonely-disgrace-1989/05-fuck-bush.mp3"]
    ]
  },
  live: {
    label: "LIVE ARCHIVE · 1988–1989",
    kicker: "THE LOST SECOND DEATH SESSION · LIVE",
    title: "SECOND DEATH · LIVE ARCHIVE",
    text: "The studio recording of Second Death and Possessor of Life was erased during the final mix. These live recordings preserve the songs.",
    cover: "assets/images/demo-covers/live-second-death-cover.jpg",
    tracks: [
      ["Second Death","assets/audio/live/01-second-death-live.mp3"],
      ["Angels Fuck","assets/audio/live/02-angels-fuck-live.mp3"],
      ["Scooby Dooaaauöö II","assets/audio/live/03-scooby-doo-ii-live.mp3"],
      ["Possessor of Life","assets/audio/live/04-possessor-of-life-live.mp3"],
      ["Scooby Dooaaauöö III","assets/audio/live/05-scooby-doo-iii-live.mp3"]
    ]
  }
};

const audio = document.getElementById("audio");
const heroCover = document.getElementById("heroCover");
const heroSource = document.getElementById("heroSource");
const heroTitle = document.getElementById("heroTitle");
const heroPlay = document.getElementById("heroPlay");
const heroPrev = document.getElementById("heroPrev");
const heroNext = document.getElementById("heroNext");
const heroCurrent = document.getElementById("heroCurrent");
const heroTotal = document.getElementById("heroTotal");
const heroProgress = document.getElementById("heroProgress");
const heroTrackList = document.getElementById("heroTrackList");
const fullTrackList = document.getElementById("fullTrackList");
const selectedKicker = document.getElementById("selectedKicker");
const selectedTitle = document.getElementById("selectedTitle");
const selectedText = document.getElementById("selectedText");
const sticky = document.getElementById("stickyPlayer");
const stickyCover = document.getElementById("stickyCover");
const stickyTitle = document.getElementById("stickyTitle");
const stickySource = document.getElementById("stickySource");
const stickyPlay = document.getElementById("stickyPlay");
const stickyPrev = document.getElementById("stickyPrev");
const stickyNext = document.getElementById("stickyNext");
const stickyProgress = document.getElementById("stickyProgress");

let activeCollection = "album";
let activeIndex = 0;

function fmt(sec){
  if (!Number.isFinite(sec)) return "0:00";
  return `${Math.floor(sec/60)}:${Math.floor(sec%60).toString().padStart(2,"0")}`;
}

function currentCollection(){ return collections[activeCollection]; }

function render(){
  const c = currentCollection();
  const [title] = c.tracks[activeIndex];

  heroCover.src = c.cover;
  heroSource.textContent = c.label;
  heroTitle.textContent = title;
  selectedKicker.textContent = c.kicker;
  selectedTitle.textContent = c.title;
  selectedText.textContent = c.text;
  stickyCover.src = c.cover;
  stickyTitle.textContent = title;
  stickySource.textContent = c.label;

  document.querySelectorAll(".release-card").forEach(btn => btn.classList.toggle("active", btn.dataset.collection === activeCollection));

  heroTrackList.innerHTML = c.tracks.slice(0,5).map((t,i)=>`
    <div class="mini-track ${i===activeIndex?"active":""}" data-i="${i}">
      <span>${String(i+1).padStart(2,"0")}</span><b>${t[0]}</b><em></em>
    </div>`).join("");

  fullTrackList.innerHTML = c.tracks.map((t,i)=>`
    <div class="full-track ${i===activeIndex?"active":""}" data-i="${i}">
      <span>${String(i+1).padStart(2,"0")}</span><b>${t[0]}</b><em></em>
    </div>`).join("");

  heroTrackList.querySelectorAll("[data-i]").forEach(el => el.onclick = () => play(activeCollection, Number(el.dataset.i), true));
  fullTrackList.querySelectorAll("[data-i]").forEach(el => el.onclick = () => play(activeCollection, Number(el.dataset.i), true));

  const icon = audio.paused ? "▶" : "Ⅱ";
  heroPlay.textContent = icon;
  stickyPlay.textContent = icon;
}

function play(collectionKey, index=0, autoplay=true){
  const c = collections[collectionKey];
  if (!c) return;

  activeCollection = collectionKey;
  activeIndex = Math.max(0, Math.min(index, c.tracks.length-1));
  const src = c.tracks[activeIndex][1];
  const desired = new URL(src, document.baseURI).href;

  if (audio.src !== desired){
    audio.pause();
    audio.src = src;
    audio.load();
    heroProgress.value = 0;
    stickyProgress.value = 0;
    heroCurrent.textContent = "0:00";
    heroTotal.textContent = "0:00";
  }

  render();

  if (autoplay){
    sticky.classList.add("visible");
    audio.play().catch(err => console.warn("Audio playback failed:", src, err));
  }
}

function toggle(){
  if (!audio.src){ play(activeCollection, activeIndex, true); return; }
  if (audio.paused){
    sticky.classList.add("visible");
    audio.play().catch(err => console.warn(err));
  } else {
    audio.pause();
  }
}
function prev(){ const c=currentCollection(); play(activeCollection,(activeIndex-1+c.tracks.length)%c.tracks.length,true); }
function next(){ const c=currentCollection(); play(activeCollection,(activeIndex+1)%c.tracks.length,true); }

heroPlay.onclick = toggle;
stickyPlay.onclick = toggle;
heroPrev.onclick = prev;
stickyPrev.onclick = prev;
heroNext.onclick = next;
stickyNext.onclick = next;

document.querySelectorAll("[data-play-collection]").forEach(b=>b.onclick=()=>play(b.dataset.playCollection,0,true));
document.querySelectorAll(".release-card").forEach(b=>b.onclick=()=>{
  play(b.dataset.collection,0,false);
  document.querySelector(".selected-recording").scrollIntoView({behavior:"smooth",block:"center"});
});

function seek(input){
  if (audio.duration) audio.currentTime = Number(input.value)/100*audio.duration;
}
heroProgress.oninput = ()=>seek(heroProgress);
stickyProgress.oninput = ()=>seek(stickyProgress);

audio.addEventListener("loadedmetadata",()=>heroTotal.textContent=fmt(audio.duration));
audio.addEventListener("timeupdate",()=>{
  if (!audio.duration) return;
  const pct = audio.currentTime/audio.duration*100;
  heroProgress.value=pct;
  stickyProgress.value=pct;
  heroCurrent.textContent=fmt(audio.currentTime);
});
audio.addEventListener("play",()=>{sticky.classList.add("visible");render()});
audio.addEventListener("pause",render);
audio.addEventListener("ended",next);

const menuBtn=document.getElementById("menuBtn");
const nav=document.getElementById("nav");
menuBtn.onclick=()=>{
  const open=!nav.classList.contains("open");
  nav.classList.toggle("open",open);
  menuBtn.setAttribute("aria-expanded",open?"true":"false");
};
nav.querySelectorAll("a").forEach(a=>a.onclick=()=>nav.classList.remove("open"));

const lightbox=document.getElementById("lightbox");
const lbImg=document.getElementById("lightboxImage");
document.querySelectorAll(".archive-item").forEach(btn=>btn.onclick=()=>{
  lbImg.src=btn.dataset.full;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden","false");
});
function closeLB(){ lightbox.classList.remove("open"); lightbox.setAttribute("aria-hidden","true"); lbImg.src=""; }
document.getElementById("lightboxClose").onclick=closeLB;
lightbox.onclick=e=>{if(e.target===lightbox)closeLB()};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeLB()});

render();
