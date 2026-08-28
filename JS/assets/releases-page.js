(() => {
 const data=window.JOHN_SWAHN_SITE_DATA||{releases:[],projects:[]};
 const tracks=Array.isArray(window.JOHN_SWAHN_TRACKS)?window.JOHN_SWAHN_TRACKS:[];
 const list=document.getElementById('releaseList'), input=document.getElementById('releaseSearchInput'), project=document.getElementById('releaseProjectFilter'), era=document.getElementById('releaseEraFilter'), count=document.getElementById('releaseCount'); if(!list)return;
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘`]/g,"'").replace(/[^a-z0-9'&]+/g,' ').trim();
 const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
 const audioUrl=src=>/^https?:\/\//i.test(String(src||''))?String(src):`../${src}`;
 const audioSources=t=>(t.audioCandidates?.length?t.audioCandidates:[t.audio]).filter(Boolean).map(audioUrl);
 data.projects.map(p=>p.title).sort().forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p;project.appendChild(o);});
 const params=new URLSearchParams(location.search);input.value=params.get('q')||''; if(params.get('project')) project.value=params.get('project');
 const purl=name=>{const p=data.projects.find(x=>x.title===name||(x.aliases||[]).includes(name));return p?`../${p.url}`:'#';};
 function render(){const q=norm(input.value);const a=data.releases.filter(r=>(!q||norm(`${r.title} ${r.project} ${r.year} ${r.type}`).includes(q))&&(project.value==='all'||r.project===project.value)&&(era.value==='all'||r.era===era.value));list.innerHTML=a.map(r=>`<div class="release-item"><span class="release-item-year">${esc(r.year)}</span><div class="release-item-title"><strong>${esc(r.title)}</strong><span>${esc(r.type)}</span></div><a class="release-item-project" href="${purl(r.project)}">${esc(r.project)}</a><span class="release-item-type">${esc(r.type)}</span></div>`).join('');count.textContent=`${a.length} releases`;}
 [input,project,era].forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',render));render();

 // Enhance preserved NFO track lists with playback when matching audio has been supplied.
 document.querySelectorAll('.nfo-project-group').forEach(group=>{
   const projectName=group.querySelector('.nfo-group-head h3')?.textContent?.trim()||'';
   group.querySelectorAll('.nfo-card').forEach(card=>{
     const releaseName=card.querySelector('.nfo-summary-main strong')?.textContent?.trim()||'';
     card.querySelectorAll('.nfo-tracklist li').forEach(li=>{
       const title=li.querySelector('.nfo-track-title')?.textContent?.trim()||'';
       const track=tracks.find(t=>t.audio && norm(t.title)===norm(title) && norm(t.release)===norm(releaseName) && (norm(t.project)===norm(projectName)||norm(t.artist)===norm(projectName)));
       if(!track)return;
       li.classList.add('has-audio');
       const btn=document.createElement('button');
       btn.type='button';btn.className='nfo-track-play track-play';btn.textContent='▶';btn.setAttribute('aria-label',`Play ${track.title}`);btn.setAttribute('aria-pressed','false');
       btn.dataset.audioSrc=audioUrl(track.audio);btn.dataset.audioSources=JSON.stringify(audioSources(track));btn.dataset.audioTitle=track.title;btn.dataset.audioProject=track.artist||track.project;btn.dataset.audioRelease=track.release;
       li.appendChild(btn);
     });
   });
 });
})();
