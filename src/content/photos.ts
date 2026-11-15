// The shots the site is built around. Each slot shows its brief until a real photo is in place.
// To fill a slot: put the file in public/images (named kind-subject-01.jpg), then set `src`,
// `width`, `height`, `alt` and `credit`. Only the brewery's own photos, or ones it has permission for.

export type PhotoSlot = {
  /** Shot number from the style guide's Image collection. */
  id: string;
  title: string;
  brief: string;
  /** Place, people and beer are black and white. Seltzer is color. */
  treatment: "bw" | "color";
  shape: "wide" | "portrait" | "square" | "strip";
  src?: string;
  width?: number;
  height?: number;
  alt?: string;
  /** Where the file came from. */
  credit?: string;
  /** False until the brewery confirms it owns the photo or has permission. Listed at /confirm. */
  rightsConfirmed?: boolean;
  /** What is wrong with the current file, if anything: too small, a screenshot, needs a reshoot. */
  note?: string;
};

export const photos = {
  bar: { id: "01", title: "The room", brief: "The long bar from the front door, people along it.", treatment: "bw", shape: "wide" },
  building: {
    id: "02", title: "The door", brief: "The building from El Camino Real, door visible.", treatment: "bw", shape: "wide",
    src: "/images/place-storefront-01.jpg", width: 1200, height: 675,
    alt: "The front of Colony Mash: glass doors with two bearded-skull decals under a metal awning, the number 3164 above, and a long wooden bar table outside.",
    credit: "Supplied by Shane, Nov 15, 2026. The same photo appears on Visit SLO CAL's listing.",
    rightsConfirmed: false,
  },
  tapWall: { id: "03", title: "The taps", brief: "The tap wall, straight on.", treatment: "bw", shape: "wide" },
  outside: { id: "04", title: "Outside", brief: "The outdoor seats.", treatment: "bw", shape: "wide" },
  owners: { id: "05", title: "The owners", brief: "Erik and Ethan at work, not posed.", treatment: "bw", shape: "portrait" },
  erik: {
    id: "18", title: "Erik", brief: "Erik in the brewhouse.", treatment: "bw", shape: "portrait",
    src: "/images/people-erik-01.jpg", width: 399, height: 501,
    alt: "Erik Knapp in the brewhouse, in a Colony Mash cap and T-shirt, giving a shaka sign in front of the steel tanks.",
    credit: "Erik's own selfie. Supplied by Shane, who said it is fine to use, Nov 15, 2026.",
    rightsConfirmed: true,
    note: "399 pixels wide. Fine at half a column, too small for anything larger.",
  },
  kettle: { id: "06", title: "The hands", brief: "Grain going into the kettle, hands only.", treatment: "bw", shape: "portrait" },
  tanks: { id: "07", title: "The tanks", brief: "The tanks.", treatment: "bw", shape: "portrait" },
  fullRoom: { id: "08", title: "An open night", brief: "A full room, backs and elbows.", treatment: "bw", shape: "wide" },
  pour: { id: "09", title: "The pour", brief: "Hand, tap and glass.", treatment: "bw", shape: "square" },
  beerGlass: { id: "10", title: "The beer", brief: "This beer in its glass. Same angle and light as the others.", treatment: "bw", shape: "square" },
  seltzerGlass: { id: "11", title: "The pour", brief: "This seltzer in the glass, on a flat ground of its own color.", treatment: "color", shape: "square" },
  flight: {
    id: "12", title: "The flight", brief: "Seltzers in a row, straight on.", treatment: "color", shape: "strip",
    src: "/images/seltzer-flight-01.jpg", width: 1320, height: 560,
    alt: "Seven glasses of Colony Mash hard seltzer in a row outside, each a different color: two cloudy pale ones, then yellow, orange, two reds and a deep berry.",
    credit: "Supplied by Shane, Nov 15, 2026. From the brewery's Facebook page, by way of a search-result screenshot.",
    rightsConfirmed: false,
    note: "Cropped from a screenshot and soft. Replace with the original file.",
  },
  cans: { id: "13", title: "The cans", brief: "The seltzer cans.", treatment: "color", shape: "square" },
  privateRoom: { id: "14", title: "Your night", brief: "The room set for a private group.", treatment: "bw", shape: "wide" },
  coffee: { id: "15", title: "Next door", brief: "Joebella beans beside a Baltic Pourover.", treatment: "bw", shape: "square" },
  build: { id: "16", title: "The build", brief: "Anything from the build, 2019 to 2020.", treatment: "bw", shape: "wide" },
  pilsnerCans: {
    id: "17", title: "Postconventional Pilsner", brief: "The Pilsner cans beside a pour.", treatment: "bw", shape: "wide",
    src: "/images/beer-postconventional-cans-01.webp", width: 597, height: 408,
    alt: "Three cans of Postconventional German Pilsner with black-and-white marbled labels, next to a full cup of the beer on a wooden table.",
    credit: "Supplied by Shane, Nov 15, 2026.",
    rightsConfirmed: false,
    note: "597 pixels wide. Fine for a card, too small for a full-width photo.",
  },
} satisfies Record<string, PhotoSlot>;

export const photoList: PhotoSlot[] = Object.values(photos);
