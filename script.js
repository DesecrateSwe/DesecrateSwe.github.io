const tracks=window.DESECRATE_TRACKS;
const audio=document.getElementById("audio");
const list=document.getElementById("trackList");
const nowTitle=document.getElementById("nowTitle");
const stickyTitle=document.getElementById("stickyTitle");
const playBtn=document.getElementById("playBtn");
const prevBtn=document.getElementById("prevBtn");
const nextBtn=document.getElementById("nextBtn");
const stickyPlay=document.getElementById("stickyPlay");
const stickyPrev=document.getElementById("stickyPrev");
const stickyNext=document.getElementById("stickyNext");
const sticky=document.getElementById("stickyPlayer");
const progress=document.getElementById("progress");
const volume=document.getElementById("volume");
const currentTime=document.getElementById("currentTime");
const totalTime=document.getElementById("totalTime");
let current=0;

function render(){
  list.innerHTML=tracks.map((t,i)=>`<div class="track-row ${i===current?"active":""}" data-i="${i}">
    <span>${String(t.n).padStart(2,"0")}</span><b>${t.title}</b><em>${t.duration}</em>
  </div>`).join("");
  list.querySelectorAll(".track-row").forEach(r=>r.addEventListener("click",()=>load(Number(r.dataset.i),true)));
}
function load(i,autoplay=false){
  current=i; const t=tracks[i];
  audio.src=t.src; nowTitle.textContent=t.title; stickyTitle.textContent=t.title;
  totalTime.textContent=t.duration; currentTime.textContent="0:00"; progress.value=0; render();
  if(autoplay){audio.play();sticky.classList.add("visible");}
}
function toggle(){ if(!audio.src) load(current,false); if(audio.paused){audio.play();sticky.classList.add("visible")}else audio.pause(); }
function prev(){load((current-1+tracks.length)%tracks.length,true)}
function next(){load((current+1)%tracks.length,true)}
function state(){const s=audio.paused?"▶":"Ⅱ";playBtn.textContent=s;stickyPlay.textContent=s}
function fmt(s){if(!Number.isFinite(s))return"0:00";return`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`}

playBtn.onclick=toggle; stickyPlay.onclick=toggle; prevBtn.onclick=prev; stickyPrev.onclick=prev; nextBtn.onclick=next; stickyNext.onclick=next;
document.getElementById("playAlbumBtn").onclick=()=>{load(0,true);document.getElementById("music").scrollIntoView({behavior:"smooth"})};
audio.addEventListener("play",state);audio.addEventListener("pause",state);audio.addEventListener("ended",next);
audio.addEventListener("timeupdate",()=>{if(!audio.duration)return;progress.value=audio.currentTime/audio.duration*100;currentTime.textContent=fmt(audio.currentTime)});
progress.addEventListener("input",()=>{if(audio.duration)audio.currentTime=progress.value/100*audio.duration});
volume.addEventListener("input",()=>audio.volume=Number(volume.value));audio.volume=Number(volume.value);

const lightbox=document.getElementById("lightbox"), lbImg=document.getElementById("lightboxImage");
document.querySelectorAll(".archive-open").forEach(b=>b.addEventListener("click",()=>{lbImg.src=b.dataset.full;lightbox.classList.add("open");lightbox.setAttribute("aria-hidden","false")}));
function closeLb(){lightbox.classList.remove("open");lightbox.setAttribute("aria-hidden","true");lbImg.src=""}
document.getElementById("closeLightbox").onclick=closeLb;lightbox.addEventListener("click",e=>{if(e.target===lightbox)closeLb()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeLb()});
render();load(0,false);


// v11: archival live-demo player
(() => {
  const tracks = window.DESECRATE_LIVE_TRACKS || [];
  if (!tracks.length) return;

  const liveAudio = new Audio();
  liveAudio.preload = "metadata";

  const list = document.getElementById("liveTrackList");
  const title = document.getElementById("liveNowTitle");
  const play = document.getElementById("livePlayBtn");
  const prev = document.getElementById("livePrevBtn");
  const next = document.getElementById("liveNextBtn");
  const progress = document.getElementById("liveProgress");
  const currentTime = document.getElementById("liveCurrentTime");
  const totalTime = document.getElementById("liveTotalTime");
  let index = 0;

  function format(s){
    if(!Number.isFinite(s)) return "0:00";
    return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;
  }

  function render(){
    list.innerHTML = tracks.map((t,i)=>`
      <div class="live-track-row ${i===index?"active":""}" data-i="${i}">
        <span>${String(t.n).padStart(2,"0")}</span>
        <b>${t.title}</b>
        <em>${t.duration}</em>
      </div>`).join("");
    list.querySelectorAll(".live-track-row").forEach(row=>{
      row.addEventListener("click",()=>load(Number(row.dataset.i), true));
    });
  }

  function load(i, autoplay=false){
    index=i;
    const t=tracks[i];
    liveAudio.src=t.src;
    title.textContent=t.title;
    totalTime.textContent=t.duration;
    currentTime.textContent="0:00";
    progress.value=0;
    render();
    if(autoplay) liveAudio.play();
  }

  function toggle(){
    if(!liveAudio.src) load(index,false);
    liveAudio.paused ? liveAudio.play() : liveAudio.pause();
  }
  function previous(){ load((index-1+tracks.length)%tracks.length,true); }
  function following(){ load((index+1)%tracks.length,true); }

  play.addEventListener("click",toggle);
  prev.addEventListener("click",previous);
  next.addEventListener("click",following);
  liveAudio.addEventListener("play",()=>play.textContent="Ⅱ");
  liveAudio.addEventListener("pause",()=>play.textContent="▶");
  liveAudio.addEventListener("ended",following);
  liveAudio.addEventListener("timeupdate",()=>{
    if(!liveAudio.duration) return;
    progress.value=liveAudio.currentTime/liveAudio.duration*100;
    currentTime.textContent=format(liveAudio.currentTime);
  });
  progress.addEventListener("input",()=>{
    if(liveAudio.duration) liveAudio.currentTime=progress.value/100*liveAudio.duration;
  });

  render();
  load(0,false);
})();


// v13: 1988 demo player
(() => {
  const tracks = window.DESECRATE_DEMO_1988 || [];
  if (!tracks.length) return;

  const audio = new Audio();
  audio.preload = "metadata";

  const list = document.getElementById("demoTrackList");
  const title = document.getElementById("demoNowTitle");
  const note = document.getElementById("demoNowNote");
  const play = document.getElementById("demoPlayBtn");
  const prev = document.getElementById("demoPrevBtn");
  const next = document.getElementById("demoNextBtn");
  const progress = document.getElementById("demoProgress");
  const currentTime = document.getElementById("demoCurrentTime");
  const totalTime = document.getElementById("demoTotalTime");
  let index = 0;

  function fmt(s){
    if(!Number.isFinite(s)) return "0:00";
    return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;
  }

  function render(){
    list.innerHTML = tracks.map((t,i)=>`
      <div class="demo-track-row ${i===index ? "active" : ""}" data-i="${i}">
        <span>${String(t.n).padStart(2,"0")}</span>
        <div>
          <b>${t.title}</b>
          ${t.note ? `<small>${t.note}</small>` : ""}
        </div>
        <em>${t.duration}</em>
      </div>`).join("");

    list.querySelectorAll(".demo-track-row").forEach(row=>{
      row.addEventListener("click",()=>load(Number(row.dataset.i),true));
    });
  }

  function load(i, autoplay=false){
    index=i;
    const t=tracks[i];
    audio.src=t.src;
    title.textContent=t.title;
    note.textContent=t.note || "Original demo recording";
    totalTime.textContent=t.duration;
    currentTime.textContent="0:00";
    progress.value=0;
    render();
    if(autoplay) audio.play();
  }

  function toggle(){
    if(!audio.src) load(index,false);
    audio.paused ? audio.play() : audio.pause();
  }
  function previous(){load((index-1+tracks.length)%tracks.length,true)}
  function following(){load((index+1)%tracks.length,true)}

  play.addEventListener("click",toggle);
  prev.addEventListener("click",previous);
  next.addEventListener("click",following);
  audio.addEventListener("play",()=>play.textContent="Ⅱ");
  audio.addEventListener("pause",()=>play.textContent="▶");
  audio.addEventListener("ended",following);
  audio.addEventListener("timeupdate",()=>{
    if(!audio.duration) return;
    progress.value=audio.currentTime/audio.duration*100;
    currentTime.textContent=fmt(audio.currentTime);
  });
  progress.addEventListener("input",()=>{
    if(audio.duration) audio.currentTime=progress.value/100*audio.duration;
  });

  render();
  load(0,false);
})();


// v14: Arranger of Disorder (1989) demo player
(() => {
  const tracks = window.DESECRATE_ARRANGER_1989 || [];
  if (!tracks.length) return;
  const audio = new Audio();
  audio.preload = "metadata";
  const list = document.getElementById("arrangerTrackList");
  const title = document.getElementById("arrangerNowTitle");
  const play = document.getElementById("arrangerPlayBtn");
  const prev = document.getElementById("arrangerPrevBtn");
  const next = document.getElementById("arrangerNextBtn");
  const progress = document.getElementById("arrangerProgress");
  const current = document.getElementById("arrangerCurrentTime");
  const total = document.getElementById("arrangerTotalTime");
  let index = 0;

  const fmt = s => Number.isFinite(s) ? `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}` : "0:00";

  function render(){
    list.innerHTML = tracks.map((t,i)=>`
      <div class="demo-track-row ${i===index ? "active" : ""}" data-i="${i}">
        <span>${String(t.n).padStart(2,"0")}</span>
        <div><b>${t.title}</b></div>
        <em>${t.duration}</em>
      </div>`).join("");
    list.querySelectorAll(".demo-track-row").forEach(row =>
      row.addEventListener("click", () => load(Number(row.dataset.i), true))
    );
  }
  function load(i, autoplay=false){
    index=i;
    const t=tracks[i];
    audio.src=t.src;
    title.textContent=t.title;
    total.textContent=t.duration;
    current.textContent="0:00";
    progress.value=0;
    render();
    if(autoplay) audio.play();
  }
  play.addEventListener("click",()=> audio.paused ? audio.play() : audio.pause());
  prev.addEventListener("click",()=>load((index-1+tracks.length)%tracks.length,true));
  next.addEventListener("click",()=>load((index+1)%tracks.length,true));
  audio.addEventListener("play",()=>play.textContent="Ⅱ");
  audio.addEventListener("pause",()=>play.textContent="▶");
  audio.addEventListener("ended",()=>load((index+1)%tracks.length,true));
  audio.addEventListener("timeupdate",()=>{
    if(!audio.duration) return;
    progress.value=audio.currentTime/audio.duration*100;
    current.textContent=fmt(audio.currentTime);
  });
  progress.addEventListener("input",()=>{
    if(audio.duration) audio.currentTime=progress.value/100*audio.duration;
  });
  render();
  load(0,false);
})();


// v15: Lonely Disgrace (1989) demo player
(() => {
  const tracks=window.DESECRATE_LONELY_1989||[];
  if(!tracks.length)return;
  const audio=new Audio(); audio.preload="metadata";
  const list=document.getElementById("lonelyTrackList");
  const title=document.getElementById("lonelyNowTitle");
  const play=document.getElementById("lonelyPlayBtn");
  const prev=document.getElementById("lonelyPrevBtn");
  const next=document.getElementById("lonelyNextBtn");
  const progress=document.getElementById("lonelyProgress");
  const current=document.getElementById("lonelyCurrentTime");
  const total=document.getElementById("lonelyTotalTime");
  let index=0;
  const fmt=s=>Number.isFinite(s)?`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`:"0:00";
  function render(){
    list.innerHTML=tracks.map((t,i)=>`
      <div class="demo-track-row ${i===index?"active":""}" data-i="${i}">
        <span>${String(t.n).padStart(2,"0")}</span><div><b>${t.title}</b></div><em>${t.duration}</em>
      </div>`).join("");
    list.querySelectorAll(".demo-track-row").forEach(r=>r.addEventListener("click",()=>load(Number(r.dataset.i),true)));
  }
  function load(i,autoplay=false){
    index=i; const t=tracks[i]; audio.src=t.src; title.textContent=t.title;
    total.textContent=t.duration; current.textContent="0:00"; progress.value=0; render();
    if(autoplay)audio.play();
  }
  play.addEventListener("click",()=>audio.paused?audio.play():audio.pause());
  prev.addEventListener("click",()=>load((index-1+tracks.length)%tracks.length,true));
  next.addEventListener("click",()=>load((index+1)%tracks.length,true));
  audio.addEventListener("play",()=>play.textContent="Ⅱ");
  audio.addEventListener("pause",()=>play.textContent="▶");
  audio.addEventListener("ended",()=>load((index+1)%tracks.length,true));
  audio.addEventListener("timeupdate",()=>{if(!audio.duration)return;progress.value=audio.currentTime/audio.duration*100;current.textContent=fmt(audio.currentTime);});
  progress.addEventListener("input",()=>{if(audio.duration)audio.currentTime=progress.value/100*audio.duration;});
  render(); load(0,false);
})();


// v23: mobile sticky menu
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

  btn.addEventListener("click", () => {
    setOpen(!nav.classList.contains("open"));
  });

  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => setOpen(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) setOpen(false);
  });
})();
