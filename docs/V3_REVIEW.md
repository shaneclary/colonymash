# Colony Mash V3 — review build

**Route:** /V3 (uppercase V is intentional)
**Branch:** feature/v3-flavor-universe
**Status:** Review-only preview. Not ready for public advertising or online payments.

## Features for review
1. Distinctive editorial hero with the existing Colony Mash color system (beer stays grayscale; seltzer owns color).
2. Interactive Flavor DNA explorer (category and interest), deterministic explainable results using published product names and beer styles; never unverified tasting claims.
3. Searchable 35-release archive with individual product links and cans/kegs inquiry deep links.
4. Browser-local Flavor Passport (favorites) — not a drinking score, consumption tracker or loyalty program.
5. Cabana Lab concept builder for combinations of fruit and accents with share-by-copy and private local idea board. No vote is submitted to the brewery.
6. Release Radar UI with no invented drops or times, links to disabled messaging preview.
7. Keg concierge CTA using existing /order inquiry workflow. County 3+ and regional 5+ keg tiers clearly marked proposed / unconfirmed.
8. Responsive, keyboard-operated controls, accessible state announcements and reduced-motion handling.

## Integrity of features
- All V3 interactions except navigation run only in the customer's browser.
- No customer accounts, real voting, centrally saved favorites, analytics, SMS alerts, checkout, inventory sync, live launch calendar or payment processing exist in this preview.
- Local browser storage key: colony-mash-v3-exploration.
- Flavor matching is based on literal name / listed style, not verified sensory notes. Erik must supply rich attributes before taste-based claims or AI recommendations are made.
- /V3 is not in the global navigation; it is noindex and is absent from the sitemap. The current V1/V2 homepage remains unchanged.

## Acceptance checks
- Run: npm ci; npm test; npm run typecheck; npm run build (Node 22.18+).
- Test /V3 in Vercel preview on iPhone width (375px), tablet, and desktop.
- Confirm saved releases survive reload and that favorites clear on removal.
- Try all Flavor DNA modes: same-type and wildcard recommendations, name/style matching.
- Try all archive tabs and search; check empty-state behavior.
- Create and remove a Lab concept; copy a concept to the clipboard.
- Check the site has no purchase button claiming a real paid checkout.
- Review tab/focus order, accessible button names, contrast, age gate, and sticky internal navigation.

## Next phase, once Erik confirms
- Verified tasting and ingredient data per SKU; photos and brand assets.
- Authentication and server-backed profile storage with privacy controls if needed.
- Moderated and rate-limited idea submissions; consent and IP permissions for co-creation.
- Verified, chronological release data from brewery-owned CMS/POS.
- Staff-facing tapboard and packaged inventory, merchant checkout, legal age / ID verification and licensed delivery configuration.
- Opt-in communications with provider support, privacy notice and compliant age verification.

Do not merge or deploy V3 to the live domain before owner approval and QA.
