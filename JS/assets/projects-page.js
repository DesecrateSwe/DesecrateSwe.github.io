(()=>{
 const data=window.JOHN_SWAHN_SITE_DATA||{projects:[]};
 const root=document.body.dataset.root||'..';
 const grid=document.getElementById('allProjectGrid');
 if(!grid)return;
 const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
 const rel=u=>{if(!u)return''; if(/^(?:https?:)?\/\//i.test(u))return u; return `${root}/${u.replace(/^\.\//,'')}`;};
 grid.innerHTML=data.projects.map((p,i)=>{
   const art=p.artwork?`<img class="project-art" src="${esc(rel(p.artwork))}" alt="${esc(p.title)} artwork"><div class="project-art-shade"></div>`:'';
   const meta=[...(p.meta||[]),`${p.releaseCount||0} ${p.releaseCount===1?'release':'releases'}`];
   return `<article class="project-card ${p.artwork?'has-art':''} reveal" data-index="${String(i+1).padStart(2,'0')}">${art}<div class="project-body"><span class="project-kicker">${esc(p.kicker||'Project')}</span><h3>${esc(p.title)}</h3><div class="project-meta">${meta.map(x=>`<span>${esc(x)}</span>`).join('')}</div><p>${esc(p.description||'')}</p><div class="project-links"><a class="project-link" href="${esc(p.slug)}.html">Open project <span>→</span></a></div></div></article>`;
 }).join('');
 requestAnimationFrame(()=>document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible')));
 const count=document.querySelector('[data-project-count]'); if(count)count.textContent=`${data.projects.length} documented projects`;
})();
