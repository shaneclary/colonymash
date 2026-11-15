# Before this goes live

Nothing here is done yet. Work down the list; do not set `NEXT_PUBLIC_INDEXABLE=true` until every box is ticked.

## Facts

- [ ] Every question at `/confirm` is answered, its content file is updated, and it is deleted from
      `src/content/questions.ts`. The page should say there is nothing left.
- [ ] Hours in `src/content/hours.ts` match the door, the Google Business listing and the Instagram bio.
- [ ] The tap list in `src/content/drinks.ts` is the real one, and someone owns keeping it current.
      Set `tapList.confirmed` to `true` and `tapList.updated` each time it changes.
- [ ] Each seltzer's color has been checked against the glass.
- [ ] `src/content/story.ts` is the owners' wording, and `draft` is `false`.

## Photos and the mark

- [ ] Every photo in `src/content/photos.ts` with a `src` has `rightsConfirmed: true`.
- [ ] The storefront photo is the brewery's own, or Visit SLO CAL has said yes.
- [ ] The row of seltzers is replaced with the original file. The current one is a crop of a screenshot.
- [ ] The logo is rebuilt from a vector file. The current mask comes from a 447-pixel JPEG.
- [ ] A share image (1200 by 630) is added as `src/app/opengraph-image.png`.

## Decisions

- [ ] Domain: `colonymashbrewing.com` or `colonymash.com` (the can says ColonyMash.com). Set `NEXT_PUBLIC_SITE_URL`.
      Point the other one at it.
- [ ] Age gate: keep it, or set `ageGateEnabled` to `false` in `src/content/site.ts`.
- [ ] Old links: if the old site had pages people linked to, add redirects in `next.config.ts`.

## Switch it on

- [ ] `npm test`, `npm run typecheck` and `npm run build` all pass.
- [ ] Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_INDEXABLE=true` in the host's production environment only.
      Previews stay unset.
- [ ] After deploy: `/robots.txt` allows crawling, `/sitemap.xml` lists the pages, `/confirm` returns 404, and
      no Confirm tags or photo briefs show anywhere.
- [ ] Open it on a phone, outside, in daylight. Check the status against the door.
- [ ] Update the Google Business listing, Instagram bio, Yelp and Untappd to point at the new address.


## V2 commerce and messaging release blockers
- [ ] Erik confirms all cans/kegs eligible for to-go sales, package and keg sizes, deposits, accurate prices, live stock, and keg return policy.
- [ ] Erik confirms **SLO County delivery for more than two kegs (3+)**: exact geographic service area, fees, scheduling, ID handoff and legal authorization.
- [ ] Erik confirms **delivery within 150 miles for five or more kegs**: origin point, road vs radius measurement, pricing, timing, permitting and eligibility.
- [ ] Confirm the actual POS, merchant-of-record, online alcohol sales eligibility, inventory sync, fulfillment state machine, cancellations, refunds and secure payment flow.
- [ ] Confirm legal age verification and identity checks at checkout and handoff. Site click-through age gate is not sufficient for alcohol transactions.
- [ ] Confirm the SMS provider accepts alcohol marketing and that opt-in language, age verification, STOP handling, message logs, privacy and marketing consent are configured.
- [ ] Until all above are satisfied, keep V2 as an **availability-inquiry preview**; never mislabel emailed inquiries as prepaid purchases or offer delivery as confirmed.
