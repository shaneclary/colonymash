# Colony Mash

The website for Colony Mash Brewing Co., a brewery and seltzery at 3164 El Camino Real, Atascadero, California.

**Status: draft.** Built from public listings while the brewery's old site was down. It is not deployed and not
indexed. Every fact the owners have not confirmed carries a dashed "Confirm" tag on the page and is listed at
`/confirm`. See `docs/LAUNCH.md` for what has to happen before it goes live.

## Run it

```
npm install
npm run dev        # http://localhost:3000
npm test           # the logic and the content guards
npm run typecheck
npm run build
```

Needs Node 22.18 or newer (the tests run TypeScript directly).

## Change something

| To change | Edit | Then |
| --- | --- | --- |
| Hours, a holiday closure | `src/content/hours.ts` | Update the Google listing and Instagram bio to match |
| What is on tap, a kicked keg | `src/content/drinks.ts` (`onTap`, `kickedAt`, `isNew`, `lastKeg`) | |
| The banner above the header | `src/content/notice.ts` | It takes itself down at `expires` |
| A photo | `public/images` and `src/content/photos.ts` | |
| Address, phone, email, Instagram | `src/content/site.ts` | |
| House rules | `src/content/amenities.ts` | |
| The private-event offer | `src/content/booking.ts` | |
| The story | `src/content/story.ts` | |
| Other places pouring it | `src/content/elsewhere.ts` | |
| A color, a type size, spacing | `design/tokens.json` | `npm run tokens` |
| An answered question | The file the question names, then delete it from `src/content/questions.ts` | |

`npm test` checks the content files for the easy mistakes: two drinks with the same address, more drinks than
taps, a closing time before an opening time, a color text cannot be read on, a photo with no alt text.

## The one design rule

**Color is seltzer.**

Everything practical is black and white: the frame, the hours, the buttons, the status, photos of the place and
the people, and beer, which is shown as six greys from pale to dark. Full flat color is kept for one thing:
seltzer. Every seltzer wears its own color. One that is on tap has a full dot and a solid edge; one that is not
pouring keeps its color and gets an empty ring and a dashed edge.

The rest of the grammar:

- **Fill means yes.** The Open pill, today's row and the one main button on a screen are filled.
- **A solid outline is a fact. A dashed outline is by arrangement or not settled:** private events, a kicked keg,
  anything still to confirm.
- **Dots:** full is yes, half is partly or closing soon, an empty ring is no.
- Square corners, a 2px rule, no shadows, no gradients.
- Three voices from one type family: condensed for signs, wide for a seltzer's name, mono for numbers.
- Sections alternate white (`data-theme="paper"`) and black (`data-theme="ink"`).

The mark is one file, `public/images/logo-mask.png`, inked by CSS in whatever color the text around it is.

## Draft mode and live mode

`NEXT_PUBLIC_INDEXABLE` decides which one you get.

- **Unset (draft):** every page is `noindex`, `robots.txt` blocks crawlers, the sitemap is empty, Confirm tags and
  the briefs for missing photos are visible, and `/confirm` exists.
- **`true` (live):** pages are indexable, the sitemap and structured data are on, Confirm tags and empty photo
  slots disappear, unanswered house rules are hidden, and `/confirm` returns 404.

## Where things are

```
design/tokens.json     colors, type, spacing: the source of truth
scripts/               build-tokens.ts turns the tokens into src/app/tokens.css
src/content/           every word and fact on the site
src/lib/               the logic, each with a test beside it
  status.ts            is the taproom open, worked out in Pacific time
  flavors.ts           the color wheel and which ink goes on which color
  contrast.ts          WCAG contrast, used by the token tests
  tokens.ts            tokens.json to CSS
  seo.ts               page metadata and structured data
src/components/        the pieces: status pill, hours table, tap list, flavor card, photo, age gate
src/app/               the pages
  tokens.css           generated, do not edit
  components.css       the style guide's component styles
  site.css             page layout only
docs/LAUNCH.md         the checklist before going live
```


## V2 development branch: digital taproom
- /explore: searchable beer and hard seltzer release library.
- /order: responsive cans-and-kegs request builder, saved in the browser, with mailto availability inquiries. This is NOT a paid order and has no confirmed inventory or price.
- Proposed delivery thresholds (not approved): **more than 2 kegs** for SLO County (3+); **5+ kegs** for a 150-mile region. Both require Erik's confirmation and legal/geographic validation.
- /updates: promotional SMS preference UI preview only. Signups are disabled pending age verification, carrier/provider approval, and consent tracking.
- Unified keg-status selector excludes kicked kegs. All existing V1 routes remain intact.
- See /confirm and docs/LAUNCH.md. Do not activate commerce or delivery before operations/legal review.
