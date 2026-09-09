(()=>{
  const m=window.JOHN_SWAHN_MUSIC||{bands:[]};
  const g=document.getElementById('bandGrid');
  if(!g)return;

  const root='../';
  const logos={
    'almost-human':'almost-human.png',
    'aphophis':'aphophis.png',
    'big-november':'big-november.png',
    'desecrate':'desecrate.png',
    'develop':'develop.png',
    'equinox':'equinox.png',
    'the-unkinds':'the-unkinds.png',
    'treebeard':'treebeard.png',
    'twilight':'twilight.png',
    'xtortex':'xtortex.png'
  };

  const esc=v=>String(v??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

  g.classList.add('band-logo-grid');
  g.innerHTML=m.bands.map(b=>{
    const logo=logos[b.slug];
    const logoMarkup=logo
      ? `<img src="${root}assets/band-logos/${logo}" alt="${esc(b.name)} logotyp" loading="lazy">`
      : `<div class="band-logo-fallback">${esc(b.name)}</div>`;
    const meta=[b.genre,b.location].filter(Boolean).join(' · ');
    const releases=Number(b.releaseCount)||0;
    const releaseLabel=releases===1?'1 skiva':`${releases} skivor`;

    return `<a class="band-logo-card" href="${b.slug}.html">
      <div class="band-logo-panel">${logoMarkup}</div>
      <div class="band-logo-info">
        <span>${esc(meta)}</span>
        <h2>${esc(b.name)}</h2>
        <p>${esc(b.years)} · ${releaseLabel}</p>
      </div>
    </a>`;
  }).join('');
})();