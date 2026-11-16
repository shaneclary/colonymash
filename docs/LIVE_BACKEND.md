# Live backend, phase 1: staff data shared across devices

The demo keeps working exactly as before. This adds a second way in: a staff sign-in that opens the brewery's
own data, stored in a database instead of one browser.

## What it does
- **Staff sign-in** on `/portal` with a personal access key. The first person makes the first key. After that,
  staff add and remove each other under Help.
- **One shared ledger.** Orders, requests, hours, events, recipes, batches, ingredients, stock and accounts load
  from the database and save about a second after each change. Other signed-in devices catch up within 20 seconds.
- **Two people at once.** If two devices change things at the same moment, the second save is refused, that device
  loads the newer data and says so. Nothing is silently overwritten.
- **Public site.** A day changed under Hours & events shows on the public hours table and the open/closed status.
  Listed events show on `/visit`. If the database cannot be reached the site uses its hours file.
- **Calendar feed.** Each staff member gets a private address to subscribe to in Apple or Google Calendar.
- **Orders by hand.** Staff can enter an order taken by phone or text. Merchant logins are phase 2.
- A live ledger starts empty. No sample data is copied in.

## Where the data lives
For now: the `colonymash` schema inside the `slbk-platform` Supabase project. The API cannot reach that schema.
The only way in is eight `public.colonymash_*` functions, each of which checks a staff key or a feed token itself.
No Supabase Auth users are created, so the host project's own users and emails are untouched.

To move it later: copy the one row in `colonymash.ledger` and the rows in `colonymash.staff`, run the same migration
in the new project, and change the two environment values.
To remove it: `drop schema colonymash cascade;` then drop the `public.colonymash_*` functions.

## Turning it on
1. Run `supabase/migrations/20261116_colonymash_staff_ledger.sql` once in the project's SQL editor.
2. Nothing to set: the address and public key are the defaults in `src/content/site.ts`. To use another
   project, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Set the URL to `off` for demo only.
3. Open `/portal`, choose "I am the first", and save the key it shows. Do this straight after step 1.

## What a staff key is, and is not
- It is a long random secret that is the whole sign-in. It is kept on the device until Sign out.
- There is no password reset, no email and no second factor. A lost key is turned off under Help and replaced.
- Anyone holding a key has full staff access. Each person gets their own.
- Proper per-person logins come with a dedicated project, where this site can own the sign-in settings.

## Tested
`src/lib/cloud-sql.test.ts` runs the real migration in an in-process Postgres and calls every function as the
API role: keys, setup once, save and conflict, validation, the public read, the feed token, add and remove staff.
