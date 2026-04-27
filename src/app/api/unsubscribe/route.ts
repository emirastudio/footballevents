import { NextResponse } from "next/server";

// RFC 8058 one-click unsubscribe endpoint.
// Gmail/iCloud POST here when the user clicks the native "Unsubscribe" pill;
// browsers GET here when the user clicks the link inside the email body —
// in that case redirect to the human-facing confirmation page.
//
// Note: the actual suppression list is currently a stub. Wire to a `Suppression`
// table or a marketing-prefs flag when subscription emails ship.

export async function POST(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.info("[unsubscribe] one-click POST", { email });
  }
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") ?? "";
  const target = `/en/unsubscribe${email ? `?email=${encodeURIComponent(email)}` : ""}`;
  return NextResponse.redirect(new URL(target, req.url));
}
