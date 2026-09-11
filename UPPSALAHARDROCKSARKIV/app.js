(() => {
  'use strict';

  const cfg = window.ARCHIVE_CONFIG;
  const app = document.getElementById('app');
  const syncLabel = document.getElementById('sync-label');
  const state = {
    people: [], bands: [], memberships: [], releases: [], releaseBands: [], releaseMembers: [],
    relations: [], sources: [], claims: [], claimSources: [], claimEntities: []
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const byId = arr => new Map(arr.map(x => [x.id, x]));
  const peopleById = () => byId(state.people);
  const bandsById = () => byId(state.bands);
  const releasesById = () => byId(state.releases);

  function slugify(value = '') {
    return String(value)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/&/g, ' och ')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function routePath() {
    const raw = location.hash.replace(/^#/, '') || '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  async function loadArchiveSnapshot() {
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/rpc/get_public_archive`, {
      method: 'POST',
      headers: { apikey: cfg.publishableKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{}'
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
  }

  async function load() {
    try {
      const snapshot = await loadArchiveSnapshot();
      Object.keys(state).forEach(key => state[key] = Array.isArray(snapshot?.[key]) ? snapshot[key] : []);
      syncLabel.textContent = `Live från arkivet · ${new Date().toLocaleTimeString('sv-SE', {hour:'2-digit', minute:'2-digit'})}`;
      renderRoute();
    } catch (err) {
      console.error(err);
      syncLabel.textContent = 'Kunde inte nå arkivet';
      app.innerHTML = `<section class="page page-narrow"><div class="error-box"><strong>Kunde inte hämta arkivet.</strong><br>Kontrollera internetanslutningen och ladda om sidan.<span class="error-detail"> ${escapeHtml(err.message || '')}</span></div></section>`;
    }
  }

  function bandName(id) { return bandsById().get(id)?.canonical_name || 'Okänt band'; }
  function personName(id) { return peopleById().get(id)?.canonical_name || 'Okänd person'; }
  function releaseBand(releaseId) { const rb = state.releaseBands.find(x => x.release_id === releaseId); return rb ? bandsById().get(rb.band_id) : null; }
  function membershipsForBand(id) { return state.memberships.filter(x => x.band_id === id); }
  function membershipsForPerson(id) { return state.memberships.filter(x => x.person_id === id); }
  function releasesForBand(id) {
    const ids = new Set(state.releaseBands.filter(x => x.band_id === id).map(x => x.release_id));
    return state.releases.filter(x => ids.has(x.id));
  }
  function creditsForRelease(id) { return state.releaseMembers.filter(x => x.release_id === id); }

  function claimsForEntity(type, id) {
    const ids = new Set(state.claimEntities.filter(x => x.entity_type === type && x.entity_id === id).map(x => x.claim_id));
    return state.claims.filter(c => ids.has(c.id));
  }

  function claimsForPerson(id) {
    const membershipIds = new Set(membershipsForPerson(id).map(x => x.id));
    return state.claims.filter(c => state.claimEntities.some(e => e.claim_id === c.id && ((e.entity_type === 'person' && e.entity_id === id) || (e.entity_type === 'membership' && membershipIds.has(e.entity_id)))));
  }

  function sourcesForClaims(claims) {
    const claimIds = new Set(claims.map(c => c.id));
    const sourceIds = new Set(state.claimSources.filter(cs => claimIds.has(cs.claim_id)).map(cs => cs.source_id));
    return state.sources.filter(s => sourceIds.has(s.id));
  }

  function roleSv(role='') {
    return role.replaceAll('Vocals','sång').replaceAll('Guitars','gitarr').replaceAll('Bass','bas').replaceAll('Drums','trummor');
  }
  function statusSv(s) { return ({confirmed:'Bekräftad', probable:'Trolig', unconfirmed:'Obekräftad', disputed:'Omstridd', rejected:'Avfärdad'})[s] || s; }
  function sourceReliabilitySv(s) { return ({high:'Stark källa',medium:'Sekundärkälla',low:'Svag källa',unknown:'Ej bedömd'})[s] || s; }
  function relationSv(s) { return ({formed_from:'Bildades ur',renamed_to:'Bytte namn till',reformed_as:'Återbildades som',side_project:'Sidoprojekt till',successor:'Efterföljare till',predecessor:'Föregångare till',shared_lineup:'Delad lineup med',other:'Koppling till'})[s] || 'Koppling till'; }
  function yearSpan(m) {
    if (!m.joined_year && !m.left_year) return 'Årtal söks';
    if (m.joined_year && m.left_year) return `${m.joined_year}${m.left_year !== m.joined_year ? `–${m.left_year}` : ''}`;
    return String(m.joined_year || m.left_year);
  }
  function translateClaim(s='') {
    const map = [
      [/was formed in Uppsala in (\d{4})\./, 'bildades i Uppsala $1.'],
      [/was a thrash metal band from Uppsala\./, 'var ett thrash metal-band från Uppsala.'],
      [/is listed as Vocals, Guitars in/, 'är listad som sångare och gitarrist i'],
      [/is listed as Vocals in/, 'är listad som sångare i'],
      [/is listed as Guitars in/, 'är listad som gitarrist i'],
      [/is listed as Bass in/, 'är listad som basist i'],
      [/is listed as Drums in/, 'är listad som trummis i']
    ];
    let out = s;
    map.forEach(([re, rep]) => { if (re.test(out)) out = out.replace(re, rep); });
    if (out.startsWith('Desecrate released the demo Lonely Disgrace')) return 'Desecrate gav ut demon Lonely Disgrace i december 1989 och spelade enligt nuvarande källa in den i Enköping den 3 och 6 december 1989.';
    if (out.startsWith('Sarcasm was formed')) return 'Sarcasm bildades i Uppsala 1990 ur musiker med bakgrund i Third Storm och Embalmed.';
    if (out.startsWith("Sarcasm's early 1990 lineup")) return 'Sarcasms tidiga lineup 1990 bestod av Heval Bozarslan (sång), Fredrik Wallenberg (gitarr), Henrik Forslund (trummor) och Dave Janney (bas).';
    return out;
  }

  function bandHref(b) { return `#/band/${slugify(b.canonical_name)}`; }
  function personHref(p) { return `#/person/${slugify(p.canonical_name)}`; }
  function releaseHref(r) { return `#/utgava/${slugify(`${r.title}-${r.release_year || ''}`)}`; }

  function findBand(slug) { return state.bands.find(x => slugify(x.canonical_name) === slug); }
  function findPerson(slug) { return state.people.find(x => slugify(x.canonical_name) === slug); }
  function findRelease(slug) { return state.releases.find(x => slugify(`${x.title}-${x.release_year || ''}`) === slug); }

  function pageHeader(kicker, title, lead = '', meta = '') {
    return `<header class="page-hero">
      <div class="page-hero-inner">
        <div class="section-kicker">${escapeHtml(kicker)}</div>
        <h1>${title}</h1>
        ${lead ? `<p class="page-lead">${escapeHtml(lead)}</p>` : ''}
        ${meta ? `<div class="page-meta">${meta}</div>` : ''}
      </div>
    </header>`;
  }

  function breadcrumbs(items) {
    return `<nav class="breadcrumbs" aria-label="Brödsmulor">${items.map((x,i) => i === items.length - 1 ? `<span>${escapeHtml(x.label)}</span>` : `<a href="${x.href}">${escapeHtml(x.label)}</a><i>/</i>`).join('')}</nav>`;
  }

  function renderHome() {
    const john = state.people.find(p => p.canonical_name === 'John S. Swahn');
    const johnBands = john ? membershipsForPerson(john.id).map(m => bandsById().get(m.band_id)).filter(Boolean) : [];
    const earlyBands = [...state.bands].sort((a,b) => (a.formed_year || 9999) - (b.formed_year || 9999)).slice(0, 6);
    const recentReleases = [...state.releases].sort((a,b) => (a.release_year || 9999) - (b.release_year || 9999)).slice(0, 6);
    const counts = state.claims.reduce((acc,c) => ((acc[c.status] = (acc[c.status] || 0) + 1), acc), {});

    app.innerHTML = `
      <section class="hero home-hero">
        <div class="hero-backdrop" aria-hidden="true"><div class="hero-word">UPPSALA</div><div class="hero-number">018</div></div>
        <div class="hero-inner">
          <p class="eyebrow">ETT LEVANDE ARKIV ÖVER EN SCEN</p>
          <h1>Där banden<br><span>hänger ihop.</span></h1>
          <p class="hero-lead">En växande kartläggning av Uppsalas hårdrock och metal — människorna, banden, demokassetterna och vägarna mellan dem.</p>
          <div class="hero-actions"><a class="button button-primary" href="#/band">Utforska banden</a><a class="button button-ghost" href="#/tidslinje">Se tidslinjen</a></div>
          <div class="hero-stats">
            <div><strong>${state.bands.length}</strong><span>band</span></div>
            <div><strong>${state.people.length}</strong><span>personer</span></div>
            <div><strong>${state.releases.length}</strong><span>utgåvor</span></div>
            <div><strong>${state.sources.length}</strong><span>källor</span></div>
          </div>
        </div>
      </section>

      <section class="section home-intro">
        <div class="section-kicker">UPPSALA / FRÅN 1980-TALET OCH FRAMÅT</div>
        <div class="intro-grid">
          <h2>Inte en lista.<br>En <em>historia</em> om en scen.</h2>
          <div class="intro-copy">
            <p>Arkivet följer hur musiker rörde sig mellan band, hur nya konstellationer uppstod och hur en lokal scen växte fram.</p>
            <p>Varje band, person och utgåva får en egen sida. Där samlas tidslinje, medlemskap, krediter, kopplingar och källäge utan att allt hamnar i ett enda långt flöde.</p>
          </div>
        </div>
        <div class="confidence-strip">
          <div class="confidence-card"><strong class="verified">${counts.confirmed || 0}</strong><span>bekräftade uppgifter</span></div>
          <div class="confidence-card"><strong>${counts.probable || 0}</strong><span>troliga uppgifter</span></div>
          <div class="confidence-card"><strong>${state.claims.length}</strong><span>källkopplade uppgifter</span></div>
        </div>
      </section>

      <section class="feature-story section home-feature">
        <div class="feature-side"><span class="feature-index">01</span><span class="feature-label">FÖRSTA INGÅNGEN</span></div>
        <div class="feature-main">
          <p class="eyebrow">PERSON / JOHN S. SWAHN</p>
          <h2>En tråd genom flera band.</h2>
          <div class="feature-grid">
            <div><p class="feature-lead">John S. Swahn är den första ingången till kartläggningen. Hans bandsida och personprofil blir en knutpunkt där äldre och senare grenar kan byggas ut.</p><a class="button button-dark" href="${john ? personHref(john) : '#/personer'}">Öppna John S. Swahns sida</a></div>
            <div class="john-path">${johnBands.map(b => `<a class="john-path-item" href="${bandHref(b)}"><div class="john-path-year">${b.formed_year || '—'}</div><div><div class="john-path-band">${escapeHtml(b.canonical_name)}</div><div class="john-path-role">${escapeHtml((b.genres || []).join(' / '))}</div></div><div class="john-path-role">Öppna →</div></a>`).join('')}</div>
          </div>
        </div>
      </section>

      <section class="section home-grid-section">
        <div class="section-head compact-head"><div><div class="section-kicker">TIDIGA KNUTPUNKTER</div><h2>Band</h2></div><a class="text-link" href="#/band">Alla band →</a></div>
        <div class="band-grid band-grid-preview">${earlyBands.map((b,i) => bandCard(b,i)).join('')}</div>
      </section>

      <section class="section home-grid-section">
        <div class="section-head compact-head"><div><div class="section-kicker">DEMOER / KASSETTER / UTGÅVOR</div><h2>Första spåren</h2></div><a class="text-link" href="#/utgavor">Alla utgåvor →</a></div>
        <div class="release-stack">${recentReleases.map(releaseRow).join('')}</div>
      </section>`;
  }

  function bandCard(b, i = 0) {
    const mems = membershipsForBand(b.id);
    const names = mems.slice(0,4).map(m => personName(m.person_id));
    const extra = mems.length > 4 ? ` +${mems.length - 4}` : '';
    return `<a class="band-card" href="${bandHref(b)}" data-index="${String(i+1).padStart(2,'0')}">
      <div class="band-meta"><span>${b.formed_year ? `Bildat ${b.formed_year}` : 'Årtal söks'}</span><span>${escapeHtml(b.city || '')}</span></div>
      <h3 class="band-title">${escapeHtml(b.canonical_name)}</h3>
      <div class="band-genre">${escapeHtml((b.genres || []).join(' / '))}</div>
      <div class="band-members">${escapeHtml(names.length ? names.join(' · ') + extra : 'Lineup kartläggs')}</div>
    </a>`;
  }

  function personCard(p, i = 0) {
    const mems = membershipsForPerson(p.id);
    const names = [...new Set(mems.map(m => bandName(m.band_id)))];
    return `<a class="person-card" href="${personHref(p)}"><div class="person-number">${String(i+1).padStart(2,'0')}</div><h3>${escapeHtml(p.canonical_name)}</h3><div class="person-bands">${escapeHtml(names.join(' · ') || 'Koppling kartläggs')}</div></a>`;
  }

  function releaseRow(r) {
    const band = releaseBand(r.id);
    const credits = creditsForRelease(r.id).slice(0,4).map(x => `${personName(x.person_id)} — ${roleSv(x.role)}`);
    return `<a class="release-row" href="${releaseHref(r)}">
      <div class="release-year">${r.release_year || '—'}</div>
      <div><div class="release-title">${escapeHtml(r.title)}</div><span class="release-kind">${escapeHtml([r.release_type, r.format].filter(Boolean).join(' · '))}</span></div>
      <div class="release-band">${escapeHtml(band?.canonical_name || 'Band kartläggs')}</div>
      <div class="release-credits">${escapeHtml(credits.join(' · ') || 'Krediter kartläggs')}${creditsForRelease(r.id).length > 4 ? ' …' : ''}</div>
    </a>`;
  }

  function renderBandIndex() {
    const ordered = [...state.bands].sort((a,b) => (a.formed_year || 9999) - (b.formed_year || 9999) || a.canonical_name.localeCompare(b.canonical_name,'sv'));
    app.innerHTML = `${pageHeader('BAND I ARKIVET','Band','Från tidig hårdrock och thrash till death, black och senare grenar av Uppsalas metalscen.')}
      <section class="section page-section first-section">
        <div class="index-toolbar"><label class="search-box"><span>Sök band</span><input id="band-search" type="search" placeholder="Namn, genre eller år…"></label><div class="index-count"><strong id="band-count">${ordered.length}</strong> band</div></div>
        <div class="band-grid" id="band-grid">${ordered.map(bandCard).join('')}</div>
      </section>`;
    const input = $('#band-search');
    input.addEventListener('input', () => {
      const term = input.value.trim().toLocaleLowerCase('sv');
      const filtered = ordered.filter(b => `${b.canonical_name} ${(b.genres||[]).join(' ')} ${b.formed_year || ''}`.toLocaleLowerCase('sv').includes(term));
      $('#band-grid').innerHTML = filtered.map(bandCard).join('');
      $('#band-count').textContent = filtered.length;
    });
  }

  function renderBandDetail(b) {
    const mems = membershipsForBand(b.id).sort((a,bm) => (a.joined_year || 9999) - (bm.joined_year || 9999) || personName(a.person_id).localeCompare(personName(bm.person_id),'sv'));
    const rels = releasesForBand(b.id).sort((a,c) => (a.release_year || 9999) - (c.release_year || 9999));
    const claims = claimsForEntity('band', b.id);
    const sources = sourcesForClaims(claims);
    const links = state.relations.filter(r => r.from_band_id === b.id || r.to_band_id === b.id);
    const meta = [b.formed_year ? `Bildat ${b.formed_year}` : 'Bildningsår söks', b.city || 'Uppsala', ...(b.genres || [])].map(x => `<span>${escapeHtml(x)}</span>`).join('');
    app.innerHTML = `${breadcrumbs([{label:'Band',href:'#/band'},{label:b.canonical_name}])}${pageHeader('BAND / UPPSALA',escapeHtml(b.canonical_name),'',meta)}
      <section class="section detail-layout first-section">
        <aside class="detail-aside"><div class="aside-label">Översikt</div><p>${escapeHtml(b.description || `Ett dokumenterat band i Uppsala-scenen. Arkivet bygger successivt ut historik, lineups, utgåvor och kopplingar kring ${b.canonical_name}.`)}</p><div class="aside-facts"><div><span>Status</span><strong>${b.status === 'active' ? 'Aktivt' : b.status === 'inactive' ? 'Inaktivt' : 'Okänt'}</strong></div><div><span>Medlemmar i arkivet</span><strong>${mems.length}</strong></div><div><span>Utgåvor i arkivet</span><strong>${rels.length}</strong></div></div></aside>
        <div class="detail-main">
          <section class="content-section"><div class="content-head"><span>01</span><h2>Medlemmar</h2></div><div class="credit-list">${mems.length ? mems.map(m => { const p=peopleById().get(m.person_id); return `<a href="${personHref(p)}"><strong>${escapeHtml(p.canonical_name)}</strong><span>${escapeHtml(roleSv(m.role || ''))}</span><em>${yearSpan(m)}</em></a>`; }).join('') : '<div class="empty-state">Lineup kartläggs.</div>'}</div></section>
          <section class="content-section"><div class="content-head"><span>02</span><h2>Utgåvor</h2></div><div class="release-stack">${rels.length ? rels.map(releaseRow).join('') : '<div class="empty-state">Inga utgåvor registrerade ännu.</div>'}</div></section>
          ${links.length ? `<section class="content-section"><div class="content-head"><span>03</span><h2>Kopplingar</h2></div><div class="relation-grid">${links.map(r => { const otherId = r.from_band_id === b.id ? r.to_band_id : r.from_band_id; const other = bandsById().get(otherId); return `<a href="${bandHref(other)}"><span>${escapeHtml(relationSv(r.relation_type))}</span><strong>${escapeHtml(other.canonical_name)}</strong><em>${r.from_year || ''}</em></a>`; }).join('')}</div></section>` : ''}
          <section class="content-section"><div class="content-head"><span>${links.length ? '04':'03'}</span><h2>Källäge</h2></div>${claimList(claims)}</section>
          ${sources.length ? `<section class="content-section"><div class="content-head"><span>${links.length ? '05':'04'}</span><h2>Källor</h2></div>${sourceList(sources)}</section>` : ''}
        </div>
      </section>`;
  }

  function renderPeopleIndex() {
    const ordered = [...state.people].sort((a,b) => a.canonical_name.localeCompare(b.canonical_name,'sv'));
    app.innerHTML = `${pageHeader('MÄNNISKORNA BAKOM BANDEN','Personer','Följ en musiker genom olika band, perioder och dokumenterade utgåvekrediter.')}
      <section class="section page-section first-section"><div class="index-toolbar"><label class="search-box"><span>Sök person</span><input id="people-search" type="search" placeholder="Namn eller band…"></label><div class="index-count"><strong id="people-count">${ordered.length}</strong> personer</div></div><div class="people-grid" id="people-grid">${ordered.map(personCard).join('')}</div></section>`;
    const input = $('#people-search');
    input.addEventListener('input', () => {
      const term = input.value.trim().toLocaleLowerCase('sv');
      const filtered = ordered.filter(p => `${p.canonical_name} ${membershipsForPerson(p.id).map(m => bandName(m.band_id)).join(' ')}`.toLocaleLowerCase('sv').includes(term));
      $('#people-grid').innerHTML = filtered.map(personCard).join('');
      $('#people-count').textContent = filtered.length;
    });
  }

  function renderPersonDetail(p) {
    const mems = membershipsForPerson(p.id).sort((a,b) => (a.joined_year || 9999) - (b.joined_year || 9999));
    const credits = state.releaseMembers.filter(x => x.person_id === p.id).map(x => ({...x, release: releasesById().get(x.release_id)})).filter(x => x.release).sort((a,b) => (a.release.release_year || 9999) - (b.release.release_year || 9999));
    const claims = claimsForPerson(p.id);
    const sources = sourcesForClaims(claims);
    const uniqueBands = [...new Set(mems.map(m => m.band_id))].map(id => bandsById().get(id)).filter(Boolean);
    const meta = uniqueBands.slice(0,5).map(b => `<a href="${bandHref(b)}">${escapeHtml(b.canonical_name)}</a>`).join('');
    app.innerHTML = `${breadcrumbs([{label:'Personer',href:'#/personer'},{label:p.canonical_name}])}${pageHeader('PERSON / UPPSALA-SCENEN',escapeHtml(p.canonical_name),'',meta)}
      <section class="section detail-layout first-section">
        <aside class="detail-aside"><div class="aside-label">Profil</div><p>${escapeHtml(p.biography || p.uppsala_connection || 'Dokumenterad i Uppsala-scenen.')}</p><div class="aside-facts"><div><span>Bandkopplingar</span><strong>${uniqueBands.length}</strong></div><div><span>Utgåvekrediter</span><strong>${credits.length}</strong></div><div><span>Källkopplade uppgifter</span><strong>${claims.length}</strong></div></div></aside>
        <div class="detail-main">
          <section class="content-section"><div class="content-head"><span>01</span><h2>Band</h2></div><div class="credit-list">${mems.length ? mems.map(m => { const b=bandsById().get(m.band_id); return `<a href="${bandHref(b)}"><strong>${escapeHtml(b.canonical_name)}</strong><span>${escapeHtml(roleSv(m.role || ''))}</span><em>${yearSpan(m)}</em></a>`; }).join('') : '<div class="empty-state">Bandkopplingar kartläggs.</div>'}</div></section>
          <section class="content-section"><div class="content-head"><span>02</span><h2>Utgåvekrediter</h2></div><div class="credit-list">${credits.length ? credits.map(x => `<a href="${releaseHref(x.release)}"><strong>${escapeHtml(x.release.title)}</strong><span>${escapeHtml(roleSv(x.role || ''))}</span><em>${x.release.release_year || '—'}</em></a>`).join('') : '<div class="empty-state">Inga releasecredits registrerade ännu.</div>'}</div></section>
          <section class="content-section"><div class="content-head"><span>03</span><h2>Källäge</h2></div>${claimList(claims)}</section>
          ${sources.length ? `<section class="content-section"><div class="content-head"><span>04</span><h2>Källor</h2></div>${sourceList(sources)}</section>` : ''}
        </div>
      </section>`;
  }

  function renderReleasesIndex() {
    const ordered = [...state.releases].sort((a,b) => (a.release_year || 9999) - (b.release_year || 9999) || a.title.localeCompare(b.title,'sv'));
    app.innerHTML = `${pageHeader('DEMOER / KASSETTER / UTGÅVOR','Utgåvor','Utgåvorna är ofta de bästa hållpunkterna för årtal, lineups och hur scenen faktiskt såg ut vid en viss tidpunkt.')}
      <section class="section page-section first-section"><div class="index-toolbar"><label class="search-box"><span>Sök utgåva</span><input id="release-search" type="search" placeholder="Titel, band eller år…"></label><div class="index-count"><strong id="release-count">${ordered.length}</strong> utgåvor</div></div><div class="release-stack" id="release-stack">${ordered.map(releaseRow).join('')}</div></section>`;
    const input = $('#release-search');
    input.addEventListener('input', () => {
      const term = input.value.trim().toLocaleLowerCase('sv');
      const filtered = ordered.filter(r => `${r.title} ${releaseBand(r.id)?.canonical_name || ''} ${r.release_year || ''}`.toLocaleLowerCase('sv').includes(term));
      $('#release-stack').innerHTML = filtered.map(releaseRow).join('');
      $('#release-count').textContent = filtered.length;
    });
  }

  function renderReleaseDetail(r) {
    const band = releaseBand(r.id);
    const credits = creditsForRelease(r.id);
    const claims = claimsForEntity('release', r.id);
    const sources = sourcesForClaims(claims);
    const meta = [r.release_year || 'Årtal söks', r.release_type, r.format, band?.canonical_name].filter(Boolean).map(x => `<span>${escapeHtml(x)}</span>`).join('');
    app.innerHTML = `${breadcrumbs([{label:'Utgåvor',href:'#/utgavor'},{label:r.title}])}${pageHeader('UTGÅVA / ARKIVPOST',escapeHtml(r.title),'',meta)}
      <section class="section detail-layout first-section">
        <aside class="detail-aside"><div class="aside-label">Utgåva</div><p>${escapeHtml(r.description || `En ${r.release_type || 'utgåva'} från ${r.release_year || 'okänt år'} i arkivet.`)}</p>${band ? `<a class="button button-ghost aside-button" href="${bandHref(band)}">Öppna ${escapeHtml(band.canonical_name)}</a>` : ''}</aside>
        <div class="detail-main">
          <section class="content-section"><div class="content-head"><span>01</span><h2>Krediter</h2></div><div class="credit-list">${credits.length ? credits.map(c => { const p=peopleById().get(c.person_id); return `<a href="${personHref(p)}"><strong>${escapeHtml(c.credited_as || p.canonical_name)}</strong><span>${escapeHtml(roleSv(c.role || ''))}</span><em>${escapeHtml(p.canonical_name)}</em></a>`; }).join('') : '<div class="empty-state">Krediter kartläggs.</div>'}</div></section>
          <section class="content-section"><div class="content-head"><span>02</span><h2>Källäge</h2></div>${claimList(claims)}</section>
          ${sources.length ? `<section class="content-section"><div class="content-head"><span>03</span><h2>Källor</h2></div>${sourceList(sources)}</section>` : ''}
        </div>
      </section>`;
  }

  function timelineRows() {
    const rows = [];
    state.releases.forEach(r => {
      const b = releaseBand(r.id);
      const credits = creditsForRelease(r.id).map(c => `${personName(c.person_id)} (${roleSv(c.role)})`);
      rows.push({year:r.release_year, href:releaseHref(r), title:`${b?.canonical_name || 'Okänt band'} — ${r.title}`, text:credits.length ? `Dokumenterade krediter: ${credits.join(', ')}.` : `${r.release_type || 'Utgåva'} i arkivet.`, tags:[r.release_type,r.format].filter(Boolean)});
    });
    state.claims.filter(c => c.claim_type === 'band_formation' && c.from_year).forEach(c => {
      const ent = state.claimEntities.find(e => e.claim_id === c.id && e.entity_type === 'band' && e.entity_role === 'subject');
      const b = ent ? bandsById().get(ent.entity_id) : null;
      rows.push({year:c.from_year, href:b ? bandHref(b) : '#/band', title:b?.canonical_name || 'Ny knutpunkt', text:translateClaim(c.statement), tags:[statusSv(c.status)]});
    });
    return rows.sort((a,b) => (a.year || 9999) - (b.year || 9999) || a.title.localeCompare(b.title,'sv'));
  }

  function renderTimeline() {
    app.innerHTML = `${pageHeader('ÅR FÖR ÅR','Tidslinjen','Utgåvor, bandbildningar och andra hållpunkter samlade kronologiskt.')}
      <section class="section page-section first-section"><div class="timeline">${timelineRows().map(row => `<article class="timeline-row"><div class="timeline-year">${row.year || '—'}</div><div class="timeline-content"><h3><a href="${row.href}">${escapeHtml(row.title)}</a></h3><p>${escapeHtml(row.text)}</p><div class="timeline-tags">${row.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div></div></article>`).join('')}</div></section>`;
  }

  function claimList(claims) {
    if (!claims.length) return '<div class="empty-state">Fler uppgifter ska källkopplas.</div>';
    return `<div class="claim-list">${claims.sort((a,b) => (b.confidence || 0) - (a.confidence || 0)).map(c => `<article><div><span class="status-pill ${escapeHtml(c.status)}">${escapeHtml(statusSv(c.status))}</span>${c.confidence != null ? `<small>${c.confidence}%</small>` : ''}</div><p>${escapeHtml(translateClaim(c.statement))}</p></article>`).join('')}</div>`;
  }

  function sourceList(sources) {
    return `<div class="sources-list">${sources.map((s,i) => `<a class="source-row" href="${escapeHtml(s.url || '#') }" ${s.url ? 'target="_blank" rel="noopener"' : ''}><div class="source-index">${String(i+1).padStart(2,'0')}</div><div class="source-title">${escapeHtml(s.title)}</div><div class="source-publisher">${escapeHtml(s.publisher || s.source_type || '')}</div><div class="source-quality ${escapeHtml(s.reliability)}">${escapeHtml(sourceReliabilitySv(s.reliability))}</div></a>`).join('')}</div>`;
  }

  function renderSources() {
    const ordered = [...state.sources].sort((a,b) => (a.reliability === 'high' ? -1 : 1) - (b.reliability === 'high' ? -1 : 1) || a.title.localeCompare(b.title,'sv'));
    app.innerHTML = `${pageHeader('KÄLLLÄGET ÄR EN DEL AV HISTORIEN','Källor','Arkivet skiljer mellan förstahandskällor, bandens egna historieskrivningar och specialistdatabaser.')}
      <section class="section page-section first-section">${sourceList(ordered)}</section>`;
  }

  function networkData() {
    const bandScore = new Map(state.bands.map(b => [b.id, membershipsForBand(b.id).length + state.relations.filter(r => r.from_band_id === b.id || r.to_band_id === b.id).length * 3]));
    const selectedBands = [...state.bands].sort((a,b) => (bandScore.get(b.id)||0)-(bandScore.get(a.id)||0)).slice(0, 16);
    const selectedBandIds = new Set(selectedBands.map(b => b.id));
    const selectedPeople = state.people.filter(p => membershipsForPerson(p.id).filter(m => selectedBandIds.has(m.band_id)).length >= 2 || ['John S. Swahn','Dave Janney','Jakob Bergström'].includes(p.canonical_name)).slice(0,26);
    return {selectedBands, selectedPeople, selectedBandIds};
  }

  function renderNetwork() {
    const {selectedBands, selectedPeople, selectedBandIds} = networkData();
    app.innerHTML = `${pageHeader('VEM LEDER VIDARE TILL VEM?','Nätverket','En koncentrerad karta över de starkaste kopplingarna i materialet. Klicka på ett namn för att öppna dess egen sida.')}
      <section class="section page-section first-section"><div class="network-shell"><svg id="network" viewBox="0 0 1400 900" role="img" aria-label="Nätverk över band och musiker i Uppsala hårdrocksscen"></svg><div class="network-legend"><span><i class="legend-band"></i> Band</span><span><i class="legend-person"></i> Person</span><span><i class="legend-line"></i> Medlemskap</span></div></div><p class="network-note">Visar de mest sammankopplade noderna i den nuvarande kartläggningen. Fler band och personer finns på sina respektive indexsidor.</p></section>`;
    const svg = $('#network');
    const cx=700, cy=445, rx=510, ry=300;
    const bPos = new Map();
    selectedBands.forEach((b,i) => { const a=(Math.PI*2*i/selectedBands.length)-Math.PI/2; bPos.set(b.id,[cx+Math.cos(a)*rx,cy+Math.sin(a)*ry]); });
    const pPos = new Map();
    selectedPeople.forEach((p,i) => {
      const ms = membershipsForPerson(p.id).filter(m => selectedBandIds.has(m.band_id));
      if (!ms.length) return;
      const x=ms.reduce((s,m)=>s+bPos.get(m.band_id)[0],0)/ms.length;
      const y=ms.reduce((s,m)=>s+bPos.get(m.band_id)[1],0)/ms.length;
      const jitter=(i%5-2)*16;
      pPos.set(p.id,[x+jitter,y+((i*37)%70)-35]);
    });
    let html='';
    selectedPeople.forEach(p => membershipsForPerson(p.id).filter(m=>selectedBandIds.has(m.band_id)).forEach(m => {
      if (!pPos.has(p.id)) return; const [x1,y1]=pPos.get(p.id), [x2,y2]=bPos.get(m.band_id); html += `<line class="net-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`;
    }));
    state.relations.filter(r=>selectedBandIds.has(r.from_band_id)&&selectedBandIds.has(r.to_band_id)).forEach(r=>{ const [x1,y1]=bPos.get(r.from_band_id),[x2,y2]=bPos.get(r.to_band_id); html+=`<line class="net-line relation" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`; });
    selectedBands.forEach(b=>{ const [x,y]=bPos.get(b.id); html+=`<a href="${bandHref(b)}"><g class="net-band" transform="translate(${x} ${y})"><circle r="52"></circle><text y="5">${escapeHtml(b.canonical_name)}</text></g></a>`; });
    selectedPeople.forEach(p=>{ if(!pPos.has(p.id))return; const [x,y]=pPos.get(p.id); html+=`<a href="${personHref(p)}"><g class="net-person" transform="translate(${x} ${y})"><circle r="7"></circle><text y="23">${escapeHtml(p.canonical_name)}</text></g></a>`; });
    svg.innerHTML=html;
  }

  function renderNotFound() {
    app.innerHTML = `${pageHeader('404','Sidan hittades inte','Länken pekar inte på någon registrerad sida i arkivet.')}<section class="section first-section"><a class="button button-primary" href="#/">Till startsidan</a></section>`;
  }

  function updateNav(path) {
    $$('#site-nav a').forEach(a => {
      const r=a.dataset.route;
      const active = r === '/' ? path === '/' : path === r || path.startsWith(`${r}/`) || (r === '/band' && path.startsWith('/band/')) || (r === '/personer' && path.startsWith('/person/')) || (r === '/utgavor' && path.startsWith('/utgava/'));
      a.classList.toggle('active', active);
    });
  }

  function renderRoute() {
    const path = routePath();
    updateNav(path);
    $('#site-nav')?.classList.remove('open');
    $('.nav-toggle')?.setAttribute('aria-expanded','false');
    const parts = path.split('/').filter(Boolean);
    if (path === '/') renderHome();
    else if (path === '/band') renderBandIndex();
    else if (parts[0] === 'band' && parts[1]) { const b=findBand(parts[1]); b ? renderBandDetail(b) : renderNotFound(); }
    else if (path === '/personer') renderPeopleIndex();
    else if (parts[0] === 'person' && parts[1]) { const p=findPerson(parts[1]); p ? renderPersonDetail(p) : renderNotFound(); }
    else if (path === '/utgavor') renderReleasesIndex();
    else if (parts[0] === 'utgava' && parts[1]) { const r=findRelease(parts[1]); r ? renderReleaseDetail(r) : renderNotFound(); }
    else if (path === '/tidslinje') renderTimeline();
    else if (path === '/natverket') renderNetwork();
    else if (path === '/kallor') renderSources();
    else renderNotFound();
    window.scrollTo({top:0, behavior:'instant'});
    document.title = `${document.querySelector('.page-hero h1, .hero h1')?.textContent.trim().replace(/\s+/g,' ') || 'Uppsala Hårdrocksarkiv'} – Uppsala Hårdrocksarkiv`;
  }

  window.addEventListener('hashchange', renderRoute);
  $('.nav-toggle').addEventListener('click', e => {
    const nav=$('#site-nav'); nav.classList.toggle('open'); e.currentTarget.setAttribute('aria-expanded',nav.classList.contains('open'));
  });
  if (!location.hash) history.replaceState(null,'','#/');
  load();
})();
