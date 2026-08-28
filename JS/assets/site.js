
(() => {
  const body = document.body;
  const root = body.dataset.root || '.';
  const page = body.dataset.page || 'home';
  const header = document.getElementById('siteHeader');
  const menuButton = document.getElementById('menuButton');
  const navLinks = document.getElementById('navLinks');
  if (header) {
    const update = () => header.classList.toggle('scrolled', window.scrollY > 24);
    update(); window.addEventListener('scroll', update, {passive:true});
  }
  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.textContent = open ? '×' : '☰';
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); menuButton.textContent='☰';
    }));
  }
  document.querySelectorAll(`[data-nav="${page}"]`).forEach(a => a.classList.add('current'));

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);} }), {threshold:.1});
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  } else document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));

  const lb = document.getElementById('mediaLightbox');
  if (lb) {
    const img = document.getElementById('lightboxImage'); const cap = document.getElementById('lightboxCaption'); const close = document.getElementById('lightboxClose'); let last=null;
    const hide=()=>{lb.classList.remove('open');lb.setAttribute('aria-hidden','true');document.body.style.overflow='';if(img)img.src='';if(last)last.focus();};
    document.querySelectorAll('[data-lightbox]').forEach(item=>item.addEventListener('click',()=>{last=item;if(img){img.src=item.dataset.lightbox;img.alt=item.querySelector('img')?.alt||'Archive image';}if(cap)cap.textContent=item.dataset.caption||'';lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';close?.focus();}));
    close?.addEventListener('click',hide); lb.addEventListener('click',e=>{if(e.target===lb)hide();}); document.addEventListener('keydown',e=>{if(e.key==='Escape'&&lb.classList.contains('open'))hide();});
  }

  const norm = v => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘`]/g,"'").trim();
  const esc = v => String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const tracks = Array.isArray(window.JOHN_SWAHN_TRACKS) ? window.JOHN_SWAHN_TRACKS : [];
  const data = window.JOHN_SWAHN_SITE_DATA || {projects:[],releases:[]};
  const joinRoot = path => `${root}/${path}`.replace(/\/+/g,'/').replace(':/','://');
  const songUrl = track => `${joinRoot('songs/index.html')}?q=${encodeURIComponent(track.title)}#song-${encodeURIComponent(track.id)}`;
  const releaseUrl = rel => `${joinRoot('releases/index.html')}?q=${encodeURIComponent(rel.title)}`;

  document.querySelectorAll('[data-global-search]').forEach(block => {
    const input=block.querySelector('[data-global-search-input]'); const results=block.querySelector('[data-global-search-results]');
    if(!input||!results)return;
    const summary=block.querySelector('[data-search-summary]');
    if(summary) summary.textContent=`${tracks.length} songs · ${data.releases.length} releases · ${data.projects.length} projects`;
    const render = value => {
      const q=norm(value); if(!q){results.hidden=true;results.innerHTML='';return;}
      const tokens=q.split(/\s+/).filter(Boolean);
      const matches=(text)=>{const h=norm(text);return tokens.every(t=>h.includes(t));};
      const songs=tracks.filter(t=>matches([t.title,t.artist,t.project,t.release,t.year,t.genre,t.releaseType].join(' '))).slice(0,7);
      const rels=data.releases.filter(r=>matches([r.title,r.project,r.year,r.type].join(' '))).slice(0,5);
      const projs=data.projects.filter(p=>matches([p.title,p.kicker,p.description,(p.meta||[]).join(' ')].join(' '))).slice(0,4);
      let out='';
      if(songs.length){out+='<div class="global-search-heading">Songs</div>'+songs.map(t=>`<a class="global-search-item" href="${songUrl(t)}"><small>Song</small><div><strong>${esc(t.title)}</strong><span>${esc(t.artist||t.project)} · ${esc(t.release)}</span></div><span class="global-search-year">${esc(t.year)}</span></a>`).join('');}
      if(rels.length){out+='<div class="global-search-heading">Releases</div>'+rels.map(r=>`<a class="global-search-item" href="${releaseUrl(r)}"><small>Release</small><div><strong>${esc(r.title)}</strong><span>${esc(r.project)} · ${esc(r.type)}</span></div><span class="global-search-year">${esc(r.year)}</span></a>`).join('');}
      if(projs.length){out+='<div class="global-search-heading">Projects</div>'+projs.map(p=>`<a class="global-search-item" href="${joinRoot(p.url)}"><small>Project</small><div><strong>${esc(p.title)}</strong><span>${esc(p.kicker||'Project archive')}</span></div><span class="global-search-year">→</span></a>`).join('');}
      if(!out) out='<div class="search-no-results">No matches in the current archive.</div>';
      results.innerHTML=out; results.hidden=false;
    };
    input.addEventListener('input',e=>render(e.target.value));
    input.addEventListener('focus',()=>{if(input.value)render(input.value);});
    document.addEventListener('click',e=>{if(!block.contains(e.target))results.hidden=true;});
  });
  document.addEventListener('keydown',e=>{const t=e.target;const typing=t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement||t instanceof HTMLSelectElement||t?.isContentEditable;if(e.key==='/'&&!typing){const input=document.querySelector('[data-global-search-input]');if(input){e.preventDefault();input.focus();input.select();}}});

  // Shared audio dock used by song, project and release pages.
  let audioDock = document.getElementById('audioDock');
  if (!audioDock) {
    audioDock = document.createElement('div');
    audioDock.id = 'audioDock';
    audioDock.className = 'audio-dock';
    audioDock.hidden = true;
    audioDock.innerHTML = `<div class="audio-dock-meta"><small>Now playing</small><strong id="audioDockTitle"></strong><span id="audioDockMeta"></span></div><audio id="siteAudioPlayer" controls preload="metadata"></audio><button class="audio-dock-close" id="audioDockClose" type="button" aria-label="Close audio player">×</button>`;
    document.body.appendChild(audioDock);
  }
  const audio = audioDock.querySelector('#siteAudioPlayer');
  const audioTitle = audioDock.querySelector('#audioDockTitle');
  const audioMeta = audioDock.querySelector('#audioDockMeta');
  const audioClose = audioDock.querySelector('#audioDockClose');
  let activeAudioSrc = '';
  let activeAudioSources = [];
  let activeAudioIndex = 0;
  const getButtonSources = btn => {
    try {
      const parsed = JSON.parse(btn.dataset.audioSources || '[]');
      if (Array.isArray(parsed) && parsed.length) return parsed.filter(Boolean);
    } catch (_) {}
    return [btn.dataset.audioSrc || ''].filter(Boolean);
  };
  const syncPlayButtons = playing => {
    document.querySelectorAll('.track-play').forEach(btn => {
      const same = getButtonSources(btn).includes(activeAudioSrc);
      btn.classList.toggle('is-playing', Boolean(playing && same));
      const icon = btn.querySelector('.track-play-icon');
      if (icon) icon.textContent = same && playing ? '' : '▶';
      if (same) btn.setAttribute('aria-pressed', String(Boolean(playing)));
    });
  };
  const loadAudio = btn => {
    if (!audio) return;
    const sources = getButtonSources(btn);
    const src = sources[0] || '';
    if (!src) return;
    if (sources.includes(activeAudioSrc) && !audio.paused) {
      audio.pause();
      syncPlayButtons(false);
      return;
    }
    if (!sources.includes(activeAudioSrc)) {
      activeAudioSources = sources;
      activeAudioIndex = 0;
      activeAudioSrc = src;
      audio.src = src;
      if (audioTitle) audioTitle.textContent = btn.dataset.audioTitle || 'Untitled recording';
      if (audioMeta) audioMeta.textContent = [btn.dataset.audioProject, btn.dataset.audioRelease].filter(Boolean).join(' · ');
    }
    audioDock.hidden = false;
    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') promise.catch(() => {});
    syncPlayButtons(true);
  };
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('.track-play');
    if (btn) { e.preventDefault(); loadAudio(btn); }
  });
  audio?.addEventListener('play', () => syncPlayButtons(true));
  audio?.addEventListener('pause', () => syncPlayButtons(false));
  audio?.addEventListener('ended', () => syncPlayButtons(false));
  audio?.addEventListener('error', () => {
    if (!activeAudioSources.length || activeAudioIndex >= activeAudioSources.length - 1) { syncPlayButtons(false); return; }
    activeAudioIndex += 1;
    activeAudioSrc = activeAudioSources[activeAudioIndex];
    audio.src = activeAudioSrc;
    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') promise.catch(() => {});
    syncPlayButtons(true);
  });
  audioClose?.addEventListener('click', () => {
    audio?.pause();
    audioDock.hidden = true;
    syncPlayButtons(false);
  });

  const year=document.getElementById('year'); if(year)year.textContent=new Date().getFullYear();
})();
