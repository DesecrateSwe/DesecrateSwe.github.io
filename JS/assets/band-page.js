(()=>{
  const m=window.JOHN_SWAHN_MUSIC||{};
  const key=location.pathname.split('/').pop().replace('.html','');
  const b=(m.bands||[]).find(x=>x.slug===key);
  if(!b)return;

  const esc=v=>String(v??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');

  document.getElementById('bandTitle').textContent=b.name;
  document.getElementById('bandEyebrow').textContent=[b.genre,b.location].filter(Boolean).join(' · ');
  document.getElementById('bandSummary').textContent=b.summary;
  document.getElementById('bandTags').innerHTML=[b.years,b.role].filter(Boolean)
    .map(x=>`<span>${esc(x)}</span>`).join('');

  const c=document.getElementById('bandHeroCover');
  if(b.artwork)c.innerHTML=`<img src="../${b.artwork}" alt="${esc(b.name)}">`;

  const h=document.querySelector('.band-hero-bg');
  const heroBackground=b.heroBackground||b.artwork;
  if(h&&heroBackground)h.style.backgroundImage=
    `linear-gradient(90deg,rgba(4,4,4,.98),rgba(4,4,4,.75),rgba(4,4,4,.30)),url('../${heroBackground}')`;

  const jr=document.getElementById('bandJohnRole');
  jr.textContent=b.role||b.years;

  const lu=document.getElementById('bandLineup');
  if(b.members?.length){
    lu.innerHTML=`<div class="section-label">Medlemmar</div><div class="lineup-list">${
      b.members.map(x=>`<div><strong>${esc(x[0])}</strong><span>${esc(x[1])}</span></div>`).join('')
    }</div>`;
  }else{
    lu.innerHTML='';
  }

  const historySection=document.getElementById('bandStorySection');
  const history=document.getElementById('bandHistory');
  if(historySection&&history&&b.history?.length){
    historySection.hidden=false;
    history.innerHTML=b.history.map(x=>`<p>${esc(x)}</p>`).join('');
  }

  const rs=(m.releases||[]).filter(r=>r.project===b.name);
  document.getElementById('bandDiscography').innerHTML=rs.map(r=>
    `<a class="release-card" href="../${r.url}">${
      r.cover?`<img src="../${r.cover}" alt="${esc(r.title)}" loading="lazy">`
      :'<div class="release-blank">JS</div>'
    }<div><span>${esc(r.year)} · ${esc(r.type)}</span><h3>${esc(r.title)}</h3><p>${
      r.trackCount?`${r.trackCount} spår`:'Visa skivan'
    }</p></div></a>`
  ).join('');

  const mediaSection=document.getElementById('bandMediaSection');
  const gallery=document.getElementById('bandGallery');
  if(mediaSection&&gallery&&b.gallery?.length){
    mediaSection.hidden=false;
    gallery.innerHTML=b.gallery.map(item=>{
      const x=typeof item==='string'?{src:item,caption:b.name}:item;
      return `<button data-lightbox="../${esc(x.src)}" data-caption="${esc(x.caption||b.name)}"><img src="../${esc(x.src)}" alt="${esc(x.caption||b.name)}" loading="lazy"></button>`;
    }).join('');
  }

  const links=document.getElementById('bandLinks');
  const publicLinks=(b.links||[]).filter(x=>!['discogs','metal archives'].includes(String(x[0]||'').toLowerCase()));
  if(publicLinks.length){
    links.innerHTML=`<div class="band-links">${publicLinks.map(x=>
      `<a target="_blank" rel="noopener" href="${x[1]}">${esc(x[0])} ↗</a>`
    ).join('')}</div>`;
  }else{
    links.closest('.section').hidden=true;
  }
})();
