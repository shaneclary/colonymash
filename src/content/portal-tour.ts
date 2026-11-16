// The walkthrough and the "i" notes for both portals. All wording for the guided demo lives here.
import type { PortalRole } from "./portal-demo.ts";

export const staffTabs = [
  { id: "overview", label: "Overview" }, { id: "calendar", label: "Calendar" }, { id: "orders", label: "Orders" },
  { id: "requests", label: "Requests" }, { id: "week", label: "Hours & events" }, { id: "production", label: "Production" },
  { id: "ingredients", label: "Ingredients" }, { id: "finished", label: "Packaged stock" }, { id: "accounts", label: "Accounts" },
  { id: "help", label: "Help" },
] as const;
export type StaffView = (typeof staffTabs)[number]["id"];

export const merchantTabs = [
  { id: "inventory", label: "My inventory" }, { id: "catalog", label: "Reorder & catalog" }, { id: "schedule", label: "Future orders" },
  { id: "requests", label: "Track orders" }, { id: "samples", label: "Samples & demos" }, { id: "promo", label: "Promo kit" },
  { id: "activity", label: "Stock activity" }, { id: "account", label: "Account" }, { id: "help", label: "Help" },
] as const;
export type MerchantView = (typeof merchantTabs)[number]["id"];

/** One stop on the walkthrough. `target` names a `data-tour` element to scroll to and outline. */
export type TourStep = { id: string; view: string; target?: string; title: string; body: string; tryIt?: string };

const staffTour: TourStep[] = [
  { id: "start", view: "overview", target: "overview", title: "Start here",
    body: "These four boxes are what needs you today: orders, requests, ingredients and accounts. Tap a box to go straight to it." },
  { id: "orders", view: "orders", target: "orders", title: "Accept, then schedule",
    body: "A new order arrives as Requested. Accept it, then give it a day, delivery or pickup, and a time window.",
    tryIt: "Find DEMO-1001 and tap Schedule." },
  { id: "undo", view: "orders", target: "orders", title: "Nothing is permanent",
    body: "After any change a bar appears at the top with Undo. Orders also have a Back button that steps one stage back, even days later.",
    tryIt: "Tap Undo and watch the order return to Accepted." },
  { id: "run-sheet", view: "orders", target: "run-sheet", title: "The day's run sheet",
    body: "Pick a day to see its deliveries and pickups in order, with the address, receiving hours and a map link. Print it for the van." },
  { id: "calendar", view: "calendar", target: "calendar", title: "Everything with a date",
    body: "Orders, brew days, events, requests, follow-ups and ingredient buys on one month. A solid mark is confirmed. A dashed mark is waiting on an answer.",
    tryIt: "Tap a day with marks." },
  { id: "calendar-send", view: "calendar", target: "calendar-send", title: "Send it to your phone's calendar",
    body: "Each item has a Google Calendar link and a file for Apple Calendar and Outlook. One button downloads everything coming up." },
  { id: "requests", view: "requests", target: "requests", title: "Requests in one inbox",
    body: "Private event requests, and sample or demo requests from wholesale accounts. Approve or decline, and leave a reply they can read.",
    tryIt: "Approve the birthday group." },
  { id: "week", view: "week", target: "week", title: "This week's hours",
    body: "Change any day for one week only. The usual hours stay as they are. Special events are added just below." },
  { id: "production", view: "production", target: "batches", title: "Batches",
    body: "Add a batch from a saved recipe. Then change its size or any ingredient amount. The saved recipe does not change.",
    tryIt: "Change a batch size and watch the amounts scale." },
  { id: "recipes", view: "production", target: "recipes", title: "Recipe profiles",
    body: "Save a recipe under a name with its batch size and amounts. Pull it up later when you add a batch." },
  { id: "stock", view: "finished", target: "stock-add", title: "Packaged stock",
    body: "Add cans, packs and kegs for any drink. Packaging a batch adds stock here too." },
  { id: "ingredients", view: "ingredients", target: "ingredients", title: "What to buy",
    body: "Need comes from the batch schedule. The list flags what to order and by when." },
  { id: "accounts", view: "accounts", target: "accounts", title: "Your accounts",
    body: "Accounts that need a call come first. Open one for the address, notes, order history, their stock and kegs out.",
    tryIt: "Open an account and add a note." },
  { id: "end", view: "help", target: "help", title: "That is the tour",
    body: "Each screen has an i button that explains it. You can run this walkthrough again from here at any time." },
];

const merchantTour: TourStep[] = [
  { id: "start", view: "inventory", target: "inventory", title: "Your shelf, not the brewery's",
    body: "Count what you have, set the level you like to keep, and the page tells you what is running low." },
  { id: "usual", view: "inventory", target: "usual", title: "Reorder in one tap",
    body: "Your usual loads the items you order most into the cart. Suggested reorder fills the cart from your low stock.",
    tryIt: "Tap Reorder my usual." },
  { id: "catalog", view: "catalog", target: "catalog", title: "Build an order",
    body: "Add cans, packs or kegs of any drink, pick the date you want it, and send the request. The brewery confirms it." },
  { id: "schedule", view: "schedule", target: "schedule", title: "Set a rhythm",
    body: "Queue the same order every week, two weeks or four. Each date is its own request, so you can move or cancel one." },
  { id: "track", view: "requests", target: "track", title: "Where every order stands",
    body: "Five stages, each with its date. Once the brewery schedules it you see the day and window, and can add it to your calendar." },
  { id: "samples", view: "samples", target: "samples", title: "Samples and staff demos",
    body: "Ask the brewery for samples to taste or a demo for your staff. Their answer shows here." },
  { id: "promo", view: "promo", target: "promo", title: "Promo kit",
    body: "Menu lines, the brewery's story and cleared photos, ready to copy into your menu, ads and posts. Print a menu list from here too.",
    tryIt: "Tap Copy on any drink." },
  { id: "end", view: "help", target: "help", title: "That is the tour",
    body: "Each screen has an i button that explains it. You can run this walkthrough again from here at any time." },
];

export const tours: Record<PortalRole, TourStep[]> = { admin: staffTour, merchant: merchantTour };

/** The note behind each screen's "i" button. */
export const staffNotes: Record<StaffView, string> = {
  overview: "A count of what needs you right now. Each box is a shortcut. Below are the next seven days and the accounts due a call.",
  calendar: "Every dated thing in one place. Tap a day to see it. The download is a copy for your own calendar and does not update itself.",
  orders: "Orders move Requested, Accepted, Scheduled, Filled, then Received by the buyer. Only accepted and scheduled orders claim stock.",
  requests: "Anything asked of you that is not an order. Approved requests go on the calendar. Keep sample requests here as your record of samples given.",
  week: "Hours you set here apply to that one week. Events can be listed for the public or kept for staff.",
  production: "A recipe is a saved starting point. A batch is one brew on a date, with its own size and amounts. Packaging a batch closes it and adds stock.",
  ingredients: "On hand, plus incoming, minus what the schedule needs. Mark ordered moves the suggested amount into incoming.",
  finished: "Cans, packs and kegs on hand. Committed is claimed by accepted and scheduled orders. Free below zero is a shortfall.",
  accounts: "One page per wholesale account. Gone quiet means an active account has not ordered for longer than its own usual gap.",
  help: "Restart the walkthrough, jump to any step, or read what each screen is for.",
};
export const merchantNotes: Record<MerchantView, string> = {
  inventory: "These are your counts, entered by you. Log what you sell, or type a fresh count. Low stock is anything under your minimum or short of your lead time.",
  catalog: "Every release the brewery has made. A request is not a confirmed order until the brewery accepts it.",
  schedule: "A repeat schedule creates separate dated requests. Pausing it stops new dates and leaves the ones already made.",
  requests: "You can move or cancel an order while it is Requested. After that the brewery moves it. Receive a filled order to add it to your stock.",
  samples: "Ask for samples or a staff demo. The brewery approves or declines and can leave a reply.",
  promo: "Wording and photos the brewery has cleared for you to use. Photos not yet cleared cannot be downloaded.",
  activity: "A dated list of every change to your stock: sales, counts and deliveries received.",
  account: "Your account details as the brewery holds them.",
  help: "Restart the walkthrough, jump to any step, or read what each screen is for.",
};

export const tourCopy = {
  kicker: "Walkthrough",
  tryIt: "Try it:",
  next: "Next", back: "Back", finish: "Finish", close: "Close the walkthrough",
  restart: "Run the walkthrough again",
  closedNote: "The walkthrough is off. Turn it back on here.",
  infoLabel: "About this screen",
  demoNote: "Everything in this portal is sample data saved in this browser. Nothing is sent, charged or delivered.",
} as const;
