# Colony Mash website

Site for Colony Mash Brewing Co. (Atascadero, CA). Next.js App Router, React, TypeScript, plain CSS, all pages
static. Shane Clary is building it for the owners, Erik Knapp and Ethan Krout.

## Rules

- **Color is seltzer.** Every seltzer wears its own color, on tap or not (full dot and solid edge when on tap,
  empty ring and dashed edge when not). Everything else, beer included, is black, white or grey. Do not add an
  accent color, a shadow, a gradient or a rounded card.
- **No invented facts.** The site was built from public listings. Anything the owners have not confirmed gets an
  entry in `src/content/questions.ts` and a `<Confirm id="..." />` beside it. Do not add prices, tasting notes,
  events, policies or quotes that no source supports.
- **Content lives in `src/content`.** Components do not hold copy or facts.
- **Colors and type come from `design/tokens.json`.** Run `npm run tokens` after editing it. Never edit
  `src/app/tokens.css` by hand. No hex values in `site.css` or in components.
- **`src/app/components.css` is the style guide's component sheet.** Change a component there, and keep page
  layout in `site.css`.
- **Tests first for logic.** Each file in `src/lib` has a test beside it. Content guards are in
  `src/content/content.test.ts`. Files under `src/lib` and `src/content` import each other with the `.ts`
  extension so Node can run the tests directly.
- **Photos:** place, people and beer are shown in black and white (`treatment: "bw"`); seltzer is shown in color.
  Only the brewery's own photos, with a credit, and `rightsConfirmed` set honestly.
- **Do not push to `main`, deploy, or set `NEXT_PUBLIC_INDEXABLE` without Shane's OK.** `docs/LAUNCH.md` is the
  gate.

## Commands

```
npm run dev | npm test | npm run typecheck | npm run build | npm run tokens
```

## Voice

Plain and short. Say the fact, then stop. Times as "4–8 PM". ABV to one decimal. No exclamation marks, no
"craft", no "handcrafted", no puns on the skull.
