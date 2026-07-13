# 📋 Changelog

Toutes les évolutions notables de l'extension sont consignées ici (une entrée à chaque changement). Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/), versions selon [SemVer](https://semver.org/lang/fr/).

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
