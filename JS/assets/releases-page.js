
(() => {
 const data=window.JOHN_SWAHN_SITE_DATA||{releases:[],projects:[]}; const list=document.getElementById('releaseList'), input=document.getElementById('releaseSearchInput'), project=document.getElementById('releaseProjectFilter'), era=document.getElementById('releaseEraFilter'), count=document.getElementById('releaseCount'); if(!list)return;
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
 data.projects.map(p=>p.title).sort().forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p;project.appendChild(o);}); const params=new URLSearchParams(location.search);input.value=params.get('q')||''; if(params.get('project')) project.value=params.get('project');
 const purl=name=>{const p=data.projects.find(x=>x.title===name||(x.aliases||[]).includes(name));return p?`../${p.url}`:'#';};
 function render(){const q=norm(input.value);const a=data.releases.filter(r=>(!q||norm(`${r.title} ${r.project} ${r.year} ${r.type}`).includes(q))&&(project.value==='all'||r.project===project.value)&&(era.value==='all'||r.era===era.value));list.innerHTML=a.map(r=>`<div class="release-item"><span class="release-item-year">${esc(r.year)}</span><div class="release-item-title"><strong>${esc(r.title)}</strong><span>${esc(r.type)}</span></div><a class="release-item-project" href="${purl(r.project)}">${esc(r.project)}</a><span class="release-item-type">${esc(r.type)}</span></div>`).join('');count.textContent=`${a.length} releases`;}
 [input,project,era].forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',render));render();
})();
