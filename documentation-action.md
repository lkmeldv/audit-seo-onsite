# Documentation Actions - Extension Audit SEO on-site

> Mémoire persistante du projet. MAJ à chaque changement code. Lecture en début de session.
> Repo public : https://github.com/lkmeldv/audit-seo-onsite - Code local : `~/Documents/code-brouillon/audit-seo-extension/`

## Vue d'ensemble de l'archi

Extension Chrome Manifest V3, 100% cliente (aucun backend, aucune donnée envoyée à un tiers sauf l'appel DR Ahrefs public).

```
[Clic sur l'icône]
      |
      v
  popup.html  ---- affiche : barre Domain Rating, champ domaine, options, résultats
      |
  popup.js  (logique)
      |-- à l'ouverture : loadCache(origin) + showSitemapCount(origin) + showDR(origin)
      |-- au Scan :
      |     collectSitemap(origin)  --> robots.txt (Sitemap:) + chemins fallback + parse <loc> (multi-ligne, CDATA)
      |         |  si vide --> discoverByCrawl(origin) (BFS depuis la home)
      |     analyzeHomepage(origin) --> techno + scripts tiers + schema HP
      |     fetch de chaque page (lots de 6) --> title/H1/meta/canonical/schema/liens internes
      |     finalize() --> DR (fetchDR) + type de site (inferType) + schema manquants + score + PRIO
      |     render() --> synthèse + sections (URLs cliquables)
      |     saveCache(f) --> chrome.storage.local (LRU 12 domaines, <=1500 pages)
      |
      |-- Rapport PDF : storage.local.set(auditReport) --> ouvre report.html (nouvel onglet) --> window.print()
      |-- CSV : Blob download
      |-- Copier texte : clipboard
```

## Composants

### popup.html + popup.js (coeur)
- `popup.html` : UI (barre DR color-codée, domaine pré-rempli, case "Tout le site", limite pages, marque, boutons PDF/CSV/Copier).
- `popup.js` : tout le moteur. Fonctions clés :
  - `collectSitemap` / `sitemapCandidates` : détection robuste (robots.txt d'abord, puis /sitemap.xml, /sitemap-index.xml, /wp-sitemap.xml...).
  - `parseLocs` : extrait les `<loc>` (gère multi-ligne + CDATA).
  - `discoverByCrawl` : fallback BFS depuis la home si aucun sitemap.
  - `analyzeHomepage` : techno (TECH_SIGS), scripts tiers (SCRIPT_SIGS), schema HP, header serveur, meta generator.
  - `qcTitle` : QC balises (Accueil/Home, tiret cadratin, longueur, vocabulaire creux).
  - `inferType` : type de site (ecommerce/saas/blog/local/vitrine) - exige de vraies preuves ecommerce (pas juste le plugin WooCommerce).
  - `fetchDR` / `showDR` : Domain Rating Ahrefs (endpoint public gratuit).
  - `finalize` : assemble DR, type, schema manquants (EXPECT par type), score, priorisation P1/P2/P3.
  - `render` / `buildText` / `buildCsv` : sorties écran / texte / CSV.
  - `saveCache` / `loadCache` : cache par domaine.

### report.html + report.js (rapport PDF)
- Ouvert dans un onglet, lit `chrome.storage.local.auditReport`, rend un rapport brandé (marque optionnelle), score, PRIO, recommandations (RECO), contexte technique (DR, techno, scripts, schema), détail complet, puis `window.print()`.

### manifest.json
- MV3. Permissions : `activeTab`, `storage`. `host_permissions: <all_urls>`. Icônes 16/48/128. `web_accessible_resources: report.html`.

## Credentials & endpoints
- **Domain Rating** : `GET https://api.ahrefs.com/v3/public/domain-rating-free?target={host}` - PUBLIC, aucune clé API. Réponse : `{domain_rating:{domain_rating, license}}`. Attribution "Domain Rating by Ahrefs" affichée partout où le DR apparaît.
- Aucun secret dans le code (volontaire, repo public).

## Comment reprendre le projet sur une autre machine
1. `git clone https://github.com/lkmeldv/audit-seo-onsite`
2. Chrome : `chrome://extensions` -> Mode développeur -> "Charger l'extension non empaquetée" -> dossier du repo.
3. Modifier les fichiers, puis **⟳ Recharger** dans chrome://extensions (Chrome garde en cache la version chargée).
4. **À chaque changement** : bump `version` dans manifest.json + ajouter une entrée dans CHANGELOG.md (emojis) + commit + push.
5. Tester une détection : `node --check popup.js` (syntaxe) + tests logique isolée en Node (regex sitemap, inferType).

## Règle d'or projet
- Zéro secret, zéro donnée privée dans le code (repo public).
- Chaque évolution = entrée CHANGELOG + bump version manifest + commit conventional + push.

---

## Historique des actions

### 2026-07-13 - v1.6.0 : cache par domaine + fix détection type
**Objectif** : éviter de recrawler à chaque ouverture ; corriger un faux positif "ecommerce".
**Action** :
- Cache par domaine dans `chrome.storage.local` (clés `c:{origin}`, index LRU `cidx` limité à 12, pas de cache au-delà de 1500 pages). `loadCache` à l'ouverture affiche le dernier scan avec son âge ("📦 il y a X") ; `saveCache` après chaque scan frais ; "Relancer" force un scan neuf. DR et compteur sitemap restent rafraîchis en direct.
- `inferType` : ecommerce exige schema Product OU >=3 URLs produit/boutique OU >=2 avec WooCommerce OU plateforme Shopify/PrestaShop. WooCommerce seul ou page /panier auto ne suffisent plus. Sites de contenu -> "blog / média".
**Vérifs** : `node --check` OK ; inferType testé (kevin-benabdelhak.fr -> blog/média, shop Woo -> ecommerce, Shopify -> ecommerce, lokt -> saas, resto -> local).
**Limites** : cache non partagé entre machines ; désactivé sur très gros sites.

### 2026-07-13 - v1.5.0 : Domain Rating Ahrefs mis en avant
Barre "Domain Rating par Ahrefs" color-codée (rouge<30 / orange<60 / vert>=60) sous l'en-tête, dès l'ouverture. Endpoint public gratuit (sans clé). DR repris dans contexte technique / PDF / CSV avec attribution.

### 2026-07-13 - v1.4.2 : détection sitemap robuste + fallback crawl
Lecture des directives `Sitemap:` du robots.txt, chemins non standards, `<loc>` multi-ligne, valeurs en CDATA, filtre par hostname (sameHost). Fallback BFS depuis la home si aucun sitemap. Testé : orpi.com (60740 URLs), homesbydavidburns.com (218 URLs).

### 2026-07-13 - v1.4.1 : retrait bannière promo popup
Bannière Linkuma retirée du popup (conservée dans le pied de page du rapport PDF).

### 2026-07-13 - v1.4.0 : première version publique + repo
Création du repo public lkmeldv/audit-seo-onsite. Checks on-site complets (404, H1, canonicals, titles dupliqués, meta, maillage, QC balises), détection techno + scripts tiers, schema par type de site, score + PRIO, rapport PDF brandé + CSV + copie texte, option "Tout le site", URLs cliquables. Icônes, README, LICENSE (MIT, EL GNANI Mohamed), CHANGELOG. CrawlObserver (ancien mode Pro) retiré pour un outil autonome sans dépendance.
