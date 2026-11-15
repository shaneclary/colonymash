// Other places pouring Colony Mash. A short list kept by hand and dated.
// The section stays off the site while this list is empty. Re-check it monthly and update the date.

export type Account = {
  name: string;
  town: string;
  /** "Bar", "Beer garden", "Restaurant", "Bottle shop". */
  type: string;
  phone?: { display: string; href: string };
  directionsUrl?: string;
  /** What they took: "Postconventional Pilsner, hard seltzer". */
  pouring: string;
};

export const elsewhere = {
  /** "YYYY-MM-DD", the day someone at the brewery last checked this list. */
  updated: null as string | null,
  accounts: [] as Account[],
};
