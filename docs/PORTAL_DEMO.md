# Colony Mash — Staff Operations & Merchant Portals (DEMO ONLY)

**Review URL:** /portal, with sample credentials visible under the login form.
**Status:** Owner-review concept, with intentionally fictional business records. Do not use as actual brewery software.

## Public sample logins
- **Staff / Erik demo:** erik.demo@colonymash.test / MashDemo2026
- **Merchant / buyer demo:** buyer.demo@coastalpartner.test / TradeDemo2026

These strings are visible to every visitor and must **never** be treated as secure passwords. Browser sessionStorage is used to illustrate role routing. It is not real authorization. When NEXT_PUBLIC_INDEXABLE=true, the portal routes are disabled with 404; they are also excluded from the sitemap, marked noindex and disallowed in production robots.txt.

## Admin demonstration
- Dashboard: incoming trade requests, accepted/scheduled orders, sample packaging deficits and ingredient restock alerts.
- Orders: Requested -> Accepted -> Scheduled -> Fulfilled or Cancelled (controlled transitions). Only Accepted/Scheduled count as committed demand.
- Ingredients: change sample on-hand, incoming, safety stock, reorder points and lead times; projected need and reorder alerts update automatically.
- Production: see fictional bills of materials with batch yields, planned batches, additional batches implied by committed demand and target production dates.
- Packaged inventory: adjust sample cans, 6-pack and keg stock; see committed and unallocated quantities (negative quantity signals a modeled packing deficit).
- Simulated purchase order: "Add simulated PO qty" increments incoming in the browser. It does not contact a supplier.

## Merchant demonstration
- Three recognizable historical Colony Mash releases appear with **fictional sample stock levels**.
- Buyer can request single cans, 6-packs and kegs, specify a desired fulfillment date and notes, and submit a simulated request.
- View order status, copy a previous order into a new cart, and review fictional account settings.
- Requests appear in the admin demo on the *same browser/origin*, where staff can accept/schedule them. This works across accounts on a single browser, not across devices or real users.

## Model & forecast transparency
- Accepted and Scheduled orders create committed demand; Requested does not.
- Illustrative volume conversions: 0.473 L/can, 2.838 L/6-pack and 58.67 L/keg; not confirmed actual formats.
- Extra batches = ceil(max(0, committed volume - finished stock volume equivalent - planned production volume) / fictional recipe yield).
- Ingredient usage = total calculated batches x fictional ingredient amount per batch.
- Projected stock = on-hand + incoming - modeled ingredient usage.
- Suggested reorder = max(0, safety stock - projected stock, reorder point - on-hand - incoming).
- Reorder-by estimate = earliest relevant modeled production date minus supplier lead days.
- Any incoming stock is assumed usable without checking receipt timing; fulfilled orders, live POS sales, shrinkage and other demand are excluded. Finished goods across different package formats are treated as liquid-volume equivalents for batch planning only, not actually interchangeable inventory.

All recipes, ingredient concentrations, supplier names, production outputs, account data, trade orders and inventory figures are **invented demonstration values**, not Erik's actual business data.

## Data storage, limits and security
- Browser localStorage key: cm-simulated-portal-v1. Role sessionStorage key: cm-simulated-role-v1.
- Same browser account switching shares example records. Different browsers and devices do not synchronize. Clearing browser data removes edits.
- No database, API or server writes; no authentication, password hashing, merchant approval, financial processing, inventory reservation, invoices, legal delivery, real email, SMS or POS connection.
- Do not enter actual staff passwords, customer PII, confidential formulas, contracts or sensitive information into the prototype.

## Pre-launch requirements
- Real identity provider, staff MFA, merchant approval, server-side role authorization, scoped tenant permissions and audit logs.
- Production database, safe validation, backups and migration.
- Real product variants and stock, lot traceability, inventory transactions, recipes/yields, actual supplier POs and receiving dates.
- POS sync, invoices, merchant price lists, verified license/permit eligibility, delivery controls, taxes and payment integration.
- User acceptance tests on phones/tablets and with real brewery processes.

## Suggested test
1. Go to /portal and click the button under Erik's sample credentials; sign in.
2. Adjust ingredient on-hand or sample recipe batches and watch the reorder flags change.
3. Switch demo accounts and use the merchant sample login.
4. Create a multi-product trade request for a future date.
5. Switch back to Erik's account, accept the request and then schedule it.
6. Return to the merchant account to see the status change.
7. In admin, use "Reset demo data" to restore sample values when finished.

Review the prototype; do not use these sample logins as real business accounts.


## Merchant inventory and planned orders (expanded demo)
- Merchant-owned CM stock by SKU and package, separate from the brewery's finished goods.
- Manual sell-through, stock counts, receipt events, and an inventory activity ledger.
- Minimum quantity, target/par, estimated weekly usage and lead days; suggested restock quantities and stock-coverage warnings.
- A one-click suggested reorder builder, plus reorder from historical trade requests.
- Future request scheduling: weekly, biweekly, or four-weekly; queue 2–6 dated requests for separate brewery approval. Plans may be paused for future queue extensions or extended by two dates.
- Buyers may cancel or move still-requested dates. Only brewery staff can advance acceptance/fulfillment.
- On fulfillment, a buyer must mark the order as received to increase their own stock; double receiving is blocked.
- Erik's admin demo adds a Merchant Accounts view showing separate partner stock, requested orders and standing series.

**Forecast limitation:** Planned inbound consists of Accepted/Scheduled sample requests with needed-by dates inside the lead-time window, not guaranteed deliveries. Estimated consumption uses weekly usage and lead time, rounded to whole packages; recommended units are calculated against each merchant's target stock. This does not represent a POS-integrated inventory forecast.

**Scheduling limitation:** The demo immediately creates future-dated Requested orders; it does not run an autonomous background scheduler or process recurring payments. Pausing a series affects only additional queued dates, not requests already created. Four weeks is not a true calendar month.

**Security limitation:** Demo inventory belongs to fictional venues and is stored in localStorage. There is no real multi-tenant authorization or merchant-private server data. Production requires secure identity, tenant-enforced database access, verified orders, and physical inventory reconciliation.

**Suggested test:** Merchant → My inventory → record use / change par → build suggested reorder → schedule 4 biweekly requests → Admin → Merchant Accounts / Orders → accept, schedule and fulfill a sample request → Merchant → Order history → Receive into my inventory.


## V2.1 trade UI polish and full archive review
- The merchant's fixed bottom actions are **Order** and **Schedule**; the consumer website's "On tap / Cans & kegs" bar no longer appears on portal routes.
- The trade catalog includes **all 35 historically cataloged brewery releases**, with search and Beer/Seltzer filters. This is an archive, NOT a live wholesale catalog.
- Every package variant has an **illustrative, explicitly unverified** status: "Request availability", "Special order only (demo)", or "Unavailable in [format] (demo)". Unavailable *demo* variants cannot be added in the merchant cart.
- These statuses are SAMPLE configuration for UI review, **not actual brewery packaging or supply claims**; Erik must supply real eligibility, SKUs and availability before merchant sales go live.
- Existing merchant-inventory rows remain manageable by showing tracked products first; users can add any historical product/packaging format from the full collection to their simulated venue inventory.
- All future dates remain requests for review; no automatic processing, checkout, supplier ordering, merchant data security or stock synchronization has been added.


## V3 staff rebuild (replaces the staff sections above where they differ)

The referral bonus is removed. A bonus paid in product to a licensed retailer runs into California's limits on free goods (Business and Professions Code section 25600), so the code, the data and the owner question are gone.

**Staff side**
- **Undo.** Every staff change shows in a bar at the top with an Undo button. It holds the last 25 changes. Typing in one field counts as one change. Orders also have a "Back to ..." button that steps the status back one stage and still works after a reload.
- **Calendar.** A month view of scheduled and wanted orders, brew days, special events, requests, account follow-ups and ingredient buys. Each item has a Google Calendar link and an .ics file for Apple Calendar and Outlook. One button downloads everything upcoming as a single .ics file. The file is a copy, not a live feed.
- **Orders.** Scheduling asks for a day, delivery or pickup, and a time window. A scheduled order's slot can be changed. Buyers see the slot under Track orders and can add it to their own calendar.
- **Requests.** One inbox for private event requests and for sample or staff-demo requests from wholesale accounts. Approve, decline, mark done or reopen, with a reply the requester sees.
- **Hours & events.** Change the taproom hours for one week without touching the usual hours. Add, edit and remove special events.
- **Production.** Recipe profiles are saved under a name with a batch size and ingredient amounts. Adding a batch to the schedule copies a recipe. The batch's size and amounts can then change without touching the recipe, and a changed batch can be saved as a new recipe. Packaging a batch asks for cans, packs and kegs and adds them to stock.
- **Ingredients.** New ingredients can be added. Need is the sum of each scheduled batch's own amounts, plus any extra batches committed orders call for.
- **Packaged stock.** Add cans, packs and kegs for any drink. "Packs" replaces "6-packs" because the pack size is not confirmed.
- **Accounts.** Each wholesale account has a page: contact, address, license, receiving hours, delivery notes, terms, tags, a dated note and contact log, a follow-up date, order history, buyer-reported stock, kegs out and returned, and sample or demo requests. The list puts accounts with a follow-up due or that have gone quiet first. New accounts start as prospects.

**Merchant side**
- **Track orders.** Five dated stages per order, open and closed filters, lookup by order number.
- **Samples & demos.** Ask the brewery for samples or a staff demo and read the reply.
- **Promo kit.** Menu lines (name, style, ABV), the brewery story and cleared photos, each with a copy or download button. Wording comes from the site's own content files, so it stays in step with the public site.

**Limits that still apply**
- Everything is saved in one browser. Staff changes to hours and events do not reach the public site. A second device sees nothing. All of that needs the live backend.
- The calendar file does not update itself. A subscribed feed needs a server.
- Volume math counts a pack as six 16 oz cans and a keg as a half barrel. See the `pack-size` question.
- Sample requests are recorded but no legal limit is enforced. See the `samples` question.
- Saved browser data from earlier versions upgrades in place (ledger version 4). Old referral orders are dropped.

**Suggested test:** Staff → Orders → schedule DEMO-1001 → Undo → schedule again → Calendar → download the file. Production → add a batch → change its size → save it as a recipe → package it → Packaged stock. Accounts → open one → add a note. Merchant → Track orders, Samples & demos, Promo kit.


## V3.1 guided walkthrough

- **Walkthrough.** Both portals open with a step-by-step card on a first visit: 14 steps for staff, 8 for a merchant. Each step opens its screen, scrolls to the part it is about and outlines it. Some steps end with a "Try it" action.
- **Closing it.** The X closes the walkthrough and it stays closed, per browser and per side.
- **Help tab.** Run the walkthrough again, jump to any single step, and read what every screen is for.
- **i buttons.** Each screen has an "About this screen" note under the tabs.
- **Run sheet (staff, Orders).** One day's scheduled deliveries and pickups in working order, with address, receiving hours, delivery notes, contact and a map link. Prints on its own.
- **Reorder my usual (merchant, My inventory).** Loads the cart with the items that repeat across the last six orders at their average quantity, or the latest order when nothing repeats yet.
- **Print a menu list (merchant, Promo kit).** Prints the drink lines currently shown.

All walkthrough and note wording is in `src/content/portal-tour.ts`. To walk Erik through from the start, open Help and tap "Run the walkthrough again", or use a private window.
