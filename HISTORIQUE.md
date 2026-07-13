# Historique - Extension Audit SEO on-site

## Releases
| Version | Date | Résumé |
|---------|------|--------|
| 1.6.0 | 2026-07-13 | 💾 Cache par domaine + 🐛 fix détection type (WooCommerce ≠ ecommerce) |
| 1.5.0 | 2026-07-13 | 📈 Domain Rating Ahrefs mis en avant à l'ouverture |
| 1.4.2 | 2026-07-13 | 🗺️ Détection sitemap robuste + 🕸️ fallback crawl liens |
| 1.4.1 | 2026-07-13 | 🧹 Retrait bannière promo popup |
| 1.4.0 | 2026-07-13 | 🎉 Première version publique + repo GitHub |

## Actions récentes (top = plus récent)

### 2026-07-13 - Doc Intelligente activée
- Création `documentation-action.md` (archi, composants, endpoints, reprise) + ce `HISTORIQUE.md`.
- Voir `documentation-action.md` pour le détail par version.

### 2026-07-13 - v1.6.0 cache + fix type
- Cache par domaine (chrome.storage, LRU 12, <=1500 pages), affichage instantané à l'ouverture, "Relancer" pour rafraîchir.
- `inferType` corrigé : ne classe plus ecommerce sur simple présence WooCommerce / page panier.
- Détail : `documentation-action.md#2026-07-13---v160`.

### 2026-07-13 - v1.5.0 Domain Rating
- Barre DR Ahrefs color-codée dès l'ouverture, repris PDF/CSV. Endpoint public sans clé.

### 2026-07-13 - v1.4.2 sitemap robuste
- robots.txt + chemins étendus + `<loc>` multi-ligne + CDATA + sameHost + fallback BFS.
- Testé : orpi.com (60740 URLs), homesbydavidburns.com (218 URLs).

### 2026-07-13 - v1.4.0 / v1.4.1 release publique
- Repo public créé, bannière promo retirée du popup, CrawlObserver retiré.
