# 📋 Changelog

Toutes les évolutions notables de l'extension sont consignées ici (une entrée à chaque changement). Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/), versions selon [SemVer](https://semver.org/lang/fr/).

## [1.6.0] - 2026-07-13
### ✨ Ajouté
- 💾 **Cache par domaine** : le dernier scan d'un site s'affiche instantanément à l'ouverture ("📦 dernier scan il y a X"), plus besoin de recrawler à chaque fois. Le bouton "Relancer" refait un scan frais. DR et compteur sitemap toujours rafraîchis en direct. (LRU 12 domaines, pas de cache au-delà de 1500 pages)
### 🐛 Corrigé
- 🏷️ Type de site : ne classe plus en "ecommerce" les sites qui ont juste le plugin WooCommerce (ou la page /panier auto-générée). L'ecommerce exige désormais de vraies preuves (schema Product, plusieurs URLs produit/boutique, ou plateforme dédiée Shopify/PrestaShop). Les sites de contenu (blog, /tips, guides) sont correctement classés "blog / média".

## [1.5.0] - 2026-07-13
### ✨ Ajouté
- 📈 **Domain Rating (Ahrefs)** affiché en évidence dès l'ouverture de l'extension (barre dédiée color-codée : rouge / orange / vert), via l'endpoint public gratuit d'Ahrefs (sans clé API)
- 📈 DR repris dans le contexte technique, le rapport PDF et l'export CSV, avec l'attribution "Domain Rating by Ahrefs"

## [1.4.2] - 2026-07-13
### 🐛 Corrigé
- 🗺️ Détection du sitemap bien plus robuste : lecture des directives `Sitemap:` du `robots.txt` et test de chemins non standards (`sitemap-index.xml`, `wp-sitemap.xml`, `sitemap/sitemap.xml`...)
- 🧩 Gestion des balises `<loc>` sur plusieurs lignes et des URLs encapsulées en `CDATA` (WordPress All in One SEO, etc.)
- 🌐 Filtrage des URLs par nom d'hôte (`sameHost`) au lieu de `startsWith` : règle le piège www / non-www
### ✨ Ajouté
- 🕸️ Fallback : si aucun sitemap n'est trouvé, l'extension explore les liens depuis la page d'accueil (crawl BFS) jusqu'à la limite choisie

## [1.4.1] - 2026-07-13
### 🔧 Modifié
- 🧹 Retrait de la bannière promo dans le popup (conservée uniquement dans le rapport PDF)

## [1.4.0] - 2026-07-13
### 🎉 Première version publique
- 🔗 URLs cliquables dans tous les résultats
- 🩺 Checks : 404, H1 manquant/multiple, canonicals (manquante / vers autre URL), titles dupliqués, meta description manquante, maillage interne (pages sous-liées)
- 🏷️ QC balises title : "Accueil/Home", tiret cadratin, longueur, vocabulaire marketing creux
- 🧱 Détection techno du site (WordPress, Next.js, Shopify, Wix, PrestaShop...) + scripts tiers (Google Analytics, GTM, Microsoft Clarity, Meta Pixel, Hotjar...)
- 🧬 Schema.org présents + recommandés manquants selon le type de site (ecommerce / SaaS / blog / local / vitrine)
- 📊 Score on-site + priorisation PRIO 1 / 2 / 3
- 📄 Rapport PDF brandé, ⬇️ export CSV, 📋 copie texte
- 🌍 Option "Tout le site" (scan complet du sitemap) + compteur de pages au clic
- 🔒 100% local : aucune donnée envoyée à un serveur tiers
