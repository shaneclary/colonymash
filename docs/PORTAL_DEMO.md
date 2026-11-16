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
