(() => {
  const tracks = Array.isArray(window.JOHN_SWAHN_TRACKS) ? window.JOHN_SWAHN_TRACKS : [];
  const art = window.JOHN_SWAHN_PROJECT_ART || {};
  const music = window.JOHN_SWAHN_MUSIC || {bands:[], releases:[]};
  const input=document.getElementById('songSearchInput'), project=document.getElementById('songProjectFilter'), era=document.getElementById('songEraFilter'), sort=document.getElementById('songSort'), list=document.getElementById('songCatalogList'), count=document.getElementById('songResultCount'), more=document.getElementById('songLoadMore'), shown=document.getElementById('songVisibleSummary'), empty=document.getElementById('songEmpty');
  if(!list)return;

  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const keyNorm=v=>norm(v).replace(/[^a-z0-9]/g,'');
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const audioUrl=src=>/^https?:\/\//i.test(String(src||''))?String(src):`../${src}`;
  const audioSources=t=>(t.audioCandidates?.length?t.audioCandidates:[t.audio]).filter(Boolean).map(audioUrl);
  const collator=new Intl.Collator('sv',{sensitivity:'base',numeric:true});

  const bandAliases = new Map([
    [keyNorm("John Swahn's Big November"), 'Big November'],
    [keyNorm('John Swahns Big November'), 'Big November']
  ]);
  const bandByName = new Map((music.bands||[]).map(b=>[keyNorm(b.name),b]));
  const findBand = name => {
    const k=keyNorm(name);
    const direct=bandByName.get(k);
    if(direct)return direct;
    const alias=bandAliases.get(k);
    return alias?bandByName.get(keyNorm(alias)):null;
  };
  const releaseKey=(projectName,year,title)=>`${keyNorm(projectName)}|${String(year||'')}|${keyNorm(title)}`;
  const releaseByKey=new Map((music.releases||[]).map(r=>[releaseKey(r.project,r.year,r.title),r]));
  const findRelease=t=>{
    const b=findBand(t.project);
    const p=b?.name||t.project;
    return releaseByKey.get(releaseKey(p,t.year,t.release))||null;
  };

  [...new Set(tracks.map(t=>t.project).filter(Boolean))].sort((a,b)=>collator.compare(a,b)).forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p;project.appendChild(o);});

  let limit=60;
  let sortState={key:'year',dir:'asc'};
  const decade=y=>{const n=parseInt(y,10);return Number.isFinite(n)?`${Math.floor(n/10)*10}s`:'';};
  const durationSeconds=v=>{
    const parts=String(v||'').trim().split(':').map(Number);
    if(parts.some(n=>!Number.isFinite(n)))return null;
    if(parts.length===2)return parts[0]*60+parts[1];
    if(parts.length===3)return parts[0]*3600+parts[1]*60+parts[2];
    return null;
  };
  const params=new URLSearchParams(location.search);
  input.value=params.get('q')||'';
  if(params.get('project'))project.value=params.get('project');

  const totalCount=document.getElementById('songTotalCount');
  if(totalCount)totalCount.textContent=`${tracks.length} spår`;
  const heroCount=document.getElementById('songHeroCount');
  if(heroCount)heroCount.textContent=`${tracks.length} SPÅR.`;
  const audioCount=document.getElementById('songAudioCount');
  if(audioCount){const n=tracks.filter(t=>t.audio).length;audioCount.textContent=`${n} spelbara spår`;}

  function compareNullable(a,b,dir){
    const ae=a===null||a===undefined||a==='';
    const be=b===null||b===undefined||b==='';
    if(ae&&be)return 0;
    if(ae)return 1;
    if(be)return -1;
    const result=typeof a==='number'&&typeof b==='number' ? a-b : collator.compare(String(a),String(b));
    return dir==='desc'?-result:result;
  }

  function syncSortSelect(){
    const map={
      'year:asc':'year-asc','year:desc':'year-desc','title:asc':'title-asc',
      'project:asc':'project-asc','release:asc':'release-asc','duration:asc':'duration-asc'
    };
    const v=map[`${sortState.key}:${sortState.dir}`];
    if(v&&sort.querySelector(`option[value="${v}"]`))sort.value=v;
  }

  function updateSortHeaders(){
    document.querySelectorAll('[data-song-sort]').forEach(btn=>{
      const active=btn.dataset.songSort===sortState.key;
      btn.dataset.active=active?'true':'false';
      btn.dataset.direction=active?sortState.dir:'';
      btn.setAttribute('aria-pressed',active?'true':'false');
      btn.title=active ? `Sorterat ${sortState.dir==='asc'?'stigande':'fallande'} — klicka för att vända` : `Sortera efter ${btn.textContent.trim()}`;
    });
  }

  function get(){
    const q=norm(input.value);
    let a=tracks.filter(t=>{
      const h=norm([t.title,t.artist,t.project,t.release,t.year,t.genre,t.releaseType,...(t.credits||[])].join(' '));
      return(!q||q.split(/\s+/).every(x=>h.includes(x)))&&(project.value==='all'||t.project===project.value)&&(era.value==='all'||decade(t.year)===era.value);
    });

    a.sort((a,b)=>{
      let av,bv;
      switch(sortState.key){
        case 'title': av=a.title; bv=b.title; break;
        case 'project': av=a.artist||a.project; bv=b.artist||b.project; break;
        case 'release': av=a.release; bv=b.release; break;
        case 'duration': av=durationSeconds(a.duration); bv=durationSeconds(b.duration); break;
        case 'year': default: av=Number(a.year)||null; bv=Number(b.year)||null; break;
      }
      const primary=compareNullable(av,bv,sortState.dir);
      if(primary)return primary;
      return collator.compare(a.title||'',b.title||'');
    });
    return a;
  }

  function render(){
    const a=get(),v=a.slice(0,limit);
    list.innerHTML=v.map(t=>{
      const image=art[t.project]?`<img src="../${esc(art[t.project])}" alt="" loading="lazy">`:esc((t.project||'JS').slice(0,2).toUpperCase());
      const artNode=t.audio
        ? `<button class="song-project-art track-play" type="button" aria-label="Spela ${esc(t.title)}" aria-pressed="false" data-audio-src="${esc(audioUrl(t.audio))}" data-audio-sources="${esc(JSON.stringify(audioSources(t)))}" data-audio-title="${esc(t.title)}" data-audio-project="${esc(t.artist||t.project)}" data-audio-release="${esc(t.release)}">${image}<span class="track-play-icon" aria-hidden="true">▶</span></button>`
        : `<span class="song-project-art">${image}</span>`;
      const audioTag=t.audio?' · Spela':'';
      const b=findBand(t.project);
      const r=findRelease(t);
      const bandText=esc(t.artist||t.project);
      const releaseText=esc(t.release);
      const bandCell=b?`<a class="song-table-link" href="../bands/${esc(b.slug)}.html">${bandText}</a>`:bandText;
      const releaseCell=r?`<a class="song-table-link" href="../${esc(r.url)}">${releaseText}</a>`:releaseText;
      return `<div class="song-row" id="song-${esc(t.id)}" role="row"><div class="song-title-cell" role="cell">${artNode}<span class="song-title-text"><strong>${esc(t.title)}</strong><span>${esc([t.genre,`Spår ${t.trackNumber}`].filter(Boolean).join(' · '))}${audioTag}</span></span></div><span class="song-project-cell">${bandCell}</span><span class="song-release-cell">${releaseCell}</span><span class="song-year-cell">${esc(t.year)}</span><span class="song-time-cell">${esc(t.duration)}</span></div>`;
    }).join('');
    count.textContent=`${a.length} ${a.length===1?'inspelning':'inspelningar'}`;
    shown.textContent=a.length?`Visar ${Math.min(v.length,a.length)} av ${a.length}`:'';
    empty.hidden=a.length!==0;
    more.hidden=v.length>=a.length;
    updateSortHeaders();
    requestAnimationFrame(()=>{if(location.hash.startsWith('#song-'))document.querySelector(location.hash)?.scrollIntoView({block:'center'});});
  }

  input.addEventListener('input',()=>{limit=60;render();});
  project.addEventListener('change',()=>{limit=60;render();});
  era.addEventListener('change',()=>{limit=60;render();});
  sort.addEventListener('change',()=>{
    const [key,dir]=sort.value.split('-');
    sortState={key:key==='project'?'project':key,dir:dir||'asc'};
    limit=60;
    render();
  });
  document.querySelectorAll('[data-song-sort]').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.dataset.songSort;
    sortState=sortState.key===key?{key,dir:sortState.dir==='asc'?'desc':'asc'}:{key,dir:'asc'};
    syncSortSelect();
    limit=60;
    render();
  }));
  more.addEventListener('click',()=>{limit+=60;render();});

  syncSortSelect();
  render();
})();
