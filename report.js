// Rapport client brandé : contexte technique, score, priorisation, recommandations, détail + PDF
const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };

const RECO = {
  broken: ["PRIO 1", "Liens internes cassés", "Corriger chaque lien vers la bonne URL cible et poser une redirection 301 des anciennes adresses."],
  h1bad: ["PRIO 1", "Balise H1", "Un seul H1 par page. Ajouter un H1 aux pages qui n'en ont pas, corriger le gabarit des pages multi-H1."],
  canonOther: ["PRIO 1", "Canonical vers une autre URL", "Ces pages se déclarent copies d'une autre URL et risquent de ne pas être indexées. Vérifier que la canonical est auto-référente (sauf duplication volontaire)."],
  weak: ["PRIO 2", "Maillage interne", "Renforcer les liens entrants des pages sous-maillées : 3 à 5 liens contextuels depuis des pages proches."],
  dup: ["PRIO 2", "Titles dupliqués", "Rendre chaque title unique : deux pages avec le même title se cannibalisent."],
  mdMiss: ["PRIO 2", "Meta descriptions", "Rédiger une meta description par page (mot-clé + accroche + appel à l'action)."],
  canonMissing: ["PRIO 2", "Canonical manquante", "Ajouter une canonical auto-référente sur chaque page (évite le duplicate lié aux paramètres/variantes d'URL)."],
  schemaMissing: ["PRIO 2", "Données structurées manquantes", "Ajouter les schema.org attendus pour ce type de site pour viser les résultats enrichis Google."],
  qc: ["PRIO 3", "Qualité des balises title", "Nettoyer les titles : éviter 'Accueil'/'Home', le tiret cadratin et le vocabulaire creux ; viser 50-60 caractères, mot-clé en premier."],
  cwv: ["PRIO 3", "Core Web Vitals", "Optimiser les pages lentes (LCP > 2,5 s) ou instables (CLS > 0,1)."],
  schemaErr: ["PRIO 3", "Erreurs schema.org", "Corriger les erreurs de balisage signalées pour préserver l'éligibilité aux rich results."]
};

chrome.storage.local.get('auditReport', ({ auditReport: f }) => {
  if (!f) { document.getElementById('app').textContent = "Aucun rapport. Relance un scan depuis l'extension."; return; }
  const cls = f.score >= 80 ? 'g' : f.score >= 55 ? 'a' : 'r';
  const card = (c, n, l) => `<div class="card ${n ? c : 'g'}"><div class="n">${n}</div><div class="l">${esc(l)}</div></div>`;
  const tbl = (rows, cols) => rows.length ? `<table><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>` : `<div class="ok">✓ Rien à signaler</div>`;
  const short = p => `<a href="${esc(f.origin + p)}" target="_blank" rel="noopener" class="lnk">${esc(p)}</a>`, brand = f.brand ? esc(f.brand) : '';

  const cats = [['broken', f.broken.length], ['h1bad', f.h1bad.length], ['canonOther', f.canonOther.length], ['weak', f.weak.length], ['dup', f.dup.length], ['mdMiss', f.mdMiss.length], ['canonMissing', f.canonMissing.length], ['schemaMissing', f.schemaMissing.length], ['qc', f.qc.length], ['cwv', f.cwv ? f.cwv.length : 0], ['schemaErr', f.schemaErr ? f.schemaErr.length : 0]];
  const order = { 'PRIO 1': 0, 'PRIO 2': 1, 'PRIO 3': 2 };
  const recoRows = cats.filter(([k, n]) => n > 0).sort((a, b) => order[RECO[a[0]][0]] - order[RECO[b[0]][0]]).map(([k, n]) => {
    const [prio, titre, txt] = RECO[k]; const pc = prio === 'PRIO 1' ? 'r' : prio === 'PRIO 2' ? 'a' : 'i';
    return `<tr><td><span class="tag ${pc}">${prio}</span></td><td><b>${esc(titre)}</b> (${n})<div class="rtxt">${esc(txt)}</div></td></tr>`;
  });

  document.getElementById('app').innerHTML = `
    <div class="head">
      ${brand ? `<div class="brand">${brand}</div>` : ''}
      <h1>Rapport d'audit SEO on-site</h1>
      <div class="u">${esc(f.origin)}</div>
      <div class="d">${f.scanned} pages analysées${f.sitemapCount ? ' (sitemap : ' + f.sitemapCount + ')' : ''} &middot; ${esc(f.mode)} &middot; ${esc(f.date)}</div>
    </div>
    <div class="toolbar"><button onclick="window.print()">📄 Enregistrer en PDF / Imprimer</button></div>

    <div class="scorewrap">
      <div class="scorebig ${cls}">${f.score}<span>/100</span></div>
      <div class="prio">
        <div><span class="tag r">PRIO 1</span> ${f.prio.p1} bloquant(s)</div>
        <div><span class="tag a">PRIO 2</span> ${f.prio.p2} à améliorer</div>
        <div><span class="tag i">PRIO 3</span> ${f.prio.p3} finition</div>
      </div>
    </div>

    <h2>Contexte technique</h2>
    <table><tbody>
      <tr><td style="width:170px"><b>Domain Rating (Ahrefs)</b></td><td>${f.dr == null ? 'n/c' : f.dr} / 100</td></tr>
      <tr><td><b>Type de site détecté</b></td><td>${esc(f.siteType)}</td></tr>
      <tr><td><b>Technologie</b></td><td>${esc(f.tech.join(', ') || 'non identifiée')}${f.gen ? ' &middot; ' + esc(f.gen) : ''}</td></tr>
      <tr><td><b>Serveur</b></td><td>${esc(f.server || 'n/c')}</td></tr>
      <tr><td><b>Scripts tiers</b></td><td>${esc(f.scripts.join(', ') || 'aucun détecté')}</td></tr>
      <tr><td><b>Schema.org présents</b></td><td>${esc(f.schemaPresent.join(', ') || 'aucun')}</td></tr>
      <tr><td><b>Schema recommandés manquants</b></td><td>${f.schemaMissing.length ? '<span class="tag a">' + f.schemaMissing.map(esc).join('</span> <span class="tag a">') + '</span>' : '<span class="ok">✓ complet</span>'}</td></tr>
    </tbody></table>

    <div class="cards">
      ${card('g', f.scanned, 'pages')}${card('r', f.broken.length, '404')}${card('r', f.h1bad.length, 'H1 KO')}
      ${card('r', f.canonOther.length, 'canonical autre')}${card('a', f.canonMissing.length, 'canonical manq.')}
      ${card('a', f.qc.length, 'QC balises')}${card('a', f.dup.length, 'titles dupl.')}${card('a', f.mdMiss.length, 'meta manq.')}
      ${card('a', f.weak.length, 'sous-maillées')}${card('a', f.schemaMissing.length, 'schema manq.')}${f.cwv ? card('a', f.cwv.length, 'CWV') : ''}
    </div>

    <h2>Synthèse &amp; recommandations</h2>
    ${tbl(recoRows, ['Priorité', 'Recommandation'])}

    <h2>Pages en erreur (404) <span class="cnt">${f.broken.length}</span></h2>
    ${tbl(f.broken.map(x => `<tr><td class="u">${short(x.url)}</td><td><span class="tag r">${esc(x.status)}</span></td><td class="u">${x.foundOn ? 'lié depuis ' + short(x.foundOn) : ''}</td></tr>`), ['URL', 'Code', 'Source'])}

    <h2>H1 manquant / multiple <span class="cnt">${f.h1bad.length}</span></h2>
    ${tbl(f.h1bad.map(x => `<tr><td class="u">${short(x.url)}</td><td><span class="tag r">${x.h1n} H1</span></td></tr>`), ['URL', 'H1'])}

    <h2>Canonical pointant vers une autre URL <span class="cnt">${f.canonOther.length}</span></h2>
    ${tbl(f.canonOther.map(x => `<tr><td class="u">${short(x.url)}</td><td class="u">→ ${short(x.canonical)}</td></tr>`), ['URL', 'Canonical déclarée'])}

    <h2>Canonical manquante <span class="cnt">${f.canonMissing.length}</span></h2>
    ${tbl(f.canonMissing.map(u => `<tr><td class="u">${short(u)}</td></tr>`), ['URL'])}

    <h2>QC balises title <span class="cnt">${f.qc.length}</span></h2>
    ${tbl(f.qc.map(x => `<tr><td class="u">${short(x.url)}</td><td>${esc(x.issues.join(', '))}</td></tr>`), ['URL', 'Problèmes'])}

    <h2>Titles dupliqués <span class="cnt">${f.dup.length}</span></h2>
    ${tbl(f.dup.map(x => `<tr><td>${esc(x.title)}</td><td><span class="tag a">${x.count}</span></td><td class="u">${x.urls.map(short).join('<br>')}</td></tr>`), ['Title', 'Nb', 'URLs'])}

    <h2>Meta description manquante <span class="cnt">${f.mdMiss.length}</span></h2>
    ${tbl(f.mdMiss.map(u => `<tr><td class="u">${short(u)}</td></tr>`), ['URL'])}

    <h2>Pages sous-maillées - ${esc(f.weakLabel)} <span class="cnt">${f.weak.length}</span></h2>
    ${tbl(f.weak.map(x => `<tr><td class="u">${short(x.url)}</td><td><span class="tag a">${esc(x.metric)}</span></td></tr>`), ['URL', 'Métrique'])}
    ${f.cwv ? `<h2>Core Web Vitals à améliorer <span class="cnt">${f.cwv.length}</span></h2>` + tbl(f.cwv.map(x => `<tr><td class="u">${short(x.url)}</td><td>LCP ${x.lcp} ms</td><td>CLS ${x.cls}</td></tr>`), ['URL', 'LCP', 'CLS']) : ''}
    ${f.schemaErr ? `<h2>Schema.org en erreur <span class="cnt">${f.schemaErr.length}</span></h2>` + tbl(f.schemaErr.map(x => `<tr><td class="u">${short(x.url)}</td><td><span class="tag a">${x.n} erreur(s)</span></td></tr>`), ['URL', 'Erreurs']) : ''}

    <a class="promo" href="https://www.linkuma.com" target="_blank" rel="noopener">Des pages sous-maillées ou à renforcer ? <b>Linkuma</b> - la plateforme de backlinks dès 5€ &middot; linkuma.com</a>
    <div class="foot">${brand ? brand + ' &middot; ' : ''}Audit SEO on-site &middot; ${esc(f.origin)} &middot; ${esc(f.date)} &middot; Domain Rating by Ahrefs</div>
  `;
  setTimeout(() => window.print(), 450);
});
