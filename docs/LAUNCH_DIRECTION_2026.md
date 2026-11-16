# Colony Mash — practical launch direction

**Scope:** Current rotation → cans/kegs inquiries → visit → community. This is the owner-friendly initial offering, not the full V3 experimental product roadmap.

## What the customer gets at launch
1. **What's pouring:** a brewery-verified and dated current list of beer and hard seltzers, with individual product pages. No historic sample drinks labeled as active.
2. **Cans and kegs:** fast per-flavor selection of single cans, six-packs and kegs with clearly verified packaging, prices, deposits and availability. Until verification/POS approval, requests are only emails.
3. **Visit:** address, verified hours, directions, private event inquiry, and practical venue details.
4. **Community:** existing Instagram and the physical taproom first; future opt-in messaging only after owner/provider/legal approvals.
5. **Archive:** past releases remain discoverable on /explore and /seltzer, but are not presented as current inventory.

## Not part of the first launch
- Customer-created or crowdsourced flavors; archived in docs/archive/cabana-lab-2027.md
- Lab competitions, voting or public concept submissions
- Unverified release dates or "drops"
- Account-based points or incentives for consumption
- Any claim that SMS signup or payment processing is functioning when disabled

## Erik's minimal confirmation checklist
1. **What's on tap right now?** Exact beer and seltzer names and ABVs, when last verified, and which employee can update it (ideally via POS or an editable dashboard).
2. **What's available packaged?** By flavor: single cans, 6-packs, keg sizes, quantity/stock, deposits and prices. Draft availability does not imply packaged availability.
3. **How do pickup and delivery work?** Pickup windows, cutoff, ID checks, cancellation/returns; proposed SLO County >2 kegs and 150-mile 5+ keg delivery subject to licensing, boundaries and fees.
4. **What is the business's preferred POS and payment provider?** Confirm whether real paid pickup checkout can be integrated and legal age/ID verification addressed.
5. **What should customers know about visits and community?** Accurate hours, events/private gatherings, house rules, best contact and social accounts.

## Notes on the implementation
- V3 launch preview is at /v3; the old Cabana Lab prototype is preserved in Git history and documented for 2027.
- Home, /on-tap, /seltzer and drink detail pages gate live availability claims behind tapList.confirmed.
- The historical 35-release catalog remains in source; sample onTap booleans are not proof of present stock.
- /community is a practical page with links to Visit, Instagram, private events and future alerts preview. No new signup or calendar was invented.
- SEO remains under the existing NEXT_PUBLIC_INDEXABLE release gate; do not flip it until owner signoff, photos, hours, and product claims are reviewed.

**Success criteria:** A first-time phone visitor can answer "what's pouring?", ask for cans or kegs, plan a visit, and follow the brewery without confronting a flavor-creation program or misleading stock information.

- Once the brewery confirms the active rotation, the order interface defaults to those flavors and allows an explicit switch to the historical archive. Draft availability does not imply packaged stock.


## Order builder refinement: inline formats per flavor
The customer no longer switches a global package-format selector. Every listed flavor exposes independent counters for **single cans**, **6-packs**, and **kegs** at once. On narrow phones, these are three readable rows; wider screens use a compact three-column layout. The list is initially limited to 12 releases with a "show more" action to reduce endless scrolling; searching reveals all matches. Editing quantities updates the same saved cart and email inquiry.
This is still not a representation of real inventory, verified packages or prices. No money is collected, no delivery is scheduled, and the user must send the generated email themselves. Existing old-format ambiguous canned requests are preserved without being converted to singles or six-packs.
