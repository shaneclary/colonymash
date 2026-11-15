// What the owners still need to confirm. Shown at /confirm (never indexed) and linked from
// every dashed "Confirm" tag while the site is in review mode. When an answer comes in:
// update the content file it affects, then delete the question here.

export type Question = {
  id: string;
  ask: string;
  /** What the site currently assumes, and where that came from. */
  assumed: string;
  /** Which file to change when the answer comes in. */
  file: string;
};

export const questions = [
  {
    id: "hours",
    ask: "Are these the real hours: Thursday and Friday 4 to 8 PM, Sunday 3 to 7 PM, Saturday private events only, closed Monday to Wednesday?",
    assumed: "The Instagram bio and Yelp, which agreed in November 2026, and the handwritten sign on the door in an undated photo. The old site, Visit Atascadero and two directories each show something different.",
    file: "src/content/hours.ts",
  },
  {
    id: "taps",
    ask: "What is on the twelve taps right now, and how do you want to keep the list current: a tap-list tool, the POS, or a shared sheet?",
    assumed: "Twelve sample drinks picked from your public TapHunter listing. They are real drinks but not today's list.",
    file: "src/content/drinks.ts",
  },
  {
    id: "seltzer-line",
    ask: "Is \"Colony Cabana\" the name of the seltzer line, and should the site use it?",
    assumed: "Untappd lists the seltzers under that name. The site uses it as a heading only.",
    file: "src/content/drinks.ts",
  },
  {
    id: "process",
    ask: "Are the seltzers still fermented on fruit with no back-sweetening?",
    assumed: "A 2020 New Times article described them that way. ABVs now run from 6.0% to 8.5%.",
    file: "src/content/drinks.ts",
  },
  {
    id: "flavors",
    ask: "Which color is each seltzer in the glass? A photo of each pour, with its name, settles this.",
    assumed: "Red, orange, yellow, berry, coral, purple and the pale uncolored pour were tuned to your photos. Which seltzer gets which color is still a guess from its name. Beer shades were set from each beer's style.",
    file: "src/content/drinks.ts and design/tokens.json",
  },
  {
    id: "house-rules",
    ask: "Dogs, kids, outside food: yes, no, or with conditions? Is there a kitchen or a food partner?",
    assumed: "Nothing. These rows are blank on the Visit page.",
    file: "src/content/amenities.ts",
  },
  {
    id: "restroom",
    ask: "Is the restroom step-free, as well as the parking and entrance?",
    assumed: "A directory listing says the parking and entrance are wheelchair accessible. Nothing about the restroom.",
    file: "src/content/amenities.ts",
  },
  {
    id: "private-events",
    ask: "Private events: is Saturday always private? Group size, what is included, cost, lead time, and the best way to reach you?",
    assumed: "The Instagram bio says Saturdays are private events, booked by message.",
    file: "src/content/booking.ts",
  },
  {
    id: "to-go",
    ask: "Do you sell cans or growlers to go? Do you want prices by the glass on the site?",
    assumed: "Photos show Postconventional Pilsner in 16 oz cans and seltzer in purple cans, with no dates. The site shows no prices and no to-go until you say what is for sale now.",
    file: "src/content/drinks.ts",
  },
  {
    id: "accounts",
    ask: "Who else is pouring Colony Mash right now?",
    assumed: "Nothing is shown. A public tap listing had Ancient Owl Beer Garden in San Luis Obispo.",
    file: "src/content/elsewhere.ts",
  },
  {
    id: "story",
    ask: "Is the story page right, and would you rather it be in your own words?",
    assumed: "A short draft written from public facts: how you met, the build, the 2020 opening.",
    file: "src/content/story.ts",
  },
  {
    id: "brand-files",
    ask: "Can you send the logo as a vector file (SVG, AI or PDF), and the can and label art?",
    assumed: "The skull mark is in place, made from a 447-pixel JPEG. It is soft at large sizes. The site's own typefaces are stand-ins that sit beside the mark and do not copy its lettering.",
    file: "public/images/logo-mask.png and src/app/icon.png",
  },
  {
    id: "contact",
    ask: "Which phone, email and domain should the site use? Does someone answer the phone during open hours?",
    assumed: "(805) 460-7225, colonymashbrewing@gmail.com and colonymashbrewing.com, from public listings. The Pilsner can says ColonyMash.com.",
    file: "src/content/site.ts",
  },
  {
    id: "photos",
    ask: "Are the photos on the site yours to use, and can you send the original files?",
    assumed: "Four photos are in place from files Shane supplied. Erik's selfie is cleared. The storefront photo also appears on Visit SLO CAL's listing, and the row of seltzers is a soft crop of a screenshot.",
    file: "src/content/photos.ts",
  },
] as const satisfies readonly Question[];

export type QuestionId = (typeof questions)[number]["id"];
