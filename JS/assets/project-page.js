(() => {
 const key=document.body.dataset.project;
 const data=window.JOHN_SWAHN_SITE_DATA||{projects:[],releases:[]};
 const tracks=Array.isArray(window.JOHN_SWAHN_TRACKS)?window.JOHN_SWAHN_TRACKS:[];
 const p=data.projects.find(x=>x.slug===key); if(!p)return;
 const names=new Set([p.title,...(p.aliases||[])]);
 const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
 const hero=document.querySelector('.page-hero');
 if(hero){
   const kicker=hero.querySelector('.eyebrow'); if(kicker) kicker.textContent=p.kicker||'Project archive';
   const h1=hero.querySelector('h1'); if(h1) h1.textContent=p.title;
   const desc=hero.querySelector('.page-hero-grid > div > p'); if(desc) desc.textContent=p.description||'';
   const row=hero.querySelector('.page-kicker-row');
   if(row){row.innerHTML=[...(p.meta||[]),`${p.releaseCount||0} ${p.releaseCount===1?'release':'releases'}`,].map(x=>`<span>${esc(x)}</span>`).join('');}
 }
 const audioUrl=src=>/^https?:\/\//i.test(String(src||''))?String(src):`../${src}`;
 const audioSources=t=>(t.audioCandidates?.length?t.audioCandidates:[t.audio]).filter(Boolean).map(audioUrl);
 const releases=data.releases.filter(r=>names.has(r.project)||names.has(r.projectRaw));
 const songs=tracks.filter(t=>names.has(t.project)||names.has(t.artist));
 const rl=document.getElementById('projectReleaseList');
 if(rl){
   rl.innerHTML=releases.length?releases.map(r=>`<div class="release-item"><span class="release-item-year">${esc(r.year)}</span><div class="release-item-title"><strong>${esc(r.title)}</strong><span>${esc(r.type)}</span></div><span class="release-item-project">${esc(p.title)}</span><span class="release-item-type">${esc(r.type)}</span></div>`).join(''):'<div class="empty-panel">No release entry has been added for this project yet.</div>';
 }
 const sl=document.getElementById('projectSongList');
 if(sl){
   sl.innerHTML=songs.length?songs.slice(0,100).map(t=>{
     const play=t.audio?`<button class="project-track-play track-play" type="button" aria-label="Play ${esc(t.title)}" aria-pressed="false" data-audio-src="${esc(audioUrl(t.audio))}" data-audio-sources="${esc(JSON.stringify(audioSources(t)))}" data-audio-title="${esc(t.title)}" data-audio-project="${esc(t.artist||t.project)}" data-audio-release="${esc(t.release)}">▶</button>`:'';
     return `<div class="project-song-row"><div class="project-song-main">${play}<div><strong>${esc(t.title)}</strong><span>${esc([t.genre||t.releaseType,t.audio?'Audio available':''].filter(Boolean).join(' · '))}</span></div></div><span class="release">${esc(t.release)}</span><span class="year">${esc(t.year)}</span><span class="time">${esc(t.duration)}</span></div>`;
   }).join(''):'<div class="empty-panel">Individual song entries have not been indexed for this project yet.</div>';
   const sc=document.getElementById('projectSongCount');if(sc){const playable=songs.filter(t=>t.audio).length;sc.textContent=`${songs.length} indexed ${songs.length===1?'track':'tracks'}${playable?` · ${playable} playable`:''}`;}
 }
})();
