# Audit SEO on-site (crawl sitemap)

Extension Chrome (Manifest V3) qui audite un site entier via son `sitemap.xml`, en un clic, sans backend ni compte. Tout tourne en local dans le navigateur.

## Ce qu'elle vérifie

- **Pages en erreur** (404 / non 200)
- **Balises H1** manquantes ou multiples
- **Canonicals** manquantes ou pointant vers une autre URL
- **Titles dupliqués** entre pages
- **Meta descriptions** manquantes
- **Maillage interne** : pages sous-liées (< 3 liens entrants)
- **QC balises title** : "Accueil/Home", tiret cadratin, longueur, vocabulaire marketing creux
- **Techno du site** : WordPress, Next.js, Shopify, Wix, PrestaShop, Drupal... (+ header serveur, meta generator)
- **Scripts tiers** : Google Analytics, GTM, Microsoft Clarity, Meta Pixel, Hotjar, Matomo, HubSpot, gestion cookies...
- **Schema.org selon le type de site** : détecte le type (ecommerce / SaaS / blog / local / vitrine) et liste les schema recommandés **manquants**
- **Score on-site** + priorisation PRIO 1/2/3

## Exports

- **Rapport PDF** brandé (marque optionnelle), avec synthèse, recommandations et détail complet des URLs
- **CSV** (pour tableur)
- **Copier en texte**

Toutes les URLs des résultats sont **cliquables**.

## Installation (mode développeur)

1. Télécharger / cloner ce dossier
2. Ouvrir `chrome://extensions`
3. Activer le **Mode développeur** (en haut à droite)
4. **Charger l'extension non empaquetée** → sélectionner ce dossier
5. Épingler l'icône, ouvrir un site, cliquer sur l'extension

## Utilisation

1. Le domaine de l'onglet actif est pré-rempli (modifiable). Le nombre de pages du sitemap s'affiche au clic.
2. Cocher **"Tout le site"** pour tout scanner, ou fixer une limite de pages.
3. **Scanner** → résultats + score, puis **Rapport PDF** / **CSV** / **Copier**.

## Confidentialité

L'extension **ne collecte, ne stocke et n'envoie aucune donnée** vers un serveur tiers. Les requêtes vont uniquement vers le site que vous auditez (lecture du sitemap et des pages). Aucun tracking, aucune télémétrie. Le rapport reste dans votre navigateur.

## Limites

- Le scan lit le **HTML renvoyé par le serveur**. Sur un site 100% JavaScript non pré-rendu (SPA sans SSR), le comptage H1/schema peut différer du rendu final : vérifier la page concernée dans le navigateur.
- Les détections techno / scripts se font sur la **page d'accueil** (signaux site-wide).
- Requêtes par lots pour rester poli avec le serveur ; un très gros site (plusieurs milliers de pages) prend quelques minutes.

## 📋 Changelog

Historique complet dans [CHANGELOG.md](CHANGELOG.md). Dernières versions :

- **1.4.2** - 🗺️ Détection sitemap robuste (robots.txt, `<loc>` multi-ligne, CDATA, chemins non standards) + 🕸️ fallback crawl des liens si aucun sitemap
- **1.4.1** - 🧹 Retrait de la bannière promo du popup
- **1.4.0** - 🎉 Première version publique (checks on-site complets, techno, scripts, schema par type, PDF/CSV, "Tout le site")

## Auteur

**EL GNANI Mohamed** - CEO [Linkuma](https://www.linkuma.com), la plateforme de backlinks low cost (netlinking à partir de 5€, sans engagement).

## Licence

MIT - voir [LICENSE](LICENSE). Libre d'utilisation, de modification et de partage.
