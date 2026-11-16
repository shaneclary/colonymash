// A private calendar feed: /api/calendar/<token>. Calendar apps subscribe to it and re-read it on
// their own schedule. The token belongs to one staff member and reads dates only.
import { live } from "@/content/site";
import { schedule } from "@/content/hours";
import { emptyLedger } from "@/lib/cloud-ledger";
import { callRpc } from "@/lib/live-rpc";
import { upgradeDemoLedger } from "@/lib/merchant-operations";
import { calendarEntries, toIcs } from "@/lib/staff-calendar";
import { localMoment } from "@/lib/status";

export const dynamic = "force-dynamic";
const plain = (text: string, status: number) => new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const token = (await context.params).token.replace(/\.ics$/i, "");
  if (!live) return plain("The live calendar is not connected on this site.", 503);
  if (!/^[0-9a-f]{32,128}$/.test(token)) return plain("Not found.", 404);
  let data: unknown;
  try { data = await callRpc<unknown>(live, "calendar", { p_token: token }); }
  catch (error) { return plain("The calendar could not be read just now. " + (error instanceof Error ? error.message : ""), 502); }
  const ledger = data ? upgradeDemoLedger(data, emptyLedger()) : null;
  if (!ledger) return plain("Not found.", 404);
  const now = new Date();
  const entries = calendarEntries(ledger, localMoment(now, schedule.timeZone).isoDate);
  const stamp = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  return new Response(toIcs(entries, stamp), { headers: {
    "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'inline; filename="colony-mash.ics"',
    "Cache-Control": "private, max-age=300", "X-Robots-Tag": "noindex",
  } });
}
