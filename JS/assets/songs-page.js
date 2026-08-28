(() => {
  const tracks = Array.isArray(window.JOHN_SWAHN_TRACKS) ? window.JOHN_SWAHN_TRACKS : [];
  const art = window.JOHN_SWAHN_PROJECT_ART || {};
  const input=document.getElementById('songSearchInput'), project=document.getElementById('songProjectFilter'), era=document.getElementById('songEraFilter'), sort=document.getElementById('songSort'), list=document.getElementById('songCatalogList'), count=document.getElementById('songResultCount'), more=document.getElementById('songLoadMore'), shown=document.getElementById('songVisibleSummary'), empty=document.getElementById('songEmpty');
  if(!list)return;
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  [...new Set(tracks.map(t=>t.project).filter(Boolean))].sort().forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p;project.appendChild(o);});
  let limit=60;
  const decade=y=>{const n=parseInt(y,10);return Number.isFinite(n)?`${Math.floor(n/10)*10}s`:'';};
  const params=new URLSearchParams(location.search); input.value=params.get('q')||''; if(params.get('project'))project.value=params.get('project');
  const totalCount=document.getElementById('songTotalCount'); if(totalCount){totalCount.textContent=`${tracks.length} indexed track ${tracks.length===1?'appearance':'appearances'}`;} const audioCount=document.getElementById('songAudioCount'); if(audioCount){const n=tracks.filter(t=>t.audio).length;audioCount.textContent=`${n} playable audio ${n===1?'track':'tracks'}`;}
  function get(){const q=norm(input.value);let a=tracks.filter(t=>{const h=norm([t.title,t.artist,t.project,t.release,t.year,t.genre,t.releaseType,...(t.credits||[])].join(' '));return(!q||q.split(/\s+/).every(x=>h.includes(x)))&&(project.value==='all'||t.project===project.value)&&(era.value==='all'||decade(t.year)===era.value);});a.sort((a,b)=>sort.value==='year-desc'?+b.year-+a.year||a.title.localeCompare(b.title):sort.value==='title-asc'?a.title.localeCompare(b.title):sort.value==='project-asc'?a.project.localeCompare(b.project)||+a.year-+b.year:+a.year-+b.year||a.project.localeCompare(b.project)||a.title.localeCompare(b.title));return a;}
  function render(){
    const a=get(),v=a.slice(0,limit);
    list.innerHTML=v.map(t=>{
      const image=art[t.project]?`<img src="../${esc(art[t.project])}" alt="" loading="lazy">`:esc((t.project||'JS').slice(0,2).toUpperCase());
      const artNode=t.audio
        ? `<button class="song-project-art track-play" type="button" aria-label="Play ${esc(t.title)}" aria-pressed="false" data-audio-src="../${esc(t.audio)}" data-audio-title="${esc(t.title)}" data-audio-project="${esc(t.artist||t.project)}" data-audio-release="${esc(t.release)}">${image}<span class="track-play-icon" aria-hidden="true">▶</span></button>`
        : `<span class="song-project-art">${image}</span>`;
      const audioTag=t.audio?' · Audio':'';
      return `<div class="song-row" id="song-${esc(t.id)}" role="row"><div class="song-title-cell" role="cell">${artNode}<span class="song-title-text"><strong>${esc(t.title)}</strong><span>${esc([t.genre,t.releaseType,`Track ${t.trackNumber}`].filter(Boolean).join(' · '))}${audioTag}</span></span></div><span class="song-project-cell">${esc(t.artist||t.project)}</span><span class="song-release-cell">${esc(t.release)}</span><span class="song-year-cell">${esc(t.year)}</span><span class="song-time-cell">${esc(t.duration)}</span></div>`;
    }).join('');
    count.textContent=`${a.length} ${a.length===1?'recording':'recordings'}`;
    shown.textContent=a.length?`Showing ${Math.min(v.length,a.length)} of ${a.length}`:'';
    empty.hidden=a.length!==0;
    more.hidden=v.length>=a.length;
    requestAnimationFrame(()=>{if(location.hash.startsWith('#song-'))document.querySelector(location.hash)?.scrollIntoView({block:'center'});});
  }
  [input,project,era,sort].forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',()=>{limit=60;render();}));
  more.addEventListener('click',()=>{limit+=60;render();});
  render();
})();
