// Audit SEO site - lite/Pro + QC + canonicals + scripts tiers + techno + schema par type + sitemap count
const $ = id => document.getElementById(id);
const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
const badgeTxt = s => s === 'g' ? 'OK' : s === 'a' ? '~' : '!';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const prog = t => { $('prog').textContent = t; };
let lastData = null, lastReport = '', lastCsv = '', drValue = null;

chrome.tabs.query({ active: true, currentWindow: true }, t => {
  let origin = ''; try { origin = new URL(t[0].url).origin; } catch (e) {}
  $('domain').value = origin;
  if (origin) { loadCache(origin); showSitemapCount(origin); showDR(origin); }
});

// ---- Cache par domaine (chrome.storage.local, LRU 12 domaines) ----
const humanAge = ms => { const m = Math.round(ms / 60000); if (m < 1) return "moins d'1 min"; if (m < 60) return m + ' min'; const h = Math.round(m / 60); return h < 24 ? h + ' h' : Math.round(h / 24) + ' j'; };
function saveCache(f) {
  if (!f || f.scanned > 1500) return;
  chrome.storage.local.get('cidx', ({ cidx }) => {
    let idx = Array.isArray(cidx) ? cidx.filter(o => o !== f.origin) : [];
    idx.push(f.origin); const evict = [];
    while (idx.length > 12) evict.push('c:' + idx.shift());
    try { chrome.storage.local.set({ ['c:' + f.origin]: { data: f, ts: Date.now() }, cidx: idx }, () => chrome.runtime.lastError); } catch (e) {}
    if (evict.length) chrome.storage.local.remove(evict);
  });
}
function loadCache(origin) {
  chrome.storage.local.get('c:' + origin, o => {
    const rec = o['c:' + origin];
    if (!rec || !rec.data) return;
    render(rec.data, '');
    $('note').textContent = '📦 Dernier scan il y a ' + humanAge(Date.now() - rec.ts) + ' (en cache). Clique "Relancer" pour actualiser. ' + $('note').textContent;
    $('scanBtn').textContent = 'Relancer';
  });
}

// Domain Rating Ahrefs (endpoint public gratuit, sans clé API)
async function fetchDR(origin) {
  try {
    const host = new URL(origin).host;
    const r = await fetch('https://api.ahrefs.com/v3/public/domain-rating-free?target=' + encodeURIComponent(host), { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const j = await r.json();
    const dr = j && j.domain_rating && j.domain_rating.domain_rating;
    return typeof dr === 'number' ? dr : null;
  } catch (e) { return null; }
}
async function showDR(origin) {
  const el = $('drVal'); el.textContent = '...';
  drValue = await fetchDR(origin);
  if (drValue == null) { el.textContent = 'n/a'; el.className = 'drn'; return; }
  el.textContent = drValue;
  el.className = 'drn ' + (drValue >= 60 ? 'g' : drValue >= 30 ? 'a' : 'r');
}

$('scanBtn').addEventListener('click', runScan);
$('domain').addEventListener('keydown', e => { if (e.key === 'Enter') runScan(); });
$('scanAll').addEventListener('change', () => { $('maxPages').disabled = $('scanAll').checked; $('maxPages').style.opacity = $('scanAll').checked ? .4 : 1; });
$('copyBtn').addEventListener('click', () => navigator.clipboard.writeText(lastReport).then(() => flash('copyBtn', 'Copié ✓', 'Copier texte')));
$('csvBtn').addEventListener('click', downloadCsv);
$('pdfBtn').addEventListener('click', () => { if (lastData) chrome.storage.local.set({ auditReport: lastData }, () => chrome.tabs.create({ url: chrome.runtime.getURL('report.html') })); });
function flash(id, txt, back) { const b = $(id), o = b.textContent; b.textContent = txt; setTimeout(() => b.textContent = back || o, 1500); }

// ================= Signatures =================
const SCRIPT_SIGS = [
  { name: 'Google Analytics 4', re: /gtag\/js\?id=G-|\bG-[A-Z0-9]{6,}\b/ },
  { name: 'Google Analytics (UA)', re: /google-analytics\.com\/analytics\.js|\bUA-\d{4,}-\d/ },
  { name: 'Google Tag Manager', re: /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/ },
  { name: 'Microsoft Clarity', re: /clarity\.ms|clarity\("set"|function\(c,l,a,r,i,t,y\)/ },
  { name: 'Meta Pixel (Facebook)', re: /connect\.facebook\.net|fbq\(\s*['"]init/ },
  { name: 'Hotjar', re: /static\.hotjar\.com|hjSiteSettings|_hjSettings/ },
  { name: 'Matomo / Piwik', re: /matomo\.js|piwik\.js|_paq\.push/ },
  { name: 'LinkedIn Insight', re: /snap\.licdn\.com/ },
  { name: 'TikTok Pixel', re: /analytics\.tiktok\.com/ },
  { name: 'Plausible', re: /plausible\.io\/js/ },
  { name: 'Cloudflare Insights', re: /static\.cloudflareinsights\.com/ },
  { name: 'HubSpot', re: /js\.hs-scripts\.com|hs-analytics\.net/ },
  { name: 'Crisp (chat)', re: /client\.crisp\.chat/ },
  { name: 'Intercom', re: /widget\.intercom\.io|intercomcdn/ },
  { name: 'Axeptio / cookies', re: /axeptio|cookiebot|tarteaucitron|didomi/ }
];
const TECH_SIGS = [
  { name: 'WordPress', re: /\/wp-content\/|\/wp-includes\/|wp-json/ },
  { name: 'WooCommerce', re: /woocommerce|wc-block|\/wc-ajax\//i },
  { name: 'Elementor', re: /elementor/ },
  { name: 'Next.js', re: /\/_next\/|__NEXT_DATA__/ },
  { name: 'Nuxt', re: /\/_nuxt\/|window\.__NUXT__/ },
  { name: 'React', re: /data-reactroot|react-dom|_reactListeningTo/ },
  { name: 'Vue.js', re: /data-v-[0-9a-f]{8}|vue(\.runtime)?(\.min)?\.js/ },
  { name: 'Shopify', re: /cdn\.shopify\.com|Shopify\.theme|myshopify\.com/ },
  { name: 'PrestaShop', re: /prestashop|\/modules\/ps_/ },
  { name: 'Wix', re: /static\.wixstatic\.com|wixsite/ },
  { name: 'Squarespace', re: /squarespace\.com|static1\.squarespace/ },
  { name: 'Webflow', re: /assets\.website-files\.com|webflow\.(js|io)|wf-/ },
  { name: 'Drupal', re: /Drupal\.settings|\/sites\/default\/files/ },
  { name: 'Joomla', re: /\/media\/jui\/|com_content/ },
  { name: 'Framer', re: /framerusercontent|framer\.(com|app)/ },
  { name: 'Gatsby', re: /___gatsby|gatsby-/ }
];
const EXPECT = {
  ecommerce: ['Organization', 'WebSite', 'BreadcrumbList', 'Product', 'Offer', 'AggregateRating'],
  saas: ['Organization', 'WebSite', 'SoftwareApplication', 'Offer', 'FAQPage', 'BreadcrumbList'],
  'blog / média': ['Organization', 'WebSite', 'Article', 'BreadcrumbList'],
  'local / vitrine': ['Organization', 'WebSite', 'LocalBusiness', 'BreadcrumbList'],
  'vitrine / autre': ['Organization', 'WebSite', 'BreadcrumbList']
};

// ================= QC balises =================
const IA_WORDS = ["révolutionn", "incontournable", "à l'ère de", "plongez", "dans un monde", "sublimer", "propulser", "game-changer", "boostez votre", "au cœur de l'innovation"];
function qcTitle(title) {
  const t = (title || '').trim(), low = t.toLowerCase(), out = [];
  if (!t) return ['title vide'];
  if (/(^|[\s|>\-])(accueil|home|bienvenue|page d'accueil|sans titre|untitled)([\s|<\-]|$)/i.test(low)) out.push('title générique (Accueil/Home)');
  if (t.includes('—')) out.push('tiret cadratin dans le title');
  if (t.length > 65) out.push('title trop long (' + t.length + ')');
  else if (t.length < 30) out.push('title trop court (' + t.length + ')');
  if (IA_WORDS.some(w => low.includes(w))) out.push('vocabulaire marketing creux');
  return out;
}

// ================= Schema helpers =================
function collectTypes(o, arr) {
  if (!o || typeof o !== 'object') return;
  if (o['@type']) [].concat(o['@type']).forEach(t => arr.push(String(t)));
  Object.values(o).forEach(v => Array.isArray(v) ? v.forEach(x => collectTypes(x, arr)) : (typeof v === 'object' && collectTypes(v, arr)));
}
function schemaOfDoc(doc) { const a = []; doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => { try { collectTypes(JSON.parse(s.textContent), a); } catch (e) {} }); return a; }

function inferType(urls, tech, schema) {
  const j = urls.join(' ').toLowerCase(), t = tech.join(' ').toLowerCase(), s = schema.map(x => x.toLowerCase());
  // ecommerce = vraies preuves de boutique (pas juste le plugin WooCommerce ni la page /panier auto-générée)
  const ecomUrls = (j.match(/\/(produit|produits|product|products|boutique|shop|collections|store)\b/g) || []).length;
  const hasProductSchema = s.includes('product') || (s.includes('offer') && s.includes('aggregaterating'));
  if (hasProductSchema || /prestashop|shopify/.test(t) || ecomUrls >= 3 || (t.includes('woocommerce') && ecomUrls >= 2)) return 'ecommerce';
  if (s.includes('softwareapplication') || /\/(tarifs|pricing|fonctionnalites)\b/.test(j)) return 'saas';
  const content = (j.match(/\/(blog|article|articles|actualite|actualites|news|post|posts|tips|guide|guides|ressources)\b/g) || []).length + ((s.includes('article') || s.includes('blogposting')) ? 5 : 0);
  if (content >= 5) return 'blog / média';
  if (s.includes('localbusiness') || /\/(contact|horaires|rendez-vous|devis)\b/.test(j)) return 'local / vitrine';
  return 'vitrine / autre';
}

// ================= Sitemap =================
async function fetchText(u) { const r = await fetch(u, { credentials: 'omit' }); return { ok: r.ok, status: r.status, text: r.ok ? await r.text() : '' }; }
const parseLocs = xml => (xml.match(/<loc>([\s\S]*?)<\/loc>/gi) || []).map(l => l.replace(/<\/?loc>/gi, '').replace(/<!\[CDATA\[|\]\]>/g, '').trim());
function sameHost(u, origin) { try { return new URL(u).host === new URL(origin).host; } catch (e) { return false; } }
const isMedia = u => /\.(jpg|jpeg|png|webp|gif|svg|css|js|pdf|zip|mp4|webmanifest)$/i.test(u);
async function sitemapCandidates(origin) {
  const c = [];
  try { const rob = await fetchText(origin + '/robots.txt'); if (rob.ok) (rob.text.match(/sitemap:\s*\S+/ig) || []).forEach(l => c.push(l.replace(/sitemap:\s*/i, '').trim())); } catch (e) {}
  ['/sitemap.xml', '/sitemap-index.xml', '/sitemap_index.xml', '/sitemapindex.xml', '/wp-sitemap.xml', '/sitemap/sitemap.xml', '/sitemap1.xml', '/sitemap/index.xml', '/sitemaps.xml'].forEach(p => c.push(origin + p));
  return [...new Set(c)];
}
async function collectSitemap(origin) {
  let urls = []; const seen = new Set();
  for (const cand of await sitemapCandidates(origin)) {
    if (/\.gz$/i.test(cand)) continue;
    let sm; try { sm = await fetchText(cand); } catch (e) { continue; }
    if (!sm.ok || !/<(urlset|sitemapindex|loc)\b/i.test(sm.text)) continue;
    if (/<sitemapindex|<sitemap>/i.test(sm.text)) {
      for (const s of parseLocs(sm.text).filter(u => /\.xml/i.test(u)).slice(0, 60)) {
        if (seen.has(s)) continue; seen.add(s);
        try { urls.push(...parseLocs((await fetchText(s)).text)); } catch (e) {}
        if (urls.length > 20000) break;
      }
    } else urls.push(...parseLocs(sm.text));
    if (urls.length) break;
  }
  return [...new Set(urls)].filter(u => sameHost(u, origin) && !isMedia(u) && !/\.xml$/i.test(u));
}
// Fallback : découverte par exploration des liens depuis la page d'accueil
async function discoverByCrawl(origin, max) {
  const cap = Math.min(max, 400), visited = new Set(), queue = [origin + '/'], found = [], parser = new DOMParser();
  while (queue.length && found.length < cap) {
    const batch = queue.splice(0, 6).filter(u => !visited.has(u));
    if (!batch.length) continue;
    batch.forEach(u => visited.add(u));
    await Promise.all(batch.map(async u => {
      try {
        const r = await fetch(u, { credentials: 'omit', redirect: 'follow' });
        if (!r.ok || !/text\/html/i.test(r.headers.get('content-type') || '')) return;
        found.push(u);
        const doc = parser.parseFromString(await r.text(), 'text/html');
        doc.querySelectorAll('a[href]').forEach(a => {
          const h = a.getAttribute('href') || ''; if (h.startsWith('#') || h.startsWith('mailto:') || h.startsWith('tel:')) return;
          try { const abs = norm(new URL(h, u).href); if (sameHost(abs, origin) && !isMedia(abs) && !visited.has(abs) && !queue.includes(abs)) queue.push(abs); } catch (e) {}
        });
      } catch (e) {}
      prog('Exploration des liens : ' + found.length + ' pages trouvées...');
    }));
  }
  return [...new Set(found.map(norm))];
}
let sitemapTotal = null;
async function showSitemapCount(origin) {
  prog('Lecture du sitemap...');
  try { const u = await collectSitemap(origin); sitemapTotal = u.length; prog(u.length ? `Sitemap : ${u.length} pages détectées. Prêt à scanner.` : 'Aucun sitemap détecté. Le scan explorera les liens depuis la page d\'accueil.'); }
  catch (e) { prog('Sitemap illisible.'); }
}
const norm = u => (u.split('#')[0].split('?')[0].replace(/\/$/, '')) || u;

// ================= Homepage (techno + scripts) =================
async function analyzeHomepage(origin) {
  const out = { tech: [], scripts: [], schemaHome: [], server: '', gen: '' };
  try {
    const r = await fetch(origin + '/', { credentials: 'omit' });
    out.server = [r.headers.get('server'), r.headers.get('x-powered-by')].filter(Boolean).join(' / ');
    const html = await r.text();
    const g = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)/i); if (g) out.gen = g[1];
    TECH_SIGS.forEach(s => { if (s.re.test(html)) out.tech.push(s.name); });
    SCRIPT_SIGS.forEach(s => { if (s.re.test(html)) out.scripts.push(s.name); });
    out.schemaHome = [...new Set(schemaOfDoc(new DOMParser().parseFromString(html, 'text/html')))];
  } catch (e) {}
  return out;
}

// ================= Scan LITE =================
async function scanLite(origin, max) {
  let urls = [...new Set((await collectSitemap(origin)).map(norm))].slice(0, max);
  let modeLabel = 'Lite (sitemap)';
  if (!urls.length) { prog('Aucun sitemap : exploration des liens...'); urls = (await discoverByCrawl(origin, max)).slice(0, max); modeLabel = 'Lite (crawl liens)'; }
  if (!urls.length) return null;
  const pages = {}, inCount = {}, schemaSeen = new Set(); const parser = new DOMParser(); let done = 0;
  for (let i = 0; i < urls.length; i += 6) {
    await Promise.all(urls.slice(i, i + 6).map(async u => {
      try {
        const r = await fetch(u, { credentials: 'omit', redirect: 'follow' });
        const rec = { status: r.status };
        if (r.ok) {
          const doc = parser.parseFromString(await r.text(), 'text/html');
          rec.title = ((doc.querySelector('title') || {}).textContent || '').trim();
          rec.h1n = doc.querySelectorAll('h1').length;
          const md = doc.querySelector('meta[name="description"]'); rec.md = (md && md.getAttribute('content')) || '';
          const can = doc.querySelector('link[rel="canonical"]'); rec.can = (can && can.getAttribute('href')) || '';
          schemaOfDoc(doc).forEach(x => schemaSeen.add(x));
          doc.querySelectorAll('a[href]').forEach(a => { let h = a.getAttribute('href') || ''; if (h.startsWith('#') || h.startsWith('mailto:') || h.startsWith('tel:')) return; if (h.startsWith('/')) h = origin + h; if (h.startsWith(origin)) { const t = norm(h); if (t !== u) inCount[t] = (inCount[t] || 0) + 1; } });
        }
        pages[u] = rec;
      } catch (e) { pages[u] = { status: 'ERR' }; }
      prog('Analyse ' + (++done) + '/' + urls.length + '...');
    }));
  }
  const arr = Object.entries(pages), short = u => u.replace(origin, '') || '/';
  const f = buildFindings(origin, modeLabel, urls.length,
    arr.filter(([, p]) => p.status !== 200).map(([u, p]) => ({ url: short(u), status: p.status })),
    arr.filter(([, p]) => p.status === 200 && p.h1n !== 1).map(([u, p]) => ({ url: short(u), h1n: p.h1n })),
    dupTitles(arr, short),
    arr.filter(([, p]) => p.status === 200 && !p.md).map(([u]) => short(u)),
    arr.filter(([u, p]) => p.status === 200 && (inCount[u] || 0) < 3).map(([u]) => ({ url: short(u), metric: (inCount[u] || 0) + ' entrant(s)' })).sort((a, b) => parseInt(a.metric) - parseInt(b.metric)),
    'liens entrants',
    arr.filter(([, p]) => p.status === 200).map(([u, p]) => ({ url: short(u), issues: qcTitle(p.title) })).filter(x => x.issues.length),
    null, null);
  f.canonMissing = arr.filter(([, p]) => p.status === 200 && !p.can).map(([u]) => short(u));
  f.canonOther = arr.filter(([u, p]) => p.status === 200 && p.can && norm(p.can) !== u).map(([u, p]) => ({ url: short(u), canonical: short(norm(p.can)) }));
  f._schema = [...schemaSeen]; f._urls = urls;
  return f;
}

function dupTitles(arr, short) {
  const m = {}; arr.forEach(([u, p]) => { if (p.title) (m[p.title] = m[p.title] || []).push(short(u)); });
  return Object.entries(m).filter(([, us]) => us.length > 1).map(([t, us]) => ({ title: t, count: us.length, urls: us }));
}
function buildFindings(origin, mode, scanned, broken, h1bad, dup, mdMiss, weak, weakLabel, qc, cwv, schemaErr) {
  const f = { origin, mode, scanned, date: new Date().toLocaleString('fr-FR'), broken, h1bad, dup, mdMiss, weak, weakLabel, qc, cwv, schemaErr };
  return f;
}
async function finalize(f, home) {
  f.dr = drValue != null ? drValue : await fetchDR(f.origin);
  f.tech = home.tech; f.gen = home.gen; f.server = home.server; f.scripts = home.scripts;
  f.schemaPresent = [...new Set([...(f._schema || []), ...home.schemaHome])].filter(x => x !== '@context').sort();
  f.siteType = inferType(f._urls || [], f.tech, f.schemaPresent);
  f.schemaMissing = (EXPECT[f.siteType] || []).filter(x => !f.schemaPresent.map(s => s.toLowerCase()).includes(x.toLowerCase()));
  f.sitemapCount = sitemapTotal;
  const w = f.broken.length * 3 + f.h1bad.length * 2 + f.dup.length + f.mdMiss.length + f.weak.length + f.qc.length + (f.cwv ? f.cwv.length : 0) + (f.schemaErr ? f.schemaErr.length : 0) + f.canonMissing.length + f.canonOther.length + f.schemaMissing.length;
  f.score = Math.max(0, Math.round(100 - (w / Math.max(1, f.scanned)) * 20));
  f.prio = {
    p1: f.broken.length + f.h1bad.length + f.canonOther.length,
    p2: f.weak.length + f.dup.length + f.mdMiss.length + f.canonMissing.length + f.schemaMissing.length,
    p3: f.qc.length + (f.cwv ? f.cwv.length : 0) + (f.schemaErr ? f.schemaErr.length : 0)
  };
  return f;
}

// ================= Orchestration =================
async function runScan() {
  let origin; try { origin = new URL($('domain').value.trim()).origin; } catch (e) { prog('URL invalide (ex : https://exemple.fr)'); return; }
  const scanAll = $('scanAll').checked;
  const max = scanAll ? 100000 : Math.min(5000, Math.max(5, parseInt($('maxPages').value) || 50));
  const btn = $('scanBtn'); btn.disabled = true;
  $('results').innerHTML = ''; $('summary').style.display = 'none'; $('scoreband').style.display = 'none';
  ['pdfBtn', 'csvBtn', 'copyBtn'].forEach(b => $(b).style.display = 'none'); $('note').textContent = '';
  let f = null, noteExtra = '';
  try {
    prog('Analyse de la page d\'accueil (techno, scripts)...');
    const home = await analyzeHomepage(origin);
    f = await scanLite(origin, max);
    if (f) await finalize(f, home);
  } catch (e) { prog('Erreur : ' + e.message); btn.disabled = false; return; }
  if (!f) { prog('Impossible de récupérer des pages (ni sitemap, ni liens accessibles). Le site bloque peut-être les requêtes.'); btn.disabled = false; return; }
  render(f, noteExtra);
  saveCache(f);
  btn.disabled = false; btn.textContent = 'Relancer';
}

// ================= Rendu =================
function render(f, noteExtra) {
  f.brand = $('brand').value.trim();
  prog(f.scanned + ' pages analysées - ' + f.mode + (f.sitemapCount ? ' (sitemap : ' + f.sitemapCount + ')' : ''));
  const cls = f.score >= 80 ? 'g' : f.score >= 55 ? 'a' : 'r';
  $('scoreband').style.display = 'flex';
  $('scoreband').innerHTML = `<div class="s ${cls}">${f.score}</div><div><div class="l">Score on-site</div>
    <div style="font-size:11.5px;margin-top:2px"><span class="badge r">${f.prio.p1} P1</span> <span class="badge a">${f.prio.p2} P2</span> <span class="badge a">${f.prio.p3} P3</span></div></div>`;
  const chips = [['g', f.scanned, 'pages'], ['r', f.broken.length, '404'], ['r', f.h1bad.length, 'H1 KO'], ['a', f.canonMissing.length + f.canonOther.length, 'canonical'], ['a', f.qc.length, 'QC balises'], ['a', f.dup.length, 'titles dup.'], ['a', f.mdMiss.length, 'meta manq.'], ['a', f.weak.length, 'maillage'], ['a', f.schemaMissing.length, 'schema manq.']];
  if (f.cwv) chips.push(['a', f.cwv.length, 'CWV']);
  $('summary').style.display = 'flex';
  $('summary').innerHTML = chips.map(([c, n, l]) => `<div class="chip ${n ? c : 'g'}"><div class="n">${n}</div><div class="l">${esc(l)}</div></div>`).join('');

  const block = (title, items, sev) => !items.length
    ? `<div class="sec">${esc(title)}</div><div class="row"><div class="mini" style="color:#16a34a">Rien à signaler</div><span class="badge g">OK</span></div>`
    : `<div class="sec">${esc(title)} (${items.length})</div>` + items.slice(0, 60).map(x => `<div class="row"><div class="mini">${x}</div><span class="badge ${sev}">${badgeTxt(sev)}</span></div>`).join('') + (items.length > 60 ? `<div class="note">... +${items.length - 60} autres (voir PDF/CSV)</div>` : '');
  const A = p => `<a href="${esc(f.origin + p)}" target="_blank" rel="noopener" class="lnk">${esc(p)}</a>`;

  let html = `<div class="sec">Contexte technique</div>
    <div class="row"><div class="mini" style="color:#1f2733"><b>Domain Rating (Ahrefs) :</b> ${f.dr == null ? 'n/a' : f.dr} / 100</div></div>
    <div class="row"><div class="mini" style="color:#1f2733"><b>Type détecté :</b> ${esc(f.siteType)}</div></div>
    <div class="row"><div class="mini" style="color:#1f2733"><b>Techno :</b> ${esc(f.tech.join(', ') || 'non identifiée')}${f.gen ? ' &middot; ' + esc(f.gen) : ''}${f.server ? ' &middot; ' + esc(f.server) : ''}</div></div>
    <div class="row"><div class="mini" style="color:#1f2733"><b>Scripts tiers :</b> ${esc(f.scripts.join(', ') || 'aucun détecté')}</div></div>
    <div class="row"><div class="mini" style="color:#1f2733"><b>Schema présents :</b> ${esc(f.schemaPresent.join(', ') || 'aucun')}</div></div>`;
  html += block('Schema recommandés manquants (type : ' + f.siteType + ')', f.schemaMissing.map(esc), 'a');
  html += block('Pages en erreur (404)', f.broken.map(x => A(x.url) + '  →  ' + esc(String(x.status)) + (x.foundOn ? '  (lié depuis ' + A(x.foundOn) + ')' : '')), 'r');
  html += block('H1 manquant / multiple', f.h1bad.map(x => A(x.url) + '  →  ' + x.h1n + ' H1'), 'r');
  html += block('Canonical vers une AUTRE URL', f.canonOther.map(x => A(x.url) + '  →  ' + A(x.canonical)), 'r');
  html += block('Canonical manquante', f.canonMissing.map(A), 'a');
  html += block('QC balises title', f.qc.map(x => A(x.url) + '  →  ' + esc(x.issues.join(', '))), 'a');
  html += block('Titles dupliqués', f.dup.map(x => esc(x.title.slice(0, 55)) + '  →  ' + x.count + (x.urls ? ' : ' + x.urls.map(A).join(' ') : '')), 'a');
  html += block('Meta description manquante', f.mdMiss.map(A), 'a');
  html += block('Pages sous-maillées (' + f.weakLabel + ')', f.weak.map(x => A(x.url) + '  →  ' + esc(x.metric)), 'a');
  if (f.cwv) html += block('Core Web Vitals à améliorer', f.cwv.map(x => A(x.url) + '  →  LCP ' + x.lcp + 'ms / CLS ' + x.cls), 'a');
  if (f.schemaErr) html += block('Schema.org en erreur', f.schemaErr.map(x => A(x.url) + '  →  ' + x.n + ' erreur(s)'), 'a');
  $('results').innerHTML = html;

  lastData = f; lastReport = buildText(f); lastCsv = buildCsv(f);
  ['pdfBtn', 'csvBtn', 'copyBtn'].forEach(b => $(b).style.display = 'block');
  $('note').textContent = 'Scan basé sur le HTML serveur. Clique une URL pour l\'ouvrir. Domain Rating by Ahrefs.';
}

// ================= Export =================
function buildText(f) {
  const L = (t, items) => `\n== ${t} (${items.length}) ==\n` + (items.length ? items.map(x => '- ' + x).join('\n') : 'Rien à signaler');
  return `Audit SEO ${f.origin} [${f.mode}] - score ${f.score}/100\n${f.scanned} pages analysées${f.sitemapCount ? ' / ' + f.sitemapCount + ' au sitemap' : ''} - ${f.date}\n` +
    `DR Ahrefs: ${f.dr == null ? 'n/c' : f.dr}/100 | Type: ${f.siteType} | Techno: ${f.tech.join(', ') || '?'}${f.gen ? ' (' + f.gen + ')' : ''} | Serveur: ${f.server || '?'}\n` +
    `Scripts tiers: ${f.scripts.join(', ') || 'aucun'}\nSchema presents: ${f.schemaPresent.join(', ') || 'aucun'}` +
    L('Schema recommandes manquants', f.schemaMissing) +
    L('404', f.broken.map(x => `${x.url} -> ${x.status}`)) +
    L('H1 KO', f.h1bad.map(x => `${x.url} -> ${x.h1n} H1`)) +
    L('Canonical vers autre URL', f.canonOther.map(x => `${x.url} -> ${x.canonical}`)) +
    L('Canonical manquante', f.canonMissing) +
    L('QC balises', f.qc.map(x => `${x.url} -> ${x.issues.join(', ')}`)) +
    L('Titles dupliques', f.dup.map(x => `${x.title.slice(0, 55)} -> ${x.count}`)) +
    L('Meta manquante', f.mdMiss) +
    L('Sous-maillees', f.weak.map(x => `${x.url} -> ${x.metric}`)) +
    (f.cwv ? L('CWV', f.cwv.map(x => `${x.url} -> LCP ${x.lcp} CLS ${x.cls}`)) : '') +
    (f.schemaErr ? L('Schema erreurs', f.schemaErr.map(x => `${x.url} -> ${x.n}`)) : '');
}
function csvRow(a) { return a.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',') + '\n'; }
function buildCsv(f) {
  let c = csvRow(['Catégorie', 'URL / Élément', 'Détail']);
  c += csvRow(['Contexte', 'Domain Rating (Ahrefs)', f.dr == null ? 'n/c' : f.dr]);
  c += csvRow(['Contexte', 'Type', f.siteType]);
  c += csvRow(['Contexte', 'Techno', f.tech.join(' | ') + (f.gen ? ' (' + f.gen + ')' : '')]);
  c += csvRow(['Contexte', 'Serveur', f.server]);
  c += csvRow(['Contexte', 'Scripts tiers', f.scripts.join(' | ')]);
  c += csvRow(['Contexte', 'Schema présents', f.schemaPresent.join(' | ')]);
  f.schemaMissing.forEach(x => c += csvRow(['Schema manquant', x, 'recommandé pour ' + f.siteType]));
  f.broken.forEach(x => c += csvRow(['404', x.url, x.status + (x.foundOn ? ' (lié depuis ' + x.foundOn + ')' : '')]));
  f.h1bad.forEach(x => c += csvRow(['H1 KO', x.url, x.h1n + ' H1']));
  f.canonOther.forEach(x => c += csvRow(['Canonical autre URL', x.url, '→ ' + x.canonical]));
  f.canonMissing.forEach(u => c += csvRow(['Canonical manquante', u, '']));
  f.qc.forEach(x => c += csvRow(['QC balise', x.url, x.issues.join(' | ')]));
  f.dup.forEach(x => c += csvRow(['Title dupliqué', x.title, x.count + ' pages : ' + x.urls.join(' ')]));
  f.mdMiss.forEach(u => c += csvRow(['Meta manquante', u, '']));
  f.weak.forEach(x => c += csvRow(['Sous-maillée', x.url, x.metric]));
  if (f.cwv) f.cwv.forEach(x => c += csvRow(['CWV', x.url, 'LCP ' + x.lcp + ' / CLS ' + x.cls]));
  if (f.schemaErr) f.schemaErr.forEach(x => c += csvRow(['Schema erreur', x.url, x.n + ' erreur(s)']));
  return c;
}
function downloadCsv() {
  if (!lastCsv) return;
  const blob = new Blob(['﻿' + lastCsv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'audit-' + lastData.origin.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '-') + '.csv';
  a.click(); flash('csvBtn', '✓', '⬇ CSV');
}
