// Guards on the content files: the mistakes that are easy to make when editing them by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { flavorWheel } from "../lib/flavors.ts";
import { dayOrder } from "../lib/status.ts";
import { amenities } from "./amenities.ts";
import { booking } from "./booking.ts";
import { allBeers, allSeltzers, drinks, drinksOnTap, findDrink, formatAbv, seltzersPouring } from "./drinks.ts";
import { hoursExceptions, weeklyHours } from "./hours.ts";
import { notice } from "./notice.ts";
import { photoList } from "./photos.ts";
import { questions } from "./questions.ts";
import { nav, routes, site } from "./site.ts";

const questionIds = new Set<string>(questions.map((question) => question.id));
const publicFile = (path: string) => new URL(`../../public${path}`, import.meta.url);

test("every drink has its own web address", () => {
  const slugs = drinks.map((drink) => drink.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, slug);
  assert.equal(findDrink("slo-blue-razz")?.name, "Slo Blue Razz");
  assert.equal(findDrink("no-such-drink"), undefined);
});

test("the tap list never holds more drinks than there are taps", () => {
  assert.ok(drinksOnTap.length <= site.tapCount, `${drinksOnTap.length} drinks on ${site.tapCount} taps`);
});

test("every seltzer has a color from the wheel, or is marked clear", () => {
  const allowed = new Set<string>([...flavorWheel, "clear"]);
  for (const seltzer of allSeltzers) assert.ok(allowed.has(seltzer.flavor), `${seltzer.name}: ${seltzer.flavor}`);
});

test("every beer shade is 1 to 6, and beers are listed light to dark", () => {
  for (const beer of allBeers) {
    if (beer.shade !== undefined) assert.ok(beer.shade >= 1 && beer.shade <= 6, beer.name);
  }
  const shades = allBeers.map((beer) => beer.shade ?? 7);
  assert.deepEqual(shades, [...shades].sort((first, second) => first - second));
});

test("a kicked seltzer is on the list but not pouring", () => {
  for (const seltzer of seltzersPouring) assert.equal(seltzer.kickedAt, undefined);
  for (const drink of drinks) if (drink.kickedAt) assert.ok(drink.onTap, `${drink.name} is kicked but not on the list`);
});

test("ABV always shows one decimal", () => {
  assert.equal(formatAbv(6), "6.0%");
  assert.equal(formatAbv(10.5), "10.5%");
  for (const drink of drinks) assert.ok(drink.abv > 0 && drink.abv < 20, drink.name);
});

test("open days open before they close, in 24-hour HH:MM", () => {
  const days = [...dayOrder.map((day) => weeklyHours[day]), ...hoursExceptions.map((exception) => exception.hours)];
  for (const hours of days) {
    if (hours.kind !== "open") continue;
    assert.match(hours.opens, /^([01]\d|2[0-3]):[0-5]\d$/);
    assert.match(hours.closes, /^([01]\d|2[0-4]):[0-5]\d$/);
    assert.ok(hours.opens < hours.closes, `${hours.opens} to ${hours.closes}`);
  }
});

test("hours exceptions are dated YYYY-MM-DD and say why", () => {
  for (const exception of hoursExceptions) {
    assert.match(exception.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(exception.reason.trim().length > 0, exception.date);
  }
});

test("every Confirm tag points at a question that exists", () => {
  for (const amenity of amenities) if (amenity.question) assert.ok(questionIds.has(amenity.question), amenity.term);
  for (const fact of booking.facts) if (fact.question) assert.ok(questionIds.has(fact.question), fact.label);
  assert.equal(questionIds.size, questions.length, "two questions share an id");
});

test("an amenity with no answer yet is tied to a question", () => {
  for (const amenity of amenities) {
    if (amenity.kind === "unknown") assert.ok(amenity.question, `${amenity.term} has no answer and no question`);
    else assert.ok(amenity.answer && amenity.detail, `${amenity.term} needs an answer and a sentence`);
  }
});

test("a photo that is in place has its file, its size, alt text and a credit", () => {
  for (const photo of photoList) {
    if (!photo.src) continue;
    assert.ok(existsSync(publicFile(photo.src)), `${photo.src} is not in public/`);
    assert.ok(photo.width && photo.height, `${photo.src} needs width and height`);
    assert.ok(photo.alt && photo.alt.length > 20, `${photo.src} needs alt text`);
    assert.ok(photo.credit, `${photo.src} needs a credit`);
  }
  const ids = photoList.map((photo) => photo.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("a notice always has an expiry", () => {
  if (notice) assert.ok(!Number.isNaN(Date.parse(notice.expires)), "notice.expires is not a date");
});

test("header links go to real routes and the site address has no trailing slash", () => {
  const known = new Set<string>(Object.values(routes));
  for (const link of nav) assert.ok(known.has(link.href), link.href);
  assert.doesNotMatch(site.url, /\/$/);
});
